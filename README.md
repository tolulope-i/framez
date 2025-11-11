# Framez - Social Media Mobile App

A full-featured social media mobile application built with React Native, Expo, TypeScript, and Supabase.

## Features

- ✅ User authentication (Sign up, Sign in, Password reset)
- ✅ Persistent sessions and theme mode
- ✅ Create, edit, and delete posts
- ✅ Image uploads with posts
- ✅ Real-time posts feed
- ✅ User profile with personal posts
- ✅ Dark mode and light mode
- ✅ Form validation with inline errors
- ✅ Responsive and modern UI

## Tech Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Backend**: Supabase (Authentication, Database, Storage)
- **State Management**: Zustand
- **UI**: React Native, Expo Linear Gradient
- **Storage**: AsyncStorage (for theme persistence)

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app on your mobile device (iOS/Android)

## Step-by-Step Setup Guide

### 1. Clone the Repository

```bash
git clone https://github.com/tolulope-i/framez.git
cd framez-app
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Supabase Setup

#### A. Create a Supabase Account
1. Go to [https://supabase.com](https://supabase.com)
2. Sign up for a free account
3. Create a new project
4. Note down your project URL and anon key

#### B. Create Database Tables

Run your SQL commands in Supabase SQL Editor to create all neccessary tables and policies:

#### C. Setup Storage Bucket

1. Go to Storage in Supabase dashboard
2. Create a new bucket named `posts`
3. Make it public
4. Add some policy:

### 4. Environment Configuration

Create a `.env` file in the root directory:
Add your Supabase credentials:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 5. Run the Application

```bash
# Start the development server
npm start
# or
expo start
```

Options:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on your phone

### Manual Testing Checklist:

1. **Authentication**
   - [ ] Sign up with valid credentials
   - [ ] Sign in with existing account
   - [ ] Password reset functionality
   - [ ] Session persistence on app restart

2. **Posts**
   - [ ] Create post with text only
   - [ ] Create post with text and image
   - [ ] Edit own posts
   - [ ] Delete own posts
   - [ ] View all posts feed

3. **Profile**
   - [ ] View own profile
   - [ ] See own posts
   - [ ] Logout

4. **Theme**
   - [ ] Toggle between light and dark mode
   - [ ] Theme persists on app restart

## Deployment to Appetize.io

1. Build your app:
```bash
expo build:android
# or
expo build:ios
```

2. Download the built `.apk` (Android) or `.app` (iOS) file

3. Go to [https://appetize.io](https://appetize.io)

4. Upload your app file

5. Get your public link to share
