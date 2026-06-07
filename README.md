# G newsMola | Gupta Intelligence

**G newsMola** is a premium, agentic news platform that seamlessly blends real-time global news with deep spiritual wisdom. Powered by the **Gupta Intelligence** engine, it provides users with "Dharma-filtered" clarity, helping them navigate modern media through a lens of verified truth and ancient insights.

## 🌟 Key Features

### 📰 Agentic News Engine
- **Global Perspectives**: Filter news by region (India, USA, UK, etc.) and explore alternative global viewpoints with the "Switch Perspective" tool.
- **AI Verification**: One-click fact-checking for any headline. Get a **Trust Score**, a list of cross-references from reputable outlets (Reuters, BBC, AP), and a definitive verdict.
- **Regional Translation**: Instant AI-powered translation of news into Hindi, Odia, Bhojpuri, and other regional languages using Gemini-backed flows.
- **AI Insights & Briefing**: Generate a professional radio-style news briefing of the top stories, summarized for natural listening.

### 🕉️ Gita Wisdom Hub
- **Verse of the Day**: Handpicked Bhagavad Gita verses in Sanskrit with poetic translations.
- **Divine Interpretation**: AI-powered "Divine Clarity" that provides deep spiritual interpretations and explains the modern-day relevance of each verse.
- **Spiritual Audio**: Integrated text-to-speech that reads the verse meaning, interpretation, and modern relevance in a serene, professional voice.

### 🎙️ Interactive Voice & Intelligence
- **Voice Discovery**: (Beta) Ask natural language questions about the news and receive spoken answers from the Dharma Navigator guide.
- **Forex Intelligence**: Real-time currency exchange rates for global travelers and finance professionals.
- **Gupta Status Monitor**: A real-time rate-limit monitor that tracks AI engine capacity (RPM) to ensure a smooth user experience.

### 📱 Responsive & Professional Design
- **Intelligence Hub**: A dedicated mobile drawer that houses spiritual and technical tools, keeping the news feed entirely unobstructed on small screens.
- **Glassmorphism UI**: A high-fidelity, modern interface built with Tailwind CSS and ShadCN UI.

## 🛠️ Tech Stack
- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router)
- **AI Engine**: [Google Genkit](https://firebase.google.com/docs/genkit) & Gemini 2.5 Flash
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [ShadCN UI](https://ui.shadcn.com/)
- **State Management**: React Hooks (useState, useEffect)
- **Audio**: Browser Native Speech API (Device-agnostic)
- **API Services**: NewsData.io (News), Google Serper (Search), ExchangeRate-API (Forex)

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- A Google Gemini API Key
- NewsData.io and Serper.dev API keys

### Installation
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure your environment variables in `.env`:
   ```env
   GOOGLE_GENAI_API_KEY=your_gemini_key
   NEWS_API_KEY=your_newsdata_key
   SERPER_API_KEY=your_serper_key
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## 📁 Core Directory Structure
- `src/ai/flows/`: Genkit server actions for verification, translation, and interpretation.
- `src/components/`: Core UI components (NewsBriefs, GitaWisdom, GuptaEngine).
- `src/lib/`: Client-side utilities for Browser Speech and layout helpers.
- `src/app/`: Next.js page routing and global theme definitions.

---
*Built with ❤️ to bring clarity to the world.*