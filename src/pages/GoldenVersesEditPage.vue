<script setup lang="ts">
import { ref } from "vue";
import { storeToRefs } from "pinia";
import { format } from "date-fns";
import { ka } from "date-fns/locale";
import { useConfirm } from "primevue";
import DatePicker from "primevue/datepicker";
import { useGlobalStore } from "../stores/GlobalStore";
import { useGoldenVersesCrud } from "../composables/useGoldenVersesCrud";
import type { GoldenVerse } from "../type/interfaces";
import LoadingSpinner from "../components/UI/LoadingSpinner.vue";

const { loading: loadingStore, goldenVerses } = storeToRefs(useGlobalStore());
const { loading, addGoldenVerse, updateGoldenVerse, deleteGoldenVerse } =
  useGoldenVersesCrud();
const confirm = useConfirm();

// ── sheet state ───────────────────────────────────────────
const sheetVisible = ref(false);
const isEditing = ref(false);
const editId = ref<string | null>(null);
const submitted = ref(false);

const blankForm = () => ({ verse: "", reference: "", day: new Date() });
const form = ref(blankForm());

const openAdd = () => {
  isEditing.value = false;
  editId.value = null;
  form.value = blankForm();
  submitted.value = false;
  sheetVisible.value = true;
};

const openEdit = (v: GoldenVerse) => {
  isEditing.value = true;
  editId.value = v.id;
  const day = (v.day as any)?.seconds ? (v.day as any).toDate() : new Date(v.day);
  form.value = { verse: v.verse, reference: v.reference, day };
  submitted.value = false;
  sheetVisible.value = true;
};

const handleSave = async () => {
  submitted.value = true;
  if (!form.value.verse || !form.value.reference) return;

  if (isEditing.value && editId.value) {
    await updateGoldenVerse(editId.value, form.value);
  } else {
    await addGoldenVerse(form.value);
  }
  sheetVisible.value = false;
};

const handleDelete = (id: string) => {
  confirm.require({
    message: "დარწმუნებული ხარ, რომ მუხლის წაშლა გინდა?",
    header: "წაშლა",
    acceptProps: { label: "წაშლა", severity: "danger" },
    rejectProps: { label: "გაუქმება", severity: "secondary", outlined: true },
    accept: async () => {
      await deleteGoldenVerse(id);
      sheetVisible.value = false;
    },
  });
};

const formatDate = (value?: any) => {
  if (!value) return "—";
  const date = value?.seconds !== undefined ? value.toDate() : new Date(value);
  return isNaN(date.getTime()) ? "—" : format(date, "d MMMM yyyy", { locale: ka });
};
</script>

