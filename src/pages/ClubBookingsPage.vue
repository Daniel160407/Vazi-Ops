<script setup lang="ts">
import { ref } from "vue";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import Toolbar from "primevue/toolbar";
import InputText from "primevue/inputtext";
import FloatLabel from "primevue/floatlabel";
import { useConfirm } from "primevue";
import { format } from "date-fns";
import { useClubBookingsCrud } from "../composables/useClubBookingsCrud";
import type { ClubBooking } from "../type/interfaces";

const {
  bookings,
  loading,
  fetchBookings,
  addBooking,
  updateBooking,
  deleteBooking,
} = useClubBookingsCrud();

const confirm = useConfirm();

const bookingDialogVisible = ref(false);
const isEdit = ref(false);

const editableBooking = ref<Partial<ClubBooking>>({});

const formatDateTime = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return format(date, "dd.MM.yyyy HH:mm");
};

const openNew = () => {
  isEdit.value = false;
  editableBooking.value = {
    club_id: "",
    club_name: "",
    child_first_name: "",
    child_last_name: "",
    leader_name: "",
    group_name: "",
  };
  bookingDialogVisible.value = true;
};

const openEdit = (booking: ClubBooking) => {
  isEdit.value = true;
  editableBooking.value = { ...booking };
  bookingDialogVisible.value = true;
};

const hideDialog = () => {
  bookingDialogVisible.value = false;
};

const saveBooking = async () => {
  if (
    !editableBooking.value.club_name ||
    !editableBooking.value.child_first_name ||
    !editableBooking.value.child_last_name
  ) {
    return;
  }

  if (isEdit.value && editableBooking.value.id) {
    await updateBooking(editableBooking.value as ClubBooking);
  } else {
    const { id, created_at, ...payload } = editableBooking.value;
    await addBooking(payload as Omit<ClubBooking, "id" | "created_at">);
  }

  bookingDialogVisible.value = false;
};

const confirmDelete = (booking: ClubBooking) => {
  confirm.require({
    message: "დარწმუნებული ხარ, რომ გინდა რეგისტრაციის წაშლა?",
    header: "წაშლა",
    acceptProps: {
      label: "წაშლა",
      severity: "danger",
    },
    accept: async () => {
      await deleteBooking(booking.id);
    },
  });
};
</script>

<template>
  <div class="p-4">
    <Toolbar class="mb-4">
      <template #start>
        <Button
          label="დამატება"
          icon="pi pi-plus"
          severity="info"
          @click="openNew"
        />
      </template>
      <template #end>
        <Button
          label="განახლება"
          icon="pi pi-refresh"
          outlined
          @click="fetchBookings"
        />
      </template>
    </Toolbar>

    <DataTable
      :value="bookings"
      :loading="loading"
      paginator
      :rows="10"
      dataKey="id"
      class="text-sm"
    >
      <Column field="club_name" header="წრე" sortable></Column>
      <Column field="child_first_name" header="სახელი" sortable></Column>
      <Column field="child_last_name" header="გვარი" sortable></Column>
      <Column field="leader_name" header="ლიდერი" sortable></Column>
      <Column field="group_name" header="ჯგუფი" sortable></Column>
      <Column field="created_at" header="დამატების დრო" sortable>
        <template #body="{ data }">
          {{ formatDateTime(data.created_at) }}
        </template>
      </Column>
      <Column header="მოქმედებები" :exportable="false">
        <template #body="{ data }">
          <div class="flex gap-2">
            <Button
              icon="pi pi-pencil"
              outlined
              rounded
              size="small"
              @click="openEdit(data)"
            />
            <Button
              icon="pi pi-trash"
              severity="danger"
              outlined
              rounded
              size="small"
              @click="confirmDelete(data)"
            />
          </div>
        </template>
      </Column>
    </DataTable>

    <Dialog
      v-model:visible="bookingDialogVisible"
      modal
      :header="
        isEdit ? 'რეგისტრაციის რედაქტირება' : 'ახალი რეგისტრაციის დამატება'
      "
      :style="{ width: '32rem' }"
    >
      <div class="space-y-4 pt-2">
        <FloatLabel variant="on">
          <InputText
            id="clubName"
            v-model="editableBooking.club_name"
            class="w-full"
          />
          <label for="clubName">წრე</label>
        </FloatLabel>

        <FloatLabel variant="on">
          <InputText
            id="childFirstName"
            v-model="editableBooking.child_first_name"
            class="w-full"
          />
          <label for="childFirstName">სახელი</label>
        </FloatLabel>

        <FloatLabel variant="on">
          <InputText
            id="childLastName"
            v-model="editableBooking.child_last_name"
            class="w-full"
          />
          <label for="childLastName">გვარი</label>
        </FloatLabel>

        <FloatLabel variant="on">
          <InputText
            id="leaderName"
            v-model="editableBooking.leader_name"
            class="w-full"
          />
          <label for="leaderName">ლიდერი</label>
        </FloatLabel>

        <FloatLabel variant="on">
          <InputText
            id="groupName"
            v-model="editableBooking.group_name"
            class="w-full"
          />
          <label for="groupName">ჯგუფი</label>
        </FloatLabel>
      </div>

      <template #footer>
        <Button
          label="გაუქმება"
          icon="pi pi-times"
          severity="secondary"
          outlined
          @click="hideDialog"
        />
        <Button
          label="შენახვა"
          icon="pi pi-check"
          :loading="loading"
          @click="saveBooking"
        />
      </template>
    </Dialog>
  </div>
</template>
