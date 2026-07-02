<script setup lang="ts">
import { ref, computed } from "vue";
import { GENDER_MALE, GENDER_FEMALE } from "../composables/constants";
import type { Group } from "../type/interfaces";
import { useGroupsCrud } from "../composables/useGroupsCrud";
import { useConfirm } from "primevue";
import LoadingSpinner from "../components/UI/LoadingSpinner.vue";

const { loading, groups, addGroup, updateGroup, deleteGroup } = useGroupsCrud();
const confirm = useConfirm();

// ── dialog state ──────────────────────────────────────────
const dialogVisible = ref(false);
const isAdding = ref(false);

const blankGroup = (): Omit<Group, "id"> => ({
  name: "",
  leader: "",
  age: "",
  cottage_num: 0,
  gender: GENDER_MALE,
  children: [],
});

const form = ref<Group | Omit<Group, "id">>(blankGroup());
const childrenString = ref("");

const openAdd = () => {
  isAdding.value = true;
  form.value = blankGroup();
  childrenString.value = "";
  dialogVisible.value = true;
};

const openEdit = (group: Group) => {
  isAdding.value = false;
  form.value = { ...group };
  childrenString.value = group.children.join(", ");
  dialogVisible.value = true;
};

const parseChildren = () =>
  childrenString.value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

const handleSave = async () => {
  form.value.children = parseChildren();
  if (isAdding.value) {
    await addGroup(form.value as Omit<Group, "id">);
  } else {
    await updateGroup(form.value as Group);
  }
  dialogVisible.value = false;
};

const handleDelete = () => {
  confirm.require({
    message: "დარწმუნებული ხარ, რომ ჯგუფის წაშლა გინდა?",
    header: "წაშლა",
    acceptProps: { label: "წაშლა", severity: "danger" },
    rejectProps: { label: "გაუქმება", severity: "secondary" },
    accept: async () => {
      await deleteGroup((form.value as Group).id);
      dialogVisible.value = false;
    },
  });
};

// ── search + stats ─────────────────────────────────────────
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
</script>

