import z from 'zod';

// Base schemas
export const SourceImageSchema = z.object({
  base64: z.string(),
  mimeType: z.string(),
});

export const ModelConfigSchema = z.object({
  usePro: z.boolean().default(false),
  resolution: z.enum(['2K', '4K']).default('2K'),
});

export const TourMoveTypeSchema = z.enum([
  'pan-left',
  'pan-right',
  'pan-up',
  'pan-down',
  'orbit-left',
  'orbit-right',
  'zoom-in',
  'zoom-out',
]);

// Generate Images
export const GenerateImagesBodySchema = z.object({
  sourceImage: SourceImageSchema,
  prompt: z.string(),
  renderType: z.enum(['exterior', 'interior', 'floorplan', 'masterplan']),
  count: z.number().int().min(1).max(10).default(1),
  aspectRatio: z.string().default('Auto'),
  referenceImage: SourceImageSchema.nullable().optional(),
  isAnglePrompt: z.boolean().default(false),
  useRawPrompt: z.boolean().default(false),
  isCompletionTask: z.boolean().default(false),
  modelConfig: ModelConfigSchema.optional(),
});

// Upscale Image
export const UpscaleImageBodySchema = z.object({
  sourceImage: SourceImageSchema,
  target: z.enum(['2k', '4k']),
  modelConfig: ModelConfigSchema.optional(),
});

// Edit Image
export const EditImageBodySchema = z.object({
  sourceImage: SourceImageSchema,
  maskImage: SourceImageSchema,
  prompt: z.string(),
  modelConfig: ModelConfigSchema.optional(),
});

// Generate Image From Text
export const GenerateImageFromTextBodySchema = z.object({
  prompt: z.string(),
  aspectRatio: z.string().default('1:1'),
  modelConfig: ModelConfigSchema.optional(),
});

// Generate Video
export const GenerateVideoBodySchema = z.object({
  prompt: z.string(),
  sourceImage: SourceImageSchema.nullable().optional(),
});

// Virtual Tour
export const VirtualTourBodySchema = z.object({
  sourceImage: SourceImageSchema,
  moveType: TourMoveTypeSchema,
  magnitude: z.number().int(),
  modelConfig: ModelConfigSchema.optional(),
});

// Mood Images
export const MoodImagesBodySchema = z.object({
  sourceImage: SourceImageSchema,
  modelConfig: ModelConfigSchema.optional(),
});

// Merge Furniture
export const MergeFurnitureBodySchema = z.object({
  roomImage: SourceImageSchema,
  furnitureImage: SourceImageSchema,
  prompt: z.string(),
  modelConfig: ModelConfigSchema.optional(),
});

// Change Material
export const ChangeMaterialBodySchema = z.object({
  sourceImage: SourceImageSchema,
  referenceImage: SourceImageSchema.nullable().optional(),
  prompt: z.string(),
  modelConfig: ModelConfigSchema.optional(),
});

// Replace Model
export const ReplaceModelBodySchema = z.object({
  sourceImage: SourceImageSchema,
  referenceImage: SourceImageSchema,
  prompt: z.string(),
  modelConfig: ModelConfigSchema.optional(),
});

// Insert Building
export const InsertBuildingBodySchema = z.object({
  siteImage: SourceImageSchema,
  buildingImage: SourceImageSchema,
  prompt: z.string(),
  modelConfig: ModelConfigSchema.optional(),
});

// Generate Perspective Prompts
export const GeneratePromptsBodySchema = z.object({
  sourceImage: SourceImageSchema,
});

// Add Character
export const AddCharacterBodySchema = z.object({
  sceneImage: SourceImageSchema,
  characterImage: SourceImageSchema,
  prompt: z.string(),
  modelConfig: ModelConfigSchema.optional(),
});

// Analyze Floorplan
export const AnalyzeFloorplanBodySchema = z.object({
  sourceImage: SourceImageSchema,
  roomType: z.string(),
  roomStyle: z.string(),
});

// Analyze Masterplan
export const AnalyzeMasterplanBodySchema = z.object({
  sourceImage: SourceImageSchema,
});

// Colorize Floorplan
export const ColorizeFloorplanBodySchema = z.object({
  sourceImage: SourceImageSchema,
  stylePrompt: z.string(),
  modelConfig: ModelConfigSchema,
});

// Response schemas
export const ImageArrayResponseSchema = z.object({
  images: z.array(z.string()),
});

export const SingleImageResponseSchema = z.object({
  image: z.string().nullable(),
});

export const TextResponseSchema = z.object({
  text: z.string(),
});

export const PromptsResponseSchema = z.object({
  trungCanh: z.array(z.string()),
  canCanh: z.array(z.string()),
  noiThat: z.array(z.string()),
});

export const VideoResponseSchema = z.object({
  videoUrl: z.string().nullable(),
});

// Types
export type SourceImageType = z.infer<typeof SourceImageSchema>;
export type ModelConfigType = z.infer<typeof ModelConfigSchema>;
export type TourMoveTypeType = z.infer<typeof TourMoveTypeSchema>;
export type GenerateImagesBodyType = z.infer<typeof GenerateImagesBodySchema>;
export type UpscaleImageBodyType = z.infer<typeof UpscaleImageBodySchema>;
export type EditImageBodyType = z.infer<typeof EditImageBodySchema>;
export type GenerateImageFromTextBodyType = z.infer<typeof GenerateImageFromTextBodySchema>;
export type GenerateVideoBodyType = z.infer<typeof GenerateVideoBodySchema>;
export type VirtualTourBodyType = z.infer<typeof VirtualTourBodySchema>;
export type MoodImagesBodyType = z.infer<typeof MoodImagesBodySchema>;
export type MergeFurnitureBodyType = z.infer<typeof MergeFurnitureBodySchema>;
export type ChangeMaterialBodyType = z.infer<typeof ChangeMaterialBodySchema>;
export type ReplaceModelBodyType = z.infer<typeof ReplaceModelBodySchema>;
export type InsertBuildingBodyType = z.infer<typeof InsertBuildingBodySchema>;
export type GeneratePromptsBodyType = z.infer<typeof GeneratePromptsBodySchema>;
export type AddCharacterBodyType = z.infer<typeof AddCharacterBodySchema>;
export type AnalyzeFloorplanBodyType = z.infer<typeof AnalyzeFloorplanBodySchema>;
export type AnalyzeMasterplanBodyType = z.infer<typeof AnalyzeMasterplanBodySchema>;
export type ColorizeFloorplanBodyType = z.infer<typeof ColorizeFloorplanBodySchema>;
