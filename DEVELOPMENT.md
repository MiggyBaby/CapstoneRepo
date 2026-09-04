# Frontend & Backend Development Guide

## Project Architecture

```
Frontend (Next.js Client)
        ↓
   Next.js API Routes (Backend)
        ↓
   Firebase Firestore + Storage
        ↓
   Raspberry Pi + Google Coral (Data Source)
```

## Running the Application

### Option 1: Using Startup Script (Easiest)

#### Windows - PowerShell
```powershell
.\start-dev.ps1
```

#### Windows - Command Prompt
```cmd
start-dev.bat
```

#### macOS/Linux
```bash
chmod +x start-dev.sh
./start-dev.sh
```

### Option 2: Manual Startup

1. **Install dependencies** (first time only):
```bash
npm install
```

2. **Start development server**:
```bash
npm run dev
```

3. **Open browser**:
```
http://localhost:3000
```

---

## Frontend Architecture

### File Structure
```
app/
├── page.tsx                  # Dashboard
├── cracks/
│   └── page.tsx             # Crack listing
├── map/
│   └── page.tsx             # Map view
├── analytics/
│   └── page.tsx             # Analytics
├── gallery/
│   └── page.tsx             # Gallery (coming soon)
├── layout.tsx               # Main layout
└── globals.css              # Global styles

components/
├── Navbar.tsx               # Top bar
├── Sidebar.tsx              # Left sidebar
├── StatCard.tsx             # Statistics
└── CrackCard.tsx            # Crack card

lib/
├── firebase.ts              # Firebase config
├── types.ts                 # TypeScript types
└── api-client.ts            # API client (calls backend)
```

### Key Components

#### Using the API Client in Components

```typescript
'use client';

import { useEffect, useState } from 'react';
import { fetchCracks, Crack } from '@/lib/api-client';

export default function MyCracksPage() {
  const [cracks, setCracks] = useState<Crack[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCracks = async () => {
      try {
        const data = await fetchCracks({ limit: 10 });
        setCracks(data);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCracks();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {cracks.map(crack => (
        <div key={crack.id}>{crack.location}</div>
      ))}
    </div>
  );
}
```

---

## Backend API Routes

### API Base URL
```
http://localhost:3000/api
```

### Endpoints

#### 1. Cracks Management

**Get All Cracks**
```
GET /api/cracks
Query Parameters:
  - severity: low|medium|high|critical
  - type: longitudinal|transverse|alligator|edge|reflection|other
  - limit: number

Response:
{
  "success": true,
  "data": [
    {
      "id": "crack-001",
      "location": "Gen. Luna St",
      "coordinates": { "lat": 14.5994, "lng": 120.9842 },
      "crackType": "alligator",
      "severity": "critical",
      "status": "new",
      "detectedAt": "2024-09-04T10:30:00Z"
    }
  ],
  "count": 1
}
```

**Get Specific Crack**
```
GET /api/cracks/{id}

Response:
{
  "success": true,
  "data": { ... crack details ... }
}
```

**Create Crack**
```
POST /api/cracks
Content-Type: application/json

Body:
{
  "location": "Gen. Luna St",
  "coordinates": { "lat": 14.5994, "lng": 120.9842 },
  "imageUrl": "https://...",
  "crackType": "alligator",
  "severity": "critical",
  "width": 2.5,
  "length": 150
}

Response:
{
  "success": true,
  "data": { ... created crack ... },
  "message": "Crack created successfully"
}
```

**Update Crack**
```
PUT /api/cracks/{id}
Content-Type: application/json

Body:
{
  "status": "resolved",
  "severity": "low"
}
```

**Delete Crack**
```
DELETE /api/cracks/{id}
```

#### 2. Analytics

