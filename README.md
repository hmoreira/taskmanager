# Task Manager

A simple task manager app built with React Native and Expo for improving skills and demonstrating mobile app development.

## 🚀 Features

- **Add new tasks** with title and description
- **View task list** with persistent local storage
- **SQLite local database** - works completely offline
- **Clean, responsive UI** optimized for mobile devices
- **Play Store ready** - no external dependencies required

## 🛠️ Technology Stack

- **React Native** with Expo SDK
- **TypeScript** for type safety
- **SQLite** (expo-sqlite) for local data persistence
- **Native mobile UI** components

## 📱 Database Schema

The app uses a local SQLite database with the following structure:

```sql
CREATE TABLE tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  status INTEGER DEFAULT 0,  -- 0 = pending, 1 = completed
  due_date TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 🏗️ Architecture

- **`app/index.tsx`** - Main UI component with task list and form
- **`services/database.ts`** - SQLite database service with CRUD operations
- **Local-first design** - All data stored on device, no internet required

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- Expo CLI
- iOS Simulator or Android Emulator (optional)
- Expo Go app on your mobile device (optional)

### Installation & Running

```bash
# Install dependencies
npm install

# Start the development server
npx expo start

# Or start with cleared cache
npx expo start --clear
```

### Testing Options
- **Physical device**: Scan QR code with Expo Go app
- **iOS Simulator**: Press `i` in terminal
- **Android Emulator**: Press `a` in terminal  
- **Web browser**: Press `w` in terminal

## 📦 Building for Production

This app is ready for Play Store deployment:

```bash
# Build for Android
npx expo build:android

# Or create development build
npx expo run:android
```

## 🎯 Key Benefits

- ✅ **Offline-first** - No internet connection required
- ✅ **Fast performance** - Local SQLite database
- ✅ **No API keys** - No external services or credentials
- ✅ **Data persistence** - Tasks saved locally on device
- ✅ **Store-ready** - No backend dependencies for app stores
