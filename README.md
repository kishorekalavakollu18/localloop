# LocalLoop — Hyperlocal Service Marketplace 📍

LocalLoop is a geolocation-based marketplace connecting neighborhood customers with nearby local service providers (plumbers, electricians, tutors, tiffin/meal services, cleaners, appliance technicians), featuring real-time discovery on Leaflet OpenStreetMap, instant time slot booking, and verified reviews.

---

## 🌟 Key Highlights & Features

- **🗺️ Leaflet.js + OpenStreetMap (Free, No Billing)**: High-performance interactive maps with custom category pins, user GPS pulse indicator, radius filtering (5km–50km), and live card-to-pin focus syncing.
- **⚡ MongoDB Atlas 2dsphere Geospatial Index**: High-speed `$geoNear` aggregation queries computing exact straight-line and spherical distance (km) for nearby providers.
- **🔒 JWT Authentication & Roles**: Role-based access control with `customer`, `provider`, and `admin` roles, bcrypt password hashing, and protected workspace routes.
- **📅 Interactive Booking Flow**: Select preferred calendar dates and working time slots with live status transitions (`pending` → `confirmed` → `completed` / `cancelled`).
- **⭐ Automated Rating Aggregation**: Dynamic MongoDB recalculation of average star ratings and review counters upon feedback submission.
- **💼 Provider Workspace**: Comprehensive dashboard to accept/reject incoming bookings, edit pricing/categories, and manage weekly working day time slots.
- **🙋‍♂️ Customer Workspace**: Track all active and historical requests, cancel appointments, and rate completed services.
- **📱 Responsive Mobile-First Design**: Built with Tailwind CSS and modern card-based glassmorphism aesthetics.

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 19, Vite, Tailwind CSS, React Router v7, Axios, Lucide Icons |
| **Mapping** | Leaflet.js & OpenStreetMap Tile Services |
| **Backend** | Node.js, Express.js (REST API) |
| **Database** | MongoDB Atlas / Local MongoDB with `2dsphere` index |
| **Auth & Security** | JSON Web Tokens (JWT), Bcrypt.js |
| **File Handling** | Multer (local `/uploads` storage) |

---

## 📁 Project Architecture

```
localloop/
├── backend/
│   ├── .env                    # Environment variables (MONGODB_URI, JWT_SECRET, PORT)
│   ├── .env.example            # Environment configuration template
│   ├── server.js               # Express application entry point
│   ├── package.json
│   ├── uploads/                # Provider photo and document uploads
│   └── src/
│       ├── config/
│       │   └── db.js           # Mongoose connection & index configuration
│       ├── controllers/
│       │   ├── authController.js
│       │   ├── providerController.js
│       │   ├── bookingController.js
│       │   └── reviewController.js
│       ├── middleware/
│       │   ├── authMiddleware.js    # JWT verification & role authorization
│       │   └── uploadMiddleware.js  # Multer disk storage configuration
│       ├── models/
│       │   ├── User.js         # User schema & bcrypt methods
│       │   ├── Provider.js     # GeoJSON Point schema & 2dsphere index
│       │   ├── Booking.js      # Customer-Provider booking relationship
│       │   └── Review.js       # Star ratings & aggregate hooks
│       ├── routes/
│       │   ├── authRoutes.js
│       │   ├── providerRoutes.js
│       │   ├── bookingRoutes.js
│       │   └── reviewRoutes.js
│       └── seed/
│           └── seedData.js     # Sample realistic providers across 6 categories
│
└── frontend/
    ├── package.json
    ├── vite.config.js          # Vite with Tailwind & API reverse proxy
    ├── index.html              # Leaflet CSS & typography
    └── src/
        ├── App.jsx             # React Router route definitions
        ├── index.css           # Tailwind base styles & Leaflet map markers
        ├── context/
        │   └── AuthContext.jsx # User session & token management
        ├── services/
        │   └── api.js          # Axios client with request/response interceptors
        ├── utils/
        │   └── geo.js          # Geolocation handlers & city presets
        ├── components/
        │   ├── Navbar.jsx
        │   ├── Footer.jsx
        │   ├── LeafletMap.jsx   # Interactive map with category pins
        │   ├── ProviderCard.jsx
        │   ├── BookingModal.jsx
        │   ├── ReviewModal.jsx
        │   ├── ProtectedRoute.jsx
        │   └── StatusBadge.jsx
        └── pages/
            ├── LandingPage.jsx
            ├── DiscoverPage.jsx # Map + filter list with live GPS & radius slider
            ├── ProviderProfilePage.jsx
            ├── LoginPage.jsx    # Includes 1-click test accounts
            ├── RegisterPage.jsx # Customer or Provider onboarding
            ├── CustomerDashboard.jsx
            └── ProviderDashboard.jsx
```

