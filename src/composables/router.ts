import { createRouter, createWebHistory } from "vue-router";
import { watch } from "vue";
import {
  ADMIN_GROUPS_ROUTE,
  ADMIN_CLUBS_ROUTE,
  ADMIN_CLUB_BOOKINGS_ROUTE,
  GROUPS_ROUTE,
  CLUBS_ROUTE,
  DAY_SCHEDULE_ROUTE,
  ADMIN_DAY_SCHEDULE_ROUTE,
  EVENING_SCHEDULE_ROUTE,
  ADMIN_EVENING_SCHEDULE_ROUTE,
  EVENTS_ROUTE,
  ADMIN_EVENTS_ROUTE,
  GOLDEN_VERSES_ROUTE,
  ADMIN_GOLDEN_VERSES_ROUTE,
  ANNOUNCEMENTS_ROUTE,
  ADMIN_ANNOUNCEMENTS_ROUTE,
  ADMIN_USERS_ROUTE,
  ADMIN_TABLE_ROUTE,
} from "./constants";
import { useAuth } from "./useAuth";
import { useGlobalStore } from "../stores/GlobalStore";

const routeToPageKey: Record<string, string> = {
  [GROUPS_ROUTE]: "groups",
  [CLUBS_ROUTE]: "clubs",
  [DAY_SCHEDULE_ROUTE]: "day_schedule",
  [EVENING_SCHEDULE_ROUTE]: "evening_schedule",
  [EVENTS_ROUTE]: "events",
  [GOLDEN_VERSES_ROUTE]: "golden_verses",
  [ANNOUNCEMENTS_ROUTE]: "announcements",
};
import GroupsPage from "../pages/GroupsPage.vue";
import ClubsPage from "../pages/ClubsPage.vue";
import GroupsEditPage from "../pages/GroupsEditPage.vue";
import ClubsEditPage from "../pages/ClubsEditPage.vue";
import ClubBookingsPage from "../pages/ClubBookingsPage.vue";
import DaySchedulePage from "../pages/DaySchedulePage.vue";
import DayScheduleEditPage from "../pages/DayScheduleEditPage.vue";
import EveningSchedulePage from "../pages/EveningSchedulePage.vue";
import EveningScheduleEditPage from "../pages/EveningScheduleEditPage.vue";
import EventsPage from "../pages/EventsPage.vue";
import EventsEditPage from "../pages/EventsEditPage.vue";
import GoldenVersesPage from "../pages/GoldenVersesPage.vue";
import GoldenVersesEditPage from "../pages/GoldenVersesEditPage.vue";
import AnnouncementsPage from "../pages/AnnouncementsPage.vue";
import AnnouncementsEditPage from "../pages/AnnouncementsEditPage.vue";
import UsersEditPage from "../pages/UsersEditPage.vue";
import TableEditPage from "../pages/TableEditPage.vue";

const routes = [
  { path: "/", redirect: GROUPS_ROUTE },
  { path: GROUPS_ROUTE, component: GroupsPage },
  { path: CLUBS_ROUTE, component: ClubsPage },
  { path: DAY_SCHEDULE_ROUTE, component: DaySchedulePage },
  { path: EVENING_SCHEDULE_ROUTE, component: EveningSchedulePage },
  { path: EVENTS_ROUTE, component: EventsPage },
  { path: GOLDEN_VERSES_ROUTE, component: GoldenVersesPage },
  { path: ANNOUNCEMENTS_ROUTE, component: AnnouncementsPage },
  { path: ADMIN_GROUPS_ROUTE, component: GroupsEditPage },
  { path: ADMIN_CLUBS_ROUTE, component: ClubsEditPage },
  { path: ADMIN_CLUB_BOOKINGS_ROUTE, component: ClubBookingsPage },
  { path: ADMIN_DAY_SCHEDULE_ROUTE, component: DayScheduleEditPage },
  { path: ADMIN_EVENING_SCHEDULE_ROUTE, component: EveningScheduleEditPage },
  { path: ADMIN_EVENTS_ROUTE, component: EventsEditPage },
  { path: ADMIN_GOLDEN_VERSES_ROUTE, component: GoldenVersesEditPage },
  { path: ADMIN_ANNOUNCEMENTS_ROUTE, component: AnnouncementsEditPage },
  { path: ADMIN_USERS_ROUTE, component: UsersEditPage },
  { path: ADMIN_TABLE_ROUTE, component: TableEditPage },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

function waitForAuth(): Promise<void> {
  const { loading } = useAuth();
  if (!loading.value) return Promise.resolve();
  return new Promise((resolve) => {
    const stop = watch(loading, (val) => {
      if (!val) {
        stop();
        resolve();
      }
    });
  });
}

function waitForPageVisibilities(): Promise<void> {
  const store = useGlobalStore();
  store.fetchPageVisibilities();
  if (store.pageVisibilitiesLoaded) return Promise.resolve();
  return new Promise((resolve) => {
    const stop = watch(() => store.pageVisibilitiesLoaded, (val) => {
      if (val) {
        stop();
        resolve();
      }
    });
  });
}

const publicPageOrder = [
  { key: "announcements", path: ANNOUNCEMENTS_ROUTE },
  { key: "groups", path: GROUPS_ROUTE },
  { key: "clubs", path: CLUBS_ROUTE },
  { key: "events", path: EVENTS_ROUTE },
  { key: "evening_schedule", path: EVENING_SCHEDULE_ROUTE },
  { key: "day_schedule", path: DAY_SCHEDULE_ROUTE },
  { key: "golden_verses", path: GOLDEN_VERSES_ROUTE },
];

function firstVisiblePath(store: ReturnType<typeof useGlobalStore>): string {
  for (const p of publicPageOrder) {
    const pv = store.pageVisibilities.find((v) => v.id === p.key);
    if (!pv || pv.is_visible) return p.path;
  }
  return "/";
}

router.beforeEach(async (to) => {
  if (to.path.startsWith("/admin")) {
    await waitForAuth();
    const { isAdmin } = useAuth();
    if (!isAdmin.value) return ANNOUNCEMENTS_ROUTE;
    return true;
  }

  const pageKey = routeToPageKey[to.path];
  if (!pageKey) return true;

  await waitForAuth();
  const { isAdmin } = useAuth();
  if (isAdmin.value) return true;

  await waitForPageVisibilities();
  const store = useGlobalStore();
  const pv = store.pageVisibilities.find((p) => p.id === pageKey);
  const visible = pv ? pv.is_visible : true;
  if (!visible) return firstVisiblePath(store);

  return true;
});

export default router;
