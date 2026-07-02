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

const { loading: loadingStore, clubs } = storeToRefs(useGlobalStore());
const { addClub, updateClub, deleteClub, loading } = useClubsCrud();
const confirm = useConfirm();

// ── sheet state ──────────────────────────────────────────
const sheetVisible = ref(false);
const isAdding = ref(false);

const blankClub = (): Omit<Club, "id"> => ({
  name: "",
  teacher: "",
  places_quantity: 0,
  place: "",
  time: new Date(),
  additional_info: "",
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
  if (isAdding.value) {
    await addClub(form.value as Omit<Club, "id">);
  } else {
    await updateClub(form.value as Club);
  }
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

// ── search + stats ───────────────────────────────────────
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

// ── helpers ──────────────────────────────────────────────
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
          <p class="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">სულ წრე</p>
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
        <button
          v-for="club in filtered"
          :key="club.id"
          class="w-full overflow-hidden rounded-2xl border border-l-4 border-blue-900/20 bg-[#0d1829] p-4 text-left transition-all duration-150 hover:border-blue-700/30 hover:bg-[#0f1f36]"
          :class="accentBorder(club.places_quantity)"
          @click="openEdit(club)"
        >
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
          <div class="mb-3 flex flex-col gap-2">
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
          </div>

          <div class="flex items-center justify-end border-t border-blue-900/20 pt-2.5">
            <i class="pi pi-pencil text-xs text-slate-600" />
          </div>
        </button>
      </div>
    </div>

    <!-- FAB -->
    <button
      @click="openAdd"
      class="fixed bottom-24 right-5 z-30 flex h-13 w-13 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-900/40 transition-all hover:bg-blue-500 hover:scale-105 active:scale-95 lg:bottom-8 lg:right-8"
    >
      <i class="pi pi-plus text-lg" />
    </button>

    <!-- Edit / Add sheet -->
    <Teleport to="body">
      <Transition name="backdrop">
        <div
          v-if="sheetVisible"
          class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
          @click="sheetVisible = false"
        />
      </Transition>

      <Transition name="sheet">
        <div
          v-if="sheetVisible"
          class="fixed bottom-0 left-0 right-0 z-50 max-h-[92vh] overflow-y-auto rounded-t-3xl border-t border-blue-900/40 bg-[#07101e] p-5"
          style="box-shadow: 0 -8px 40px 0 rgba(0,10,40,0.8)"
          @click.stop
        >
          <div class="mx-auto mb-4 h-1 w-10 rounded-full bg-blue-900/60" />

          <!-- Header -->
          <div class="mb-5 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span class="h-4 w-[3px] rounded-full bg-blue-500" />
              <span class="text-sm font-bold text-slate-200">
                {{ isAdding ? "ახალი წრე" : "წრის რედაქტირება" }}
              </span>
            </div>
            <button
              @click="sheetVisible = false"
              class="flex h-7 w-7 items-center justify-center rounded-full bg-blue-900/30 text-slate-400 hover:bg-blue-900/60 hover:text-white"
            >
              <i class="pi pi-times text-xs" />
            </button>
          </div>

          <!-- Form -->
          <div class="flex flex-col gap-4">
            <!-- Name -->
            <div>
              <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">წრის სახელი</label>
              <input
                v-model="form.name"
                type="text"
                class="w-full rounded-xl border border-blue-900/30 bg-[#0d1829] px-4 py-3 text-sm text-slate-200 outline-none focus:border-blue-700/60"
              />
            </div>

            <!-- Teacher + Place -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">მასწავლებელი</label>
                <input
                  v-model="form.teacher"
                  type="text"
                  class="w-full rounded-xl border border-blue-900/30 bg-[#0d1829] px-4 py-3 text-sm text-slate-200 outline-none focus:border-blue-700/60"
                />
              </div>
              <div>
                <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">ადგილი</label>
                <input
                  v-model="form.place"
                  type="text"
                  class="w-full rounded-xl border border-blue-900/30 bg-[#0d1829] px-4 py-3 text-sm text-slate-200 outline-none focus:border-blue-700/60"
                />
              </div>
            </div>

            <!-- Places + Time -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">ადგილების რ-ბა</label>
                <input
                  v-model.number="form.places_quantity"
                  type="number"
                  min="0"
                  class="w-full rounded-xl border border-blue-900/30 bg-[#0d1829] px-4 py-3 text-sm text-slate-200 outline-none focus:border-blue-700/60"
                />
              </div>
              <div>
                <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">დრო</label>
                <DatePicker
                  v-model="(form as Club).time"
                  timeOnly
                  fluid
                  inputId="clubTime"
                  class="w-full"
                  :pt="{
                    input: { class: 'rounded-xl border border-blue-900/30 bg-[#0d1829] px-4 py-3 text-sm text-slate-200 w-full outline-none' }
                  }"
                />
              </div>
            </div>

            <!-- Additional info -->
            <div>
              <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">დამატებითი ინფო</label>
              <textarea
                v-model="form.additional_info"
                rows="3"
                class="w-full resize-none rounded-xl border border-blue-900/30 bg-[#0d1829] px-4 py-3 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-blue-700/60"
              />
            </div>
          </div>

          <!-- Actions -->
          <div class="mt-5 flex gap-3">
            <button
              v-if="!isAdding"
              @click="handleDelete"
              class="flex items-center justify-center gap-2 rounded-xl border border-red-900/40 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-400 transition-all hover:bg-red-500/20"
            >
              <i class="pi pi-trash text-sm" />
              წაშლა
            </button>
            <button
              @click="handleSave"
              :disabled="loading"
              class="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition-all hover:bg-blue-500 disabled:opacity-50"
            >
              <i class="pi pi-check text-sm" />
              {{ isAdding ? "დამატება" : "შენახვა" }}
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
