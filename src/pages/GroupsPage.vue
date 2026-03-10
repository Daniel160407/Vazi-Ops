<script setup lang="ts">
import { GENDER_MALE } from "../composables/constants";
import LoadingSpinner from "../components/UI/LoadingSpinner.vue";
import { useGroupsCrud } from "../composables/useGroupsCrud";
import { Card } from "primevue";

const { loading, groups } = useGroupsCrud();
</script>
<template>
  <div>
    <LoadingSpinner v-if="loading && groups.length <= 0" />

    <div
      v-else
      class="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 mt-5 gap-4"
    >
      <Card
        v-for="group in groups"
        :key="group.name"
        :style="{
          borderColor: group.gender === GENDER_MALE ? '#305CDE' : '#EE4B2B',
        }"
        class="border"
      >
        <template #title>
          <p
            class="text-center text-2xl font-bold"
            :style="{
              color: group.gender === GENDER_MALE ? '#305CDE' : '#EE4B2B',
            }"
          >
            {{ group.name ?? "ჯგუფის სახელი" }}
          </p>
        </template>
        <template #subtitle>
          <div>
            <div>
              <p>ლიდერი: {{ group.leader ?? "-" }}</p>
            </div>
            <div class="flex gap-3 mt-3">
              <div class="p-3 border rounded-xl flex-1">
                <p>ასაკი: {{ group.age ?? "-" }}</p>
              </div>
              <div class="p-3 border rounded-xl flex-1">
                <p>კოტეჯი: {{ group.cottage_num ?? "-" }}</p>
              </div>
            </div>
          </div>
        </template>
        <template #content>
          <div class="flex flex-col gap-3 mt-5">
            <h3>ბავშვები:</h3>
            <div
              v-for="(child, index) in group.children"
              :key="index"
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
                    class="font-bold text-m text-surface-900 dark:text-surface-0 truncate"
                  >
                    {{ child }}
                  </h3>
                </div>
              </div>
            </div>
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>
