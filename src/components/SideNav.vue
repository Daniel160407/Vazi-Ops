<script setup lang="ts">
import { computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import AppButton from "./UI/AppButton.vue";
import { useAuth } from "../composables/useAuth";
import { usePageVisibilityCrud } from "../composables/usePageVisibilityCrud";
import {
  GROUPS_ROUTE,
  CLUBS_ROUTE,
  EVENTS_ROUTE,
  EVENING_SCHEDULE_ROUTE,
  ANNOUNCEMENTS_ROUTE,
  DAY_SCHEDULE_ROUTE,
  GOLDEN_VERSES_ROUTE,
  ADMIN_GROUPS_ROUTE,
  ADMIN_CLUBS_ROUTE,
  ADMIN_CLUB_BOOKINGS_ROUTE,
  ADMIN_DAY_SCHEDULE_ROUTE,
  ADMIN_EVENING_SCHEDULE_ROUTE,
  ADMIN_EVENTS_ROUTE,
  ADMIN_GOLDEN_VERSES_ROUTE,
  ADMIN_ANNOUNCEMENTS_ROUTE,
  ADMIN_USERS_ROUTE,
  ADMIN_TABLE_ROUTE,
  DAILY_PROGRAMS_ROUTE,
  ADMIN_DAILY_PROGRAMS_ROUTE,
} from "../composables/constants";

const router = useRouter();
const route = useRoute();
const { user, isAdmin, isTeacher, signInWithGoogle, logout } = useAuth();
const { isVisible: isPageVisible } = usePageVisibilityCrud();

const isActive = (path: string) => route.path === path;
const navigate = (path: string) => router.push(path);

const handleAdminNav = async (path: string) => {
  if (!user.value) await signInWithGoogle();
  if (user.value && (isAdmin.value || isTeacher.value)) router.push(path);
};

const allMainItems = [
  { label: "განცხადებები", icon: "pi pi-megaphone", path: ANNOUNCEMENTS_ROUTE, key: "announcements" },
  { label: "ჯგუფები", icon: "pi pi-users", path: GROUPS_ROUTE, key: "groups" },
  { label: "წრეები", icon: "pi pi-sparkles", path: CLUBS_ROUTE, key: "clubs" },
  { label: "ნომრები", icon: "pi pi-ticket", path: EVENTS_ROUTE, key: "events" },
  { label: "საღამოს განრიგი", icon: "pi pi-moon", path: EVENING_SCHEDULE_ROUTE, key: "evening_schedule" },
  { label: "დღის განრიგი", icon: "pi pi-calendar", path: DAY_SCHEDULE_ROUTE, key: "day_schedule" },
  { label: "ოქროს მუხლები", icon: "pi pi-lightbulb", path: GOLDEN_VERSES_ROUTE, key: "golden_verses" },
  { label: "დღის პროგრამები", icon: "pi pi-list", path: DAILY_PROGRAMS_ROUTE, key: "daily_programs" },
];

const mainItems = computed(() =>
  isAdmin.value
    ? allMainItems
    : allMainItems.filter((item) => isPageVisible(item.key))
);

const adminItems = [
  { label: "განცხადებები", icon: "pi pi-megaphone", path: ADMIN_ANNOUNCEMENTS_ROUTE },
  { label: "ჯგუფები", icon: "pi pi-users", path: ADMIN_GROUPS_ROUTE },
  { label: "წრეები", icon: "pi pi-sparkles", path: ADMIN_CLUBS_ROUTE },
  { label: "წრეების რეგ.", icon: "pi pi-list-check", path: ADMIN_CLUB_BOOKINGS_ROUTE },
  { label: "დღის განრიგი", icon: "pi pi-calendar", path: ADMIN_DAY_SCHEDULE_ROUTE },
  { label: "საღამოს პრ.", icon: "pi pi-moon", path: ADMIN_EVENING_SCHEDULE_ROUTE },
  { label: "ნომრები", icon: "pi pi-ticket", path: ADMIN_EVENTS_ROUTE },
  { label: "ოქროს მუხლები", icon: "pi pi-lightbulb", path: ADMIN_GOLDEN_VERSES_ROUTE },
  { label: "ქულები", icon: "pi pi-table", path: ADMIN_TABLE_ROUTE },
  { label: "დღ. პროგრამები", icon: "pi pi-list", path: ADMIN_DAILY_PROGRAMS_ROUTE },
  { label: "მართვა", icon: "pi pi-cog", path: ADMIN_USERS_ROUTE },
];

const visibleAdminItems = computed(() =>
  isTeacher.value
    ? adminItems.filter((item) => item.path === ADMIN_CLUB_BOOKINGS_ROUTE)
    : adminItems
);
</script>

<template>
  <aside
    class="fixed top-0 left-0 z-30 flex h-svh w-56 flex-col border-r border-blue-900/30 bg-[#05080f]"
    style="box-shadow: 4px 0 24px 0 rgba(0,10,40,0.5)"
  >
    <div class="flex items-center gap-3 px-5 py-6 border-b border-blue-900/20">
      <img src="../assets/images/logo.png" class="h-8 w-8 object-contain" />
      <span class="text-base font-semibold tracking-tight text-white">ბანაკი "ვაზი"</span>
    </div>

    <nav class="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-4">
      <AppButton
        v-for="item in mainItems"
        :key="item.path"
        variant="plain"
        class="group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-150"
        :class="
          isActive(item.path)
            ? 'bg-blue-500/10 text-blue-400'
            : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'
        "
        @click="navigate(item.path)"
      >
        <span
          v-if="isActive(item.path)"
          class="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-blue-400"
        />
        <i :class="item.icon" class="w-4 text-center text-sm" />
        <span class="text-sm font-medium">{{ item.label }}</span>
      </AppButton>

      <div class="mt-4 mb-2 flex items-center gap-2 px-3">
        <i class="pi pi-lock text-[10px] text-blue-500/50" />
        <span class="text-[10px] font-bold uppercase tracking-widest text-slate-600">
          ადმინი
        </span>
        <div class="h-px flex-1 bg-blue-900/20" />
      </div>

      <template v-if="user && (isAdmin || isTeacher)">
        <AppButton
          v-for="item in visibleAdminItems"
          :key="item.path"
          variant="plain"
          class="group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-150"
          :class="
            isActive(item.path)
              ? 'bg-blue-500/10 text-blue-400'
              : 'text-slate-600 hover:bg-white/5 hover:text-slate-400'
          "
          @click="handleAdminNav(item.path)"
        >
          <span
            v-if="isActive(item.path)"
            class="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-blue-400"
          />
          <i :class="item.icon" class="w-4 text-center text-sm" />
          <span class="text-sm font-medium">{{ item.label }}</span>
        </AppButton>
      </template>

      <template v-else>
        <AppButton
          variant="plain"
          class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-slate-600 transition-all hover:bg-white/5 hover:text-slate-400"
          @click="signInWithGoogle"
        >
          <i class="pi pi-sign-in w-4 text-center text-sm" />
          <span class="text-sm font-medium">შესვლა</span>
        </AppButton>
      </template>
    </nav>

    <div v-if="user" class="border-t border-blue-900/20 px-4 py-4">
      <div class="flex items-center gap-3">
        <img
          v-if="user.photoURL"
          :src="user.photoURL"
          class="h-8 w-8 rounded-full object-cover ring-1 ring-blue-900/60"
        />
        <div v-else class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-900/40">
          <i class="pi pi-user text-xs text-blue-400" />
        </div>
        <div class="min-w-0 flex-1">
          <p class="truncate text-xs font-medium text-slate-300">{{ user.displayName }}</p>
          <p class="text-[10px] text-slate-600">{{ isAdmin ? 'ადმინი' : isTeacher ? 'მასწავლებელი' : 'მომხმარებელი' }}</p>
        </div>
        <AppButton
          variant="plain"
          class="text-slate-600 transition-colors hover:text-slate-400"
          title="გასვლა"
          @click="logout"
        >
          <i class="pi pi-sign-out text-sm" />
        </AppButton>
      </div>
    </div>
  </aside>
</template>
