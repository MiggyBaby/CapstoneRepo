# Backend API Routes

The Next.js server connects to Supabase. Server-only service-role/secret keys and the Pi bearer token must stay in the website server environment; never put them in the mobile app or a public `NEXT_PUBLIC_` variable.

## Detection and inspector endpoints

- `GET /api/cracks` and `GET /api/cracks/[id]` - Read supported road defect detections.
- `PATCH /api/cracks/[id]/status` - Update a detection status. Requires a valid Supabase access token and `app_metadata.role` of `inspector` or `admin`.
- `PUT /api/cracks/[id]` - Update a detection. Requires an inspector or admin account.
- `DELETE /api/cracks/[id]` - Delete a detection. Requires an admin account.
- `POST /api/cracks` - Disabled; returns `410`. Use the device ingestion endpoint instead.
- `GET /api/analytics` - Get detection analytics.
- `GET /api/inspections/detections` - List records awaiting inspector review.
- `PATCH /api/inspections/detections/[id]` - Edit a detection, mark it pending/reviewed, or soft-exclude it as a duplicate. Inspector/admin only.
- `GET/POST /api/inspections/batches` - List forwarded batches or atomically forward reviewed records. Forwarding is inspector/admin only.
- `PATCH /api/inspections/batches/[id]` - Mark a forwarded batch reviewed or request changes with an optional department note. Reviewer/admin only.
- `GET/POST /api/inspections/detections/[id]/notes` - Read or append an inspector remark. Notes are append-only.

## Raspberry Pi endpoints

- `POST /api/device/uploads` - Upload an evidence image as multipart form field `file`. Requires `Authorization: Bearer <PI_INGESTION_TOKEN>`. Accepts image files up to 5 MB and returns a public HTTPS URL when the configured storage URL uses HTTPS.
- `POST /api/device/detections` - Ingest a validated detection. Requires the same device bearer token and a stable `deviceId`/`detectionId` pair for idempotent retries. See `mobile-app/README.md` for the JSON contract.

Configure `PI_INGESTION_TOKEN` and Supabase server credentials in the website server's `.env.local` or deployment environment. Use HTTPS for deployed device traffic.

Apply migrations 006 then 007 after the existing non-destructive migrations. Migration 007 creates the inspection-review tables and batch forwarding/review functions used by these routes. Assign department reviewer accounts `app_metadata.role=reviewer`; inspector/admin roles can edit and forward records, while forwarded records are locked against later edits. A department "changes requested" decision reopens detections into the inspector's pending queue without deleting the original batch history.

## Other endpoints

- `GET/POST /api/reports` and `GET/PUT/DELETE /api/reports/[id]` - Report management with role-based access.
- `GET/POST /api/district-summaries` - District summaries with authenticated access.
- `POST /api/uploads` - Website image upload for inspector/admin users.
- `GET /api/health` - API health check.
