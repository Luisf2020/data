export interface MessagingEvent {
  sender: {
    id: string;
  };
  recipient: {
    id: string;
  };
  message?: {
    text: string;
    is_echo?: boolean;
    attachments?: {
      type: 'image' | 'video' | 'audio' | 'file';
      payload: {
        url: string;
      };
    }[];
  };
  timestamp?: number;
}

export interface Entry {
  id: string;
  time: number;
  messaging: MessagingEvent[];
}

export interface WebhookBody {
  object: string;
  entry: Entry[];
}


