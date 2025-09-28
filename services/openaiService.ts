// services/openaiService.ts

import OpenAI, { type ClientOptions } from 'openai';
import { ImageStyle, ImageModel, AspectRatio, InspirationStrength, GeneratedImage, DEFAULT_IMAGE_MODEL } from '../types';
import { base64ToFile, fileToBase64 } from '../utils/imageUtils';

const DEFAULT_CHAT_MODEL = 'gpt-4.1-mini';

const stylePrompts: Record<ImageStyle, string> = {
  [ImageStyle.ILLUSTRATION]: 'A modern flat illustration style using simple shapes, bold colors, and clean lines. Avoid gradients and complex textures. Characters and objects should remain minimalist and consistent.',
  [ImageStyle.CLAY]: 'A charming claymation aesthetic with visible sculpting marks, vibrant saturated colors, and soft dimensional lighting. Everything should look handcrafted from modeling clay.',
  [ImageStyle.DOODLE]: 'A playful hand-drawn doodle style with thick colorful strokes, whimsical characters, and a scrapbook charm. Overall mood should remain friendly and approachable.',
  [ImageStyle.CARTOON]: "A cute kawaii cartoon style with large expressive eyes, rounded silhouettes, and soft pastel colors. Keep bold clean outlines and maintain a sweet, heartwarming tone.",
  [ImageStyle.INK_WASH]: 'A Chinese ink wash painting style (Shuǐ-mò huà) leveraging varied brushstrokes, atmospheric negative space, and flowing qi. Primarily monochrome with subtle accents.',
  [ImageStyle.AMERICAN_COMIC]: 'A classic American comic book style featuring bold outlines, dynamic poses, dramatic shading, and slightly gritty printed textures. Colors should stay vibrant.',
  [ImageStyle.WATERCOLOR]: 'A delicate watercolor painting style with translucent washes, soft bleeding edges, and visible paper texture. Keep the mood light and airy.',
  [ImageStyle.PHOTOREALISTIC]: 'A photorealistic style with accurate lighting, textures, and depth of field that resembles a high-resolution photograph.',
  [ImageStyle.JAPANESE_MANGA]: 'A black-and-white Japanese manga style with clean sharp lines, screentone shading, expressive faces, and dynamic action lines.',
  [ImageStyle.THREE_D_ANIMATION]: 'A polished 3D animation style similar to modern animated feature films. Smooth rounded forms, rich lighting, and cinematic depth are essential.',
};

const createClient = (apiKey: string, baseUrl?: string): OpenAI => {
  if (!apiKey) {
    throw new Error('您需要先配置 OpenAI API Key。');
  }

  const options: ClientOptions = {
    apiKey,
    baseURL: baseUrl || undefined,
    dangerouslyAllowBrowser: true,
  };

  return new OpenAI(options);
};

const handleOpenAIError = (error: unknown): Error => {
  console.error('Error calling OpenAI API:', error);

  if (error && typeof error === 'object') {
    const status = (error as { status?: number }).status;
    if (status === 401) {
      return new Error('您提供的 OpenAI API Key 无效。请检查后重试。');
    }
    if (status === 429) {
      return new Error('请求过于频繁或余额不足，请稍后再试或检查您的额度。');
    }
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (message.includes('insufficient_quota')) {
      return new Error('您的 OpenAI 账户余额不足或已达到配额限制。');
    }
    if (message.includes('invalid_api_key')) {
      return new Error('您提供的 OpenAI API Key 无效。请确认是否输入正确。');
    }
  }

  return new Error('调用 OpenAI 失败，请稍后再试。');
};

const mapAspectRatioToSize = (aspectRatio?: AspectRatio): string => {
  switch (aspectRatio) {
    case '16:9':
      return '1792x1024';
    case '9:16':
      return '1024x1792';
    case '4:3':
      return '1536x1152';
    case '3:4':
      return '1152x1536';
    case '1:1':
    default:
      return '1024x1024';
  }
};

