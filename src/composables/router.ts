import { createRouter, createWebHistory } from "vue-router";
import { ADMIN_GROUPS_ROUTE, GROUPS_ROUTE } from "./constants";
import GroupsPage from "../pages/GroupsPage.vue";
import GroupsEditPage from "../pages/GroupsEditPage.vue";

const routes = [
  { path: "/", redirect: GROUPS_ROUTE },
  { path: GROUPS_ROUTE, component: GroupsPage },
  { path: ADMIN_GROUPS_ROUTE, component: GroupsEditPage },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
