
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ScriptLine, Difficulty, ConversationTurnForFeedback, AppPhase } from './types';
import { generateConversationScript, generateSpeech, clearAudioCache, generateFeedback, generateTranslation } from './services/geminiService';
import { useAudioTranscription } from './hooks/useAudioTranscription';
import ApiKeyPrompt from './components/ApiKeyPrompt';
import TopicSelector from './components/TopicSelector';
import ChatWindow from './components/ChatWindow';
import Controls from './components/Controls';
import CompletionScreen from './components/CompletionScreen';
import { decodeAudioData } from './utils/audioUtils';

const logoSrc = 'https://lh3.googleusercontent.com/d/1CihXmyKfVHJz6283B2Zz_L6i2pvEmB7Q';

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('gemini-api-key') || '');
  const [topic, setTopic] = useState<string>('');
  const [difficulty, setDifficulty] = useState<Difficulty>('B1');
  const [phase, setPhase] = useState<AppPhase>(() => (localStorage.getItem('gemini-api-key') ? 'topicSelection' : 'apiKeyNeeded'));
  const [conversationScript, setConversationScript] = useState<ScriptLine[]>([]);
  const [currentTurnIndex, setCurrentTurnIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [permissionError, setPermissionError] = useState<string>('');
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  
  const [userTranscription, setUserTranscription] = useState('');
  const [liveUserTranscription, setLiveUserTranscription] = useState('');
  const [userTranscriptionHistory, setUserTranscriptionHistory] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string>('');
  const [feedbackTranslation, setFeedbackTranslation] = useState<string>('');
  const [isUserLineCorrect, setIsUserLineCorrect] = useState<boolean | null>(null);

  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isHintPlaying, setIsHintPlaying] = useState(false);
  const audioBuffers = useRef(new Map<string, AudioBuffer>());
  const outputAudioContext = useRef<AudioContext | null>(null);
  
  // Initialize and manage AudioContext
  useEffect(() => {
    if (!outputAudioContext.current) {
      outputAudioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    const resumeAudio = () => outputAudioContext.current?.state === 'suspended' && outputAudioContext.current.resume();
    document.addEventListener('click', resumeAudio);
    document.addEventListener('keydown', resumeAudio);
    return () => {
      document.removeEventListener('click', resumeAudio);
      document.removeEventListener('keydown', resumeAudio);
    };
  }, []);

  const playAudio = useCallback((buffer: AudioBuffer) => {
    if (!outputAudioContext.current) return;
    setIsPlayingAudio(true);
    const source = outputAudioContext.current.createBufferSource();
    source.buffer = buffer;
    source.connect(outputAudioContext.current.destination);
    source.onended = () => {
        setIsPlayingAudio(false);
        setCurrentTurnIndex(prev => prev + 1);
    };
    source.start();
  }, []);

  const handlePlayHintAudio = useCallback(async (text: string) => {
    if (isHintPlaying || isPlayingAudio) return;
    
    const audioBuffer = audioBuffers.current.get(text);
    if (!audioBuffer) {
      console.error("Hint audio not preloaded for:", text);
      return;
    }

    setIsHintPlaying(true);
    try {
      if (outputAudioContext.current) {
          const source = outputAudioContext.current.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(outputAudioContext.current.destination);
          source.onended = () => setIsHintPlaying(false);
          source.start();
      } else {
         setIsHintPlaying(false);
      }
    } catch (error) {
        console.error("Error playing hint audio:", error);
        setIsHintPlaying(false);
    }
  }, [isHintPlaying, isPlayingAudio]);

  // Main conversation flow logic
  useEffect(() => {
    if (phase !== 'inConversation') return;
    
    if (currentTurnIndex >= conversationScript.length) {
        if (phase === 'inConversation') {
            setPhase('generatingFeedback');
        }
        return;
    }

    const currentTurn = conversationScript[currentTurnIndex];

    if (currentTurn.role === 'bot') {
        const audioBuffer = audioBuffers.current.get(currentTurn.text);
        if (audioBuffer) {
            playAudio(audioBuffer);
        } else {
            console.warn(`Audio buffer for "${currentTurn.text}" not found. Generating on-the-fly.`);
            (async () => {
                const audioData = await generateSpeech(currentTurn.text, apiKey);
                if (audioData && outputAudioContext.current) {
                    const buffer = await decodeAudioData(audioData, outputAudioContext.current, 24000, 1);
                    audioBuffers.current.set(currentTurn.text, buffer);
                    playAudio(buffer);
                } else {
                    setTimeout(() => setCurrentTurnIndex(prev => prev + 1), 1000);
                }
            })();
        }
    } else { // User's turn
        setUserTranscription('');
        setLiveUserTranscription('');
        setIsUserLineCorrect(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentTurnIndex, conversationScript, apiKey]);

  // Feedback generation effect
  useEffect(() => {
    if (phase === 'generatingFeedback') {
      const getFeedback = async () => {
        setIsLoading(true);
        try {
          const userTurns = conversationScript.filter(line => line.role === 'user');
          const feedbackTurns: ConversationTurnForFeedback[] = userTurns.map((line, index) => ({
            role: 'user',
            expected: line.text,
            actual: userTranscriptionHistory[index] || '(skipped)',
          }));
          
          const successfulTurns = userTranscriptionHistory.filter(t => t !== '(skipped)').length;
          const totalUserTurns = userTurns.length;
          const score = totalUserTurns > 0 ? Math.round((successfulTurns / totalUserTurns) * 10) : 10;

          const feedbackText = await generateFeedback(feedbackTurns, difficulty, score, apiKey);
          setFeedback(feedbackText);

          const translationText = await generateTranslation(feedbackText, "Vietnamese", apiKey);
          setFeedbackTranslation(translationText);

        } catch (error) {
          console.error("Failed to generate feedback:", error);
          setFeedback("Xin lỗi, chúng tôi không thể tạo phản hồi cho phiên này.");
          setFeedbackTranslation("Xin lỗi, chúng tôi không thể tạo phản hồi cho phiên này.");
        } finally {
          setIsLoading(false);
          setPhase('conversationEnded');
        }
      };
      getFeedback();
    }
  }, [phase, conversationScript, userTranscriptionHistory, difficulty, apiKey]);


  const validateTranscription = (transcript: string) => {
    if (currentTurnIndex >= conversationScript.length || conversationScript[currentTurnIndex].role !== 'user') {
      return;
    }
    
    const expectedText = conversationScript[currentTurnIndex].text;
    setUserTranscription(transcript);

    const calculateOverlap = (str1: string, str2: string): number => {
        const format = (s: string) => s.toLowerCase().replace(/[.,'?!]/g, "").trim().split(/\s+/);
        const words1 = new Set(format(str1));
        const words2 = new Set(format(str2));
        if (words2.size === 0) return 0;
        let intersection = 0;
        for (const word of words1) {
            if (words2.has(word)) {
                intersection++;
            }
        }
        return intersection / words2.size;
    }
    
    const overlap = calculateOverlap(transcript, expectedText);
    let isCorrect = false;

    switch (difficulty) {
        case 'A1': isCorrect = overlap >= 0.3; break;
        case 'A2': isCorrect = overlap >= 0.45; break;
        case 'B1': isCorrect = overlap >= 0.6; break;
        case 'B2': isCorrect = overlap >= 0.75; break;
        case 'C1': isCorrect = overlap >= 0.9; break;
    }
    
    if (!isCorrect && (difficulty === 'A1' || difficulty === 'A2')) {
       const format = (s: string) => s.toLowerCase().replace(/[.,'?!]/g, "").trim();
       isCorrect = format(transcript).includes(format(expectedText)) || format(expectedText).includes(format(transcript));
    }
    
    setIsUserLineCorrect(isCorrect);
    
    if (isCorrect) {
        setUserTranscriptionHistory(prev => [...prev, transcript]);
        setTimeout(() => setCurrentTurnIndex(prev => prev + 1), 1200);
    }
  };


  const { isRecording, startRecording, stopRecording } = useAudioTranscription({
    apiKey,
    onTranscriptUpdate: setLiveUserTranscription,
    onTranscriptFinalized: validateTranscription,
    onPermissionError: setPermissionError,
  });

  const handleSaveApiKey = (keyToSave: string) => {
    localStorage.setItem('gemini-api-key', keyToSave);
  };

  const handleStartSession = (sessionApiKey: string) => {
    setApiKey(sessionApiKey);
    setPhase('topicSelection');
  };
  
  const handleTopicSubmit = async (newTopic: string, newDifficulty: Difficulty) => {
    if (!newTopic.trim() || !apiKey.trim()) return;
    setTopic(newTopic);
    setDifficulty(newDifficulty);
    setIsLoading(true);
    setPhase('generatingScript');
    setConversationScript([]);
    setLoadingMessage('Đang tạo kịch bản hội thoại...');

    try {
      const script = await generateConversationScript(newTopic, newDifficulty, apiKey);
      setConversationScript(script);
      
      const totalAudioFiles = script.length;
      let generatedCount = 0;
      setLoadingMessage(`Đang chuẩn bị âm thanh (0/${totalAudioFiles})...`);

      const newAudioBuffers = new Map<string, AudioBuffer>();
      const audioPromises = script.map(line => (async () => {
          try {
            const audioData = await generateSpeech(line.text, apiKey);
            if (audioData && outputAudioContext.current) {
              const audioBuffer = await decodeAudioData(audioData, outputAudioContext.current, 24000, 1);
              newAudioBuffers.set(line.text, audioBuffer);
            }
          } catch (e) {
             console.error(`Failed to pre-generate audio for: "${line.text}"`, e);
          } finally {
            generatedCount++;
            setLoadingMessage(`Đang chuẩn bị âm thanh (${generatedCount}/${totalAudioFiles})...`);
          }
        })());

      await Promise.all(audioPromises);
      audioBuffers.current = newAudioBuffers;
      
      setCurrentTurnIndex(0);
      setPhase('inConversation');
    } catch (error) {
      console.error("Error during setup:", error);
      resetConversation();
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const handleSkipTurn = () => {
    if (isUserTurn) {
      setUserTranscriptionHistory(prev => [...prev, '(skipped)']);
      setIsUserLineCorrect(false);
      setTimeout(() => setCurrentTurnIndex(prev => prev + 1), 300);
    }
  };

  const resetConversation = () => {
    stopRecording();
    clearAudioCache();
    setTopic('');
    setConversationScript([]);
    setCurrentTurnIndex(0);
    setIsLoading(false);
    setPermissionError('');
    setUserTranscription('');
    setLiveUserTranscription('');
    setIsUserLineCorrect(null);
    audioBuffers.current.clear();
    setLoadingMessage('');
    setUserTranscriptionHistory([]);
    setFeedback('');
    setFeedbackTranslation('');
    setPhase('topicSelection');
  };
  
  const handleRequestApiKeyChange = () => {
    stopRecording();
    setApiKey('');
    resetConversation();
    setPhase('apiKeyNeeded');
  };
  
  const currentTurn = conversationScript[currentTurnIndex];
  const isUserTurn = phase === 'inConversation' && currentTurn?.role === 'user';
  
  const renderContent = () => {
    switch (phase) {
      case 'apiKeyNeeded':
        return (
          <ApiKeyPrompt
            initialApiKey={apiKey}
            onSaveApiKey={handleSaveApiKey}
            onStartSession={handleStartSession}
          />
        );
      case 'topicSelection':
      case 'generatingScript':
        return (
          <TopicSelector 
            onSubmit={handleTopicSubmit} 
            isLoading={isLoading} 
            loadingMessage={loadingMessage} 
          />
        );
      case 'conversationEnded':
      case 'generatingFeedback':
        return <CompletionScreen onReset={resetConversation} feedback={feedback} feedbackTranslation={feedbackTranslation} isLoading={phase === 'generatingFeedback'} />;
      default: // inConversation
        return (
          <div className="flex flex-col h-full">
            <ChatWindow
              script={conversationScript}
              currentTurnIndex={currentTurnIndex}
              isUserLineCorrect={isUserLineCorrect}
              userTranscription={userTranscription}
              liveUserTranscription={liveUserTranscription}
              isRecording={isRecording}
              onPlayHint={handlePlayHintAudio}
              isHintPlaying={isHintPlaying}
              isPlayingAudio={isPlayingAudio}
            />
            <Controls
              isRecording={isRecording}
              onToggleRecording={isRecording ? stopRecording : startRecording}
              isUserTurn={isUserTurn}
              isRecordingDisabled={isPlayingAudio || isLoading || isUserLineCorrect === true || isHintPlaying}
              onEndConversation={resetConversation}
              onSkipTurn={handleSkipTurn}
              permissionError={permissionError}
            />
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-900 to-gray-800 font-sans">
      <header className="bg-gray-900/50 backdrop-blur-sm shadow-lg p-4 flex justify-center items-center relative h-28 md:h-40">
        {/* Center: Logo */}
        <img 
            src={logoSrc} 
            alt="Ham Choi Education Logo" 
            className="h-20 md:h-28 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" 
        />
      </header>

      <main className="flex-1 overflow-y-auto">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
