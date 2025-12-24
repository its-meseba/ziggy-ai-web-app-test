'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AppConfig } from '@/config';
import { ConnectionStatus, ServerMessage } from '@/types';

interface UseWebSocketOptions {
    config: AppConfig;
    onMessage?: (message: ServerMessage) => void;
    onBinaryMessage?: (data: ArrayBuffer) => void;
}

export function useWebSocket({ config, onMessage, onBinaryMessage }: UseWebSocketOptions) {
    const [status, setStatus] = useState<ConnectionStatus>('disconnected');
    const wsRef = useRef<WebSocket | null>(null);

    const buildUrl = useCallback(() => {
        const baseUrl = config.serverUrl;
        const params = new URLSearchParams({
            appIdentifier: config.appIdentifier,
            version: config.version,
            language: config.language,
            userId: config.userId,
            serializer: config.serializerType,
        });
        return `${baseUrl}?${params.toString()}`;
    }, [config]);

    const handleMessage = useCallback((event: MessageEvent) => {
        if (event.data instanceof ArrayBuffer) {
            // Binary data
            onBinaryMessage?.(event.data);
        } else if (typeof event.data === 'string') {
            // Text frame - always JSON
            try {
                const data = JSON.parse(event.data) as ServerMessage;
                onMessage?.(data);
            } catch (e) {
                console.log('Non-JSON message:', event.data);
            }
        }
    }, [onMessage, onBinaryMessage]);

    const connect = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            return;
        }

        const url = buildUrl();
        setStatus('connecting');
        console.log('Connecting to:', url);

        const ws = new WebSocket(url);
        ws.binaryType = 'arraybuffer';

        ws.onopen = () => {
            setStatus('connected');
        };

        ws.onmessage = handleMessage;

        ws.onclose = () => {
            setStatus('disconnected');
            wsRef.current = null;
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            setStatus('error');
        };

        wsRef.current = ws;
    }, [buildUrl, handleMessage]);

    const disconnect = useCallback(() => {
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
        setStatus('disconnected');
    }, []);

    const send = useCallback((data: string | ArrayBuffer) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(data);
        }
    }, []);

    const sendJson = useCallback((data: object) => {
        send(JSON.stringify(data));
    }, [send]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            disconnect();
        };
    }, [disconnect]);

    return {
        status,
        connect,
        disconnect,
        send,
        sendJson,
        isConnected: status === 'connected',
    };
}
