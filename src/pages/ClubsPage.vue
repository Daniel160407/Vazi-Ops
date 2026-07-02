<script setup lang="ts">
import { ref, computed } from "vue";
import { storeToRefs } from "pinia";
import { format } from "date-fns";
import { useToast } from "primevue";
import { useGlobalStore } from "../stores/GlobalStore";
import { useClubsCrud } from "../composables/useClubsCrud";
import { useClubBookingsCrud } from "../composables/useClubBookingsCrud";
import type { Club, ClubBooking } from "../type/interfaces";
import LoadingSpinner from "../components/UI/LoadingSpinner.vue";

const globalStore = useGlobalStore();
const toast = useToast();
const { loading: loadingStore, clubs } = storeToRefs(globalStore);
const { registerInClub, changeClubBooking, loading } = useClubsCrud();
const { fetchUserBookings } = useClubBookingsCrud();

// ── search ──────────────────────────────────────────────
const search = ref("");
const filtered = computed(() => {
  const q = search.value.toLowerCase().trim();
  if (!q) return clubs.value;
  return clubs.value.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.teacher.toLowerCase().includes(q) ||
      c.place.toLowerCase().includes(q)
  );
});

const totalPlaces = computed(() =>
  clubs.value.reduce((acc, c) => acc + (c.places_quantity ?? 0), 0)
);

// ── registration sheet ──────────────────────────────────
const selectedClub = ref<Club | null>(null);
const sheetVisible = ref(false);

const childFullName = ref("");
const leaderName = ref("");
const groupName = ref("");

const splitName = (full: string) => {
  const parts = full.trim().split(/\s+/);
  return { first: parts[0] ?? "", last: parts.slice(1).join(" ") };
};

const userBookings = ref<ClubBooking[]>([]);
const selectionMode = ref<"register" | "switch">("register");
const bookingToReplaceId = ref<string | null>(null);

const openSheet = (club: Club) => {
  if (club.places_quantity <= 0) return;
  selectedClub.value = club;
  sheetVisible.value = true;
  selectionMode.value = "register";
  userBookings.value = [];
  bookingToReplaceId.value = null;
};

const closeSheet = () => {
  sheetVisible.value = false;
  childFullName.value = "";
  leaderName.value = "";
  groupName.value = "";
  selectionMode.value = "register";
  userBookings.value = [];
  bookingToReplaceId.value = null;
};

const handleConfirmRegister = async () => {
  if (!selectedClub.value) return;

  if (!childFullName.value.trim() || !leaderName.value || !groupName.value) {
    toast.add({ severity: "warn", summary: "შეავსე ყველა ველი", life: 3000 });
    return;
  }

  const { first, last } = splitName(childFullName.value);

  if (selectionMode.value === "register") {
    const existing = await fetchUserBookings(first, last, leaderName.value, groupName.value);
    userBookings.value = existing;

    if (selectedClub.value.time) {
      const hasSameTime = existing.some((booking) => {
        const clubForBooking = clubs.value.find((c) => c.id === booking.club_id);
        return clubForBooking?.time === selectedClub.value!.time;
      });
      if (hasSameTime) {
        toast.add({ severity: "warn", summary: "დრო დაკავებულია", detail: "უკვე გაქვს სხვა წრე ამ დროს.", life: 6000 });
        return;
      }
    }

    if (existing.length < 2) {
      await registerInClub(selectedClub.value, {
        child_first_name: first,
        child_last_name: last,
        leader_name: leaderName.value,
        group_name: groupName.value,
      });
      closeSheet();
      return;
    }

    selectionMode.value = "switch";
    bookingToReplaceId.value = existing[0]?.id ?? null;
    toast.add({ severity: "info", summary: "უკვე დაჯავშნილია 2 წრე", detail: "აირჩიე რომელი გინდა შეცვალო.", life: 3000 });
    return;
  }

  if (!bookingToReplaceId.value) {
    toast.add({ severity: "warn", summary: "აირჩიე შესაცვლელი წრე", life: 3000 });
    return;
  }

  const oldBooking = userBookings.value.find((b) => b.id === bookingToReplaceId.value);
  if (!oldBooking) return;

  await changeClubBooking(oldBooking, selectedClub.value);
  closeSheet();
};

// ── helpers ─────────────────────────────────────────────
const formatTime = (value?: string | Date | null) => {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return format(date, "HH:mm");
};

const placesBg = (n: number) => {
  if (n <= 0) return "bg-red-500/15 text-red-400 border-red-500/20";
  if (n <= 3) return "bg-amber-500/15 text-amber-400 border-amber-500/20";
  return "bg-emerald-500/15 text-emerald-400 border-emerald-500/20";
};

