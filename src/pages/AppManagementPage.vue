<script setup lang="ts">
import { ref, reactive } from "vue";
import { useConfirm } from "primevue";
import { useUsersCrud } from "@/composables/useUsersCrud";
import { useImgBB } from "@/composables/useImgBB";
import { usePageVisibilityCrud, PAGE_DEFINITIONS } from "@/composables/usePageVisibilityCrud";
import { UserRole } from "@/type/interfaces";
import type { AppUser } from "@/type/interfaces";
import LoadingSpinner from "@/components/UI/LoadingSpinner.vue";
import BottomSheet from "@/components/UI/BottomSheet.vue";
import SheetField from "@/components/UI/SheetField.vue";
import AppButton from "@/components/UI/AppButton.vue";
import AppInput from "@/components/UI/AppInput.vue";

const { appUsers, loading, addUser, updateUser, updateUserRole, deleteUser } =
  useUsersCrud();
const { isVisible, toggleVisibility } = usePageVisibilityCrud();
const togglingPage = ref<string | null>(null);
const visibilityOpen = ref(false);

const handleTogglePage = async (key: string) => {
  if (togglingPage.value) return;
  togglingPage.value = key;
  await toggleVisibility(key);
  togglingPage.value = null;
};
const {
  selectedImage,
  imagePreview,
  uploadingImage,
  handleImageSelect,
  uploadImageIfExists,
  resetValues,
} = useImgBB();

const togglingId = ref<string | null>(null);

const toggleRole = async (u: AppUser) => {
  if (togglingId.value) return;
  togglingId.value = u.id;
  const newRole = u.role === UserRole.ADMIN ? UserRole.USER : UserRole.ADMIN;
  await updateUserRole(u.id, newRole);
  togglingId.value = null;
};
const confirm = useConfirm();

const roleOptions = [UserRole.ADMIN, UserRole.USER];

const roleMeta = (role: UserRole) =>
  role === UserRole.ADMIN
    ? {
        cls: "bg-blue-500/15 text-blue-400 border-blue-500/25",
        icon: "pi-shield",
        label: "ადმინი",
      }
    : {
        cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
        icon: "pi-user",
        label: "მომხმარებელი",
      };

const accentBorder = (role: UserRole) =>
  role === UserRole.ADMIN ? "border-l-blue-500/60" : "border-l-emerald-500/50";

const sheetVisible = ref(false);
const isEditing = ref(false);
const currentId = ref<string | null>(null);
const isSubmitting = ref(false);
const submitted = ref(false);

const blankForm = () => ({
  name: "",
  email: "",
  role: UserRole.USER as UserRole,
  avatar_url: "",
});

const form = reactive(blankForm());

const openAdd = () => {
  isEditing.value = false;
  currentId.value = null;
  Object.assign(form, blankForm());
  resetValues();
  submitted.value = false;
  sheetVisible.value = true;
};

const openEdit = (u: AppUser) => {
  isEditing.value = true;
  currentId.value = u.id;
  Object.assign(form, {
    name: u.name,
    email: u.email,
    role: u.role,
    avatar_url: u.avatar_url || "",
  });
  resetValues();
  submitted.value = false;
  sheetVisible.value = true;
};

const handleSave = async () => {
  submitted.value = true;
  if (!form.name || !form.email) return;
  isSubmitting.value = true;
  try {
    const uploadedUrl = await uploadImageIfExists();
    if (uploadedUrl) form.avatar_url = uploadedUrl;

    if (isEditing.value && currentId.value) {
      await updateUser({ id: currentId.value, ...form });
    } else {
      await addUser({ ...form });
    }
    sheetVisible.value = false;
  } finally {
    isSubmitting.value = false;
  }
};

const handleDelete = (id: string) => {
  confirm.require({
    message: "დარწმუნებული ხარ, რომ მომხმარებლის წაშლა გინდა?",
    header: "წაშლა",
    acceptProps: { label: "წაშლა", severity: "danger" },
    rejectProps: { label: "გაუქმება", severity: "secondary", outlined: true },
    accept: async () => {
      await deleteUser(id);
      sheetVisible.value = false;
    },
  });
};

const adminCount = () =>
  appUsers.value.filter((u) => u.role === UserRole.ADMIN).length;
