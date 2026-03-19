<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useGlobalStore } from "../stores/GlobalStore";
import {
  Avatar,
  Button,
  Dialog,
  InputText,
  Textarea,
  Select,
  useConfirm,
} from "primevue";
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
import { ref, reactive } from "vue";
import { useAnnouncementsCrud } from "../composables/useAnnouncementsCrud";
import type { Announcement } from "../type/interfaces";
import { useAuth } from "../composables/useAuth";

const { loading: storeLoading, announcements } = storeToRefs(useGlobalStore());
const { addAnnouncement, updateAnnouncement, deleteAnnouncement } =
  useAnnouncementsCrud();
const { fullName, profileImg } = useAuth();
const confirm = useConfirm();

const expandedIds = ref(new Set<string>());
const isDialogVisible = ref(false);
const isEditing = ref(false);
const currentId = ref<string | null>(null);
const isSubmitting = ref(false);

const tagOptions = [
  TAG_URGENT,
  TAG_SCHEDULE,
  TAG_DINING,
  TAG_GATHERING,
  TAG_ACTIVITY,
  TAG_HEALTH,
  TAG_NOTEWORTHY,
];

const getCleanFormState = () => ({
  title: "",
  content: "",
  tag: TAG_URGENT,
  author: fullName.value || "ანონიმი",
  author_image_url: profileImg.value || "",
  date: new Date(),
});

const form = reactive(getCleanFormState());

const openAddDialog = () => {
  isEditing.value = false;
  currentId.value = null;
  Object.assign(form, getCleanFormState());
  isDialogVisible.value = true;
};

const openEditDialog = (announcement: Announcement) => {
  isEditing.value = true;
  currentId.value = announcement.id;
  Object.assign(form, {
    title: announcement.title,
    content: announcement.content,
    tag: announcement.tag,
    author: announcement.author,
    author_image_url: announcement.author_image_url,
    date: announcement.date,
  });
  isDialogVisible.value = true;
};

const saveAnnouncement = async () => {
  if (!form.title || !form.content) return;

  isSubmitting.value = true;
  try {
    if (isEditing.value && currentId.value) {
      await updateAnnouncement(currentId.value, { ...form });
    } else {
      await addAnnouncement({ ...form });
    }
    isDialogVisible.value = false;
  } finally {
    isSubmitting.value = false;
  }
};

const handleDelete = async (id: string) => {
  confirm.require({
    message: "დარწმუნებული ხარ, რომ განცხადების წაშლა გინდა?",
    header: "წაშლა",
    acceptProps: { label: "წაშლა", severity: "danger" },
    rejectProps: {
      label: "გამოსვლა",
      severity: "secondary",
    },
    accept: async () => {
      await deleteAnnouncement(id);
    },
  });
};

const toggleReadMore = (id: string) => {
  if (expandedIds.value.has(id)) expandedIds.value.delete(id);
  else expandedIds.value.add(id);
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
  const date = value.seconds !== undefined ? value.toDate() : new Date(value);
  return format(date, "HH:mm, d MMMM yyyy", { locale: ka });
};
</script>

<template>
  <LoadingSpinner v-if="storeLoading && announcements.length <= 0" />

  <div v-else class="max-w-3xl mx-auto py-8">
    <div
      class="mb-10 flex flex-col sm:flex-row justify-between sm:items-end gap-4"
    >
      <div>
        <h2 class="text-3xl font-bold mb-2 text-white">განცხადებები</h2>
        <p class="text-[#94A3B8]">
          დაამატეთ განცხადებები მნიშვნელოვან საკითხებთან დაკავშირებით.
        </p>
      </div>
      <Button
        label="დამატება"
        icon="pi pi-plus"
        severity="info"
        @click="openAddDialog"
      />
    </div>

    <div class="space-y-6">
      <article
        v-for="announcement in announcements"
        :key="announcement.id"
        class="p-6 rounded-2xl bg-[#27272a] border border-white/5 transition-all duration-300"
      >
        <div class="flex justify-between items-center mb-4">
          <span
            :class="getTagStyles(announcement.tag)"
            class="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border"
          >
            {{ announcement.tag }}
          </span>
          <div class="flex gap-2">
            <Button
              icon="pi pi-pencil"
              text
              rounded
              severity="secondary"
              @click="openEditDialog(announcement)"
            />
            <Button
              icon="pi pi-trash"
              text
              rounded
              severity="danger"
              @click="handleDelete(announcement.id)"
            />
          </div>
        </div>

        <div class="mb-6">
          <div class="flex justify-between items-baseline mb-3">
            <h3 class="text-xl font-bold text-white">
              {{ announcement.title }}
            </h3>
            <span class="text-[11px] text-slate-500 font-medium">
              {{ formatDate(announcement.date) }}
            </span>
          </div>

          <p
            class="text-slate-400 leading-relaxed text-[15px]"
            :class="{ 'line-clamp-3': !isExpanded(announcement.id) }"
          >
            {{ announcement.content }}
          </p>

          <button
            v-if="announcement.content && announcement.content.length > 150"
            @click="toggleReadMore(announcement.id)"
            class="mt-3 text-sm font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
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
          />
          <span class="text-sm font-semibold text-slate-200">{{
            announcement.author
          }}</span>
        </div>
      </article>
    </div>

    <Dialog
      v-model:visible="isDialogVisible"
      :header="isEditing ? 'რედაქტირება' : 'ახალი განცხადება'"
      modal
      class="w-full max-w-lg mx-4"
    >
      <div class="flex flex-col gap-4 py-4">
        <div class="flex flex-col gap-2">
          <label for="title" class="text-sm font-medium">სათაური</label>
          <InputText
            id="title"
            v-model="form.title"
            placeholder="შეიყვანეთ სათაური"
          />
        </div>

        <div class="flex flex-col gap-2">
          <label for="tag" class="text-sm font-medium">თეგი</label>
          <Select
            id="tag"
            v-model="form.tag"
            :options="tagOptions"
            placeholder="აირჩიეთ თეგი"
          />
        </div>

        <div class="flex flex-col gap-2">
          <label for="content" class="text-sm font-medium">შინაარსი</label>
          <Textarea
            id="content"
            v-model="form.content"
            rows="5"
            autoResize
            placeholder="დაწერეთ ტექსტი..."
          />
        </div>
      </div>

      <template #footer>
        <Button
          label="გაუქმება"
          text
          severity="secondary"
          @click="isDialogVisible = false"
        />
        <Button
          :label="isEditing ? 'განახლება' : 'დამატება'"
          icon="pi pi-check"
          :loading="isSubmitting"
          @click="saveAnnouncement"
        />
      </template>
    </Dialog>
  </div>
</template>
