<script setup lang="ts">
import { ref, computed } from "vue";
import { storeToRefs } from "pinia";
import { GENDER_MALE, GENDER_FEMALE } from "../composables/constants";
import type { Group } from "../type/interfaces";
import { useGroupsCrud } from "../composables/useGroupsCrud";
import { useGlobalStore } from "../stores/GlobalStore";
import { useConfirm } from "primevue";
import LoadingSpinner from "../components/UI/LoadingSpinner.vue";
import BottomSheet from "../components/UI/BottomSheet.vue";
import SearchInput from "../components/UI/SearchInput.vue";
import SheetField from "../components/UI/SheetField.vue";
import AppButton from "../components/UI/AppButton.vue";

const { loading, groups, addGroup, updateGroup, deleteGroup } = useGroupsCrud();
const { appUsers } = storeToRefs(useGlobalStore());

const leaderOpen = ref(false);

const leaderSuggestions = computed(() => {
  const q = (form.value.leader ?? "").toLowerCase().trim();
  return appUsers.value.filter((u) => u.name.toLowerCase().includes(q));
});

const selectLeader = (name: string) => {
  form.value.leader = name;
  leaderOpen.value = false;
};
const confirm = useConfirm();

const sheetVisible = ref(false);
const isAdding = ref(false);

const blankGroup = (): Omit<Group, "id"> => ({
  name: "", leader: "", age: "", cottage_num: 0, gender: GENDER_MALE, children: [],
});

const form = ref<Group | Omit<Group, "id">>(blankGroup());
const childrenString = ref("");

const openAdd = () => {
  isAdding.value = true;
  form.value = blankGroup();
  childrenString.value = "";
  sheetVisible.value = true;
};

const openEdit = (group: Group) => {
  isAdding.value = false;
  form.value = { ...group };
  childrenString.value = group.children.join(", ");
  sheetVisible.value = true;
};

const parseChildren = () =>
  childrenString.value.split(",").map((s) => s.trim()).filter(Boolean);

const handleSave = async () => {
  form.value.children = parseChildren();
  if (isAdding.value) await addGroup(form.value as Omit<Group, "id">);
  else await updateGroup(form.value as Group);
  sheetVisible.value = false;
};

const handleDelete = () => {
  confirm.require({
    message: "დარწმუნებული ხარ, რომ ჯგუფის წაშლა გინდა?",
    header: "წაშლა",
    acceptProps: { label: "წაშლა", severity: "danger" },
    rejectProps: { label: "გაუქმება", severity: "secondary" },
    accept: async () => {
      await deleteGroup((form.value as Group).id);
      sheetVisible.value = false;
    },
  });
};

const expandedId = ref<string | null>(null);
const toggle = (id: string) => {
  expandedId.value = expandedId.value === id ? null : id;
};

const search = ref("");

const filtered = computed(() => {
  const q = search.value.toLowerCase().trim();
  if (!q) return groups.value;
  return groups.value.filter(
    (g) => g.name.toLowerCase().includes(q) || g.leader.toLowerCase().includes(q),
  );
});

const totalMembers = computed(() =>
  groups.value.reduce((acc, g) => acc + g.children.length, 0),
);
</script>

