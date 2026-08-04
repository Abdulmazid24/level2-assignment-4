# FixItNow 🔧

**Your Trusted Home Service Platform** — a backend API for a home services
marketplace. Customers browse services and book technicians, technicians manage
their profile, availability and jobs, and admins moderate the platform.

- **Live API:** https://level2-assignment-4-eta.vercel.app
- **API base path:** `/api`

---

## Tech Stack

| Layer | Choice |
|---|---|
| Runtime | Node.js + Express 5 |
| Language | TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Auth | JWT (access + refresh), bcrypt password hashing |
| Validation | Zod |
| Payments | Stripe Checkout + webhooks |
| Bundler | tsup (esbuild) |
| Hosting | Vercel |

---

## Roles

| Role | What they can do |
|---|---|
| **CUSTOMER** | Browse services, book technicians, pay, track bookings, leave reviews |
| **TECHNICIAN** | Manage profile and availability, list services, accept/decline/complete jobs |
| **ADMIN** | Manage users (ban/unban), view all bookings, manage service categories |

Users pick `CUSTOMER` or `TECHNICIAN` at registration. `ADMIN` is seed-only and
cannot be self-assigned.

---

## Demo Credentials

| Role | Email | Password |
|---|---|---|
| Admin | `admin@fixitnow.com` | `Admin@123` |
| Technician | `rafiqul@fixitnow.com` | `Password@123` |
| Customer | `nusrat@example.com` | `Password@123` |

Other seeded logins: `shirin@fixitnow.com`, `tanvir@fixitnow.com` (technicians);
`imran@example.com`, `farhana@example.com` (customers) — all `Password@123`.

---

## Booking Lifecycle

```
REQUESTED ──accept──► ACCEPTED ──pay──► PAID ──start──► IN_PROGRESS ──finish──► COMPLETED
    │                     │                │                                        │
    └──decline──► DECLINED │                │                                    review
                           └────────────────┴──── customer cancels ──► CANCELLED
```

- Only the **technician** moves a booking to `ACCEPTED`, `DECLINED`,
  `IN_PROGRESS` or `COMPLETED`, and only along the arrows above.
- Payment is what moves a booking to `PAID`, and it is only allowed while the
  booking is `ACCEPTED`.
- A **customer** may cancel while the booking is `REQUESTED`, `ACCEPTED` or
  `PAID` — that is, any point before work starts.
- A review requires a `COMPLETED` booking and is limited to one per booking.

---

## API Endpoints

All responses share one envelope:

```json
{ "success": true, "message": "...", "data": { } }
```

Errors use the same shape with `success: false` and an `errorDetails` field.

### Auth

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register as customer or technician |
| POST | `/api/auth/login` | Public | Log in, returns access + refresh tokens |
| GET | `/api/auth/me` | Authenticated | Current user (with technician profile) |

### Public browsing

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/categories` | All service categories |
| GET | `/api/services` | Services — filters below |
| GET | `/api/services/:id` | Service detail with technician |
| GET | `/api/technicians` | Technicians — filters below |
| GET | `/api/technicians/:id` | Profile with services, availability, reviews |
| GET | `/api/reviews/technician/:id` | Reviews for one technician |

**`/api/services` filters:** `category`, `location`, `search`, `minPrice`,
`maxPrice`, `minRating`, `page`, `limit`
**`/api/technicians` filters:** `location`, `search`, `minRating`,
`maxHourlyRate`, `page`, `limit`

### Bookings (customer)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/bookings` | Create a booking |
| GET | `/api/bookings` | Own bookings — `status`, `page`, `limit` |
| GET | `/api/bookings/:id` | Booking detail (customer, its technician, or admin) |
| PATCH | `/api/bookings/:id/cancel` | Cancel before work starts |

### Payments (Stripe)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/payments/create` | Customer | Checkout session for an `ACCEPTED` booking |
| POST | `/api/payments/confirm` | Stripe | Webhook — verifies signature, marks paid |
| GET | `/api/payments` | Authenticated | Payment history, scoped by role |
| GET | `/api/payments/:id` | Authenticated | Payment detail |

### Technician account

| Method | Endpoint | Description |
|---|---|---|
| PUT | `/api/technician/profile` | Create or update profile |
| PUT | `/api/technician/availability` | Replace weekly availability slots |
| GET | `/api/technician/services` | Own services |
| POST | `/api/technician/services` | Add a service |
| PATCH | `/api/technician/services/:id` | Update a service |
| DELETE | `/api/technician/services/:id` | Remove a service |
| GET | `/api/technician/bookings` | Incoming bookings — `status`, `page`, `limit` |
| PATCH | `/api/technician/bookings/:id` | Accept / decline / start / complete |

### Reviews

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/reviews` | Customer | Review a completed booking |

### Admin

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/stats` | Platform totals and revenue |
| GET | `/api/admin/users` | Users — `role`, `status`, `search`, `page`, `limit` |
| PATCH | `/api/admin/users/:id` | Ban or reinstate (`{ "status": "BANNED" }`) |
| GET | `/api/admin/bookings` | All bookings — `status`, `page`, `limit` |
| GET | `/api/admin/categories` | All categories |
| POST | `/api/admin/categories` | Create a category |
| PATCH | `/api/admin/categories/:id` | Update a category |
| DELETE | `/api/admin/categories/:id` | Delete an unused category |

---

## Database Schema

| Model | Purpose |
|---|---|
| `User` | Account, credentials, role, `ACTIVE`/`BANNED` status |
| `TechnicianProfile` | Bio, skills, experience, hourly rate, location, cached rating |
| `AvailabilitySlot` | Weekday + start/end time a technician works |
| `Category` | Service category (Plumbing, Electrical, …) |
| `Service` | A priced offering by one technician in one category |
| `Booking` | A job: customer, technician, service, schedule, address, status |
| `Payment` | Stripe transaction tied 1-to-1 to a booking |
| `Review` | Customer's rating of a completed booking, one per booking |

---

## Running Locally

**1. Install**

```bash
npm install
```

**2. Create `.env`**

```
DATABASE_URL="postgresql://user:password@host:5432/fixitnow"
JWT_ACCESS_SECRET="a-long-random-string"
JWT_REFRESH_SECRET="a-different-long-random-string"
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
CLIENT_URL="http://localhost:3000"
NODE_ENV="development"
```

`DATABASE_URL`, `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` are required — the
server refuses to start without them rather than falling back to a guessable
default. Stripe keys are optional; without them only the payment routes fail,
with a 503.

**3. Migrate and seed**

```bash
npx prisma migrate dev
```

```bash
npm run db:seed
```

**4. Start**

```bash
npm run dev
```

Server listens on `http://localhost:3000`.

---

## Deployment

The bundle is built locally and uploaded, so Vercel never rebuilds it:

```bash
npm run deploy
```

Set `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`,
`STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` in the Vercel project's
Production environment, then redeploy — Vercel resolves environment variables
when a deployment is created, so a change only reaches the running function
after a new deploy.

Point the Stripe webhook at `https://<your-domain>/api/payments/confirm` and
subscribe to `checkout.session.completed`, `checkout.session.expired`,
`checkout.session.async_payment_succeeded` and
`checkout.session.async_payment_failed`.

---

## API Documentation

`postman/FixItNow.postman_collection.json` in this repo covers every endpoint.
Import it into Postman and set the collection variable `baseUrl` to either
`http://localhost:3000` or the live URL. The login requests store the returned
token automatically, so the authenticated requests work straight after.
