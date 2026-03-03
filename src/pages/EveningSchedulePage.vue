<script setup lang="ts">
import { storeToRefs } from "pinia";
import Image from "primevue/image";
import { useGlobalStore } from "../stores/GlobalStore";
import { ref, watch } from "vue";
import { EVENING_SCHEDULE_CATEGORY } from "../composables/constants";

const store = useGlobalStore();
const { schedules } = storeToRefs(store);
const imageUrl = ref<string>("");

watch(
  schedules,
  (newSchedules) => {
    const targetSchedule = newSchedules.find(
      (schedule) => schedule.name === EVENING_SCHEDULE_CATEGORY
    );
    imageUrl.value = targetSchedule?.image_url ?? "";
  },
  { deep: true, immediate: true }
);
</script>

<template>
  <div class="flex flex-col items-center p-4 md:p-8">
    <h2 class="text-xl md:text-2xl font-bold text-white-800 mb-6 text-center">
      დღის განრიგი
    </h2>

    <div v-if="imageUrl" class="w-full max-w-4xl flex justify-center">
      <Image
        :src="imageUrl"
        :alt="EVENING_SCHEDULE_CATEGORY"
        preview
        imageClass="rounded-xl shadow-lg w-full h-auto"
        class="w-full"
      />
    </div>
  </div>
</template>
