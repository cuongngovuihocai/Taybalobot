import React from 'react';

interface CompletionScreenProps {
  onReset: () => void;
  feedback: string;
  feedbackTranslation: string;
  isLoading: boolean;
}

const CompletionScreen: React.FC<CompletionScreenProps> = ({ onReset, feedback, feedbackTranslation, isLoading }) => {
  return (
    <div className="flex flex-col items-center justify-start pt-8 md:pt-20 min-h-full p-4 text-center">
      <div className="max-w-xl w-full bg-gray-800/50 p-6 md:p-8 rounded-xl shadow-2xl border border-gray-700">
        <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-green-400">Hoàn Thành Hội Thoại!</h2>
        
        <div className="my-6 text-left p-4 bg-gray-900/50 rounded-lg border border-gray-700 min-h-[120px]">
            <h3 className="font-semibold text-teal-300 mb-2">Phản Hồi Của Bạn:</h3>
            {isLoading ? (
                <p className="text-gray-400 italic animate-pulse">Đang tạo phản hồi cá nhân hóa cho bạn...</p>
            ) : (
                <>
                    <p className="text-gray-200 whitespace-pre-wrap text-sm sm:text-base">{feedback}</p>
                    {feedbackTranslation && (
                        <div className="mt-4 pt-4 border-t border-gray-600">
                            <p className="text-teal-400 text-xs sm:text-sm italic whitespace-pre-wrap">{feedbackTranslation}</p>
                        </div>
                    )}
                </>
            )}
        </div>

        <p className="text-sm text-gray-400 mb-6">Hãy dành thời gian đọc phản hồi, sau đó bắt đầu một chủ đề mới khi bạn đã sẵn sàng.</p>
        <button
          onClick={onReset}
          className="px-6 py-3 font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-teal-500"
        >
          Luyện Tập Chủ Đề Mới
        </button>
      </div>
    </div>
  );
};

export default CompletionScreen;