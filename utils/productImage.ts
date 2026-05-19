import type { ImageSourcePropType } from 'react-native';

/**
 * Explore combines static `require()` assets (number) and admin items that may omit `image`
 * or use `{ uri: string }`. Never read `.uri` unless `image` is a non-null object.
 */
export function resolveProductImageSource(image: unknown): ImageSourcePropType | null {
  if (image == null) return null;
  if (typeof image === 'number') return image;
  if (typeof image === 'object') {
    const uri = (image as { uri?: unknown }).uri;
    if (typeof uri === 'string' && uri.length > 0) {
      return { uri };
    }
  }
  return null;
}
