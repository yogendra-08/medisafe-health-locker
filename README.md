# MediSafe - Your AI-Powered Health Record Locker

MediSafe is a modern, secure, and intelligent web application designed to help you manage your personal medical records. Built with a cutting-edge tech stack, it allows you to upload, analyze, and share your health documents with ease. The integrated AI assistant provides summaries, identifies key medical terms, and allows you to "chat" with your health history.

## ✨ Key Features

- **🔒 Secure User Authentication:** Full login and registration system powered by Firebase Authentication.
- **📄 AI-Powered Document Analysis:** Upload an image of a medical report (e.g., blood test), and the app uses OCR to extract text. Genkit with Google's AI then automatically generates a concise summary and relevant tags.
- **🧬 AI Health Insights:** The AI scans the document for specific medical terms and values, providing neutral, informational observations (e.g., "Hemoglobin: 8 g/dL - This value may be outside the typical reference range.").
- **🤖 Interactive AI Assistant:** A chat interface where you can ask natural language questions about your uploaded documents (e.g., "Summarize my last blood test").
- **🛡️ Secure, Time-Bound Sharing:** Generate secure links for your documents that can expire after a set time or a specific number of views. All access is logged.
- **⚕️ Emergency Profile & QR Code:** Create a vital health profile with your blood group, allergies, and emergency contact. Generate a QR code that links to this public-facing profile for first responders.
- **📱 Progressive Web App (PWA):** Installable on mobile devices for a native-like experience and offline access capabilities.
- **🌐 Multilingual Support:** Foundational support for English and Hindi.

## 🛠️ Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (with App Router)
- **UI Library:** [React](https://react.dev/) & [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) & [ShadCN UI](https://ui.shadcn.com/)
- **AI Integration:** [Genkit](https://firebase.google.com/docs/genkit) with [Google AI (Gemini)](https://ai.google.dev/)
- **Backend & Database:** [Firebase](https://firebase.google.com/) (Authentication, Firestore)
- **File Storage:** [Supabase](https://supabase.com/) (for PDFs and images)
- **Deployment:** Ready for [Firebase App Hosting](https://firebase.google.com/docs/app-hosting)

## 🚀 Getting Started

### 1. Prerequisites

- Node.js (v18 or later)
- An active Firebase project
- A Supabase account (for file storage)

### 2. Firebase Setup

This project requires Firebase for authentication, database, and Genkit AI functionality.

1.  Create a project on the [Firebase Console](https://console.firebase.google.com/).
2.  Enable **Authentication** (with Email/Password provider), **Firestore**, and **Storage**.
3.  Go to your Project Settings and copy your web app's Firebase configuration.
4.  Create a file named `.env.local` in the root of the project.
5.  Add your Firebase credentials to `.env.local`:

    ```env
    NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
    NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
    ```

### 3. Supabase Setup (File Storage)

1.  Follow the detailed setup guide in [`SUPABASE_SETUP.md`](./SUPABASE_SETUP.md)
2.  Add your Supabase credentials to `.env.local`:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

### 4. Genkit Setup (Google AI)

1.  In the Google AI Studio, get a Gemini API key.
2.  Add the key to your `.env.local` file:
    ```env
    GEMINI_API_KEY=your_gemini_api_key
    ```
    
### 5. Installation and Running the App

1.  **Install dependencies:**
    ```bash
    npm install
    ```
2.  **Run the development server:**
    ```bash
    npm run dev
    ```

The application will now be running on `http://localhost:9002`.

---

## ✅ Configuration & Integration Status

- All configuration and integration steps for Firebase, Supabase, and Genkit are **complete**.
- The app will self-validate configuration at runtime and show errors/warnings if anything is missing.
- See `SUPABASE_SETUP.md` for detailed Supabase setup instructions.
- See `env.example` for a sample environment variable file.

---

## 👥 Team Members

- Yogendra Bhange
- Yash Dudhe
- Prathmesh Saharkar
- Gaurav Nikhade
