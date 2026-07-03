<script setup lang="ts">
import { ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useGlobalStore } from "../stores/GlobalStore";
import { useSchedulesCrud } from "../composables/useSchedulesCrud";
import { useConfirm } from "primevue";
import type { EveningScheduleItem } from "../type/interfaces";
import LoadingSpinner from "../components/UI/LoadingSpinner.vue";
import BottomSheet from "../components/UI/BottomSheet.vue";
import SheetField from "../components/UI/SheetField.vue";

const { loading: loadingStore, eveningScheduleItems } = storeToRefs(useGlobalStore());
const { updateScheduleOrder, addEveningSchedule, updateEveningSchedule, deleteEveningSchedule, loading } = useSchedulesCrud();
const confirm = useConfirm();

// ── local reorderable list ────────────────────────────────
const localItems = ref<EveningScheduleItem[]>([]);

watch(eveningScheduleItems, (val) => {
  localItems.value = [...val];
}, { immediate: true });

const saveOrder = async () => {
  await updateScheduleOrder(localItems.value);
};

// ── drag-and-drop reorder ─────────────────────────────────
const dragIndex = ref<number | null>(null);

const onDragStart = (index: number) => {
  dragIndex.value = index;
};

const onDragOver = (e: DragEvent, index: number) => {
  e.preventDefault();
  if (dragIndex.value === null || dragIndex.value === index) return;
  const items = [...localItems.value];
  const dragged = items.splice(dragIndex.value, 1)[0];
  if (!dragged) return;
  items.splice(index, 0, dragged);
  localItems.value = items;
  dragIndex.value = index;
};

const onDragEnd = () => {
  dragIndex.value = null;
};

// ── sheet state ───────────────────────────────────────────
const sheetVisible = ref(false);
const isEditing = ref(false);
const editingId = ref<string | null>(null);
const mode = ref<"general" | "child">("general");
const submitted = ref(false);

const blankForm = () => ({
  performer_full_name: "", leader_full_name: "", group_name: "",
  scene_name: "", media_url: "", additional_info: "",
});

const form = ref(blankForm());

const openAdd = () => {
  isEditing.value = false;
  editingId.value = null;
  mode.value = "general";
  form.value = blankForm();
  submitted.value = false;
  sheetVisible.value = true;
};

const openEdit = (item: EveningScheduleItem) => {
  isEditing.value = true;
  editingId.value = item.id ?? null;
  mode.value = item.performer_full_name ? "child" : "general";
  form.value = {
    performer_full_name: item.performer_full_name ?? "",
    leader_full_name: item.leader_full_name ?? "",
    group_name: item.group_name ?? "",
    scene_name: item.scene_name ?? "",
    media_url: item.media_url ?? "",
    additional_info: "",
  };
  submitted.value = false;
  sheetVisible.value = true;
};

const handleSave = async () => {
  submitted.value = true;
  const isChild = mode.value === "child";
  const valid = isChild
    ? !!form.value.scene_name && !!form.value.performer_full_name && !!form.value.leader_full_name && !!form.value.group_name
    : !!form.value.scene_name;
  if (!valid) return;

  const data = {
    ...form.value,
    ...(isChild ? {} : { performer_full_name: "", leader_full_name: "", group_name: "" }),
  };

  if (isEditing.value && editingId.value) {
    await updateEveningSchedule(editingId.value, data);
  } else {
    await addEveningSchedule({ ...data, position: eveningScheduleItems.value.length + 1, created_at: new Date() });
  }

  sheetVisible.value = false;
};

const handleDelete = (id: string) => {
  confirm.require({
    message: "დარწმუნებული ხარ, რომ ნომრის წაშლა გინდა?",
    header: "წაშლა",
    acceptProps: { label: "წაშლა", severity: "danger" },
    rejectProps: { label: "გაუქმება", severity: "secondary", outlined: true },
    accept: async () => {
      await deleteEveningSchedule(id);
      sheetVisible.value = false;
    },
  });
};
</script>

