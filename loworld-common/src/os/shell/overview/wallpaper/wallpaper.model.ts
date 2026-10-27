export type WallpaperCategory = 'all' | 'solid' | 'spring' | 'summer' | 'autumn' | 'winter' | 'solarpunk' | 'aurora' | 'graphic' | 'minimal';

export interface WallpaperItem {
  readonly id: string;
  readonly name: string;
  readonly tag: string;
  readonly category: WallpaperCategory;
  readonly description: string;
  readonly desktopUrl: string;
  readonly mobileUrl: string;
  readonly thumbnailUrl: string;
  readonly accentColor: string;
  readonly isSolidColor?: boolean;
  readonly solidColorHex?: string;
}
