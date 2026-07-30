<script setup lang="ts">
import { ref, computed } from "vue";
import { storeToRefs } from "pinia";
import { format } from "date-fns";
import { useAppConfirm } from "../composables/useAppConfirm";
import DatePicker from "primevue/datepicker";
import { useGlobalStore } from "../stores/GlobalStore";
import { useClubsCrud } from "../composables/useClubsCrud";
import type { Club, ClubSlot } from "../type/interfaces";
import LoadingSpinner from "../components/UI/LoadingSpinner.vue";
import SearchInput from "../components/UI/SearchInput.vue";
import InfoRow from "../components/UI/InfoRow.vue";
import BottomSheet from "../components/UI/BottomSheet.vue";
import SheetField from "../components/UI/SheetField.vue";
import AppButton from "../components/UI/AppButton.vue";
import AppInput from "../components/UI/AppInput.vue";

const { loading: loadingStore, clubs, clubRegistration } = storeToRefs(useGlobalStore());
const { addClub, updateClub, deleteClub, deleteAllClubs, toggleRegistration, loading } = useClubsCrud();
const confirm = useAppConfirm();

const sheetVisible = ref(false);
const isAdding = ref(false);

const newSlot = (): ClubSlot => ({
  id: crypto.randomUUID(),
  time: new Date(),
  places_quantity: 0,
});

const blankClub = (): Omit<Club, "id"> => ({
  name: "", teacher: "", place: "", additional_info: "", slots: [newSlot()],
});

const form = ref<Club | Omit<Club, "id">>(blankClub());

const addSlot = () => form.value.slots.push(newSlot());

const removeSlot = (id: string) => {
  if (form.value.slots.length <= 1) return;
  form.value.slots = form.value.slots.filter((s) => s.id !== id);
};

const openAdd = () => {
  isAdding.value = true;
  form.value = blankClub();
  sheetVisible.value = true;
};

const openEdit = (club: Club) => {
  isAdding.value = false;
  const slots = (club.slots ?? []).map((s) => ({
    id: s.id || crypto.randomUUID(),
    time: s.time ? new Date(s.time) : new Date(),
    places_quantity: s.places_quantity ?? 0,
  }));
  form.value = {
    ...club,
    slots: slots.length ? slots : [newSlot()],
  };
  sheetVisible.value = true;
};

const handleSave = async () => {
  if (isAdding.value) await addClub(form.value as Omit<Club, "id">);
  else await updateClub(form.value as Club);
  sheetVisible.value = false;
};

const handleDelete = (id: string) => {
  confirm.require({
    message: "დარწმუნებული ხარ, რომ წრის წაშლა გინდა?",
    header: "წაშლა",
    acceptLabel: "წაშლა",
    rejectLabel: "გაუქმება",
    accept: async () => {
      await deleteClub(id);
      sheetVisible.value = false;
    },
  });
};

