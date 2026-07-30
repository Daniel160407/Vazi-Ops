<script setup lang="ts">
import { ref, computed } from "vue";
import { storeToRefs } from "pinia";
import { format } from "date-fns";
import { useAuth } from "../composables/useAuth";
import { useClubBookingsCrud } from "../composables/useClubBookingsCrud";
import { useGlobalStore } from "../stores/GlobalStore";
import type { ClubBooking } from "../type/interfaces";
import LoadingSpinner from "../components/UI/LoadingSpinner.vue";
import SearchInput from "../components/UI/SearchInput.vue";

const { bookings } = useClubBookingsCrud();
const { loading: loadingStore, clubs } = storeToRefs(useGlobalStore());
const { fullName, userGroupName } = useAuth();

const search = ref("");
const onlyMine = ref(false);

const filtered = computed(() => {
  const q = search.value.toLowerCase().trim();
  const myGroup = userGroupName.value.trim();
  const myName = fullName.value.trim();
  return bookings.value.filter((b) => {
    if (onlyMine.value && b.group_name !== myGroup && b.leader_name !== myName) {
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
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
