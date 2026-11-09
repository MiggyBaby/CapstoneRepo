# DPWH Road Watch Mobile

Expo Router field app for reviewing road defects detected by Raspberry Pi devices. It reads the shared Supabase `crack_records` view with the project's publishable key and Supabase Auth, and sends inspector review edits, notes, status changes, and batch submissions to the Next.js website API. It never contains a service-role key or Pi ingestion token.

## Setup on Windows

1. Install Node.js LTS and Expo Go on your Android phone.
2. From `mobile-app`, run `npm install`.
3. Set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env`; use the existing project URL and publishable key. Never use a service-role or secret key.
4. Set `EXPO_PUBLIC_API_URL` to the website API base URL. For an Android emulator use `http://10.0.2.2:3000/api`; for a physical phone use `http://<computer-LAN-IP>:3000/api` while the website is running on the same network. Use the deployed HTTPS website URL outside local development.
5. Start the website from the repository root with `npm run dev`, then start Expo from `mobile-app` with `npx expo start` and scan the QR code using Expo Go.
6. Keep the phone and computer on the same Wi-Fi when using a physical phone.

When running the app in a browser, the Next.js API allows local development origins. For a deployed mobile web app, configure `MOBILE_APP_WEB_ORIGINS` on the website server as a comma-separated list of exact HTTPS app origins. A browser cannot call an HTTP API from an HTTPS app origin; use HTTPS for both in production.

The map tab uses an interactive Leaflet map on web and an embedded Leaflet/MapLibre map in `react-native-webview` on iOS and Android. The web map uses OpenStreetMap raster tiles; native map style and tiles use the OpenFreeMap Liberty style through the MapLibre GL Leaflet JavaScript adapter. Map tiles require an internet connection. Google Maps directions remain optional.

## Screens

- Overview: exact database counts and recent records, with evidence thumbnails on detection cards. Records without an uploaded image show a clearly labeled sample photo instead.
- Detections: location search, severity/status/type/date filters, pull-to-refresh, 25-row paging, evidence thumbnails, and detail navigation.
- Davao City map: actual detections whose coordinates fall within the documented city extent and whose location names identify Davao; includes compact severity/status/type/date filters, marker popups, refresh, and optional Google Maps directions.
- Detection details: coordinates, evidence image, dimensions, timestamps, source device, and inspector/admin workflow status controls. Inspectors can choose a photo from the device gallery; it is uploaded to the shared crack-images storage bucket and attached when corrections are saved. Gallery uploads are limited to 5 MB.
- Inspection review: edit detection details, mark records reviewed, soft-exclude duplicates, add append-only remarks, then select reviewed records and forward them as a batch. A forwarded detection can be corrected and marked reviewed again to create a follow-up batch for the same crack; previous batches keep their submitted snapshots.
- Diagnostics: read-only query result, retrieved count, total count when permitted, and a small sample of fields.
- Settings: signed-in account and sign-out.
- Detection details: inspector/admin accounts can update a detection's workflow status. Status changes are saved by the authenticated website API.

## Raspberry Pi ingestion and inspector workflow

