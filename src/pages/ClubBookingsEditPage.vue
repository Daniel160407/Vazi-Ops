<script setup lang="ts">
import { ref, computed } from "vue";
import { storeToRefs } from "pinia";
import { format } from "date-fns";
import { useAppConfirm } from "../composables/useAppConfirm";
import { useAuth } from "../composables/useAuth";
import { useClubBookingsCrud } from "../composables/useClubBookingsCrud";
import { useGlobalStore } from "../stores/GlobalStore";
import type { AppUser, ClubBooking } from "../type/interfaces";
import LoadingSpinner from "../components/UI/LoadingSpinner.vue";
import SearchInput from "../components/UI/SearchInput.vue";
import BottomSheet from "../components/UI/BottomSheet.vue";
import SheetField from "../components/UI/SheetField.vue";
import AppButton from "../components/UI/AppButton.vue";
import AppInput from "../components/UI/AppInput.vue";

const { bookings, loading, addBooking, updateBooking, deleteBooking, deleteAllBookings } = useClubBookingsCrud();
const { loading: loadingStore, appUsers, clubs, groups } = storeToRefs(useGlobalStore());
const { fullName, userGroupName } = useAuth();
const confirm = useAppConfirm();

const leaderOpen = ref(false);
const clubOpen = ref(false);

const leaderSuggestions = computed(() => {
  const q = (form.value.leader_name ?? "").toLowerCase().trim();
  return appUsers.value.filter((u) => u.name.toLowerCase().includes(q));
});

const clubSuggestions = computed(() => {
  const q = (form.value.club_name ?? "").toLowerCase().trim();
  return clubs.value.filter((c) => c.name.toLowerCase().includes(q));
});

const selectLeader = (leader: AppUser) => {
  form.value.leader_name = leader.name;
  const group = groups.value.find(
    (g) => g.leader_id === leader.id || g.leader === leader.name,
  );
  form.value.group_name = group?.name ?? "";
  leaderOpen.value = false;
};

const selectClub = (id: string, name: string) => {
  form.value.club_id = id;
  form.value.club_name = name;
  clubOpen.value = false;
};

const search = ref("");
const onlyMine = ref(false);
const onlyOneClub = ref(false);

const childKey = (b: ClubBooking) =>
  `${b.child_first_name.trim().toLowerCase()}|${b.child_last_name.trim().toLowerCase()}|${b.group_name.trim().toLowerCase()}`;

const childClubCount = computed(() => {
  const map = new Map<string, Set<string>>();
  bookings.value.forEach((b) => {
    const key = childKey(b);
    if (!map.has(key)) map.set(key, new Set());
    map.get(key)!.add(b.club_id || b.club_name);
  });
  return map;
});

const filtered = computed(() => {
  const q = search.value.toLowerCase().trim();
  const myGroup = userGroupName.value.trim();
  const myName = fullName.value.trim();
  return bookings.value.filter((b) => {
    if (onlyMine.value && b.group_name !== myGroup && b.leader_name !== myName) {
      return false;
    }
    if (onlyOneClub.value && (childClubCount.value.get(childKey(b))?.size ?? 0) !== 1) {
      return false;
    }
    if (!q) return true;
    return (
      b.child_first_name.toLowerCase().includes(q) ||
      b.child_last_name.toLowerCase().includes(q) ||
      b.club_name.toLowerCase().includes(q) ||
      b.leader_name.toLowerCase().includes(q) ||
      b.group_name.toLowerCase().includes(q)
    );
  });
});

const formatTime = (value?: Date | string | null) => {
  if (!value) return "";
  const date = new Date(value);
  return isNaN(date.getTime()) ? "" : format(date, "HH:mm");
};

const rowTime = (b: ClubBooking) =>
  formatTime(b.slot_time ?? clubs.value.find((c) => c.id === b.club_id)?.time) || "—";

