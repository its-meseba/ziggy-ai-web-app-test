'use client';

import { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChatMessage } from '@/types';

interface ChatPanelProps {
    messages: ChatMessage[];
}

export function ChatPanel({ messages }: ChatPanelProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll on new messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    return (
        <Card className="border-border/50">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                    💬 Conversation
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div ref={scrollRef} className="max-h-96 space-y-3 overflow-y-auto">
                    {messages.length === 0 ? (
                        <p className="text-center text-sm text-muted-foreground">
                            No messages yet. Connect and start speaking.
                        </p>
                    ) : (
                        messages.map((message) => (
                            <MessageBubble key={message.id} message={message} />
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

interface MessageBubbleProps {
    message: ChatMessage;
}

function MessageBubble({ message }: MessageBubbleProps) {
    const isUser = message.type === 'user';
    const isSystem = message.type === 'system';

    if (isSystem) {
        return (
            <div className="flex justify-center">
                <div className="rounded-lg bg-yellow-500/10 px-4 py-2 text-center text-sm text-yellow-600 dark:text-yellow-400">
                    {message.text}
                </div>
            </div>
        );
    }

    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div
                className={`max-w-[80%] rounded-xl px-4 py-3 ${isUser
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
            >
                {message.label && (
                    <p className="mb-1 text-xs opacity-70">{message.label}</p>
                )}
                <p className="text-sm">{message.text}</p>
                {message.emotion && (
                    <Badge variant="secondary" className="mt-2 text-xs">
                        ✨ {message.emotion}
                    </Badge>
                )}
            </div>
        </div>
    );
}
