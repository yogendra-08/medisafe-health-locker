# MediSafe Features Explained

This document provides a detailed walkthrough of each key feature in the MediSafe application.

---

### 1. 📄 AI-Powered Document Upload & Analysis

**What it is:** The core feature for getting documents into the system. Instead of just storing a file, MediSafe uses AI to understand it.

**How it works:**
1.  **Upload:** The user selects an image file (PNG, JPG) of a medical document from their device.
2.  **OCR (Optical Character Recognition):** [Tesseract.js](https://tesseract.projectnaptha.com/) runs in the browser to scan the image and extract all the text content. A progress bar is shown during this process.
3.  **AI Analysis:** The extracted text is sent to a secure Genkit flow powered by the Google Gemini model. The AI performs two tasks in parallel:
    *   **Summarization & Tagging:** It writes a brief, human-readable summary of the document's key points and suggests relevant tags (e.g., "Lab Report", "Blood Test", "Annual Checkup").
    *   **Health Insights:** It performs a deeper analysis to find specific medical terms and values.
4.  **Review:** The user is presented with the AI-generated summary, suggested tags, and health insights for review before saving.

**Screenshot Example:**
*   `[A screenshot of the Upload page after analysis is complete. It shows the uploaded file's name, the AI-generated summary in a text area, a list of suggested tags as clickable badges, and a distinct "AI Health Insights" section with cards for each finding like "Hemoglobin: 8 g/dL".]`

---

### 2. 🧬 AI Health Insights

**What it is:** A "wow" feature that helps users identify potentially significant information in their reports.

**How it works:**
-   This feature is part of the document analysis flow.
-   A specialized Genkit prompt instructs the AI to act as a data analyst. It is explicitly told **not to provide medical advice**.
-   For each identified term (e.g., "Hemoglobin: 8 g/dL"), it provides a neutral, informational observation (e.g., "This value may be outside the typical reference range.").
-   This gives the user context and encourages them to consult a real healthcare professional.

**Screenshot Example:**
*   `[A close-up screenshot of the "AI Health Insights" section on the upload page. It would show an alert box with a disclaimer about not being medical advice. Below it, there are several cards. One card has a Beaker icon and the text "Hemoglobin: 8 g/dL" in bold, with the text "This value may be outside the typical reference range" below it.]`

---

### 3. 🤖 Interactive AI Health Assistant

**What it is:** A chat interface that allows users to have a conversation with their document vault.

**How it works:**
1.  **User Query:** The user types a question into the chat input, like "What were my cholesterol levels in my last test?" or "Summarize my MRI scan."
2.  **Agentic AI Flow:** The query is sent to an advanced Genkit flow that uses an AI "tool".
3.  **Tool Use:** The AI determines that to answer the question, it first needs to find relevant documents. It calls the `searchUserDocuments` tool with keywords from the user's query (e.g., "cholesterol", "MRI").
4.  **Data Retrieval:** The tool (currently using mock data) searches the user's documents and returns the content of the most relevant ones to the AI.
5.  **Answer Generation:** With the document content as context, the AI generates a concise, helpful answer to the user's original question.
6.  **Streaming:** The response is streamed back to the UI word-by-word, creating a dynamic and engaging user experience.

**Screenshot Example:**
*   `[A screenshot of the AI Assistant page. The chat history shows a user message on the right: "Summarize my latest blood test." Below it, on the left, is the assistant's response: "Your latest blood test from October 15, 2023, shows that all results are within the normal range. A follow-up in one year is recommended."]`

---

### 4. 🛡️ Secure Share with Expiry & Access Logging

**What it is:** A secure method for sharing sensitive documents with doctors or family members.

**How it works:**
1.  **Generate Link:** From the dashboard, the user clicks "Share" on a document. A dialog opens.
2.  **Set Rules:** The user can set an expiry time (e.g., 1 Hour, 1 Day) and a maximum view count (e.g., 1 View, 5 Views).
3.  **Create Record:** When the link is generated, a `shareLinks` record is created in Firestore containing the document ID and the security rules.
4.  **Access Verification:** When someone opens the share link (`/share/[link_id]`), the page logic first fetches the Firestore record. It verifies that:
    -   The link exists.
    -   The current time is before the `expiresAt` timestamp.
    -   The `viewCount` is less than the `maxViews` limit.
5.  **Logging:** If all checks pass, the `viewCount` is incremented, an access log is recorded, and the document details are displayed. If any check fails, an appropriate error message is shown (e.g., "Link Expired").

**Screenshot Example:**
*   `[A screenshot of the "Share Document" dialog box. It shows dropdowns for "Link Expires In" (set to '1 Day') and "Max Views" (set to '5 Views'), with a "Generate Secure Link" button.]`

---

### 5. ⚕️ Emergency Profile & QR Code

**What it is:** A feature for providing critical health information in an emergency.

**How it works:**
1.  **Profile Creation:** On the "Health Profile" page, a user enters their full name, blood group, known allergies, and an emergency contact's name and phone number.
2.  **QR Code Generation:** The user can click a button to generate a QR code.
3.  **Unique URL:** This QR code is a direct link to a public-facing, unauthenticated URL: `/emergency/[user_id]`.
4.  **Emergency View:** When scanned, this page displays the essential health information in a clear, easy-to-read format designed for first responders. It does **not** expose any of the user's documents or other private data.

**Screenshot Example:**
*   `[A screenshot showing the Emergency QR code generated in a dialog, with the QR code image prominently displayed and the URL below it. Next to it, a simulated phone screen showing the public Emergency Page, with a red header and clear labels for "Blood Group", "Allergies", and "Emergency Contact".]`
