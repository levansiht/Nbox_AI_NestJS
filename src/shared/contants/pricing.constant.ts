export enum GeminiModel {
  FLASH_IMAGE = 'gemini-2.5-flash-image',
  PRO_IMAGE = 'gemini-3-pro-image-preview',
  VEO_VIDEO = 'veo-3.1-fast-generate-preview',
}

export enum GeminiAction {
  GENERATE_IMAGES = 'generate-images',
  UPSCALE = 'upscale',
  EDIT_IMAGE = 'edit-image',
  GENERATE_FROM_TEXT = 'generate-from-text',
  GENERATE_VIDEO = 'generate-video',
  VIRTUAL_TOUR = 'virtual-tour',
  MOOD_IMAGES = 'mood-images',
  MERGE_FURNITURE = 'merge-furniture',
  CHANGE_MATERIAL = 'change-material',
  REPLACE_MODEL = 'replace-model',
  INSERT_BUILDING = 'insert-building',
  GENERATE_PROMPTS = 'generate-prompts',
  ADD_CHARACTER = 'add-character',
  ANALYZE_FLOORPLAN = 'analyze-floorplan',
  ANALYZE_MASTERPLAN = 'analyze-masterplan',
  COLORIZE_FLOORPLAN = 'colorize-floorplan',
}

export const MODEL_PRICING_VND: Record<string, number> = {
  [GeminiModel.FLASH_IMAGE]: 5000,
  [`${GeminiModel.PRO_IMAGE}_2K`]: 7000,
  [`${GeminiModel.PRO_IMAGE}_4K`]: 12000,
  [GeminiModel.VEO_VIDEO]: 8000,
};

export const ACTION_PRICING_VND: Record<GeminiAction, { model: GeminiModel; costPerImage: number; isVideo?: boolean }> =
  {
    [GeminiAction.GENERATE_IMAGES]: { model: GeminiModel.FLASH_IMAGE, costPerImage: 5000 },
    [GeminiAction.UPSCALE]: { model: GeminiModel.FLASH_IMAGE, costPerImage: 5000 },
    [GeminiAction.EDIT_IMAGE]: { model: GeminiModel.FLASH_IMAGE, costPerImage: 5000 },
    [GeminiAction.GENERATE_FROM_TEXT]: { model: GeminiModel.FLASH_IMAGE, costPerImage: 5000 },
    [GeminiAction.GENERATE_VIDEO]: { model: GeminiModel.VEO_VIDEO, costPerImage: 8000, isVideo: true },
    [GeminiAction.VIRTUAL_TOUR]: { model: GeminiModel.FLASH_IMAGE, costPerImage: 5000 },
    [GeminiAction.MOOD_IMAGES]: { model: GeminiModel.FLASH_IMAGE, costPerImage: 5000 },
    [GeminiAction.MERGE_FURNITURE]: { model: GeminiModel.FLASH_IMAGE, costPerImage: 5000 },
    [GeminiAction.CHANGE_MATERIAL]: { model: GeminiModel.FLASH_IMAGE, costPerImage: 5000 },
    [GeminiAction.REPLACE_MODEL]: { model: GeminiModel.FLASH_IMAGE, costPerImage: 5000 },
    [GeminiAction.INSERT_BUILDING]: { model: GeminiModel.FLASH_IMAGE, costPerImage: 5000 },
    [GeminiAction.GENERATE_PROMPTS]: { model: GeminiModel.FLASH_IMAGE, costPerImage: 0 },
    [GeminiAction.ADD_CHARACTER]: { model: GeminiModel.FLASH_IMAGE, costPerImage: 5000 },
    [GeminiAction.ANALYZE_FLOORPLAN]: { model: GeminiModel.FLASH_IMAGE, costPerImage: 0 },
    [GeminiAction.ANALYZE_MASTERPLAN]: { model: GeminiModel.FLASH_IMAGE, costPerImage: 0 },
    [GeminiAction.COLORIZE_FLOORPLAN]: { model: GeminiModel.FLASH_IMAGE, costPerImage: 5000 },
  };

export function calculateCost(
  action: GeminiAction,
  imageCount: number = 1,
  usePro: boolean = false,
  resolution: '2K' | '4K' = '2K',
): number {
  const pricing = ACTION_PRICING_VND[action];

  if (!pricing) {
    return 0;
  }

  if (pricing.costPerImage === 0) {
    return 0;
  }

  if (usePro) {
    const proCost = resolution === '4K' ? 12000 : 7000;
    return proCost * imageCount;
  }

  return pricing.costPerImage * imageCount;
}
