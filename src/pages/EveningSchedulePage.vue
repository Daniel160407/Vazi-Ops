<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useGlobalStore } from "@/stores/GlobalStore";
import LoadingSpinner from "@/components/UI/LoadingSpinner.vue";

const { loading, eveningScheduleItems } = storeToRefs(useGlobalStore());
</script>

<template>
  <div class="pb-4">
    <LoadingSpinner v-if="loading && eveningScheduleItems.length === 0" />

    <div v-else>
      <div class="mb-5 rounded-2xl border border-blue-900/20 bg-[#0d1829] p-4">
        <p class="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
          საღამოს
        </p>
        <h1 class="text-2xl font-bold text-white">პროგრამა</h1>
      </div>

      <div class="mb-5 grid grid-cols-2 gap-3">
        <div class="rounded-2xl border border-blue-900/20 bg-[#0d1829] p-4">
          <p class="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
            ნომერების რაოდენობა
          </p>
          <p class="text-3xl font-bold text-white">{{ eveningScheduleItems.length }}</p>
        </div>
        <div class="rounded-2xl border border-blue-900/20 bg-[#0d1829] p-4">
          <p class="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
            მედია
          </p>
          <p class="text-3xl font-bold text-blue-400">
            {{ eveningScheduleItems.filter((i) => i.media_url).length }}
          </p>
        </div>
      </div>

      <div v-if="eveningScheduleItems.length === 0" class="py-16 text-center">
        <i class="pi pi-calendar-times mb-4 block text-4xl text-slate-700" />
        <p class="text-sm text-slate-600">პროგრამა ჯერ არ არის დამატებული</p>
      </div>

      <div v-else class="flex flex-col gap-3">
        <div
          v-for="(item, index) in eveningScheduleItems"
          :key="item.id || index"
          class="overflow-hidden rounded-2xl border border-l-4 border-blue-900/20 border-l-blue-500/40 bg-[#0d1829] p-4"
        >
          <div class="flex items-start gap-3">
            <div
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/15"
            >
              <span class="text-sm font-bold text-blue-400">{{ index + 1 }}</span>
            </div>

            <div class="min-w-0 flex-1">
              <h3 class="mb-2 font-bold leading-tight text-white">{{ item.scene_name }}</h3>

              <div class="flex flex-col gap-1.5">
                <div v-if="item.performer_full_name" class="flex items-center gap-2">
                  <div
                    class="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-blue-900/30"
                  >
                    <i class="pi pi-user text-[9px] text-blue-400" />
                  </div>
                  <span class="text-sm text-slate-400">{{ item.performer_full_name }}</span>
                </div>

                <div v-if="item.group_name" class="flex items-center gap-2">
                  <div
                    class="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-blue-900/30"
                  >
                    <i class="pi pi-users text-[9px] text-blue-400" />
                  </div>
                  <span class="text-sm text-slate-500">
                    {{ item.group_name
                    }}<span v-if="item.leader_full_name"> · {{ item.leader_full_name }}</span>
                  </span>
                </div>
              </div>
            </div>

            <a
              v-if="item.media_url"
              :href="item.media_url"
              target="_blank"
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-400 transition-colors hover:bg-blue-500/20"
            >
              <i class="pi pi-play text-xs" />
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
