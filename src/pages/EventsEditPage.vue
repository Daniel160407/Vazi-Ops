<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useGlobalStore } from "../stores/GlobalStore";
import { ref, watch } from "vue";
import { ka } from "date-fns/locale";
import { format } from "date-fns";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Tag from "primevue/tag";
import Button from "primevue/button";
import Calendar from "primevue/calendar";
import { useEventsCrud } from "../composables/useEventsCrud";
import {
  REQUEST_PENDING,
  REQUEST_ACCEPTED,
  REQUEST_REJECTED,
} from "../composables/constants";
import { useConfirm } from "primevue";

const globalstore = useGlobalStore();
const { deadline, events } = storeToRefs(globalstore);
const { loading, updateEventStatus, deleteEvent, updateDeadline } =
  useEventsCrud();
const confirm = useConfirm();

const newDeadlineDate = ref<Date | null>(null);

watch(
  deadline,
  (newVal) => {
    if (newVal?.time) newDeadlineDate.value = new Date(newVal.time);
  },
  { immediate: true }
);

const setStatus = async (eventId: string, status: string) => {
  await updateEventStatus(eventId, status);
  await globalstore.fetchEvents();
};

const handleUpdateDeadline = async () => {
  if (!newDeadlineDate.value) return;
  await updateDeadline(deadline.value?.id, newDeadlineDate.value);
  await globalstore.fetchDeadline();
};

const getStatusSeverity = (status: string) => {
  if (status === REQUEST_ACCEPTED) return "success";
  if (status === REQUEST_PENDING) return "warn";
  if (status === REQUEST_REJECTED) return "danger";
  return "info";
};

const getStatusLabel = (status: string) => {
  if (status === REQUEST_ACCEPTED) return "დადასტურებული";
  if (status === REQUEST_PENDING) return "მოლოდინში";
  if (status === REQUEST_REJECTED) return "უარყოფილი";
  return status;
};

const formatDate = (dateValue?: any) => {
  if (!dateValue) return "-";
  let date = dateValue?.seconds
    ? new Date(dateValue.seconds * 1000)
    : new Date(dateValue);
  return isNaN(date.getTime())
    ? "შეცდომა"
    : format(date, "d MMM, HH:mm", { locale: ka });
};

const handleDelete = async (id: string) => {
  confirm.require({
    message: "დარწმუნებული ხარ, რომ ნომრის წაშლა გინდა?",
    header: "წაშლა",
    acceptProps: { label: "წაშლა", severity: "danger" },
    accept: async () => {
      await deleteEvent(id);
      await globalstore.fetchEvents();
    },
  });
};
</script>

<template>
  <div class="p-4 space-y-6">
    <div class="card p-4 border border-slate-700 rounded-xl shadow-lg">
      <h3 class="text-xl font-bold mb-4 text-white">რეგისტრაციის დედლაინი</h3>
      <div class="flex flex-wrap items-end gap-4">
        <div class="flex flex-col gap-2">
          <Calendar
            v-model="newDeadlineDate"
            showTime
            hourFormat="24"
            dateFormat="dd/mm/yy"
            placeholder="აირჩიეთ დრო"
          />
        </div>
        <Button
          label="განახლება"
          icon="pi pi-clock"
          @click="handleUpdateDeadline"
          :loading="loading"
          severity="help"
        />
      </div>
    </div>

    <div
      class="card shadow-2xl rounded-lg overflow-hidden border border-slate-700"
    >
      <DataTable
        :value="events"
        stripedRows
        paginator
        :rows="20"
        responsiveLayout="stack"
        class="p-datatable-sm"
        sortField="created_at"
        :sortOrder="-1"
      >
        <template #header>
          <div class="flex justify-between items-center">
            <span class="text-xl font-bold text-white">ნომრების მართვა</span>
            <Button
              icon="pi pi-refresh"
              rounded
              text
              @click="globalstore.fetchEvents()"
            />
          </div>
        </template>

        <Column field="scene_name" header="ნომერი" sortable />
        <Column field="performer_full_name" header="შემსრულებელი" sortable />
        <Column field="leader_full_name" header="ლიდერი" sortable />
        <Column field="group_name" header="ჯგუფი" sortable />

        <Column header="მედია">
          <template #body="{ data }">
            <a
              v-if="data.media_url"
              :href="data.media_url"
              target="_blank"
              class="text-blue-400 hover:text-blue-300 underline"
            >
              <i class="pi pi-external-link"></i>
            </a>
            <span v-else class="text-slate-500">-</span>
          </template>
        </Column>

        <Column header="კომენტარი">
          <template #body="{ data }">
            <p v-if="data.additional_info">{{ data.additional_info }}</p>
            <span v-else class="text-slate-600">-</span>
          </template>
        </Column>

        <Column header="დრო" field="created_at" sortable>
          <template #body="{ data }">
            <span class="text-sm">{{ formatDate(data.created_at) }}</span>
          </template>
        </Column>

        <Column header="სტატუსი" field="request_status" sortable>
          <template #body="{ data }">
            <Tag
              :severity="getStatusSeverity(data.request_status)"
              :value="getStatusLabel(data.request_status)"
            />
          </template>
        </Column>

        <Column header="მოქმედება" class="min-w-40">
          <template #body="{ data }">
            <div class="flex gap-2">
              <Button
                v-if="data.request_status !== REQUEST_ACCEPTED"
                icon="pi pi-check"
                severity="success"
                rounded
                size="small"
                @click="setStatus(data.id, REQUEST_ACCEPTED)"
                outlined
              />
              <Button
                v-if="data.request_status !== REQUEST_REJECTED"
                icon="pi pi-times"
                severity="danger"
                rounded
                size="small"
                @click="setStatus(data.id, REQUEST_REJECTED)"
                outlined
              />
              <Button
                icon="pi pi-trash"
                severity="danger"
                text
                rounded
                size="small"
                class="ml-auto"
                @click="handleDelete(data.id)"
              />
            </div>
          </template>
        </Column>

        <template #empty>
          <div class="p-4 text-center text-slate-500">
            მონაცემები არ მოიძებნა
          </div>
        </template>
      </DataTable>
    </div>
  </div>
</template>
