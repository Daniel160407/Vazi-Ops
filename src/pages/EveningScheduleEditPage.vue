<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { storeToRefs } from "pinia";
import { useGlobalStore } from "../stores/GlobalStore";
import { useSchedulesCrud } from "../composables/useSchedulesCrud";
import { useAuth } from "../composables/useAuth";
import { useConfirm } from "primevue";
import type { EveningScheduleItem } from "../type/interfaces";
import LoadingSpinner from "../components/UI/LoadingSpinner.vue";
import BottomSheet from "../components/UI/BottomSheet.vue";
import SheetField from "../components/UI/SheetField.vue";
import AppButton from "../components/UI/AppButton.vue";
import AppInput from "../components/UI/AppInput.vue";

const { loading: loadingStore, eveningScheduleItems, appUsers, groups } =
  storeToRefs(useGlobalStore());
const { fullName, userGroupName } = useAuth();
const {
  updateScheduleOrder,
  addEveningSchedule,
  updateEveningSchedule,
  deleteEveningSchedule,
  loading,
} = useSchedulesCrud();
const confirm = useConfirm();

const localItems = ref<EveningScheduleItem[]>([]);

watch(
  eveningScheduleItems,
  (val) => {
    localItems.value = [...val];
  },
  { immediate: true },
);

const saveOrder = async () => {
  await updateScheduleOrder(localItems.value);
};

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

const onTouchStart = (index: number) => {
  dragIndex.value = index;
};

const onTouchMove = (e: TouchEvent) => {
  if (dragIndex.value === null) return;
  const touch = e.touches[0];
  if (!touch) return;
  const target = document.elementFromPoint(touch.clientX, touch.clientY);
  const card = target?.closest<HTMLElement>("[data-drag-index]");
  if (!card) return;
  const targetIndex = parseInt(card.dataset.dragIndex ?? "-1");
  if (targetIndex < 0 || targetIndex === dragIndex.value) return;
  const items = [...localItems.value];
  const dragged = items.splice(dragIndex.value, 1)[0];
  if (!dragged) return;
  items.splice(targetIndex, 0, dragged);
  localItems.value = items;
  dragIndex.value = targetIndex;
};

const onTouchEnd = () => {
  dragIndex.value = null;
};

const leaderOpen = ref(false);

const leaderSuggestions = computed(() => {
  const q = form.value.leader_full_name.toLowerCase().trim();
  return appUsers.value.filter((u) => u.name.toLowerCase().includes(q));
});

const selectLeader = (name: string) => {
  form.value.leader_full_name = name;
  leaderOpen.value = false;
};

const childOpen = ref(false);

const childSuggestions = computed(() => {
  const leader = form.value.leader_full_name.trim();
  const q = form.value.performer_full_name.toLowerCase().trim();
  const matchedGroup = groups.value.find((g) => g.leader === leader);
  if (!matchedGroup) return [];
  return matchedGroup.children.filter((c) => !q || c.toLowerCase().includes(q));
});

const selectChild = (name: string) => {
  form.value.performer_full_name = name;
  childOpen.value = false;
};

const sheetVisible = ref(false);
const isEditing = ref(false);
const editingId = ref<string | null>(null);
const mode = ref<"general" | "child">("general");
const submitted = ref(false);

const blankForm = () => ({
  performer_full_name: "",
  leader_full_name: "",
  group_name: "",
  scene_name: "",
  media_url: "",
  additional_info: "",
});

const form = ref(blankForm());