const accentBorder = (n: number) => {
  if (n <= 0) return "border-l-red-500/60";
  if (n <= 3) return "border-l-amber-500/60";
  return "border-l-blue-500/40";
};
</script>

<template>
  <div class="pb-4">
    <LoadingSpinner v-if="loadingStore && clubs.length === 0" />

    <div v-else>
      <!-- Search -->
      <div class="relative mb-4">
        <i class="pi pi-search absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-500" />
        <input
          v-model="search"
          type="text"
          placeholder="მოძებნე წრე, მასწავლებელი..."
          class="w-full rounded-2xl border border-blue-900/30 bg-[#0d1829] py-3 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-blue-700/60"
        />
      </div>

      <!-- Stats -->
      <div class="mb-5 grid grid-cols-2 gap-3">
        <div class="rounded-2xl border border-blue-900/20 bg-[#0d1829] p-4">
          <p class="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">სულ წრეების რაოდენობა</p>
          <p class="text-3xl font-bold text-white">{{ clubs.length }}</p>
        </div>
        <div class="rounded-2xl border border-blue-900/20 bg-[#0d1829] p-4">
          <p class="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">თავისუფალი ადგილი</p>
          <p class="text-3xl font-bold text-blue-400">{{ totalPlaces }}</p>
        </div>
      </div>

      <!-- Section title -->
      <h2 class="mb-3 text-base font-bold text-slate-200">წრეები</h2>

      <p v-if="filtered.length === 0" class="py-10 text-center text-sm text-slate-600">
        წრე ვერ მოიძებნა
      </p>

      <!-- Club cards -->
      <div class="flex flex-col gap-3">
        <div
          v-for="club in filtered"
          :key="club.id"
          class="overflow-hidden rounded-2xl border border-l-4 border-blue-900/20 bg-[#0d1829] transition-all duration-150"
          :class="accentBorder(club.places_quantity)"
        >
          <div class="p-4">
            <!-- Header -->
            <div class="mb-3 flex items-start justify-between gap-2">
              <h3 class="text-base font-bold leading-tight text-white">{{ club.name }}</h3>
              <span
                class="shrink-0 rounded-lg border px-2.5 py-1 text-xs font-bold"
                :class="placesBg(club.places_quantity)"
              >
                {{ club.places_quantity <= 0 ? "სავსეა" : `${club.places_quantity} ადგილი` }}
              </span>
            </div>

            <!-- Info rows -->
            <div class="mb-4 flex flex-col gap-2">
              <div class="flex items-center gap-2.5">
                <div class="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-900/30">
                  <i class="pi pi-user text-[10px] text-blue-400" />
                </div>
                <span class="text-sm text-slate-400">{{ club.teacher || "—" }}</span>
              </div>
              <div class="flex items-center gap-2.5">
                <div class="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-900/30">
                  <i class="pi pi-map-marker text-[10px] text-blue-400" />
                </div>
                <span class="text-sm text-slate-400">{{ club.place || "—" }}</span>
              </div>
              <div class="flex items-center gap-2.5">
                <div class="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-900/30">
                  <i class="pi pi-clock text-[10px] text-blue-400" />
                </div>
                <span class="text-sm text-slate-400">{{ formatTime(club.time) }}</span>
              </div>
              <div v-if="club.additional_info" class="flex items-start gap-2.5">
                <div class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-900/30">
                  <i class="pi pi-info-circle text-[10px] text-blue-400" />
                </div>
                <span class="text-sm leading-relaxed text-slate-500">{{ club.additional_info }}</span>
              </div>
            </div>

            <!-- Register button -->
            <button
              @click="openSheet(club)"
              :disabled="club.places_quantity <= 0 || loading"
              class="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all duration-150"
              :class="
                club.places_quantity <= 0
                  ? 'cursor-not-allowed bg-slate-800/60 text-slate-600'
                  : 'bg-blue-600 text-white hover:bg-blue-500 active:scale-95'
              "
            >
              <i class="pi pi-check text-sm" />
              {{ club.places_quantity <= 0 ? "ადგილი არ არის" : "ჩაეწერე" }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Registration bottom sheet -->
    <Teleport to="body">
      <Transition name="backdrop">
        <div
          v-if="sheetVisible"
          class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
          @click="closeSheet"
        />
      </Transition>

      <Transition name="sheet">
        <div
          v-if="sheetVisible"
          class="fixed bottom-0 left-0 right-0 z-50 max-h-[90vh] overflow-y-auto rounded-t-3xl border-t border-blue-900/40 bg-[#07101e] p-5"
          style="box-shadow: 0 -8px 40px 0 rgba(0,10,40,0.8)"
          @click.stop
        >
          <div class="mx-auto mb-4 h-1 w-10 rounded-full bg-blue-900/60" />

          <!-- Sheet header -->
          <div class="mb-1 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span class="h-4 w-[3px] rounded-full bg-blue-500" />
              <span class="text-sm font-bold text-slate-200">
                {{ selectionMode === "switch" ? "შეცვლე წრე" : "ჩაეწერე წრეში" }}
              </span>
            </div>
            <button
              @click="closeSheet"
              class="flex h-7 w-7 items-center justify-center rounded-full bg-blue-900/30 text-slate-400 hover:bg-blue-900/60 hover:text-white"
            >
              <i class="pi pi-times text-xs" />
            </button>
          </div>

          <!-- Selected club badge -->
          <div v-if="selectedClub" class="mb-5 mt-3 flex items-center gap-2 rounded-xl bg-blue-500/10 px-3 py-2.5">
            <i class="pi pi-sparkles text-sm text-blue-400" />
            <span class="text-sm font-semibold text-blue-300">{{ selectedClub.name }}</span>
            <span class="ml-auto text-xs text-slate-500">{{ formatTime(selectedClub.time) }}</span>
          </div>

          <!-- Switch mode: choose which booking to replace -->
          <div v-if="selectionMode === 'switch'" class="mb-5">
            <p class="mb-3 text-sm text-slate-400">გაქვს 2 წრე. აირჩიე რომელი გინდა შეცვალო:</p>
            <div class="flex flex-col gap-2">
              <button
                v-for="booking in userBookings"
                :key="booking.id"
                @click="bookingToReplaceId = booking.id"
                class="flex items-center gap-3 rounded-xl border p-3 text-left transition-all"
                :class="
                  bookingToReplaceId === booking.id
                    ? 'border-blue-600 bg-blue-600/15 text-blue-300'
                    : 'border-blue-900/30 bg-[#0d1829] text-slate-400'
                "
              >
                <i class="pi pi-sparkles text-sm" />
                <span class="text-sm font-medium">{{ booking.club_name }}</span>
                <i
                  v-if="bookingToReplaceId === booking.id"
                  class="pi pi-check ml-auto text-blue-400 text-sm"
                />
              </button>
            </div>
          </div>

          <!-- Register form -->
          <div v-else class="flex flex-col gap-3">
            <div>
              <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">ბავშვის სახელი და გვარი</label>
              <input
                v-model="childFullName"
                type="text"
                placeholder="მაგ: ნიკა გელაშვილი"
                class="w-full rounded-xl border border-blue-900/30 bg-[#0d1829] px-4 py-3 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-blue-700/60"
              />
            </div>
            <div>
              <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">ლიდერის სახელი</label>
              <input
                v-model="leaderName"
                type="text"
                class="w-full rounded-xl border border-blue-900/30 bg-[#0d1829] px-4 py-3 text-sm text-slate-200 outline-none focus:border-blue-700/60"
              />
            </div>
            <div>
              <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">ჯგუფის სახელი</label>
              <input
                v-model="groupName"
                type="text"
                class="w-full rounded-xl border border-blue-900/30 bg-[#0d1829] px-4 py-3 text-sm text-slate-200 outline-none focus:border-blue-700/60"
              />
            </div>
          </div>

          <!-- Action -->
          <div class="mt-5 flex gap-3">
            <button
              v-if="selectionMode === 'switch'"
              @click="selectionMode = 'register'"
              class="flex items-center justify-center gap-2 rounded-xl border border-blue-900/30 bg-[#0d1829] px-4 py-3 text-sm font-semibold text-slate-400 transition-all hover:text-slate-200"
            >
              <i class="pi pi-arrow-left text-sm" />
            </button>
            <button
              @click="handleConfirmRegister"
              :disabled="loading"
              class="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition-all hover:bg-blue-500 disabled:opacity-50"
            >
              <i class="pi pi-check text-sm" />
              {{ selectionMode === "switch" ? "შეცვლა" : "ჩაწერა" }}
            </button>
          </div>

          <div class="h-6" />
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.backdrop-enter-active { transition: opacity 0.25s ease; }
.backdrop-leave-active { transition: opacity 0.2s ease; }
.backdrop-enter-from, .backdrop-leave-to { opacity: 0; }

.sheet-enter-active { transition: transform 0.35s cubic-bezier(0.32, 0.72, 0, 1); }
.sheet-leave-active { transition: transform 0.25s cubic-bezier(0.4, 0, 1, 1); }
.sheet-enter-from, .sheet-leave-to { transform: translateY(100%); }
</style>
