# MOTORMATE Car Service — Customer System Update

Added without replacing the existing homepage, services UI, booking form, staff login, or admin dashboard.

## Added
- Customer registration and login
- Secure password hashing (PBKDF2-HMAC)
- Signed expiring customer session tokens
- Customer dashboard
- Customer profile view/edit
- Customer booking history
- Booking status tracking including Cancelled
- Logged-in customer bookings linked to the customer account
- Booking confirmation with booking ID
- About, Contact and FAQ pages
- Customer navigation/logout

## Backend environment
Add this to `backend/.env`:
`CUSTOMER_AUTH_SECRET=replace-with-a-long-random-secret`

Keep your existing `DATABASE_URL`, admin credentials/token, and CORS settings.

## Run
Frontend:
`npm install`
`npm run dev`

Backend:
`pip install -r requirements.txt`
`uvicorn app.main:app --reload --port 8000`

If deploying the frontend separately from the backend, set:
`VITE_API_BASE_URL=https://YOUR-BACKEND-DOMAIN`

Do not upload your real `.env` file or secrets to GitHub.
