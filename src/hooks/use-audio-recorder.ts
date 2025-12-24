'use client';

import { useCallback, useRef, useState } from 'react';

interface UseAudioRecorderOptions {
    sampleRate?: number;
    onAudioData?: (data: ArrayBuffer) => void;
}

export function useAudioRecorder({ sampleRate = 16000, onAudioData }: UseAudioRecorderOptions) {
    const [isRecording, setIsRecording] = useState(false);
    const audioContextRef = useRef<AudioContext | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true,
                },
            });

            streamRef.current = stream;
            audioContextRef.current = new AudioContext({ sampleRate });
            sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
            processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);

            processorRef.current.onaudioprocess = (e) => {
                if (!onAudioData) return;

                const inputData = e.inputBuffer.getChannelData(0);
                const pcmData = new Int16Array(inputData.length);

                for (let i = 0; i < inputData.length; i++) {
                    pcmData[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768));
                }

                // Build packet with 9-byte header: [type:1][sample_rate:4][length:4][audio]
                const FRAME_TYPE_AUDIO = 0x01;
                const audioBytes = new Uint8Array(pcmData.buffer);
                const packetLength = 9 + audioBytes.byteLength;

                const packet = new ArrayBuffer(packetLength);
                const view = new DataView(packet);

                // Header
                view.setUint8(0, FRAME_TYPE_AUDIO);
                view.setUint32(1, sampleRate, true); // Little-endian
                view.setUint32(5, audioBytes.byteLength, true); // Little-endian

                // Audio data
                new Uint8Array(packet, 9).set(audioBytes);

                onAudioData(packet);
            };

            sourceRef.current.connect(processorRef.current);
            processorRef.current.connect(audioContextRef.current.destination);

            setIsRecording(true);
        } catch (error) {
            console.error('Microphone access denied:', error);
            throw error;
        }
    }, [sampleRate, onAudioData]);

    const stopRecording = useCallback(() => {
        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current = null;
        }
        if (sourceRef.current) {
            sourceRef.current.disconnect();
            sourceRef.current = null;
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setIsRecording(false);
    }, []);

    const toggleRecording = useCallback(async () => {
        if (isRecording) {
            stopRecording();
        } else {
            await startRecording();
        }
    }, [isRecording, startRecording, stopRecording]);

    return {
        isRecording,
        startRecording,
        stopRecording,
        toggleRecording,
    };
}
