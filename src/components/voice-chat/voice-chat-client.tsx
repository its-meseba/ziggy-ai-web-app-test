'use client';

import { useCallback, useState, useEffect } from 'react';
import { AppConfig, defaultConfig, getServerUrl } from '@/config';
import { ChatMessage, ServerMessage } from '@/types';
import { useWebSocket, useAudioBuffer, useAudioRecorder } from '@/hooks';
import {
    ConnectionPanel,
    MicrophoneButton,
    ChatPanel,
    TestControls,
} from '@/components/voice-chat';

export function VoiceChatClient() {
    // Configuration state
    const [config, setConfig] = useState<AppConfig>(defaultConfig);
    const [messages, setMessages] = useState<ChatMessage[]>([]);

    // Set initial server URL based on page protocol (client-side only)
    useEffect(() => {
        setConfig(prev => ({
            ...prev,
            serverUrl: getServerUrl('local')
        }));
    }, []);

    // Update config
    const handleConfigChange = useCallback((updates: Partial<AppConfig>) => {
        setConfig((prev) => ({ ...prev, ...updates }));
    }, []);

    // Add message helper
    const addMessage = useCallback((text: string, type: ChatMessage['type'], label?: string) => {
        const message: ChatMessage = {
            id: crypto.randomUUID(),
            type,
            text,
            label,
            timestamp: new Date(),
        };
        setMessages((prev) => [...prev, message]);
    }, []);

    // Audio buffer hook
    const { bufferState, processRawAudio, reset: resetBuffer } = useAudioBuffer({
        bufferMs: config.audioBufferMs,
    });

    // Handle binary messages (audio)
    const handleBinaryMessage = useCallback(
        async (data: ArrayBuffer) => {
            const view = new DataView(data);
            const firstByte = view.getUint8(0);

            if (config.serializerType === 'raw') {
                // Raw with header: [type:1][sample_rate:4][length:4][data:N]
                const type = firstByte;

                if (type === 0x01) {
                    // Audio
                    const sampleRate = view.getUint32(1, true);
                    const length = view.getUint32(5, true);
                    const audioData = new Uint8Array(data, 9, length);
                    await processRawAudio(audioData, sampleRate);
                } else if (type === 0x03) {
                    // JSON
                    const length = view.getUint32(1, true);
                    const jsonBytes = new Uint8Array(data, 5, length);
                    const jsonStr = new TextDecoder().decode(jsonBytes);
                    handleServerMessage(JSON.parse(jsonStr));
                }
            } else if (config.serializerType === 'raw_no_header') {
                if (firstByte === 0x7b) {
                    // '{'
                    const jsonStr = new TextDecoder().decode(data);
                    handleServerMessage(JSON.parse(jsonStr));
                } else {
                    await processRawAudio(new Uint8Array(data), 24000);
                }
            }
        },
        [config.serializerType, processRawAudio]
    );

    // Handle server messages
    const handleServerMessage = useCallback(
        (data: ServerMessage) => {
            console.log('Received:', data);

            // Unwrap Envelope if present
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const payload: Record<string, unknown> = ('payload' in data && data.payload)
                ? (data.payload as unknown as Record<string, unknown>)
                : (data as unknown as Record<string, unknown>);

            switch (data.type) {
                case 'transcription':
                    addMessage((data as { text: string }).text, 'user', 'You said');
                    break;
                case 'llm_response':
                case 'assistant_response':
                    addMessage((data as { text: string }).text, 'assistant', 'Ziggy');
                    break;
                case 'rive_trigger': {
                    const trigger =
                        (payload as { state?: string; trigger?: string }).state ||
                        (payload as { state?: string; trigger?: string }).trigger;
                    if (trigger) {
                        // Update last assistant message with emotion
                        setMessages((prev) => {
                            const updated = [...prev];
                            for (let i = updated.length - 1; i >= 0; i--) {
                                if (updated[i].type === 'assistant') {
                                    updated[i] = { ...updated[i], emotion: trigger };
                                    break;
                                }
                            }
                            return updated;
                        });
                    }
                    break;
                }
                case 'notification':
                    addMessage(
                        `📌 ${(payload as { notificationType?: string }).notificationType}: ${JSON.stringify(
                            (payload as { data?: unknown }).data
                        )}`,
                        'system'
                    );
                    break;
                case 'agent_switched':
                    addMessage(`🔄 Switched to: ${(data as { agent_id: string }).agent_id}`, 'system');
                    break;
            }
        },
        [addMessage]
    );

    // WebSocket hook
    const { status, connect, disconnect, send, sendJson, isConnected } = useWebSocket({
        config,
        onMessage: handleServerMessage,
        onBinaryMessage: handleBinaryMessage,
    });

    // Audio recorder hook
    const { isRecording, toggleRecording } = useAudioRecorder({
        sampleRate: config.sampleRate,
        onAudioData: (data) => {
            if (isConnected) {
                send(data);
            }
        },
    });

    // Connection handlers
    const handleConnect = useCallback(() => {
        connect();
        addMessage(`Connected to Ziggy AI (${config.serializerType})`, 'system');
    }, [connect, addMessage, config.serializerType]);

    const handleDisconnect = useCallback(() => {
        disconnect();
        resetBuffer();
        addMessage('Disconnected', 'system');
    }, [disconnect, resetBuffer, addMessage]);

    // Test handlers
    const handleSendGameContext = useCallback(
        (gameId: string) => {
            sendJson({ type: 'game_context', game_id: gameId });
            addMessage(`Sent Game Context: ${gameId}`, 'system');
        },
        [sendJson, addMessage]
    );

    const handleSendTestEnvelope = useCallback(() => {
        sendJson({
            type: 'text',
            meta: {
                timestamp: Date.now() / 1000,
                request_id: crypto.randomUUID(),
                version: '1.0',
            },
            payload: {
                'user-message': 'Hello from Standard Envelope!',
                'agent-id': 'default',
            },
        });
        addMessage('Sent Standard Envelope', 'system');
    }, [sendJson, addMessage]);

    const handleSendUnsafeTrigger = useCallback(() => {
        sendJson({
            type: 'text',
            'user-message': 'I want to talk about war and violence',
            'agent-id': 'default',
        });
        addMessage('Sent Unsafe Trigger', 'system');
    }, [sendJson, addMessage]);

    return (
        <div className="mx-auto max-w-3xl space-y-6 p-6">
            {/* Header */}
            <header className="text-center">
                <h1 className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-4xl font-bold tracking-tight text-transparent">
                    Ziggy AI
                </h1>
                <p className="mt-2 text-muted-foreground">Voice-powered AI companion</p>
            </header>

            {/* Connection Panel */}
            <ConnectionPanel
                config={config}
                onConfigChange={handleConfigChange}
                status={status}
                onConnect={handleConnect}
                onDisconnect={handleDisconnect}
                bufferState={bufferState}
            />

            {/* Microphone Section */}
            <MicrophoneButton
                isRecording={isRecording}
                disabled={!isConnected}
                onClick={toggleRecording}
            />

            {/* Test Controls */}
            <TestControls
                onSendGameContext={handleSendGameContext}
                onSendTestEnvelope={handleSendTestEnvelope}
                onSendUnsafeTrigger={handleSendUnsafeTrigger}
                disabled={!isConnected}
            />

            {/* Chat Panel */}
            <ChatPanel messages={messages} />
        </div>
    );
}
