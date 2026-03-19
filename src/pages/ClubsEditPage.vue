<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useGlobalStore } from "../stores/GlobalStore";
import { ref, watch } from "vue";
import type { Club } from "../type/interfaces";
import InputText from "primevue/inputtext";
import InputNumber from "primevue/inputnumber";
import Button from "primevue/button";
import FloatLabel from "primevue/floatlabel";
import Dialog from "primevue/dialog";
import DatePicker from "primevue/datepicker";
import { Textarea, useConfirm } from "primevue";
import { useClubsCrud } from "../composables/useClubsCrud";
import LoadingSpinner from "../components/UI/LoadingSpinner.vue";

const { loading, clubs } = storeToRefs(useGlobalStore());
const { addClub, updateClub, deleteClub } = useClubsCrud();
const confirm = useConfirm();

const editingClubs = ref<Club[]>([]);

const displayAddDialog = ref(false);
const newClub = ref<Omit<Club, "id">>({
  name: "",
  teacher: "",
  places_quantity: 0,
  place: "",
  time: new Date(),
  additional_info: "",
});

const openAddDialog = () => {
  displayAddDialog.value = true;
};

const handleAddClub = async () => {
  await addClub(newClub.value);

  displayAddDialog.value = false;
  newClub.value = {
    name: "",
    teacher: "",
    places_quantity: 0,
    place: "",
    time: new Date(),
    additional_info: "",
  };
};

const handleSaveClub = async (club: Club) => {
  await updateClub(club);
};

const handleDeleteClub = (id: string) => {
  confirm.require({
    message: "დარწმუნებული ხარ, რომ წრის წაშლა გინდა?",
    header: "წაშლა",
    acceptProps: {
      label: "წაშლა",
      severity: "danger",
    },
    rejectProps: {
      label: "გამოსვლა",
      severity: "secondary",
    },
    accept: async () => {
      await deleteClub(id);
    },
  });
};

watch(
  clubs,
  (newClubs) => {
    editingClubs.value = newClubs.map((club) => ({
      ...club,
      time: new Date(club.time),
    }));
  },
  { deep: true, immediate: true }
);
</script>

<template>
  <div>
    <LoadingSpinner v-if="loading" />

    <div v-else>
      <div class="mb-4">
        <Button
          label="დამატება"
          icon="pi pi-plus"
          @click="openAddDialog"
          severity="info"
        />
      </div>

      <div
        class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
      >
        <div
          v-for="club in editingClubs"
          :key="club.id"
          class="flex flex-col gap-5 rounded-xl p-4 border border-solid"
        >
          <div class="space-y-6">
            <FloatLabel variant="on">
              <InputText
                id="name"
                v-model="club.name"
                class="w-full text-center font-bold"
              />
              <label for="name">წრის სახელი</label>
            </FloatLabel>

            <FloatLabel variant="on">
              <InputText id="teacher" v-model="club.teacher" class="w-full" />
              <label for="teacher">მასწავლებელი</label>
            </FloatLabel>

            <FloatLabel variant="on">
              <InputNumber
                id="places_quantity"
                v-model="club.places_quantity"
                class="w-full"
              />
              <label for="places_quantity">ადგილების რაოდენობა</label>
            </FloatLabel>

            <FloatLabel variant="on">
              <InputText id="place" v-model="club.place" class="w-full" />
              <label for="place">ადგილმდებარეობა</label>
            </FloatLabel>

            <FloatLabel variant="on">
              <DatePicker
                v-model="club.time"
                showIcon
                fluid
                iconDisplay="input"
                timeOnly
                inputId="time"
                class="w-full"
              >
                <template #inputicon="slotProps">
                  <i class="pi pi-clock" @click="slotProps.clickCallback" />
                </template>
              </DatePicker>
              <label for="time">დრო</label>
            </FloatLabel>

            <FloatLabel variant="on">
              <Textarea
                v-model="club.additional_info"
                class="w-full"
                rows="3"
              ></Textarea>
              <label>დამატებითი ინფორმაცია</label>
            </FloatLabel>
          </div>

          <div class="flex flex-col sm:flex-row gap-3">
            <Button
              label="წაშლა"
              icon="pi pi-trash"
              severity="danger"
              @click="handleDeleteClub(club.id)"
              class="flex-1"
              outlined
            />
            <Button
              label="შენახვა"
              icon="pi pi-save"
              severity="success"
              @click="handleSaveClub(club)"
              class="mt-auto flex-1"
              outlined
            />
          </div>
        </div>
      </div>

      <Dialog
        v-model:visible="displayAddDialog"
        modal
        header="ახალი წრის დამატება"
        class="mx-4"
      >
        <div class="space-y-6 pt-4">
          <FloatLabel variant="on">
            <InputText id="newName" v-model="newClub.name" class="w-full" />
            <label for="newName">წრის სახელი</label>
          </FloatLabel>

          <FloatLabel variant="on">
            <InputText
              id="newTeacher"
              v-model="newClub.teacher"
              class="w-full"
            />
            <label for="newTeacher">მასწავლებელი</label>
          </FloatLabel>

          <FloatLabel variant="on">
            <InputNumber
              id="newPlacesQuantity"
              v-model="newClub.places_quantity"
              class="w-full"
            />
            <label for="newPlacesQuantity">ადგილების რაოდენობა</label>
          </FloatLabel>

          <FloatLabel variant="on">
            <InputText id="newPlace" v-model="newClub.place" class="w-full" />
            <label for="newPlace">ადგილმდებარეობა</label>
          </FloatLabel>

          <FloatLabel variant="on">
            <DatePicker
              v-model="newClub.time"
              showIcon
              fluid
              iconDisplay="input"
              timeOnly
              inputId="newTime"
              class="w-full"
            >
              <template #inputicon="slotProps">
                <i class="pi pi-clock" @click="slotProps.clickCallback" />
              </template>
            </DatePicker>
            <label for="newTime">დრო</label>
          </FloatLabel>

          <FloatLabel variant="on">
            <Textarea
              v-model="newClub.additional_info"
              class="w-full"
              rows="4"
            ></Textarea>
            <label>დამატებითი ინფორმაცია</label>
          </FloatLabel>
        </div>

        <template #footer>
          <Button
            label="გაუქმება"
            icon="pi pi-times"
            @click="displayAddDialog = false"
            severity="secondary"
            outlined
          />
          <Button
            label="დამატება"
            icon="pi pi-check"
            @click="handleAddClub"
            severity="success"
            autofocus
          />
        </template>
      </Dialog>
    </div>
  </div>
</template>
