export interface SourceImage {
  base64: string;
  mimeType: string;
}

export interface ModelConfig {
  usePro: boolean;
  resolution: '2K' | '4K';
}

export type TourMoveType =
  | 'pan-left'
  | 'pan-right'
  | 'pan-up'
  | 'pan-down'
  | 'orbit-left'
  | 'orbit-right'
  | 'zoom-in'
  | 'zoom-out';

export interface GeneratedPerspectivePrompts {
  trungCanh: string[];
  canCanh: string[];
  noiThat: string[];
}
