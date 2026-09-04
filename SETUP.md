# DPWH Road Crack Detection System - Setup Guide

Welcome to the DPWH Road Crack Detection System web portal! This guide will help you set up and run the application.

## 📋 Project Overview

This is a **Near Real Time Road Crack Detection System** that uses:
- **Hardware**: Raspberry Pi + Google Coral for crack detection
- **Web Portal**: Next.js + TypeScript for the frontend
- **Backend**: Firebase for database and cloud storage
- **Deployment**: Vercel

## 🎨 Design System

### Color Scheme
- **Primary Blue**: `#3b82f6` - Main actions and navigation
- **Secondary Red**: `#ef4444` - Alerts and critical information
- **Accent White**: `#ffffff` - Clean UI backgrounds

These colors represent your school's branding and are used throughout the UI.

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ installed
- npm or yarn package manager
- Firebase project (free tier available)
- Git

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use an existing one
3. Get your Firebase configuration:
   - Click **Project Settings** → **Your Apps** → **Web App**
   - Copy your configuration

4. Update `.env.local` with your Firebase credentials:
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
CapstoneRepo/
├── app/
│   ├── layout.tsx           # Main layout with sidebar & navbar
│   ├── page.tsx             # Dashboard homepage
│   └── globals.css          # Global styles
├── components/
│   ├── Navbar.tsx           # Top navigation bar
│   ├── Sidebar.tsx          # Left navigation sidebar
│   ├── StatCard.tsx         # Statistics card component
│   ├── CrackCard.tsx        # Crack detection card
│   └── ...                  # Other components
├── lib/
│   ├── firebase.ts          # Firebase configuration
│   └── types.ts             # TypeScript type definitions
├── public/                  # Static assets
├── package.json             # Dependencies
├── tailwind.config.js       # Tailwind CSS configuration
└── tsconfig.json            # TypeScript configuration
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend Framework** | Next.js 14 |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS |
| **UI Icons** | React Icons |
| **State Management** | Zustand (optional) |
| **Backend/Database** | Firebase Firestore |
| **File Storage** | Firebase Storage |
| **Authentication** | Firebase Auth |
| **Maps** | Leaflet + React Leaflet |
| **Deployment** | Vercel |

## 📄 Key Features

### Dashboard
- Real-time statistics (total cracks, critical issues, in-progress repairs, resolved)
- Recent crack detections with thumbnails
- System status monitoring
- Latest activity feed

### Crack Detection
- Display detected cracks with images
- Show location (coordinates)
- Indicate crack type (longitudinal, transverse, alligator, edge, reflection, other)
- Display severity levels (low, medium, high, critical)
- Crack details (width, length, depth)

### Map View
- Visualize crack locations on interactive map
- Filter by severity or type
- Click on markers for details

### Analytics
- Statistics by crack type
- Trends over time
- Detection rate metrics
- Response time analytics

### Gallery
- Browse all detected crack images
- Filter and search functionality

## 🔧 Configuration Files

### `tailwind.config.js`
Customized with DPWH colors and extended utilities:
- Custom color palette (blue, red, white)
- Card and button utilities
- Animations

### `next.config.js`
- Image optimization with Firebase storage support
- Webpack fallbacks for browser compatibility

### `tsconfig.json`
- Strict type checking enabled
- Path aliases for easier imports

## 🔄 Data Flow

```
Raspberry Pi + Google Coral
        ↓
    Detects Cracks
        ↓
    Sends to Firebase
        ↓
    Web Portal Fetches Data
        ↓
    Displays in Dashboard/Map
        ↓
    Admin Reviews & Assigns
        ↓
    Workers Execute Repairs
        ↓
    Mark as Resolved
```

## 📱 Responsive Design

The application is fully responsive:
- **Desktop**: Full sidebar + detailed layouts
- **Tablet**: Collapsible sidebar
- **Mobile**: Mobile-optimized navigation

## 🚀 Deployment to Vercel

1. Push to GitHub:
```bash
git add .
git commit -m "Initial DPWH crack detection portal"
git push origin main
```

2. Connect to Vercel:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Select your GitHub repository
   - Add environment variables from `.env.local`
   - Deploy!

## 📊 Database Schema (Firestore)

### Collections

#### `cracks`
```json
{
  "id": "crack-001",
  "location": "Gen. Luna St, Manila",
  "coordinates": { "lat": 14.5994, "lng": 120.9842 },
  "imageUrl": "gs://bucket/crack001.jpg",
  "crackType": "alligator",
  "severity": "critical",
  "width": 2.5,
  "length": 150,
  "depth": 5,
  "status": "new",
  "detectedAt": "2024-09-04T10:30:00Z",
  "createdAt": "2024-09-04T10:30:00Z",
  "updatedAt": "2024-09-04T10:30:00Z"
}
```

#### `users`
```json
{
  "id": "user-001",
  "email": "admin@dpwh.gov.ph",
  "name": "John Doe",
  "role": "admin",
  "createdAt": "2024-09-01T00:00:00Z"
}
```

#### `reports`
```json
{
  "id": "report-001",
  "crackId": "crack-001",
  "reportedBy": "user-001",
  "status": "approved",
  "priority": "critical",
  "description": "Major alligator cracking, requires immediate repair",
  "createdAt": "2024-09-04T10:35:00Z"
}
```

## 🔐 Security Considerations

1. **Firebase Security Rules**: Configure rules to restrict access
2. **Environment Variables**: Never commit `.env.local` to git
3. **User Roles**: Implement role-based access control (admin, inspector, worker, viewer)
4. **Data Validation**: Validate all inputs on frontend and backend

## 🐛 Troubleshooting

### Firebase Connection Issues
```bash
# Check if credentials are correct
# Verify Firebase project is active
# Check Firestore database rules allow access
```

### Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm install
npm run build
```

### Port Already in Use
```bash
# Run on different port
npm run dev -- -p 3001
```

## 📚 Next Steps

1. ✅ Create Firestore collections
2. ✅ Set up Firebase authentication
3. ✅ Build Crack Details page (`/cracks/[id]`)
4. ✅ Implement Map View with Leaflet
5. ✅ Create Analytics Dashboard
6. ✅ Build Gallery with filters
7. ✅ Integrate with Raspberry Pi API
8. ✅ Deploy to Vercel

## 📞 Support

For questions or issues:
- Check Firebase documentation: https://firebase.google.com/docs
- Next.js docs: https://nextjs.org/docs
- Tailwind docs: https://tailwindcss.com/docs

---

**Last Updated**: September 4, 2024
**Version**: 1.0.0
