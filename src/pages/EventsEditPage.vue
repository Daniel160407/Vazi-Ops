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
import { useEventsCrud } from "../composables/useEventsCrud";
import {
  REQUEST_PENDING,
  REQUEST_ACCEPTED,
  REQUEST_REJECTED,
} from "../composables/constants";
import { DatePicker, useConfirm } from "primevue";
import { useSchedulesCrud } from "../composables/useSchedulesCrud";
import type { EveningScheduleItem, Event } from "../type/interfaces";
import LoadingSpinner from "../components/UI/LoadingSpinner.vue";

const globalstore = useGlobalStore();
const { loading: loadingStore, deadline, events } = storeToRefs(globalstore);
const { loading, updateEventStatus, deleteEvent, updateDeadline } =
  useEventsCrud();
const { addEveningSchedule } = useSchedulesCrud();
const confirm = useConfirm();

const newDeadlineDate = ref<Date | null>(null);

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
    rejectProps: {
      label: "გამოსვლა",
      severity: "secondary",
      outlined: true,
    },
    accept: async () => {
      await deleteEvent(id);
      await globalstore.fetchEvents();
    },
  });
};

const handleAddItemToSchedule = async (event: Event) => {
  const scheduleItem: Omit<EveningScheduleItem, "id"> = {
    scene_name: event.scene_name,
    performer_full_name: event.performer_full_name,
    leader_full_name: event.leader_full_name,
    group_name: event.group_name,
    media_url: event.media_url,
    position: 0,
    created_at: new Date(),
  };

  await addEveningSchedule(scheduleItem);
};

watch(
  deadline,
  (newVal) => {
    if (newVal?.time) newDeadlineDate.value = new Date(newVal.time);
  },
  { immediate: true }
);
</script>

<template>
  <div>
    <LoadingSpinner v-if="loadingStore" />

    <div v-else class="p-4 space-y-6">
      <div class="card p-4 border border-slate-700 rounded-xl shadow-lg">
        <h3 class="text-xl font-bold mb-4 text-white">რეგისტრაციის დედლაინი</h3>
        <div class="flex flex-wrap items-end gap-4">
          <div class="flex flex-col gap-2">
            <DatePicker
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
            :loading="loading.value"
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
                  v-if="data.request_status === REQUEST_ACCEPTED"
                  icon="pi pi-calendar"
                  severity="info"
                  rounded
                  size="small"
                  @click="handleAddItemToSchedule(data)"
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
  </div>
</template>
