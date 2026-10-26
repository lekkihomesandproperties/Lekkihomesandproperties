# LEKKIHOMESANDPROPERTIES website

Responsive multi-page real-estate website with HTML, CSS and browser JavaScript, backed by Node.js, Express and MongoDB.

## Included
- Separate Home, About Us, Property Listings, Contact Us, Gallery and Projects pages
- Gold, deep green and white brand styling, using the supplied logo in the navbar
- Search/filter listings, property detail modal, view count, likes, comments and native share/copy link
- Admin login/dashboard APIs for creating, editing and deleting listings
- Paystack checkout initialization and verified webhook/callback flow (test mode until configured)
- Contact form endpoint and MongoDB models

## Run locally
1. Install Node.js 18+ and MongoDB, or create a MongoDB Atlas database.
2. Copy `.env.example` to `.env` and fill in `MONGODB_URI`, a strong `JWT_SECRET`, admin credentials and Paystack test keys.
3. In this folder run `npm install` then `npm run dev`.
4. Open `http://localhost:5000`.
5. Admin login is at `/admin.html`. Use the values in your `.env` file.

## Payments
Paystack is the sample payment provider. Keep the secret key on the server only. Use test keys first and complete Paystack account/KYC activation before accepting live money. A successful browser redirect alone is not proof of payment; the backend verifies the transaction with Paystack before marking an order paid. Configure your Paystack dashboard webhook URL to `https://YOUR-DOMAIN/api/payments/webhook` for production. Do not collect or store card details on this site.

## Property images
For production uploads, configure Cloudinary values in `.env`. This project intentionally does not save uploaded files to a public local folder as a production storage strategy. You can also use a direct image URL when creating a listing.

## Before launch
- Replace demo listings/contact details with verified company information.
- Set a strong unique admin password and JWT secret.
- Add HTTPS, production MongoDB credentials, backups, monitoring and rate limits appropriate to traffic.
- Have a Nigerian property lawyer review sale/lease terms, refunds, receipts, privacy notice and consumer disclosures.
- Confirm the right to advertise each property and accurately represent title, fees, availability and payment terms.
