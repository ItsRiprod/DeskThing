import { VoiceConfirmationIntent } from 'component/VoiceConfirmation/VoiceConfirmationIntents';
import { VoiceConfirmationAction } from 'component/VoiceConfirmation/VoiceConfirmationActions';

// based on LocalCommand in vendor/vsdk-curl/include/vsdk_lite_callbacks.h
export enum LocalCommand {
  NONE = 'NONE',
  PLAY = 'PLAY',
  RESUME = 'RESUME',
  STOP = 'STOP',
  NEXT = 'NEXT',
  PREVIOUS = 'PREVIOUS',
  MUTE = 'MUTE',
}

export enum WakeWord {
  NONE = 'NONE',
  HEY_SPOTIFY = 'HEY_SPOTIFY',
  OK_SPOTIFY = 'OK_SPOTIFY',
  PUSH_TO_TALK = 'PUSH_TO_TALK',
  USER_REQUEST = 'USER_REQUEST',
  ENROLLED = 'ENROLLED',
  UNKNOWN = 'UNKOWN',
}

export type NluMessage = {
  custom: {
    intent: VoiceConfirmationIntent;
    action?: VoiceConfirmationAction;
    error?: string;
    content_id?: string;
    go_to_content_id?: string;
    connect_action_taken: boolean;
    errorUi?: {
      titleText: string;
      subtitleText: string;
    };
    slots?: {
      preset?: Array<string>;
      requestedEntityType?: Array<string>;
    };
    query: string;
    spotify_active?: boolean;
    ttsPrompt?: string;
    ttsUrl?: string;
  };
  body?: Array<VoiceItem>;
};

export type AsrMessage = {
  transcript: string;
  isEndOfSpeech: boolean;
  isFinal: boolean;
};

export type VoiceItem = {
  images?: {
    main: {
      uri: string;
    };
  };
  target: {
    uri: string;
  };
  text: {
    subtitle?: string;
    title: string;
  };
  custom?: any; // not used
};

export type WakeWordMessage = {
  type: 'voice_wakeword';
  reason: WakeWord;
};

type ErrorMessage = {
  type: 'voice_error';
  payload: { cause: string; domain: string };
};

type TimeoutMessage = {
  type: 'voice_timeout';
};

export type LocalCommandMessage = {
  type: 'voice_local_command';
  command: LocalCommand;
};

export type IntermediateResultMessage = {
  type: 'voice_intermediate_result';
  payload: { asr: AsrMessage };
};

export type IntentMessagePayload = {
  nlu: NluMessage;
  message?: string;
  session_id: string;
  utterance_id?: string;
};

type IntentMessage = {
  type: 'voice_intent';
  payload: IntentMessagePayload;
};

export type MuteMessage = {
  type: 'voice_mute';
  payload: boolean;
};

export type MicrophoneLevelMessage = {
  type: 'voice_microphone_level';
  level: string;
};

export type VoiceMessage =
  | WakeWordMessage
  | ErrorMessage
  | TimeoutMessage
  | LocalCommandMessage
  | IntermediateResultMessage
  | IntentMessage
  | MuteMessage
  | MicrophoneLevelMessage;
