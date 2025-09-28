import React, { useState, useEffect } from 'react';
import { ImageUploader } from './ImageUploader';
import { EmptyState } from './EmptyState';
import { CameraMovement } from '../types';

const loadingMessages = [
  "AI导演正在构思剧本...",
  "正在准备拍摄场景...",
  "灯光、摄像、开拍！",
  "正在渲染第一帧...",
  "逐帧生成中，这需要一些耐心...",
  "正在处理视频流...",
  "后期制作，加入特效...",
  "即将完成，敬请期待！",
];

interface ImageToVideoProps {
  apiKey: string | null;
  apiBaseUrl?: string;
  imageModel?: string;
  onApiKeyNeeded: () => void;
  onResult: (prompt: string, videoUrl: string, sourceImage: string, cameraMovement: CameraMovement) => Promise<void>;
  initialPrompt: string;
  onPromptChange: (newPrompt: string) => void;
  initialStartFile: File | null;
  onStartFileChange: (file: File | null) => void;
  generatedVideoUrl: string | null;
  onGenerationStart: () => void;
  onGenerationEnd: () => void;
  isLoading: boolean;
  cameraMovement: CameraMovement;
  onCameraMovementChange: (movement: CameraMovement) => void;
}

const SettingButton: React.FC<{
  label: string;
  isActive: boolean;
  onClick: () => void;
  disabled: boolean;
}> = ({ label, isActive, onClick, disabled }) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`w-full px-3 sm:px-4 py-2 rounded-full transition-all duration-300 text-sm font-semibold whitespace-nowrap ${
          isActive
            ? 'bg-indigo-600 text-white shadow'
            : 'bg-white text-slate-600 hover:bg-white/80'
        } disabled:cursor-not-allowed disabled:opacity-60`}
    >
        {label}
    </button>
);