<template>
  <div class="relative pb-4">
    <LoadingSpinner v-if="loadingStore && eveningScheduleItems.length === 0" />

    <div v-else>
      <!-- Stats + save row -->
      <div class="mb-5 flex gap-3">
        <div class="flex-1 rounded-2xl border border-blue-900/20 bg-[#0d1829] p-4">
          <p class="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">სულ ნომერი</p>
          <p class="text-3xl font-bold text-white">{{ eveningScheduleItems.length }}</p>
        </div>
        <button
          :disabled="loading"
          class="flex cursor-pointer items-center gap-2 self-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-blue-500 disabled:opacity-50"
          @click="saveOrder"
        >
          <i class="pi pi-save" />
          რიგის შენახვა
        </button>
      </div>

      <div v-if="localItems.length === 0" class="py-16 text-center">
        <i class="pi pi-calendar-times mb-4 block text-4xl text-slate-700" />
        <p class="text-sm text-slate-600">ნომრები ჯერ არ არის დამატებული</p>
      </div>

      <!-- Drag-reorder list -->
      <div v-else class="flex flex-col gap-3">
        <div
          v-for="(item, index) in localItems"
          :key="item.id || index"
          draggable="true"
          class="overflow-hidden rounded-2xl border border-l-4 border-blue-900/20 border-l-blue-500/40 bg-[#0d1829] transition-all duration-150"
          :class="dragIndex === index ? 'scale-[0.98] opacity-50' : ''"
          @dragstart="onDragStart(index)"
          @dragover="onDragOver($event, index)"
          @dragend="onDragEnd"
        >
          <div class="flex items-center gap-3 p-4">
            <div class="flex h-9 w-9 shrink-0 cursor-grab items-center justify-center rounded-xl bg-blue-900/20 text-slate-600 active:cursor-grabbing">
              <i class="pi pi-bars text-xs" />
            </div>

            <div class="min-w-0 flex-1">
              <div class="mb-0.5 flex items-center gap-2">
                <span class="text-xs font-bold text-blue-400/70">{{ index + 1 }}.</span>
                <h3 class="font-bold leading-tight text-white">{{ item.scene_name }}</h3>
              </div>
              <div class="flex flex-col gap-1">
                <div v-if="item.performer_full_name" class="flex items-center gap-1.5">
                  <i class="pi pi-user text-[9px] text-slate-600" />
                  <span class="text-xs text-slate-500">{{ item.performer_full_name }}</span>
                </div>
                <div v-if="item.group_name" class="flex items-center gap-1.5">
                  <i class="pi pi-users text-[9px] text-slate-600" />
                  <span class="text-xs text-slate-500">
                    {{ item.group_name }}<span v-if="item.leader_full_name"> · {{ item.leader_full_name }}</span>
                  </span>
                </div>
              </div>
            </div>

            <div class="flex shrink-0 items-center gap-1.5">
              <a
                v-if="item.media_url"
                :href="item.media_url"
                target="_blank"
                class="flex h-8 w-8 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
                @click.stop
              >
                <i class="pi pi-play text-xs" />
              </a>
              <button
                class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl border border-blue-900/20 bg-blue-900/20 text-slate-500 hover:text-slate-300"
                @click="openEdit(item)"
              >
                <i class="pi pi-pencil text-xs" />
              </button>
              <button
                class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl border border-red-900/20 bg-red-500/5 text-red-500/60 hover:bg-red-500/15 hover:text-red-400"
                @click="handleDelete(item.id!)"
              >
                <i class="pi pi-trash text-xs" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- FAB -->
    <button
      class="fixed bottom-24 right-5 z-30 flex h-13 w-13 cursor-pointer items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-900/40 transition-all hover:scale-105 hover:bg-blue-500 active:scale-95 lg:bottom-8 lg:right-8"
      @click="openAdd"
    >
      <i class="pi pi-plus text-lg" />
    </button>

    <BottomSheet
      :visible="sheetVisible"
      :title="isEditing ? 'ნომრის რედაქტირება' : 'ახალი ნომერი'"
      @close="sheetVisible = false"
    >
      <!-- Mode toggle -->
      <div class="mb-5 flex gap-2 rounded-xl border border-blue-900/30 bg-[#0d1829] p-1">
        <button
          class="flex-1 cursor-pointer rounded-lg py-2 text-xs font-semibold transition-all"
          :class="mode === 'general' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'"
          @click="mode = 'general'"
        >
          ზოგადი
        </button>
        <button
          class="flex-1 cursor-pointer rounded-lg py-2 text-xs font-semibold transition-all"
          :class="mode === 'child' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'"
          @click="mode = 'child'"
        >
          ბავშვის ფორმა
        </button>
      </div>

      <div class="flex flex-col gap-4">
        <SheetField label="ნომრის სახელი" :required="true" :error="submitted && !form.scene_name ? 'ნომრის დასახელება აუცილებელია' : ''">
          <input
            v-model="form.scene_name"
            type="text"
            class="w-full rounded-xl border px-4 py-3 text-sm text-slate-200 outline-none transition-colors"
            :class="submitted && !form.scene_name ? 'border-red-500/60 bg-red-500/5' : 'border-blue-900/30 bg-[#0d1829] focus:border-blue-700/60'"
          />
        </SheetField>

        <template v-if="mode === 'child'">
          <SheetField label="ბავშვის სახელი და გვარი" :required="true" :error="submitted && !form.performer_full_name ? 'სახელი აუცილებელია' : ''">
            <input
              v-model="form.performer_full_name"
              type="text"
              class="w-full rounded-xl border px-4 py-3 text-sm text-slate-200 outline-none transition-colors"
              :class="submitted && !form.performer_full_name ? 'border-red-500/60 bg-red-500/5' : 'border-blue-900/30 bg-[#0d1829] focus:border-blue-700/60'"
            />
          </SheetField>

          <div class="grid grid-cols-2 gap-3">
            <SheetField label="ლიდერი" :required="true" :error="submitted && !form.leader_full_name ? 'ლიდერი აუცილებელია' : ''">
              <input
                v-model="form.leader_full_name"
                type="text"
                class="w-full rounded-xl border px-4 py-3 text-sm text-slate-200 outline-none transition-colors"
                :class="submitted && !form.leader_full_name ? 'border-red-500/60 bg-red-500/5' : 'border-blue-900/30 bg-[#0d1829] focus:border-blue-700/60'"
              />
            </SheetField>
            <SheetField label="ჯგუფი" :required="true" :error="submitted && !form.group_name ? 'ჯგუფი აუცილებელია' : ''">
              <input
                v-model="form.group_name"
                type="text"
                class="w-full rounded-xl border px-4 py-3 text-sm text-slate-200 outline-none transition-colors"
                :class="submitted && !form.group_name ? 'border-red-500/60 bg-red-500/5' : 'border-blue-900/30 bg-[#0d1829] focus:border-blue-700/60'"
              />
            </SheetField>
          </div>
        </template>

        <SheetField label="მედია ლინკი">
          <input
            v-model="form.media_url"
            type="url"
            placeholder="YouTube / Drive"
            class="w-full rounded-xl border border-blue-900/30 bg-[#0d1829] px-4 py-3 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-blue-700/60"
          />
        </SheetField>

        <SheetField label="კომენტარი">
          <textarea
            v-model="form.additional_info"
            rows="2"
            class="w-full resize-none rounded-xl border border-blue-900/30 bg-[#0d1829] px-4 py-3 text-sm text-slate-200 outline-none focus:border-blue-700/60"
          />
        </SheetField>
      </div>

      <div class="mt-5 flex gap-3">
        <button
          v-if="isEditing"
          class="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-red-900/40 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-400 transition-all hover:bg-red-500/20"
          @click="handleDelete(editingId!)"
        >
          <i class="pi pi-trash text-sm" />
          წაშლა
        </button>
        <button
          :disabled="loading"
          class="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition-all hover:bg-blue-500 disabled:opacity-50"
          @click="handleSave"
        >
          <i class="pi pi-check text-sm" />
          {{ isEditing ? "შენახვა" : "დამატება" }}
        </button>
      </div>
    </BottomSheet>
  </div>
</template>
