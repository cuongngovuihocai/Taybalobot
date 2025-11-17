import React, { useState } from 'react';

interface ApiKeyPromptProps {
  onApiKeySubmit: (apiKey: string) => void;
}

const ApiKeyPrompt: React.FC<ApiKeyPromptProps> = ({ onApiKeySubmit }) => {
  const [apiKey, setApiKey] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      onApiKeySubmit(apiKey.trim());
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
        <p className="text-base md:text-lg text-gray-300 mb-6">Để bắt đầu, vui lòng cung cấp Gemini API Key của bạn. Key của bạn sẽ được lưu trữ an toàn trong trình duyệt.</p>
        
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <input
            id="api-key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Dán API Key của bạn tại đây..."
            className="flex-1 px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all text-white placeholder-gray-500"
          />
          <button
            type="submit"
            disabled={!apiKey.trim()}
            className="px-6 py-3 font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-teal-500"
          >
            Lưu và Bắt Đầu
          </button>
        </form>
        <p className="text-xs text-gray-500 mt-4">
          Bạn có thể lấy API key của mình từ Google AI Studio. Chúng tôi không lưu trữ key của bạn trên máy chủ của chúng tôi.
        </p>
      </div>
    </div>
  );
};

export default ApiKeyPrompt;