const userCount = () =>
  appUsers.value.filter((u) => u.role === UserRole.USER).length;
</script>

<template>
  <div class="relative pb-4">
    <LoadingSpinner v-if="loading && appUsers.length === 0" />

    <div v-else>
      <div class="mb-5 grid grid-cols-2 gap-3">
        <div class="rounded-2xl border border-blue-900/20 bg-[#0d1829] p-4">
          <p
            class="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-500"
          >
            ადმინები
          </p>
          <p class="text-3xl font-bold text-white">{{ adminCount() }}</p>
        </div>
        <div class="rounded-2xl border border-blue-900/20 bg-[#0d1829] p-4">
          <p
            class="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-500"
          >
            მომხმარებლები
          </p>
          <p class="text-3xl font-bold text-white">{{ userCount() }}</p>
        </div>
      </div>

      <div class="mb-5 overflow-hidden rounded-2xl border border-blue-900/20 bg-[#0d1829]">
        <button
          class="flex w-full items-center justify-between px-4 py-3 transition-colors hover:bg-white/5"
          @click="visibilityOpen = !visibilityOpen"
        >
          <div class="flex items-center gap-3">
            <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-900/30">
              <i class="pi pi-eye text-sm text-blue-400" />
            </div>
            <span class="text-sm font-medium text-slate-200">გვერდების ხილვადობა</span>
          </div>
          <i
            class="pi pi-chevron-down text-xs text-slate-500 transition-transform duration-200"
            :class="visibilityOpen ? 'rotate-180' : ''"
          />
        </button>

        <Transition name="visibility-dropdown">
          <div v-if="visibilityOpen" class="border-t border-blue-900/20">
            <div
              v-for="page in PAGE_DEFINITIONS"
              :key="page.key"
              class="flex items-center justify-between px-4 py-3 [&:not(:last-child)]:border-b [&:not(:last-child)]:border-blue-900/20"
            >
              <div class="flex items-center gap-3">
                <div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-900/20">
                  <i :class="page.icon" class="text-xs text-blue-400" />
                </div>
                <span class="text-sm text-slate-300">{{ page.label }}</span>
              </div>
              <button
                class="relative h-6 w-11 rounded-full transition-colors duration-200 focus:outline-none"
                :class="[
                  isVisible(page.key) ? 'bg-blue-600' : 'bg-slate-700',
                  togglingPage === page.key ? 'opacity-50' : '',
                ]"
                :disabled="togglingPage === page.key"
                @click="handleTogglePage(page.key)"
              >
                <span
                  class="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200"
                  :class="isVisible(page.key) ? 'translate-x-5' : 'translate-x-0'"
                />
              </button>
            </div>
          </div>
        </Transition>
      </div>

      <div v-if="appUsers.length === 0" class="py-16 text-center">
        <i class="pi pi-users mb-4 block text-4xl text-slate-700" />
        <p class="text-sm text-slate-600">მომხმარებლები ჯერ არ არის</p>
      </div>

      <div class="flex flex-col gap-3">
        <article
          v-for="u in appUsers"
          :key="u.id"
          class="overflow-hidden rounded-2xl border border-l-4 border-blue-900/20 bg-[#0d1829]"
          :class="accentBorder(u.role)"
        >
          <div class="p-4">
            <div
              class="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-2"
            >
              <div class="flex items-center gap-3">
                <div
                  class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-900/40 text-sm font-bold text-blue-300"
                >
                  <img
                    v-if="u.avatar_url"
                    :src="u.avatar_url"
                    referrerpolicy="no-referrer"
                    class="h-full w-full object-cover"
                  />
                  <span v-else>{{
                    u.name?.charAt(0)?.toUpperCase() || "?"
                  }}</span>
                </div>
                <div class="min-w-0">
                  <p class="truncate text-sm font-semibold text-white">
                    {{ u.name }}
                  </p>
                  <p class="truncate text-xs text-slate-500">{{ u.email }}</p>
                </div>
              </div>
              <div
                class="flex items-center justify-between gap-2 border-t border-blue-900/20 pt-3 sm:border-0 sm:pt-0"
              >
                <button
                  class="flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest transition-opacity"
                  :class="[
                    roleMeta(u.role).cls,
                    togglingId === u.id
                      ? 'opacity-50'
                      : 'hover:opacity-80 active:opacity-60',
                  ]"
                  :disabled="togglingId === u.id"
                  @click="toggleRole(u)"
                >
                  <i
                    v-if="togglingId === u.id"
                    class="pi pi-spin pi-spinner text-[9px]"
                  />
                  <i v-else :class="`pi ${roleMeta(u.role).icon} text-[9px]`" />
                  {{ roleMeta(u.role).label }}
                </button>
                <div class="flex items-center gap-1">
                  <AppButton
                    variant="icon-edit"
                    icon="pi-pencil"
                    @click="openEdit(u)"
                  />
                  <AppButton
                    variant="icon-delete"
                    icon="pi-trash"
                    @click="handleDelete(u.id)"
                  />
                </div>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>

    <AppButton variant="fab" icon="pi-plus" @click="openAdd" />

    <BottomSheet
      :visible="sheetVisible"
      :title="isEditing ? 'მომხმარებლის რედაქტირება' : 'ახალი მომხმარებელი'"
      @close="sheetVisible = false"
    >
      <div class="flex flex-col gap-4">
        <div>
          <label
            class="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500"
          >
            როლი
          </label>
          <div class="flex gap-2">
            <AppButton
              v-for="r in roleOptions"
              :key="r"
              variant="plain"
              class="flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-semibold transition-all"
              :class="[
                roleMeta(r).cls,
                form.role === r ? 'opacity-100' : 'opacity-40',
              ]"
              @click="form.role = r"
            >
              <i :class="`pi ${roleMeta(r).icon} text-[10px]`" />
              {{ roleMeta(r).label }}
            </AppButton>
          </div>
        </div>

        <div>
          <label
            class="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500"
          >
            ავატარი
          </label>
          <div class="flex items-center gap-4">
            <div
              class="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-900/40 text-lg font-bold text-blue-300"
            >
              <img
                v-if="imagePreview || form.avatar_url"
                :src="imagePreview || form.avatar_url"
                class="h-full w-full object-cover"
              />
              <span v-else>{{
                form.name?.charAt(0)?.toUpperCase() || "?"
              }}</span>
            </div>
            <label
              class="flex cursor-pointer items-center gap-2 rounded-xl border border-blue-900/30 bg-[#0d1829] px-4 py-2.5 text-xs font-semibold text-slate-400 transition-colors hover:border-blue-700/50 hover:text-slate-200"
            >
              <i class="pi pi-upload text-[11px]" />
              {{
                uploadingImage
                  ? "იტვირთება..."
                  : selectedImage
                    ? selectedImage.name
                    : "სურათის არჩევა"
              }}
              <input
                type="file"
                accept="image/*"
                class="hidden"
                @change="handleImageSelect"
              />
            </label>
          </div>
        </div>

        <SheetField
          label="სახელი"
          :required="true"
          :error="submitted && !form.name ? 'სახელი აუცილებელია' : ''"
        >
          <AppInput v-model="form.name" :error="submitted && !form.name" />
        </SheetField>

        <SheetField
          label="ელ-ფოსტა"
          :required="true"
          :error="submitted && !form.email ? 'ელ-ფოსტა აუცილებელია' : ''"
        >
          <AppInput v-model="form.email" type="email" :error="submitted && !form.email" />
        </SheetField>
      </div>

      <div class="mt-5 flex gap-3">
        <AppButton
          v-if="isEditing"
          variant="danger"
          icon="pi-trash"
          @click="handleDelete(currentId!)"
        >
          წაშლა
        </AppButton>
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

<style scoped>
.visibility-dropdown-enter-active {
  transition: max-height 0.28s ease, opacity 0.28s ease;
  overflow: hidden;
  max-height: 600px;
}
.visibility-dropdown-leave-active {
  transition: max-height 0.2s ease, opacity 0.2s ease;
  overflow: hidden;
  max-height: 600px;
}
.visibility-dropdown-enter-from {
  max-height: 0;
  opacity: 0;
}
.visibility-dropdown-leave-to {
  max-height: 0;
  opacity: 0;
}
</style>
