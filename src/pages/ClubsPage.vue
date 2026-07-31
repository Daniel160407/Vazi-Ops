<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { storeToRefs } from "pinia";
import { format } from "date-fns";
import { useToast } from "primevue";
import { useGlobalStore } from "../stores/GlobalStore";
import { useClubsCrud } from "../composables/useClubsCrud";
import { useClubBookingsCrud } from "../composables/useClubBookingsCrud";
import { useAuth } from "../composables/useAuth";
import type { Club, ClubSlot, ClubBooking } from "../type/interfaces";
import { MAX_CLUBS_PER_CHILD, MAX_CHILDREN_PER_REGISTRATION } from "../composables/constants";
import LoadingSpinner from "../components/UI/LoadingSpinner.vue";
import SearchInput from "../components/UI/SearchInput.vue";
import InfoRow from "../components/UI/InfoRow.vue";
import BottomSheet from "../components/UI/BottomSheet.vue";
import SheetField from "../components/UI/SheetField.vue";
import AppInput from "../components/UI/AppInput.vue";
import AppButton from "../components/UI/AppButton.vue";

const globalStore = useGlobalStore();
const toast = useToast();
const { loading: loadingStore, clubs, clubRegistration, groups, clubBookings } = storeToRefs(globalStore);
const { fullName, userId, userGroupName, isLoggedIn } = useAuth();
const { registerInClub, changeClubBooking, loading } = useClubsCrud();
const { fetchUserBookings, updateBooking } = useClubBookingsCrud();

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

const slotPlaces = (club: Club) =>
  (club.slots ?? []).reduce((acc, s) => acc + (s.places_quantity ?? 0), 0);

const totalPlaces = computed(() =>
  clubs.value.reduce((acc, c) => acc + slotPlaces(c), 0),
);

const selectedClub = ref<Club | null>(null);
const selectedSlot = ref<ClubSlot | null>(null);
const currentChild = ref<string | null>(null);
const regQueue = ref<string[]>([]);
const sheetVisible = ref(false);
const selectedChildren = ref<string[]>([]);
const leaderName = ref("");
const leaderId = ref("");
const groupName = ref("");
const userBookings = ref<ClubBooking[]>([]);
const replaceVisible = ref(false);
const replaceOptions = ref<ClubBooking[]>([]);
const replaceReason = ref<"max" | "time" | "children">("max");
const submitting = ref(false);
const registeredCount = ref(0);

const takenChildNames = computed(() => {
  const taken = new Set<string>();
  const slotTime = selectedSlot.value?.time;
  if (!slotTime) return taken;
  const target = formatTime(slotTime);
  const leader = leaderName.value.trim();
  const group = groupName.value.trim();
  clubBookings.value.forEach((b) => {
    if (b.leader_name !== leader || b.group_name !== group) return;
    if (formatTime(bookingTime(b)) !== target) return;
    taken.add(`${b.child_first_name} ${b.child_last_name}`.trim());
  });
  return taken;
});

const slotRegisteredBookings = computed(() => {
  if (!selectedClub.value || !selectedSlot.value) return [];
  const leader = leaderName.value.trim();
  const group = groupName.value.trim();
  return clubBookings.value.filter(
    (b) =>
      b.leader_name === leader &&
      b.group_name === group &&
      b.club_id === selectedClub.value!.id &&
      b.slot_id === selectedSlot.value!.id,
  );
});

const alreadyRegisteredCount = computed(() => slotRegisteredBookings.value.length);

const groupChildren = computed(() => {
  const leader = leaderName.value.trim();
  const matchedGroup = groups.value.find(
    (g) => (leaderId.value && g.leader_id === leaderId.value) || g.leader === leader,
  );
  return (matchedGroup?.children ?? []).filter((c) => !takenChildNames.value.has(c));
});

watch(takenChildNames, (taken) => {
  if (selectedChildren.value.some((c) => taken.has(c))) {
    selectedChildren.value = selectedChildren.value.filter((c) => !taken.has(c));
  }
});

