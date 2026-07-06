<script setup lang="ts">
import { ref, computed } from "vue";
import { storeToRefs } from "pinia";
import { useConfirm } from "primevue";
import Editor from "primevue/editor";
import { useGlobalStore } from "../stores/GlobalStore";
import { useDailyProgramsCrud } from "../composables/useDailyProgramsCrud";
import type { DailyProgram } from "../type/interfaces";
import LoadingSpinner from "../components/UI/LoadingSpinner.vue";
import BottomSheet from "../components/UI/BottomSheet.vue";
import AppButton from "../components/UI/AppButton.vue";

const { loading: loadingStore, dailyPrograms } = storeToRefs(useGlobalStore());
const { loading: saving, addDailyProgram, updateDailyProgram, deleteDailyProgram } = useDailyProgramsCrud();
const confirm = useConfirm();

const loading = computed(() => saving.value || loadingStore.value);

const sheetVisible = ref(false);
const isEditing = ref(false);
const currentId = ref<string | null>(null);
const isSubmitting = ref(false);
const submitted = ref(false);
const content = ref("");

const openAdd = () => {
  isEditing.value = false;
  currentId.value = null;
  content.value = "";
  submitted.value = false;
  sheetVisible.value = true;
};

const openEdit = (program: DailyProgram) => {
  isEditing.value = true;
  currentId.value = program.id;
  content.value = program.content;
  submitted.value = false;
  sheetVisible.value = true;
};

const handleSave = async () => {
  submitted.value = true;
  if (!content.value || content.value === "<p><br></p>") return;
  isSubmitting.value = true;
  try {
    if (isEditing.value && currentId.value) {
      await updateDailyProgram(currentId.value, content.value);
    } else {
      await addDailyProgram(content.value);
    }
    sheetVisible.value = false;
  } finally {
    isSubmitting.value = false;
  }
};

const handleDelete = (id: string) => {
  confirm.require({
    message: "დარწმუნებული ხარ, რომ პროგრამის წაშლა გინდა?",
    header: "წაშლა",
    acceptProps: { label: "წაშლა", severity: "danger" },
    rejectProps: { label: "გაუქმება", severity: "secondary", outlined: true },
    accept: async () => {
      await deleteDailyProgram(id);
      sheetVisible.value = false;
    },
  });
};
</script>

<template>
  <div class="relative pb-4">
    <LoadingSpinner v-if="loading && dailyPrograms.length === 0" />

    <div v-else>
      <div class="mb-5 rounded-2xl border border-blue-900/20 bg-[#0d1829] p-4">
        <p class="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
          პროგრამების რაოდენობა
        </p>
        <p class="text-3xl font-bold text-white">{{ dailyPrograms.length }}</p>
      </div>

      <div v-if="dailyPrograms.length === 0" class="py-16 text-center">
        <i class="pi pi-list mb-4 block text-4xl text-slate-700" />
        <p class="text-sm text-slate-600">პროგრამები ჯერ არ არის</p>
      </div>

      <div class="flex flex-col gap-3">
        <article
          v-for="program in dailyPrograms"
          :key="program.id"
          class="overflow-hidden rounded-2xl border border-l-4 border-blue-900/20 border-l-blue-500/40 bg-[#0d1829] p-4"
        >
          <div class="mb-3 flex items-center justify-end gap-2">
            <AppButton variant="icon-edit" icon="pi-pencil" @click="openEdit(program)" />
            <AppButton variant="icon-delete" icon="pi-trash" @click="handleDelete(program.id)" />
          </div>
          <div
            class="daily-program-content text-sm leading-relaxed text-slate-300"
            v-html="program.content"
          />
        </article>
      </div>
    </div>

    <AppButton variant="fab" icon="pi-plus" @click="openAdd" />

    <BottomSheet
      :visible="sheetVisible"
      :title="isEditing ? 'პროგრამის რედაქტირება' : 'ახალი პროგრამა'"
      @close="sheetVisible = false"
    >
      <div class="flex flex-col gap-4">
        <div>
          <label class="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
            შინაარსი
          </label>
          <div
            class="overflow-hidden rounded-xl border"
            :class="submitted && (!content || content === '<p><br></p>') ? 'border-red-500/60' : 'border-blue-900/30'"
          >
            <Editor v-model="content" editor-style="min-height: 400px; background: #0d1829; color: #cbd5e1;" class="h-full" />
          </div>
          <p v-if="submitted && (!content || content === '<p><br></p>')" class="mt-1 text-xs text-red-400">
            შინაარსი აუცილებელია
          </p>
        </div>
      </div>

      <div class="mt-5 flex gap-3">
        <AppButton
          v-if="isEditing"
          variant="danger"
          icon="pi-trash"
          @click="handleDelete(currentId!)"
        >
          წაშლა
        </AppButton>
        <AppButton
          variant="primary"
          :disabled="isSubmitting"
          icon="pi-check"
          class="flex-1"
          @click="handleSave"
        >
          {{ isEditing ? "შენახვა" : "დამატება" }}
        </AppButton>
      </div>
    </BottomSheet>
  </div>
</template>