const toDataUrlArray = (items: Array<{ b64_json?: string }>): string[] => {
  const images = items
    .map((item) => (item.b64_json ? `data:image/png;base64,${item.b64_json}` : null))
    .filter((src): src is string => Boolean(src));

  if (images.length === 0) {
    throw new Error('OpenAI 没有返回任何图片。');
  }

  return images;
};

const loadImage = (dataUrl: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('无法解析图片数据。'));
    img.src = dataUrl;
  });
};

const convertFileToPng = async (file: File): Promise<File> => {
  if (file.type === 'image/png') {
    return file;
  }

  const dataUrl = await fileToBase64(file);
  const image = await loadImage(dataUrl);

  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('无法创建画布上下文来转换图片。');
  }
  ctx.drawImage(image, 0, 0);

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob((result) => {
      if (!result) {
        reject(new Error('无法将图片转换为 PNG。'));
      } else {
        resolve(result);
      }
    }, 'image/png');
  });

  const filename = file.name.replace(/\.[^.]+$/, '') || 'image';
  return new File([blob], `${filename}.png`, { type: 'image/png' });
};

const normalizeMaskForOpenAI = async (maskFile: File): Promise<File> => {
  const pngMask = await convertFileToPng(maskFile);
  const dataUrl = await fileToBase64(pngMask);
  const image = await loadImage(dataUrl);

  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('无法创建画布上下文来处理蒙版。');
  }

  ctx.drawImage(image, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data } = imageData;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const average = (r + g + b) / 3;

    if (average > 220) {
      data[i + 3] = 0; // Transparent -> area to edit
    } else {
      data[i] = 0;
      data[i + 1] = 0;
      data[i + 2] = 0;
      data[i + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob((result) => {
      if (!result) {
        reject(new Error('无法生成符合要求的蒙版。'));
      } else {
        resolve(result);
      }
    }, 'image/png');
  });

  return new File([blob], 'mask.png', { type: 'image/png' });
};

const buildPromptWithNegative = (prompt: string, negativePrompt: string): string => {
  if (!negativePrompt.trim()) {
    return prompt.trim();
  }
  return `${prompt.trim()}\nDo not include: ${negativePrompt.trim()}`;
};

export const generateIllustratedCards = async (
  prompt: string,
  style: ImageStyle,
  model: ImageModel | undefined,
  apiKey: string,
  baseUrl?: string,
): Promise<string[]> => {
  try {
    const client = createClient(apiKey, baseUrl);
    const modelToUse = model || DEFAULT_IMAGE_MODEL;
    const response = await client.images.generate({
      model: modelToUse,
      prompt: `Design an educational infographic that explains "${prompt}". Style guidance: ${stylePrompts[style]}. Each image must be a separate card, cohesive as a set, with readable English labels.`,
      n: 4,
      size: '1792x1024',
      response_format: 'b64_json',
    });

    return toDataUrlArray(response.data).slice(0, 4);
  } catch (error) {
    throw handleOpenAIError(error);
  }
};

