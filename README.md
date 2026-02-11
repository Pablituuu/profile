# Pablituuu Studio | Full-Stack Ecosystem

![Pablituuu Studio Preview](public/video-editor-v2.png)

A state-of-the-art **AI Video Editor** and **Interactive Portfolio** built for the next generation of content creators. This project combines high-performance video rendering with advanced Artificial Intelligence to provide a seamless editing experience.

---

## 🎬 Pablituuu Studio (Video Editor V2)

The centerpiece of this project is a professional-grade web video editor powered by `openvideo` and `Fabric.js`.

### 🚀 Key Features

- **Voice AI Pro**:
  - Integrated with **ElevenLabs**.
  - Advanced search by tags (cartoon, smooth, professional).
  - 22+ premium voices with bilingual (EN/ES) preview system.
  - Text-to-Speech (TTS) and Speech-to-Speech (STS) support.
- **AI Highlights (Clips)**:
  - Powered by **Gemini 2.0 Flash**.
  - Intelligent analysis of long videos (up to 60 minutes).
  - Automatic extraction of viral moments for Shorts/TikTok/Reels.
  - Local pre-processing with **FFmpeg** for maximum precision.
- **AI Auto-Captions**:
  - Speech-to-Text via **Deepgram**.
  - Contextual formatting using Gemini.
  - Real-time "burn-in" previews on the timeline.
- **AI Assets Generator**:
  - Unified interface for generating high-quality images and videos.
  - Multiple visual styles (Realistic, Anime, Cinematic, Cyberpunk, etc.).
  - Reference image support for guided generation.
- **Advanced Timeline Control**:
  - High-precision seeking and frame-by-frame navigation.
  - Multi-track management with smart magnetic alignment.
  - Clip splicing (S), duplicating (D), and zooming (Ctrl+Wheel).

---

## 🛠️ Technology Stack

- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router, Turbopack)
- **Engine**: [openvideo](https://www.designcombo.io/) & [Fabric.js](http://fabricjs.com/)
- **AI Ecosystem**:
  - **Google Gemini**: Video analysis and AI Assistant.
  - **ElevenLabs**: High-fidelity Voice Synthesis.
  - **Deepgram**: Ultra-fast Audio Transcription.
- **Backend & Auth**: [Supabase](https://supabase.com/) (PostgreSQL + RLS + Authentication)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) & [Shadcn UI](https://ui.shadcn.com/)
- **Storage**: [Google Cloud Storage](https://cloud.google.com/storage)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)

---

## 🌍 Global & Accessible

- **Bi-lingual Interface**: Full support for **English** and **Spanish**, including localized AI prompts.
- **Access Control**: Enterprise-grade security with Supabase Auth. AI features are protected by user-level permissions and real-time key validation.
- **Modern UI/UX**: Dark-mode first design with glassmorphism, fluid animations (Framer Motion), and responsive layout.

---

## 📦 Getting Started

1. **Clone the repository**:

   ```bash
   git clone https://github.com/Pablituuu/profile.git
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file with the following keys:

   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...

   # AI APIs
   GOOGLE_GENERATIVE_AI_API_KEY=...
   ELEVENLABS_API_KEY=...
   DEEPGRAM_API_KEY=...

   # Storage (GCS)
   GCS_PROJECT_ID=...
   GCS_CLIENT_EMAIL=...
   GCS_PRIVATE_KEY=...
   ```

4. **Launch Development Environment**:
   ```bash
   npm run dev
   ```

---

## 👤 About the Author

**Pablito Jean Pool Silva Inca**
_Systems & Informatics Engineer | Cybersecurity Specialist | Full-Stack Developer_

- **Location**: Huancayo, Perú
- **LinkedIn**: [Pablito Silva Inca](https://www.linkedin.com/in/pablito-jean-pool-silva-inca-735a03192/)
- **GitHub**: [@Pablituuu](https://github.com/Pablituuu)
- **Portfolio**: [pablituuu.com](https://pablituuu.com)

---

## 📄 License

This project is licensed under the MIT License. Built with ❤️ by Pablito.