const handleDeleteAll = () => {
  confirm.require({
    message: "დარწმუნებული ხარ, რომ გინდა ყველა წრის წაშლა?",
    header: "ყველას წაშლა",
    acceptLabel: "წაშლა",
    rejectLabel: "გაუქმება",
    accept: async () => {
      await deleteAllClubs();
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

const slotPlaces = (club: Club) =>
  (club.slots ?? []).reduce((acc, s) => acc + (s.places_quantity ?? 0), 0);

const totalPlaces = computed(() =>
  clubs.value.reduce((acc, c) => acc + slotPlaces(c), 0),
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

</script>

<template>
  <div class="relative pb-4">
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

      <AppButton
        variant="plain"
        :disabled="loading"
        class="mb-5 flex w-full items-center justify-center gap-2 rounded-2xl border py-3 text-sm font-semibold transition-all duration-150"
        :class="clubRegistration?.open
          ? 'border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20'
          : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'"
        @click="toggleRegistration(clubRegistration)"
      >
        <i class="pi text-sm" :class="clubRegistration?.open ? 'pi-lock' : 'pi-lock-open'" />
        {{ clubRegistration?.open ? "რეგისტრაციის დახურვა" : "რეგისტრაციის გახსნა" }}
      </AppButton>

      <div class="mb-3 flex items-center justify-between gap-3">
        <h2 class="text-base font-bold text-slate-200">წრეები</h2>
        <AppButton v-if="clubs.length" variant="danger" :disabled="loading" icon="pi-trash" @click="handleDeleteAll">
          ყველას წაშლა
        </AppButton>
      </div>

      <p v-if="filtered.length === 0" class="py-10 text-center text-sm text-slate-600">
        წრე ვერ მოიძებნა
      </p>

      <div class="flex flex-col gap-3">
        <div
          v-for="club in filtered"
          :key="club.id"
          class="overflow-hidden rounded-2xl border border-blue-900/20 bg-[#0d1829]"
        >
          <AppButton
            variant="plain"
            class="w-full p-4 text-left transition-all duration-150 hover:border-blue-700/30 hover:bg-[#0f1f36]"
            @click="openEdit(club)"
          >
            <div class="mb-3 flex items-start justify-between gap-2">
              <h3 class="text-base font-bold leading-tight text-white">{{ club.name }}</h3>
              <span class="shrink-0 rounded-lg border px-2.5 py-1 text-xs font-bold" :class="placesBg(slotPlaces(club))">
                {{ slotPlaces(club) <= 0 ? "სავსეა" : `${slotPlaces(club)} ადგილი` }}
              </span>
            </div>

            <div class="flex flex-col gap-2">
              <InfoRow icon="pi-user"><span class="text-sm text-slate-400">{{ club.teacher || "—" }}</span></InfoRow>
              <InfoRow icon="pi-map-marker"><span class="text-sm text-slate-400">{{ club.place || "—" }}</span></InfoRow>
            </div>

            <div class="mt-4 flex flex-wrap gap-1.5">
              <span
                v-for="slot in club.slots"
                :key="slot.id"
                class="flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold"
                :class="placesBg(slot.places_quantity)"
              >
                <i class="pi pi-clock text-[10px]" />
                {{ formatTime(slot.time) }}
              </span>
            </div>
          </AppButton>

          <div class="flex items-center justify-end gap-1 border-t border-blue-900/20 px-4 py-2.5">
            <AppButton variant="icon-edit" icon="pi-pencil" @click="openEdit(club)" />
            <AppButton variant="icon-delete" icon="pi-trash" @click="handleDelete(club.id)" />
          </div>
        </div>
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
          <AppInput v-model="form.name" />
        </SheetField>

        <div class="grid grid-cols-2 gap-3">
          <SheetField label="მასწავლებელი">
            <AppInput v-model="form.teacher" />
          </SheetField>
          <SheetField label="ჩატარების ადგილი">
            <AppInput v-model="form.place" />
          </SheetField>
        </div>

        <SheetField label="დროები და ადგილები">
          <div class="flex flex-col gap-2.5">
            <div
              v-for="slot in form.slots"
              :key="slot.id"
              class="flex items-end gap-2 rounded-xl border border-blue-900/20 bg-[#0a1424] p-2.5"
            >
              <div class="flex-1">
                <p class="mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500">დრო</p>
                <DatePicker
                  v-model="slot.time"
                  time-only
                  fluid
                  :input-id="`clubTime-${slot.id}`"
                  class="w-full"
                  :pt="{ input: { class: 'rounded-xl border border-blue-900/30 bg-[#0d1829] px-3 py-2.5 text-sm text-slate-200 w-full outline-none' } }"
                />
              </div>
              <div class="w-24">
                <p class="mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500">ადგილები</p>
                <AppInput v-model="slot.places_quantity" type="number" min="0" />
              </div>
              <AppButton
                variant="icon-delete"
                icon="pi-trash"
                :disabled="form.slots.length <= 1"
                class="mb-1.5"
                @click="removeSlot(slot.id)"
              />
            </div>

            <AppButton
              variant="plain"
              class="flex items-center justify-center gap-2 rounded-xl border border-blue-900/30 bg-[#0d1829] py-2.5 text-sm font-semibold text-blue-400 transition-all hover:bg-blue-900/20"
              @click="addSlot"
            >
              <i class="pi pi-plus text-xs" />
              დროის დამატება
            </AppButton>
          </div>
        </SheetField>

        <SheetField label="დამატებითი ინფორმაცია">
          <textarea
            v-model="form.additional_info"
            rows="3"
            class="w-full resize-none rounded-xl border border-blue-900/30 bg-[#0d1829] px-4 py-3 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-blue-700/60"
          />
        </SheetField>
      </div>

      <div class="mt-5 flex gap-3">
        <AppButton v-if="!isAdding" variant="danger" icon="pi-trash" @click="handleDelete((form as Club).id)">წაშლა</AppButton>
        <AppButton variant="primary" :disabled="loading" icon="pi-check" class="flex-1" @click="handleSave">
          {{ isAdding ? "დამატება" : "შენახვა" }}
        </AppButton>
      </div>
    </BottomSheet>
  </div>
</template>
