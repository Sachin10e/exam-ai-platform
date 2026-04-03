# 🎓 ExamArena

**ExamArena** is an advanced, AI-powered study platform designed to supercharge student exam preparation. By transforming raw syllabus PDFs and text materials into structured, interactive study plans, it provides students with a pristine, distraction-free environment to focus, learn, and test their knowledge.

## ✨ Key Features

- **🧠 AI-Powered Study Plans**: Utilizing Google's **Gemini Vision API**, ExamArena intelligently parses textbooks, syllabi, and notes to automatically generate exhaustive, structured study paths broken down into manageable units.
- **🎯 Focus Mode**: A hardware-accelerated, distraction-free ambient UI that overrides the standard layout to keep students locked in on their active study materials.
- **📊 Interactive Dashboards & Analytics**: Visual progress tracking, mock exam score averaging, and study streak tracking natively rendered with **Recharts**.
- **⏱️ Integrated Pomodoro Timer**: Built-in time management floating overlay to help maintain deep work blocks. 
- **📈 Mermaid Diagram Rendering**: Support for dynamic, sanitized AI-generated architectural flowcharts and concept webs directly inside study materials.
- **📱 Fully Responsive**: Fluid Grid systems that seamlessly adapt across desktop, tablet, and mobile views without compromising UX constraints.
- **🔒 Secure Authentication**: Robust session security and database architecture handled by **Supabase**.
- **🖨️ Print-Ready Layouts**: Dedicated print stylesheets ensuring that exported 'Handwritten' study notes look flawless on paper or PDF overrides.

## 🛠️ Technology Stack

- **Framework**: Next.js 15 (App Router) & React 19 
- **Language**: TypeScript
- **Styling**: Tailwind CSS, PostCSS, Lucide React (Icons)
- **Backend/Auth**: Supabase (PostgreSQL)
- **AI Integration**: Google Gemini API (`@google/genai`)
- **Visuals**: Recharts (Analytics), Mermaid.js (Diagrams), Framer Motion (Animations)
- **Deployment**: Vercel

## 🚀 Getting Started

### Prerequisites

You need [Node.js](https://nodejs.org/) installed along with a package manager (`npm`, `yarn`, `pnpm`, or `bun`). You will also need active API keys for Supabase and Google Gemini.

### Installation & Environment Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Sachin10e/exam-ai-platform.git
   cd exam-ai-platform
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   Create a `.env.local` file in the root directory and add your keys:
   ```env
   # Supabase Integration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

   # Google Gemini Integration
   GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Run the Development Server:**
   ```bash
   npm run dev
   ```

5. **Open the App:** Navigate to [http://localhost:3000](http://localhost:3000) using your browser to see the result.

## 📁 Repository Quick Glance

- `/app`: Core Next.js App Router paths (Dashboard `page.tsx`, `/arena`, `/chat`, `/history`).
- `/app/api`: Edge and Serverless functions handling explicit AI API requests and validations.
- `/app/components`: Reusable UI modules, layout wrappers, and robust interactive elements.
- `/lib` & `/utils`: Helper classes, analytics parsers, and Supabase client definitions. 

## 🤝 Contributions

Feel free to fork the repository and submit pull requests if you would like to contribute UX enhancements, new AI workflows, or structural adjustments!
