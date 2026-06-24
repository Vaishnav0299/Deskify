# Desify.

A lightweight, lightning-fast web utility that instantly converts vertical mobile wallpapers into widescreen desktop backgrounds. It operates 100% in the browser with zero server latency, zero AI costs, and absolute user privacy.

## 🚀 Key Features

- **Import/Drop Support**: Drag-and-drop or select any high-res mobile portrait wallpaper (up to 50MB).
- **Automated Layout Transformations**:
  - **Cinematic Blur**: Automatically duplicates the background, scales it to cover widescreen, applies high-quality Gaussian-like CSS blurs, and keeps the crisp original version centered.
  - **Color Match**: Instantly samples dominant colors from the image (via a custom canvas grid-sampling method) and builds a matching vibrant radial or linear gradient background.
  - **Solid Match**: Sets a matching dominant color as the background.
- **Micro-Controls**: Adjust blur strength, background dimming overlay, foreground scale, rounded corner radius, shadow blur/opacity, and cinematic vignette.
- **Interactive Compare**: Hold the **"Hold to Compare"** button to instantly toggle between the widescreen template and the original phone portrait crop.
- **Offline High-Res Export**: Uses the native HTML5 Canvas 2D API to stitch, clip, and render flawless high-resolution widescreen outputs (up to 4K/5K and custom lossless height matches) instantly on the client.

## 🎨 Theme & Aesthetic

Designed with the **Bold Typography** theme:
- Heavy display headers with tight letter-spacing (`font-black tracking-tighter`).
- Futuristic custom neon green accents (`#00FF66`).
- Premium dark interface designed with high-density bento grid panels.
- Pure client-side privacy-first branding (looks professional, humble, and completely functional).

## 🛠️ Stack

- **Frontend**: React 18+ & TypeScript
- **Styling**: Tailwind CSS & custom CSS animations
- **Icons**: Lucide React
- **Processing**: Pure HTML5 Canvas (No external API calls or servers)

## 🔒 Security & Privacy

This application is 100% serverless. Your photos never leave your device, meaning absolute privacy and instant offline performance.
