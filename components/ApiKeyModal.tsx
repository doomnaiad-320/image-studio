import React, { useState, useEffect, useCallback } from 'react';
import { DEFAULT_IMAGE_MODEL } from '../types';
import { listAvailableImageModels } from '../services/openaiService';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (apiKey: string, baseUrl: string, model: string) => void;
  currentApiKey: string | null;
  currentBaseUrl: string;
  currentModel: string;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onSave, currentApiKey, currentBaseUrl, currentModel }) => {
  const [key, setKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [isLoadingModels, setIsLoadingModels] = useState<boolean>(false);
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_IMAGE_MODEL);

  useEffect(() => {
    // Populate with existing key when modal opens
    if (isOpen) {
      // 如果currentApiKey为null，说明使用的是环境变量中的API Key，不显示在输入框中
      const initialKey = currentApiKey || '';
      setKey(initialKey);
      setBaseUrl(currentBaseUrl || '');
      const normalizedModel = currentModel || DEFAULT_IMAGE_MODEL;
      setSelectedModel(normalizedModel);
      setAvailableModels(normalizedModel ? [normalizedModel] : []);
      setModelsError(null);
    }
  }, [isOpen, currentApiKey, currentBaseUrl, currentModel]);

  const handleSave = () => {
    if (!key.trim()) {
      return;
    }
    onSave(key.trim(), baseUrl.trim(), (selectedModel || DEFAULT_IMAGE_MODEL).trim());
  };

  const handleLoadModels = async () => {
    if (!key.trim()) {
      setModelsError('请先填写有效的 API Key。');
      return;
    }

    setIsLoadingModels(true);
    setModelsError(null);
    try {
      const models = await listAvailableImageModels(key.trim(), baseUrl.trim() || undefined);
      const uniqueModels = Array.from(new Set(models));
      if (uniqueModels.length === 0) {
        setModelsError('未从接口获取到可用的图像模型，将使用默认模型。');
        setAvailableModels([DEFAULT_IMAGE_MODEL]);
        setSelectedModel(DEFAULT_IMAGE_MODEL);
        return;
      }

      setAvailableModels(uniqueModels);
      if (!uniqueModels.includes(selectedModel)) {
        setSelectedModel(uniqueModels[0]);
      }
    } catch (error) {
      setModelsError(error instanceof Error ? error.message : '加载模型列表失败。');
    } finally {
      setIsLoadingModels(false);
    }
  };

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    }, [onClose]);

  useEffect(() => {
    if (isOpen) {
        window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);


  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="api-key-modal-title"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <h2 id="api-key-modal-title" className="text-2xl font-bold">
            设置您的 OpenAI API Key
          </h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-800 transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="text-slate-600 mb-6">
          为了使用本应用，您需要提供自己的 OpenAI API Key。您可以在 OpenAI 控制台获取并管理额度。
        </p>

        <div className="space-y-4">
          <div>
            <label htmlFor="apiKeyInput" className="block text-sm font-medium text-slate-700 mb-1">
              API Key
            </label>
            <input
              id="apiKeyInput"
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="sk-..."
              className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg shadow-sm transition duration-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="apiBaseUrlInput" className="block text-sm font-medium text-slate-700 mb-1">
              自定义 Base URL（可选）
            </label>
            <input
              id="apiBaseUrlInput"
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://your-domain.com/v1"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg shadow-sm transition duration-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <p className="mt-1 text-xs text-slate-500">
              留空则使用官方默认端点（https://api.openai.com）。
            </p>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="modelSelect" className="block text-sm font-medium text-slate-700 mb-1">
                选择图像模型
              </label>
              <button
                type="button"
                onClick={handleLoadModels}
                disabled={!key.trim() || isLoadingModels}
                className="text-xs px-3 py-1 rounded-full border border-slate-300 text-slate-600 hover:bg-slate-100 disabled:opacity-60"
              >
                {isLoadingModels ? '加载中...' : '刷新列表'}
              </button>
            </div>
            <input
              id="modelSelect"
              list="available-models"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              placeholder={DEFAULT_IMAGE_MODEL}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg shadow-sm transition duration-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <datalist id="available-models">
              {availableModels.map(model => (
                <option key={model} value={model} />
              ))}
            </datalist>
            <p className="mt-1 text-xs text-slate-500">
              若端点支持其它模型，可输入模型 ID 或点击刷新从接口加载列表。
            </p>
            {modelsError && (
              <p className="mt-2 text-xs text-red-500">{modelsError}</p>
            )}
          </div>
          <a
            href="https://platform.openai.com/api-keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline"
          >
            点击这里获取您的 API Key ↗
          </a>
        </div>

        <div className="mt-8 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={!key.trim()}
            className="px-6 py-2 rounded-lg text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
          >
            保存并使用
          </button>
        </div>
      </div>
    </div>
  );
};
