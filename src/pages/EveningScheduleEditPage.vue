<script setup lang="ts">
import { ref } from "vue";
import { storeToRefs } from "pinia";
import { useGlobalStore } from "../stores/GlobalStore";
import { useSchedulesCrud } from "../composables/useSchedulesCrud";
import OrderList from "primevue/orderlist";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import InputText from "primevue/inputtext";
import Message from "primevue/message";
import Textarea from "primevue/textarea";
import Tabs from "primevue/tabs";
import TabList from "primevue/tablist";
import Tab from "primevue/tab";
import TabPanels from "primevue/tabpanels";
import TabPanel from "primevue/tabpanel";
import LoadingSpinner from "../components/UI/LoadingSpinner.vue";
import { FloatLabel, useConfirm } from "primevue";

const { loading: loadingStore, eveningScheduleItems } = storeToRefs(
  useGlobalStore()
);
const confirm = useConfirm();

const {
  updateScheduleOrder,
  addEveningSchedule,
  updateEveningSchedule,
  deleteEveningSchedule,
  loading,
} = useSchedulesCrud();

const showRegisterModal = ref(false);
const submitted = ref(false);
const activeTab = ref("0");

const isEditing = ref(false);
const editingId = ref<string | null>(null);

const newEvent = ref({
  performer_full_name: "",
  leader_full_name: "",
  group_name: "",
  scene_name: "",
  media_url: "",
  additional_info: "",
});

const resetForm = () => {
  newEvent.value = {
    performer_full_name: "",
    leader_full_name: "",
    group_name: "",
    scene_name: "",
    media_url: "",
    additional_info: "",
  };
  submitted.value = false;
  activeTab.value = "0";
  isEditing.value = false;
  editingId.value = null;
};

const openEditModal = (item: any) => {
  isEditing.value = true;
  editingId.value = item.id;

  newEvent.value = {
    performer_full_name: item.performer_full_name || "",
    leader_full_name: item.leader_full_name || "",
    group_name: item.group_name || "",
    scene_name: item.scene_name || "",
    media_url: item.media_url || "",
    additional_info: item.additional_info || "",
  };

  activeTab.value = item.performer_full_name ? "1" : "0";
  showRegisterModal.value = true;
};

const saveNewOrder = async () => {
  await updateScheduleOrder(eveningScheduleItems.value);
};

const handleRegister = async () => {
  submitted.value = true;

  const isKidsForm = activeTab.value === "1";
  const hasScene = !!newEvent.value.scene_name;

  const isValid = isKidsForm
    ? hasScene &&
      !!newEvent.value.performer_full_name &&
      !!newEvent.value.leader_full_name &&
      !!newEvent.value.group_name
    : hasScene;

  if (!isValid) return;

  const preparedData = {
    ...newEvent.value,
    ...(isKidsForm
      ? {}
      : { performer_full_name: "", leader_full_name: "", group_name: "" }),
  };

  if (isEditing.value && editingId.value) {
    await updateEveningSchedule(editingId.value, preparedData);
  } else {
    const itemToAdd = {
      ...preparedData,
      position: eveningScheduleItems.value.length + 1,
      created_at: new Date(),
    };
    await addEveningSchedule(itemToAdd);
  }

  showRegisterModal.value = false;
  resetForm();
};

const handleDelete = async (id: string) => {
  confirm.require({
    message: "დარწმუნებული ხარ, რომ ნომრის წაშლა გინდა?",
    header: "წაშლა",
    acceptProps: { label: "წაშლა", severity: "danger" },
    rejectProps: {
      label: "გამოსვლა",
      severity: "secondary",
      outlined: true,
    },
    accept: async () => {
      await deleteEveningSchedule(id);
    },
  });
};
</script>

