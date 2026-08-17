# Coastal Haven — OrangeBeachStay.com

A mobile-first direct-booking PWA for Coastal Haven at Phoenix V, Orange Beach, Alabama.

## Stack
- React + TypeScript + Vite frontend
- FastAPI + SQLAlchemy backend
- PostgreSQL on Render (SQLite works locally)
- Guesty availability adapter
- PriceLabs pricing adapter
- Stripe Checkout payment flow (payouts can go to Bluevine)
- Owner admin dashboard with instant-booking toggle, fees, security protection, cancellation policy, promo code and guest chat

## Run locally

### Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\\Scripts\\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Open http://localhost:5173. Admin is at `/admin`.

## Render deployment
1. Push this folder to a GitHub repository.
2. In Render, choose **New > Blueprint** and select the repository. `backend/render.yaml` is included, or create two services manually.
3. Add backend environment variables from `backend/.env.example`.
4. Set `FRONTEND_URL` to your Render static-site URL (later `https://orangebeachstay.com`).
5. Set frontend `VITE_API_URL` to the deployed FastAPI URL.
6. Change `ADMIN_PASSWORD` before going live.

## GoDaddy / OrangeBeachStay.com
After the Render frontend is deployed, open the custom-domain section in Render, add `orangebeachstay.com` and `www.orangebeachstay.com`, then copy the DNS records Render provides into GoDaddy DNS. Do not change nameservers unless Render specifically instructs you to.

## Guesty
The UI is complete, but live Guesty sync requires API access. Add `GUESTY_API_TOKEN` and `GUESTY_LISTING_ID` when available. Guesty account/API variants use different calendar endpoints, so the provider-specific code is isolated in `backend/app/integrations.py` for a one-file adjustment if your plan exposes a different endpoint.

Without Guesty credentials, the app clearly marks availability as demo/fallback rather than pretending it is live.

## PriceLabs
Add `PRICELABS_API_KEY` and `PRICELABS_LISTING_ID`. Until configured, the quote API uses a deterministic seasonal demo rate and labels it as such.

## Stripe + Bluevine
Create a Stripe account and connect your Bluevine checking account as the payout bank. Add `STRIPE_SECRET_KEY`. Stripe Checkout is already wired into the booking endpoint. For production, also add a Stripe webhook to mark paid bookings as confirmed after `checkout.session.completed`.

## Security deposit
The admin dashboard controls security mode and amount. The quote displays a security authorization separately; production capture/authorization behavior should be finalized in Stripe once you choose whether to use manual capture, a damage waiver provider, or Guesty’s protection workflow.

## Direct pricing
The admin dashboard defaults to a 10% direct-booking discount. If Guesty/PriceLabs already returns a channel-adjusted direct price, set the discount to 0 in `/admin` to avoid double-discounting.

## Policies currently reflected from the public listings
- Check-in 4:00 PM
- Checkout 10:00 AM on the site (Airbnb public listing)
- Primary renter 25+
- No smoking, parties or pets
- Quiet hours 10 PM–8 AM
- Parking pass shown as $55 per vehicle; typically two vehicles per reservation
- Typical 3-night minimum, with seasonal variation

Review these in production whenever HOA/listing rules change.

## Public privacy
The website intentionally shows only **Phoenix V · Orange Beach, Alabama**. Exact address and Unit 1408 are not published on the public pages.

## Images
The supplied property photographs are copied to `frontend/public/images`. Several include Baldwin MLS marks. Confirm you have web-display rights or replace them with your own unwatermarked photos before public launch.
