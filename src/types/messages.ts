// Message types from the server
export type MessageType =
    | 'transcription'
    | 'llm_response'
    | 'assistant_response'
    | 'rive_trigger'
    | 'notification'
    | 'agent_switched';

export interface BaseMessage {
    type: MessageType;
}

export interface TranscriptionMessage extends BaseMessage {
    type: 'transcription';
    text: string;
}

export interface LLMResponseMessage extends BaseMessage {
    type: 'llm_response' | 'assistant_response';
    text: string;
}

export interface RiveTriggerMessage extends BaseMessage {
    type: 'rive_trigger';
    payload?: {
        state?: string;
        trigger?: string;
    };
    state?: string;
    trigger?: string;
}

export interface NotificationMessage extends BaseMessage {
    type: 'notification';
    payload?: {
        notificationType?: string;
        data?: unknown;
    };
}

export interface AgentSwitchedMessage extends BaseMessage {
    type: 'agent_switched';
    agent_id: string;
}

export type ServerMessage =
    | TranscriptionMessage
    | LLMResponseMessage
    | RiveTriggerMessage
    | NotificationMessage
    | AgentSwitchedMessage;

// Chat message for display
export interface ChatMessage {
    id: string;
    type: 'user' | 'assistant' | 'system';
    text: string;
    label?: string;
    emotion?: string;
    timestamp: Date;
}

// Connection status
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

// Audio buffer status
export type BufferStatus = 'ready' | 'buffering' | 'playing';

export interface AudioBufferState {
    status: BufferStatus;
    fillPercent: number;
}
