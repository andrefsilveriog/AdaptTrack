# Body Recomposition Tracker (React + Firebase)

Single-page app for body recomposition tracking:
- Daily logging (weight, macros)
- Strength logging (3 exercises) as **best last set**: Load (kg) + Reps → stores estimated **1RM**
- Optional weekly Navy Method measurements (+ optional triple-measure mode)
- Client-side 7-day exponentially weighted moving average (alpha = 2/(7+1))
- Dashboard with Summary + Trend Explorer
- Entry page: you can save an entry as long as it has **at least one** piece of data (weight OR macros OR any body measurement OR any complete exercise set)
- Profile includes **name** + **date of birth** (DOB improves Navy BF% age calculations)
- Email/password auth only
- Firestore per-user security rules

## Strength 1RM details
- You enter **Load (kg)** + **Reps** for your best last set per exercise (optional each day).
- The app computes estimated 1RM using the **Brzycki** formula: `1RM = load * 36 / (37 - reps)`.
- Internally, the computed 1RM is stored in the existing `bench` / `squat` / `deadlift` fields (for now), but the UI calls them **Exercises**.

---

## 1) Firebase setup
### Create a Firebase project
1. Firebase Console → Add project
2. Create a Web App (</>) and copy the config values

### Authentication
Firebase Console → Authentication → Sign-in method → Enable **Email/Password**

### Firestore
Firebase Console → Firestore Database → Create database

### Firestore rules
Firebase Console → Firestore → Rules → paste the contents of `firestore.rules` from this repo.

> Admin access is granted by setting `users/{uid}.isAdmin = true`.

---

## 2) Local dev
### Environment variables
Copy:
```bash
cp .env.example .env.local
```
Fill `.env.local` with your Firebase Web App config:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID` (optional)

### Run
```bash
npm install
npm run dev
```

---

## 3) Deploy
This repo is set up for GitHub Pages via `npm run deploy`.
If you change the repository name, update `base` in `vite.config.js`.

Also add your GitHub Pages domain to Firebase authorized domains:
Firebase Console → Authentication → Settings → Authorized domains → add:
- `<your-username>.github.io`

---

## Notes
- Notifications UI is a placeholder (popover in the navbar). There is no dedicated notifications page.
- Cycles support optional end date: leave blank for “active”.
