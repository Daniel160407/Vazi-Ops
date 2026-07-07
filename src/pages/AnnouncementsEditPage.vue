<script setup lang="ts">
import { ref, reactive } from "vue";
import { storeToRefs } from "pinia";
import { format } from "date-fns";
import { ka } from "date-fns/locale";
import { useConfirm } from "primevue";
import { useGlobalStore } from "../stores/GlobalStore";
import { useAnnouncementsCrud } from "../composables/useAnnouncementsCrud";
import { useAuth } from "../composables/useAuth";
import {
  TAG_ACTIVITY,
  TAG_DINING,
  TAG_GATHERING,
  TAG_HEALTH,
  TAG_NOTEWORTHY,
  TAG_SCHEDULE,
  TAG_URGENT,
} from "../composables/constants";
import type { Announcement } from "../type/interfaces";
import LoadingSpinner from "../components/UI/LoadingSpinner.vue";
import BottomSheet from "../components/UI/BottomSheet.vue";
import SheetField from "../components/UI/SheetField.vue";
import AppButton from "../components/UI/AppButton.vue";
import AppInput from "../components/UI/AppInput.vue";

const { loading: loadingStore, announcements } = storeToRefs(useGlobalStore());
const { addAnnouncement, updateAnnouncement, deleteAnnouncement } =
  useAnnouncementsCrud();
const { fullName, profileImg } = useAuth();
const confirm = useConfirm();

const tagOptions = [
  TAG_URGENT,
  TAG_SCHEDULE,
  TAG_DINING,
  TAG_GATHERING,
  TAG_ACTIVITY,
  TAG_HEALTH,
  TAG_NOTEWORTHY,
];

const tagMeta = (
  tag: string,
): { cls: string; active: string; icon: string } => {
  const map: Record<string, { cls: string; active: string; icon: string }> = {
    [TAG_URGENT]: {
      cls: "border-red-500/30 text-red-400",
      active: "bg-red-500/20 border-red-500/40",
      icon: "pi-exclamation-triangle",
    },
    [TAG_SCHEDULE]: {
      cls: "border-blue-500/30 text-blue-400",
      active: "bg-blue-500/20 border-blue-500/40",
      icon: "pi-calendar",
    },
    [TAG_DINING]: {
      cls: "border-amber-500/30 text-amber-400",
      active: "bg-amber-500/20 border-amber-500/40",
      icon: "pi-star",
    },
    [TAG_GATHERING]: {
      cls: "border-purple-500/30 text-purple-400",
      active: "bg-purple-500/20 border-purple-500/40",
      icon: "pi-users",
    },
    [TAG_ACTIVITY]: {
      cls: "border-emerald-500/30 text-emerald-400",
      active: "bg-emerald-500/20 border-emerald-500/40",
      icon: "pi-bolt",
    },
    [TAG_HEALTH]: {
      cls: "border-teal-500/30 text-teal-400",
      active: "bg-teal-500/20 border-teal-500/40",
      icon: "pi-heart",
    },
    [TAG_NOTEWORTHY]: {
      cls: "border-cyan-500/30 text-cyan-400",
      active: "bg-cyan-500/20 border-cyan-500/40",
      icon: "pi-info-circle",
    },
  };
  return (
    map[tag] ?? {
      cls: "border-slate-500/30 text-slate-400",
      active: "bg-slate-500/20 border-slate-500/40",
      icon: "pi-tag",
    }
  );
};


