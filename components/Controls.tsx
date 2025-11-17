
import React from 'react';

interface ControlsProps {
  isRecording: boolean;
  onToggleRecording: () => void;
  isUserTurn: boolean;
  isRecordingDisabled: boolean;
  onEndConversation: () => void;
  onSkipTurn: () => void;
  permissionError: string;
}

const MicrophoneIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Zm-1 12.1a5 5 0 0 0 5-5V5a5 5 0 0 0-10 0v6a5 5 0 0 0 5 5Zm6.7-3.1c0 3.3-2.7 6-6 6s-6-2.7-6-6H3.7c0 3.9 3.1 7.2 7 7.9V22h2v-2.1c3.9-.7 7-4 7-7.9h-2Z" />
  </svg>
);


const Controls: React.FC<ControlsProps> = ({
  isRecording,
  onToggleRecording,
  isUserTurn,
  isRecordingDisabled,
  onEndConversation,
  onSkipTurn,
  permissionError,
}) => {
  const getHelperText = () => {
    if (!isUserTurn) {
        return <span className="text-gray-400">Đang chờ bot...</span>;
    }
    if (isRecording) {
        return <span className="text-yellow-400">Đang ghi âm... Nhấn lần nữa để dừng.</span>;
    }
    return <span className="text-gray-300">Đến lượt bạn. Nhấn nút để nói.</span>;
  }

  return (
    <div className="bg-gray-900/70 backdrop-blur-md border-t border-gray-700 p-4">
       {permissionError && (
          <div className="max-w-4xl mx-auto mb-2 p-3 bg-red-800/50 border border-red-700 rounded-lg text-center text-red-300">
            <p><strong>Lỗi Micro:</strong> {permissionError}</p>
            <p className="text-sm">Vui lòng kiểm tra quyền truy cập trên trình duyệt và hệ thống của bạn.</p>
          </div>
        )}
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-6">
        <div className="flex-1 text-left text-sm md:text-base">
             {getHelperText()}
        </div>
        <div className="flex-shrink-0">
            <button
            onClick={onToggleRecording}
            disabled={!isUserTurn || isRecordingDisabled}
            className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-offset-gray-900
                ${isRecording ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500 animate-pulse' 
                            : 'bg-teal-600 hover:bg-teal-700 focus:ring-teal-500'}
                ${(!isUserTurn || isRecordingDisabled) && 'opacity-50 cursor-not-allowed bg-gray-600 hover:bg-gray-600'}`}
            >
            <MicrophoneIcon className="w-8 h-8 md:w-9 md:h-9 text-white" />
            </button>
        </div>
        <div className="flex-1 flex justify-end items-center gap-2 md:gap-4">
            <button
                onClick={onSkipTurn}
                disabled={!isUserTurn || isRecordingDisabled}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600/80 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
             >
                Bỏ qua
            </button>
             <button
                onClick={onEndConversation}
                disabled={isRecordingDisabled}
                className="px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
             >
                Kết thúc
            </button>
        </div>
      </div>
    </div>
  );
};

export default Controls;