const toggleChild = (name: string) => {
  if (selectedChildren.value.includes(name)) {
    selectedChildren.value = selectedChildren.value.filter((c) => c !== name);
    return;
  }
  if (
    selectedChildren.value.length + alreadyRegisteredCount.value >=
    MAX_CHILDREN_PER_REGISTRATION
  ) {
    if (alreadyRegisteredCount.value > 0) {
      currentChild.value = name;
      replaceReason.value = "children";
      replaceOptions.value = [...slotRegisteredBookings.value];
      replaceVisible.value = true;
      return;
    }
    toast.add({
      severity: "warn",
      summary: "მაქსიმუმ ბავშვების რაოდენობა",
      detail: `ამ დროზე შეგიძლია მაქსიმუმ ${MAX_CHILDREN_PER_REGISTRATION} ბავშვის არჩევა`,
      life: 3000,
    });
    return;
  }
  selectedChildren.value = [...selectedChildren.value, name];
};

const splitName = (full: string) => {
  const parts = full.trim().split(/\s+/);
  return { first: parts[0] ?? "", last: parts.slice(1).join(" ") };
};

const openSheet = (club: Club) => {
  if (slotPlaces(club) <= 0 || !clubRegistration.value?.open) return;
  selectedClub.value = club;
  const slots = club.slots ?? [];
  selectedSlot.value = slots.find((s) => s.places_quantity > 0) ?? slots[0] ?? null;
  leaderName.value = fullName.value;
  leaderId.value = userId.value;
  groupName.value = userGroupName.value;
  sheetVisible.value = true;
  userBookings.value = [];
};

const selectSlot = (slot: ClubSlot) => {
  if (slot.places_quantity <= 0) return;
  selectedSlot.value = slot;
};

const closeSheet = () => {
  sheetVisible.value = false;
  replaceVisible.value = false;
  replaceOptions.value = [];
  selectedSlot.value = null;
  currentChild.value = null;
  regQueue.value = [];
  selectedChildren.value = [];
  leaderName.value = "";
  leaderId.value = "";
  groupName.value = "";
  userBookings.value = [];
  submitting.value = false;
  registeredCount.value = 0;
};

const bookingTime = (booking: ClubBooking) => {
  if (booking.slot_time) return booking.slot_time;
  return clubs.value.find((c) => c.id === booking.club_id)?.time ?? null;
};

const handleConfirmRegister = async () => {
  if (!selectedClub.value) return;

  if (!selectedSlot.value) {
    toast.add({ severity: "warn", summary: "აირჩიე დრო", life: 3000 });
    return;
  }

  if (!selectedChildren.value.length || !leaderName.value || !groupName.value) {
    toast.add({ severity: "warn", summary: "შეავსე ყველა ველი", life: 3000 });
    return;
  }

  registeredCount.value = 0;
  regQueue.value = [...selectedChildren.value];
  await processQueue();
};

const processQueue = async () => {
  if (!selectedClub.value || !selectedSlot.value) return;

  const slot = selectedSlot.value;
  submitting.value = true;

  while (regQueue.value.length) {
    const childName = regQueue.value[0]!;
    const { first, last } = splitName(childName);

    const existing = await fetchUserBookings(first, last, leaderName.value, groupName.value);
    userBookings.value = existing;

    const data = {
      child_first_name: first,
      child_last_name: last,
      leader_name: leaderName.value,
      group_name: groupName.value,
    };

    if (existing.some((b) => b.club_id === selectedClub.value!.id && b.slot_id === slot.id)) {
      toast.add({ severity: "warn", summary: "უკვე ჩაწერილია", detail: `${childName} უკვე ჩაწერილია.`, life: 5000 });
      regQueue.value = regQueue.value.slice(1);
      continue;
    }

    if (slot.time) {
      const selectedTime = formatTime(slot.time);
      const sameTimeBookings = existing.filter(
        (b) => formatTime(bookingTime(b)) === selectedTime,
      );
      if (sameTimeBookings.length) {
        currentChild.value = childName;
        replaceReason.value = "time";
        replaceOptions.value = sameTimeBookings;
        replaceVisible.value = true;
        submitting.value = false;
        return;
      }
    }

    if (existing.length >= MAX_CLUBS_PER_CHILD) {
      currentChild.value = childName;
      replaceReason.value = "max";
      replaceOptions.value = existing;
      replaceVisible.value = true;
      submitting.value = false;
      return;
    }

    const ok = await registerInClub(selectedClub.value, slot.id, data, true);
    if (ok) registeredCount.value++;
    regQueue.value = regQueue.value.slice(1);
  }

  submitting.value = false;

  if (registeredCount.value > 0) {
    toast.add({
      severity: "success",
      summary: "რეგისტრაცია წარმატებით დასრულდა",
      detail: `${registeredCount.value} ბავშვი ჩაიწერა`,
      life: 3000,
    });
  }

  closeSheet();
};

