<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useGlobalStore } from "../stores/GlobalStore";
import { Avatar, Button } from "primevue";
import { format } from "date-fns";
import { ka } from "date-fns/locale";
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
import { ref } from "vue";

const globalStore = useGlobalStore();
const { loading, announcements } = storeToRefs(globalStore);

const expandedIds = ref(new Set<string>());

const toggleReadMore = (id: string) => {
  if (expandedIds.value.has(id)) {
    expandedIds.value.delete(id);
  } else {
    expandedIds.value.add(id);
  }
};

const isExpanded = (id: string) => expandedIds.value.has(id);

const getTagStyles = (tag: string) => {
  const styles: Record<string, string> = {
    [TAG_URGENT]: "text-red-400 bg-red-400/10 border-red-400/20",
    [TAG_SCHEDULE]: "text-blue-400 bg-blue-400/10 border-blue-400/20",
    [TAG_DINING]: "text-amber-400 bg-amber-400/10 border-amber-400/20",
    [TAG_GATHERING]: "text-purple-400 bg-purple-400/10 border-purple-400/20",
    [TAG_ACTIVITY]: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
    [TAG_HEALTH]: "text-teal-400 bg-teal-400/10 border-teal-400/20",
    [TAG_NOTEWORTHY]: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
  };

  return styles[tag] ?? "text-slate-400 bg-slate-400/10 border-slate-400/20";
};

const formatDate = (value?: any) => {
  if (!value) return "-";
  const date =
    value.seconds !== undefined && typeof value.toDate === "function"
      ? value.toDate()
      : new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : format(date, "HH:mm, d MMMM yyyy", { locale: ka });
};
</script>

<template>
  <LoadingSpinner v-if="loading && announcements.length <= 0" />

  <div v-else class="max-w-3xl mx-auto py-8">
    <div class="mb-10">
      <h2 class="text-3xl font-bold mb-2 text-white">განცხადებები</h2>
      <p class="text-[#94A3B8]">
        იყავით საქმის კურსში უახლესი სიახლეებისა და განცხადებების შესახებ.
      </p>
    </div>

    <div class="space-y-6">
      <article
        v-for="announcement in announcements"
        :key="announcement.id"
        class="p-6 rounded-2xl bg-[#27272a] border border-white/5 transition-all duration-300"
      >
        <div class="flex justify-between items-center mb-3">
          <span
            :class="getTagStyles(announcement.tag)"
            class="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border"
          >
            {{ announcement.tag }}
          </span>
          <span class="text-[11px] text-slate-500 font-medium">
            {{ formatDate(announcement.date) }}
          </span>
        </div>

        <div class="mb-6">
          <h3 class="text-xl font-bold text-white mb-3">
            {{ announcement.title }}
          </h3>

          <p
            class="text-slate-400 leading-relaxed text-[15px] transition-all duration-500 overflow-hidden"
            :class="{ 'line-clamp-3': !isExpanded(announcement.id) }"
          >
            {{ announcement.content }}
          </p>

          <button
            v-if="announcement.content && announcement.content.length > 150"
            @click="toggleReadMore(announcement.id)"
            class="mt-3 text-sm font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors cursor-pointer"
          >
            {{
              isExpanded(announcement.id) ? "ნაკლების ჩვენება" : "სრულად ნახვა"
            }}
            <i
              class="pi"
              :class="
                isExpanded(announcement.id)
                  ? 'pi-chevron-up'
                  : 'pi-chevron-down'
              "
              style="font-size: 0.7rem"
            ></i>
          </button>
        </div>

        <div class="flex items-center gap-3 pt-5 border-t border-white/5">
          <Avatar
            shape="circle"
            :image="announcement.author_image_url"
            :label="
              !announcement.author_image_url
                ? announcement.author?.charAt(0)
                : undefined
            "
            :pt="{
              image: { referrerpolicy: 'no-referrer' },
            }"
            class="bg-indigo-600 text-white font-bold"
            size="normal"
          />
          <span class="text-sm font-semibold text-slate-200">
            {{ announcement.author }}
          </span>
        </div>
      </article>
    </div>
  </div>
</template>
