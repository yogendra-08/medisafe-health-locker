# 🏥 MediSafe - Your AI-Powered Health Record Locker

<div align="center">


*Secure • Intelligent • User-Friendly*

[![Next.js](https://img.shields.io/badge/Next.js-15.3.3-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18.3.1-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.1-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-11.9.1-orange?style=for-the-badge&logo=firebase)](https://firebase.google.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Latest-green?style=for-the-badge&logo=supabase)](https://supabase.com/)

A modern, secure, and intelligent web application designed to revolutionize personal medical record management with cutting-edge AI technology.

</div>

---

## 🚀 Live Demo

**https://medisafe-locker.netlify.app/**

---

## ✨ Key Features

### 🔐 *Security & Authentication*
- *🔒 Secure User Authentication* - Firebase-powered login and registration system
- *🛡 Encrypted File Storage* - Supabase storage with secure access controls
- *⏰ Time-Bound Sharing* - Generate secure links with expiration times
- *📊 Access Logging* - Track all document access and sharing activities

### 🤖 *AI-Powered Intelligence*
- *📄 Smart Document Analysis* - OCR technology extracts text from medical reports
- *🧠 AI-Generated Summaries* - Google AI (Gemini) creates concise document summaries
- *🏷 Intelligent Tagging* - Automatic tag suggestions based on document content
- *💬 Interactive AI Assistant* - Chat with your health history using natural language
- *🔬 Health Insights* - AI identifies medical terms and provides neutral observations

### 📱 *User Experience*
- *📱 Progressive Web App (PWA)* - Installable on mobile devices with offline capabilities
- *🎨 Modern UI/UX* - Clean, intuitive interface built with ShadCN UI components
- *🌐 Multilingual Support* - English and Hindi language support
- *📱 Responsive Design* - Works seamlessly across all devices

### 🚨 *Emergency Features*
- *⚡ Emergency Profile* - Create vital health profiles with blood group, allergies, contacts
- *📱 QR Code Generation* - Instant QR codes for emergency personnel access
- *📞 Emergency Contacts* - Quick access to emergency contact information
- *🏥 Medical Alerts* - Important medical information prominently displayed

### 📊 *Document Management*
- *📁 Organized Storage* - Categorize and tag medical documents
- *🔍 Advanced Search* - Find documents quickly with AI-powered search
- *📤 Secure Sharing* - Share documents with healthcare providers securely
- *📈 Health Trends* - Track health metrics over time

---

## 🛠 Tech Stack

| Category | Technology | Purpose |
|----------|------------|---------|
| *Frontend* | ![Next.js](https://img.shields.io/badge/Next.js-15.3.3-black?style=flat&logo=next.js) | React framework with App Router |
| *Language* | ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript) | Type-safe JavaScript development |
| *Styling* | ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.1-38B2AC?style=flat&logo=tailwind-css) | Utility-first CSS framework |
| *UI Components* | ![ShadCN UI](https://img.shields.io/badge/ShadCN_UI-Latest-black?style=flat) | Modern, accessible UI components |
| *Authentication* | ![Firebase Auth](https://img.shields.io/badge/Firebase_Auth-Latest-orange?style=flat&logo=firebase) | User authentication and management |
| *Database* | ![Firestore](https://img.shields.io/badge/Firestore-Latest-orange?style=flat&logo=firebase) | NoSQL cloud database |
| *File Storage* | ![Supabase Storage](https://img.shields.io/badge/Supabase_Storage-Latest-green?style=flat&logo=supabase) | Secure file storage and management |
| *AI Integration* | ![Google AI](https://img.shields.io/badge/Google_AI_Gemini-Latest-blue?style=flat&logo=google) | Document analysis and AI assistant |
| *OCR Technology* | ![Tesseract.js](https://img.shields.io/badge/Tesseract.js-5.1.0-green?style=flat) | Text extraction from images |
| *Deployment* | ![Firebase Hosting](https://img.shields.io/badge/Firebase_Hosting-Latest-orange?style=flat&logo=firebase) | Cloud hosting and deployment |

---

## 🎯 Use Cases

### 👨‍⚕ *For Patients*
- Store and organize medical reports, prescriptions, and test results
- Share documents securely with healthcare providers
- Access health information anytime, anywhere
- Get AI-powered insights about medical documents
- Create emergency profiles for critical situations

### 🏥 *For Healthcare Providers*
- Receive secure, organized patient documents
- Access patient history through shared links
- View emergency information via QR codes
- Collaborate with patients on health management

### 🚑 *For Emergency Personnel*
- Quick access to critical health information via QR codes
- View allergies, blood group, and emergency contacts
- Make informed decisions in emergency situations

---

## 🚀 Getting Started

### 📋 Prerequisites

- *Node.js* (v18 or later) - [Download here](https://nodejs.org/)
- *Git* - [Download here](https://git-scm.com/)
- *Firebase Account* - [Sign up here](https://firebase.google.com/)
- *Supabase Account* - [Sign up here](https://supabase.com/)
- *Google AI Studio Account* - [Sign up here](https://ai.google.dev/)

### 🔧 Installation Guide

#### 1️⃣ *Clone the Repository*
bash
git clone https://github.com/your-username/medisafe.git
cd medisafe


#### 2️⃣ *Install Dependencies*
bash
npm install


#### 3️⃣ *Firebase Setup*
1. Create a project on the [Firebase Console](https://console.firebase.google.com/)
2. Enable *Authentication* (Email/Password provider)
3. Enable *Firestore Database*
4. Go to Project Settings → General → Your apps → Web app
5. Copy your Firebase configuration

#### 4️⃣ *Supabase Setup*
1. Create a project on the [Supabase Console](https://supabase.com/)
2. Go to Storage → Create new bucket named documents
3. Set bucket privacy to allow authenticated users
4. Go to Settings → API → Copy project URL and anon key

#### 5️⃣ *Google AI Setup*
1. Visit [Google AI Studio](https://ai.google.dev/)
2. Get your Gemini API key
3. Enable the Gemini API in your Google Cloud Console

#### 6️⃣ *Environment Configuration*
Create a .env.local file in the root directory:

env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google AI Configuration
GEMINI_API_KEY=your_gemini_api_key


#### 7️⃣ *Run the Application*
bash
# Development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start


The application will be running on http://localhost:9002

---

## 📱 Features Walkthrough

### 🔐 *Authentication*
- Secure user registration and login
- Password reset functionality
- Session management
- Protected routes

### 📄 *Document Upload*
- Drag-and-drop file upload
- Support for images (PNG, JPG) and PDFs
- OCR text extraction
- AI-powered analysis and tagging
- Automatic summary generation

### 🤖 *AI Assistant*
- Natural language queries about documents
- Document search and retrieval
- Health insights and observations
- Medical term explanations

### 📊 *Dashboard*
- Document overview and management
- Search and filter capabilities
- Tag-based organization
- Recent activity tracking

### 🔗 *Secure Sharing*
- Generate time-limited sharing links
- QR code generation for documents
- Access control and permissions
- Usage analytics

---

## 🏗 Project Structure


medisafe/
├── 📁 src/
│   ├── 📁 app/                 # Next.js App Router pages
│   ├── 📁 components/          # Reusable UI components
│   ├── 📁 lib/                 # Utility libraries
│   │   ├── 📁 firebase/        # Firebase configuration
│   │   └── 📁 supabase/        # Supabase configuration
│   ├── 📁 hooks/               # Custom React hooks
│   ├── 📁 context/             # React context providers
│   ├── 📁 types/               # TypeScript type definitions
│   └── 📁 ai/                  # AI integration and flows
├── 📁 public/                  # Static assets
├── 📁 docs/                    # Documentation
└── 📄 Configuration files


---

## 🧪 Testing

bash
# Run type checking
npm run typecheck

# Run linting
npm run lint

# Run tests (when implemented)
npm test


---

## 🚀 Deployment

### Firebase App Hosting
bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase
firebase init hosting

# Deploy
firebase deploy


### Vercel Deployment
bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel


---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch (git checkout -b feature/amazing-feature)
3. Commit your changes (git commit -m 'Add amazing feature')
4. Push to the branch (git push origin feature/amazing-feature)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Team Members

<div align="center">

### 🎯 *Development Team*

| Member | Role | GitHub |
|--------|------|--------|
| *Yogendra Bhange* | Lead Developer & Project Manager | [@yogendrabhange](https://github.com/yogendra-27-bhange) |
| *Yash Dudhe* | Frontend Developer & UI/UX Specialist | [@yashdudhe](https://github.com/yashdudhe-28) |
| *Prathmesh Sahakar* | Backend Developer & Database Specialist | [@prathmeshsahakar](https://github.com/prathameshsahakar7002) |
| *Gaurav Nikhade* | AI Integration & DevOps Engineer | [@gauravnikhade](https://github.com/gauravnik78) |

</div>

---

## 📞 Support & Contact

- *📧 Email*: support@medisafe.com
- *🐛 Bug Reports*: [GitHub Issues](https://github.com/your-username/medisafe/issues)
- *💡 Feature Requests*: [GitHub Discussions](https://github.com/your-username/medisafe/discussions)
- *📖 Documentation*: [Wiki](https://github.com/your-username/medisafe/wiki)

---

## 🙏 Acknowledgments

- *Firebase Team* - For excellent backend services
- *Supabase Team* - For powerful storage solutions
- *Google AI Team* - For cutting-edge AI capabilities
- *Next.js Team* - For the amazing React framework
- *ShadCN UI Team* - For beautiful UI components
- *Open Source Community* - For all the amazing tools and libraries

---

<div align="center">

*Made with ❤ by the Team Error*

[![GitHub stars](https://img.shields.io/github/stars/your-username/medisafe?style=social)](https://github.com/your-username/medisafe)
[![GitHub forks](https://img.shields.io/github/forks/your-username/medisafe?style=social)](https://github.com/your-username/medisafe)
[![GitHub issues](https://img.shields.io/github/issues/your-username/medisafe)](https://github.com/your-username/medisafe/issues)
[![GitHub license](https://img.shields.io/github/license/your-username/medisafe)](https://github.com/your-username/medisafe/blob/main/LICENSE)

</div>