const groupedByClub = computed(() => {
  const groups = new Map<string, { name: string; times: string[]; rows: ClubBooking[] }>();
  filtered.value.forEach((b) => {
    const name = b.club_name || "უცნობი წრე";
    const club = clubs.value.find((c) => c.id === b.club_id);
    const time = formatTime(b.slot_time ?? club?.time);
    const key = b.club_id || name;
    if (!groups.has(key)) groups.set(key, { name, times: [], rows: [] });
    const group = groups.get(key)!;
    group.rows.push(b);
    if (time && !group.times.includes(time)) group.times.push(time);
  });
  groups.forEach((g) => g.times.sort());
  return groups;
});

const uniqueClubs = computed(() => groupedByClub.value.size);

const timeFilters = ref<Record<string, string>>({});

const toggleTimeFilter = (key: string, time: string) => {
  const next = { ...timeFilters.value };
  if (next[key] === time) delete next[key];
  else next[key] = time;
  timeFilters.value = next;
};

const rowsFor = (key: string, rows: ClubBooking[]) => {
  const t = timeFilters.value[key];
  if (t) return rows.filter((r) => rowTime(r) === t);
  return [...rows].sort((a, b) => rowTime(a).localeCompare(rowTime(b)));
};

const sheetVisible = ref(false);
const isEditing = ref(false);
const submitted = ref(false);
const childFullName = ref("");

const splitName = (full: string) => {
  const parts = full.trim().split(/\s+/);
  return { first: parts[0] ?? "", last: parts.slice(1).join(" ") };
};

const blankForm = (): Partial<ClubBooking> => ({
  club_id: "", club_name: "", child_first_name: "", child_last_name: "", leader_name: "", group_name: "",
});

const form = ref<Partial<ClubBooking>>(blankForm());

const openAdd = () => {
  isEditing.value = false;
  form.value = blankForm();
  childFullName.value = "";
  submitted.value = false;
  sheetVisible.value = true;
};

const openEdit = (booking: ClubBooking) => {
  isEditing.value = true;
  form.value = { ...booking };
  childFullName.value = `${booking.child_first_name} ${booking.child_last_name}`.trim();
  submitted.value = false;
  sheetVisible.value = true;
};

const handleSave = async () => {
  submitted.value = true;
  if (!form.value.club_name || !childFullName.value.trim()) return;

  const { first, last } = splitName(childFullName.value);
  form.value.child_first_name = first;
  form.value.child_last_name = last;

  if (isEditing.value && form.value.id) {
    await updateBooking(form.value as ClubBooking);
  } else {
    const { id, created_at, ...payload } = form.value;
    await addBooking(payload as Omit<ClubBooking, "id" | "created_at">);
  }

  sheetVisible.value = false;
};

const handleDelete = (booking: ClubBooking) => {
  confirm.require({
    message: "დარწმუნებული ხარ, რომ გინდა რეგისტრაციის წაშლა?",
    header: "წაშლა",
    acceptLabel: "წაშლა",
    rejectLabel: "გაუქმება",
    accept: async () => {
      await deleteBooking(booking.id);
      sheetVisible.value = false;
    },
  });
};

const handleDeleteAll = () => {
  confirm.require({
    message: "დარწმუნებული ხარ, რომ გინდა ყველა რეგისტრაციის წაშლა?",
    header: "ყველას წაშლა",
    acceptLabel: "წაშლა",
    rejectLabel: "გაუქმება",
    accept: async () => {
      await deleteAllBookings();
    },
  });
};
</script>