const cardTagMeta = (tag: string): { cls: string; icon: string } => {
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

const expandedIds = ref(new Set<string>());
const toggle = (id: string) => {
  if (expandedIds.value.has(id)) expandedIds.value.delete(id);
  else expandedIds.value.add(id);
};
const isExpanded = (id: string) => expandedIds.value.has(id);

const sheetVisible = ref(false);
const isEditing = ref(false);
const currentId = ref<string | null>(null);
const isSubmitting = ref(false);
const submitted = ref(false);

const blankForm = () => ({
  title: "",
  content: "",
  tag: TAG_URGENT,
  author: fullName.value,
  author_image_url: profileImg.value || "",
  date: new Date(),
});

const form = reactive(blankForm());

const openAdd = () => {
  isEditing.value = false;
  currentId.value = null;
  Object.assign(form, blankForm());
  submitted.value = false;
  sheetVisible.value = true;
};

const openEdit = (a: Announcement) => {
  isEditing.value = true;
  currentId.value = a.id;
  Object.assign(form, {
    title: a.title,
    content: a.content,
    tag: a.tag,
    author: a.author,
    author_image_url: a.author_image_url,
    date: a.date,
  });
  submitted.value = false;
  sheetVisible.value = true;
};

const handleSave = async () => {
  submitted.value = true;
  if (!form.title || !form.content) return;
  isSubmitting.value = true;
  try {
    if (isEditing.value && currentId.value)
      await updateAnnouncement(currentId.value, { ...form });
    else await addAnnouncement({ ...form });
    sheetVisible.value = false;
  } finally {
    isSubmitting.value = false;
  }
};

const handleDelete = (id: string) => {
  confirm.require({
    message: "დარწმუნებული ხარ, რომ განცხადების წაშლა გინდა?",
    header: "წაშლა",
    acceptProps: { label: "წაშლა", severity: "danger" },
    rejectProps: { label: "გაუქმება", severity: "secondary", outlined: true },
    accept: async () => {
      await deleteAnnouncement(id);
      sheetVisible.value = false;
    },
  });
};
</script>

<template>
  <div class="relative pb-4">
    <LoadingSpinner v-if="loadingStore && announcements.length === 0" />

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
                class="flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest"
                :class="cardTagMeta(a.tag).cls"
              >
                <i :class="`pi ${cardTagMeta(a.tag).icon} text-[9px]`" />
                <span>{{ a.tag }}</span>
              </span>
              <div class="flex items-center gap-1.5">
                <span class="text-[11px] text-slate-600">{{
                  formatDate(a.date)
                }}</span>
                <AppButton
                  variant="icon-edit"
                  icon="pi-pencil"
                  @click="openEdit(a)"
                />
                <AppButton
                  variant="icon-delete"
                  icon="pi-trash"
                  @click="handleDelete(a.id)"
                />
              </div>
            </div>

            <h3 class="mb-2 text-base font-bold leading-snug text-white">
              {{ a.title }}
            </h3>

            <p
              class="text-sm leading-relaxed text-slate-400"
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
                class="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-indigo-600 text-xs font-bold text-white"
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

    <AppButton variant="fab" icon="pi-plus" @click="openAdd" />

    <BottomSheet
      :visible="sheetVisible"
      :title="isEditing ? 'განცხადების რედაქტირება' : 'ახალი განცხადება'"
      @close="sheetVisible = false"
    >
      <div class="flex flex-col gap-4">
        <div>
          <label
            class="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500"
            >თეგი</label
          >
          <div class="flex flex-wrap gap-2">
            <AppButton
              v-for="tag in tagOptions"
              :key="tag"
              variant="plain"
              class="rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all flex items-center gap-1.5"
              :class="[
                tagMeta(tag).cls,
                form.tag === tag ? tagMeta(tag).active : 'bg-transparent',
              ]"
              @click="form.tag = tag"
            >
              <i :class="`pi ${tagMeta(tag).icon} text-[9px]`" />
              {{ tag }}
            </AppButton>
          </div>
        </div>

        <SheetField
          label="სათაური"
          :required="true"
          :error="submitted && !form.title ? 'სათაური აუცილებელია' : ''"
        >
          <AppInput v-model="form.title" :error="submitted && !form.title" />
        </SheetField>

        <SheetField
          label="განცხადება"
          :required="true"
          :error="submitted && !form.content ? 'ტექსტი აუცილებელია' : ''"
        >
          <textarea
            v-model="form.content"
            rows="5"
            class="w-full resize-none rounded-xl border px-4 py-3 text-sm text-slate-200 outline-none transition-colors"
            :class="
              submitted && !form.content
                ? 'border-red-500/60 bg-red-500/5'
                : 'border-blue-900/30 bg-[#0d1829] focus:border-blue-700/60'
            "
          />
        </SheetField>
      </div>

      <div class="mt-5 flex gap-3">
        <AppButton
          v-if="isEditing"
          variant="danger"
          icon="pi-trash"
          @click="handleDelete(currentId!)"
          >წაშლა</AppButton
        >
        <AppButton
          variant="primary"
          :disabled="isSubmitting"
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
