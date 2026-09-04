# Backend API Routes

This folder contains all backend API endpoints for the DPWH Road Crack Detection System.

## Structure

```
app/api/
├── cracks/
│   ├── route.ts          # GET/POST all cracks
│   └── [id]/
│       └── route.ts      # GET/PUT/DELETE specific crack
├── analytics/
│   └── route.ts          # GET analytics data
├── uploads/
│   └── route.ts          # Handle image uploads
└── health/
    └── route.ts          # API health check
```

## API Endpoints

### Cracks
- `GET /api/cracks` - Get all cracks
- `GET /api/cracks/[id]` - Get specific crack
- `POST /api/cracks` - Create new crack
- `PUT /api/cracks/[id]` - Update crack
- `DELETE /api/cracks/[id]` - Delete crack

### Analytics
- `GET /api/analytics` - Get system analytics

### Uploads
- `POST /api/uploads` - Upload crack image

### Health
- `GET /api/health` - Check API status

## Notes

All API routes are handled by Next.js server-side functions and connect to Firebase Firestore.
