<script setup lang="ts">
import { storeToRefs } from "pinia";
import { format } from "date-fns";
import { ka } from "date-fns/locale";
import { useGlobalStore } from "../stores/GlobalStore";
import LoadingSpinner from "../components/UI/LoadingSpinner.vue";

const { loading, goldenVerses } = storeToRefs(useGlobalStore());

const formatDate = (value?: any) => {
  if (!value) return "—";
  const date = value?.seconds !== undefined ? value.toDate() : new Date(value);
  return isNaN(date.getTime()) ? "—" : format(date, "d MMMM yyyy", { locale: ka });
};
</script>

<template>
  <div class="pb-4">
    <LoadingSpinner v-if="loading && goldenVerses.length === 0" />

    <div v-else>
      <div class="mb-5 rounded-2xl border border-blue-900/20 bg-[#0d1829] p-4">
        <p class="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
          ყოველდღიური
        </p>
        <h1 class="text-2xl font-bold text-white">ოქროს მუხლები</h1>
      </div>

      <div v-if="goldenVerses.length === 0" class="py-16 text-center">
        <i class="pi pi-book mb-4 block text-4xl text-slate-700" />
        <p class="text-sm text-slate-600">მუხლები ჯერ არ არის დამატებული</p>
      </div>

      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div
          v-for="verse in goldenVerses"
          :key="verse.id"
          class="overflow-hidden rounded-2xl border border-blue-900/20 bg-[#0d1829] p-4"
        >
          <div class="mb-3 flex items-center gap-2">
            <div
              class="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-yellow-500/15"
            >
              <i class="pi pi-calendar text-[9px] text-yellow-400" />
            </div>
            <span class="text-xs font-semibold text-yellow-400/80">
              {{ formatDate(verse.day) }}
            </span>
          </div>

          <p class="mb-3 text-sm italic leading-relaxed text-slate-300">
            "{{ verse.verse }}"
          </p>

          <div class="flex items-center gap-2 border-t border-blue-900/20 pt-3">
            <i class="pi pi-book text-[10px] text-slate-600" />
            <span class="text-xs font-semibold text-slate-500">{{ verse.reference }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
