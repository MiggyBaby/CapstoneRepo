# DPWH Road Watch Mobile

Expo Router app focused on road-crack detection, using the same Supabase `crack_records` view as the existing Next.js website. It uses the project's publishable key and Supabase Auth; it never contains a service-role key.

## Setup on Windows

1. Install Node.js LTS and Expo Go on your Android phone.
2. From `mobile-app`, run `npm install`.
3. Set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env`; use the existing project URL and publishable key. Never use a service-role or secret key.
4. Start Expo with `npx expo start` and scan the QR code using Expo Go.
5. Keep the phone and computer on the same Wi-Fi.

The map tab embeds an interactive Leaflet map in `react-native-webview`, using the OpenFreeMap Liberty style through the MapLibre GL Leaflet JavaScript adapter. The adapter runs in the WebView; no MapLibre React Native module or custom development build is used. MapLibre GL JS and Leaflet assets load from pinned unpkg CDN versions, so map rendering needs an internet connection. The embedded page receives filtered detection fields over WebView messaging and never receives Supabase credentials. Google Maps directions remain optional.

## Screens

- Overview: exact database counts and recent records.
- Detections: location search, severity/status/type/date filters, pull-to-refresh, 25-row paging, and detail navigation.
- Davao City map: actual detections whose coordinates fall within the documented city extent and whose location names identify Davao; includes compact severity/status/type/date filters, marker popups, refresh, and optional Google Maps directions.
- Detection details: coordinates, evidence image, dimensions, timestamps, and workflow state (read-only).
- Diagnostics: read-only query result, retrieved count, total count when permitted, and a small sample of fields.
- Settings: signed-in account and sign-out.

Initial fetch and manual refresh are available. A read-only Realtime channel join succeeded during inspection, but row event delivery has not been tested, so the app does not claim new detections update live. Supabase schema-cache, RLS, and network errors are shown in the app.

## Observed data contract

`public.cracks` has UUID `id`, `location`, latitude/longitude plus PostGIS `coordinates`, `image_url`, `crack_type`, `severity`, `status`, width/length/depth in mm, description, assigned user, detected/resolved/created/updated timestamps. `public.crack_records` is the read view used by the website API. On 2026-10-28, a read-only publishable-key query returned 7 rows and the 17 expected view columns. No detection data was modified.

`validation_reports` is a separate road-section inspection/validation form, not a detection-linked report: its checked-in schema has region, office, inspection dates, road section, DPWH defect code, quantity, remarks, and preparer, but no crack foreign key, report status, or assignee. `district_summaries` stores JSON sections. Both report objects returned zero rows in the live read-only check. The checked-in schema has no AI confidence, device identifier, idempotency key, or separate human-confirmed assessment/history. The app therefore does not display a confidence score or present predictions as verified DPWH assessments.

The live publishable-key query returned 7 rows from `crack_records`, while a direct `cracks` query returned 0 rows under the same role. This is consistent with the view exposing rows not visible through base-table RLS, but exact live view security mode and `pg_policies`/grant definitions cannot be inspected with a publishable key. Verify these in Supabase before treating app authentication as the data boundary.

## Raspberry Pi integration status

No Raspberry Pi or Coral uploader code exists in this repository. The existing `POST /api/cracks` route accepts location, coordinates, crack type, severity, image URL, dimensions, description and detection time, but does not authenticate the device or enforce an idempotency key; it writes with a server service-role client. Do not distribute that privileged key or expose this route as a device endpoint. A device uploader requires a server-side authenticated device endpoint and an agreed stable detection ID/idempotency design. Neither is currently implemented, so this mobile app does not claim end-to-end Pi upload support.

## Limits and operations

- `cracks` and `validation_reports` have RLS enabled in migration 001/002, with no policies in those files. Exact live policies and grants remain uninspected. The app is read-only.
- The website report CRUD currently uses `validation_reports`, but that table has no relationship to `cracks`. No schema migration was made. Before linking reports to detections, confirm whether `validation_reports` is the intended DPWH report entity; a join table linking report IDs to crack IDs is the smallest safe many-to-many relationship if a report can cover multiple detections.
- Website report API routes still use a server-only service-role client for database operations, but now verify the Supabase access token and `app_metadata.role` first. Current route policy: all four known roles can read; `admin` and `inspector` can create/edit; `admin` can delete. This policy follows the existing role names and should be confirmed with the project owners. The website caller now sends its access token. Live role-based API tests have not been run.
- Realtime subscription joined successfully, but event delivery remains unverified. No background push notifications are implemented.
- Image evidence is loaded from the existing public `crack-images` storage URL. Broken URLs show an error state.
- Automated tests against a live Supabase project need project credentials and configured test accounts. Use the integration checklist in `tests/INTEGRATION.md` for Pi, website, and mobile verification.

## Commands

```powershell
npm run start
npx tsc --noEmit
npm run lint
```