<template>
  <div class="relative pb-4">
    <LoadingSpinner v-if="loading && groups.length === 0" />

    <div v-else>
      <!-- Search -->
      <div class="relative mb-4">
        <i class="pi pi-search absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm" />
        <input
          v-model="search"
          type="text"
          placeholder="მოძებნე ჯგუფი ან ლიდერი..."
          class="w-full rounded-2xl border border-blue-900/30 bg-[#0d1829] py-3 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-blue-700/60"
        />
      </div>

      <!-- Stats -->
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

      <!-- Section title -->
      <h2 class="mb-3 text-base font-bold text-slate-200">ჯგუფები</h2>

      <!-- Empty -->
      <p v-if="filtered.length === 0" class="py-10 text-center text-sm text-slate-600">
        ჯგუფი ვერ მოიძებნა
      </p>

      <!-- Group cards -->
      <div class="flex flex-col gap-3">
        <button
          v-for="group in filtered"
          :key="group.id"
          class="w-full rounded-2xl border border-blue-900/20 bg-[#0d1829] p-4 text-left transition-all duration-150 hover:border-blue-700/40 hover:bg-[#0f1f36]"
          @click="openEdit(group)"
        >
          <div class="flex items-start justify-between gap-2">
            <!-- Name + leader -->
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
            <!-- Gender badge + cottage -->
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

          <!-- Stats row -->
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
              <i class="pi pi-pencil text-xs text-slate-600" />
            </div>
          </div>
        </button>
      </div>
    </div>

    <!-- FAB -->
    <button
      @click="openAdd"
      class="fixed bottom-24 right-5 z-30 flex h-13 w-13 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-900/40 transition-all hover:bg-blue-500 hover:scale-105 active:scale-95 lg:bottom-8 lg:right-8"
    >
      <i class="pi pi-plus text-lg" />
    </button>

    <!-- Edit / Add dialog -->
    <Teleport to="body">
      <Transition name="backdrop">
        <div
          v-if="dialogVisible"
          class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
          @click="dialogVisible = false"
        />
      </Transition>

      <Transition name="sheet">
        <div
          v-if="dialogVisible"
          class="fixed bottom-0 left-0 right-0 z-50 max-h-[90vh] overflow-y-auto rounded-t-3xl border-t border-blue-900/40 bg-[#07101e] p-5"
          style="box-shadow: 0 -8px 40px 0 rgba(0,10,40,0.8)"
          @click.stop
        >
          <!-- handle -->
          <div class="mx-auto mb-4 h-1 w-10 rounded-full bg-blue-900/60" />

          <!-- header -->
          <div class="mb-5 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span class="h-4 w-[3px] rounded-full bg-blue-500" />
              <span class="text-sm font-bold text-slate-200">
                {{ isAdding ? "ახალი ჯგუფი" : "ჯგუფის რედაქტირება" }}
              </span>
            </div>
            <button
              @click="dialogVisible = false"
              class="flex h-7 w-7 items-center justify-center rounded-full bg-blue-900/30 text-slate-400 hover:bg-blue-900/60 hover:text-white"
            >
              <i class="pi pi-times text-xs" />
            </button>
          </div>

          <!-- Form fields -->
          <div class="flex flex-col gap-4">
            <!-- Name -->
            <div>
              <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                ჯგუფის სახელი
              </label>
              <input
                v-model="form.name"
                type="text"
                class="w-full rounded-xl border border-blue-900/30 bg-[#0d1829] px-4 py-3 text-sm text-slate-200 outline-none focus:border-blue-700/60"
              />
            </div>

            <!-- Leader + Age -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  ლიდერი
                </label>
                <input
                  v-model="form.leader"
                  type="text"
                  class="w-full rounded-xl border border-blue-900/30 bg-[#0d1829] px-4 py-3 text-sm text-slate-200 outline-none focus:border-blue-700/60"
                />
              </div>
              <div>
                <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  ასაკი
                </label>
                <input
                  v-model="form.age"
                  type="text"
                  class="w-full rounded-xl border border-blue-900/30 bg-[#0d1829] px-4 py-3 text-sm text-slate-200 outline-none focus:border-blue-700/60"
                />
              </div>
            </div>

            <!-- Cottage -->
            <div>
              <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                კოტეჯის ნომერი
              </label>
              <input
                v-model.number="form.cottage_num"
                type="number"
                min="0"
                class="w-full rounded-xl border border-blue-900/30 bg-[#0d1829] px-4 py-3 text-sm text-slate-200 outline-none focus:border-blue-700/60"
              />
            </div>

            <!-- Gender -->
            <div>
              <label class="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                სქესი
              </label>
              <div class="flex gap-3">
                <button
                  @click="form.gender = GENDER_MALE"
                  class="flex-1 rounded-xl border py-2.5 text-sm font-semibold transition-all"
                  :class="
                    form.gender === GENDER_MALE
                      ? 'border-blue-600 bg-blue-600/20 text-blue-400'
                      : 'border-blue-900/30 bg-[#0d1829] text-slate-500'
                  "
                >
                  ბიჭები
                </button>
                <button
                  @click="form.gender = GENDER_FEMALE"
                  class="flex-1 rounded-xl border py-2.5 text-sm font-semibold transition-all"
                  :class="
                    form.gender === GENDER_FEMALE
                      ? 'border-rose-600 bg-rose-600/20 text-rose-400'
                      : 'border-blue-900/30 bg-[#0d1829] text-slate-500'
                  "
                >
                  გოგოები
                </button>
              </div>
            </div>

            <!-- Children -->
            <div>
              <label class="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                ბავშვები
              </label>
              <textarea
                v-model="childrenString"
                rows="4"
                placeholder="გამოყავით მძიმით: ნიკა გელაშვილი, დათო..."
                class="w-full resize-none rounded-xl border border-blue-900/30 bg-[#0d1829] px-4 py-3 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-blue-700/60"
              />
            </div>
          </div>

          <!-- Actions -->
          <div class="mt-5 flex gap-3">
            <button
              v-if="!isAdding"
              @click="handleDelete"
              class="flex items-center justify-center gap-2 rounded-xl border border-rose-900/40 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-400 transition-all hover:bg-rose-500/20"
            >
              <i class="pi pi-trash text-sm" />
              წაშლა
            </button>
            <button
              @click="handleSave"
              class="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition-all hover:bg-blue-500"
            >
              <i class="pi pi-check text-sm" />
              {{ isAdding ? "დამატება" : "შენახვა" }}
            </button>
          </div>

          <div class="h-6" />
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.backdrop-enter-active { transition: opacity 0.25s ease; }
.backdrop-leave-active { transition: opacity 0.2s ease; }
.backdrop-enter-from,
.backdrop-leave-to { opacity: 0; }

.sheet-enter-active { transition: transform 0.35s cubic-bezier(0.32, 0.72, 0, 1); }
.sheet-leave-active { transition: transform 0.25s cubic-bezier(0.4, 0, 1, 1); }
.sheet-enter-from,
.sheet-leave-to { transform: translateY(100%); }
</style>
