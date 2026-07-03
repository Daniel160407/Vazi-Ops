<script setup lang="ts">
import { ref, computed } from "vue";
import { storeToRefs } from "pinia";
import { format } from "date-fns";
import { useConfirm } from "primevue";
import DatePicker from "primevue/datepicker";
import { useGlobalStore } from "../stores/GlobalStore";
import { useClubsCrud } from "../composables/useClubsCrud";
import type { Club } from "../type/interfaces";
import LoadingSpinner from "../components/UI/LoadingSpinner.vue";
import SearchInput from "../components/UI/SearchInput.vue";
import InfoRow from "../components/UI/InfoRow.vue";
import BottomSheet from "../components/UI/BottomSheet.vue";
import SheetField from "../components/UI/SheetField.vue";
import AppButton from "../components/UI/AppButton.vue";

const { loading: loadingStore, clubs } = storeToRefs(useGlobalStore());
const { addClub, updateClub, deleteClub, loading } = useClubsCrud();
const confirm = useConfirm();

const sheetVisible = ref(false);
const isAdding = ref(false);

const blankClub = (): Omit<Club, "id"> => ({
  name: "", teacher: "", places_quantity: 0, place: "", time: new Date(), additional_info: "",
});

const form = ref<Club | Omit<Club, "id">>(blankClub());

const openAdd = () => {
  isAdding.value = true;
  form.value = blankClub();
  sheetVisible.value = true;
};

const openEdit = (club: Club) => {
  isAdding.value = false;
  form.value = { ...club, time: new Date(club.time) };
  sheetVisible.value = true;
};

const handleSave = async () => {
  if (isAdding.value) await addClub(form.value as Omit<Club, "id">);
  else await updateClub(form.value as Club);
  sheetVisible.value = false;
};

const handleDelete = () => {
  confirm.require({
    message: "დარწმუნებული ხარ, რომ წრის წაშლა გინდა?",
    header: "წაშლა",
    acceptProps: { label: "წაშლა", severity: "danger" },
    rejectProps: { label: "გაუქმება", severity: "secondary" },
    accept: async () => {
      await deleteClub((form.value as Club).id);
      sheetVisible.value = false;
    },
  });
};

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
  <div class="relative pb-4">
    <LoadingSpinner v-if="loadingStore && clubs.length === 0" />

    <div v-else>
      <SearchInput v-model="search" placeholder="მოძებნე წრე, მასწავლებელი..." />

      <div class="mb-5 grid grid-cols-2 gap-3">
        <div class="rounded-2xl border border-blue-900/20 bg-[#0d1829] p-4">
          <p class="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">სულ წრე</p>
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
        <AppButton
          v-for="club in filtered"
          :key="club.id"
          variant="plain"
          class="w-full overflow-hidden rounded-2xl border border-l-4 border-blue-900/20 bg-[#0d1829] p-4 text-left transition-all duration-150 hover:border-blue-700/30 hover:bg-[#0f1f36]"
          :class="accentBorder(club.places_quantity)"
          @click="openEdit(club)"
        >
          <div class="mb-3 flex items-start justify-between gap-2">
            <h3 class="text-base font-bold leading-tight text-white">{{ club.name }}</h3>
            <span class="shrink-0 rounded-lg border px-2.5 py-1 text-xs font-bold" :class="placesBg(club.places_quantity)">
              {{ club.places_quantity <= 0 ? "სავსეა" : `${club.places_quantity} ადგილი` }}
            </span>
          </div>

          <div class="mb-3 flex flex-col gap-2">
            <InfoRow icon="pi-user"><span class="text-sm text-slate-400">{{ club.teacher || "—" }}</span></InfoRow>
            <InfoRow icon="pi-map-marker"><span class="text-sm text-slate-400">{{ club.place || "—" }}</span></InfoRow>
            <InfoRow icon="pi-clock"><span class="text-sm text-slate-400">{{ formatTime(club.time) }}</span></InfoRow>
          </div>

          <div class="flex items-center justify-end border-t border-blue-900/20 pt-2.5">
            <i class="pi pi-pencil text-xs text-slate-600" />
          </div>
        </AppButton>
      </div>
    </div>

    <AppButton variant="fab" icon="pi-plus" @click="openAdd" />

    <BottomSheet
      :visible="sheetVisible"
      :title="isAdding ? 'ახალი წრე' : 'წრის რედაქტირება'"
      @close="sheetVisible = false"
    >
      <div class="flex flex-col gap-4">
        <SheetField label="წრის სახელი">
          <input
            v-model="form.name"
            type="text"
            class="w-full rounded-xl border border-blue-900/30 bg-[#0d1829] px-4 py-3 text-sm text-slate-200 outline-none focus:border-blue-700/60"
          />
        </SheetField>

        <div class="grid grid-cols-2 gap-3">
          <SheetField label="მასწავლებელი">
            <input
              v-model="form.teacher"
              type="text"
              class="w-full rounded-xl border border-blue-900/30 bg-[#0d1829] px-4 py-3 text-sm text-slate-200 outline-none focus:border-blue-700/60"
            />
          </SheetField>
          <SheetField label="ადგილი">
            <input
              v-model="form.place"
              type="text"
              class="w-full rounded-xl border border-blue-900/30 bg-[#0d1829] px-4 py-3 text-sm text-slate-200 outline-none focus:border-blue-700/60"
            />
          </SheetField>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <SheetField label="ადგილების რ-ბა">
            <input
              v-model.number="form.places_quantity"
              type="number"
              min="0"
              class="w-full rounded-xl border border-blue-900/30 bg-[#0d1829] px-4 py-3 text-sm text-slate-200 outline-none focus:border-blue-700/60"
            />
          </SheetField>
          <SheetField label="დრო">
            <DatePicker
              v-model="(form as Club).time"
              time-only
              fluid
              input-id="clubTime"
              class="w-full"
              :pt="{ input: { class: 'rounded-xl border border-blue-900/30 bg-[#0d1829] px-4 py-3 text-sm text-slate-200 w-full outline-none' } }"
            />
          </SheetField>
        </div>

        <SheetField label="დამატებითი ინფო">
          <textarea
            v-model="form.additional_info"
            rows="3"
            class="w-full resize-none rounded-xl border border-blue-900/30 bg-[#0d1829] px-4 py-3 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-blue-700/60"
          />
        </SheetField>
      </div>

      <div class="mt-5 flex gap-3">
        <AppButton v-if="!isAdding" variant="danger" icon="pi-trash" @click="handleDelete">წაშლა</AppButton>
        <AppButton variant="primary" :disabled="loading" icon="pi-check" class="flex-1" @click="handleSave">
          {{ isAdding ? "დამატება" : "შენახვა" }}
        </AppButton>
      </div>
    </BottomSheet>
  </div>
</template>