<template>
  <div>
    <LoadingSpinner v-if="loadingStore && eveningScheduleItems.length <= 0" />

    <div v-else>
      <div class="flex justify-start gap-2 mt-4 mb-4">
        <Button
          label="შენახვა"
          :loading="loading"
          severity="success"
          @click="saveNewOrder"
          outlined
        />
        <Button
          label="დამატება"
          severity="info"
          @click="
            resetForm();
            showRegisterModal = true;
          "
          outlined
        />
      </div>

      <OrderList
        v-model="eveningScheduleItems"
        dataKey="id"
        breakpoint="575px"
        class="[&_.p-listbox-list-container]:max-h-[calc(100vh-150px)]! [&_.p-listbox-list-container]:min-h-[calc(100vh-150px)]!"
      >
        <template #header> საღამოს პროგრამა </template>
        <template #option="{ option, index }">
          <div class="flex flex-wrap p-2 items-center gap-3 w-full">
            <span class="font-mono font-bold text-xl text-primary">
              {{ index + 1 }}.
            </span>

            <div class="flex-1 flex flex-col gap-1">
              <div class="flex items-center gap-2">
                <span class="font-bold text-lg">{{ option.scene_name }}</span>
                <span v-if="option.performer_full_name" class="text-surface-500"
                  >|</span
                >
                <span class="font-medium">{{
                  option.performer_full_name
                }}</span>
              </div>
              <div
                v-if="option.group_name"
                class="flex items-center gap-2 text-sm text-surface-600"
              >
                <i class="pi pi-users text-xs"></i>
                <span>{{ option.group_name }}</span>
                <span v-if="option.leader_full_name" class="italic">
                  (ლიდერი: {{ option.leader_full_name }})
                </span>
              </div>
            </div>

            <div class="flex items-center border rounded-2xl">
              <Button
                icon="pi pi-pencil"
                severity="secondary"
                variant="text"
                rounded
                @click.stop="openEditModal(option)"
              />
              <Button
                icon="pi pi-trash"
                severity="danger"
                variant="text"
                rounded
                @click.stop="handleDelete(option.id)"
              />

              <a
                v-if="option.media_url"
                :href="option.media_url"
                target="_blank"
                class="p-button p-button-rounded p-button-text p-button-secondary"
                @click.stop
              >
                <i class="pi pi-play-circle text-2xl text-blue-500"></i>
              </a>
            </div>
          </div>
        </template>
      </OrderList>

      <Dialog
        v-model:visible="showRegisterModal"
        modal
        :header="isEditing ? 'ნომრის რედაქტირება' : 'ნომრის რეგისტრაცია'"
        :style="{ width: '90vw', maxWidth: '500px' }"
        class="p-fluid mx-4"
      >
        <Tabs v-model:value="activeTab">
          <TabList>
            <Tab value="0">ზოგადი</Tab>
            <Tab value="1">ბავშვის ფორმა</Tab>
          </TabList>

          <TabPanels>
            <TabPanel value="0">
              <div class="flex flex-col gap-6 pt-6">
                <div>
                  <FloatLabel variant="on">
                    <InputText
                      id="scene_name_gen"
                      v-model="newEvent.scene_name"
                      :class="{
                        'p-invalid': submitted && !newEvent.scene_name,
                      }"
                      class="w-full"
                    />
                    <label for="scene_name_gen"
                      >ნომრის სახელი <span class="text-red-500">*</span></label
                    >
                  </FloatLabel>
                  <Message
                    v-if="submitted && !newEvent.scene_name"
                    severity="error"
                    variant="simple"
                    size="small"
                    class="mt-1"
                  >
                    ნომრის დასახელება აუცილებელია
                  </Message>
                </div>
              </div>
            </TabPanel>

            <TabPanel value="1">
              <div class="flex flex-col gap-7 pt-6">
                <div>
                  <FloatLabel variant="on">
                    <InputText
                      id="performer"
                      v-model="newEvent.performer_full_name"
                      :class="{
                        'p-invalid': submitted && !newEvent.performer_full_name,
                      }"
                      class="w-full"
                    />
                    <label for="performer"
                      >ბავშვის სახელი და გვარი
                      <span class="text-red-500">*</span></label
                    >
                  </FloatLabel>
                  <Message
                    v-if="submitted && !newEvent.performer_full_name"
                    severity="error"
                    variant="simple"
                    size="small"
                    class="mt-1"
                  >
                    სახელი აუცილებელია
                  </Message>
                </div>

                <div>
                  <FloatLabel variant="on">
                    <InputText
                      id="leader"
                      v-model="newEvent.leader_full_name"
                      :class="{
                        'p-invalid': submitted && !newEvent.leader_full_name,
                      }"
                      class="w-full"
                    />
                    <label for="leader"
                      >ლიდერის სახელი და გვარი
                      <span class="text-red-500">*</span></label
                    >
                  </FloatLabel>
                  <Message
                    v-if="submitted && !newEvent.leader_full_name"
                    severity="error"
                    variant="simple"
                    size="small"
                    class="mt-1"
                  >
                    ლიდერის სახელი აუცილებელია
                  </Message>
                </div>

                <div>
                  <FloatLabel variant="on">
                    <InputText
                      id="group"
                      v-model="newEvent.group_name"
                      :class="{
                        'p-invalid': submitted && !newEvent.group_name,
                      }"
                      class="w-full"
                    />
                    <label for="group"
                      >ჯგუფის სახელი <span class="text-red-500">*</span></label
                    >
                  </FloatLabel>
                  <Message
                    v-if="submitted && !newEvent.group_name"
                    severity="error"
                    variant="simple"
                    size="small"
                    class="mt-1"
                  >
                    ჯგუფის დასახელება აუცილებელია
                  </Message>
                </div>

                <div>
                  <FloatLabel variant="on">
                    <InputText
                      id="scene_name_child"
                      v-model="newEvent.scene_name"
                      :class="{
                        'p-invalid': submitted && !newEvent.scene_name,
                      }"
                      class="w-full"
                    />
                    <label for="scene_name_child"
                      >ნომრის სახელი <span class="text-red-500">*</span></label
                    >
                  </FloatLabel>
                  <Message
                    v-if="submitted && !newEvent.scene_name"
                    severity="error"
                    variant="simple"
                    size="small"
                    class="mt-1"
                  >
                    ნომრის დასახელება აუცილებელია
                  </Message>
                </div>
              </div>
            </TabPanel>
          </TabPanels>
        </Tabs>

        <div class="flex flex-col gap-7 px-4.5 py-6">
          <FloatLabel variant="on">
            <InputText id="media" v-model="newEvent.media_url" class="w-full" />
            <label for="media">მედია ლინკი (YouTube/Drive)</label>
          </FloatLabel>

          <FloatLabel variant="on">
            <Textarea
              id="comments"
              v-model="newEvent.additional_info"
              rows="3"
              autoResize
              class="w-full"
            />
            <label for="comments">დამატებითი კომენტარი</label>
          </FloatLabel>
        </div>

        <template #footer>
          <Button
            label="გაუქმება"
            icon="pi pi-times"
            text
            @click="showRegisterModal = false"
            :disabled="loading"
          />
          <Button
            :label="isEditing ? 'განახლება' : 'გაგზავნა'"
            icon="pi pi-check"
            severity="success"
            @click="handleRegister"
            :loading="loading"
          />
        </template>
      </Dialog>
    </div>
  </div>
</template>
