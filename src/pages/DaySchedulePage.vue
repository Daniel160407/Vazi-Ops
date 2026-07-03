<script setup lang="ts">
import { ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useGlobalStore } from "../stores/GlobalStore";
import { DAY_SCHEDULE_CATEGORY } from "../composables/constants";
import LoadingSpinner from "../components/UI/LoadingSpinner.vue";

const { loading, schedules } = storeToRefs(useGlobalStore());
const imageUrl = ref("");
const downloading = ref(false);
const imgLoaded = ref(false);

watch(
  schedules,
  (val) => {
    const found = val.find((s) => s.name === DAY_SCHEDULE_CATEGORY);
    imageUrl.value = found?.image_url ?? "";
    imgLoaded.value = false;
  },
  { deep: true, immediate: true },
);

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
  } catch {
    /* silently fail */
  } finally {
    downloading.value = false;
  }
};
</script>

<template>
  <div class="pb-4">
    <LoadingSpinner v-if="loading && !imageUrl" />

    <div v-else>
      <!-- Header card -->
      <div class="mb-5 rounded-2xl border border-blue-900/20 bg-[#0d1829] p-4">
        <p class="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
          დღის
        </p>
        <h1 class="text-2xl font-bold text-white">განრიგი</h1>
      </div>

      <!-- No image yet -->
      <div v-if="!imageUrl" class="py-16 text-center">
        <i class="pi pi-calendar mb-4 block text-4xl text-slate-700" />
        <p class="text-sm text-slate-600">განრიგი ჯერ არ არის დამატებული</p>
      </div>

      <!-- Image card -->
      <div v-else class="overflow-hidden rounded-2xl border border-blue-900/20 bg-[#0d1829]">
        <!-- Image -->
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

        <!-- Download footer -->
        <div class="flex items-center justify-between border-t border-blue-900/20 px-4 py-3">
          <span class="text-xs text-slate-600">დღის განრიგი</span>
          <button
            :disabled="downloading"
            class="flex cursor-pointer items-center gap-2 rounded-xl border border-blue-900/30 bg-blue-500/10 px-4 py-2 text-xs font-semibold text-blue-400 transition-all hover:bg-blue-500/20 disabled:opacity-50"
            @click="downloadImage"
          >
            <i class="pi" :class="downloading ? 'pi-spin pi-spinner' : 'pi-download'" />
            ჩამოტვირთვა
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