**Get Analytics**
```
GET /api/analytics

Response:
{
  "success": true,
  "data": {
    "totalCracks": 100,
    "criticalCracks": 15,
    "highCracks": 28,
    "mediumCracks": 35,
    "lowCracks": 22,
    "resolvedCracks": 35,
    "inProgressCracks": 20,
    "cracksByType": {
      "longitudinal": 24,
      "transverse": 18,
      "alligator": 32,
      "edge": 12,
      "reflection": 8,
      "other": 6
    },
    "cracksByStatus": {
      "new": 30,
      "assigned": 15,
      "inProgress": 20,
      "resolved": 35
    },
    "timestamp": "2024-09-04T12:00:00Z"
  }
}
```

#### 3. File Uploads

**Upload Image**
```
POST /api/uploads
Content-Type: multipart/form-data

Body:
- file: <image file>

Response:
{
  "success": true,
  "data": {
    "filename": "1234567890-crack.jpg",
    "url": "https://firebasestorage.googleapis.com/...",
    "size": 245678,
    "type": "image/jpeg"
  }
}
```

#### 4. Health Check

**Check API Status**
```
GET /api/health

Response:
{
  "success": true,
  "status": "operational",
  "message": "API is running",
  "timestamp": "2024-09-04T12:00:00Z",
  "version": "1.0.0"
}
```

---

## Testing API Endpoints

### Using cURL

```bash
# Get all cracks
curl http://localhost:3000/api/cracks

# Get specific crack
curl http://localhost:3000/api/cracks/crack-001

# Check API health
curl http://localhost:3000/api/health

# Create new crack
curl -X POST http://localhost:3000/api/cracks \
  -H "Content-Type: application/json" \
  -d '{
    "location": "Gen. Luna St",
    "coordinates": {"lat": 14.5994, "lng": 120.9842},
    "crackType": "alligator",
    "severity": "critical"
  }'
```

### Using Postman

1. Import API collection (create new requests)
2. Set base URL to `http://localhost:3000/api`
3. Test each endpoint

---

## Environment Variables

Create `.env.local` file:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

---

## Common Tasks

### Add New API Endpoint

1. Create route file: `app/api/your-endpoint/route.ts`
2. Implement GET/POST/PUT/DELETE handlers
3. Add client function to `lib/api-client.ts`
4. Use in components via import

### Update Existing Page

1. Edit page file: `app/your-page/page.tsx`
2. Use API client: `import { fetchCracks } from '@/lib/api-client'`
3. Save and browser auto-refreshes

### Add New Component

1. Create: `components/YourComponent.tsx`
2. Export from: `app/layout.tsx` if needed globally
3. Or import in specific page

---

## Troubleshooting

### Port 3000 Already in Use

```bash
# Find process using port 3000
netstat -ano | findstr :3000

# Kill process (Windows)
taskkill /PID <PID> /F

# Or use different port
npm run dev -- -p 3001
```

### Firebase Connection Error

- Check `.env.local` has correct credentials
- Verify Firebase project is active
- Check Firestore Security Rules allow access

### Build Errors

```bash
# Clear cache
rm -rf .next
npm run build
```

### Dependencies Issue

```bash
# Reinstall
rm -rf node_modules
npm install
```

---

## Deployment

### Build for Production

```bash
npm run build
npm start
```

### Deploy to Vercel

```bash
git add .
git commit -m "Your changes"
git push origin main
```

Then connect to Vercel and deploy.

---

## Useful Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm start                # Start production server

# Code Quality
npm run lint             # Run ESLint
npm run type-check       # Check TypeScript

# Debugging
npm run dev -- -p 3001   # Run on different port
```

---

## Next Steps

1. ✅ Install dependencies: `npm install`
2. ✅ Add Firebase credentials: Edit `.env.local`
3. ✅ Start server: `npm run dev`
4. ✅ Test endpoints: Visit `http://localhost:3000/api/health`
5. ✅ Explore dashboard: Visit `http://localhost:3000`
6. Build features: Edit files and save!

---

**Version**: 1.0.0  
**Last Updated**: September 4, 2024
