<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useGlobalStore } from "../stores/GlobalStore";
import { ref, watch, computed } from "vue";
import { EVENING_SCHEDULE_CATEGORY } from "../composables/constants";
import { Image, Button } from "primevue";
import { useImgBB } from "../composables/useImgBB";
import { useSchedulesCrud } from "../composables/useSchedulesCrud";
import type { Schedule } from "../type/interfaces";

const globalStore = useGlobalStore();
const { schedules } = storeToRefs(globalStore);

const { saveSchedule, loading: savingSchedule } = useSchedulesCrud();

const {
  handleImageSelect,
  uploadImageIfExists,
  imagePreview,
  uploadingImage,
  resetValues,
  selectedImage,
} = useImgBB();

const imageUrl = ref<string>("");
const fileInput = ref<HTMLInputElement | null>(null);

const targetSchedule = computed(() => {
  return schedules.value.find(
    (schedule) => schedule.name === EVENING_SCHEDULE_CATEGORY
  );
});

const triggerUpload = () => fileInput.value?.click();

const saveNewImage = async () => {
  const newUrl = await uploadImageIfExists();

  if (newUrl) {
    const scheduleData: Schedule = {
      id: targetSchedule.value?.id ?? "",
      name: EVENING_SCHEDULE_CATEGORY,
      image_url: newUrl,
    };

    imageUrl.value = newUrl;

    await saveSchedule(scheduleData);

    resetValues();
  }
};

watch(
  targetSchedule,
  (newSchedule) => {
    imageUrl.value = newSchedule?.image_url ?? "";
  },
  { immediate: true }
);
</script>

<template>
  <div class="flex flex-col items-center p-4 md:p-8">
    <h2 class="text-xl md:text-2xl font-bold text-white-800 mb-6 text-center">
      საღამოს განრიგი
    </h2>

    <input
      type="file"
      ref="fileInput"
      class="hidden"
      accept="image/*"
      @change="handleImageSelect"
    />

    <div class="w-full max-w-4xl flex flex-col items-center gap-4">
      <Image
        v-if="imagePreview || imageUrl"
        :src="imagePreview || imageUrl"
        :alt="EVENING_SCHEDULE_CATEGORY"
        preview
        imageClass="rounded-xl shadow-lg w-full h-auto"
        class="w-full"
      />

      <div class="flex gap-2">
        <Button
          :label="`განრიგის ${
            imageUrl || imagePreview ? 'შეცვლა' : 'დამატება'
          }`"
          icon="pi pi-upload"
          @click="triggerUpload"
          severity="secondary"
          :loading="uploadingImage"
        />

        <Button
          v-if="selectedImage"
          label="შენახვა"
          icon="pi pi-check"
          :loading="uploadingImage || savingSchedule"
          @click="saveNewImage"
          severity="success"
        />
      </div>
    </div>
  </div>
</template>
