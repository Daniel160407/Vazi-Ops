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

`GlobalStore` (`src/stores/GlobalStore.ts`) is the single source of truth. On app mount (`App.vue` → `setData()`), it opens `onSnapshot` listeners for every Firestore collection and exposes reactive refs. A `loadingCount` counter tracks how many listeners are still initialising; `loading` is a computed boolean derived from it.

Collections loaded by GlobalStore:
- `groups` → `groups: ref<Group[]>`
- `clubs` → `clubs: ref<Club[]>`
- `club_bookings` → `clubBookings: ref<ClubBooking[]>`
- `schedules` → `schedules: ref<Schedule[]>` (keyed by `name`, currently only `"day_schedule"`)
- `evening_schedule` → `eveningScheduleItems: ref<EveningScheduleItem[]>` (ordered by `position asc`)
- `events` → `events: ref<Event[]>`
- `deadline` → `deadline: ref<Deadline | null>`
- `verses` → `goldenVerses: ref<GoldenVerse[]>` (ordered by `day asc`)
- `announcements` → `announcements: ref<Announcement[]>` (ordered by `date desc`)

CRUD composables (`src/composables/use*Crud.ts`) read data from the store via `storeToRefs` and write directly to Firestore. They maintain a local `saving` ref; pages consume a derived `loading = computed(() => saving.value || loadingStore.value)` covering both initial load and in-flight mutations.

### Auth

`useAuth` (`src/composables/useAuth.ts`) is a module-level singleton (refs live outside the composable function). Google sign-in via popup; after sign-in, the user's email is checked against the `admins` Firestore collection — non-admins are immediately signed out. Exposes `fullName`, `profileImg`, `isLoggedIn`.

### Routing

Dual-surface pattern: every feature has a public read-only page and an admin edit page. All route paths, Georgian UI labels, and PrimeIcons icon strings are centralised in `src/composables/constants.ts`.

| Public route | Admin route | Page pair |
|---|---|---|
| `/groups` | `/admin/groups` | GroupsPage / GroupsEditPage |
| `/clubs` | `/admin/clubs` | ClubsPage / ClubsEditPage |
| — | `/admin/club-bookings` | ClubBookingsPage |
| `/day-schedule` | `/admin/day-schedule` | DaySchedulePage / DayScheduleEditPage |
| `/evening-schedule` | `/admin/evening-schedule` | EveningSchedulePage / EveningScheduleEditPage |
| `/events` | `/admin/events` | EventsPage / EventsEditPage |
| `/verses` | `/admin/verses` | GoldenVersesPage / GoldenVersesEditPage |
| `/announcements` | `/admin/announcements` | AnnouncementsPage / AnnouncementsEditPage |

### Navigation layout

- **Mobile** (`< lg`): fixed bottom nav (`BottomNav.vue`) with 5 tabs (ჯგუფები, წრეები, ნომრები, საღამო, სხვა). "სხვა" opens `MoreSheet.vue` — a slide-up bottom sheet containing the remaining public routes and all admin routes (or a sign-in button if not logged in).
- **Desktop** (`lg+`): fixed left sidebar (`SideNav.vue`, `w-56`) with all public + admin routes, user avatar/name, and logout. Main content area offset with `lg:ml-56`.
- `App.vue` mounts `<SideNav class="hidden lg:flex" />`, `<BottomNav class="lg:hidden" />`, and `<MoreSheet>` (always mounted so close animation plays). Content column is `max-w-2xl`, `px-4 lg:px-8`, `pb-24 lg:pb-10`.

### Image uploads

`useImgBB` (`src/composables/useImgBB.ts`) uploads images to ImgBB (base64 via their REST API) and returns a `display_url`. Max 5 MB per image, 20 MB total for multi-upload. Used only by `DayScheduleEditPage`.

### UI conventions

#### Color palette
All pages use a consistent dark blue + black theme:
- Page background: `bg-[#03060f]`
- Card background: `bg-[#0d1829]`
- Sheet / overlay background: `bg-[#07101e]`
- Card border: `border-blue-900/20`
- Active/accent: `blue-500`, `blue-600`
- Left accent border on cards: `border-l-4 border-l-*` (color varies by context)

