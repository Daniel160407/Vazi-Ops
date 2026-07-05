<script setup lang="ts">
import { ref, computed } from "vue";
import { storeToRefs } from "pinia";
import { format } from "date-fns";
import { useToast } from "primevue";
import { useGlobalStore } from "../stores/GlobalStore";
import { useClubsCrud } from "../composables/useClubsCrud";
import { useClubBookingsCrud } from "../composables/useClubBookingsCrud";
import { useAuth } from "../composables/useAuth";
import type { Club, ClubBooking } from "../type/interfaces";
import LoadingSpinner from "../components/UI/LoadingSpinner.vue";
import SearchInput from "../components/UI/SearchInput.vue";
import InfoRow from "../components/UI/InfoRow.vue";
import BottomSheet from "../components/UI/BottomSheet.vue";
import SheetField from "../components/UI/SheetField.vue";
import AppInput from "../components/UI/AppInput.vue";
import AppButton from "../components/UI/AppButton.vue";

const globalStore = useGlobalStore();
const toast = useToast();
const { loading: loadingStore, clubs, clubRegistration, groups, appUsers } = storeToRefs(globalStore);
const { fullName, userGroupName } = useAuth();
const { registerInClub, loading } = useClubsCrud();
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

const leaderOpen = ref(false);

const leaderSuggestions = computed(() => {
  const q = leaderName.value.toLowerCase().trim();
  return appUsers.value.filter((u) => u.name.toLowerCase().includes(q));
});

const selectLeader = (name: string) => {
  leaderName.value = name;
  leaderOpen.value = false;
};

const childOpen = ref(false);

const childSuggestions = computed(() => {
  const leader = leaderName.value.trim();
  const q = childFullName.value.toLowerCase().trim();
  const matchedGroup = groups.value.find((g) => g.leader === leader);
  if (!matchedGroup) return [];
  return matchedGroup.children.filter((c) => !q || c.toLowerCase().includes(q));
});

const selectChild = (name: string) => {
  childFullName.value = name;
  childOpen.value = false;
};

const splitName = (full: string) => {
  const parts = full.trim().split(/\s+/);
  return { first: parts[0] ?? "", last: parts.slice(1).join(" ") };
};

const openSheet = (club: Club) => {
  if (club.places_quantity <= 0 || !clubRegistration.value?.open) return;
  selectedClub.value = club;
  leaderName.value = fullName.value;
  groupName.value = userGroupName.value;
  sheetVisible.value = true;
  userBookings.value = [];
};

const closeSheet = () => {
  sheetVisible.value = false;
  childFullName.value = "";
  leaderName.value = "";
  groupName.value = "";
  userBookings.value = [];
};