const handleReplace = async (oldBooking: ClubBooking) => {
  if (!selectedClub.value || !selectedSlot.value) return;
  await changeClubBooking(oldBooking, selectedClub.value, selectedSlot.value.id);
  replaceVisible.value = false;
  replaceOptions.value = [];
  currentChild.value = null;
  regQueue.value = regQueue.value.slice(1);
  await processQueue();
};

const handleReplaceChild = async (oldBooking: ClubBooking) => {
  if (!currentChild.value) return;
  const { first, last } = splitName(currentChild.value);
  await updateBooking({
    ...oldBooking,
    child_first_name: first,
    child_last_name: last,
  });
  replaceVisible.value = false;
  replaceOptions.value = [];
  currentChild.value = null;
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
          class="overflow-hidden rounded-2xl border border-blue-900/20 bg-[#0d1829] transition-all duration-150"
        >
          <div class="p-4">
            <div class="mb-3 flex items-start justify-between gap-2">
              <h3 class="text-base font-bold leading-tight text-white">{{ club.name }}</h3>
              <span class="shrink-0 rounded-lg border px-2.5 py-1 text-xs font-bold" :class="placesBg(slotPlaces(club))">
                {{ slotPlaces(club) <= 0 ? "სავსეა" : `${slotPlaces(club)} ადგილი` }}
              </span>
            </div>

            <div class="mb-4 flex flex-col gap-2">
              <InfoRow icon="pi-user"><span class="text-sm text-slate-400">{{ club.teacher || "—" }}</span></InfoRow>
              <InfoRow icon="pi-map-marker"><span class="text-sm text-slate-400">{{ club.place || "—" }}</span></InfoRow>
              <InfoRow v-if="club.additional_info" icon="pi-info-circle">
                <span class="text-sm leading-relaxed text-slate-500">{{ club.additional_info }}</span>
              </InfoRow>
            </div>

            <AppButton
              variant="plain"
              :disabled="!isLoggedIn || slotPlaces(club) <= 0 || !clubRegistration?.open || loading"
              class="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all duration-150"
              :class="(!isLoggedIn || slotPlaces(club) <= 0 || !clubRegistration?.open) ? 'cursor-not-allowed bg-slate-800/60 text-slate-600' : 'bg-blue-600 text-white hover:bg-blue-500 active:scale-95'"
              @click="openSheet(club)"
            >
              <i class="pi text-sm" :class="(!isLoggedIn || !clubRegistration?.open) ? 'pi-lock' : 'pi-check'" />
              {{ !isLoggedIn ? "გაიარე ავტორიზაცია" : slotPlaces(club) <= 0 ? "ადგილი არ არის" : !clubRegistration?.open ? "რეგისტრაცია დახურულია" : "ჩაეწერე" }}
            </AppButton>
          </div>
        </div>
      </div>
    </div>

    <BottomSheet
      :visible="sheetVisible && !replaceVisible"
      title="ჩაეწერე წრეში"
      @close="closeSheet"
    >
      <div v-if="selectedClub" class="mb-4 flex items-center gap-2 rounded-xl bg-blue-500/10 px-3 py-2.5">
        <i class="pi pi-sparkles text-sm text-blue-400" />
        <span class="text-sm font-semibold text-blue-300">{{ selectedClub.name }}</span>
      </div>

      <div v-if="selectedClub" class="mb-5">
        <p class="mb-2 text-[11px] font-bold uppercase tracking-widest text-slate-500">აირჩიე დრო</p>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="slot in selectedClub.slots"
            :key="slot.id"
            type="button"
            :disabled="slot.places_quantity <= 0"
            class="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50"
            :class="selectedSlot?.id === slot.id
              ? 'border-blue-500 bg-blue-600 text-white'
              : 'border-blue-900/30 bg-[#0d1829] text-slate-400 hover:border-blue-700/40'"
            @click="selectSlot(slot)"
          >
            <i class="pi pi-clock text-xs" />
            <span>{{ formatTime(slot.time) }}</span>
            <span
              class="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold"
              :class="selectedSlot?.id === slot.id ? 'bg-white/20 text-white' : 'bg-blue-900/40 text-slate-400'"
            >
              <i class="pi pi-users text-[9px]" />
              {{ slot.places_quantity <= 0 ? "სავსეა" : `${slot.places_quantity} ადგილი` }}
            </span>
          </button>
        </div>
      </div>

      <div class="flex flex-col gap-3">
        <SheetField label="ბავშვის სახელი და გვარი">
          <p v-if="!groupChildren.length" class="rounded-xl border border-blue-900/30 bg-[#0d1829] px-4 py-3 text-sm text-slate-500">
            ბავშვები ვერ მოიძებნა
          </p>
          <div v-else class="flex flex-col gap-2">
            <button
              v-for="child in groupChildren"
              :key="child"
              type="button"
              class="flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all duration-150"
              :class="selectedChildren.includes(child)
                ? 'border-blue-500/50 bg-blue-500/15'
                : 'border-blue-900/30 bg-[#0d1829] hover:border-blue-700/40'"
              @click="toggleChild(child)"
            >
              <span
                class="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all duration-150"
                :class="selectedChildren.includes(child)
                  ? 'border-blue-500 bg-blue-600'
                  : 'border-blue-900/50 bg-transparent'"
              >
                <i v-if="selectedChildren.includes(child)" class="pi pi-check text-[10px] text-white" />
              </span>
              <span class="text-sm" :class="selectedChildren.includes(child) ? 'font-semibold text-blue-100' : 'text-slate-200'">
                {{ child }}
              </span>
            </button>
          </div>
        </SheetField>
        <SheetField label="ლიდერის სახელი და გვარი">
          <AppInput :model-value="leaderName" disabled class="cursor-not-allowed opacity-60" />
        </SheetField>
        <SheetField label="ჯგუფის სახელი">
          <AppInput :model-value="groupName" disabled class="cursor-not-allowed opacity-60" />
        </SheetField>
      </div>

      <div class="mt-5 flex gap-3">
        <AppButton variant="primary" :loading="submitting" :disabled="loading" icon="pi-check" class="flex-1" @click="handleConfirmRegister">
          ჩაწერა
        </AppButton>
      </div>
    </BottomSheet>

    <BottomSheet
      :visible="replaceVisible"
      :title="replaceReason === 'children' ? 'აირჩიე შესაცვლელი ბავშვი' : 'აირჩიე შესაცვლელი წრე'"
      @close="replaceVisible = false"
    >
      <p v-if="replaceReason === 'children'" class="mb-4 text-sm leading-relaxed text-slate-400">
        ამ დროზე უკვე ჩაწერილია {{ MAX_CHILDREN_PER_REGISTRATION }} ბავშვი. აირჩიე რომელი შეიცვალოს
        <span v-if="currentChild" class="font-semibold text-blue-300">{{ currentChild }}</span>-ით.
      </p>
      <p v-else-if="replaceReason === 'time'" class="mb-4 text-sm leading-relaxed text-slate-400">
        <span v-if="currentChild" class="font-semibold text-slate-200">{{ currentChild }}</span>-ს უკვე აქვს არჩეული წრე ამ დროს ({{ formatTime(selectedSlot?.time) }}). აირჩიე რომელი შეიცვალოს
        <span v-if="selectedClub" class="font-semibold text-blue-300">{{ selectedClub.name }}</span>-ით.
      </p>
      <p v-else class="mb-4 text-sm leading-relaxed text-slate-400">
        <span v-if="currentChild" class="font-semibold text-slate-200">{{ currentChild }}</span>-ს უკვე აქვს არჩეული {{ MAX_CLUBS_PER_CHILD }} წრე. აირჩიე რომელი შეიცვალოს
        <span v-if="selectedClub" class="font-semibold text-blue-300">{{ selectedClub.name }}</span>-ით.
      </p>

      <div class="flex flex-col gap-3">
        <button
          v-for="booking in replaceOptions"
          :key="booking.id"
          type="button"
          :disabled="loading"
          class="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-blue-900/20 bg-[#0d1829] p-4 text-left transition-all duration-150 hover:border-blue-500/40 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          @click="replaceReason === 'children' ? handleReplaceChild(booking) : handleReplace(booking)"
        >
          <div class="min-w-0">
            <p v-if="replaceReason === 'children'" class="truncate text-sm font-bold text-white">
              {{ `${booking.child_first_name} ${booking.child_last_name}`.trim() }}
            </p>
            <template v-else>
              <p class="truncate text-sm font-bold text-white">{{ booking.club_name }}</p>
              <p class="mt-0.5 text-xs text-slate-500">{{ formatTime(bookingTime(booking)) }}</p>
            </template>
          </div>
          <i class="pi pi-arrow-right-arrow-left shrink-0 text-sm text-blue-400" />
        </button>
      </div>
    </BottomSheet>
  </div>
</template>