#### Component patterns
- **Cards**: `rounded-2xl border border-l-4 border-blue-900/20 bg-[#0d1829]` with a colored `border-l-*` accent
- **Icon pills**: `flex h-6 w-6 items-center justify-center rounded-lg bg-blue-900/30` containing a `pi-*` icon at `text-[10px] text-blue-400`
- **Section stats**: 2-column grid of `rounded-2xl bg-[#0d1829]` cards with `text-3xl font-bold` number and `text-[10px] uppercase tracking-widest text-slate-500` label
- **Search bar**: `rounded-2xl border border-blue-900/30 bg-[#0d1829]` with absolute `pi-search` icon
- **FAB**: `fixed bottom-24 right-5 lg:bottom-8 lg:right-8 z-30 rounded-2xl bg-blue-600 h-13 w-13`
- **Filter tabs**: `rounded-xl px-3 py-1.5 text-xs font-semibold` — active: `bg-blue-600 text-white`, inactive: `border border-blue-900/20 bg-[#0d1829] text-slate-500`

#### Bottom sheet pattern (used on all edit pages)
Always uses two separate `<Transition>` elements inside `<Teleport to="body">` — one for the backdrop fade, one for the sheet slide-up. Never use a single transition wrapping both.

```vue
<Teleport to="body">
  <Transition name="backdrop">
    <div v-if="sheetVisible" class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" @click="sheetVisible = false" />
  </Transition>
  <Transition name="sheet">
    <div v-if="sheetVisible" class="fixed bottom-0 left-0 right-0 z-50 max-h-[92vh] overflow-y-auto rounded-t-3xl border-t border-blue-900/40 bg-[#07101e] p-5" @click.stop>
      ...
    </div>
  </Transition>
</Teleport>

<style scoped>
.backdrop-enter-active { transition: opacity 0.25s ease; }
.backdrop-leave-active { transition: opacity 0.2s ease; }
.backdrop-enter-from, .backdrop-leave-to { opacity: 0; }

.sheet-enter-active { transition: transform 0.35s cubic-bezier(0.32, 0.72, 0, 1); }
.sheet-leave-active { transition: transform 0.25s cubic-bezier(0.4, 0, 1, 1); }
.sheet-enter-from, .sheet-leave-to { transform: translateY(100%); }
</style>
```

#### Color coding by domain
- **Groups**: blue dot = male (`bg-blue-400`), rose dot = female (`bg-rose-400`)
- **Clubs availability**: emerald = places available, amber = ≤3 places, red = full
- **Events / Evening Schedule**: amber = pending, emerald = accepted, red = rejected
- **Announcements tags**: red=სასწრაფო, blue=განრიგი, amber=კვება, purple=შეკრება, emerald=აქტივობა, teal=ჯანმრთელობა, cyan=გასათვალისწინებელი
- **Golden Verses**: yellow accent (`border-l-yellow-500/50`, `text-yellow-400`)
- **Events countdown timer**: `text-yellow-400` with `border-yellow-900/30`

#### Other conventions
- PrimeVue components are used directly (no wrapper layer) only where native HTML cannot replace them: `DatePicker`, `useToast`, `useConfirm`, `ConfirmDialog`, `Toast`. All form inputs, buttons, and layout elements are plain HTML + Tailwind.
- Toast notifications use PrimeVue's `useToast()` with Georgian (`ka`) text strings.
- All UI-facing strings are in Georgian; Firestore collection/field names are in English with underscores.
- `date-fns` with `ka` locale for date formatting; `intervalToDuration` for the events countdown.
- Club registration uses a Firestore transaction to atomically decrement `places_quantity` and create the booking document.
- Evening schedule reordering: local `ref<EveningScheduleItem[]>` mirrors the store, HTML5 drag-and-drop (`draggable`, `@dragstart/@dragover/@dragend`) reorders it locally, then "რიგის შენახვა" calls `updateScheduleOrder` which batch-updates `position` fields.
- ClubBookings admin page groups bookings by `club_name` using a `Map`; each group renders as a card with an inner scrollable table (`overflow-x-auto` inside `overflow-hidden` card, custom `4px` scrollbar styled to match the dark theme).