<template>
  <div class="relative pb-4">
    <LoadingSpinner v-if="loadingStore && goldenVerses.length === 0" />

    <div v-else>
      <!-- Stats -->
      <div class="mb-5 rounded-2xl border border-blue-900/20 bg-[#0d1829] p-4">
        <p class="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
          სულ მუხლი
        </p>
        <p class="text-3xl font-bold text-white">{{ goldenVerses.length }}</p>
      </div>

      <!-- Empty state -->
      <div v-if="goldenVerses.length === 0" class="py-16 text-center">
        <i class="pi pi-book mb-4 block text-4xl text-slate-700" />
        <p class="text-sm text-slate-600">მუხლები ჯერ არ არის დამატებული</p>
      </div>

      <!-- Verse cards grid -->
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div
          v-for="verse in goldenVerses"
          :key="verse.id"
          class="overflow-hidden rounded-2xl border border-l-4 border-blue-900/20 border-l-yellow-500/50 bg-[#0d1829] p-4"
        >
          <!-- Date + actions -->
          <div class="mb-3 flex items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <div class="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-yellow-500/15">
                <i class="pi pi-calendar text-[9px] text-yellow-400" />
              </div>
              <span class="text-xs font-semibold text-yellow-400/80">
                {{ formatDate(verse.day) }}
              </span>
            </div>
            <div class="flex gap-1.5">
              <button
                @click="openEdit(verse)"
                class="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-blue-900/20 bg-blue-900/20 text-slate-500 hover:text-slate-300"
              >
                <i class="pi pi-pencil text-[10px]" />
              </button>
              <button
                @click="handleDelete(verse.id)"
                class="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-red-900/20 bg-red-500/5 text-red-500/60 hover:bg-red-500/15 hover:text-red-400"
              >
                <i class="pi pi-trash text-[10px]" />
              </button>
            </div>
          </div>

          <!-- Verse text -->
          <p class="mb-3 text-sm italic leading-relaxed text-slate-300">
            "{{ verse.verse }}"
          </p>

          <!-- Reference -->
          <div class="flex items-center gap-2 border-t border-blue-900/20 pt-3">
            <i class="pi pi-book text-[10px] text-slate-600" />
            <span class="text-xs font-semibold text-slate-500">{{ verse.reference }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- FAB -->
    <button
      @click="openAdd"
      class="fixed bottom-24 right-5 z-30 flex h-13 w-13 cursor-pointer items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-900/40 transition-all hover:scale-105 hover:bg-blue-500 active:scale-95 lg:bottom-8 lg:right-8"
    >
      <i class="pi pi-plus text-lg" />
    </button>

    <!-- Sheet -->
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
              <span class="h-4 w-[3px] rounded-full bg-yellow-500" />
              <span class="text-sm font-bold text-slate-200">
                {{ isEditing ? "მუხლის რედაქტირება" : "ახალი მუხლი" }}
              </span>
            </div>
            <button
              @click="sheetVisible = false"
              class="flex h-7 w-7 items-center justify-center rounded-full bg-blue-900/30 text-slate-400 hover:bg-blue-900/60 hover:text-white"
            >
              <i class="pi pi-times text-xs" />
            </button>
          </div>

          <div class="flex flex-col gap-4">
            <!-- Date -->
            <div>
              <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                თარიღი
              </label>
              <DatePicker
                v-model="form.day"
                dateFormat="dd/mm/yy"
                fluid
                :pt="{
                  input: {
                    class:
                      'rounded-xl border border-blue-900/30 bg-[#0d1829] px-4 py-3 text-sm text-slate-200 w-full outline-none',
                  },
                }"
              />
            </div>

            <!-- Verse -->
            <div>
              <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                მუხლი <span class="text-red-500">*</span>
              </label>
              <textarea
                v-model="form.verse"
                rows="4"
                class="w-full resize-none rounded-xl border px-4 py-3 text-sm text-slate-200 outline-none transition-colors"
                :class="
                  submitted && !form.verse
                    ? 'border-red-500/60 bg-red-500/5'
                    : 'border-blue-900/30 bg-[#0d1829] focus:border-blue-700/60'
                "
              />
              <p v-if="submitted && !form.verse" class="mt-1 text-xs text-red-400">
                მუხლი აუცილებელია
              </p>
            </div>

            <!-- Reference -->
            <div>
              <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                ადგილი <span class="text-red-500">*</span>
              </label>
              <input
                v-model="form.reference"
                type="text"
                placeholder="მაგ: იოანე 3:16"
                class="w-full rounded-xl border px-4 py-3 text-sm text-slate-200 outline-none transition-colors"
                :class="
                  submitted && !form.reference
                    ? 'border-red-500/60 bg-red-500/5'
                    : 'border-blue-900/30 bg-[#0d1829] focus:border-blue-700/60'
                "
              />
              <p v-if="submitted && !form.reference" class="mt-1 text-xs text-red-400">
                წყარო აუცილებელია
              </p>
            </div>
          </div>

          <!-- Actions -->
          <div class="mt-5 flex gap-3">
            <button
              v-if="isEditing"
              @click="handleDelete(editId!)"
              class="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-red-900/40 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-400 hover:bg-red-500/20"
            >
              <i class="pi pi-trash" />
              წაშლა
            </button>
            <button
              @click="handleSave"
              :disabled="loading"
              class="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
            >
              <i class="pi pi-check" />
              {{ isEditing ? "შენახვა" : "დამატება" }}
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
