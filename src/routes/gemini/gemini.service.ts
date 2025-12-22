import { Injectable } from '@nestjs/common';
import { GoogleGenAI, Modality, Type } from '@google/genai';
import type { GenerateContentResponse } from '@google/genai';
import type { SourceImage, GeneratedPerspectivePrompts, ModelConfig, TourMoveType } from './types/gemini.types';
import envConfig from 'src/shared/config';

@Injectable()
export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    const API_KEY = envConfig.GEMINI_API_KEY;
    if (!API_KEY) {
      console.error('GEMINI_API_KEY environment variable is not set.');
    }
    this.ai = new GoogleGenAI({ apiKey: API_KEY });
  }

  // Helper to handle Pro Model initialization
  private getAIClient(usePro: boolean): { client: GoogleGenAI; model: string } {
    if (usePro) {
      return {
        client: new GoogleGenAI({ apiKey: envConfig.GEMINI_API_KEY }),
        model: 'gemini-3-pro-image-preview',
      };
    }
    return { client: this.ai, model: 'gemini-2.5-flash-image' };
  }

  /**
   * Extracts the base64 image data from a Gemini API response.
   */
  private extractBase64Image(response: GenerateContentResponse): string | null {
    if (
      response.candidates &&
      response.candidates.length > 0 &&
      response.candidates[0].content &&
      response.candidates[0].content.parts
    ) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    return null;
  }

  // Helper to determine image dimensions
  private getImageDimensions(): Promise<{ width: number; height: number }> {
    // In Node.js environment, we can't use Image()
    // Return default dimensions
    return Promise.resolve({ width: 1024, height: 1024 });
  }

  // Helper to find closest supported aspect ratio
  private getClosestAspectRatio(width: number, height: number): string {
    const ratio = width / height;
    const supported = [
      { id: '1:1', val: 1 },
      { id: '16:9', val: 16 / 9 },
      { id: '9:16', val: 9 / 16 },
      { id: '4:3', val: 4 / 3 },
      { id: '3:4', val: 3 / 4 },
    ];
    const closest = supported.reduce((prev, curr) => {
      return Math.abs(curr.val - ratio) < Math.abs(prev.val - ratio) ? curr : prev;
    });
    return closest.id;
  }

  /**
   * Generates multiple images based on a source image and a text prompt.
   */
  async generateImages(
    sourceImage: SourceImage,
    prompt: string,
    renderType: 'exterior' | 'interior' | 'floorplan' | 'masterplan',
    count: number,
    aspectRatio: string,
    referenceImage: SourceImage | null = null,
    isAnglePrompt: boolean = false,
    useRawPrompt: boolean = false,
    isCompletionTask: boolean = false,
    modelConfig: ModelConfig = { usePro: false, resolution: '2K' },
  ): Promise<string[]> {
    if (!envConfig.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured.');
    }

    const { client, model } = this.getAIClient(modelConfig.usePro);

    // Detect and resolve aspect ratio if Auto
    let targetAspectRatio = aspectRatio;
    if (targetAspectRatio === 'Auto') {
      try {
        const { width, height } = await this.getImageDimensions();
        targetAspectRatio = this.getClosestAspectRatio(width, height);
      } catch {
        targetAspectRatio = '16:9';
      }
    }

    const generationPromises = Array(count)
      .fill(0)
      .map(async () => {
        const textPart = { text: prompt };
        const parts: any[] = [
          {
            inlineData: {
              data: sourceImage.base64,
              mimeType: sourceImage.mimeType,
            },
          },
        ];

        if (referenceImage) {
          parts.push({
            inlineData: {
              data: referenceImage.base64,
              mimeType: referenceImage.mimeType,
            },
          });
        }

        if (useRawPrompt) {
          // Use the prompt as-is
        } else if (isCompletionTask) {
          if (renderType === 'exterior') {
            textPart.text = `You are an expert architectural visualizer. The provided image shows an unfinished building. Your task is to complete the building photorealistically based on the following user instruction: "${prompt}". You must retain the existing structure from the image and build upon it to create a finished house. The result should be a beautiful, complete, and realistic architectural render.`;
          } else {
            textPart.text = `You are an expert interior designer. The provided image shows an unfinished, empty room. Your task is to furnish and complete the room photorealistically based on the following user instruction: "${prompt}". You must retain the existing structural elements like walls, windows, and doors from the image, and build upon it to create a finished interior scene. The final output must be a beautiful, complete, and realistic architectural render.`;
          }
        } else if (isAnglePrompt) {
          let subject: string;
          let sketchType: string;
          switch (renderType) {
            case 'exterior':
              subject = 'building';
              sketchType = 'architectural sketch';
              break;
            case 'interior':
              subject = 'room';
              sketchType = 'interior sketch';
              break;
            case 'floorplan':
              subject = 'room';
              sketchType = '3D interior render';
              break;
            case 'masterplan':
              subject = 'site plan';
              sketchType = '3D aerial render';
              break;
            default:
              subject = 'room';
              sketchType = 'interior sketch';
              break;
          }
          textPart.text = `The user wants to change the camera angle of the provided ${sketchType}. Render the exact same ${subject} from the image, but from this new perspective: "${prompt}". The prompt's main goal is to define the camera shot, not to add new content to the scene.`;
        } else if (renderType === 'floorplan') {
          if (referenceImage) {
            textPart.text = `The user's prompt is: "${prompt}". You are an expert 3D architectural visualizer. Your task is to convert the provided 2D floorplan (first image) into a photorealistic 3D interior render. You MUST adhere strictly to the layout from the floorplan. The second image is a reference for style ONLY. You must apply the mood, lighting, materials, and color palette from this second image to the room generated from the floorplan. It is forbidden to copy any structural elements or furniture layout from the style reference image. The final render should be from a human-eye level perspective inside the room.`;
          } else {
            textPart.text = `You are an expert 3D architectural visualizer. Your task is to convert the provided 2D floorplan image into a photorealistic 3D interior render, viewed from a human-eye level perspective inside the room. Adhere strictly to the layout, dimensions, and placement of walls, doors, and windows as shown in the floorplan. The user's request is: "${prompt}". Create a beautiful and realistic image based on these instructions.`;
          }
        } else if (renderType === 'masterplan') {
          textPart.text = `You are an expert 3D architectural visualizer. Your task is to convert the provided 2D masterplan/site plan into a photorealistic 3D aerial render (bird's eye view).
        CRITICAL INSTRUCTIONS:
        - Strictly adhere to the zoning, road layout, and building placement shown in the masterplan.
        - Interpret the colored zones and lines as roads, green spaces, water bodies, and building footprints accurately.
        - Extrude the buildings to 3D based on their footprints.
        - User's specific instruction: "${prompt}".
        - The result must be a high-quality, realistic aerial visualization of the area.`;
        } else if (referenceImage) {
          const subjectType = renderType === 'exterior' ? 'building' : 'room';
          const shotType = renderType === 'exterior' ? 'exterior shot' : 'interior shot';
          textPart.text = `The user's prompt is: "${prompt}". You are creating a realistic architectural render. The first image is the architectural sketch. CRITICAL: You MUST use the exact structure, perspective, and camera angle from this first sketch. Do not change the view. The second image is a reference for style ONLY. You must apply the mood, lighting, and color palette from the second image to the ${subjectType} from the first sketch. It is forbidden to copy any shapes, objects, architectural elements, or scene composition (like window frames or foreground elements) from the second style-reference image. The final render must be an ${shotType} based on the user's prompt.`;
        } else if (renderType === 'interior') {
          textPart.text = `You are an expert 3D architectural visualizer specializing in photorealistic interior renders. Your task is to convert the provided interior design sketch or image into a high-quality, realistic photograph based on this request: "${prompt}".
        
        CRITICAL REQUIREMENT:
        - Strictly preserve the EXACT camera angle, perspective, and field of view of the source image.
        - Do NOT rotate, zoom, crop, or shift the composition.
        - The structural geometry (walls, windows, furniture placement) must match the input 100%.
        - Focus solely on applying photorealistic materials, textures, and lighting to the existing scene.`;
        } else {
          textPart.text = `You are an expert architectural visualizer. Your task is to convert the provided architectural sketch or image into a high-quality, photorealistic exterior render based on this request: "${prompt}".
        
        CRITICAL REQUIREMENT:
        - Strictly preserve the EXACT camera angle, perspective, and field of view of the source image.
        - Do NOT rotate, zoom, crop, or shift the composition.
        - The structural geometry must match the input 100%.
        - Focus solely on applying photorealistic materials, textures, and lighting to the existing structure.`;
        }

        if (targetAspectRatio) {
          textPart.text += `. The final image must have a ${targetAspectRatio} aspect ratio.`;
        }

        parts.push(textPart);

        const config: any = {
          responseModalities: [Modality.IMAGE],
        };

        if (modelConfig.usePro) {
          config.imageConfig = {
            imageSize: modelConfig.resolution,
            aspectRatio: targetAspectRatio,
          };
        }

        const response = await client.models.generateContent({
          model: model,
          contents: { parts },
          config: config,
        });
        return this.extractBase64Image(response);
      });

    const results = await Promise.all(generationPromises);

    return results.filter((result): result is string => result !== null);
  }

  async upscaleImage(
    sourceImage: SourceImage,
    target: '2k' | '4k',
    _modelConfig: ModelConfig = { usePro: true, resolution: '4K' },
  ): Promise<string | null> {
    if (!envConfig.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured.');
    }

    const { client, model } = this.getAIClient(true);

    let aspectRatioConfig = '1:1';
    let dimensionInfo = '';

    try {
      const { width, height } = await this.getImageDimensions();
      aspectRatioConfig = this.getClosestAspectRatio(width, height);
      dimensionInfo = `The original image dimensions are ${width}x${height} (Ratio approx ${(width / height).toFixed(2)}).`;
    } catch {
      console.warn('Could not determine image dimensions for aspect ratio, defaulting to 1:1');
    }

    const prompt = `Upscale this image to ${target.toUpperCase()} resolution. Enhance details, sharpness, and clarity while strictly preserving the original content, style, composition, and aspect ratio. 
  ${dimensionInfo}
  The output image MUST have the same aspect ratio as the input image. Do not crop, squeeze, or distort the subjects.`;

    const config: any = {
      responseModalities: [Modality.IMAGE],
      imageConfig: {
        imageSize: target.toUpperCase(),
        aspectRatio: aspectRatioConfig,
      },
    };

    const response = await client.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              data: sourceImage.base64,
              mimeType: sourceImage.mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: config,
    });

    return this.extractBase64Image(response);
  }

  async editImage(
    sourceImage: SourceImage,
    maskImage: SourceImage,
    prompt: string,
    modelConfig: ModelConfig = { usePro: false, resolution: '2K' },
  ): Promise<string | null> {
    if (!envConfig.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured.');
    }

    const { client, model } = this.getAIClient(modelConfig.usePro);

    let aspectRatioConfig = '1:1';
    try {
      const { width, height } = await this.getImageDimensions();
      aspectRatioConfig = this.getClosestAspectRatio(width, height);
    } catch {
      // Ignore error and use default aspect ratio
    }

    const engineeredPrompt = `You are an expert photo editor. You will receive an original image, a mask image, and a text prompt. Your task is to edit the original image *exclusively* within the white area defined by the mask. The black area of the mask represents the parts of the image that MUST remain completely untouched. The user's instruction for the edit is: "${prompt}". Whether this involves adding a new object, removing an existing one, or altering features, confine all changes strictly to the masked region. The final output should be a photorealistic image where the edits are seamlessly blended with the surrounding, unchanged areas. CRITICAL: Preserve the original image aspect ratio and dimensions. Do not crop.`;

    const config: any = {
      responseModalities: [Modality.IMAGE],
    };
    if (modelConfig.usePro) {
      config.imageConfig = {
        imageSize: modelConfig.resolution,
        aspectRatio: aspectRatioConfig,
      };
    }

    const response = await client.models.generateContent({
      model: model,
      contents: {
        parts: [
          { inlineData: { data: sourceImage.base64, mimeType: sourceImage.mimeType } },
          { inlineData: { data: maskImage.base64, mimeType: maskImage.mimeType } },
          { text: engineeredPrompt },
        ],
      },
      config: config,
    });

    return this.extractBase64Image(response);
  }

  async generateImageFromText(
    prompt: string,
    aspectRatio: string = '1:1',
    modelConfig: ModelConfig = { usePro: false, resolution: '2K' },
  ): Promise<string | null> {
    if (!envConfig.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured.');
    }

    const { client, model } = this.getAIClient(modelConfig.usePro);

    const config: any = {
      responseModalities: [Modality.IMAGE],
    };

    if (modelConfig.usePro) {
      config.imageConfig = {
        aspectRatio: aspectRatio,
        imageSize: modelConfig.resolution,
      };
    }

    const response = await client.models.generateContent({
      model: model,
      contents: { parts: [{ text: prompt }] },
      config: config,
    });

    return this.extractBase64Image(response);
  }

  async generateVideo(prompt: string, sourceImage: SourceImage | null): Promise<string | null> {
    if (!envConfig.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured.');
    }

    const client = new GoogleGenAI({ apiKey: envConfig.GEMINI_API_KEY });

    let operation;
    const videoParams: any = {
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      config: {
        numberOfVideos: 1,
      },
    };

    if (sourceImage) {
      videoParams.image = {
        imageBytes: sourceImage.base64,
        mimeType: sourceImage.mimeType,
      };
    }

    operation = await client.models.generateVideos(videoParams);

    while (!operation.done) {
      await new Promise((resolve) => setTimeout(resolve, 10000));
      operation = await client.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (downloadLink) {
      const response = await fetch(`${downloadLink}&key=${envConfig.GEMINI_API_KEY}`);
      if (!response.ok) {
        throw new Error('Failed to download video file.');
      }
      const videoBlob = await response.blob();
      const arrayBuffer = await videoBlob.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      return `data:video/mp4;base64,${base64}`;
    }

    return null;
  }

  async generateVirtualTourImage(
    sourceImage: SourceImage,
    moveType: TourMoveType,
    magnitude: number,
    modelConfig: ModelConfig = { usePro: false, resolution: '2K' },
  ): Promise<string | null> {
    let prompt = '';
    const magnitudeText =
      {
        15: 'a small amount',
        30: 'a moderate amount',
        45: 'a large amount',
      }[magnitude as 15 | 30 | 45] || `${magnitude} degrees`;

    const baseInstruction =
      'You are a virtual camera operator. Re-render the provided scene from a new perspective based on the following precise instruction. You must maintain the exact same photorealistic style, architectural details, materials, lighting, and atmosphere as the original image.';

    switch (moveType) {
      case 'pan-left':
        prompt = `${baseInstruction} INSTRUCTION: PAN LEFT ${magnitude} DEGREES. This is a pure yaw rotation from a fixed camera position, as if on a tripod. Do not move the camera's location.`;
        break;
      case 'pan-right':
        prompt = `${baseInstruction} INSTRUCTION: PAN RIGHT ${magnitude} DEGREES. This is a pure yaw rotation from a fixed camera position, as if on a tripod. Do not move the camera's location.`;
        break;
      case 'pan-up':
        prompt = `${baseInstruction} INSTRUCTION: TILT UP ${magnitude} DEGREES. This is a pure pitch rotation from a fixed camera position, as if on a tripod. Do not move the camera's location.`;
        break;
      case 'pan-down':
        prompt = `${baseInstruction} INSTRUCTION: TILT DOWN ${magnitude} DEGREES. This is a pure pitch rotation from a fixed camera position, as if on a tripod. Do not move the camera's location.`;
        break;
      case 'orbit-left':
        prompt = `${baseInstruction} INSTRUCTION: ORBIT LEFT ${magnitude} DEGREES. The camera's physical position must move. Circle the camera to the left around the scene's central subject, keeping it in frame. Do not change camera height or lens properties.`;
        break;
      case 'orbit-right':
        prompt = `${baseInstruction} INSTRUCTION: ORBIT RIGHT ${magnitude} DEGREES. The camera's physical position must move. Circle the camera to the right around the scene's central subject, keeping it in frame. Do not change camera height or lens properties.`;
        break;
      case 'zoom-in':
        prompt = `${baseInstruction} INSTRUCTION: OPTICAL ZOOM IN (${magnitudeText}). The camera's physical position MUST NOT change. Decrease the lens's field of view to magnify the center of the image.`;
        break;
      case 'zoom-out':
        prompt = `${baseInstruction} INSTRUCTION: OPTICAL ZOOM OUT (${magnitudeText}). The camera's physical position MUST NOT change. Increase the lens's field of view to make the scene appear farther away.`;
        break;
    }

    const images = await this.generateImages(
      sourceImage,
      prompt,
      'exterior',
      1,
      'Auto',
      null,
      false,
      true,
      false,
      modelConfig,
    );
    return images.length > 0 ? images[0] : null;
  }

  async generateMoodImages(
    sourceImage: SourceImage,
    modelConfig: ModelConfig = { usePro: false, resolution: '2K' },
  ): Promise<string[]> {
    if (!envConfig.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured.');
    }

    const prompts = [
      'Ảnh chụp thực tế của công trình từ bản sketch, bối cảnh ban ngày lúc 10 giờ sáng với nắng gắt và bóng đổ sắc nét.',
      'Ảnh chụp thực tế của công trình từ bản sketch, bối cảnh giữa trưa lúc 11 giờ, trời nhiều mây (overcast) với ánh sáng mềm, khuếch tán và không có nắng trực tiếp.',
      'Ảnh chụp thực tế của công trình từ bản sketch, trong buổi hoàng hôn lúc 4 giờ chiều với ánh sáng vàng ấm và bóng đổ dài.',
      'Ảnh chụp thực tế của công trình từ bản sketch, trong giờ xanh (blue hour) khoảng 6 giờ tối, với ánh sáng xanh đậm và đèn nội thất được bật sáng.',
    ];

    const generationPromises = prompts.map((prompt) =>
      this.generateImages(sourceImage, prompt, 'exterior', 1, 'Auto', null, false, true, false, modelConfig),
    );

    const results = await Promise.all(generationPromises);
    const flattenedResults = results.flat();

    if (flattenedResults.length < 4) {
      console.warn('Expected 4 images, but received ' + flattenedResults.length);
    }

    return flattenedResults.filter((result): result is string => result !== null);
  }

  async mergeFurniture(
    roomImage: SourceImage,
    furnitureImage: SourceImage,
    prompt: string,
    modelConfig: ModelConfig = { usePro: false, resolution: '2K' },
  ): Promise<string | null> {
    const engineeredPrompt = `You are an expert interior designer. I have two images: 1) An empty room, and 2) A piece of furniture or a set of furniture. Your task is to realistically place the furniture from the second image into the empty room in the first image. 
    User instruction: "${prompt}".
    Ensure the perspective, lighting, shadows, and scale are perfectly matched to the room. The result must be a photorealistic interior photograph.`;

    const results = await this.generateImages(
      roomImage,
      engineeredPrompt,
      'interior',
      1,
      'Auto',
      furnitureImage,
      false,
      true,
      false,
      modelConfig,
    );
    return results.length > 0 ? results[0] : null;
  }

  async changeMaterial(
    sourceImage: SourceImage,
    referenceImage: SourceImage | null,
    prompt: string,
    modelConfig: ModelConfig = { usePro: false, resolution: '2K' },
  ): Promise<string | null> {
    const engineeredPrompt = `You are an expert architectural visualizer. Your task is to modify the materials or colors in the provided image based on the user's request.
     User instruction: "${prompt}".
     Keep the geometry, lighting, and composition exactly the same. Only change the surface materials/colors as requested. The result must be photorealistic.`;

    const results = await this.generateImages(
      sourceImage,
      engineeredPrompt,
      'exterior',
      1,
      'Auto',
      referenceImage,
      false,
      true,
      false,
      modelConfig,
    );
    return results.length > 0 ? results[0] : null;
  }

  async replaceModelInImage(
    sourceImage: SourceImage,
    referenceImage: SourceImage,
    prompt: string,
    modelConfig: ModelConfig = { usePro: false, resolution: '2K' },
  ): Promise<string | null> {
    const engineeredPrompt = `You are an expert image editor. I have two images: 
    1) A source image containing a scene.
    2) A reference image containing a specific object/model.
    
    Your task is to REPLACE an object in the source image with the object provided in the reference image.
    User instruction on what to replace: "${prompt}".
    
    Crucial Instructions:
    - Identify the object in the source image that matches the user's description.
    - Remove it and realisticially place the object from the reference image in its exact position.
    - Match the perspective, scale, lighting, and shadows of the original scene perfectly.
    - The new object must look like it belongs in the photo naturally.
    `;

    const results = await this.generateImages(
      sourceImage,
      engineeredPrompt,
      'exterior',
      1,
      'Auto',
      referenceImage,
      false,
      true,
      false,
      modelConfig,
    );
    return results.length > 0 ? results[0] : null;
  }

  async insertBuildingIntoSite(
    siteImage: SourceImage,
    buildingImage: SourceImage,
    prompt: string,
    modelConfig: ModelConfig = { usePro: false, resolution: '2K' },
  ): Promise<string | null> {
    const engineeredPrompt = `You are an expert architectural visualizer. I have two images: 1) A site photo (current state), and 2) A photo or render of a building/house.
    Your task is to realistically insert the building from the second image into the site shown in the first image.
    User instruction: "${prompt}".
    Ensure the perspective, scale, lighting, and shadows match the site environment perfectly. The result must look like a real photo taken at the site.`;

    const results = await this.generateImages(
      siteImage,
      engineeredPrompt,
      'exterior',
      1,
      'Auto',
      buildingImage,
      false,
      true,
      false,
      modelConfig,
    );
    return results.length > 0 ? results[0] : null;
  }

  async generatePerspectivePrompts(sourceImage: SourceImage): Promise<GeneratedPerspectivePrompts> {
    const engineeredPrompt = `Analyze the provided architectural image. I want to generate more views of this project to create a complete set of visualizations. Suggest 3 sets of prompts for:
    1. "trungCanh": 5 Medium shots (e.g., viewing from the gate, from the garden, 3/4 view).
    2. "canCanh": 15 Artistic/Close-up shots (e.g., details of materials, balcony, window, architectural features, lighting effects).
    3. "noiThat": 10 Interior shots that would match this building's style (e.g., view from living room looking out, bedroom, kitchen).
    
    Return a VALID JSON object with keys "trungCanh", "canCanh", "noiThat". Each key must have an array of descriptive prompts in Vietnamese matching the requested counts.`;

    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { data: sourceImage.base64, mimeType: sourceImage.mimeType } },
          { text: engineeredPrompt },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            trungCanh: { type: Type.ARRAY, items: { type: Type.STRING } },
            canCanh: { type: Type.ARRAY, items: { type: Type.STRING } },
            noiThat: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['trungCanh', 'canCanh', 'noiThat'],
        },
      },
    });

    try {
      const jsonText = response.text || '{}';
      const cleanJson = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      return JSON.parse(cleanJson) as GeneratedPerspectivePrompts;
    } catch (e) {
      console.error('Failed to parse prompts JSON', e);
      return { trungCanh: [], canCanh: [], noiThat: [] };
    }
  }

  async addCharacterToScene(
    sceneImage: SourceImage,
    characterImage: SourceImage,
    prompt: string,
    modelConfig: ModelConfig = { usePro: false, resolution: '2K' },
  ): Promise<string | null> {
    const engineeredPrompt = `You are an expert image editor. I have a scene image (1st image) and a character image (2nd image).
     Your task is to realisticially place the character from the 2nd image into the scene of the 1st image.
     Context/Action: "${prompt}".
     Adjust the character's lighting, shadow, and perspective to match the scene perfectly. The output must be photorealistic.`;

    const results = await this.generateImages(
      sceneImage,
      engineeredPrompt,
      'exterior',
      1,
      'Auto',
      characterImage,
      false,
      true,
      false,
      modelConfig,
    );
    return results.length > 0 ? results[0] : null;
  }

  async analyzeFloorplan(sourceImage: SourceImage, roomType: string, roomStyle: string): Promise<string> {
    const prompt = `Đóng vai kiến trúc sư, hãy phân tích mặt bằng này để viết prompt render 3D thật TỐI ƯU và NGẮN GỌN.
    Thông tin: Phòng "${roomType}", phong cách "${roomStyle}".
    
    Yêu cầu phân tích:
    1. Xác định vị trí Cửa Đi và Cửa Sổ (quan trọng để ánh sáng tự nhiên đi vào).
    2. Mô tả vị trí sắp xếp các đồ nội thất chính (Layout) đúng theo hình vẽ.
    3. Chỉ định vật liệu và màu sắc chủ đạo ở mức cơ bản, đúng phong cách (không cần mô tả hoa mỹ).
    
    Kết quả trả về là một đoạn văn mô tả liền mạch bằng tiếng Việt, không dùng gạch đầu dòng. KHÔNG bắt đầu bằng cụm từ cố định, hãy mô tả ngay vào nội dung.`;

    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [{ inlineData: { data: sourceImage.base64, mimeType: sourceImage.mimeType } }, { text: prompt }],
      },
    });

    return response.text || '';
  }

  async analyzeMasterplan(sourceImage: SourceImage): Promise<string> {
    const prompt = `Đóng vai kiến trúc sư quy hoạch, hãy phân tích bản vẽ mặt bằng tổng thể (masterplan) này để viết prompt render 3D. 
    Yêu cầu:
    1. Viết một đoạn mô tả tổng quan về bối cảnh, môi trường và không gian.
    2. Liệt kê chi tiết các phân khu chức năng chính có trong bản vẽ. Bắt buộc sử dụng gạch đầu dòng (-) cho mỗi phân khu và xuống dòng rõ ràng (ví dụ: - Khu nhà ở...).
    Văn phong chuyên nghiệp, tập trung vào hình khối và không gian kiến trúc.
    Kết quả bắt đầu bằng: "Ảnh phối cảnh tổng thể..."`;

    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [{ inlineData: { data: sourceImage.base64, mimeType: sourceImage.mimeType } }, { text: prompt }],
      },
    });

    return response.text || '';
  }

  async colorizeFloorplan(sourceImage: SourceImage, stylePrompt: string, modelConfig: ModelConfig): Promise<string[]> {
    const prompt = `You are an expert architectural illustrator. I have a 2D floorplan drawing (lines, black and white). 
    Your task is to colorize this floorplan based on the following style: "${stylePrompt}".
    
    CRITICAL INSTRUCTIONS:
    - You MUST maintain the EXACT layout, lines, and structure of the original floorplan. Do NOT add or remove walls/furniture.
    - Viewpoint: Top-down 2D.
    - Apply realistic or artistic textures to floors (wood, tile, carpet) and furniture.
    - Add shadows to give depth (ambient occlusion) but keep it a 2D plan.
    - The output should be a high-quality colored presentation floorplan.`;

    return await this.generateImages(
      sourceImage,
      prompt,
      'floorplan',
      2,
      'Auto',
      null,
      false,
      true,
      false,
      modelConfig,
    );
  }
}
