// Application configuration types and defaults
export interface AppConfig {
    // Connection settings
    serverUrl: string;
    appIdentifier: string;
    version: string;
    userId: string;
    serializerType: 'raw' | 'raw_no_header' | 'protobuf' | 'opus';
    language: string;

    // Audio settings
    audioBufferMs: number;
    sampleRate: number;

    // VAD settings (for display purposes)
    enableVad: boolean;
}

// Server URL presets
export const serverPresets = {
    local: 'ws://localhost:3001/user-audio-input',
    server: 'ws://34.69.105.17:9200/user-audio-input',
} as const;

export const defaultConfig: AppConfig = {
    serverUrl: 'ws://localhost:3001/user-audio-input',
    appIdentifier: 'ziggy_ai',
    version: 'v1_0_0',
    userId: 'test-user-1',
    serializerType: 'raw',
    language: 'en',
    audioBufferMs: 300,
    sampleRate: 16000,
    enableVad: true,
};

// Serializer options for the UI
export const serializerOptions = [
    { value: 'raw', label: 'Raw Audio (with header)' },
    { value: 'raw_no_header', label: 'Raw Audio (no header)' },
    { value: 'protobuf', label: 'Protobuf' },
    { value: 'opus', label: 'Opus + Protobuf' },
] as const;

// Language options
export const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'tr', label: 'Turkish' },
    { value: 'de', label: 'German' },
    { value: 'fr', label: 'French' },
    { value: 'es', label: 'Spanish' },
] as const;
