
import React, { useEffect, useRef } from 'react';
import { ScriptLine } from '../types';

interface ChatWindowProps {
  script: ScriptLine[];
  currentTurnIndex: number;
  isUserLineCorrect: boolean | null;
  userTranscription: string;
  onPlayHint: (text: string) => void;
  isHintPlaying: boolean;
  isPlayingAudio: boolean;
}

const CheckmarkIcon = () => (
    <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
);

const SpeakerIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 0 0 1.5 12c0 .898.121 1.768.348 2.595.341 1.24 1.518 1.905 2.66 1.905H6.44l4.5 4.5c.944.945 2.56.276 2.56-1.06V4.06ZM18.584 12c0-1.857-.87-3.534-2.274-4.634a.75.75 0 1 0-.916 1.168A2.99 2.99 0 0 1 16.084 12a2.99 2.99 0 0 1-1.29 2.466.75.75 0 1 0 .916 1.168C17.714 15.534 18.584 13.857 18.584 12Z" />
      <path d="M21.584 12c0-3.352-1.677-6.32-4.274-8.158a.75.75 0 1 0-.916 1.168A7.487 7.487 0 0 1 19.084 12a7.487 7.487 0 0 1-2.69 5.99.75.75 0 1 0 .916 1.168C19.907 18.32 21.584 15.352 21.584 12Z" />
    </svg>
);


interface ScriptLineMessageProps {
    line: ScriptLine;
    isPast: boolean;
    isCurrent: boolean;
    isUserLineCorrect?: boolean | null;
    userTranscription?: string;
    onPlayHint: (text: string) => void;
    isHintPlaying: boolean;
    isPlayingAudio: boolean;
}

const ScriptLineMessage: React.FC<ScriptLineMessageProps> = ({ line, isPast, isCurrent, isUserLineCorrect, userTranscription, onPlayHint, isHintPlaying, isPlayingAudio }) => {
  const isBot = line.role === 'bot';

  const botLineContent = () => (
    <div className="flex items-center gap-2.5">
        <p className="text-white text-base leading-relaxed">{line.text}</p>
        <button
            onClick={() => onPlayHint(line.text)}
            disabled={isHintPlaying || isPlayingAudio}
            className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
            aria-label="Nghe lại"
        >
            <SpeakerIcon />
        </button>
    </div>
  );

  const userLineContent = () => {
    // Case 1: User was correct. Show their final transcription and a checkmark.
    if (isUserLineCorrect === true) {
        return (
            <div className="flex items-center gap-2">
                <p className="text-white text-base leading-relaxed italic">{userTranscription}</p>
                <CheckmarkIcon />
            </div>
        );
    }

    // Case 2: It's the user's turn (initial or incorrect attempt).
    // Show the prompt, the hint button, and an error message if they were incorrect.
    return (
        <div>
            {isUserLineCorrect === false && userTranscription && (
                 <p className="text-red-300 text-base leading-relaxed italic mb-2">Tôi nghe được: "{userTranscription}" - Hãy thử lại nhé.</p>
            )}
            <div className="flex items-center gap-2.5">
                <p className="text-white text-base leading-relaxed">{line.text}</p>
                {isCurrent && (
                    <button
                        onClick={() => onPlayHint(line.text)}
                        disabled={isHintPlaying || isPlayingAudio}
                        className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-wait"
                        aria-label="Nghe phát âm"
                    >
                        <SpeakerIcon />
                    </button>
                )}
            </div>
        </div>
    );
  };

  return (
    <div className={`flex items-end gap-3 my-4 ${isBot ? 'justify-start' : 'justify-end'} ${isPast ? 'opacity-70' : ''}`}>
      {isBot && (
        <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center font-bold text-white flex-shrink-0">
          AI
        </div>
      )}
      <div className={`max-w-xs md:max-w-md lg:max-w-2xl px-5 py-3 rounded-2xl shadow-md ${
          isBot ? 'bg-gray-700 rounded-bl-none' : 'bg-blue-600 rounded-br-none'
        }`}
      >
        {isBot ? botLineContent() : userLineContent() }

        <p className="text-gray-400 text-sm mt-2 pt-2 border-t border-gray-600 italic">
            (vi) {line.translation}
        </p>
      </div>
    </div>
  );
};


const ChatWindow: React.FC<ChatWindowProps> = ({ script, currentTurnIndex, isUserLineCorrect, userTranscription, onPlayHint, isHintPlaying, isPlayingAudio }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
        setTimeout(() => {
            scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }, 100);
    }
  }, [script, currentTurnIndex]);

  return (
    <div className="flex-1 p-4 md:p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        {script.slice(0, currentTurnIndex + 1).map((line, index) => (
          <ScriptLineMessage 
            key={index} 
            line={line} 
            isPast={index < currentTurnIndex}
            isCurrent={index === currentTurnIndex}
            isUserLineCorrect={index === currentTurnIndex ? isUserLineCorrect : (line.role === 'user' ? true : null) }
            userTranscription={index === currentTurnIndex ? userTranscription : line.text}
            onPlayHint={onPlayHint}
            isHintPlaying={isHintPlaying}
            isPlayingAudio={isPlayingAudio}
          />
        ))}
        <div ref={scrollRef} />
      </div>
    </div>
  );
};

export default ChatWindow;
