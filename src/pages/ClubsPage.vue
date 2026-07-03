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
import SearchInput from "../components/UI/SearchInput.vue";
import InfoRow from "../components/UI/InfoRow.vue";
import BottomSheet from "../components/UI/BottomSheet.vue";
import SheetField from "../components/UI/SheetField.vue";
import AppButton from "../components/UI/AppButton.vue";

const globalStore = useGlobalStore();
const toast = useToast();
const { loading: loadingStore, clubs } = storeToRefs(globalStore);
const { registerInClub, changeClubBooking, loading } = useClubsCrud();
const { fetchUserBookings } = useClubBookingsCrud();

const search = ref("");
const filtered = computed(() => {
  const q = search.value.toLowerCase().trim();
  if (!q) return clubs.value;
  return clubs.value.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.teacher.toLowerCase().includes(q) ||
      c.place.toLowerCase().includes(q),
  );
});

const totalPlaces = computed(() =>
  clubs.value.reduce((acc, c) => acc + (c.places_quantity ?? 0), 0),
);

const selectedClub = ref<Club | null>(null);
const sheetVisible = ref(false);
const childFullName = ref("");
const leaderName = ref("");
const groupName = ref("");
const userBookings = ref<ClubBooking[]>([]);
const selectionMode = ref<"register" | "switch">("register");
const bookingToReplaceId = ref<string | null>(null);

const splitName = (full: string) => {
  const parts = full.trim().split(/\s+/);
  return { first: parts[0] ?? "", last: parts.slice(1).join(" ") };
};

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
        child_first_name: first, child_last_name: last,
        leader_name: leaderName.value, group_name: groupName.value,
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
      <SearchInput v-model="search" placeholder="მოძებნე წრე, მასწავლებელი..." />

      <div class="mb-5 grid grid-cols-2 gap-3">
        <div class="rounded-2xl border border-blue-900/20 bg-[#0d1829] p-4">
          <p class="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">წრეების რაოდენობა</p>
          <p class="text-3xl font-bold text-white">{{ clubs.length }}</p>
        </div>
        <div class="rounded-2xl border border-blue-900/20 bg-[#0d1829] p-4">
          <p class="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">თავისუფალი ადგილი</p>
          <p class="text-3xl font-bold text-blue-400">{{ totalPlaces }}</p>
        </div>
      </div>

      <h2 class="mb-3 text-base font-bold text-slate-200">წრეები</h2>

      <p v-if="filtered.length === 0" class="py-10 text-center text-sm text-slate-600">
        წრე ვერ მოიძებნა
      </p>

      <div class="flex flex-col gap-3">
        <div
          v-for="club in filtered"
          :key="club.id"
          class="overflow-hidden rounded-2xl border border-l-4 border-blue-900/20 bg-[#0d1829] transition-all duration-150"
          :class="accentBorder(club.places_quantity)"
        >
          <div class="p-4">
            <div class="mb-3 flex items-start justify-between gap-2">
              <h3 class="text-base font-bold leading-tight text-white">{{ club.name }}</h3>
              <span class="shrink-0 rounded-lg border px-2.5 py-1 text-xs font-bold" :class="placesBg(club.places_quantity)">
                {{ club.places_quantity <= 0 ? "სავსეა" : `${club.places_quantity} ადგილი` }}
              </span>
            </div>

            <div class="mb-4 flex flex-col gap-2">
              <InfoRow icon="pi-user"><span class="text-sm text-slate-400">{{ club.teacher || "—" }}</span></InfoRow>
              <InfoRow icon="pi-map-marker"><span class="text-sm text-slate-400">{{ club.place || "—" }}</span></InfoRow>
              <InfoRow icon="pi-clock"><span class="text-sm text-slate-400">{{ formatTime(club.time) }}</span></InfoRow>
              <InfoRow v-if="club.additional_info" icon="pi-info-circle">
                <span class="text-sm leading-relaxed text-slate-500">{{ club.additional_info }}</span>
              </InfoRow>
            </div>

            <AppButton
              variant="plain"
              :disabled="club.places_quantity <= 0 || loading"
              class="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all duration-150"
              :class="club.places_quantity <= 0 ? 'cursor-not-allowed bg-slate-800/60 text-slate-600' : 'bg-blue-600 text-white hover:bg-blue-500 active:scale-95'"
              @click="openSheet(club)"
            >
              <i class="pi pi-check text-sm" />
              {{ club.places_quantity <= 0 ? "ადგილი არ არის" : "ჩაეწერე" }}
            </AppButton>
          </div>
        </div>
      </div>
    </div>

    <BottomSheet
      :visible="sheetVisible"
      :title="selectionMode === 'switch' ? 'შეცვლე წრე' : 'ჩაეწერე წრეში'"
      @close="closeSheet"
    >
      <div v-if="selectedClub" class="mb-5 flex items-center gap-2 rounded-xl bg-blue-500/10 px-3 py-2.5">
        <i class="pi pi-sparkles text-sm text-blue-400" />
        <span class="text-sm font-semibold text-blue-300">{{ selectedClub.name }}</span>
        <span class="ml-auto text-xs text-slate-500">{{ formatTime(selectedClub.time) }}</span>
      </div>

      <div v-if="selectionMode === 'switch'" class="mb-5">
        <p class="mb-3 text-sm text-slate-400">გაქვს 2 წრე. აირჩიე რომელი გინდა შეცვალო:</p>
        <div class="flex flex-col gap-2">
          <AppButton
            v-for="booking in userBookings"
            :key="booking.id"
            variant="plain"
            class="flex items-center gap-3 rounded-xl border p-3 text-left transition-all"
            :class="bookingToReplaceId === booking.id ? 'border-blue-600 bg-blue-600/15 text-blue-300' : 'border-blue-900/30 bg-[#0d1829] text-slate-400'"
            @click="bookingToReplaceId = booking.id"
          >
            <i class="pi pi-sparkles text-sm" />
            <span class="text-sm font-medium">{{ booking.club_name }}</span>
            <i v-if="bookingToReplaceId === booking.id" class="pi pi-check ml-auto text-sm text-blue-400" />
          </AppButton>
        </div>
      </div>

      <div v-else class="flex flex-col gap-3">
        <SheetField label="ბავშვის სახელი და გვარი">
          <input
            v-model="childFullName"
            type="text"
            class="w-full rounded-xl border border-blue-900/30 bg-[#0d1829] px-4 py-3 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-blue-700/60"
          />
        </SheetField>
        <SheetField label="ლიდერის სახელი და გვარი">
          <input
            v-model="leaderName"
            type="text"
            class="w-full rounded-xl border border-blue-900/30 bg-[#0d1829] px-4 py-3 text-sm text-slate-200 outline-none focus:border-blue-700/60"
          />
        </SheetField>
        <SheetField label="ჯგუფის სახელი">
          <input
            v-model="groupName"
            type="text"
            class="w-full rounded-xl border border-blue-900/30 bg-[#0d1829] px-4 py-3 text-sm text-slate-200 outline-none focus:border-blue-700/60"
          />
        </SheetField>
      </div>

      <div class="mt-5 flex gap-3">
        <AppButton v-if="selectionMode === 'switch'" variant="ghost" icon="pi-arrow-left" @click="selectionMode = 'register'" />
        <AppButton variant="primary" :disabled="loading" icon="pi-check" class="flex-1" @click="handleConfirmRegister">
          {{ selectionMode === "switch" ? "შეცვლა" : "ჩაწერა" }}
        </AppButton>
      </div>
    </BottomSheet>
  </div>
</template>
