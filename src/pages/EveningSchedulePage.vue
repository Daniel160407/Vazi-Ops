<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useGlobalStore } from "../stores/GlobalStore";
import LoadingSpinner from "../components/UI/LoadingSpinner.vue";

const globalStore = useGlobalStore();
const { loading, eveningScheduleItems } = storeToRefs(globalStore);
</script>

<template>
  <div class="max-w-3xl mx-auto pb-20">
    <LoadingSpinner v-if="loading" />

    <div v-else>
      <div class="flex flex-col items-center mb-8">
        <h2
          class="text-2xl md:text-3xl font-bold text-primary mb-2 text-center"
        >
          საღამოს პროგრამა
        </h2>
        <p class="text-surface-500 text-sm">იხილეთ მიმდინარე განრიგი</p>
      </div>

      <div class="flex flex-col gap-4">
        <div
          v-for="(item, index) in eveningScheduleItems"
          :key="item.id || index"
          class="flex items-center gap-4 p-4 bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl shadow-sm hover:shadow-md transition-shadow"
        >
          <div
            class="flex-none w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20"
          >
            <span class="font-bold text-primary">{{ index + 1 }}</span>
          </div>

          <div class="flex-1 min-w-0">
            <div class="flex flex-wrap items-baseline gap-x-2">
              <h3
                class="font-bold text-lg text-surface-900 dark:text-surface-0 truncate"
              >
                {{ item.scene_name }}
              </h3>
              <span
                v-if="item.performer_full_name"
                class="text-surface-500 text-sm italic"
              >
                — {{ item.performer_full_name }}
              </span>
            </div>

            <div
              v-if="item.group_name"
              class="flex items-center gap-2 mt-1 text-sm text-surface-600"
            >
              <i class="pi pi-users text-xs"></i>
              <span>{{ item.group_name }}</span>
              <span v-if="item.leader_full_name" class="opacity-70">
                ({{ item.leader_full_name }})
              </span>
            </div>
          </div>

          <div v-if="item.media_url" class="flex-none">
            <a
              :href="item.media_url"
              target="_blank"
              class="flex items-center justify-center w-10 h-10 rounded-full hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
            >
              <i class="pi pi-play-circle text-2xl text-blue-500"></i>
            </a>
          </div>
        </div>

        <div
          v-if="eveningScheduleItems.length === 0 && !loading"
          class="text-center py-12 text-surface-400"
        >
          <i class="pi pi-calendar-times text-4xl mb-4"></i>
          <p>პროგრამა ჯერ არ არის დამატებული</p>
        </div>
      </div>
    </div>
  </div>
</template>
