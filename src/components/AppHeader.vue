<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import logo from "../assets/images/logo.png";
import { useAuth } from "../composables/useAuth";
import { GROUPS_ROUTE } from "../composables/constants";

const { user, avatarUrl, signInWithGoogle, logout } = useAuth();
const router = useRouter();

const menuOpen = ref(false);

const handleLogout = async () => {
  menuOpen.value = false;
  await logout();
};
</script>

<template>
  <header
    class="sticky mb-4 top-0 z-20 flex w-full items-center gap-3 border-b border-blue-900/20 bg-[#03060f]/95 px-5 py-3.5 backdrop-blur-md lg:hidden"
    style="box-shadow: 0 2px 20px 0 rgba(0, 6, 30, 0.5)"
  >
    <div class="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl bg-blue-950/60 ring-1 ring-blue-800/30 transition-opacity active:opacity-70" @click="router.push(GROUPS_ROUTE)">
      <img :src="logo" alt="ბანაკი ვაზი" class="h-8 w-8 object-contain" />
    </div>
    <h1 class="flex-1 text-[24px] font-bold tracking-tight text-white">
      ბანაკი <span class="text-blue-400">"ვაზი"</span>
    </h1>

    <template v-if="user">
      <div class="relative">
        <button
          class="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full ring-1 ring-blue-800/40 transition-opacity active:opacity-70"
          @click="menuOpen = !menuOpen"
        >
          <img
            v-if="avatarUrl"
            :src="avatarUrl"
            referrerpolicy="no-referrer"
            class="h-full w-full object-cover"
          />
          <span
            v-else
            class="flex h-full w-full items-center justify-center bg-blue-900/60 text-sm font-bold text-blue-300"
          >
            {{ user.displayName?.charAt(0)?.toUpperCase() || "?" }}
          </span>
        </button>

        <Transition
          enter-active-class="transition-all duration-150 ease-out"
          enter-from-class="opacity-0 scale-95 -translate-y-1"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition-all duration-100 ease-in"
          leave-from-class="opacity-100 scale-100 translate-y-0"
          leave-to-class="opacity-0 scale-95 -translate-y-1"
        >
          <div
            v-if="menuOpen"
            class="absolute right-0 top-11 z-50 min-w-[160px] rounded-2xl border border-blue-900/30 bg-[#07101e] p-1.5 shadow-xl"
            style="box-shadow: 0 8px 32px 0 rgba(0,6,30,0.8)"
          >
            <div class="mb-1 border-b border-blue-900/20 px-3 pb-2 pt-1.5">
              <p class="truncate text-xs font-semibold text-slate-300">{{ user.displayName }}</p>
              <p class="truncate text-[10px] text-slate-600">{{ user.email }}</p>
            </div>
            <button
              class="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-rose-400 transition-colors hover:bg-rose-500/10"
              @click="handleLogout"
            >
              <i class="pi pi-sign-out text-xs" />
              გამოსვლა
            </button>
          </div>
        </Transition>

        <div
          v-if="menuOpen"
          class="fixed inset-0 z-40"
          @click="menuOpen = false"
        />
      </div>
    </template>

    <button
      v-else
      class="flex items-center gap-2 rounded-xl border border-blue-900/30 bg-blue-900/20 px-3 py-2 text-xs font-semibold text-blue-300 transition-colors hover:bg-blue-800/30"
      @click="signInWithGoogle"
    >
      <i class="pi pi-sign-in text-xs" />
      შესვლა
    </button>
  </header>
</template>
