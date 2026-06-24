/**
 * Utility to extract dominant and matching colors from an image.
 * Uses a native HTML5 canvas grid-sampling method which is fast, private, and zero-dependency.
 */

export interface ColorPalette {
  primary: string;      // Most dominant color
  vibrant: string;      // Most saturated/vibrant color
  secondary: string;    // Second dominant/accent color
  dark: string;         // A dark, rich color (good for dark UI or background gradients)
  light: string;        // A light, soft color (good for highlight or contrast)
  all: string[];        // All 5 extracted colors
}

// Convert RGB to Hex
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (c: number) => {
    const hex = Math.max(0, Math.min(255, Math.round(c))).toString(16);
    return hex.length === 1 ? '0' : '' + hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Convert Hex to RGB
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

// Calculate color distance (Euclidean in RGB space)
function colorDistance(c1: { r: number; g: number; b: number }, c2: { r: number; g: number; b: number }): number {
  return Math.sqrt(
    Math.pow(c1.r - c2.r, 2) +
    Math.pow(c1.g - c2.g, 2) +
    Math.pow(c1.b - c2.b, 2)
  );
}

// Convert RGB to HSL for analytical sorting
function rgbToHsl(r: number, g: number, b: number) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

/**
 * Extracts a matching 5-color palette from an HTMLImageElement
 */
export function extractColorPalette(img: HTMLImageElement): ColorPalette {
  // Create hidden canvas for sampling
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Downsample to a small grid to average colors and run instantly
  const sampleSize = 32; 
  canvas.width = sampleSize;
  canvas.height = sampleSize;
  
  if (!ctx) {
    // Fallback if canvas fails
    return {
      primary: '#6366f1',
      vibrant: '#ec4899',
      secondary: '#3b82f6',
      dark: '#1e1b4b',
      light: '#e0e7ff',
      all: ['#6366f1', '#ec4899', '#3b82f6', '#1e1b4b', '#e0e7ff']
    };
  }

  // Draw image stretched to sample canvas
  ctx.drawImage(img, 0, 0, sampleSize, sampleSize);
  
  // Retrieve raw pixel data
  const imgData = ctx.getImageData(0, 0, sampleSize, sampleSize);
  const data = imgData.data;
  
  // Store pixel colors with saturation and lightness info
  const colors: Array<{ r: number; g: number; b: number; hex: string; h: number; s: number; l: number }> = [];
  
  // Sample every other pixel to be even faster and reduce duplication
  for (let i = 0; i < data.length; i += 16) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    
    // Ignore fully transparent pixels
    if (a < 128) continue;
    
    const hex = rgbToHex(r, g, b);
    const hsl = rgbToHsl(r, g, b);
    
    colors.push({ r, g, b, hex, h: hsl.h, s: hsl.s, l: hsl.l });
  }

  // Fallback if no colors found
  if (colors.length === 0) {
    return {
      primary: '#4f46e5',
      vibrant: '#a855f7',
      secondary: '#06b6d4',
      dark: '#0f172a',
      light: '#f8fafc',
      all: ['#4f46e5', '#a855f7', '#06b6d4', '#0f172a', '#f8fafc']
    };
  }

  // 1. Find dominant color (cluster colors that are close together)
  // Let's group colors that are very similar (distance < 35 in RGB space)
  const clusters: Array<{ representative: typeof colors[0]; count: number; colors: typeof colors }> = [];
  
  for (const color of colors) {
    let addedToCluster = false;
    for (const cluster of clusters) {
      if (colorDistance(color, cluster.representative) < 35) {
        cluster.count++;
        cluster.colors.push(color);
        addedToCluster = true;
        break;
      }
    }
    if (!addedToCluster) {
      clusters.push({
        representative: color,
        count: 1,
        colors: [color]
      });
    }
  }

  // Sort clusters by size (most common colors first)
  clusters.sort((a, b) => b.count - a.count);

  // Extract representative colors from top clusters
  const uniqueHexes = new Set<string>();
  const paletteColors: typeof colors = [];

  for (const cluster of clusters) {
    // Average the cluster colors to get a clean representative
    let sumR = 0, sumG = 0, sumB = 0;
    for (const c of cluster.colors) {
      sumR += c.r;
      sumG += c.g;
      sumB += c.b;
    }
    const avgR = Math.round(sumR / cluster.colors.length);
    const avgG = Math.round(sumG / cluster.colors.length);
    const avgB = Math.round(sumB / cluster.colors.length);
    const avgHex = rgbToHex(avgR, avgG, avgB);
    const avgHsl = rgbToHsl(avgR, avgG, avgB);
    
    const representative = {
      r: avgR,
      g: avgG,
      b: avgB,
      hex: avgHex,
      h: avgHsl.h,
      s: avgHsl.s,
      l: avgHsl.l
    };

    if (!uniqueHexes.has(representative.hex)) {
      uniqueHexes.add(representative.hex);
      paletteColors.push(representative);
    }
    if (paletteColors.length >= 10) break; // Get top 10 unique representatives
  }

  // Now, let's select our targeted palette roles:
  // - Primary: The absolute most dominant cluster's representative
  const primary = paletteColors[0]?.hex || '#4f46e5';

  // - Vibrant: The color among all samples with highest saturation, 
  //   preferring mid-lightness (so it's not too dark or washed out)
  let bestVibrant = colors[0];
  let maxVibrancyScore = -1;
  for (const c of colors) {
    // Score based on high saturation, and a sweet spot of lightness (30% to 70%)
    const lFactor = c.l > 30 && c.l < 70 ? 1.0 : 0.4;
    const score = c.s * lFactor;
    if (score > maxVibrancyScore) {
      maxVibrancyScore = score;
      bestVibrant = c;
    }
  }
  const vibrant = bestVibrant?.hex || primary;

  // - Secondary: Another dominant color that is distinct from Primary
  let secondary = primary;
  const primaryRgb = hexToRgb(primary);
  if (primaryRgb) {
    for (let i = 1; i < paletteColors.length; i++) {
      if (colorDistance(paletteColors[i], primaryRgb) > 50) {
        secondary = paletteColors[i].hex;
        break;
      }
    }
  }
  if (secondary === primary && paletteColors.length > 1) {
    secondary = paletteColors[1].hex;
  }

  // - Dark: A deep, rich version of dominant colors, or sample with lowest lightness
  let bestDark = colors[0];
  let minLightness = 100;
  for (const c of colors) {
    // We want a rich dark color (lightness 10% to 25%, and reasonable saturation)
    if (c.l < minLightness && c.l > 8) {
      minLightness = c.l;
      bestDark = c;
    }
  }
  // Ensure it's reasonably dark. If not, make it a darkened version of primary.
  let dark = bestDark?.hex || '#0f172a';
  if (minLightness > 30 && primaryRgb) {
    // Manually darken primary
    const darkR = Math.max(15, Math.round(primaryRgb.r * 0.25));
    const darkG = Math.max(15, Math.round(primaryRgb.g * 0.25));
    const darkB = Math.max(20, Math.round(primaryRgb.b * 0.3));
    dark = rgbToHex(darkR, darkG, darkB);
  }

  // - Light: A soft highlight color, or sample with highest lightness
  let bestLight = colors[0];
  let maxLightness = 0;
  for (const c of colors) {
    if (c.l > maxLightness && c.l < 95) {
      maxLightness = c.l;
      bestLight = c;
    }
  }
  let light = bestLight?.hex || '#f8fafc';
  if (maxLightness < 70 && primaryRgb) {
    // Manually lighten primary
    const lightR = Math.min(245, Math.round(primaryRgb.r + (255 - primaryRgb.r) * 0.7));
    const lightG = Math.min(245, Math.round(primaryRgb.g + (255 - primaryRgb.g) * 0.7));
    const lightB = Math.min(250, Math.round(primaryRgb.b + (255 - primaryRgb.b) * 0.75));
    light = rgbToHex(lightR, lightG, lightB);
  }

  // Final list of 5 colors, nicely distributed
  const finalPalette: string[] = [primary, vibrant, secondary, dark, light];
  
  // Fill any duplicate slots with distinct representatives if possible
  const uniqueFinal = Array.from(new Set(finalPalette));
  while (uniqueFinal.length < 5) {
    let added = false;
    for (const pc of paletteColors) {
      if (!uniqueFinal.includes(pc.hex)) {
        uniqueFinal.push(pc.hex);
        added = true;
        break;
      }
    }
    if (!added) {
      // Add a slightly modified shade of primary if we ran out of unique colors
      const r = Math.round(Math.random() * 20);
      uniqueFinal.push(rgbToHex(Math.min(255, 100 + r), 120, 200));
    }
  }

  return {
    primary: uniqueFinal[0],
    vibrant: uniqueFinal[1],
    secondary: uniqueFinal[2],
    dark: uniqueFinal[3],
    light: uniqueFinal[4],
    all: uniqueFinal.slice(0, 5)
  };
}
