import { createZodDto } from 'nestjs-zod';
import {
  GenerateImagesBodySchema,
  UpscaleImageBodySchema,
  EditImageBodySchema,
  GenerateImageFromTextBodySchema,
  GenerateVideoBodySchema,
  VirtualTourBodySchema,
  MoodImagesBodySchema,
  MergeFurnitureBodySchema,
  ChangeMaterialBodySchema,
  ReplaceModelBodySchema,
  InsertBuildingBodySchema,
  GeneratePromptsBodySchema,
  AddCharacterBodySchema,
  AnalyzeFloorplanBodySchema,
  AnalyzeMasterplanBodySchema,
  ColorizeFloorplanBodySchema,
  ImageArrayResponseSchema,
  SingleImageResponseSchema,
  TextResponseSchema,
  PromptsResponseSchema,
  VideoResponseSchema,
} from './gemini.model';

// Request DTOs
export class GenerateImagesBodyDTO extends createZodDto(GenerateImagesBodySchema) {}
export class UpscaleImageBodyDTO extends createZodDto(UpscaleImageBodySchema) {}
export class EditImageBodyDTO extends createZodDto(EditImageBodySchema) {}
export class GenerateImageFromTextBodyDTO extends createZodDto(GenerateImageFromTextBodySchema) {}
export class GenerateVideoBodyDTO extends createZodDto(GenerateVideoBodySchema) {}
export class VirtualTourBodyDTO extends createZodDto(VirtualTourBodySchema) {}
export class MoodImagesBodyDTO extends createZodDto(MoodImagesBodySchema) {}
export class MergeFurnitureBodyDTO extends createZodDto(MergeFurnitureBodySchema) {}
export class ChangeMaterialBodyDTO extends createZodDto(ChangeMaterialBodySchema) {}
export class ReplaceModelBodyDTO extends createZodDto(ReplaceModelBodySchema) {}
export class InsertBuildingBodyDTO extends createZodDto(InsertBuildingBodySchema) {}
export class GeneratePromptsBodyDTO extends createZodDto(GeneratePromptsBodySchema) {}
export class AddCharacterBodyDTO extends createZodDto(AddCharacterBodySchema) {}
export class AnalyzeFloorplanBodyDTO extends createZodDto(AnalyzeFloorplanBodySchema) {}
export class AnalyzeMasterplanBodyDTO extends createZodDto(AnalyzeMasterplanBodySchema) {}
export class ColorizeFloorplanBodyDTO extends createZodDto(ColorizeFloorplanBodySchema) {}

// Response DTOs
export class ImageArrayResponseDTO extends createZodDto(ImageArrayResponseSchema) {}
export class SingleImageResponseDTO extends createZodDto(SingleImageResponseSchema) {}
export class TextResponseDTO extends createZodDto(TextResponseSchema) {}
export class PromptsResponseDTO extends createZodDto(PromptsResponseSchema) {}
export class VideoResponseDTO extends createZodDto(VideoResponseSchema) {}
