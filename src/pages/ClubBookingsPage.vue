<script setup lang="ts">
import { ref, computed } from "vue";
import { storeToRefs } from "pinia";
import { format } from "date-fns";
import { useConfirm } from "primevue";
import { useClubBookingsCrud } from "@/composables/useClubBookingsCrud";
import { useGlobalStore } from "@/stores/GlobalStore";
import type { ClubBooking } from "@/type/interfaces";
import LoadingSpinner from "@/components/UI/LoadingSpinner.vue";
import SearchInput from "@/components/UI/SearchInput.vue";
import BottomSheet from "@/components/UI/BottomSheet.vue";
import SheetField from "@/components/UI/SheetField.vue";
import AppButton from "@/components/UI/AppButton.vue";
import AppInput from "@/components/UI/AppInput.vue";

const { bookings, loading, addBooking, updateBooking, deleteBooking } = useClubBookingsCrud();
const { loading: loadingStore, appUsers, clubs, groups } = storeToRefs(useGlobalStore());
const confirm = useConfirm();

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

const selectLeader = (name: string) => {
  form.value.leader_name = name;
  const group = groups.value.find((g) => g.leader === name);
  if (group) form.value.group_name = group.name;
  leaderOpen.value = false;
};

const selectClub = (id: string, name: string) => {
  form.value.club_id = id;
  form.value.club_name = name;
  clubOpen.value = false;
};

const search = ref("");

const filtered = computed(() => {
  const q = search.value.toLowerCase().trim();
  if (!q) return bookings.value;
  return bookings.value.filter(
    (b) =>
      b.child_first_name.toLowerCase().includes(q) ||
      b.child_last_name.toLowerCase().includes(q) ||
      b.club_name.toLowerCase().includes(q) ||
      b.leader_name.toLowerCase().includes(q) ||
      b.group_name.toLowerCase().includes(q),
  );
});

const groupedByClub = computed(() => {
  const groups = new Map<string, ClubBooking[]>();
  filtered.value.forEach((b) => {
    const key = b.club_name || "უცნობი წრე";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(b);
  });
  return groups;
});

const uniqueClubs = computed(() => groupedByClub.value.size);

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
    acceptProps: { label: "წაშლა", severity: "danger" },
    rejectProps: { label: "გაუქმება", severity: "secondary", outlined: true },
    accept: async () => {
      await deleteBooking(booking.id);
      sheetVisible.value = false;
    },
  });
};

const formatDate = (value?: Date | string) => {
  if (!value) return "—";
  const date = new Date(value);
  return isNaN(date.getTime()) ? "—" : format(date, "dd.MM.yy HH:mm");
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

      <p v-if="filtered.length === 0" class="py-10 text-center text-sm text-slate-600">
        რეგისტრაცია ვერ მოიძებნა
      </p>

      <div class="flex flex-col gap-4">
        <div
          v-for="[clubName, rows] in groupedByClub"
          :key="clubName"
          class="overflow-hidden rounded-2xl border border-blue-900/20 bg-[#0d1829]"
        >
          <div class="flex items-center justify-between border-b border-blue-900/20 bg-blue-500/5 px-4 py-3">
            <div class="flex items-center gap-2.5">
              <span class="h-4 w-0.75 rounded-full bg-blue-500" />
              <span class="font-bold text-white">{{ clubName }}</span>
            </div>
            <span class="rounded-lg border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 text-xs font-bold text-blue-400">
              {{ rows.length }}
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
                  <th class="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest text-slate-600">თარიღი</th>
                  <th class="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(row, i) in rows"
                  :key="row.id"
                  class="border-b border-blue-900/10 transition-colors last:border-b-0 hover:bg-blue-500/5"
                >
                  <td class="px-4 py-3 text-xs font-bold text-slate-600">{{ i + 1 }}</td>
                  <td class="px-4 py-3 font-semibold text-slate-200">{{ row.child_first_name }} {{ row.child_last_name }}</td>
                  <td class="px-4 py-3 text-slate-400">{{ row.leader_name || "—" }}</td>
                  <td class="px-4 py-3 text-slate-400">{{ row.group_name || "—" }}</td>
                  <td class="px-4 py-3 text-xs text-slate-600">{{ formatDate(row.created_at) }}</td>
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