export const generateComicStrip = async (
  story: string,
  style: ImageStyle,
  apiKey: string,
  numberOfImages: number,
  baseUrl?: string,
  imageModel?: ImageModel,
): Promise<{ imageUrls: string[]; panelPrompts: string[] }> => {
  try {
    const client = createClient(apiKey, baseUrl);

    const completion = await client.chat.completions.create({
      model: DEFAULT_CHAT_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are an expert visual storyteller who writes detailed prompts for an image generation model.',
        },
        {
          role: 'user',
          content: `Story idea:\n${story}\n\nCreate ${numberOfImages} detailed visual scene prompts. Each prompt must describe composition, characters, actions, mood, and integrate this art style: ${stylePrompts[style]}.`,
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'comic_strip_prompts',
          schema: {
            type: 'object',
            properties: {
              prompts: {
                type: 'array',
                items: { type: 'string' },
                minItems: numberOfImages,
                maxItems: numberOfImages,
              },
            },
            required: ['prompts'],
            additionalProperties: false,
          },
        },
      },
    });

    const rawContent = completion.choices[0]?.message?.content;
    if (!rawContent) {
      throw new Error('OpenAI 没有返回连环画提示词。');
    }

    const parsed = JSON.parse(rawContent) as { prompts: string[] };
    const panelPrompts = parsed.prompts;

    if (!Array.isArray(panelPrompts) || panelPrompts.length !== numberOfImages) {
      throw new Error(`提示词数量不正确。期望 ${numberOfImages} 个，实际获得 ${panelPrompts.length} 个。`);
    }

    const images: string[] = [];
    const modelToUse = imageModel || DEFAULT_IMAGE_MODEL;

    for (const panelPrompt of panelPrompts) {
      const response = await client.images.generate({
        model: modelToUse,
        prompt: `${panelPrompt}\nArt style: ${stylePrompts[style]}. Aspect ratio 16:9.`,
        n: 1,
        size: '1792x1024',
        response_format: 'b64_json',
      });
      images.push(...toDataUrlArray(response.data));
    }

    if (images.length !== numberOfImages) {
      throw new Error('部分画面生成失败，请稍后重试。');
    }

    return { imageUrls: images, panelPrompts };
  } catch (error) {
    throw handleOpenAIError(error);
  }
};

export const editComicPanel = async (
  originalImageBase64: string,
  prompt: string,
  apiKey: string,
  baseUrl?: string,
  model?: ImageModel,
): Promise<string> => {
  try {
    const client = createClient(apiKey, baseUrl);
    const modelToUse = model || DEFAULT_IMAGE_MODEL;
    const baseFile = await base64ToFile(originalImageBase64, 'panel.png');
    const pngFile = await convertFileToPng(baseFile);
    const response = await client.images.edit({
      model: modelToUse,
      image: pngFile,
      prompt,
      size: '1792x1024',
      response_format: 'b64_json',
    });

    return toDataUrlArray(response.data)[0];
  } catch (error) {
    throw handleOpenAIError(error);
  }
};

export const generateVideoScriptsForComicStrip = async (
  story: string,
  images: GeneratedImage[],
  apiKey: string,
  baseUrl?: string,
): Promise<string[]> => {
  try {
    const client = createClient(apiKey, baseUrl);
    const descriptionList = images
      .map((img, index) => `Panel ${index + 1}: ${img.src.substring(0, 128)}...`)
      .join('\n');

    const completion = await client.chat.completions.create({
      model: DEFAULT_CHAT_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are an experienced film director who writes concise yet cinematic shot descriptions.',
        },
        {
          role: 'user',
          content: `Story context: ${story}\n\nDraft cinematic video prompts for each panel below. Each prompt must mention camera movement, shot type, core action, and emotional tone.\n${descriptionList}`,
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'comic_video_scripts',
          schema: {
            type: 'object',
            properties: {
              scripts: {
                type: 'array',
                items: {
                  type: 'string',
                  description: 'A cinematic single-sentence video direction in Chinese.',
                },
              },
            },
            required: ['scripts'],
            additionalProperties: false,
          },
        },
      },
    });

    const rawContent = completion.choices[0]?.message?.content;
    if (!rawContent) {
      throw new Error('OpenAI 没有返回视频脚本。');
    }

    const parsed = JSON.parse(rawContent) as { scripts: string[] };
    if (!Array.isArray(parsed.scripts) || parsed.scripts.length !== images.length) {
      throw new Error('视频脚本数量与画面数量不一致。');
    }

    return parsed.scripts;
  } catch (error) {
    throw handleOpenAIError(error);
  }
};

