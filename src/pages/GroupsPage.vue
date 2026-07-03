<script setup lang="ts">
import { ref, computed } from "vue";
import { GENDER_MALE } from "../composables/constants";
import { useGroupsCrud } from "../composables/useGroupsCrud";
import LoadingSpinner from "../components/UI/LoadingSpinner.vue";
import SearchInput from "../components/UI/SearchInput.vue";
import AppButton from "../components/UI/AppButton.vue";

const { loading, groups } = useGroupsCrud();

const search = ref("");

const filtered = computed(() => {
  const q = search.value.toLowerCase().trim();
  if (!q) return groups.value;
  return groups.value.filter(
    (g) =>
      g.name.toLowerCase().includes(q) ||
      g.leader.toLowerCase().includes(q)
  );
});

const totalMembers = computed(() =>
  groups.value.reduce((acc, g) => acc + g.children.length, 0)
);

const expandedId = ref<string | null>(null);
const toggle = (id: string) => {
  expandedId.value = expandedId.value === id ? null : id;
};
</script>

<template>
  <div class="pb-4">
    <LoadingSpinner v-if="loading && groups.length === 0" />

    <div v-else>
      <SearchInput v-model="search" placeholder="მოძებნე ჯგუფი ან ლიდერი..." />

      <div class="mb-5 grid grid-cols-2 gap-3">
        <div class="rounded-2xl border border-blue-900/20 bg-[#0d1829] p-4">
          <p class="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
            აქტიური ჯგუფები
          </p>
          <p class="text-3xl font-bold text-white">{{ groups.length }}</p>
        </div>
        <div class="rounded-2xl border border-blue-900/20 bg-[#0d1829] p-4">
          <p class="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
            სულ წევრი
          </p>
          <p class="text-3xl font-bold text-blue-400">{{ totalMembers }}</p>
        </div>
      </div>

      <h2 class="mb-3 text-base font-bold text-slate-200">ჯგუფები</h2>

      <p v-if="filtered.length === 0" class="py-10 text-center text-sm text-slate-600">
        ჯგუფი ვერ მოიძებნა
      </p>

      <div class="flex flex-col gap-3">
        <div
          v-for="group in filtered"
          :key="group.id"
          class="overflow-hidden rounded-2xl border border-blue-900/20 bg-[#0d1829] transition-all duration-200"
        >
          <AppButton
            variant="plain"
            class="w-full p-4 text-left"
            @click="toggle(group.id)"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <span
                    class="h-2.5 w-2.5 shrink-0 rounded-full"
                    :class="group.gender === GENDER_MALE ? 'bg-blue-400' : 'bg-rose-400'"
                  />
                  <span class="truncate text-lg font-bold text-white">{{ group.name }}</span>
                </div>
                <p class="mt-0.5 pl-4.5 text-sm text-slate-400">
                  ლიდერი: {{ group.leader || "—" }}
                </p>
              </div>
              <div class="shrink-0 text-right">
                <span
                  class="inline-block rounded-md px-2 py-0.5 text-xs font-semibold"
                  :class="
                    group.gender === GENDER_MALE
                      ? 'bg-blue-500/15 text-blue-400'
                      : 'bg-rose-500/15 text-rose-400'
                  "
                >
                  {{ group.gender === GENDER_MALE ? "ბიჭები" : "გოგოები" }}
                </span>
                <p class="mt-1 text-xs text-slate-500">კოტეჯი {{ group.cottage_num }}</p>
              </div>
            </div>

            <div class="mt-3 flex gap-6 border-t border-blue-900/20 pt-3">
              <div>
                <p class="text-[10px] font-bold uppercase tracking-wider text-slate-600">ასაკი</p>
                <p class="text-sm font-semibold text-slate-300">{{ group.age || "—" }}</p>
              </div>
              <div>
                <p class="text-[10px] font-bold uppercase tracking-wider text-slate-600">წევრები</p>
                <p class="text-sm font-semibold text-slate-300">
                  {{ group.children.length }} აქტიური
                </p>
              </div>
              <div class="ml-auto flex items-end">
                <i
                  class="pi text-slate-600 text-xs transition-transform duration-200"
                  :class="expandedId === group.id ? 'pi-chevron-up' : 'pi-chevron-down'"
                />
              </div>
            </div>
          </AppButton>

          <Transition name="expand">
            <div
              v-if="expandedId === group.id && group.children.length > 0"
              class="border-t border-blue-900/20 px-4 pb-4 pt-3"
            >
              <p class="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                ბავშვები
              </p>
              <div class="flex flex-col gap-1.5">
                <div
                  v-for="(child, i) in group.children"
                  :key="i"
                  class="flex items-center gap-3 rounded-xl bg-[#0a1220] px-3 py-2"
                >
                  <span
                    class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                    :class="group.gender === GENDER_MALE ? 'bg-blue-500/20 text-blue-400' : 'bg-rose-500/20 text-rose-400'"
                  >
                    {{ i + 1 }}
                  </span>
                  <span class="text-sm text-slate-300">{{ child }}</span>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </div>
  </div>
</template>
