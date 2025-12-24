'use client';

import { useCallback, useRef, useState } from 'react';
import { AudioBufferState } from '@/types';

interface UseAudioBufferOptions {
    bufferMs: number;
    outputSampleRate?: number;
}

export function useAudioBuffer({ bufferMs, outputSampleRate = 24000 }: UseAudioBufferOptions) {
    const [bufferState, setBufferState] = useState<AudioBufferState>({
        status: 'ready',
        fillPercent: 0,
    });

    const audioContextRef = useRef<AudioContext | null>(null);
    const playbackQueueRef = useRef<Array<{ samples: Float32Array; sampleRate: number; duration: number }>>([]);
    const nextPlaybackTimeRef = useRef(0);
    const bufferedDurationRef = useRef(0);
    const bufferStartedRef = useRef(false);

    const getAudioContext = useCallback(() => {
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
            audioContextRef.current = new AudioContext({ sampleRate: outputSampleRate });
        }
        return audioContextRef.current;
    }, [outputSampleRate]);

    const updateBufferUI = useCallback((fillPercent: number, status: AudioBufferState['status']) => {
        setBufferState({ fillPercent: Math.min(100, fillPercent), status });
    }, []);

    const scheduleChunk = useCallback(() => {
        const queue = playbackQueueRef.current;
        if (queue.length === 0) return;

        const audioContext = getAudioContext();
        const chunk = queue.shift()!;
        bufferedDurationRef.current -= chunk.duration;

        // Create audio buffer
        const audioBuffer = audioContext.createBuffer(1, chunk.samples.length, chunk.sampleRate);
        audioBuffer.getChannelData(0).set(chunk.samples);

        // Create and connect source
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);

        // Schedule playback
        const playTime = Math.max(nextPlaybackTimeRef.current, audioContext.currentTime);
        source.start(playTime);
        nextPlaybackTimeRef.current = playTime + chunk.duration;

        // Update UI
        const bufferPercent = (bufferedDurationRef.current / (bufferMs / 1000)) * 100;
        updateBufferUI(bufferPercent, queue.length > 0 ? 'playing' : 'playing');

        // Handle end of playback
        source.onended = () => {
            if (playbackQueueRef.current.length === 0 && bufferedDurationRef.current <= 0) {
                setTimeout(() => {
                    if (playbackQueueRef.current.length === 0) {
                        bufferStartedRef.current = false;
                        updateBufferUI(0, 'ready');
                    }
                }, 100);
            }
        };
    }, [bufferMs, getAudioContext, updateBufferUI]);

    const startBufferedPlayback = useCallback(() => {
        if (playbackQueueRef.current.length === 0) {
            bufferStartedRef.current = false;
            updateBufferUI(0, 'ready');
            return;
        }

        const audioContext = getAudioContext();
        nextPlaybackTimeRef.current = audioContext.currentTime + 0.05;

        // Schedule all buffered chunks
        while (playbackQueueRef.current.length > 0) {
            scheduleChunk();
        }
    }, [getAudioContext, scheduleChunk, updateBufferUI]);

    const queueAudioChunk = useCallback(async (float32Array: Float32Array, sampleRate: number) => {
        const audioContext = getAudioContext();

        // Resume audio context if suspended (browser autoplay policy)
        if (audioContext.state === 'suspended') {
            await audioContext.resume();
        }

        // Calculate duration of this chunk
        const chunkDuration = float32Array.length / sampleRate;

        // Add to queue
        playbackQueueRef.current.push({
            samples: float32Array,
            sampleRate,
            duration: chunkDuration,
        });

        bufferedDurationRef.current += chunkDuration;

        // Update UI
        const bufferPercent = (bufferedDurationRef.current / (bufferMs / 1000)) * 100;
        updateBufferUI(bufferPercent, 'buffering');

        // Start playback once we have enough buffer
        if (!bufferStartedRef.current && bufferedDurationRef.current >= bufferMs / 1000) {
            bufferStartedRef.current = true;
            updateBufferUI(100, 'playing');
            startBufferedPlayback();
        } else if (bufferStartedRef.current) {
            // Already playing, schedule this chunk
            scheduleChunk();
        }
    }, [bufferMs, getAudioContext, scheduleChunk, startBufferedPlayback, updateBufferUI]);

    const processRawAudio = useCallback(async (pcmData: Uint8Array, sampleRate: number) => {
        // Copy to aligned buffer first (fixes odd byte offset from 9-byte header)
        const alignedBuffer = new ArrayBuffer(pcmData.byteLength);
        new Uint8Array(alignedBuffer).set(pcmData);

        // Convert PCM16 bytes to Float32 for Web Audio API
        const int16Array = new Int16Array(alignedBuffer);
        const float32Array = new Float32Array(int16Array.length);

        for (let i = 0; i < int16Array.length; i++) {
            float32Array[i] = int16Array[i] / 32768.0;
        }

        await queueAudioChunk(float32Array, sampleRate);
    }, [queueAudioChunk]);

    const reset = useCallback(() => {
        playbackQueueRef.current = [];
        bufferedDurationRef.current = 0;
        bufferStartedRef.current = false;
        nextPlaybackTimeRef.current = 0;
        updateBufferUI(0, 'ready');
    }, [updateBufferUI]);

    const cleanup = useCallback(() => {
        reset();
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
    }, [reset]);

    return {
        bufferState,
        processRawAudio,
        reset,
        cleanup,
    };
}
