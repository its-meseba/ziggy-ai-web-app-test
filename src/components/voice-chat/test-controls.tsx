'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TestControlsProps {
    onSendGameContext: (gameId: string) => void;
    onSendTestEnvelope: () => void;
    onSendUnsafeTrigger: () => void;
    disabled: boolean;
}

export function TestControls({
    onSendGameContext,
    onSendTestEnvelope,
    onSendUnsafeTrigger,
    disabled,
}: TestControlsProps) {
    return (
        <Card className="border-border/50">
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    Development Testing
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-wrap justify-center gap-2">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onSendGameContext('gam186')}
                        disabled={disabled}
                    >
                        Math Game (gam186)
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onSendGameContext('gam110')}
                        disabled={disabled}
                    >
                        Science Game (gam110)
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onSendTestEnvelope}
                        disabled={disabled}
                    >
                        Test Envelope
                    </Button>
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={onSendUnsafeTrigger}
                        disabled={disabled}
                    >
                        Test Unsafe Input
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
