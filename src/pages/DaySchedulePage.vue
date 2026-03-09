<script setup lang="ts">
import { storeToRefs } from "pinia";
import Image from "primevue/image";
import Button from "primevue/button";
import { useGlobalStore } from "../stores/GlobalStore";
import { ref, watch } from "vue";
import { DAY_SCHEDULE_CATEGORY } from "../composables/constants";
import LoadingSpinner from "../components/UI/LoadingSpinner.vue";

const store = useGlobalStore();
const { loading, schedules } = storeToRefs(store);
const imageUrl = ref<string>("");
const downloading = ref(false);

const downloadImage = async () => {
  if (!imageUrl.value) return;

  downloading.value = true;
  try {
    const response = await fetch(imageUrl.value);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `Vazi_Schedule_${new Date().toLocaleDateString()}.jpg`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Download failed", error);
  } finally {
    downloading.value = false;
  }
};

watch(
  schedules,
  (newSchedules) => {
    const targetSchedule = newSchedules.find(
      (schedule) => schedule.name === DAY_SCHEDULE_CATEGORY
    );
    imageUrl.value = targetSchedule?.image_url ?? "";
  },
  { deep: true, immediate: true }
);
</script>

<template>
  <div>
    <LoadingSpinner v-if="loading" />

    <div v-else class="flex flex-col items-center md:p-8">
      <h2 class="text-xl md:text-2xl font-bold text-white tracking-tight mb-4">
        დღის განრიგი
      </h2>

      <div
        v-if="imageUrl"
        class="w-full max-w-4xl flex flex-col items-center gap-4 mb-4"
      >
        <div class="relative group w-full">
          <Image
            :src="imageUrl"
            :alt="DAY_SCHEDULE_CATEGORY"
            preview
            imageClass="rounded-xl shadow-2xl w-full h-auto border border-surface-800"
            class="w-full"
          />
        </div>
      </div>
      <Button
        v-if="imageUrl"
        icon="pi pi-download"
        label="ჩამოტვირთვა"
        severity="secondary"
        size="small"
        :loading="downloading"
        @click="downloadImage"
        outlined
        class="border-surface-700!"
      />
    </div>
  </div>
</template>
