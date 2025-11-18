
import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { createPcmBlob } from '../utils/audioUtils';

interface UseAudioTranscriptionProps {
  apiKey: string;
  onTranscriptUpdate: (transcript: string) => void;
  onTranscriptFinalized: (transcript: string) => void;
  onPermissionError: (error: string) => void;
}

const audioProcessorWorklet = `
class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 4096;
    this._buffer = new Float32Array(this.bufferSize);
    this._bufferIndex = 0;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (input.length > 0) {
      const inputChannel = input[0];
      if (inputChannel) {
        for (let i = 0; i < inputChannel.length; i++) {
          this._buffer[this._bufferIndex++] = inputChannel[i];
          if (this._bufferIndex === this.bufferSize) {
            this.port.postMessage(this._buffer);
            this._bufferIndex = 0;
          }
        }
      }
    }
    return true; // Keep processor alive
  }
}

registerProcessor('audio-processor', AudioProcessor);
`;

export const useAudioTranscription = ({ apiKey, onTranscriptUpdate, onTranscriptFinalized, onPermissionError }: UseAudioTranscriptionProps) => {
  const [isRecording, setIsRecording] = useState(false);
  
  const sessionPromise = useRef<ReturnType<InstanceType<typeof GoogleGenAI>['live']['connect']> | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const mediaStream = useRef<MediaStream | null>(null);
  const audioWorkletNode = useRef<AudioWorkletNode | null>(null);
  const mediaStreamSource = useRef<MediaStreamAudioSourceNode | null>(null);
  
  const finalTranscriptRef = useRef(onTranscriptFinalized);
  useEffect(() => {
    finalTranscriptRef.current = onTranscriptFinalized;
  }, [onTranscriptFinalized]);

  const updateTranscriptRef = useRef(onTranscriptUpdate);
  useEffect(() => {
    updateTranscriptRef.current = onTranscriptUpdate;
  }, [onTranscriptUpdate]);

  const stopRecording = useCallback(() => {
    setIsRecording(false);

    if (sessionPromise.current) {
        sessionPromise.current.then(session => session.close());
        sessionPromise.current = null;
    }
    
    if (audioWorkletNode.current) {
        audioWorkletNode.current.port.onmessage = null;
        audioWorkletNode.current.disconnect();
        audioWorkletNode.current = null;
    }
    if (mediaStreamSource.current) {
      mediaStreamSource.current.disconnect();
      mediaStreamSource.current = null;
    }
    if (audioContext.current && audioContext.current.state !== 'closed') {
      audioContext.current.close().catch(console.error);
      audioContext.current = null;
    }
    if (mediaStream.current) {
      mediaStream.current.getTracks().forEach(track => track.stop());
      mediaStream.current = null;
    }
  }, []);


  const startRecording = useCallback(async () => {
    if (isRecording) return;
    onPermissionError(''); // Clear previous errors

    if (!apiKey) {
      onPermissionError('Vui lòng nhập API Key để bắt đầu.');
      return;
    }

    try {
      mediaStream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsRecording(true);
      
      let currentTranscript = '';
      const ai = new GoogleGenAI({ apiKey });

      sessionPromise.current = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: async () => {
             audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
             mediaStreamSource.current = audioContext.current.createMediaStreamSource(mediaStream.current!);
             
             try {
                const workletBlob = new Blob([audioProcessorWorklet], { type: 'application/javascript' });
                const workletURL = URL.createObjectURL(workletBlob);
                await audioContext.current.audioWorklet.addModule(workletURL);
             } catch (e) {
                console.error("Error adding AudioWorklet module", e);
                onPermissionError("Trình duyệt không hỗ trợ tính năng ghi âm nâng cao.");
                stopRecording();
                return;
             }
             
             audioWorkletNode.current = new AudioWorkletNode(audioContext.current, 'audio-processor');
             
             audioWorkletNode.current.port.onmessage = (event) => {
                 const pcmData = event.data;
                 const pcmBlob = createPcmBlob(pcmData);
                 if (sessionPromise.current) {
                     sessionPromise.current.then((session) => {
                         session.sendRealtimeInput({ media: pcmBlob });
                     });
                 }
             };

             mediaStreamSource.current.connect(audioWorkletNode.current);
             audioWorkletNode.current.connect(audioContext.current.destination);
          },
          onmessage: (message: LiveServerMessage) => {
            if (message.serverContent?.inputTranscription?.text) {
                currentTranscript += message.serverContent.inputTranscription.text;
                updateTranscriptRef.current(currentTranscript);
            }
          },
          onerror: (e: ErrorEvent) => {
            console.error('Gemini Live API Error:', e);
            onPermissionError('Đã xảy ra lỗi API trong quá trình ghi âm. Vui lòng kiểm tra API Key.');
            stopRecording();
          },
          onclose: () => {
             if(currentTranscript.trim()){
                finalTranscriptRef.current(currentTranscript);
             }
          },
        },
        config: {
          inputAudioTranscription: {},
          // This is required for the conversational audio model, even if we only use transcription.
          // It prevents the "Cannot extract voices from a non-audio request" error.
          responseModalities: [Modality.AUDIO],
        },
      });

    } catch (error) {
        console.error('Failed to start recording', error);
        if (error instanceof DOMException) {
            if (error.name === 'NotAllowedError') {
                onPermissionError('Người dùng hoặc hệ thống đã từ chối quyền truy cập.');
            } else if (error.name === 'NotFoundError') {
                onPermissionError('Không tìm thấy micro.');
            } else {
                onPermissionError(`Đã xảy ra lỗi không mong muốn: ${error.message}`);
            }
        } else {
             onPermissionError('Đã xảy ra lỗi không xác định khi truy cập micro.');
        }
        setIsRecording(false);
    }
  }, [isRecording, stopRecording, apiKey, onPermissionError]);

  return { isRecording, startRecording, stopRecording };
};
