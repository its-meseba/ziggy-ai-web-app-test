'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AppConfig, serializerOptions, languageOptions, serverPresets } from '@/config';
import { ConnectionStatus, AudioBufferState } from '@/types';

interface ConnectionPanelProps {
    config: AppConfig;
    onConfigChange: (config: Partial<AppConfig>) => void;
    status: ConnectionStatus;
    onConnect: () => void;
    onDisconnect: () => void;
    bufferState: AudioBufferState;
}

export function ConnectionPanel({
    config,
    onConfigChange,
    status,
    onConnect,
    onDisconnect,
    bufferState,
}: ConnectionPanelProps) {
    const isConnected = status === 'connected';
    const isConnecting = status === 'connecting';

    return (
        <Card className="border-border/50">
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Connection</CardTitle>
                    <div className="flex items-center gap-2">
                        <div
                            className={`h-3 w-3 rounded-full transition-colors ${isConnected
                                ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]'
                                : status === 'error'
                                    ? 'bg-red-500'
                                    : 'bg-muted-foreground/50'
                                }`}
                        />
                        <span className="text-sm text-muted-foreground capitalize">{status}</span>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Server Preset Buttons */}
                <div className="flex gap-2">
                    <Button
                        variant={config.serverUrl === serverPresets.local ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => onConfigChange({ serverUrl: serverPresets.local })}
                        disabled={isConnected}
                        className="flex-1"
                    >
                        🏠 Local
                    </Button>
                    <Button
                        variant={config.serverUrl === serverPresets.server ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => onConfigChange({ serverUrl: serverPresets.server })}
                        disabled={isConnected}
                        className="flex-1"
                    >
                        ☁️ Server
                    </Button>
                </div>

                {/* Server URL */}
                <div className="flex gap-3">
                    <div className="flex-1">
                        <Input
                            value={config.serverUrl}
                            onChange={(e) => onConfigChange({ serverUrl: e.target.value })}
                            placeholder="WebSocket URL"
                            disabled={isConnected}
                        />
                    </div>
                    <Button
                        variant={isConnected ? 'destructive' : 'default'}
                        onClick={isConnected ? onDisconnect : onConnect}
                        disabled={isConnecting}
                        className="min-w-[100px]"
                    >
                        {isConnecting ? 'Connecting...' : isConnected ? 'Disconnect' : 'Connect'}
                    </Button>
                </div>

                {/* App Identifier & Version */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                        <Label htmlFor="appIdentifier" className="text-xs text-muted-foreground">
                            App Identifier
                        </Label>
                        <Input
                            id="appIdentifier"
                            value={config.appIdentifier}
                            onChange={(e) => onConfigChange({ appIdentifier: e.target.value })}
                            disabled={isConnected}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="version" className="text-xs text-muted-foreground">
                            Version
                        </Label>
                        <Input
                            id="version"
                            value={config.version}
                            onChange={(e) => onConfigChange({ version: e.target.value })}
                            disabled={isConnected}
                        />
                    </div>
                </div>

                {/* User ID & Serializer */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                        <Label htmlFor="userId" className="text-xs text-muted-foreground">
                            User ID
                        </Label>
                        <Input
                            id="userId"
                            value={config.userId}
                            onChange={(e) => onConfigChange({ userId: e.target.value })}
                            disabled={isConnected}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Serializer</Label>
                        <Select
                            value={config.serializerType}
                            onValueChange={(value) =>
                                onConfigChange({ serializerType: value as AppConfig['serializerType'] })
                            }
                            disabled={isConnected}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {serializerOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Language & Audio Buffer */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Language</Label>
                        <Select
                            value={config.language}
                            onValueChange={(value) => onConfigChange({ language: value })}
                            disabled={isConnected}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {languageOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="audioBuffer" className="text-xs text-muted-foreground">
                            Audio Buffer (ms)
                        </Label>
                        <Input
                            id="audioBuffer"
                            type="number"
                            value={config.audioBufferMs}
                            onChange={(e) => onConfigChange({ audioBufferMs: parseInt(e.target.value) || 300 })}
                            disabled={isConnected}
                        />
                    </div>
                </div>

                {/* Audio Buffer Indicator */}
                <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/30 p-3">
                    <span className="text-lg">🔊</span>
                    <span className="text-sm">Audio Buffer: {config.audioBufferMs}ms</span>
                    <div className="ml-auto flex items-center gap-2">
                        <div className="h-1 w-16 overflow-hidden rounded-full bg-muted">
                            <div
                                className="h-full bg-gradient-to-r from-green-500 to-blue-500 transition-all"
                                style={{ width: `${bufferState.fillPercent}%` }}
                            />
                        </div>
                        <Badge variant="secondary" className="text-xs capitalize">
                            {bufferState.status}
                        </Badge>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
