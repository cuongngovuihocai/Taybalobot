import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { createPcmBlob } from '../utils/audioUtils';

interface UseAudioTranscriptionProps {
  apiKey: string;
  onTranscriptFinalized: (transcript: string) => void;
  onPermissionError: (error: string) => void;
}

export const useAudioTranscription = ({ apiKey, onTranscriptFinalized, onPermissionError }: UseAudioTranscriptionProps) => {
  const [isRecording, setIsRecording] = useState(false);
  
  const sessionPromise = useRef<ReturnType<InstanceType<typeof GoogleGenAI>['live']['connect']> | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const mediaStream = useRef<MediaStream | null>(null);
  const scriptProcessor = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamSource = useRef<MediaStreamAudioSourceNode | null>(null);
  
  const finalTranscriptRef = useRef(onTranscriptFinalized);
  useEffect(() => {
    finalTranscriptRef.current = onTranscriptFinalized;
  }, [onTranscriptFinalized]);

  const stopRecording = useCallback(() => {
    setIsRecording(false);

    if (sessionPromise.current) {
        sessionPromise.current.then(session => session.close());
        sessionPromise.current = null;
    }
    
    if (scriptProcessor.current) {
      scriptProcessor.current.disconnect();
      scriptProcessor.current = null;
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
      
      let finalTranscript = '';
      const ai = new GoogleGenAI({ apiKey });

      sessionPromise.current = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
             audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
             mediaStreamSource.current = audioContext.current.createMediaStreamSource(mediaStream.current!);
             scriptProcessor.current = audioContext.current.createScriptProcessor(4096, 1, 1);

             scriptProcessor.current.onaudioprocess = (audioProcessingEvent) => {
                const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                const pcmBlob = createPcmBlob(inputData);
                if (sessionPromise.current) {
                    sessionPromise.current.then((session) => {
                        session.sendRealtimeInput({ media: pcmBlob });
                    });
                }
             };

             mediaStreamSource.current.connect(scriptProcessor.current);
             scriptProcessor.current.connect(audioContext.current.destination);
          },
          onmessage: (message: LiveServerMessage) => {
            if (message.serverContent?.inputTranscription?.text) {
                finalTranscript += message.serverContent.inputTranscription.text;
            }
          },
          onerror: (e: ErrorEvent) => {
            console.error('Gemini Live API Error:', e);
            onPermissionError('Đã xảy ra lỗi API trong quá trình ghi âm. Vui lòng kiểm tra API Key.');
            stopRecording();
          },
          onclose: () => {
             if(finalTranscript.trim()){
                finalTranscriptRef.current(finalTranscript);
             }
          },
        },
        config: {
          inputAudioTranscription: {},
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Zephyr' },
            },
          },
          systemInstruction: 'You are a service that only transcribes user audio. Do not generate any spoken response.',
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
