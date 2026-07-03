<script setup lang="ts">
import { useRouter } from "vue-router";
import { useAuth } from "../composables/useAuth";
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
} from "../composables/constants";

const props = defineProps<{ visible: boolean }>();
const emit = defineEmits<{ close: [] }>();

const router = useRouter();
const { user, signInWithGoogle } = useAuth();

const navigate = (path: string) => {
  router.push(path);
  emit("close");
};

const handleAdminNav = async (path: string) => {
  if (!user.value) await signInWithGoogle();
  if (user.value) {
    router.push(path);
    emit("close");
  }
};

const mainItems = [
  { label: "განცხადებები", icon: "pi pi-megaphone", path: ANNOUNCEMENTS_ROUTE },
  { label: "დღის განრიგი", icon: "pi pi-calendar", path: DAY_SCHEDULE_ROUTE },
  { label: "ოქროს მუხლები", icon: "pi pi-lightbulb", path: GOLDEN_VERSES_ROUTE },
];

const adminItems = [
  { label: "ჯგუფები", icon: "pi pi-users", path: ADMIN_GROUPS_ROUTE },
  { label: "წრეები", icon: "pi pi-sparkles", path: ADMIN_CLUBS_ROUTE },
  { label: "წრეების რეგ.", icon: "pi pi-list-check", path: ADMIN_CLUB_BOOKINGS_ROUTE },
  { label: "დღის განრიგი", icon: "pi pi-calendar", path: ADMIN_DAY_SCHEDULE_ROUTE },
  { label: "საღამოს პრ.", icon: "pi pi-moon", path: ADMIN_EVENING_SCHEDULE_ROUTE },
  { label: "ნომრები", icon: "pi pi-ticket", path: ADMIN_EVENTS_ROUTE },
  { label: "ოქროს მუხ.", icon: "pi pi-lightbulb", path: ADMIN_GOLDEN_VERSES_ROUTE },
  { label: "განცხადებები", icon: "pi pi-megaphone", path: ADMIN_ANNOUNCEMENTS_ROUTE },
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
        class="fixed bottom-0 left-0 right-0 z-50 max-h-[88vh] overflow-y-auto rounded-t-3xl border-t border-blue-900/40 bg-[#07101e] p-5"
        style="box-shadow: 0 -8px 40px 0 rgba(0,10,40,0.8)"
        @click.stop
      >
        <div class="mx-auto mb-5 h-1 w-10 rounded-full bg-blue-900/60" />

        <div class="mb-5 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="h-4 w-0.75 rounded-full bg-blue-500" />
            <span class="text-xs font-bold uppercase tracking-widest text-slate-300">
              დამატებითი ინფო
            </span>
          </div>
          <button
            class="flex h-7 w-7 items-center justify-center rounded-full bg-blue-900/30 text-slate-400 transition-colors hover:bg-blue-900/60 hover:text-white"
            @click="emit('close')"
          >
            <i class="pi pi-times text-xs" />
          </button>
        </div>

        <div class="mb-6 grid grid-cols-2 gap-2">
          <button
            v-for="item in mainItems"
            :key="item.path"
            class="group flex items-center gap-3 rounded-2xl border border-blue-900/30 bg-[#0d1829] p-4 text-left transition-all duration-150 hover:border-blue-700/50 hover:bg-[#0f1f36]"
            @click="navigate(item.path)"
          >
            <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-900/40 transition-colors group-hover:bg-blue-800/50">
              <i :class="item.icon" class="text-sm text-blue-400" />
            </div>
            <span class="text-sm font-medium text-slate-200">{{ item.label }}</span>
          </button>
        </div>

        <template v-if="user">
          <div class="mb-3 flex items-center gap-2">
            <i class="pi pi-lock text-[11px] text-blue-500/70" />
            <span class="text-[11px] font-bold uppercase tracking-widest text-slate-500">
              ადმინი
            </span>
            <div class="h-px flex-1 bg-blue-900/30" />
          </div>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="item in adminItems"
              :key="item.path"
              class="group flex items-center gap-3 rounded-2xl border border-blue-900/20 bg-[#0a1220] p-4 text-left transition-all duration-150 hover:border-blue-700/40 hover:bg-[#0d1829]"
              @click="handleAdminNav(item.path)"
            >
              <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-950/60 transition-colors group-hover:bg-blue-900/50">
                <i :class="item.icon" class="text-sm text-blue-500/80" />
              </div>
              <span class="text-sm font-medium text-slate-400 group-hover:text-slate-200">
                {{ item.label }}
              </span>
            </button>
          </div>
        </template>

        <template v-else>
          <div class="mb-3 flex items-center gap-2">
            <i class="pi pi-lock text-[11px] text-blue-500/70" />
            <span class="text-[11px] font-bold uppercase tracking-widest text-slate-500">
              ადმინი
            </span>
            <div class="h-px flex-1 bg-blue-900/30" />
          </div>
          <button
            class="flex w-full items-center justify-center gap-3 rounded-2xl border border-blue-900/30 bg-[#0d1829] p-4 text-slate-300 transition-all hover:border-blue-700/50 hover:bg-[#0f1f36]"
            @click="signInWithGoogle"
          >
            <div class="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-900/40">
              <i class="pi pi-sign-in text-sm text-blue-400" />
            </div>
            <span class="text-sm font-medium">ადმინ პანელი (შესვლა)</span>
          </button>
        </template>

        <div class="h-8" />
      </div>
    </Transition>
  </Teleport>
</template>