export const generateTextToImage = async (
  prompt: string,
  negativePrompt: string,
  apiKey: string,
  numberOfImages: number,
  aspectRatio: AspectRatio,
  baseUrl?: string,
  model?: ImageModel,
): Promise<string[]> => {
  try {
    const client = createClient(apiKey, baseUrl);
    const modelToUse = model || DEFAULT_IMAGE_MODEL;
    const response = await client.images.generate({
      model: modelToUse,
      prompt: buildPromptWithNegative(prompt, negativePrompt),
      n: numberOfImages,
      size: mapAspectRatioToSize(aspectRatio),
      response_format: 'b64_json',
    });

    return toDataUrlArray(response.data).slice(0, numberOfImages);
  } catch (error) {
    throw handleOpenAIError(error);
  }
};

export const generateFromImageAndPrompt = async (
  prompt: string,
  files: File[],
  apiKey: string,
  baseUrl?: string,
  model?: ImageModel,
): Promise<string[]> => {
  if (files.length === 0) {
    throw new Error('请先上传一张图片。');
  }

  try {
    const client = createClient(apiKey, baseUrl);
    const modelToUse = model || DEFAULT_IMAGE_MODEL;
    const pngFile = await convertFileToPng(files[0]);
    const response = await client.images.edit({
      model: modelToUse,
      image: pngFile,
      prompt,
      response_format: 'b64_json',
    });

    return toDataUrlArray(response.data).slice(0, 1);
  } catch (error) {
    throw handleOpenAIError(error);
  }
};

export const generateWithStyleInspiration = async (
  referenceImageFile: File,
  newPrompt: string,
  apiKey: string,
  strength: InspirationStrength,
  baseUrl?: string,
  model?: ImageModel,
): Promise<string[]> => {
  const strengthDirectives: Record<InspirationStrength, string> = {
    low: 'Subtly borrow the color palette and general vibe from the reference image.',
    medium: 'Clearly follow the reference image style, color palette, and lighting.',
    high: 'Strongly match the reference image style, texture, palette, and lighting.',
    veryHigh: 'Recreate the reference image style almost exactly while changing only the described subject.',
  };

  try {
    const client = createClient(apiKey, baseUrl);
    const modelToUse = model || DEFAULT_IMAGE_MODEL;
    const pngFile = await convertFileToPng(referenceImageFile);
    const response = await client.images.edit({
      model: modelToUse,
      image: pngFile,
      prompt: `${newPrompt}. ${strengthDirectives[strength]}`,
      response_format: 'b64_json',
    });

    return toDataUrlArray(response.data).slice(0, 1);
  } catch (error) {
    throw handleOpenAIError(error);
  }
};

export const generateInpainting = async (
  prompt: string,
  originalImageFile: File,
  maskFile: File,
  apiKey: string,
  baseUrl?: string,
  model?: ImageModel,
): Promise<string[]> => {
  try {
    const client = createClient(apiKey, baseUrl);
    const modelToUse = model || DEFAULT_IMAGE_MODEL;
    const basePng = await convertFileToPng(originalImageFile);
    const normalizedMask = await normalizeMaskForOpenAI(maskFile);
    const response = await client.images.edit({
      model: modelToUse,
      image: basePng,
      mask: normalizedMask,
      prompt,
      response_format: 'b64_json',
    });

    return toDataUrlArray(response.data);
  } catch (error) {
    throw handleOpenAIError(error);
  }
};

export const generateVideo = async (): Promise<never> => {
  throw new Error('当前 OpenAI API 尚未提供视频生成功能。');
};

export const generateVideoTransition = async (): Promise<never> => {
  throw new Error('当前 OpenAI API 尚未提供视频生成功能。');
};

export const getVideosOperation = async (): Promise<never> => {
  throw new Error('当前 OpenAI API 尚未提供视频生成功能。');
};

export const listAvailableImageModels = async (
  apiKey: string,
  baseUrl?: string,
): Promise<string[]> => {
  try {
    const client = createClient(apiKey, baseUrl);
    const response = await client.models.list();
    const ids = response.data?.map(model => model.id) ?? [];
    const imageLike = ids.filter(id => id.toLowerCase().includes('image'));
    return imageLike.length > 0 ? imageLike : ids;
  } catch (error) {
    throw handleOpenAIError(error);
  }
};
