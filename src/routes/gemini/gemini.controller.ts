import { Body, Controller, Post } from '@nestjs/common';
import { GeminiService } from './gemini.service';
import {
  GenerateImagesBodyDTO,
  UpscaleImageBodyDTO,
  EditImageBodyDTO,
  GenerateImageFromTextBodyDTO,
  GenerateVideoBodyDTO,
  VirtualTourBodyDTO,
  MoodImagesBodyDTO,
  MergeFurnitureBodyDTO,
  ChangeMaterialBodyDTO,
  ReplaceModelBodyDTO,
  InsertBuildingBodyDTO,
  GeneratePromptsBodyDTO,
  AddCharacterBodyDTO,
  AnalyzeFloorplanBodyDTO,
  AnalyzeMasterplanBodyDTO,
  ColorizeFloorplanBodyDTO,
  ImageArrayResponseDTO,
  SingleImageResponseDTO,
  TextResponseDTO,
  PromptsResponseDTO,
  VideoResponseDTO,
} from './gemini.dto';
import { ZodSerializerDto } from 'nestjs-zod';
import { IsPublic } from 'src/shared/decorator/auth.decorator';

@Controller('gemini')
export class GeminiController {
  constructor(private readonly geminiService: GeminiService) {}

  @Post('generate-images')
  @IsPublic()
  @ZodSerializerDto(ImageArrayResponseDTO)
  async generateImages(@Body() body: GenerateImagesBodyDTO) {
    const images = await this.geminiService.generateImages(
      body.sourceImage,
      body.prompt,
      body.renderType,
      body.count,
      body.aspectRatio,
      body.referenceImage ?? null,
      body.isAnglePrompt,
      body.useRawPrompt,
      body.isCompletionTask,
      body.modelConfig,
    );
    return { images };
  }

  @Post('upscale')
  @IsPublic()
  @ZodSerializerDto(SingleImageResponseDTO)
  async upscaleImage(@Body() body: UpscaleImageBodyDTO) {
    const image = await this.geminiService.upscaleImage(body.sourceImage, body.target, body.modelConfig);
    return { image };
  }

  @Post('edit-image')
  @IsPublic()
  @ZodSerializerDto(SingleImageResponseDTO)
  async editImage(@Body() body: EditImageBodyDTO) {
    const image = await this.geminiService.editImage(body.sourceImage, body.maskImage, body.prompt, body.modelConfig);
    return { image };
  }

  @Post('generate-from-text')
  @IsPublic()
  @ZodSerializerDto(SingleImageResponseDTO)
  async generateImageFromText(@Body() body: GenerateImageFromTextBodyDTO) {
    const image = await this.geminiService.generateImageFromText(body.prompt, body.aspectRatio, body.modelConfig);
    return { image };
  }

  @Post('generate-video')
  @IsPublic()
  @ZodSerializerDto(VideoResponseDTO)
  async generateVideo(@Body() body: GenerateVideoBodyDTO) {
    const videoUrl = await this.geminiService.generateVideo(body.prompt, body.sourceImage ?? null);
    return { videoUrl };
  }

  @Post('virtual-tour')
  @IsPublic()
  @ZodSerializerDto(SingleImageResponseDTO)
  async generateVirtualTourImage(@Body() body: VirtualTourBodyDTO) {
    const image = await this.geminiService.generateVirtualTourImage(
      body.sourceImage,
      body.moveType,
      body.magnitude,
      body.modelConfig,
    );
    return { image };
  }

  @Post('mood-images')
  @IsPublic()
  @ZodSerializerDto(ImageArrayResponseDTO)
  async generateMoodImages(@Body() body: MoodImagesBodyDTO) {
    const images = await this.geminiService.generateMoodImages(body.sourceImage, body.modelConfig);
    return { images };
  }

  @Post('merge-furniture')
  @IsPublic()
  @ZodSerializerDto(SingleImageResponseDTO)
  async mergeFurniture(@Body() body: MergeFurnitureBodyDTO) {
    const image = await this.geminiService.mergeFurniture(
      body.roomImage,
      body.furnitureImage,
      body.prompt,
      body.modelConfig,
    );
    return { image };
  }

  @Post('change-material')
  @IsPublic()
  @ZodSerializerDto(SingleImageResponseDTO)
  async changeMaterial(@Body() body: ChangeMaterialBodyDTO) {
    const image = await this.geminiService.changeMaterial(
      body.sourceImage,
      body.referenceImage ?? null,
      body.prompt,
      body.modelConfig,
    );
    return { image };
  }

  @Post('replace-model')
  @IsPublic()
  @ZodSerializerDto(SingleImageResponseDTO)
  async replaceModelInImage(@Body() body: ReplaceModelBodyDTO) {
    const image = await this.geminiService.replaceModelInImage(
      body.sourceImage,
      body.referenceImage,
      body.prompt,
      body.modelConfig,
    );
    return { image };
  }

  @Post('insert-building')
  @IsPublic()
  @ZodSerializerDto(SingleImageResponseDTO)
  async insertBuildingIntoSite(@Body() body: InsertBuildingBodyDTO) {
    const image = await this.geminiService.insertBuildingIntoSite(
      body.siteImage,
      body.buildingImage,
      body.prompt,
      body.modelConfig,
    );
    return { image };
  }

  @Post('generate-prompts')
  @IsPublic()
  @ZodSerializerDto(PromptsResponseDTO)
  async generatePerspectivePrompts(@Body() body: GeneratePromptsBodyDTO) {
    const prompts = await this.geminiService.generatePerspectivePrompts(body.sourceImage);
    return prompts;
  }

  @Post('add-character')
  @IsPublic()
  @ZodSerializerDto(SingleImageResponseDTO)
  async addCharacterToScene(@Body() body: AddCharacterBodyDTO) {
    const image = await this.geminiService.addCharacterToScene(
      body.sceneImage,
      body.characterImage,
      body.prompt,
      body.modelConfig,
    );
    return { image };
  }

  @Post('analyze-floorplan')
  @IsPublic()
  @ZodSerializerDto(TextResponseDTO)
  async analyzeFloorplan(@Body() body: AnalyzeFloorplanBodyDTO) {
    const text = await this.geminiService.analyzeFloorplan(body.sourceImage, body.roomType, body.roomStyle);
    return { text };
  }

  @Post('analyze-masterplan')
  @IsPublic()
  @ZodSerializerDto(TextResponseDTO)
  async analyzeMasterplan(@Body() body: AnalyzeMasterplanBodyDTO) {
    const text = await this.geminiService.analyzeMasterplan(body.sourceImage);
    return { text };
  }

  @Post('colorize-floorplan')
  @IsPublic()
  @ZodSerializerDto(ImageArrayResponseDTO)
  async colorizeFloorplan(@Body() body: ColorizeFloorplanBodyDTO) {
    const images = await this.geminiService.colorizeFloorplan(body.sourceImage, body.stylePrompt, body.modelConfig);
    return { images };
  }
}
