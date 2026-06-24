import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  Image as ImageIcon, 
  Download, 
  Sparkles, 
  Maximize2, 
  Sliders, 
  Palette, 
  Check, 
  RefreshCw, 
  FileImage, 
  Monitor, 
  Smartphone, 
  Laptop, 
  Info, 
  ShieldCheck, 
  Eye, 
  ChevronRight,
  SlidersHorizontal,
  FolderOpen
} from 'lucide-react';
import { extractColorPalette, ColorPalette } from './utils/colorExtractor';

// Static Unsplash sample vertical wallpapers
const SAMPLES = [
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    url: 'https://images.unsplash.com/photo-1578894381163-e72c17f2d45f?auto=format&fit=crop&q=80&w=1080',
    description: 'Neon teal & purple street',
  },
  {
    id: 'aesthetic-minimal',
    name: 'Aesthetic Pastel',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1080',
    description: 'Soft lavender & peach geometry',
  },
  {
    id: 'nordic-forest',
    name: 'Nordic Forest',
    url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&q=80&w=1080',
    description: 'Moody emerald forest mist',
  },
  {
    id: 'sunset-horizon',
    name: 'Sunset Horizon',
    url: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&q=80&w=1080',
    description: 'Warm gold & orange ridge',
  }
];

type LayoutMode = 'blur' | 'gradient' | 'solid';
type AspectRatio = '16:9' | '16:10' | '21:9' | '32:9' | '4:3';
type ExportResolution = '1080p' | '1440p' | '4K' | '5K' | 'match-height';
type GradientType = 'linear' | 'radial';

