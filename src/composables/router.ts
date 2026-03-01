import { createRouter, createWebHistory } from "vue-router";
import {
  ADMIN_GROUPS_ROUTE,
  ADMIN_CLUBS_ROUTE,
  ADMIN_CLUB_BOOKINGS_ROUTE,
  GROUPS_ROUTE,
  CLUBS_ROUTE,
} from "./constants";
import GroupsPage from "../pages/GroupsPage.vue";
import ClubsPage from "../pages/ClubsPage.vue";
import GroupsEditPage from "../pages/GroupsEditPage.vue";
import ClubsEditPage from "../pages/ClubsEditPage.vue";
import ClubBookingsPage from "../pages/ClubBookingsPage.vue";

const routes = [
  { path: "/", redirect: GROUPS_ROUTE },
  { path: GROUPS_ROUTE, component: GroupsPage },
  { path: CLUBS_ROUTE, component: ClubsPage },
  { path: ADMIN_GROUPS_ROUTE, component: GroupsEditPage },
  { path: ADMIN_CLUBS_ROUTE, component: ClubsEditPage },
  { path: ADMIN_CLUB_BOOKINGS_ROUTE, component: ClubBookingsPage },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
