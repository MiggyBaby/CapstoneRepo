# Integration verification checklist

These checks require the project's Supabase environment and authorized accounts; the hardware checks require the Raspberry Pi and Coral device.

1. Apply database migrations 001–006 and verify authenticated read plus staff update policies in Supabase.
2. Sign in to mobile with an existing Supabase Auth account. Confirm the detections list reads the same `crack_records` IDs as the website.
3. Insert a test row into `cracks`; confirm it appears in both clients. Verify Realtime subscription status in Supabase logs and test pull-to-refresh after disabling Realtime.
4. Sign in as `viewer`; confirm status update is rejected. Sign in as `admin`, `inspector`, or `worker`; update status in mobile and confirm the website displays the same status.
5. Check empty list, invalid UUID, inaccessible/missing `image_url`, offline request, expired session, and missing environment variables.
6. Pi test is currently blocked: first implement an authenticated device endpoint, stable record ID/idempotency, and image upload contract. Then interrupt network during a retry and verify one row only.

No automated live-backend or hardware tests are included because the repository contains no test backend, credentials, device uploader, or hardware fixtures.