export default function App() {
  // App States
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);
  const [fileName, setFileName] = useState<string>('sample-wallpaper');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('blur');
  
  // Customization States
  const [blurRadius, setBlurRadius] = useState<number>(40);
  const [dimOpacity, setDimOpacity] = useState<number>(25);
  const [foregroundScale, setForegroundScale] = useState<number>(85);
  const [borderRadius, setBorderRadius] = useState<number>(16);
  const [shadowBlur, setShadowBlur] = useState<number>(30);
  const [shadowOpacity, setShadowOpacity] = useState<number>(40);
  const [vignetteOpacity, setVignetteOpacity] = useState<number>(20);
  
  // Gradient specific states
  const [gradientType, setGradientType] = useState<GradientType>('linear');
  const [gradientAngle, setGradientAngle] = useState<number>(135);
  
  // Export states
  const [exportResolution, setExportResolution] = useState<ExportResolution>('4K');
  const [exporting, setExporting] = useState<boolean>(false);
  const [showSuccessToast, setShowSuccessToast] = useState<boolean>(false);
  const [exportedDetails, setExportedDetails] = useState<{ width: number; height: number; filename: string } | null>(null);

  // Drag and drop states
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Color Palette state
  const [palette, setPalette] = useState<ColorPalette>({
    primary: '#4f46e5',
    vibrant: '#ec4899',
    secondary: '#06b6d4',
    dark: '#0f172a',
    light: '#f8fafc',
    all: ['#4f46e5', '#a855f7', '#06b6d4', '#0f172a', '#f8fafc']
  });

  // Selected gradient colors
  const [stop1Color, setStop1Color] = useState<string>('#0f172a');
  const [stop2Color, setStop2Color] = useState<string>('#4f46e5');
  const [solidBgColor, setSolidBgColor] = useState<string>('#0f172a');

  // Compare original modal/popover
  const [isComparing, setIsComparing] = useState<boolean>(false);

  // Load initial sample on startup
  useEffect(() => {
    loadSampleWallpaper(SAMPLES[0].url, SAMPLES[0].name);
  }, []);

  // Set up polyfill for ctx.roundRect for maximum browser compatibility
  useEffect(() => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx && typeof ctx.roundRect !== 'function') {
      // Inline polyfill for older browsers
      (CanvasRenderingContext2D.prototype as any).roundRect = function (
        x: number,
        y: number,
        width: number,
        height: number,
        r: number | number[]
      ) {
        if (typeof r === 'number') r = [r, r, r, r];
        if (r.length === 1) r = [r[0], r[0], r[0], r[0]];
        if (r.length === 2) r = [r[0], r[1], r[0], r[1]];
        if (r.length === 3) r = [r[0], r[1], r[2], r[1]];
        const [tl, tr, br, bl] = r;
        this.beginPath();
        this.moveTo(x + tl, y);
        this.lineTo(x + width - tr, y);
        this.quadraticCurveTo(x + width, y, x + width, y + tr);
        this.lineTo(x + width, y + height - br);
        this.quadraticCurveTo(x + width, y + height, x + width - br, y + height);
        this.lineTo(x + bl, y + height);
        this.quadraticCurveTo(x, y + height, x, y + height - bl);
        this.lineTo(x, y + tl);
        this.quadraticCurveTo(x, y, x + tl, y);
        this.closePath();
        return this;
      };
    }
  }, []);

  // Ratio float values helper
  const getAspectRatioValue = (ratio: AspectRatio): number => {
    switch (ratio) {
      case '16:9': return 16 / 9;
      case '16:10': return 16 / 10;
      case '21:9': return 21 / 9;
      case '32:9': return 32 / 9;
      case '4:3': return 4 / 3;
    }
  };

  // Human descriptive text for ratios
  const getAspectRatioLabel = (ratio: AspectRatio): string => {
    switch (ratio) {
      case '16:9': return '16:9 (Standard Desktop)';
      case '16:10': return '16:10 (MacBook / Pro)';
      case '21:9': return '21:9 (Ultrawide)';
      case '32:9': return '32:9 (Super Ultrawide)';
      case '4:3': return '4:3 (iPad / Slate)';
    }
  };

  // Helper to load sample wallpaper
  const loadSampleWallpaper = (url: string, name: string) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImageElement(img);
      const extracted = extractColorPalette(img);
      setPalette(extracted);
      setStop1Color(extracted.dark);
      setStop2Color(extracted.primary);
      setSolidBgColor(extracted.dark);
      setFileName(name.toLowerCase().replace(/\s+/g, '-'));
    };
    img.src = url;
  };

  // Handle Drag Over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  // Handle Drag Leave
  const handleDragLeave = () => {
    setIsDragging(false);
  };

  // Handle File Drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processUploadedFile(e.dataTransfer.files[0]);
    }
  };

  // Handle File Select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processUploadedFile(e.target.files[0]);
    }
  };

  // Process File to base64 and Image
  const processUploadedFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (.jpg, .png, .webp).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setImageElement(img);
        const extracted = extractColorPalette(img);
        setPalette(extracted);
        // Automatically choose smart matches
        setStop1Color(extracted.dark);
        setStop2Color(extracted.primary);
        setSolidBgColor(extracted.dark);
        // Clean original filename
        const cleanName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        setFileName(cleanName.toLowerCase().replace(/\s+/g, '-'));
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Trigger file click
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Preset quick settings
  const applyPresetConfig = (preset: 'natural' | 'ultra-clean' | 'intense-vibe' | 'cinematic') => {
    switch (preset) {
      case 'natural':
        setBlurRadius(25);
        setDimOpacity(15);
        setForegroundScale(90);
        setBorderRadius(12);
        setShadowBlur(20);
        setShadowOpacity(30);
        setVignetteOpacity(10);
        break;
      case 'ultra-clean':
        setBlurRadius(0);
        setDimOpacity(5);
        setForegroundScale(80);
        setBorderRadius(24);
        setShadowBlur(45);
        setShadowOpacity(35);
        setVignetteOpacity(0);
        setLayoutMode('gradient');
        setGradientType('linear');
        setGradientAngle(135);
        break;
      case 'intense-vibe':
        setBlurRadius(60);
        setDimOpacity(40);
        setForegroundScale(85);
        setBorderRadius(16);
        setShadowBlur(35);
        setShadowOpacity(50);
        setVignetteOpacity(40);
        setLayoutMode('blur');
        break;
      case 'cinematic':
        setBlurRadius(45);
        setDimOpacity(25);
        setForegroundScale(85);
        setBorderRadius(8);
        setShadowBlur(30);
        setShadowOpacity(45);
        setVignetteOpacity(30);
        setLayoutMode('blur');
        break;
    }
  };

  // Extract the current gradient CSS for the preview panel
  const getGradientCSS = () => {
    if (gradientType === 'linear') {
      return `linear-gradient(${gradientAngle}deg, ${stop1Color}, ${stop2Color})`;
    } else {
      return `radial-gradient(circle, ${stop1Color} 0%, ${stop2Color} 100%)`;
    }
  };

  // HIGH RESOLUTION EXPORT RENDERER
  const handleExport = async () => {
    if (!imageElement) return;
    setExporting(true);

    // Short timeout to let the browser show the spinner
    setTimeout(() => {
      try {
        const ratio = getAspectRatioValue(aspectRatio);
        
        // Define base vertical heights for the rendering canvas
        let targetHeight = 2160; // 4K default
        if (exportResolution === '1080p') targetHeight = 1080;
        else if (exportResolution === '1440p') targetHeight = 1440;
        else if (exportResolution === '5K') targetHeight = 2880;
        else if (exportResolution === 'match-height') {
          targetHeight = imageElement.naturalHeight;
        }

        const targetWidth = Math.round(targetHeight * ratio);

        // Create virtual high-res canvas
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          throw new Error('Could not instantiate 2D Canvas context.');
        }

        // Enable high-quality scaling algorithms
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // 1. DRAW BACKGROUND LAYER
        if (layoutMode === 'blur') {
          // Cinematic Blur Mode
          ctx.save();
          // Scale blur radius relative to export resolution (baseline height is 360px for slider calibration)
          const scaledBlur = Math.round(blurRadius * (targetHeight / 360));
          
          if (scaledBlur > 0) {
            ctx.filter = `blur(${scaledBlur}px)`;
          }

          // Draw background covering whole canvas (equivalent to object-cover)
          const imgRatio = imageElement.naturalWidth / imageElement.naturalHeight;
          let drawW = targetWidth;
          let drawH = targetHeight;
          let dx = 0;
          let dy = 0;

          if (ratio > imgRatio) {
            // Screen is wider than image
            drawW = targetWidth * 1.1; // scale up slightly to hide blurred edges bleed
            drawH = drawW / imgRatio;
            dx = (targetWidth - drawW) / 2;
            dy = (targetHeight - drawH) / 2;
          } else {
            // Screen is taller than image
            drawH = targetHeight * 1.1;
            drawW = drawH * imgRatio;
            dx = (targetWidth - drawW) / 2;
            dy = (targetHeight - drawH) / 2;
          }

          // Draw original image stretched as background with blur filter active
          ctx.drawImage(imageElement, dx, dy, drawW, drawH);
          ctx.restore();

        } else if (layoutMode === 'gradient') {
          // Dynamic Gradient Mode
          if (gradientType === 'linear') {
            // Convert angle to coordinates
            const rad = (gradientAngle * Math.PI) / 180;
            const cx = targetWidth / 2;
            const cy = targetHeight / 2;
            const lineLen = Math.sqrt(targetWidth * targetWidth + targetHeight * targetHeight);
            
            const dx = (lineLen / 2) * Math.cos(rad);
            const dy = (lineLen / 2) * Math.sin(rad);

            const x0 = cx - dx;
            const y0 = cy + dy;
            const x1 = cx + dx;
            const y1 = cy - dy;

            const grad = ctx.createLinearGradient(x0, y0, x1, y1);
            grad.addColorStop(0, stop1Color);
            grad.addColorStop(1, stop2Color);
            
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, targetWidth, targetHeight);
          } else {
            // Radial Gradient
            const cx = targetWidth / 2;
            const cy = targetHeight / 2;
            const r0 = 0;
            const r1 = Math.max(targetWidth, targetHeight) * 0.7;

            const grad = ctx.createRadialGradient(cx, cy, r0, cx, cy, r1);
            grad.addColorStop(0, stop1Color);
            grad.addColorStop(1, stop2Color);

            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, targetWidth, targetHeight);
          }
        } else {
          // Solid Color Mode
          ctx.fillStyle = solidBgColor;
          ctx.fillRect(0, 0, targetWidth, targetHeight);
        }

        // 2. APPLY DIM OVERLAY (Only if dimOpacity > 0)
        if (dimOpacity > 0) {
          ctx.fillStyle = `rgba(15, 23, 42, ${dimOpacity / 100})`;
          ctx.fillRect(0, 0, targetWidth, targetHeight);
        }

        // 3. APPLY VIGNETTE LAYER (If vignetteOpacity > 0)
        if (vignetteOpacity > 0) {
          const cx = targetWidth / 2;
          const cy = targetHeight / 2;
          const rInner = Math.min(targetWidth, targetHeight) * 0.3;
          const rOuter = Math.max(targetWidth, targetHeight) * 0.85;

          const vignette = ctx.createRadialGradient(cx, cy, rInner, cx, cy, rOuter);
          vignette.addColorStop(0, 'rgba(0,0,0,0)');
          vignette.addColorStop(1, `rgba(0,0,0,${vignetteOpacity / 100})`);

          ctx.fillStyle = vignette;
          ctx.fillRect(0, 0, targetWidth, targetHeight);
        }

        // 4. DRAW CENTRAL WALLPAPER IMAGE (With optional round clipping & shadow)
        const imgAspect = imageElement.naturalWidth / imageElement.naturalHeight;
        
        // Height of the foreground is scaled relative to the export canvas height
        const fgH = targetHeight * (foregroundScale / 100);
        const fgW = fgH * imgAspect;
        
        // Coordinates to center the foreground card
        const fgX = (targetWidth - fgW) / 2;
        const fgY = (targetHeight - fgH) / 2;

        ctx.save();

        // Standard drop shadow configuration (draw shadow underneath first)
        if (shadowOpacity > 0 && shadowBlur > 0) {
          ctx.shadowColor = `rgba(0, 0, 0, ${shadowOpacity / 100})`;
          ctx.shadowBlur = shadowBlur * (targetHeight / 360);
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = (shadowBlur / 4) * (targetHeight / 360);
        }

        // Clip and draw image inside a rounded rectangle
        const scaledRadius = borderRadius * (targetHeight / 360);
        
        ctx.beginPath();
        if (typeof (ctx as any).roundRect === 'function') {
          (ctx as any).roundRect(fgX, fgY, fgW, fgH, scaledRadius);
        } else {
          // Manual fallback if roundRect is not supported
          ctx.rect(fgX, fgY, fgW, fgH);
        }
        
        // Fill first to cast the shadow perfectly
        ctx.fillStyle = '#000000';
        ctx.fill();
        
        // Remove shadow settings to avoid double-shadowing or blurring inside the image
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // Clip the image draw inside the exact same rounded bounds
        ctx.clip();
        ctx.drawImage(imageElement, fgX, fgY, fgW, fgH);
        
        ctx.restore();

        // 5. TRIGGER BROWSER DOWNLOAD
        const link = document.createElement('a');
        const fileExt = 'png'; // Prefer high fidelity PNG for wallpapers
        const finalName = `${fileName}_desktop_${aspectRatio.replace(':', '_')}.${fileExt}`;
        
        link.download = finalName;
        link.href = canvas.toDataURL(`image/${fileExt}`, 0.95);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Success notification state
        setExportedDetails({
          width: targetWidth,
          height: targetHeight,
          filename: finalName
        });
        setShowSuccessToast(true);

      } catch (err) {
        console.error('Error rendering high-res desktop wallpaper:', err);
        alert('An error occurred during wallpaper render. Please try another sample or format.');
      } finally {
        setExporting(false);
      }
    }, 150);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans antialiased pb-16 selection:bg-[#00FF66]/30 selection:text-white">
      
      {/* Main Header */}
      <header className="max-w-7xl mx-auto px-6 pt-12 pb-6 flex flex-col sm:flex-row items-baseline justify-between gap-6 border-b border-white/10">
        <div>
          <h1 className="text-6xl md:text-7xl font-black tracking-tighter leading-none m-0 uppercase font-display text-white">
            DESIFY<span className="text-[#00FF66]">.</span>
          </h1>
        </div>
      </header>

      {/* Main Grid Workspace */}
      <main className="max-w-7xl mx-auto px-6 mt-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* LEFT COLUMN: Controls and Actions */}
        <div className="lg:col-span-5 flex flex-col gap-8">
          
          {/* Section: Upload or Choose Samples */}
          <section className="bg-white/5 border border-white/10 hover:border-white/15 p-6 rounded-3xl flex flex-col gap-5 transition-all duration-300">
            <h2 className="font-display font-black text-white text-sm uppercase tracking-wider flex items-center gap-2.5">
              <FolderOpen className="h-4.5 w-4.5 text-[#00FF66]" />
              1. Import Portrait Image
            </h2>

            {/* Drop Zone */}
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={triggerFileInput}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 relative group flex flex-col items-center justify-center ${
                isDragging 
                  ? 'border-[#00FF66] bg-[#00FF66]/5' 
                  : 'border-white/10 bg-white/5 hover:bg-white/[0.08] hover:border-white/30'
              }`}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange}
                accept="image/*" 
                className="hidden" 
              />
              
              <div className="bg-white/5 text-[#00FF66] border border-white/25 p-4 rounded-full group-hover:scale-110 group-hover:border-[#00FF66]/50 transition-all duration-300 shadow-sm">
                <Upload className="h-6 w-6" />
              </div>

              <div className="mt-4">
                <p className="text-sm font-semibold text-slate-100 uppercase tracking-wider">
                  Drag & drop your wallpaper
                </p>
                <p className="text-xs text-slate-400 mt-1 font-mono">
                  SUPPORTS JPG, PNG, WEBP, OR HEIC
                </p>
              </div>

              <button 
                type="button" 
                className="mt-5 px-5 py-2.5 bg-[#00FF66] hover:bg-[#00e55c] text-black text-xs font-black uppercase tracking-widest rounded-xl shadow-md transition-all duration-200"
              >
                Browse Local File
              </button>
            </div>

            {/* Quick Presets / Try with Samples */}
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 font-mono">
                TRY INSTANTLY WITH SAMPLES:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {SAMPLES.map((sample) => {
                  const isActive = imageElement?.src === sample.url;
                  return (
                    <button
                      key={sample.id}
                      onClick={() => loadSampleWallpaper(sample.url, sample.name)}
                      className={`relative aspect-[9/16] rounded-xl overflow-hidden border text-left group transition-all duration-300 ${
                        isActive 
                          ? 'ring-2 ring-[#00FF66] border-transparent shadow-md' 
                          : 'border-white/10 hover:border-white/30'
                      }`}
                    >
                      <img 
                        src={sample.url} 
                        alt={sample.name} 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/40 to-transparent p-2">
                        <p className="text-[10px] font-mono font-bold text-white truncate">{sample.name}</p>
                      </div>
                      {isActive && (
                        <div className="absolute top-1.5 right-1.5 bg-[#00FF66] text-black p-0.5 rounded-full shadow-sm">
                          <Check className="h-3 w-3 stroke-[3px]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Section: Layout Mode Selector */}
          <section className="bg-white/5 border border-white/10 hover:border-white/15 p-6 rounded-3xl flex flex-col gap-5 transition-all duration-300">
            <h2 className="font-display font-black text-white text-sm uppercase tracking-wider flex items-center gap-2.5">
              <Palette className="h-4.5 w-4.5 text-[#00FF66]" />
              2. Choose Background Style
            </h2>

            {/* Layout mode buttons */}
            <div className="grid grid-cols-3 gap-2 p-1 bg-white/5 rounded-2xl border border-white/10">
              <button
                onClick={() => setLayoutMode('blur')}
                className={`py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-200 flex flex-col items-center gap-1.5 cursor-pointer ${
                  layoutMode === 'blur'
                    ? 'bg-[#00FF66] text-black shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ImageIcon className="h-4.5 w-4.5" />
                <span>Blur</span>
              </button>
              
              <button
                onClick={() => setLayoutMode('gradient')}
                className={`py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-200 flex flex-col items-center gap-1.5 cursor-pointer ${
                  layoutMode === 'gradient'
                    ? 'bg-[#00FF66] text-black shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles className="h-4.5 w-4.5" />
                <span>Gradient</span>
              </button>

              <button
                onClick={() => setLayoutMode('solid')}
                className={`py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-200 flex flex-col items-center gap-1.5 cursor-pointer ${
                  layoutMode === 'solid'
                    ? 'bg-[#00FF66] text-black shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <div className="w-4 h-4 rounded border border-white/20" style={{ backgroundColor: solidBgColor }} />
                <span>Solid</span>
              </button>
            </div>

            {/* Sub-controls based on Layout Mode */}
            {layoutMode === 'blur' && (
              <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-slate-300">Background Blur Strength</span>
                    <span className="text-xs font-mono font-bold text-[#00FF66] bg-[#00FF66]/10 px-2 py-0.5 rounded border border-[#00FF66]/20">
                      {blurRadius}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="80"
                    value={blurRadius}
                    onChange={(e) => setBlurRadius(parseInt(e.target.value))}
                    className="w-full cursor-ew-resize h-1.5 bg-white/10 rounded-lg appearance-none"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>None</span>
                    <span>Soft</span>
                    <span>Heavy</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-slate-300">Background Dimming</span>
                    <span className="text-xs font-mono font-bold text-[#00FF66] bg-[#00FF66]/10 px-2 py-0.5 rounded border border-[#00FF66]/20">
                      {dimOpacity}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="90"
                    value={dimOpacity}
                    onChange={(e) => setDimOpacity(parseInt(e.target.value))}
                    className="w-full cursor-ew-resize h-1.5 bg-white/10 rounded-lg appearance-none"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>Bright</span>
                    <span>Subtle Shade</span>
                    <span>Dark</span>
                  </div>
                </div>
              </div>
            )}

            {layoutMode === 'gradient' && (
              <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex flex-col gap-4">
                
                {/* Gradient Type Toggles */}
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs font-semibold text-slate-300">Gradient Shape</span>
                  <div className="flex bg-white/5 p-0.5 rounded-xl border border-white/10">
                    <button
                      onClick={() => setGradientType('linear')}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                        gradientType === 'linear' ? 'bg-[#00FF66] text-black shadow-sm' : 'text-slate-400'
                      }`}
                    >
                      Linear
                    </button>
                    <button
                      onClick={() => setGradientType('radial')}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                        gradientType === 'radial' ? 'bg-[#00FF66] text-black shadow-sm' : 'text-slate-400'
                      }`}
                    >
                      Radial
                    </button>
                  </div>
                </div>

                {/* Gradient Angle (Only for linear) */}
                {gradientType === 'linear' && (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-slate-300">Gradient Angle</span>
                      <span className="text-xs font-mono font-bold text-[#00FF66] bg-[#00FF66]/10 px-2 py-0.5 rounded border border-[#00FF66]/20">
                        {gradientAngle}°
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={gradientAngle}
                      onChange={(e) => setGradientAngle(parseInt(e.target.value))}
                      className="w-full cursor-ew-resize h-1.5 bg-white/10 rounded-lg appearance-none"
                    />
                  </div>
                )}

                {/* Palette color selection for gradient stops */}
                <div className="flex flex-col gap-2.5">
                  <span className="text-xs font-semibold text-slate-300">Assign Sampled Colors to Gradient</span>
                  
                  {/* Swatch Picker Row */}
                  <div className="flex items-center gap-2.5 py-1">
                    {palette.all.map((color, idx) => {
                      const isStop1 = stop1Color === color;
                      const isStop2 = stop2Color === color;
                      return (
                        <div key={idx} className="flex flex-col items-center gap-1.5 flex-1">
                          <div 
                            className="w-full aspect-square rounded-lg border border-white/20 shadow-sm relative"
                            style={{ backgroundColor: color }}
                          />
                          <div className="flex gap-1">
                            <button
                              onClick={() => setStop1Color(color)}
                              title="Set Stop 1"
                              className={`w-5 h-5 rounded text-[9px] font-extrabold flex items-center justify-center border transition-all ${
                                isStop1 
                                  ? 'bg-[#00FF66] border-[#00FF66] text-black shadow-sm' 
                                  : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/30'
                              }`}
                            >
                              S1
                            </button>
                            <button
                              onClick={() => setStop2Color(color)}
                              title="Set Stop 2"
                              className={`w-5 h-5 rounded text-[9px] font-extrabold flex items-center justify-center border transition-all ${
                                isStop2 
                                  ? 'bg-[#00FF66] border-[#00FF66] text-black shadow-sm' 
                                  : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/30'
                              }`}
                            >
                              S2
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-white/10">
                  <span className="text-xs font-semibold text-slate-300">Background Dimming</span>
                  <span className="text-xs font-mono font-bold text-[#00FF66] bg-[#00FF66]/10 px-2 py-0.5 rounded border border-[#00FF66]/20">
                    {dimOpacity}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="90"
                  value={dimOpacity}
                  onChange={(e) => setDimOpacity(parseInt(e.target.value))}
                  className="w-full cursor-ew-resize h-1.5 bg-white/10 rounded-lg appearance-none"
                />
              </div>
            )}

            {layoutMode === 'solid' && (
              <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex flex-col gap-4">
                <span className="text-xs font-semibold text-slate-300">Pick Dominant Background Color</span>
                
                <div className="grid grid-cols-5 gap-2.5">
                  {palette.all.map((color, idx) => {
                    const isSelected = solidBgColor === color;
                    return (
                      <button
                        key={idx}
                        onClick={() => setSolidBgColor(color)}
                        className={`aspect-square rounded-xl relative border transition-all duration-200 hover:scale-105 ${
                          isSelected 
                            ? 'ring-2 ring-[#00FF66] border-transparent shadow-md' 
                            : 'border-white/10 shadow-sm'
                        }`}
                        style={{ backgroundColor: color }}
                      >
                        {isSelected && (
                          <div className="absolute inset-0 m-auto w-5 h-5 bg-[#00FF66] text-black rounded-full flex items-center justify-center shadow-md">
                            <Check className="h-3 w-3 stroke-[3px]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-white/10">
                  <span className="text-xs font-semibold text-slate-300">Background Dimming</span>
                  <span className="text-xs font-mono font-bold text-[#00FF66] bg-[#00FF66]/10 px-2 py-0.5 rounded border border-[#00FF66]/20">
                    {dimOpacity}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="90"
                  value={dimOpacity}
                  onChange={(e) => setDimOpacity(parseInt(e.target.value))}
                  className="w-full cursor-ew-resize h-1.5 bg-white/10 rounded-lg appearance-none"
                />
              </div>
            )}
          </section>

          {/* Section: Image Fine-Tuning */}
          <section className="bg-white/5 border border-white/10 hover:border-white/15 p-6 rounded-3xl flex flex-col gap-5 transition-all duration-300">
            <h2 className="font-display font-black text-white text-sm uppercase tracking-wider flex items-center gap-2.5">
              <SlidersHorizontal className="h-4.5 w-4.5 text-[#00FF66]" />
              3. Fine-Tune Details
            </h2>

            {/* Quick Presets row */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">FINE-TUNING PRESETS:</span>
              <div className="grid grid-cols-4 gap-1.5">
                <button 
                  type="button"
                  onClick={() => applyPresetConfig('natural')}
                  className="py-1.5 text-[10px] font-black uppercase tracking-wider bg-white/5 hover:bg-white/10 text-slate-200 rounded-lg border border-white/10 hover:border-white/20 transition-all cursor-pointer"
                >
                  Natural
                </button>
                <button 
                  type="button"
                  onClick={() => applyPresetConfig('natural')} // to ensure safe fallback or no-op on clicks
                  onMouseDown={() => applyPresetConfig('ultra-clean')}
                  className="py-1.5 text-[10px] font-black uppercase tracking-wider bg-white/5 hover:bg-white/10 text-slate-200 rounded-lg border border-white/10 hover:border-white/20 transition-all cursor-pointer"
                >
                  Minimalist
                </button>
                <button 
                  type="button"
                  onClick={() => applyPresetConfig('natural')}
                  onMouseDown={() => applyPresetConfig('intense-vibe')}
                  className="py-1.5 text-[10px] font-black uppercase tracking-wider bg-white/5 hover:bg-white/10 text-slate-200 rounded-lg border border-white/10 hover:border-white/20 transition-all cursor-pointer"
                >
                  Neon Vibe
                </button>
                <button 
                  type="button"
                  onClick={() => applyPresetConfig('natural')}
                  onMouseDown={() => applyPresetConfig('cinematic')}
                  className="py-1.5 text-[10px] font-black uppercase tracking-wider bg-white/5 hover:bg-white/10 text-slate-200 rounded-lg border border-white/10 hover:border-white/20 transition-all cursor-pointer"
                >
                  Cinematic
                </button>
              </div>
            </div>

            <div className="space-y-4 pt-2 border-t border-white/10">
              
              {/* Foreground Scale */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-300">Foreground Wallpaper Scale</span>
                  <span className="text-xs font-mono font-bold text-[#00FF66] bg-[#00FF66]/10 px-2 py-0.5 rounded border border-[#00FF66]/20">
                    {foregroundScale}%
                  </span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="100"
                  value={foregroundScale}
                  onChange={(e) => setForegroundScale(parseInt(e.target.value))}
                  className="w-full cursor-ew-resize h-1.5 bg-white/10 rounded-lg appearance-none"
                />
              </div>

              {/* Corner Roundness */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-300">Wallpaper Corner Roundness</span>
                  <span className="text-xs font-mono font-bold text-[#00FF66] bg-[#00FF66]/10 px-2 py-0.5 rounded border border-[#00FF66]/20">
                    {borderRadius}px
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="48"
                  value={borderRadius}
                  onChange={(e) => setBorderRadius(parseInt(e.target.value))}
                  className="w-full cursor-ew-resize h-1.5 bg-white/10 rounded-lg appearance-none"
                />
              </div>

              {/* Shadow Intensity and Blur */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-slate-300">Shadow Blur</span>
                    <span className="text-xs font-mono font-bold text-[#00FF66] bg-[#00FF66]/10 px-1.5 py-0.5 rounded text-[10px] border border-[#00FF66]/20">
                      {shadowBlur}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="80"
                    value={shadowBlur}
                    onChange={(e) => setShadowBlur(parseInt(e.target.value))}
                    className="w-full cursor-ew-resize h-1.5 bg-white/10 rounded-lg appearance-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-slate-300">Shadow Opacity</span>
                    <span className="text-xs font-mono font-bold text-[#00FF66] bg-[#00FF66]/10 px-1.5 py-0.5 rounded text-[10px] border border-[#00FF66]/20">
                      {shadowOpacity}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={shadowOpacity}
                    onChange={(e) => setShadowOpacity(parseInt(e.target.value))}
                    className="w-full cursor-ew-resize h-1.5 bg-white/10 rounded-lg appearance-none"
                  />
                </div>
              </div>

              {/* Vignette effect */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-300">Cinematic Vignette Opacity</span>
                  <span className="text-xs font-mono font-bold text-[#00FF66] bg-[#00FF66]/10 px-2 py-0.5 rounded border border-[#00FF66]/20">
                    {vignetteOpacity}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={vignetteOpacity}
                  onChange={(e) => setVignetteOpacity(parseInt(e.target.value))}
                  className="w-full cursor-ew-resize h-1.5 bg-white/10 rounded-lg appearance-none"
                />
              </div>

            </div>
          </section>

        </div>

        {/* RIGHT COLUMN: Desktop Workspace & Live Preview */}
        <div className="lg:col-span-7 flex flex-col gap-8">
          
          {/* Main Visualizer Stage */}
          <section className="bg-white/5 border border-white/10 hover:border-white/15 p-6 rounded-3xl flex flex-col gap-5 transition-all duration-300">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-black text-white text-sm uppercase tracking-wider flex items-center gap-2.5">
                <Monitor className="h-4.5 w-4.5 text-[#00FF66]" />
                Studio Preview Stage
              </h2>

              {/* Interactive Quick Compare toggle */}
              <div className="flex items-center gap-2">
                <button
                  onMouseDown={() => setIsComparing(true)}
                  onMouseUp={() => setIsComparing(false)}
                  onMouseLeave={() => setIsComparing(false)}
                  onTouchStart={() => setIsComparing(true)}
                  onTouchEnd={() => setIsComparing(false)}
                  className="px-4 py-2 text-xs font-black uppercase tracking-wider bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 rounded-xl transition-all duration-200 flex items-center gap-1.5 select-none active:scale-95 cursor-pointer"
                  title="Click and hold to compare with the original vertical wallpaper"
                >
                  <Eye className="h-4 w-4" />
                  <span>Hold to Compare</span>
                </button>
              </div>
            </div>

            {/* Desktop Screen Frame Mockup */}
            <div className="relative bg-[#090909] border border-white/10 rounded-2xl p-6 sm:p-10 flex flex-col items-center justify-center overflow-hidden min-h-[300px]">
              
              {/* Dot grid subtle background */}
              <div className="absolute inset-0 pointer-events-none opacity-15" style={{
                backgroundImage: 'radial-gradient(#ffffff 1.5px, transparent 1.5px)',
                backgroundSize: '16px 16px'
              }} />

              {/* Dynamic aspect-ratio wrapper rendering */}
              <div 
                className="w-full max-w-full relative rounded-xl overflow-hidden border border-white/10 shadow-2xl transition-all duration-500 ease-out"
                style={{ 
                  aspectRatio: getAspectRatioValue(aspectRatio),
                  maxHeight: '440px'
                }}
              >
                {imageElement ? (
                  <>
                    {/* Live Render Area */}
                    <div className="absolute inset-0 w-full h-full select-none overflow-hidden">
                      
                      {/* Original image as widescreen blurred background (if blur mode active) */}
                      {layoutMode === 'blur' && (
                        <div className="absolute inset-0 w-full h-full overflow-hidden">
                          <img 
                            src={imageElement.src} 
                            alt="blurred bg" 
                            className="absolute w-full h-full object-cover origin-center scale-110"
                            style={{
                              filter: `blur(${blurRadius / 2}px) brightness(${100 - dimOpacity}%)`
                            }}
                          />
                        </div>
                      )}

                      {/* Gradient matching background */}
                      {layoutMode === 'gradient' && (
                        <div 
                          className="absolute inset-0 w-full h-full transition-all duration-300"
                          style={{
                            background: getGradientCSS()
                          }}
                        />
                      )}

                      {/* Solid matching background */}
                      {layoutMode === 'solid' && (
                        <div 
                          className="absolute inset-0 w-full h-full transition-all duration-300"
                          style={{
                            backgroundColor: solidBgColor
                          }}
                        />
                      )}

                      {/* Extra dim overlay if using color/gradient modes */}
                      {layoutMode !== 'blur' && dimOpacity > 0 && (
                        <div 
                          className="absolute inset-0 w-full h-full transition-all duration-300"
                          style={{
                            backgroundColor: `rgba(15, 23, 42, ${dimOpacity / 100})`
                          }}
                        />
                      )}

                      {/* Vignette Shader overlay */}
                      {vignetteOpacity > 0 && (
                        <div 
                          className="absolute inset-0 w-full h-full pointer-events-none"
                          style={{
                            background: `radial-gradient(circle, transparent 40%, rgba(0,0,0,${vignetteOpacity / 100}) 100%)`
                          }}
                        />
                      )}

                      {/* Central Crisp Foreground Phone Wallpaper */}
                      <div 
                        className="absolute inset-0 m-auto flex items-center justify-center transition-all duration-300"
                        style={{
                          height: `${foregroundScale}%`,
                          aspectRatio: imageElement.naturalWidth / imageElement.naturalHeight,
                          maxHeight: '100%'
                        }}
                      >
                        <img 
                          src={imageElement.src} 
                          alt="crisp foreground" 
                          className="w-full h-full object-cover transition-all duration-300 select-none"
                          style={{
                            borderRadius: `${borderRadius}px`,
                            boxShadow: `0px ${shadowBlur / 4}px ${shadowBlur}px rgba(0, 0, 0, ${shadowOpacity / 100})`
                          }}
                        />
                      </div>

                    </div>

                    {/* Compare Overlay Mode (Instant reveal on click-hold) */}
                    {isComparing && (
                      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 z-20">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#00FF66] bg-black/80 px-2.5 py-1 rounded mb-4 border border-white/10">
                          Original Phone Crop
                        </span>
                        <div className="h-5/6 aspect-[9/16] rounded-xl overflow-hidden border border-white/20 shadow-xl bg-[#050505]">
                          <img 
                            src={imageElement.src} 
                            alt="Original vertical" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  // Empty State inside monitor mockup
                  <div className="absolute inset-0 bg-[#0c0c0c] flex flex-col items-center justify-center text-slate-500 p-6 text-center">
                    <ImageIcon className="h-8 w-8 text-slate-700 animate-pulse mb-3" />
                    <p className="text-sm font-semibold text-slate-300">No Image Imported</p>
                    <p className="text-xs text-slate-500 mt-1">Upload a vertical image on the left to see preview</p>
                  </div>
                )}
              </div>

              {/* Mock desktop monitor stand foot */}
              <div className="w-24 h-2.5 bg-white/10 rounded-t-lg mt-3 shadow-sm border-t border-white/5" />
              <div className="w-36 h-1 bg-white/5 rounded-full" />
            </div>

            {/* Stage Quick Aspect Ratio Selectors */}
            <div className="flex flex-col gap-3">
              <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">Choose Workspace Monitor Aspect Ratio:</span>
              <div className="flex flex-wrap gap-2">
                {(['16:9', '16:10', '21:9', '32:9', '4:3'] as AspectRatio[]).map((ratio) => {
                  const isActive = aspectRatio === ratio;
                  return (
                    <button
                      key={ratio}
                      onClick={() => setAspectRatio(ratio)}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition-all border cursor-pointer ${
                        isActive 
                          ? 'bg-[#00FF66] border-[#00FF66] text-black shadow-md' 
                          : 'bg-white/5 border-white/10 text-slate-300 hover:border-white/20 hover:bg-white/10'
                      }`}
                    >
                      {ratio}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-[#00FF66] font-mono">
                ACTIVE MONITOR STANDARD: {getAspectRatioLabel(aspectRatio)}
              </p>
            </div>
          </section>

          {/* Section: Export & Instant Download */}
          <section className="bg-white/5 border border-white/10 hover:border-white/15 p-6 rounded-3xl flex flex-col gap-5 transition-all duration-300">
            <h2 className="font-display font-black text-white text-sm uppercase tracking-wider flex items-center gap-2.5">
              <Download className="h-4.5 w-4.5 text-[#00FF66]" />
              4. Choose Resolution & Export
            </h2>

            {/* Resolution selectors */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {[
                { key: '1080p', label: '1080p HD', desc: '1920 × 1080' },
                { key: '1440p', label: '1440p QHD', desc: '2560 × 1440' },
                { key: '4K', label: '4K Ultra', desc: '3840 × 2160' },
                { key: '5K', label: '5K Retina', desc: '5120 × 2880' },
                { key: 'match-height', label: 'Source Fit', desc: 'Keep Height' }
              ].map((res) => {
                const isActive = exportResolution === res.key;
                return (
                  <button
                    key={res.key}
                    type="button"
                    onClick={() => setGradientType(gradientType)} // no-op to force re-render test if needed
                    onMouseDown={() => setExportResolution(res.key as ExportResolution)}
                    className={`p-3 rounded-xl border text-center transition-all flex flex-col justify-center items-center gap-0.5 cursor-pointer ${
                      isActive 
                        ? 'bg-[#00FF66]/10 border-[#00FF66] text-[#00FF66] ring-1 ring-[#00FF66] shadow-sm' 
                        : 'bg-white/5 border-white/10 text-slate-300 hover:border-white/20 hover:bg-white/10'
                    }`}
                  >
                    <span className="text-xs font-black uppercase tracking-wider block">{res.label}</span>
                    <span className="text-[9px] font-mono opacity-80 block">{res.desc}</span>
                  </button>
                );
              })}
            </div>

            {/* Notice about high resolution capabilities */}
            <div className="bg-white/5 p-4 rounded-xl border border-white/10 flex items-start gap-2.5">
              <Info className="h-4.5 w-4.5 text-[#00FF66] shrink-0 mt-0.5" />
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                {exportResolution === 'match-height' ? (
                  <span><strong>Source Height-Match Mode Enabled:</strong> The output width is automatically computed using the exact original portrait wallpaper height. This achieves a 100% pixel-perfect lossless widescreen desktop render.</span>
                ) : (
                  <span><strong>High-Fidelity Rendering:</strong> Wallpapers are stitched together and exported as an uncompressed high-resolution PNG file. No servers are used; everything is computed instantly in browser memory.</span>
                )}
              </p>
            </div>

            {/* Export Action Button */}
            <button
              onClick={handleExport}
              disabled={exporting || !imageElement}
              className={`w-full py-4.5 px-6 rounded-2xl font-display font-black text-sm tracking-widest uppercase shadow-lg flex items-center justify-center gap-2.5 transition-all duration-300 border ${
                !imageElement 
                  ? 'bg-white/5 border-white/10 text-slate-500 cursor-not-allowed' 
                  : exporting 
                    ? 'bg-[#00FF66]/50 border-[#00FF66] text-black cursor-wait' 
                    : 'bg-[#00FF66] hover:bg-[#00e55c] hover:scale-[1.01] border-[#00FF66] text-black cursor-pointer active:scale-[0.99] glow-neon'
              }`}
            >
              {exporting ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin text-black" />
                  <span>Stitching Visual Layers...</span>
                </>
              ) : (
                <>
                  <Download className="h-5 w-5" />
                  <span>Stitch & Download Wallpaper</span>
                </>
              )}
            </button>
          </section>

          {/* Success Toast / Modal */}
          {showSuccessToast && exportedDetails && (
            <div className="bg-emerald-950/30 border border-emerald-500/30 p-5 rounded-2xl flex items-start gap-3.5 shadow-sm relative overflow-hidden animate-fade-in-down">
              <div className="bg-emerald-500 text-black p-2 rounded-lg shadow-sm">
                <Check className="h-4.5 w-4.5 stroke-[3px]" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-display">Wallpaper Exported Successfully!</h3>
                <p className="text-xs text-slate-300 mt-1 font-medium leading-relaxed">
                  Your new widescreen wallpaper <strong className="font-mono text-[10px] bg-white/10 px-1 py-0.5 rounded text-[#00FF66]">{exportedDetails.filename}</strong> was rendered at <strong className="font-bold">{exportedDetails.width} × {exportedDetails.height} px</strong> and downloaded instantly.
                </p>
              </div>
              <button 
                onClick={() => setShowSuccessToast(false)}
                className="text-emerald-400 hover:text-emerald-300 text-xs font-black uppercase px-2.5 py-1 hover:bg-emerald-500/10 rounded-md transition-all self-start cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

        </div>

      </main>

      {/* Footer Branding and Quality Assurances */}
      <footer className="max-w-7xl mx-auto px-6 mt-16 grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12 border-t border-white/10 pt-10">
        <div className="space-y-1.5">
          <p className="text-[10px] font-mono text-[#00FF66] tracking-widest uppercase">01. SECURITY</p>
          <p className="text-xs leading-relaxed opacity-60">Processing occurs 100% in-browser. Your imagery never touches a server.</p>
        </div>
        <div className="space-y-1.5">
          <p className="text-[10px] font-mono text-[#00FF66] tracking-widest uppercase">02. SPEED</p>
          <p className="text-xs leading-relaxed opacity-60">Powered by native HTML5 Canvas rendering for sub-second exports.</p>
        </div>
        <div className="space-y-1.5">
          <p className="text-[10px] font-mono text-[#00FF66] tracking-widest uppercase">03. COLOR MATCH</p>
          <p className="text-xs leading-relaxed opacity-60">Automated palette extraction ensures perfect desktop background harmony.</p>
        </div>
        <div className="space-y-1.5">
          <p className="text-[10px] font-mono text-[#00FF66] tracking-widest uppercase">04. OPEN SOURCE</p>
          <p className="text-xs leading-relaxed opacity-60">A lightweight utility built for the web community. Free forever.</p>
        </div>
      </footer>
    </div>
  );
}
