<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useGlobalStore } from "../stores/GlobalStore";
import { Card } from "primevue";
import { format } from "date-fns";
import { ka } from "date-fns/locale";
import LoadingSpinner from "../components/UI/LoadingSpinner.vue";

const { loading, goldenVerses } = storeToRefs(useGlobalStore());

const formatDate = (value?: any) => {
  if (!value) return "-";

  let date;
  if (value.seconds !== undefined && typeof value.toDate === "function") {
    date = value.toDate();
  } else {
    date = new Date(value);
  }

  if (Number.isNaN(date.getTime())) return value;
  return format(date, "d MMMM yyyy", { locale: ka });
};
</script>

<template>
  <LoadingSpinner v-if="loading && goldenVerses.length <= 0" />

  <div v-else>
    <h2 class="mb-4 text-3xl text-center font-bold">
      ოქროს მუხლები
    </h2>

    <div
      class="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      <div v-for="goldenVerse in goldenVerses" :key="goldenVerse.id">
        <Card class="bg-[#27272a]! border h-full relative group shadow-lg">
          <template #title>
            <div class="text-sm text-gray-400 mb-2">
              {{ formatDate(goldenVerse.day) }}
            </div>
          </template>

          <template #content>
            <p class="text-gray-100 italic">{{ goldenVerse.verse }}</p>

            <p class="mt-2 text-gray-400">{{ goldenVerse.reference }}</p>
          </template>
        </Card>
      </div>
    </div>
  </div>
</template>
