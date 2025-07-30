// src/types/signalingEvents.ts

import {RTCIceCandidate} from 'react-native-webrtc';
import {RTCSessionDescriptionInit} from 'react-native-webrtc/lib/typescript/RTCSessionDescription';

// Sent by caller
export interface CallUserPayload {
  to: string;
  mediaType: 'audio' | 'video';
  offer: RTCSessionDescriptionInit;
}

// Received by receiver
export interface CallMadePayload {
  from: string;
  mediaType: 'audio' | 'video';
  offer: RTCSessionDescriptionInit;
}

// Sent by receiver
export interface MakeAnswerPayload {
  to: string;
  answer: RTCSessionDescriptionInit;
}

// Received by caller
export interface AnswerMadePayload {
  from: string;
  answer: RTCSessionDescriptionInit;
}

// ICE candidate exchange
export interface IceCandidatePayload {
  to: string;
  candidate: RTCIceCandidate;
}

export interface IceCandidateReceived {
  from: string;
  candidate: RTCIceCandidate;
}

// End call
export interface EndCallPayload {
  to: string;
}

export interface CallEndedPayload {
  from: string;
}
