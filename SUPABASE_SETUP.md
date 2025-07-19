# Supabase Setup Guide for MediSafe

This guide will help you set up Supabase for file storage (PDFs and images) in your MediSafe application.

## Prerequisites

- A Supabase account (sign up at [supabase.com](https://supabase.com))
- Your existing Firebase project (for authentication and database)

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `medisafe-storage` (or any name you prefer)
   - **Database Password**: Create a strong password
   - **Region**: Choose the region closest to your users
5. Click "Create new project"
6. Wait for the project to be set up (this may take a few minutes)

## Step 2: Get Your Supabase Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (looks like: `https://your-project-id.supabase.co`)
   - **anon public** key (starts with `eyJ...`)

## Step 3: Create Storage Bucket

1. In your Supabase dashboard, go to **Storage**
2. Click "Create a new bucket"
3. Configure the bucket:
   - **Name**: `medical-files`
   - **Public bucket**: ✅ Check this (files will be publicly accessible)
   - **File size limit**: `50 MB` (adjust as needed)
   - **Allowed MIME types**: 
     - `image/*` (for images)
     - `application/pdf` (for PDFs)
     - `application/octet-stream` (for other file types)
4. Click "Create bucket"

## Step 4: Configure Storage Policies

1. In the Storage section, click on your `medical-files` bucket
2. Go to the **Policies** tab
3. Click "New Policy"
4. Choose "Create a policy from scratch"
5. Configure the policy:

### For INSERT (Upload) Policy:
- **Policy name**: `Allow authenticated users to upload files`
- **Target roles**: `authenticated`
- **Using policy definition**:
```sql
(auth.uid()::text = (storage.foldername(name))[1])
```
- **Description**: Allows users to upload files to their own folder

### For SELECT (Download) Policy:
- **Policy name**: `Allow public read access`
- **Target roles**: `public`
- **Using policy definition**:
```sql
true
```
- **Description**: Allows public read access to all files

### For DELETE Policy:
- **Policy name**: `Allow users to delete their own files`
- **Target roles**: `authenticated`
- **Using policy definition**:
```sql
(auth.uid()::text = (storage.foldername(name))[1])
```
- **Description**: Allows users to delete files from their own folder

## Step 5: Update Environment Variables

1. In your project root, open or create `.env.local`
2. Add your Supabase credentials:

```env
# Existing Firebase variables
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id

# Add these new Supabase variables
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Existing AI variables
GEMINI_API_KEY=your_gemini_api_key
```

## Step 6: Test the Integration

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Go to the upload page and try uploading an image file
3. Check that:
   - The file uploads successfully
   - The file URL is saved in Firestore
   - You can view the file in your Supabase Storage dashboard

## Step 7: Optional - Configure CORS (if needed)

If you encounter CORS issues:

1. In your Supabase dashboard, go to **Settings** → **API**
2. Scroll down to "CORS (Cross-Origin Resource Sharing)"
3. Add your domain:
   - For development: `http://localhost:9002`
   - For production: `https://your-domain.com`

## File Structure

Files are organized in Supabase Storage as follows:
```
medical-files/
├── documents/
│   ├── user-id-1/
│   │   ├── 1234567890_document1.jpg
│   │   └── 1234567891_document2.pdf
│   └── user-id-2/
│       └── 1234567892_document3.png
```

## Security Considerations

1. **File Access**: Files are publicly accessible via URL. If you need private files, you'll need to implement signed URLs.
2. **File Size**: Consider implementing client-side file size validation.
3. **File Types**: The current setup allows images and PDFs. Adjust MIME types as needed.
4. **User Isolation**: Files are organized by user ID to prevent cross-user access.

## Troubleshooting

### Common Issues:

1. **"Supabase is not configured" error**
   - Check that your environment variables are set correctly
   - Restart your development server after adding environment variables

2. **Upload fails with "Invalid file type"**
   - Check the MIME types allowed in your bucket settings
   - Verify the file is actually an image or PDF

3. **CORS errors**
   - Add your domain to the CORS settings in Supabase
   - Check that you're using the correct Supabase URL

4. **Permission denied errors**
   - Verify your storage policies are set up correctly
   - Check that the user is authenticated when uploading

### Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify your Supabase project settings
3. Check the Supabase dashboard logs
4. Ensure all environment variables are correctly set

## Migration from Firebase Storage

If you're migrating from Firebase Storage:

1. **Existing Files**: You'll need to manually migrate existing files or keep both systems running
2. **File URLs**: Update any hardcoded Firebase Storage URLs
3. **Testing**: Test thoroughly with both old and new files

## Cost Considerations

- Supabase offers a generous free tier
- Monitor your usage in the Supabase dashboard
- Consider implementing file size limits and cleanup policies 