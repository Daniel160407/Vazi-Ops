<script setup lang="ts">
import { ref } from "vue";
import { storeToRefs } from "pinia";
import { format } from "date-fns";
import { ka } from "date-fns/locale";
import { useGlobalStore } from "../stores/GlobalStore";
import {
  TAG_ACTIVITY,
  TAG_DINING,
  TAG_GATHERING,
  TAG_HEALTH,
  TAG_NOTEWORTHY,
  TAG_SCHEDULE,
  TAG_URGENT,
} from "../composables/constants";
import LoadingSpinner from "../components/UI/LoadingSpinner.vue";
import AppButton from "../components/UI/AppButton.vue";

const { loading, announcements } = storeToRefs(useGlobalStore());

const expandedIds = ref(new Set<string>());
const toggle = (id: string) => {
  if (expandedIds.value.has(id)) expandedIds.value.delete(id);
  else expandedIds.value.add(id);
};
const isExpanded = (id: string) => expandedIds.value.has(id);

const tagMeta = (tag: string) => {
  const map: Record<string, { cls: string; icon: string }> = {
    [TAG_URGENT]: {
      cls: "bg-red-500/15 text-red-400 border-red-500/25",
      icon: "pi-exclamation-triangle",
    },
    [TAG_SCHEDULE]: {
      cls: "bg-blue-500/15 text-blue-400 border-blue-500/25",
      icon: "pi-calendar",
    },
    [TAG_DINING]: {
      cls: "bg-amber-500/15 text-amber-400 border-amber-500/25",
      icon: "pi-star",
    },
    [TAG_GATHERING]: {
      cls: "bg-purple-500/15 text-purple-400 border-purple-500/25",
      icon: "pi-users",
    },
    [TAG_ACTIVITY]: {
      cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
      icon: "pi-bolt",
    },
    [TAG_HEALTH]: {
      cls: "bg-teal-500/15 text-teal-400 border-teal-500/25",
      icon: "pi-heart",
    },
    [TAG_NOTEWORTHY]: {
      cls: "bg-cyan-500/15 text-cyan-400 border-cyan-500/25",
      icon: "pi-info-circle",
    },
  };
  return (
    map[tag] ?? {
      cls: "bg-slate-500/15 text-slate-400 border-slate-500/25",
      icon: "pi-tag",
    }
  );
};


const formatDate = (value?: any) => {
  if (!value) return "—";
  const date = value?.seconds !== undefined ? value.toDate() : new Date(value);
  return isNaN(date.getTime())
    ? "—"
    : format(date, "d MMMM, HH:mm", { locale: ka });
};
</script>

<template>
  <div class="pb-4">
    <LoadingSpinner v-if="loading && announcements.length === 0" />

    <div v-else>
      <div class="mb-5 rounded-2xl border border-blue-900/20 bg-[#0d1829] p-4">
        <p
          class="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-500"
        >
          განცხადებების რაოდენობა
        </p>
        <p class="text-3xl font-bold text-white">{{ announcements.length }}</p>
      </div>

      <div v-if="announcements.length === 0" class="py-16 text-center">
        <i class="pi pi-megaphone mb-4 block text-4xl text-slate-700" />
        <p class="text-sm text-slate-600">განცხადებები ჯერ არ არის</p>
      </div>

      <div class="flex flex-col gap-3">
        <article
          v-for="a in announcements"
          :key="a.id"
          class="overflow-hidden rounded-2xl border border-blue-900/20 bg-[#0d1829]"
        >
          <div class="p-4">
            <div class="mb-3 flex items-center justify-between gap-2">
              <span
                class="rounded-lg border px-2.5 py-1 flex items-center text-[10px] font-bold uppercase tracking-widest"
                :class="tagMeta(a.tag).cls"
              >
                <i :class="`pi ${tagMeta(a.tag).icon} mr-1 text-[9px]`" />
                <span>{{ a.tag }}</span>
              </span>
              <span class="text-[11px] text-slate-600">{{
                formatDate(a.date)
              }}</span>
            </div>

            <h3 class="mb-2 text-base font-bold leading-snug text-white">
              {{ a.title }}
            </h3>

            <p
              class="text-sm leading-relaxed text-slate-400 transition-all"
              :class="{ 'line-clamp-3': !isExpanded(a.id) }"
            >
              {{ a.content }}
            </p>
            <AppButton
              v-if="a.content && a.content.length > 150"
              variant="link"
              class="mt-2"
              @click="toggle(a.id)"
            >
              {{ isExpanded(a.id) ? "ნაკლები" : "სრულად" }}
              <i
                class="pi text-[9px]"
                :class="isExpanded(a.id) ? 'pi-chevron-up' : 'pi-chevron-down'"
              />
            </AppButton>

            <div
              class="mt-4 flex items-center gap-2.5 border-t border-blue-900/20 pt-3"
            >
              <div
                class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white overflow-hidden"
              >
                <img
                  v-if="a.author_image_url"
                  :src="a.author_image_url"
                  referrerpolicy="no-referrer"
                  class="h-full w-full object-cover"
                />
                <span v-else>{{ a.author?.charAt(0) }}</span>
              </div>
              <span class="text-sm font-semibold text-slate-300">{{
                a.author
              }}</span>
            </div>
          </div>
        </article>
      </div>
    </div>
  </div>
</template>
