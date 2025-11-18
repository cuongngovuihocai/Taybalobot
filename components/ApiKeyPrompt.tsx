
import React, { useState } from 'react';

interface ApiKeyPromptProps {
  initialApiKey: string;
  onSaveApiKey: (apiKey: string) => void;
  onStartSession: (apiKey: string) => void;
}

const ApiKeyPrompt: React.FC<ApiKeyPromptProps> = ({ initialApiKey, onSaveApiKey, onStartSession }) => {
  const [localApiKey, setLocalApiKey] = useState(initialApiKey || '');
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    if (localApiKey.trim()) {
      onSaveApiKey(localApiKey.trim());
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    }
  };
  
  const handleStart = () => {
    if (localApiKey.trim()) {
      onStartSession(localApiKey.trim());
    }
  };

  return (
    <div className="flex flex-col items-center justify-start pt-8 md:pt-20 min-h-full p-4 text-center">
      <div className="max-w-lg w-full bg-gray-800/50 p-6 md:p-8 rounded-xl shadow-2xl border border-gray-700">
        <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-teal-300 leading-tight">
          Chào Mừng Đến Với <br /> Tây Ba Lô ChatBot!
        </h2>
        <p className="text-sm sm:text-base text-gray-400 mb-6">
          Luyện tập kỹ năng nghe và nói tiếng Anh-Anh thông qua các cuộc hội thoại tương tác.
        </p>
        <p className="text-base md:text-lg text-gray-300 mb-6">Để bắt đầu, vui lòng cung cấp Gemini API Key của bạn. Bạn có thể lưu lại để dùng cho lần sau.</p>
        
        <div className="flex flex-col gap-4">
          <input
            id="api-key"
            type="password"
            value={localApiKey}
            onChange={(e) => setLocalApiKey(e.target.value)}
            placeholder="Dán API Key của bạn tại đây..."
            className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all text-white placeholder-gray-500"
          />
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleSave}
              disabled={!localApiKey.trim()}
              className="flex-1 px-6 py-3 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500"
            >
              {isSaved ? 'Đã Lưu!' : 'Lưu Key'}
            </button>
            <button
              onClick={handleStart}
              disabled={!localApiKey.trim()}
              className="flex-1 px-6 py-3 font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-teal-500"
            >
              Bắt Đầu
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-4">
          Bạn có thể lấy API key của mình từ Google AI Studio. Nếu bạn không lưu, key sẽ chỉ được dùng cho phiên này.
        </p>
      </div>
    </div>
  );
};

export default ApiKeyPrompt;