export const ImageToVideo: React.FC<ImageToVideoProps> = ({
  apiKey: _apiKey,
  apiBaseUrl: _apiBaseUrl,
  imageModel: _imageModel,
  onApiKeyNeeded: _onApiKeyNeeded,
  onResult: _onResult,
  initialPrompt,
  onPromptChange,
  initialStartFile,
  onStartFileChange,
  generatedVideoUrl,
  onGenerationStart: _onGenerationStart,
  onGenerationEnd,
  isLoading,
  cameraMovement,
  onCameraMovementChange,
}) => {
  const [startFile, setStartFile] = useState<File[]>(initialStartFile ? [initialStartFile] : []);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');

  useEffect(() => {
    setStartFile(initialStartFile ? [initialStartFile] : []);
  }, [initialStartFile]);

  const handleStartFileChange = (files: File[]) => {
      setStartFile(files);
      onStartFileChange(files.length > 0 ? files[0] : null);
  };

  useEffect(() => {
    if (isLoading) {
      let messageIndex = 0;
      const interval = setInterval(() => {
        messageIndex = (messageIndex + 1) % loadingMessages.length;
        setLoadingMessage(loadingMessages[messageIndex]);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [isLoading]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('当前 OpenAI API 尚未提供视频生成功能。');
    onGenerationEnd();
  };

  const handleDownload = () => {
    if (!generatedVideoUrl) return;
    const link = document.createElement('a');
    link.href = generatedVideoUrl;
    link.target = '_blank';
    link.download = `图生视频-${Date.now()}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <section className="w-full flex flex-col items-center justify-center py-12 md:py-16 bg-slate-50 border-b border-slate-200">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-800 tracking-tight">
            让图片动起来，<span className="text-indigo-600">生成精彩视频</span>
          </h1>
          <p className="mt-4 text-base md:text-lg text-slate-600 max-w-2xl mx-auto">
            上传您的图片，描述您想看到的动态场景，让 AI 为您创造视频。
          </p>
          <div className="mt-6 max-w-3xl mx-auto px-4 py-3 rounded-2xl bg-amber-100 text-amber-800 border border-amber-200">
            当前集成的 OpenAI API 暂未提供视频生成功能，因此此模块暂不可用。您仍可使用其它图像相关功能。
          </div>
          <div className="max-w-5xl mx-auto mt-10 text-left bg-white p-6 md:p-8 rounded-2xl shadow-xl border border-slate-200">
            <form onSubmit={handleGenerate}>
                <div className="grid md:grid-cols-12 gap-8 items-stretch">
                    {/* Left Column: Uploader & Settings */}
                    <div className="md:col-span-5 flex flex-col gap-6">
                        <div>
                           <h3 className="text-xl font-bold text-slate-700 mb-3">1. 上传图片</h3>
                           <ImageUploader files={startFile} onFilesChange={handleStartFileChange} disabled={isLoading} maxFiles={1} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-700 mb-3">2. 运镜方式</h3>
                            <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1 rounded-full">
                                <SettingButton label="默认" isActive={cameraMovement === 'subtle'} onClick={() => onCameraMovementChange('subtle')} disabled={isLoading} />
                                <SettingButton label="推近" isActive={cameraMovement === 'zoomIn'} onClick={() => onCameraMovementChange('zoomIn')} disabled={isLoading} />
                                <SettingButton label="拉远" isActive={cameraMovement === 'zoomOut'} onClick={() => onCameraMovementChange('zoomOut')} disabled={isLoading} />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-700 mb-3">3. 视频比例</h3>
                            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-full">
                                <SettingButton label="16:9 横屏" isActive={aspectRatio === '16:9'} onClick={() => setAspectRatio('16:9')} disabled={isLoading} />
                                <SettingButton label="9:16 竖屏" isActive={aspectRatio === '9:16'} onClick={() => setAspectRatio('9:16')} disabled={isLoading} />
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Prompt & Generate Button */}
                    <div className="md:col-span-7 flex flex-col">
                        <h3 className="text-xl font-bold text-slate-700 mb-3">4. 输入创意指令</h3>
                        <textarea
                            id="video-prompt"
                            value={initialPrompt}
                            onChange={(e) => onPromptChange(e.target.value)}
                            placeholder="例如：一只小猫变成一只雄狮"
                            className="w-full flex-grow px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg shadow-sm transition duration-200 text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                            disabled={isLoading}
                            rows={10}
                        />
                        <button
                            type="submit"
                            className="w-full mt-4 bg-indigo-600 text-white font-bold py-3 px-8 rounded-full hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-transform duration-200 transform hover:scale-105 disabled:bg-slate-400 disabled:cursor-not-allowed disabled:scale-100 text-lg"
                            disabled={isLoading}
                        >
                            {isLoading ? '生成中...' : '🎬 生成视频'}
                        </button>
                    </div>
                </div>
            </form>
          </div>
        </div>
      </section>
      
      <main className="container mx-auto px-4 py-12">
        {error && (
          <div className="mb-8 text-center bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg" role="alert">
            <strong className="font-bold">错误：</strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <div className="mt-4">
          {isLoading ? (
            <div className="text-center">
                <div className="mb-4 inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-indigo-500 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                <h3 className="text-2xl font-semibold text-slate-700">正在生成视频，请稍候...</h3>
                <p className="text-slate-500 mt-2 text-lg">{loadingMessage}</p>
                <p className="text-sm text-slate-400 mt-4">(视频生成通常需要几分钟时间，请勿关闭页面)</p>
            </div>
          ) : generatedVideoUrl ? (
            <div className="max-w-4xl mx-auto">
                <div className="aspect-video w-full bg-slate-100 rounded-2xl shadow-lg overflow-hidden border border-slate-200">
                    <video src={generatedVideoUrl} controls autoPlay loop className="w-full h-full object-contain"></video>
                </div>
                 <div className="text-center mt-6">
                    <button
                        onClick={handleDownload}
                        className="bg-indigo-600 text-white font-bold py-3 px-8 rounded-full hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-transform duration-200 transform hover:scale-105"
                    >
                        下载视频
                    </button>
                </div>
            </div>
          ) : (
            <EmptyState icon="🎬" title="上传图片，开始创作视频" message="在上方上传图片并输入指令，让我为您生成一段精彩的视频吧！" />
          )}
        </div>
      </main>
    </>
  );
};
