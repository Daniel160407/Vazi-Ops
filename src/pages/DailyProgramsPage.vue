<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useGlobalStore } from "../stores/GlobalStore";
import LoadingSpinner from "../components/UI/LoadingSpinner.vue";

const { loading, dailyPrograms } = storeToRefs(useGlobalStore());
</script>

<template>
  <div class="pb-4">
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
          <div
            class="wrap-break-word whitespace-pre-wrap [word-break:normal] text-sm leading-relaxed text-slate-300"
            v-html="program.content"
          />
        </article>
      </div>
    </div>
  </div>
</template>
