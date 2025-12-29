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
import { Auth } from 'src/shared/decorator/auth.decorator';
import { AuthType } from 'src/shared/contants/auth.constant';
import { ActiveUser } from 'src/shared/decorator/active-user.decorator';
import { AcessTokenPayload } from 'src/shared/types/jwt.type';
import { CreditService } from 'src/shared/services/credit.service';
import { GeminiAction } from 'src/shared/contants/pricing.constant';

@Controller('gemini')
export class GeminiController {
  constructor(
    private readonly geminiService: GeminiService,
    private readonly creditService: CreditService,
  ) {}

  @Post('generate-images')
  @Auth([AuthType.Bearer])
  @ZodSerializerDto(ImageArrayResponseDTO)
  async generateImages(@ActiveUser() user: AcessTokenPayload, @Body() body: GenerateImagesBodyDTO) {
    await this.creditService.deductCredit({
      userId: user.userId,
      action: GeminiAction.GENERATE_IMAGES,
      imageCount: body.count ?? 1,
      usePro: body.modelConfig?.usePro,
      resolution: body.modelConfig?.resolution,
    });
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
  @Auth([AuthType.Bearer])
  @ZodSerializerDto(SingleImageResponseDTO)
  async upscaleImage(@ActiveUser() user: AcessTokenPayload, @Body() body: UpscaleImageBodyDTO) {
    await this.creditService.deductCredit({
      userId: user.userId,
      action: GeminiAction.UPSCALE,
      usePro: body.modelConfig?.usePro,
      resolution: body.modelConfig?.resolution,
    });
    const image = await this.geminiService.upscaleImage(body.sourceImage, body.target, body.modelConfig);
    return { image };
  }

  @Post('edit-image')
  @Auth([AuthType.Bearer])
  @ZodSerializerDto(SingleImageResponseDTO)
  async editImage(@ActiveUser() user: AcessTokenPayload, @Body() body: EditImageBodyDTO) {
    await this.creditService.deductCredit({
      userId: user.userId,
      action: GeminiAction.EDIT_IMAGE,
      usePro: body.modelConfig?.usePro,
      resolution: body.modelConfig?.resolution,
    });
    const image = await this.geminiService.editImage(body.sourceImage, body.maskImage, body.prompt, body.modelConfig);
    return { image };
  }

  @Post('generate-from-text')
  @Auth([AuthType.Bearer])
  @ZodSerializerDto(SingleImageResponseDTO)
  async generateImageFromText(@ActiveUser() user: AcessTokenPayload, @Body() body: GenerateImageFromTextBodyDTO) {
    await this.creditService.deductCredit({
      userId: user.userId,
      action: GeminiAction.GENERATE_FROM_TEXT,
      usePro: body.modelConfig?.usePro,
      resolution: body.modelConfig?.resolution,
    });
    const image = await this.geminiService.generateImageFromText(body.prompt, body.aspectRatio, body.modelConfig);
    return { image };
  }

  @Post('generate-video')
  @Auth([AuthType.Bearer])
  @ZodSerializerDto(VideoResponseDTO)
  async generateVideo(@ActiveUser() user: AcessTokenPayload, @Body() body: GenerateVideoBodyDTO) {
    await this.creditService.deductCredit({
      userId: user.userId,
      action: GeminiAction.GENERATE_VIDEO,
    });
    const videoUrl = await this.geminiService.generateVideo(body.prompt, body.sourceImage ?? null);
    return { videoUrl };
  }

  @Post('virtual-tour')
  @Auth([AuthType.Bearer])
  @ZodSerializerDto(SingleImageResponseDTO)
  async generateVirtualTourImage(@ActiveUser() user: AcessTokenPayload, @Body() body: VirtualTourBodyDTO) {
    await this.creditService.deductCredit({
      userId: user.userId,
      action: GeminiAction.VIRTUAL_TOUR,
      usePro: body.modelConfig?.usePro,
      resolution: body.modelConfig?.resolution,
    });
    const image = await this.geminiService.generateVirtualTourImage(
      body.sourceImage,
      body.moveType,
      body.magnitude,
      body.modelConfig,
    );
    return { image };
  }

  @Post('mood-images')
  @Auth([AuthType.Bearer])
  @ZodSerializerDto(ImageArrayResponseDTO)
  async generateMoodImages(@ActiveUser() user: AcessTokenPayload, @Body() body: MoodImagesBodyDTO) {
    await this.creditService.deductCredit({
      userId: user.userId,
      action: GeminiAction.MOOD_IMAGES,
      imageCount: 4,
      usePro: body.modelConfig?.usePro,
      resolution: body.modelConfig?.resolution,
    });
    const images = await this.geminiService.generateMoodImages(body.sourceImage, body.modelConfig);
    return { images };
  }

  @Post('merge-furniture')
  @Auth([AuthType.Bearer])
  @ZodSerializerDto(SingleImageResponseDTO)
  async mergeFurniture(@ActiveUser() user: AcessTokenPayload, @Body() body: MergeFurnitureBodyDTO) {
    await this.creditService.deductCredit({
      userId: user.userId,
      action: GeminiAction.MERGE_FURNITURE,
      usePro: body.modelConfig?.usePro,
      resolution: body.modelConfig?.resolution,
    });
    const image = await this.geminiService.mergeFurniture(
      body.roomImage,
      body.furnitureImage,
      body.prompt,
      body.modelConfig,
    );
    return { image };
  }

  @Post('change-material')
  @Auth([AuthType.Bearer])
  @ZodSerializerDto(SingleImageResponseDTO)
  async changeMaterial(@ActiveUser() user: AcessTokenPayload, @Body() body: ChangeMaterialBodyDTO) {
    await this.creditService.deductCredit({
      userId: user.userId,
      action: GeminiAction.CHANGE_MATERIAL,
      usePro: body.modelConfig?.usePro,
      resolution: body.modelConfig?.resolution,
    });
    const image = await this.geminiService.changeMaterial(
      body.sourceImage,
      body.referenceImage ?? null,
      body.prompt,
      body.modelConfig,
    );
    return { image };
  }

  @Post('replace-model')
  @Auth([AuthType.Bearer])
  @ZodSerializerDto(SingleImageResponseDTO)
  async replaceModelInImage(@ActiveUser() user: AcessTokenPayload, @Body() body: ReplaceModelBodyDTO) {
    await this.creditService.deductCredit({
      userId: user.userId,
      action: GeminiAction.REPLACE_MODEL,
      usePro: body.modelConfig?.usePro,
      resolution: body.modelConfig?.resolution,
    });
    const image = await this.geminiService.replaceModelInImage(
      body.sourceImage,
      body.referenceImage,
      body.prompt,
      body.modelConfig,
    );
    return { image };
  }

  @Post('insert-building')
  @Auth([AuthType.Bearer])
  @ZodSerializerDto(SingleImageResponseDTO)
  async insertBuildingIntoSite(@ActiveUser() user: AcessTokenPayload, @Body() body: InsertBuildingBodyDTO) {
    await this.creditService.deductCredit({
      userId: user.userId,
      action: GeminiAction.INSERT_BUILDING,
      usePro: body.modelConfig?.usePro,
      resolution: body.modelConfig?.resolution,
    });
    const image = await this.geminiService.insertBuildingIntoSite(
      body.siteImage,
      body.buildingImage,
      body.prompt,
      body.modelConfig,
    );
    return { image };
  }

  @Post('generate-prompts')
  @Auth([AuthType.Bearer])
  @ZodSerializerDto(PromptsResponseDTO)
  async generatePerspectivePrompts(@ActiveUser() user: AcessTokenPayload, @Body() body: GeneratePromptsBodyDTO) {
    const prompts = await this.geminiService.generatePerspectivePrompts(body.sourceImage);
    return prompts;
  }

  @Post('add-character')
  @Auth([AuthType.Bearer])
  @ZodSerializerDto(SingleImageResponseDTO)
  async addCharacterToScene(@ActiveUser() user: AcessTokenPayload, @Body() body: AddCharacterBodyDTO) {
    await this.creditService.deductCredit({
      userId: user.userId,
      action: GeminiAction.ADD_CHARACTER,
      usePro: body.modelConfig?.usePro,
      resolution: body.modelConfig?.resolution,
    });
    const image = await this.geminiService.addCharacterToScene(
      body.sceneImage,
      body.characterImage,
      body.prompt,
      body.modelConfig,
    );
    return { image };
  }

  @Post('analyze-floorplan')
  @Auth([AuthType.Bearer])
  @ZodSerializerDto(TextResponseDTO)
  async analyzeFloorplan(@ActiveUser() user: AcessTokenPayload, @Body() body: AnalyzeFloorplanBodyDTO) {
    const text = await this.geminiService.analyzeFloorplan(body.sourceImage, body.roomType, body.roomStyle);
    return { text };
  }

  @Post('analyze-masterplan')
  @Auth([AuthType.Bearer])
  @ZodSerializerDto(TextResponseDTO)
  async analyzeMasterplan(@ActiveUser() user: AcessTokenPayload, @Body() body: AnalyzeMasterplanBodyDTO) {
    const text = await this.geminiService.analyzeMasterplan(body.sourceImage);
    return { text };
  }

  @Post('colorize-floorplan')
  @Auth([AuthType.Bearer])
  @ZodSerializerDto(ImageArrayResponseDTO)
  async colorizeFloorplan(@ActiveUser() user: AcessTokenPayload, @Body() body: ColorizeFloorplanBodyDTO) {
    await this.creditService.deductCredit({
      userId: user.userId,
      action: GeminiAction.COLORIZE_FLOORPLAN,
      imageCount: 1,
      usePro: body.modelConfig?.usePro,
      resolution: body.modelConfig?.resolution,
    });
    const images = await this.geminiService.colorizeFloorplan(body.sourceImage, body.stylePrompt, body.modelConfig);
    return { images };
  }
}