<template>
  <div class="relative pb-16">
    <LoadingSpinner v-if="loading && groups.length === 0" />

    <div v-else>
      <SearchInput v-model="search" placeholder="მოძებნე ჯგუფი ან ლიდერი..." />

      <div class="mb-5 grid grid-cols-2 gap-3">
        <div class="rounded-2xl border border-blue-900/20 bg-[#0d1829] p-4">
          <p class="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
            ჯგუფების რაოდენობა
          </p>
          <p class="text-3xl font-bold text-white">{{ groups.length }}</p>
        </div>
        <div class="rounded-2xl border border-blue-900/20 bg-[#0d1829] p-4">
          <p class="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
            ბავშვების რაოდენობა
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
            class="w-full p-4 text-left transition-all duration-150 hover:border-blue-700/40 hover:bg-[#0f1f36]"
            @click="openEdit(group)"
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
                  :class="group.gender === GENDER_MALE ? 'bg-blue-500/15 text-blue-400' : 'bg-rose-500/15 text-rose-400'"
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
              <div class="ml-auto flex items-end">
                <i class="pi pi-pencil text-xs text-slate-600" />
              </div>
            </div>
          </AppButton>

          <AppButton
            variant="plain"
            class="w-full border-t border-blue-900/20 px-4 py-2.5 text-left hover:bg-blue-500/5"
            @click="toggle(group.id)"
          >
            <div class="flex items-center gap-6">
              <div>
                <p class="text-[10px] font-bold uppercase tracking-wider text-slate-600">ბავშვები</p>
                <p class="text-sm font-semibold text-slate-300">{{ group.children.length }} ბავშვი</p>
              </div>
              <div class="ml-auto">
                <i
                  class="pi text-xs text-slate-600 transition-transform duration-200"
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

    <AppButton variant="fab" icon="pi-plus" @click="openAdd" />

    <BottomSheet
      :visible="sheetVisible"
      :title="isAdding ? 'ახალი ჯგუფი' : 'ჯგუფის რედაქტირება'"
      @close="sheetVisible = false"
    >
      <div class="flex flex-col gap-4">
        <SheetField label="ჯგუფის სახელი">
          <input
            v-model="form.name"
            type="text"
            class="w-full rounded-xl border border-blue-900/30 bg-[#0d1829] px-4 py-3 text-sm text-slate-200 outline-none focus:border-blue-700/60"
          />
        </SheetField>

        <div class="grid grid-cols-2 gap-3">
          <SheetField label="ლიდერი">
            <div class="relative">
              <input
                v-model="form.leader"
                type="text"
                autocomplete="off"
                class="w-full rounded-xl border border-blue-900/30 bg-[#0d1829] px-4 py-3 text-sm text-slate-200 outline-none focus:border-blue-700/60"
                @focus="leaderOpen = true"
                @blur="leaderOpen = false"
              />
              <Transition
                enter-active-class="transition-all duration-150 ease-out"
                enter-from-class="opacity-0 -translate-y-1"
                enter-to-class="opacity-100 translate-y-0"
                leave-active-class="transition-all duration-100 ease-in"
                leave-from-class="opacity-100 translate-y-0"
                leave-to-class="opacity-0 -translate-y-1"
              >
                <ul
                  v-if="leaderOpen && leaderSuggestions.length"
                  class="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-48 overflow-y-auto rounded-xl border border-blue-900/30 bg-[#07101e] py-1 shadow-xl"
                  style="box-shadow: 0 8px 32px 0 rgba(0,6,30,0.8)"
                  @mousedown.prevent
                >
                  <li
                    v-for="u in leaderSuggestions"
                    :key="u.id"
                    class="flex cursor-pointer items-center gap-3 px-3 py-2.5 transition-colors hover:bg-blue-900/20"
                    @click="selectLeader(u.name)"
                  >
                    <div class="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-900/40 text-xs font-bold text-blue-300">
                      <img v-if="u.avatar_url" :src="u.avatar_url" class="h-full w-full object-cover" />
                      <span v-else>{{ u.name.charAt(0).toUpperCase() }}</span>
                    </div>
                    <span class="text-sm text-slate-200">{{ u.name }}</span>
                  </li>
                </ul>
              </Transition>
            </div>
          </SheetField>
          <SheetField label="ასაკი">
            <input
              v-model="form.age"
              type="text"
              class="w-full rounded-xl border border-blue-900/30 bg-[#0d1829] px-4 py-3 text-sm text-slate-200 outline-none focus:border-blue-700/60"
            />
          </SheetField>
        </div>

        <SheetField label="კოტეჯის ნომერი">
          <input
            v-model.number="form.cottage_num"
            type="number"
            min="0"
            class="w-full rounded-xl border border-blue-900/30 bg-[#0d1829] px-4 py-3 text-sm text-slate-200 outline-none focus:border-blue-700/60"
          />
        </SheetField>

        <SheetField label="სქესი">
          <div class="flex gap-3">
            <AppButton
              variant="plain"
              class="flex-1 rounded-xl border py-2.5 text-sm font-semibold transition-all"
              :class="form.gender === GENDER_MALE ? 'border-blue-600 bg-blue-600/20 text-blue-400' : 'border-blue-900/30 bg-[#0d1829] text-slate-500'"
              @click="form.gender = GENDER_MALE"
            >
              ბიჭები
            </AppButton>
            <AppButton
              variant="plain"
              class="flex-1 rounded-xl border py-2.5 text-sm font-semibold transition-all"
              :class="form.gender === GENDER_FEMALE ? 'border-rose-600 bg-rose-600/20 text-rose-400' : 'border-blue-900/30 bg-[#0d1829] text-slate-500'"
              @click="form.gender = GENDER_FEMALE"
            >
              გოგოები
            </AppButton>
          </div>
        </SheetField>

        <SheetField label="ბავშვები">
          <textarea
            v-model="childrenString"
            rows="4"
            placeholder="გამოყავით მძიმით: ნიკა გელაშვილი, დათო..."
            class="w-full resize-none rounded-xl border border-blue-900/30 bg-[#0d1829] px-4 py-3 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-blue-700/60"
          />
        </SheetField>
      </div>

      <div class="mt-5 flex gap-3">
        <AppButton v-if="!isAdding" variant="danger" icon="pi-trash" @click="handleDelete">წაშლა</AppButton>
        <AppButton variant="primary" icon="pi-check" class="flex-1" @click="handleSave">
          {{ isAdding ? "დამატება" : "შენახვა" }}
        </AppButton>
      </div>
    </BottomSheet>
  </div>
</template>
