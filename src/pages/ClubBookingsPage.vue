<script setup lang="ts">
import { ref, computed } from "vue";
import { storeToRefs } from "pinia";
import { format } from "date-fns";
import { useConfirm } from "primevue";
import { useClubBookingsCrud } from "../composables/useClubBookingsCrud";
import { useGlobalStore } from "../stores/GlobalStore";
import type { ClubBooking } from "../type/interfaces";
import LoadingSpinner from "../components/UI/LoadingSpinner.vue";
import SearchInput from "../components/UI/SearchInput.vue";
import BottomSheet from "../components/UI/BottomSheet.vue";
import SheetField from "../components/UI/SheetField.vue";

const { bookings, loading, addBooking, updateBooking, deleteBooking } = useClubBookingsCrud();
const { loading: loadingStore } = storeToRefs(useGlobalStore());
const confirm = useConfirm();

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

const blankForm = (): Partial<ClubBooking> => ({
  club_id: "", club_name: "", child_first_name: "", child_last_name: "", leader_name: "", group_name: "",
});

const form = ref<Partial<ClubBooking>>(blankForm());

const openAdd = () => {
  isEditing.value = false;
  form.value = blankForm();
  submitted.value = false;
  sheetVisible.value = true;
};

const openEdit = (booking: ClubBooking) => {
  isEditing.value = true;
  form.value = { ...booking };
  submitted.value = false;
  sheetVisible.value = true;
};

const handleSave = async () => {
  submitted.value = true;
  if (!form.value.club_name || !form.value.child_first_name || !form.value.child_last_name) return;

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
          <p class="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">სულ რეგისტ.</p>
          <p class="text-3xl font-bold text-white">{{ bookings.length }}</p>
        </div>
        <div class="rounded-2xl border border-blue-900/20 bg-[#0d1829] p-4">
          <p class="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">აქტიური წრე</p>
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
              <span class="h-4 w-[3px] rounded-full bg-blue-500" />
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
                  <th class="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest text-slate-600">სახელი გვარი</th>
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
                      <button
                        class="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-blue-900/20 bg-blue-900/20 text-slate-500 transition-all hover:text-slate-300"
                        @click="openEdit(row)"
                      >
                        <i class="pi pi-pencil text-[10px]" />
                      </button>
                      <button
                        class="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-red-900/20 bg-red-500/5 text-red-500/60 transition-all hover:bg-red-500/15 hover:text-red-400"
                        @click="handleDelete(row)"
                      >
                        <i class="pi pi-trash text-[10px]" />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <button
      class="fixed bottom-24 right-5 z-30 flex h-13 w-13 cursor-pointer items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-900/40 transition-all hover:scale-105 hover:bg-blue-500 active:scale-95 lg:bottom-8 lg:right-8"
      @click="openAdd"
    >
      <i class="pi pi-plus text-lg" />
    </button>

    <BottomSheet
      :visible="sheetVisible"
      :title="isEditing ? 'რეგისტრაციის რედაქტირება' : 'ახალი რეგისტრაცია'"
      @close="sheetVisible = false"
    >
      <div class="flex flex-col gap-4">
        <SheetField label="წრის სახელი" :required="true" :error="submitted && !form.club_name ? 'წრის სახელი აუცილებელია' : ''">
          <input
            v-model="form.club_name"
            type="text"
            class="w-full rounded-xl border px-4 py-3 text-sm text-slate-200 outline-none transition-colors"
            :class="submitted && !form.club_name ? 'border-red-500/60 bg-red-500/5' : 'border-blue-900/30 bg-[#0d1829] focus:border-blue-700/60'"
          />
        </SheetField>

        <div class="grid grid-cols-2 gap-3">
          <SheetField label="სახელი" :required="true" :error="submitted && !form.child_first_name ? 'სახელი აუცილებელია' : ''">
            <input
              v-model="form.child_first_name"
              type="text"
              class="w-full rounded-xl border px-4 py-3 text-sm text-slate-200 outline-none transition-colors"
              :class="submitted && !form.child_first_name ? 'border-red-500/60 bg-red-500/5' : 'border-blue-900/30 bg-[#0d1829] focus:border-blue-700/60'"
            />
          </SheetField>
          <SheetField label="გვარი" :required="true" :error="submitted && !form.child_last_name ? 'გვარი აუცილებელია' : ''">
            <input
              v-model="form.child_last_name"
              type="text"
              class="w-full rounded-xl border px-4 py-3 text-sm text-slate-200 outline-none transition-colors"
              :class="submitted && !form.child_last_name ? 'border-red-500/60 bg-red-500/5' : 'border-blue-900/30 bg-[#0d1829] focus:border-blue-700/60'"
            />
          </SheetField>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <SheetField label="ლიდერი">
            <input
              v-model="form.leader_name"
              type="text"
              class="w-full rounded-xl border border-blue-900/30 bg-[#0d1829] px-4 py-3 text-sm text-slate-200 outline-none focus:border-blue-700/60"
            />
          </SheetField>
          <SheetField label="ჯგუფი">
            <input
              v-model="form.group_name"
              type="text"
              class="w-full rounded-xl border border-blue-900/30 bg-[#0d1829] px-4 py-3 text-sm text-slate-200 outline-none focus:border-blue-700/60"
            />
          </SheetField>
        </div>
      </div>

      <div class="mt-5 flex gap-3">
        <button
          v-if="isEditing"
          class="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-red-900/40 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-400 transition-all hover:bg-red-500/20"
          @click="handleDelete(form as ClubBooking)"
        >
          <i class="pi pi-trash text-sm" />
          წაშლა
        </button>
        <button
          :disabled="loading"
          class="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition-all hover:bg-blue-500 disabled:opacity-50"
          @click="handleSave"
        >
          <i class="pi pi-check text-sm" />
          {{ isEditing ? "შენახვა" : "დამატება" }}
        </button>
      </div>
    </BottomSheet>
  </div>
</template>
