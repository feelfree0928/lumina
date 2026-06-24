export interface TavusConversationRequest {
  replica_id: string;
  persona_id: string;
  conversation_name?: string;
  conversational_context?: string;
  custom_greeting?: string;
  callback_url?: string;
  properties?: {
    enable_recording?: boolean;
    max_call_duration?: number; // seconds
    participant_left_timeout?: number;
    participant_absent_timeout?: number;
  };
}

export interface TavusConversationResponse {
  conversation_id: string;
  conversation_url: string; // WebRTC session URL via Daily.co
  status: 'active' | 'ended' | 'error';
}

export interface TavusPerceptionEvent {
  conversation_id: string;
  message_type: 'application';
  event_type: 'application.perception_analysis';
  timestamp: string;
  properties: {
    perception_result: {
      emotions?: Record<string, number>; // e.g. { happiness: 0.8, sadness: 0.1 }
      gaze?: string;
      face_detected?: boolean;
      summary?: string; // Natural language description from Raven
    };
  };
}
