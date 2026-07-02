# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # start Vite dev server
npm run build     # type-check (vue-tsc) then Vite build
npm run preview   # preview the production build
```

There is no test suite and no lint script configured.

## Environment variables

Copy `.env` and populate the following before running locally:

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_MEASUREMENT_ID
VITE_IMGBB_API_KEY
```

## Architecture

**Stack:** Vue 3 (Composition API, `<script setup>`) · TypeScript · Vite · Pinia · Vue Router · PrimeVue 4 (Noir theme, PrimeIcons) · Tailwind CSS v4 · Firebase (Firestore + Auth)

### Data flow

`GlobalStore` (`src/stores/GlobalStore.ts`) is the single source of truth. On app mount (`App.vue` → `setData()`), it opens `onSnapshot` listeners for every Firestore collection and exposes the reactive refs. A `loadingCount` counter tracks how many listeners are still initialising; `loading` is a computed boolean derived from it.

CRUD composables (`src/composables/use*Crud.ts`) read data from the store via `storeToRefs` and write directly to Firestore. They maintain a local `saving` ref and expose a derived `loading = computed(() => saving.value || loadingStore.value)` so pages get a single boolean covering both initial load and in-flight mutations.

### Auth

`useAuth` (`src/composables/useAuth.ts`) is a module-level singleton (refs live outside the composable function). Google sign-in via popup; after sign-in, the user's email is checked against the `admins` Firestore collection — non-admins are immediately signed out. Admin navigation in `App.vue` triggers sign-in on demand before routing.

### Routing

Dual-surface pattern: every feature has a public read-only page (e.g. `/events`) and an admin edit page (e.g. `/admin/events`). Route constants and Georgian UI labels/PrimeIcons icon strings are all centralised in `src/composables/constants.ts`.

### Image uploads

`useImgBB` (`src/composables/useImgBB.ts`) uploads images to ImgBB (base64 via their REST API) and returns a `display_url`. Max 5 MB per image, 20 MB total for multi-upload.

### UI conventions

- PrimeVue components are used directly (no wrapper layer); the custom `Noir` preset (`src/presets/Noir.ts`) overrides Aura's colour palette to an all-surface monochrome scheme.
- Toast notifications use PrimeVue's `useToast()` with Georgian (`ka`) text strings.
- All UI-facing strings are in Georgian; Firestore collection/field names are in English with underscores.
- Dark mode class: `.app-dark` (currently always applied via black background).
