<script setup lang="ts">
import { ref } from "vue";
import { storeToRefs } from "pinia";
import { useGlobalStore } from "../stores/GlobalStore";
import {
  Card,
  Button,
  Dialog,
  InputText,
  Textarea,
  DatePicker,
  useConfirm,
  FloatLabel,
} from "primevue";
import { format } from "date-fns";
import { ka } from "date-fns/locale";
import { useGoldenVersesCrud } from "../composables/useGoldenVersesCrud";
import LoadingSpinner from "../components/UI/LoadingSpinner.vue";
import type { GoldenVerse } from "../type/interfaces";

const globalStore = useGlobalStore();
const { loading: loadingStore, goldenVerses } = storeToRefs(globalStore);
const { fetchGoldenVerses } = globalStore;

const { loading, addGoldenVerse, updateGoldenVerse, deleteGoldenVerse } =
  useGoldenVersesCrud();
const confirm = useConfirm();

const displayDialog = ref(false);
const isEditing = ref(false);
const editId = ref<string | null>(null);

const currentVerse = ref<Omit<GoldenVerse, "id">>({
  verse: "",
  day: new Date(),
  reference: "",
});

const formatDate = (value?: any) => {
  if (!value) return "-";
  const date =
    value.seconds !== undefined && typeof value.toDate === "function"
      ? value.toDate()
      : new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : format(date, "d MMMM yyyy", { locale: ka });
};

const openAdd = () => {
  isEditing.value = false;
  editId.value = null;
  currentVerse.value = { verse: "", day: new Date(), reference: "" };
  displayDialog.value = true;
};

const openEdit = (verse: GoldenVerse) => {
  isEditing.value = true;
  editId.value = verse.id;

  const date = (verse.day as any)?.seconds
    ? (verse.day as any).toDate()
    : new Date(verse.day);

  currentVerse.value = {
    verse: verse.verse,
    day: date,
    reference: verse.reference,
  };
  displayDialog.value = true;
};

const saveVerse = async () => {
  if (isEditing.value && editId.value) {
    await updateGoldenVerse(editId.value, currentVerse.value);
  } else {
    await addGoldenVerse(currentVerse.value);
  }

  await fetchGoldenVerses();
  displayDialog.value = false;
};

const confirmDelete = async (id: string) => {
  confirm.require({
    message: "დარწმუნებული ხარ, რომ მუხლის წაშლა გინდა?",
    header: "წაშლა",
    acceptProps: { label: "წაშლა", severity: "danger" },
    rejectProps: {
      label: "გამოსვლა",
      severity: "secondary",
      outlined: true,
    },
    accept: async () => {
      await deleteGoldenVerse(id);
      await fetchGoldenVerses();
    },
  });
};
</script>
<template>
  <LoadingSpinner v-if="loadingStore && goldenVerses.length <= 0" />

  <div v-else>
    <h2 class="text-3xl text-center font-bold mb-8">ოქროს მუხლების მართვა</h2>

    <Button
      icon="pi pi-plus"
      label="დამატება"
      class="p-button-warning mb-4"
      @click="openAdd"
    />

    <div
      class="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      <div v-for="goldenVerse in goldenVerses" :key="goldenVerse.id">
        <Card class="bg-[#27272a]! border h-full relative group">
          <template #title>
            <div class="text-sm text-gray-400 mb-2">
              {{ formatDate(goldenVerse.day) }}
            </div>
          </template>

          <template #content>
            <p class="text-gray-100 italic">{{ goldenVerse.verse }}</p>

            <p class="mt-2 text-gray-400">{{ goldenVerse.reference }}</p>
          </template>

          <template #footer>
            <div class="flex gap-2 justify-end mt-4">
              <Button
                icon="pi pi-pencil"
                severity="info"
                class="p-button-text p-button-sm"
                @click="openEdit(goldenVerse)"
                rounded
              />

              <Button
                icon="pi pi-trash"
                severity="danger"
                class="p-button-text p-button-sm"
                @click="confirmDelete(goldenVerse.id)"
                rounded
              />
            </div>
          </template>
        </Card>
      </div>
    </div>

    <Dialog
      v-model:visible="displayDialog"
      :header="isEditing ? 'რედაქტირება' : 'ახალი მუხლის დამატება'"
      :modal="true"
      class="w-full max-w-lg mx-4"
    >
      <div class="flex flex-col gap-4 mt-2">
        <FloatLabel variant="on">
          <label class="text-sm text-gray-400">თარიღი</label>

          <DatePicker v-model="currentVerse.day" dateFormat="dd/mm/yy" fluid />
        </FloatLabel>

        <FloatLabel variant="on">
          <label class="text-sm text-gray-400">მუხლი</label>

          <Textarea v-model="currentVerse.verse" rows="4" fluid autoResize />
        </FloatLabel>

        <FloatLabel variant="on">
          <label class="text-sm text-gray-400"
            >მითითება (მაგ: იოანე 3:16)</label
          >

          <InputText v-model="currentVerse.reference" fluid />
        </FloatLabel>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            label="გაუქმება"
            class="p-button-text"
            @click="displayDialog = false"
          />

          <Button
            label="შენახვა"
            class="p-button-warning"
            :loading="loading"
            :disabled="loading"
            @click="saveVerse"
          />
        </div>
      </template>
    </Dialog>
  </div>
</template>