const handleConfirmRegister = async () => {
  if (!selectedClub.value) return;

  if (!childFullName.value.trim() || !leaderName.value || !groupName.value) {
    toast.add({ severity: "warn", summary: "შეავსე ყველა ველი", life: 3000 });
    return;
  }

  const { first, last } = splitName(childFullName.value);

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

  await registerInClub(selectedClub.value, {
    child_first_name: first, child_last_name: last,
    leader_name: leaderName.value, group_name: groupName.value,
  });
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
              :disabled="club.places_quantity <= 0 || !clubRegistration?.open || loading"
              class="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all duration-150"
              :class="(club.places_quantity <= 0 || !clubRegistration?.open) ? 'cursor-not-allowed bg-slate-800/60 text-slate-600' : 'bg-blue-600 text-white hover:bg-blue-500 active:scale-95'"
              @click="openSheet(club)"
            >
              <i class="pi text-sm" :class="!clubRegistration?.open ? 'pi-lock' : 'pi-check'" />
              {{ club.places_quantity <= 0 ? "ადგილი არ არის" : !clubRegistration?.open ? "რეგისტრაცია დახურულია" : "ჩაეწერე" }}
            </AppButton>
          </div>
        </div>
      </div>
    </div>

    <BottomSheet
      :visible="sheetVisible"
      title="ჩაეწერე წრეში"
      @close="closeSheet"
    >
      <div v-if="selectedClub" class="mb-5 flex items-center gap-2 rounded-xl bg-blue-500/10 px-3 py-2.5">
        <i class="pi pi-sparkles text-sm text-blue-400" />
        <span class="text-sm font-semibold text-blue-300">{{ selectedClub.name }}</span>
        <span class="ml-auto text-xs text-slate-500">{{ formatTime(selectedClub.time) }}</span>
      </div>

      <div class="flex flex-col gap-3">
        <SheetField label="ბავშვის სახელი და გვარი">
          <div class="relative">
            <AppInput v-model="childFullName" autocomplete="off" @focus="childOpen = true" @blur="childOpen = false" />
            <Transition
              enter-active-class="transition-all duration-150 ease-out"
              enter-from-class="opacity-0 -translate-y-1"
              enter-to-class="opacity-100 translate-y-0"
              leave-active-class="transition-all duration-100 ease-in"
              leave-from-class="opacity-100 translate-y-0"
              leave-to-class="opacity-0 -translate-y-1"
            >
              <ul
                v-if="childOpen && childSuggestions.length"
                class="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-48 overflow-y-auto rounded-xl border border-blue-900/30 bg-[#07101e] py-1 shadow-xl"
                style="box-shadow: 0 8px 32px 0 rgba(0,6,30,0.8)"
                @mousedown.prevent
              >
                <li
                  v-for="child in childSuggestions"
                  :key="child"
                  class="flex cursor-pointer items-center gap-3 px-3 py-2.5 transition-colors hover:bg-blue-900/20"
                  @click="selectChild(child)"
                >
                  <span class="text-sm text-slate-200">{{ child }}</span>
                </li>
              </ul>
            </Transition>
          </div>
        </SheetField>
        <SheetField label="ლიდერის სახელი და გვარი">
          <div class="relative">
            <AppInput v-model="leaderName" autocomplete="off" @focus="leaderOpen = true" @blur="leaderOpen = false" />
            <Transition
              enter-active-class="transition-all duration-150 ease-out"
              enter-from-class="opacity-0 -translate-y-1"
              enter-to-class="opacity-100 translate-y-0"
              leave-active-class="transition-all duration-100 ease-in"
              leave-from-class="opacity-100 translate-y-0"
              leave-to-class="opacity-0 -translate-y-1"
            >
              <ul
                v-if="leaderOpen && leaderSuggestions.length"
                class="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-48 overflow-y-auto rounded-xl border border-blue-900/30 bg-[#07101e] py-1 shadow-xl"
                style="box-shadow: 0 8px 32px 0 rgba(0,6,30,0.8)"
                @mousedown.prevent
              >
                <li
                  v-for="u in leaderSuggestions"
                  :key="u.id"
                  class="flex cursor-pointer items-center gap-3 px-3 py-2.5 transition-colors hover:bg-blue-900/20"
                  @click="selectLeader(u.name)"
                >
                  <div class="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-900/40 text-xs font-bold text-blue-300">
                    <img v-if="u.avatar_url" :src="u.avatar_url" class="h-full w-full object-cover" />
                    <span v-else>{{ u.name.charAt(0).toUpperCase() }}</span>
                  </div>
                  <span class="text-sm text-slate-200">{{ u.name }}</span>
                </li>
              </ul>
            </Transition>
          </div>
        </SheetField>
        <SheetField label="ჯგუფის სახელი">
          <AppInput v-model="groupName" />
        </SheetField>
      </div>

      <div class="mt-5 flex gap-3">
        <AppButton variant="primary" :disabled="loading" icon="pi-check" class="flex-1" @click="handleConfirmRegister">
          ჩაწერა
        </AppButton>
      </div>
    </BottomSheet>
  </div>
</template>
