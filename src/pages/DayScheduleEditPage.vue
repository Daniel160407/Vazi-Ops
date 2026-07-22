<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { storeToRefs } from "pinia";
import { useGlobalStore } from "../stores/GlobalStore";
import { DAY_SCHEDULE_CATEGORY } from "../composables/constants";
import { useImgBB } from "../composables/useImgBB";
import AppButton from "../components/UI/AppButton.vue";
import LoadingSpinner from "../components/UI/LoadingSpinner.vue";
import { useSchedulesCrud } from "../composables/useSchedulesCrud";
import type { Schedule } from "../type/interfaces";

const { schedules, loading: loadingStore } = storeToRefs(useGlobalStore());
const { saveSchedule, loading: savingSchedule } = useSchedulesCrud();
const {
  handleImageSelect,
  uploadImageIfExists,
  imagePreview,
  uploadingImage,
  resetValues,
  selectedImage,
} = useImgBB();

const imageUrl = ref("");
const fileInput = ref<HTMLInputElement | null>(null);

const targetSchedule = computed(() =>
  schedules.value.find((s) => s.name === DAY_SCHEDULE_CATEGORY),
);

watch(targetSchedule, (val) => { imageUrl.value = val?.image_url ?? ""; }, { immediate: true });

const triggerUpload = () => fileInput.value?.click();

const saveNewImage = async () => {
  const newUrl = await uploadImageIfExists();
  if (!newUrl) return;

  const data: Schedule = {
    id: targetSchedule.value?.id ?? "",
    name: DAY_SCHEDULE_CATEGORY,
    image_url: newUrl,
  };
  imageUrl.value = newUrl;
  await saveSchedule(data);
  resetValues();
};

const isBusy = computed(() => uploadingImage.value || savingSchedule.value);
</script>

<template>
  <div class="pb-4">
    <LoadingSpinner v-if="loadingStore && schedules.length === 0" />

    <template v-else>
    <div class="mb-5 rounded-2xl border border-blue-900/20 bg-[#0d1829] p-4">
      <p class="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
        დღის
      </p>
      <h1 class="text-2xl font-bold text-white">განრიგი</h1>
    </div>

    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      class="hidden"
      @change="handleImageSelect"
    />

    <div class="overflow-hidden rounded-2xl border border-blue-900/20 bg-[#0d1829]">
      <div v-if="imagePreview || imageUrl" class="relative">
        <img
          :src="imagePreview || imageUrl"
          alt="დღის განრიგი"
          class="w-full object-cover"
        />
        <div
          v-if="imagePreview"
          class="absolute right-3 top-3 rounded-lg border border-amber-500/30 bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-400"
        >
          შეუნახავი ცვლილება
        </div>
      </div>

      <AppButton
        v-else
        variant="plain"
        class="flex w-full flex-col items-center justify-center gap-3 py-16 text-center transition-colors hover:bg-blue-500/5"
        @click="triggerUpload"
      >
        <div class="flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-900/30 bg-blue-900/20">
          <i class="pi pi-image text-2xl text-blue-400" />
        </div>
        <div>
          <p class="text-sm font-semibold text-slate-300">სურათის ატვირთვა</p>
          <p class="mt-0.5 text-xs text-slate-600">დააჭირე ასარჩევად</p>
        </div>
      </AppButton>

      <div class="flex items-center justify-between border-t border-blue-900/20 px-4 py-3">
        <AppButton
          variant="plain"
          :disabled="isBusy"
          class="flex items-center gap-2 rounded-xl border border-blue-900/30 bg-blue-900/20 px-4 py-2 text-xs font-semibold text-slate-400 transition-all hover:text-slate-200 disabled:opacity-50"
          @click="triggerUpload"
        >
          <i class="pi pi-upload" />
          {{ imageUrl || imagePreview ? "შეცვლა" : "ატვირთვა" }}
        </AppButton>

        <AppButton
          v-if="selectedImage"
          variant="plain"
          :disabled="isBusy"
          class="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-blue-500 disabled:opacity-50"
          @click="saveNewImage"
        >
          <i class="pi" :class="isBusy ? 'pi-spin pi-spinner' : 'pi-check'" />
          შენახვა
        </AppButton>
      </div>
    </div>
    </template>
  </div>
</template>