<template>
  <div class="relative overflow-x-hidden pb-4">
    <LoadingSpinner v-if="loadingStore && bookings.length === 0" />

    <div v-else>
      <SearchInput v-model="search" placeholder="მოძებნე სახელი, წრე, ჯგუფი..." />

      <div class="mb-5 grid grid-cols-2 gap-3">
        <div class="rounded-2xl border border-blue-900/20 bg-[#0d1829] p-4">
          <p class="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">რეგისტრაციების რაოდენობა</p>
          <p class="text-3xl font-bold text-white">{{ bookings.length }}</p>
        </div>
        <div class="rounded-2xl border border-blue-900/20 bg-[#0d1829] p-4">
          <p class="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">წრეების რაოდენობა</p>
          <p class="text-3xl font-bold text-blue-400">{{ uniqueClubs }}</p>
        </div>
      </div>

      <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
        <label class="flex cursor-pointer items-center gap-2.5 rounded-2xl border border-blue-900/20 bg-[#0d1829] px-4 py-2.5">
          <input v-model="onlyMine" type="checkbox" class="sr-only" />
          <span
            class="flex h-5 w-5 items-center justify-center rounded-md border transition-all duration-150"
            :class="onlyMine ? 'border-blue-500 bg-blue-600' : 'border-blue-900/50 bg-transparent'"
          >
            <i v-if="onlyMine" class="pi pi-check text-[10px] text-white" />
          </span>
          <span class="text-sm font-semibold text-slate-300">მხოლოდ ჩემი ბავშვები</span>
        </label>

        <label class="flex cursor-pointer items-center gap-2.5 rounded-2xl border border-blue-900/20 bg-[#0d1829] px-4 py-2.5">
          <input v-model="onlyOneClub" type="checkbox" class="sr-only" />
          <span
            class="flex h-5 w-5 items-center justify-center rounded-md border transition-all duration-150"
            :class="onlyOneClub ? 'border-blue-500 bg-blue-600' : 'border-blue-900/50 bg-transparent'"
          >
            <i v-if="onlyOneClub" class="pi pi-check text-[10px] text-white" />
          </span>
          <span class="text-sm font-semibold text-slate-300">მხოლოდ ერთ წრეზე რეგისტრირებული</span>
        </label>

        <AppButton v-if="bookings.length" variant="danger" :disabled="loading" icon="pi-trash" @click="handleDeleteAll">
          ყველას წაშლა
        </AppButton>
      </div>

      <p v-if="filtered.length === 0" class="py-10 text-center text-sm text-slate-600">
        რეგისტრაცია ვერ მოიძებნა
      </p>

      <div class="flex flex-col gap-4">
        <div
          v-for="[key, group] in groupedByClub"
          :key="key"
          class="overflow-hidden rounded-2xl border border-blue-900/20 bg-[#0d1829]"
        >
          <div class="flex items-center justify-between border-b border-blue-900/20 bg-blue-500/5 px-4 py-3">
            <div class="flex items-center gap-2.5">
              <span class="h-4 w-0.75 rounded-full bg-blue-500" />
              <span class="font-bold text-white">{{ group.name }}</span>
              <div v-if="group.times.length > 1" class="flex items-center gap-1.5">
                <button
                  v-for="t in group.times"
                  :key="t"
                  type="button"
                  class="flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold transition-colors"
                  :class="timeFilters[key] === t ? 'bg-blue-600 text-white' : 'bg-blue-900/30 text-slate-400 hover:text-slate-200'"
                  @click="toggleTimeFilter(key, t)"
                >
                  <i class="pi pi-clock text-[10px]" />{{ t }}
                </button>
              </div>
              <span v-else-if="group.times.length" class="flex items-center gap-1 text-xs font-semibold text-slate-500">
                <i class="pi pi-clock text-[10px]" />{{ group.times[0] }}
              </span>
            </div>
            <span class="rounded-lg border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 text-xs font-bold text-blue-400">
              {{ group.rows.length }}
            </span>
          </div>

          <div class="table-scroll overflow-x-auto pb-2">
            <table class="w-full min-w-130 text-sm">
              <thead>
                <tr class="border-b border-blue-900/20">
                  <th class="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest text-slate-600">#</th>
                  <th class="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest text-slate-600">ბავშვი</th>
                  <th class="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest text-slate-600">ლიდერი</th>
                  <th class="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest text-slate-600">ჯგუფი</th>
                  <th class="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest text-slate-600">დრო</th>
                  <th class="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(row, i) in rowsFor(key, group.rows)"
                  :key="row.id"
                  class="border-b border-blue-900/10 transition-colors last:border-b-0 hover:bg-blue-500/5"
                >
                  <td class="px-4 py-3 text-xs font-bold text-slate-600">{{ i + 1 }}</td>
                  <td class="px-4 py-3 font-semibold text-slate-200">{{ row.child_first_name }} {{ row.child_last_name }}</td>
                  <td class="px-4 py-3 text-slate-400">{{ row.leader_name || "—" }}</td>
                  <td class="px-4 py-3 text-slate-400">{{ row.group_name || "—" }}</td>
                  <td class="px-4 py-3">
                    <span class="inline-flex items-center gap-1 rounded-md bg-blue-900/30 px-2 py-0.5 text-xs font-semibold text-slate-300">
                      <i class="pi pi-clock text-[10px]" />{{ rowTime(row) }}
                    </span>
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex items-center justify-end gap-1.5">
                      <AppButton variant="icon-edit" icon="pi-pencil" @click="openEdit(row)" />
                      <AppButton variant="icon-delete" icon="pi-trash" @click="handleDelete(row)" />
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <AppButton variant="fab" icon="pi-plus" @click="openAdd" />

    <BottomSheet
      :visible="sheetVisible"
      :title="isEditing ? 'რეგისტრაციის რედაქტირება' : 'ახალი რეგისტრაცია'"
      @close="sheetVisible = false"
    >
      <div class="flex flex-col gap-4">
        <SheetField label="წრე" :required="true" :error="submitted && !form.club_name ? 'წრის სახელი აუცილებელია' : ''">
          <div class="relative">
            <AppInput v-model="form.club_name" autocomplete="off" :error="submitted && !form.club_name" @focus="clubOpen = true" @blur="clubOpen = false" />
            <Transition
              enter-active-class="transition-all duration-150 ease-out"
              enter-from-class="opacity-0 -translate-y-1"
              enter-to-class="opacity-100 translate-y-0"
              leave-active-class="transition-all duration-100 ease-in"
              leave-from-class="opacity-100 translate-y-0"
              leave-to-class="opacity-0 -translate-y-1"
            >
              <ul
                v-if="clubOpen && clubSuggestions.length"
                class="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-48 overflow-y-auto rounded-xl border border-blue-900/30 bg-[#07101e] py-1 shadow-xl"
                style="box-shadow: 0 8px 32px 0 rgba(0,6,30,0.8)"
                @mousedown.prevent
              >
                <li
                  v-for="club in clubSuggestions"
                  :key="club.id"
                  class="flex cursor-pointer items-center gap-3 px-3 py-2.5 transition-colors hover:bg-blue-900/20"
                  @click="selectClub(club.id, club.name)"
                >
                  <div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-900/30">
                    <i class="pi pi-sparkles text-[10px] text-blue-400" />
                  </div>
                  <span class="text-sm text-slate-200">{{ club.name }}</span>
                </li>
              </ul>
            </Transition>
          </div>
        </SheetField>

        <SheetField label="ბავშვის სახელი და გვარი" :required="true" :error="submitted && !childFullName.trim() ? 'სახელი და გვარი აუცილებელია' : ''">
          <AppInput v-model="childFullName" :error="submitted && !childFullName.trim()" />
        </SheetField>

        <SheetField label="ლიდერი">
          <div class="relative">
            <AppInput v-model="form.leader_name" autocomplete="off" @focus="leaderOpen = true" @blur="leaderOpen = false" />
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
                  @click="selectLeader(u)"
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

        <SheetField label="ჯგუფი">
          <AppInput v-model="form.group_name" />
        </SheetField>
      </div>

      <div class="mt-5 flex gap-3">
        <AppButton v-if="isEditing" variant="danger" icon="pi-trash" @click="handleDelete(form as ClubBooking)">წაშლა</AppButton>
        <AppButton variant="primary" :disabled="loading" icon="pi-check" class="flex-1" @click="handleSave">
          {{ isEditing ? "შენახვა" : "დამატება" }}
        </AppButton>
      </div>
    </BottomSheet>
  </div>
</template>
