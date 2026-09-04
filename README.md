# DPWH Road Crack Detection System

A modern web portal for managing and monitoring road crack detection using Raspberry Pi and Google Coral hardware.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Status](https://img.shields.io/badge/status-active-success)

## 🎯 Project Overview

This is a capstone project for the **Near Real Time Road Crack Detection System**. The web portal provides:
- **Real-time monitoring** of detected road cracks
- **Data visualization** with maps and analytics
- **Severity assessment** and prioritization
- **Work management** for repair teams
- **Cloud storage** for crack images and reports

### Key Features
- ✅ Interactive dashboard with real-time statistics
- ✅ Advanced filtering and search capabilities
- ✅ Map-based visualization of crack locations
- ✅ Comprehensive analytics and reporting
- ✅ Mobile-responsive design
- ✅ Firebase integration for backend
- ✅ Image gallery with metadata
- ✅ User roles and permissions system (coming soon)

## 🎨 Design System

**Color Scheme** (School Brand Colors):
- **Primary Blue**: `#3b82f6` - Main actions and navigation
- **Secondary Red**: `#ef4444` - Alerts and critical information  
- **Accent White**: `#ffffff` - Clean backgrounds

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- npm or yarn
- Firebase account

### Installation

1. **Install dependencies**
```bash
npm install
```

2. **Configure Firebase** - Add credentials to `.env.local`:
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

3. **Start development server**
```bash
npm run dev
```

4. **Open browser**
```
http://localhost:3000
```

## 📁 Project Structure

```
CapstoneRepo/
├── app/                     # Next.js app directory
│   ├── layout.tsx          # Main layout (sidebar + navbar)
│   ├── page.tsx            # Dashboard
│   ├── globals.css         # Global styles
│   ├── cracks/
│   │   └── page.tsx        # Crack listing & filtering
│   ├── map/
│   │   └── page.tsx        # Map view
│   ├── analytics/
│   │   └── page.tsx        # Analytics dashboard
│   └── gallery/            # Image gallery (coming soon)
│
├── components/              # Reusable React components
│   ├── Navbar.tsx          # Top navigation
│   ├── Sidebar.tsx         # Left sidebar
│   ├── StatCard.tsx        # Statistics cards
│   └── CrackCard.tsx       # Crack detail cards
│
├── lib/                     # Utilities and config
│   ├── firebase.ts         # Firebase initialization
│   └── types.ts            # TypeScript interfaces
│
├── public/                 # Static assets
├── package.json            # Dependencies
├── tailwind.config.js      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript config
└── README.md               # This file
```

## 🛠️ Tech Stack

| Component | Technology |
|-----------|-----------|
| **Frontend** | Next.js 14 + React 18 |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS |
| **Backend** | Firebase Firestore |
| **Storage** | Firebase Storage |
| **Icons** | React Icons |
| **Maps** | Leaflet (coming soon) |
| **Deployment** | Vercel |

## 📊 Pages & Features

### Dashboard (`/`)
- System statistics (total cracks, critical issues, in-progress, resolved)
- Recent crack detections with images
- System status monitoring
- Activity feed

### Crack Detection (`/cracks`)
- Browse all detected cracks
- Filter by severity (low, medium, high, critical)
- Filter by crack type (longitudinal, transverse, alligator, edge, reflection, other)
- Search by location
- Export reports

### Map View (`/map`)
- Visualize crack locations on interactive map
- Color-coded severity indicators
- Quick access to crack details
- Location-based filtering

### Analytics (`/analytics`)
- Cracks by type distribution
- Cracks by severity distribution
- Weekly detection trends
- Performance metrics
- System insights

### Gallery (`/gallery`) - Coming Soon
- Browse crack images
- Filter and search
- Batch operations

## 🔄 Data Flow

```
Raspberry Pi + Google Coral (Hardware)
        ↓
  Detect Cracks
        ↓
  Send to Firebase
        ↓
  Web Portal Fetches
        ↓
  Display in Dashboard/Map
        ↓
  Admin Reviews & Assigns
        ↓
  Workers Execute Repairs
        ↓
  Mark as Resolved
```

## 🗄️ Database Schema (Firestore)

### Collections

**cracks** - Detected road cracks
```json
{
  "id": "crack-001",
  "location": "Gen. Luna St, Manila",
  "coordinates": { "lat": 14.5994, "lng": 120.9842 },
  "imageUrl": "gs://bucket/image.jpg",
  "crackType": "alligator",
  "severity": "critical",
  "status": "new",
  "detectedAt": "2024-09-04T10:30:00Z"
}
```

**users** - System users
**reports** - Crack reports and repairs
**analytics** - Performance metrics

See `SETUP.md` for detailed database schema.

## 🚀 Deployment

### Deploy to Vercel

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

Then:
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Add environment variables
4. Deploy!

## 📖 Documentation

- **[SETUP.md](SETUP.md)** - Detailed setup and configuration guide
- **Code Comments** - Throughout the codebase

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📋 Development Roadmap

- [x] Project setup and structure
- [x] Dashboard with statistics
- [x] Crack listing with filters
- [x] Map view (placeholder)
- [x] Analytics dashboard
- [ ] Leaflet map integration
- [ ] Image gallery
- [ ] User authentication
- [ ] Role-based access control
- [ ] Real-time notifications
- [ ] Crack repair workflow
- [ ] Mobile app (React Native)

## 🐛 Known Issues & TODO

- Map view needs Leaflet.js integration
- Gallery page needs implementation
- Authentication system needs setup
- Real-time data sync not yet implemented

## 📞 Contact & Support

For questions, issues, or suggestions, please refer to your capstone advisor or the project documentation.

---

**Last Updated**: September 4, 2024  
**Version**: 1.0.0  
**Made with ❤️ for DPWH**
