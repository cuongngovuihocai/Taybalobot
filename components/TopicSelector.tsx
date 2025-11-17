import React, { useState } from 'react';
import { Difficulty } from '../types';

interface TopicSelectorProps {
  onSubmit: (topic: string, difficulty: Difficulty) => void;
  isLoading: boolean;
  loadingMessage: string;
}

const difficultyLevels: Difficulty[] = ['A1', 'A2', 'B1', 'B2', 'C1'];

const TopicSelector: React.FC<TopicSelectorProps> = ({ onSubmit, isLoading, loadingMessage }) => {
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('B1');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(topic, difficulty);
  };

  return (
    <div className="flex flex-col items-center justify-start pt-8 md:pt-20 min-h-full p-4 text-center">
      <div className="max-w-lg w-full bg-gray-800/50 p-6 md:p-8 rounded-xl shadow-2xl border border-gray-700">
        <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-teal-300">Chào mừng!</h2>
        
        <p className="text-base md:text-lg text-gray-300 mb-6">Đầu tiên, hãy chọn độ khó luyện tập:</p>
        
        <div className="flex flex-wrap justify-center gap-3 mb-6">
          {difficultyLevels.map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setDifficulty(level)}
              className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all border-2
                ${difficulty === level 
                  ? 'bg-teal-500 border-teal-500 text-white' 
                  : 'bg-transparent border-gray-600 text-gray-300 hover:border-teal-500 hover:text-white'
                }`}
            >
              {level}
            </button>
          ))}
        </div>

        <p className="text-base md:text-lg text-gray-300 mb-6">Bây giờ, bạn muốn luyện nói về chủ đề gì?</p>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="ví dụ: du lịch, ẩm thực, sở thích..."
            className="flex-1 px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all text-white placeholder-gray-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !topic.trim()}
            className="px-6 py-3 font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-teal-500"
          >
            {isLoading ? loadingMessage || 'Vui lòng đợi...' : 'Bắt Đầu Luyện Tập'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TopicSelector;