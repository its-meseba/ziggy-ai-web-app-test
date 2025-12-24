'use client';

import { Button } from '@/components/ui/button';
import { Mic, MicOff } from 'lucide-react';

interface MicrophoneButtonProps {
    isRecording: boolean;
    disabled: boolean;
    onClick: () => void;
}

export function MicrophoneButton({ isRecording, disabled, onClick }: MicrophoneButtonProps) {
    return (
        <div className="flex flex-col items-center gap-4 py-8">
            <Button
                variant="outline"
                size="icon"
                className={`h-24 w-24 rounded-full border-2 transition-all duration-300 ${isRecording
                        ? 'animate-pulse border-red-500 bg-red-500/10 text-red-500 hover:bg-red-500/20'
                        : 'border-primary/50 hover:border-primary hover:bg-primary/10'
                    }`}
                onClick={onClick}
                disabled={disabled}
            >
                {isRecording ? <MicOff className="h-10 w-10" /> : <Mic className="h-10 w-10" />}
            </Button>
            <p className="text-sm text-muted-foreground">
                {disabled ? 'Connect to start' : isRecording ? 'Listening...' : 'Click to speak'}
            </p>

            {/* Audio Visualizer */}
            {isRecording && (
                <div className="flex h-12 items-center justify-center gap-1">
                    {[...Array(8)].map((_, i) => (
                        <div
                            key={i}
                            className="w-1 animate-pulse rounded-full bg-gradient-to-t from-primary to-primary/50"
                            style={{
                                height: `${Math.random() * 30 + 10}px`,
                                animationDelay: `${i * 0.1}s`,
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