---

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or newer)
- MongoDB instance (MongoDB Community Server locally on port 27017, or a free [MongoDB Atlas cluster](https://www.mongodb.com/atlas))

### 2. Environment Configuration
Inspect or create `backend/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/localloop
JWT_SECRET=localloop_super_secret_jwt_key_2026_hyperlocal_market
NODE_ENV=development
```
*(For MongoDB Atlas, replace `MONGODB_URI` with your connection string: `mongodb+srv://<user>:<password>@cluster0.mongodb.net/localloop?retryWrites=true&w=majority`)*

### 3. Seed Realistic Sample Data
Populate realistic local providers, coordinates, bookings, and reviews:
```bash
cd backend
npm run seed
```

### 4. Run the Backend & Frontend Dev Servers

**Terminal 1 — Backend API:**
```bash
cd backend
npm run dev
# Server will start on http://localhost:5000
```

**Terminal 2 — Frontend App:**
```bash
cd frontend
npm run dev
# Vite will launch on http://localhost:3000
```

---

## 🔑 Demo Login Accounts

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Customer** | `rahul@example.com` | `password123` | Customer with active and completed bookings |
| **Customer** | `priya@example.com` | `password123` | Customer account |
| **Provider (Plumber)** | `ramesh.plumbing@example.com` | `password123` | Ramesh HydroTech & Plumbing Works (Indiranagar) |
| **Provider (Electrician)**| `anil.spark@example.com` | `password123` | Anil Spark Electricals (Koramangala) |
| **Provider (Tutor)** | `neha.tutor@example.com` | `password123` | Neha Personalized Tutoring (HSR Layout) |

*(You can also use the 1-click login buttons on the `/login` page)*

---

## 📡 REST API Reference

### Authentication
- `POST /api/auth/register` — Register a new customer or provider user
- `POST /api/auth/login` — Sign in and receive JWT token + provider details
- `GET /api/auth/me` *(Protected)* — Get current user session

### Providers
- `POST /api/providers` *(Protected, Provider only)* — Register provider profile
- `GET /api/providers/nearby?lat=&lng=&radius=&category=&sort=&search=` — Proximity search via MongoDB 2dsphere index
- `GET /api/providers/:id` — Provider profile, gallery, schedule, and reviews
- `PUT /api/providers/:id` *(Protected, Owner only)* — Update service listing and slots
- `POST /api/providers/:id/upload` *(Protected)* — Upload work sample images

### Bookings
- `POST /api/bookings` *(Protected, Customer)* — Book a service date and slot
- `GET /api/bookings/customer/:customerId` *(Protected)* — Get customer bookings
- `GET /api/bookings/provider/:providerId` *(Protected)* — Get provider bookings
- `PUT /api/bookings/:id/status` *(Protected)* — Accept, complete, or cancel booking

### Reviews
- `POST /api/reviews` *(Protected, Customer)* — Submit star rating & review
- `GET /api/reviews/provider/:providerId` — Fetch reviews for a provider
