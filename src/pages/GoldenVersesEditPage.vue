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
import BottomSheet from "../components/UI/BottomSheet.vue";
import SheetField from "../components/UI/SheetField.vue";

const { loading: loadingStore, goldenVerses } = storeToRefs(useGlobalStore());
const { loading, addGoldenVerse, updateGoldenVerse, deleteGoldenVerse } = useGoldenVersesCrud();
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
  if (isEditing.value && editId.value) await updateGoldenVerse(editId.value, form.value);
  else await addGoldenVerse(form.value);
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
        <p class="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">სულ მუხლი</p>
        <p class="text-3xl font-bold text-white">{{ goldenVerses.length }}</p>
      </div>

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
          <div class="mb-3 flex items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <div class="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-yellow-500/15">
                <i class="pi pi-calendar text-[9px] text-yellow-400" />
              </div>
              <span class="text-xs font-semibold text-yellow-400/80">{{ formatDate(verse.day) }}</span>
            </div>
            <div class="flex gap-1.5">
              <button
                class="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-blue-900/20 bg-blue-900/20 text-slate-500 hover:text-slate-300"
                @click="openEdit(verse)"
              >
                <i class="pi pi-pencil text-[10px]" />
              </button>
              <button
                class="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-red-900/20 bg-red-500/5 text-red-500/60 hover:bg-red-500/15 hover:text-red-400"
                @click="handleDelete(verse.id)"
              >
                <i class="pi pi-trash text-[10px]" />
              </button>
            </div>
          </div>

          <p class="mb-3 text-sm italic leading-relaxed text-slate-300">"{{ verse.verse }}"</p>

          <div class="flex items-center gap-2 border-t border-blue-900/20 pt-3">
            <i class="pi pi-book text-[10px] text-slate-600" />
            <span class="text-xs font-semibold text-slate-500">{{ verse.reference }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- FAB -->
    <button
      class="fixed bottom-24 right-5 z-30 flex h-13 w-13 cursor-pointer items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-900/40 transition-all hover:scale-105 hover:bg-blue-500 active:scale-95 lg:bottom-8 lg:right-8"
      @click="openAdd"
    >
      <i class="pi pi-plus text-lg" />
    </button>

    <BottomSheet
      :visible="sheetVisible"
      :title="isEditing ? 'მუხლის რედაქტირება' : 'ახალი მუხლი'"
      @close="sheetVisible = false"
    >
      <div class="flex flex-col gap-4">
        <SheetField label="თარიღი">
          <DatePicker
            v-model="form.day"
            date-format="dd/mm/yy"
            fluid
            :pt="{ input: { class: 'rounded-xl border border-blue-900/30 bg-[#0d1829] px-4 py-3 text-sm text-slate-200 w-full outline-none' } }"
          />
        </SheetField>

        <SheetField label="მუხლი" :required="true" :error="submitted && !form.verse ? 'მუხლი აუცილებელია' : ''">
          <textarea
            v-model="form.verse"
            rows="4"
            class="w-full resize-none rounded-xl border px-4 py-3 text-sm text-slate-200 outline-none transition-colors"
            :class="submitted && !form.verse ? 'border-red-500/60 bg-red-500/5' : 'border-blue-900/30 bg-[#0d1829] focus:border-blue-700/60'"
          />
        </SheetField>

        <SheetField label="ადგილი" :required="true" :error="submitted && !form.reference ? 'წყარო აუცილებელია' : ''">
          <input
            v-model="form.reference"
            type="text"
            placeholder="მაგ: იოანე 3:16"
            class="w-full rounded-xl border px-4 py-3 text-sm text-slate-200 outline-none transition-colors"
            :class="submitted && !form.reference ? 'border-red-500/60 bg-red-500/5' : 'border-blue-900/30 bg-[#0d1829] focus:border-blue-700/60'"
          />
        </SheetField>
      </div>

      <div class="mt-5 flex gap-3">
        <button
          v-if="isEditing"
          class="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-red-900/40 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-400 hover:bg-red-500/20"
          @click="handleDelete(editId!)"
        >
          <i class="pi pi-trash" />
          წაშლა
        </button>
        <button
          :disabled="loading"
          class="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
          @click="handleSave"
        >
          <i class="pi pi-check" />
          {{ isEditing ? "შენახვა" : "დამატება" }}
        </button>
      </div>
    </BottomSheet>
  </div>
</template>
