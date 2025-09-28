// components/ComicPanelEditorModal.tsx
import React, { useState, useEffect } from 'react';
import { GeneratedImage } from '../types';
import { editComicPanel } from '../services/openaiService';
import { SparklesIcon } from './icons/SparklesIcon';

interface ComicPanelEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  panelData: {
    index: number;
    image: GeneratedImage;
    prompt: string;
  } | null;
  apiKey: string | null;
  apiBaseUrl?: string;
  imageModel?: string;
  onComplete: (index: number, newImageSrc: string, newPrompt: string) => void;
  onApiKeyNeeded: () => void;
}

export const ComicPanelEditorModal: React.FC<ComicPanelEditorModalProps> = ({
  isOpen,
  onClose,
  panelData,
  apiKey,
  apiBaseUrl,
  imageModel,
  onComplete,
  onApiKeyNeeded,
}) => {
  const [editedPrompt, setEditedPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && panelData) {
      setEditedPrompt(panelData.prompt);
      setError(null);
      setIsLoading(false);
    }
  }, [isOpen, panelData]);

  const handleGenerate = async () => {
    if (!apiKey) {
      onApiKeyNeeded();
      return;
    }
    if (!panelData) {
      setError('没有可编辑的图片数据。');
      return;
    }
    if (!editedPrompt.trim()) {
      setError('请输入有效的提示词。');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const newImageSrc = await editComicPanel(panelData.image.src, editedPrompt, apiKey, apiBaseUrl || undefined, imageModel);
      onComplete(panelData.index, newImageSrc, editedPrompt);
    } catch (err) {
      setError(err instanceof Error ? err.message : '发生未知错误。');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !panelData) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-slate-800 rounded-2xl shadow-2xl p-4 md:p-6 max-w-4xl w-full text-white flex flex-col md:flex-row gap-6 max-h-[95vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-grow flex flex-col items-center justify-center relative md:w-1/2">
          <img
            src={panelData.image.src}
            alt={`Panel ${panelData.index + 1} for editing`}
            className="rounded-lg max-w-full max-h-[80vh] object-contain"
          />
          {isLoading && (
            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center rounded-lg">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-solid border-indigo-400 border-r-transparent"></div>
              <p className="mt-4 text-lg">正在重新生成...</p>
            </div>
          )}
        </div>
        
        <div className="w-full md:w-1/2 flex-shrink-0 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">编辑画板</h2>
            <button onClick={onClose} className="text-slate-400 text-3xl leading-none hover:text-white">&times;</button>
          </div>
          <p className="text-sm text-slate-300">
            您可以修改下方的提示词来重新生成这张图片，AI 将尽力保持原图的构图和角色。
          </p>
          
          <div>
            <label htmlFor="panel-edit-prompt" className="text-sm font-medium text-slate-300 mb-1 block">生成提示词</label>
            <div className="w-full p-2 bg-slate-700 border border-slate-600 rounded-lg transition-colors focus-within:border-indigo-500">
              <textarea
                id="panel-edit-prompt"
                value={editedPrompt}
                onChange={e => setEditedPrompt(e.target.value)}
                rows={8}
                className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-white resize-y leading-relaxed"
                disabled={isLoading}
              />
            </div>
          </div>
          
          {error && (
            <div className="text-sm bg-red-900/50 border border-red-700 text-red-300 p-2 rounded-lg">{error}</div>
          )}

          <div className="mt-auto flex gap-3">
            <button
                onClick={onClose}
                disabled={isLoading}
                className="w-full bg-slate-600 text-white font-semibold py-3 px-8 rounded-full hover:bg-slate-500 transition-colors disabled:opacity-60"
            >
                取消
            </button>
            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold py-3 px-8 rounded-full hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-transform duration-200 transform hover:scale-105 disabled:bg-slate-500 disabled:cursor-not-allowed"
            >
              <SparklesIcon className="w-5 h-5" />
              <span>{isLoading ? '生成中...' : '重新生成'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