const openAdd = () => {
  isEditing.value = false;
  editingId.value = null;
  mode.value = "general";
  form.value = { ...blankForm(), leader_full_name: fullName.value, group_name: userGroupName.value };
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
    ? !!form.value.scene_name &&
      !!form.value.performer_full_name &&
      !!form.value.leader_full_name &&
      !!form.value.group_name
    : !!form.value.scene_name;
  if (!valid) return;

  const data = {
    ...form.value,
    ...(isChild
      ? {}
      : { performer_full_name: "", leader_full_name: "", group_name: "" }),
  };

  if (isEditing.value && editingId.value) {
    await updateEveningSchedule(editingId.value, data);
  } else {
    await addEveningSchedule({
      ...data,
      position: eveningScheduleItems.value.length + 1,
      created_at: new Date(),
    });
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
      <div class="mb-5 flex gap-3 justify-between">
        <div
          class="flex-1 rounded-2xl border border-blue-900/20 bg-[#0d1829] p-4"
        >
          <p
            class="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-500"
          >
            ნომრების რაოდენობა
          </p>
          <p class="text-3xl font-bold text-white">
            {{ eveningScheduleItems.length }}
          </p>
        </div>
        <AppButton
          variant="primary"
          :disabled="loading"
          icon="pi-save"
          class="self-center px-5"
          @click="saveOrder"
        >
          შენახვა
        </AppButton>
      </div>

      <div v-if="localItems.length === 0" class="py-16 text-center">
        <i class="pi pi-calendar-times mb-4 block text-4xl text-slate-700" />
        <p class="text-sm text-slate-600">ნომრები ჯერ არ არის დამატებული</p>
      </div>

      <div v-else class="flex flex-col gap-3">
        <div
          v-for="(item, index) in localItems"
          :key="item.id || index"
          draggable="true"
          :data-drag-index="index"
          class="overflow-hidden rounded-2xl border border-l-4 border-blue-900/20 border-l-blue-500/40 bg-[#0d1829] transition-all duration-150"
          :class="dragIndex === index ? 'scale-[0.98] opacity-50' : ''"
          @dragstart="onDragStart(index)"
          @dragover="onDragOver($event, index)"
          @dragend="onDragEnd"
        >
          <div class="flex items-center gap-3 p-4">
            <div
              class="flex h-9 w-9 shrink-0 cursor-grab items-center justify-center rounded-xl bg-blue-900/20 text-slate-600 active:cursor-grabbing"
              style="touch-action: none"
              @touchstart.passive="onTouchStart(index)"
              @touchmove.prevent="onTouchMove"
              @touchend="onTouchEnd"
            >
              <i class="pi pi-bars text-xs" />
            </div>

            <div class="min-w-0 flex-1">
              <div class="mb-0.5 flex items-center gap-2">
                <span class="text-xs font-bold text-blue-400/70"
                  >{{ index + 1 }}.</span
                >
                <h3 class="font-bold leading-tight text-white">
                  {{ item.scene_name }}
                </h3>
              </div>
              <div class="flex flex-col gap-1">
                <div
                  v-if="item.performer_full_name"
                  class="flex items-center gap-1.5"
                >
                  <i class="pi pi-user text-[9px] text-slate-600" />
                  <span class="text-xs text-slate-500">{{
                    item.performer_full_name
                  }}</span>
                </div>
                <div v-if="item.group_name" class="flex items-center gap-1.5">
                  <i class="pi pi-users text-[9px] text-slate-600" />
                  <span class="text-xs text-slate-500">
                    {{ item.group_name
                    }}<span v-if="item.leader_full_name">
                      · {{ item.leader_full_name }}</span
                    >
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
              <AppButton
                variant="icon-edit"
                size="md"
                icon="pi-pencil"
                @click="openEdit(item)"
              />
              <AppButton
                variant="icon-delete"
                size="md"
                icon="pi-trash"
                @click="handleDelete(item.id!)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <AppButton variant="fab" icon="pi-plus" @click="openAdd" />

    <BottomSheet
      :visible="sheetVisible"
      :title="isEditing ? 'ნომრის რედაქტირება' : 'ახალი ნომერი'"
      @close="sheetVisible = false"
    >
      <div
        class="mb-5 flex gap-2 rounded-xl border border-blue-900/30 bg-[#0d1829] p-1"
      >
        <AppButton
          variant="segment"
          :active="mode === 'general'"
          @click="mode = 'general'"
          >ზოგადი</AppButton
        >
        <AppButton
          variant="segment"
          :active="mode === 'child'"
          @click="mode = 'child'"
          >ბავშვის ფორმა</AppButton
        >
      </div>

      <div class="flex flex-col gap-4">
        <SheetField
          label="ნომრის სახელი"
          :required="true"
          :error="
            submitted && !form.scene_name ? 'ნომრის დასახელება აუცილებელია' : ''
          "
        >
          <AppInput v-model="form.scene_name" :error="submitted && !form.scene_name" />
        </SheetField>

        <template v-if="mode === 'child'">
          <SheetField
            label="ბავშვის სახელი და გვარი"
            :required="true"
            :error="submitted && !form.performer_full_name ? 'სახელი აუცილებელია' : ''"
          >
            <div class="relative">
              <AppInput v-model="form.performer_full_name" autocomplete="off" :error="submitted && !form.performer_full_name" @focus="childOpen = true" @blur="childOpen = false" />
              <Transition
                enter-active-class="transition-all duration-150 ease-out"
                enter-from-class="opacity-0 -translate-y-1"
                enter-to-class="opacity-100 translate-y-0"
                leave-active-class="transition-all duration-100 ease-in"
                leave-from-class="opacity-100 translate-y-0"
                leave-to-class="opacity-0 -translate-y-1"
              >
                <ul
                  v-if="childOpen && childSuggestions.length"
                  class="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-48 overflow-y-auto rounded-xl border border-blue-900/30 bg-[#07101e] py-1 shadow-xl"
                  style="box-shadow: 0 8px 32px 0 rgba(0,6,30,0.8)"
                  @mousedown.prevent
                >
                  <li
                    v-for="child in childSuggestions"
                    :key="child"
                    class="flex cursor-pointer items-center gap-3 px-3 py-2.5 transition-colors hover:bg-blue-900/20"
                    @click="selectChild(child)"
                  >
                    <span class="text-sm text-slate-200">{{ child }}</span>
                  </li>
                </ul>
              </Transition>
            </div>
          </SheetField>

          <SheetField
            label="ლიდერი"
            :required="true"
            :error="submitted && !form.leader_full_name ? 'ლიდერი აუცილებელია' : ''"
          >
            <div class="relative">
              <AppInput v-model="form.leader_full_name" autocomplete="off" :error="submitted && !form.leader_full_name" @focus="leaderOpen = true" @blur="leaderOpen = false" />
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

          <SheetField
            label="ჯგუფი"
            :required="true"
            :error="submitted && !form.group_name ? 'ჯგუფი აუცილებელია' : ''"
          >
            <AppInput v-model="form.group_name" :error="submitted && !form.group_name" />
          </SheetField>
        </template>

        <SheetField label="მედია ლინკი">
          <AppInput v-model="form.media_url" type="url" placeholder="YouTube / Drive" />
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
        <AppButton
          v-if="isEditing"
          variant="danger"
          icon="pi-trash"
          @click="handleDelete(editingId!)"
          >წაშლა</AppButton
        >
        <AppButton
          variant="primary"
          :disabled="loading"
          icon="pi-check"
          class="flex-1"
          @click="handleSave"
        >
          {{ isEditing ? "შენახვა" : "დამატება" }}
        </AppButton>
      </div>
    </BottomSheet>
  </div>
</template>
