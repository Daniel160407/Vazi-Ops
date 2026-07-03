<script setup lang="ts">
import { ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useGlobalStore } from "../stores/GlobalStore";
import { DAY_SCHEDULE_CATEGORY } from "../composables/constants";
import LoadingSpinner from "../components/UI/LoadingSpinner.vue";
import AppButton from "../components/UI/AppButton.vue";

const { loading, schedules } = storeToRefs(useGlobalStore());
const imageUrl = ref("");
const downloading = ref(false);
const imgLoaded = ref(false);


const downloadImage = async () => {
  if (!imageUrl.value) return;
  downloading.value = true;
  try {
    const res = await fetch(imageUrl.value);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Vazi_Schedule_${new Date().toLocaleDateString()}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } finally {
    downloading.value = false;
  }
};


watch(
  schedules,
  (val) => {
    const found = val.find((s) => s.name === DAY_SCHEDULE_CATEGORY);
    imageUrl.value = found?.image_url ?? "";
    imgLoaded.value = false;
  },
  { deep: true, immediate: true },
);
</script>

<template>
  <div class="pb-4">
    <LoadingSpinner v-if="loading && !imageUrl" />

    <div v-else>
      <div class="mb-5 rounded-2xl border border-blue-900/20 bg-[#0d1829] p-4">
        <p class="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
          დღის
        </p>
        <h1 class="text-2xl font-bold text-white">განრიგი</h1>
      </div>

      <div v-if="!imageUrl" class="py-16 text-center">
        <i class="pi pi-calendar mb-4 block text-4xl text-slate-700" />
        <p class="text-sm text-slate-600">განრიგი ჯერ არ არის დამატებული</p>
      </div>

      <div v-else class="overflow-hidden rounded-2xl border border-blue-900/20 bg-[#0d1829]">
        <div class="relative">
          <img
            :src="imageUrl"
            alt="დღის განრიგი"
            class="w-full object-cover"
            :class="imgLoaded ? 'opacity-100' : 'opacity-0'"
            style="transition: opacity 0.3s"
            @load="imgLoaded = true"
          />
          <div
            v-if="!imgLoaded"
            class="flex h-48 items-center justify-center"
          >
            <i class="pi pi-spin pi-spinner text-2xl text-slate-600" />
          </div>
        </div>

        <div class="flex items-center justify-between border-t border-blue-900/20 px-4 py-3">
          <span class="text-xs text-slate-600">დღის განრიგი</span>
          <AppButton variant="secondary" :disabled="downloading" @click="downloadImage">
            <i class="pi" :class="downloading ? 'pi-spin pi-spinner' : 'pi-download'" />
            ჩამოტვირთვა
          </AppButton>
        </div>
      </div>
    </div>
  </div>
</template>
