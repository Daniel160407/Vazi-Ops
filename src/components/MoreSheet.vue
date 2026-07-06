<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import AppButton from "./UI/AppButton.vue";
import { useAuth } from "../composables/useAuth";
import { usePageVisibilityCrud } from "../composables/usePageVisibilityCrud";
import {
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

const props = defineProps<{ visible: boolean }>();
const emit = defineEmits<{ close: [] }>();

const router = useRouter();
const { user, isAdmin } = useAuth();
const { isVisible: isPageVisible } = usePageVisibilityCrud();

const navigate = (path: string) => {
  router.push(path);
  emit("close");
};

const handleAdminNav = (path: string) => {
  if (user.value && isAdmin.value) {
    router.push(path);
    emit("close");
  }
};

const sheetEl = ref<HTMLElement | null>(null);
const touchStartY = ref(0);
const dragY = ref(0);

const onTouchStart = (e: TouchEvent) => {
  touchStartY.value = e.touches[0]!.clientY;
  dragY.value = 0;
};

const onTouchMove = (e: TouchEvent) => {
  const dy = e.touches[0]!.clientY - touchStartY.value;
  if (dy <= 0 || (sheetEl.value && sheetEl.value.scrollTop > 0)) {
    dragY.value = 0;
    return;
  }
  dragY.value = dy;
  e.preventDefault();
};

const onTouchEnd = () => {
  if (dragY.value > 100) emit("close");
  dragY.value = 0;
};

const allMainItems = [
  { label: "განცხადებები", icon: "pi pi-megaphone", path: ANNOUNCEMENTS_ROUTE, key: "announcements" },
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
  { label: "ჯგუფები", icon: "pi pi-users", path: ADMIN_GROUPS_ROUTE },
  { label: "წრეები", icon: "pi pi-sparkles", path: ADMIN_CLUBS_ROUTE },
  { label: "წრეების რეგ.", icon: "pi pi-list-check", path: ADMIN_CLUB_BOOKINGS_ROUTE },
  { label: "დღის განრიგი", icon: "pi pi-calendar", path: ADMIN_DAY_SCHEDULE_ROUTE },
  { label: "საღამოს პრ.", icon: "pi pi-moon", path: ADMIN_EVENING_SCHEDULE_ROUTE },
  { label: "ნომრები", icon: "pi pi-ticket", path: ADMIN_EVENTS_ROUTE },
  { label: "ოქროს მუხ.", icon: "pi pi-lightbulb", path: ADMIN_GOLDEN_VERSES_ROUTE },
  { label: "განცხადებები", icon: "pi pi-megaphone", path: ADMIN_ANNOUNCEMENTS_ROUTE },
  { label: "ქულები", icon: "pi pi-table", path: ADMIN_TABLE_ROUTE },
  { label: "დღ. პროგრამები", icon: "pi pi-list", path: ADMIN_DAILY_PROGRAMS_ROUTE },
  { label: "მართვა", icon: "pi pi-cog", path: ADMIN_USERS_ROUTE },
];
</script>

<template>
  <Teleport to="body">
    <Transition name="backdrop">
      <div
        v-if="visible"
        class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
        @click="emit('close')"
      />
    </Transition>

    <Transition name="sheet">
      <div
        v-if="visible"
        ref="sheetEl"
        class="fixed bottom-0 left-0 right-0 z-50 max-h-[88vh] overflow-y-auto rounded-t-3xl border-t border-blue-900/40 bg-[#07101e] p-5"
        :style="{
          boxShadow: '0 -8px 40px 0 rgba(0,10,40,0.8)',
          transform: dragY > 0 ? `translateY(${dragY}px)` : '',
          transition: dragY > 0 ? 'none' : 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
        }"
        @click.stop
        @touchstart="onTouchStart"
        @touchmove="onTouchMove"
        @touchend="onTouchEnd"
      >
        <div class="mx-auto mb-5 h-1 w-10 rounded-full bg-blue-900/60" />

        <div class="mb-5 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="h-4 w-0.75 rounded-full bg-blue-500" />
            <span class="text-xs font-bold uppercase tracking-widest text-slate-300">
              დამატებითი ინფო
            </span>
          </div>
          <AppButton variant="icon-close" icon="pi-times" @click="emit('close')" />
        </div>

        <div class="mb-6 grid grid-cols-2 gap-2">
          <AppButton
            v-for="item in mainItems"
            :key="item.path"
            variant="plain"
            class="group flex items-center gap-3 rounded-2xl border border-blue-900/30 bg-[#0d1829] p-4 text-left transition-all duration-150 hover:border-blue-700/50 hover:bg-[#0f1f36]"
            @click="navigate(item.path)"
          >
            <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-900/40 transition-colors group-hover:bg-blue-800/50">
              <i :class="item.icon" class="text-sm text-blue-400" />
            </div>
            <span class="text-sm font-medium text-slate-200">{{ item.label }}</span>
          </AppButton>
        </div>

        <template v-if="user && isAdmin">
          <div class="mb-3 flex items-center gap-2">
            <i class="pi pi-lock text-[11px] text-blue-500/70" />
            <span class="text-[11px] font-bold uppercase tracking-widest text-slate-500">
              ადმინი
            </span>
            <div class="h-px flex-1 bg-blue-900/30" />
          </div>
          <div class="grid grid-cols-2 gap-2">
            <AppButton
              v-for="item in adminItems"
              :key="item.path"
              variant="plain"
              class="group flex items-center gap-3 rounded-2xl border border-blue-900/20 bg-[#0a1220] p-4 text-left transition-all duration-150 hover:border-blue-700/40 hover:bg-[#0d1829]"
              @click="handleAdminNav(item.path)"
            >
              <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-950/60 transition-colors group-hover:bg-blue-900/50">
                <i :class="item.icon" class="text-sm text-blue-500/80" />
              </div>
              <span class="text-sm font-medium text-slate-400 group-hover:text-slate-200">
                {{ item.label }}
              </span>
            </AppButton>
          </div>
        </template>

        <div class="h-8" />
      </div>
    </Transition>
  </Teleport>
</template>