The Next.js website server receives Pi detections at `POST /api/device/detections`; the mobile app is not an ingestion server and must never contain a device token or Supabase secret. Configure `PI_INGESTION_TOKEN` in the website server's `.env.local` and in the Pi's protected configuration. Generate a long random token, for example with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`. Use HTTPS for deployed systems and rotate the token if it is exposed.

Send a bearer token and JSON body using this contract:

```json
{
  "deviceId": "davao-pi-01",
  "detectionId": "stable-unique-id-for-this-detection",
  "location": "Davao City, Bajada",
  "coordinates": { "lat": 7.0975, "lng": 125.6138 },
  "crackType": "pothole",
  "severity": "high",
  "imageUrl": "https://example.org/evidence/detection.jpg",
  "widthMm": 120,
  "lengthMm": 240,
  "depthMm": 35,
  "description": "Optional model output",
  "detectedAt": "2026-11-08T10:00:00Z"
}
```

`imageUrl`, measurements, description, and `detectedAt` are optional; image URLs must use HTTPS. To store evidence in the configured Supabase bucket, first send the image as multipart form field `file` to `POST /api/device/uploads` with the same bearer token, then use its returned `data.url` as `imageUrl`. Supported `crackType` values are `transverse`, `longitudinal`, `block`, `corner`, `diagonal`, `meandering`, `reflection`, and `pothole`. The Pi must reuse the same `deviceId` and `detectionId` when retrying a detection; the database uniqueness constraint makes retries idempotent. The ingestion endpoint always starts new records at status `new`.

Apply `supabase/migrations/006_pi_detection_ingestion.sql` in the Supabase SQL Editor after migrations 001, 002, 003, and 005. Then apply `supabase/migrations/007_inspector_review_batches.sql` and `supabase/migrations/008_forwarded_inspection_snapshots.sql`. Do not run migration 004 unless you intentionally want to delete existing crack rows and load its synthetic sample records. Migration 006 adds device/detection source IDs, uniqueness for retries, and the pothole type. Migration 007 adds the inspector review state, soft-duplicate links, append-only notes, batch forwarding, and website department-review data. Migration 008 snapshots each forwarded batch and enables follow-up reviews without changing previous submissions. `POST /api/cracks` no longer accepts unauthenticated writes.

Inspectors sign in with their Supabase account and can update status to `new`, `assigned`, `in-progress`, or `resolved` from detection details. They can edit supported detection fields, soft-exclude duplicates (the detection remains recoverable), add remarks that cannot be overwritten, and forward reviewed records in batches. A forwarded detection can be edited and marked reviewed again to create a follow-up inspection for the same crack; the submitted contents and inspector remarks of each batch are snapshotted. The website API requires the user's Supabase access token and an `app_metadata.role` of `inspector` or `admin` for these operations. Set those roles in Supabase Auth.

The website's `/inspections` page displays forwarded batches, detection details, and inspector remarks. A department reviewer can mark a batch reviewed or request changes with an optional note. Requesting changes returns those detections to the inspector's pending queue so they can be corrected and forwarded again, while preserving the original batch history. Assign the department account `app_metadata.role=reviewer` in Supabase Auth; admins can also submit department review outcomes. Other authenticated roles can view batches but cannot change the department decision.

This repository does not include Raspberry Pi capture/inference or sender code. The server endpoints accept authenticated image uploads and detections; deploy/configure them and apply the database migration before expecting Pi detections or inspector updates to work.

Initial fetch and manual refresh are available. A read-only Realtime channel join succeeded during inspection, but row event delivery has not been tested, so the app does not claim new detections update live. Supabase schema-cache, RLS, and network errors are shown in the app.

## Observed data contract

`public.cracks` has UUID `id`, `location`, latitude/longitude plus PostGIS `coordinates`, `image_url`, `crack_type`, `severity`, `status`, width/length/depth in mm, description, assigned user, detected/resolved/created/updated timestamps. `public.crack_records` is the read view used by the website API. On 2026-10-28, a read-only publishable-key query returned 7 rows and the 17 expected view columns. No detection data was modified.

`validation_reports` is a separate road-section inspection/validation form, not a detection-linked report: its checked-in schema has region, office, inspection dates, road section, DPWH defect code, quantity, remarks, and preparer, but no crack foreign key, report status, or assignee. `district_summaries` stores JSON sections. Both report objects returned zero rows in the live read-only check. The schema has no AI confidence or separate human-confirmed assessment/history. The app therefore does not display a confidence score or present predictions as verified DPWH assessments. Migration 006 adds optional device and idempotency identifiers for Pi-originated records.

The live publishable-key query returned 7 rows from `crack_records`, while a direct `cracks` query returned 0 rows under the same role. This is consistent with the view exposing rows not visible through base-table RLS, but exact live view security mode and `pg_policies`/grant definitions cannot be inspected with a publishable key. Verify these in Supabase before treating app authentication as the data boundary. Migration 006 adds source-device and source-detection identifiers for Pi-ingested records; those fields are null for older records.

## Limits and operations

- `cracks` and `validation_reports` have RLS enabled in migration 001/002, with no policies in those files. Exact live policies and grants remain uninspected. Mobile reads detections directly and changes status only through the role-authorized Next.js API.
- The website report CRUD currently uses `validation_reports`, but that table has no relationship to `cracks`. Before linking reports to detections, confirm whether `validation_reports` is the intended DPWH report entity; a join table linking report IDs to crack IDs is the smallest safe many-to-many relationship if a report can cover multiple detections.
- Website report API routes still use a server-only service-role client for database operations, but now verify the Supabase access token and `app_metadata.role` first. Current route policy: all four known roles can read; `admin` and `inspector` can create/edit; `admin` can delete. This policy follows the existing role names and should be confirmed with the project owners. The website caller now sends its access token. Live role-based API tests have not been run.
- Realtime subscription joined successfully, but event delivery remains unverified. No background push notifications are implemented.
- Pi ingestion requires migration 006, a configured `PI_INGESTION_TOKEN`, a reachable deployed website API, and a Pi sender that follows the documented request contract. This repository does not include Pi capture/inference code or image upload.
- Image evidence is loaded from the existing public `crack-images` storage URL. Broken URLs show an error state.
- Automated tests against a live Supabase project need project credentials and configured test accounts. Use the integration checklist in `tests/INTEGRATION.md` for Pi, website, and mobile verification.

## Commands

```powershell
npm run start
npx tsc --noEmit
npm run lint
```
