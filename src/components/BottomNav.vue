<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import AppButton from "./UI/AppButton.vue";
import { useAuth } from "../composables/useAuth";
import { usePageVisibilityCrud } from "../composables/usePageVisibilityCrud";
import {
  GROUPS_ROUTE,
  CLUBS_ROUTE,
  EVENTS_ROUTE,
  EVENING_SCHEDULE_ROUTE,
} from "../composables/constants";

defineEmits<{ openMore: [] }>();

const router = useRouter();
const route = useRoute();
const { isAdmin } = useAuth();
const { isVisible: isPageVisible } = usePageVisibilityCrud();

const isVisible = ref(true);
const lastScrollPosition = ref(0);

const allNavItems = [
  { label: "ჯგუფები", icon: "pi pi-users", path: GROUPS_ROUTE, key: "groups" },
  { label: "წრეები", icon: "pi pi-sparkles", path: CLUBS_ROUTE, key: "clubs" },
  { label: "ნომრები", icon: "pi pi-ticket", path: EVENTS_ROUTE, key: "events" },
  { label: "საღამო", icon: "pi pi-moon", path: EVENING_SCHEDULE_ROUTE, key: "evening_schedule" },
];

const navItems = computed(() =>
  isAdmin.value
    ? allNavItems
    : allNavItems.filter((item) => isPageVisible(item.key))
);

const isActive = (path: string) => route.path === path;

const handleScroll = () => {
  const currentScrollPosition =
    window.pageYOffset || document.documentElement.scrollTop;
  if (Math.abs(lastScrollPosition.value - currentScrollPosition) < 60) {
    return;
  }
  isVisible.value = currentScrollPosition < lastScrollPosition.value;
  lastScrollPosition.value = currentScrollPosition;
};

onMounted(() => {
  window.addEventListener("scroll", handleScroll);
});

onUnmounted(() => {
  window.removeEventListener("scroll", handleScroll);
});
</script>

<template>
  <nav
    class="fixed bottom-0 left-0 right-0 z-40 flex items-stretch border-t border-blue-900/60 bg-[#05080f] transition-transform duration-300"
    style="box-shadow: 0 -4px 24px 0 rgba(0, 10, 40, 0.7)"
    :class="{ 'translate-y-full': !isVisible }"
  >
    <AppButton
      v-for="item in navItems"
      :key="item.path"
      variant="plain"
      class="group relative flex flex-1 flex-col items-center justify-center gap-1 py-3 transition-all duration-200"
      :class="
        isActive(item.path)
          ? 'text-blue-400'
          : 'text-slate-500 hover:text-slate-300'
      "
      @click="router.push(item.path)"
    >
      <span
        v-if="isActive(item.path)"
        class="absolute top-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-blue-400"
      />

      <div
        class="flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200"
        :class="isActive(item.path) ? 'bg-blue-500/15' : ''"
      >
        <i :class="item.icon" class="text-lg" />
      </div>
      <span class="text-center text-[10px] font-medium leading-none tracking-wide">
        {{ item.label }}
      </span>
    </AppButton>

    <AppButton
      variant="plain"
      class="group relative flex flex-1 flex-col items-center justify-center gap-1 py-3 text-slate-500 transition-all duration-200 hover:text-slate-300"
      @click="$emit('openMore')"
    >
      <div class="flex h-9 w-9 items-center justify-center rounded-xl">
        <i class="pi pi-bars text-lg" />
      </div>
      <span class="text-[10px] font-medium leading-none tracking-wide">სხვა</span>
    </AppButton>
  </nav>
</template>
