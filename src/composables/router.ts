import { createRouter, createWebHistory } from "vue-router";
import { GROUPS_ROUTE } from "./constants";
import GroupsPage from "../pages/GroupsPage.vue";

const routes = [
  { path: "/", redirect: GROUPS_ROUTE },
  { path: GROUPS_ROUTE, component: GroupsPage },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
