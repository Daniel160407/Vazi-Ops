<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from "vue";
import { ka } from "date-fns/locale";
import { format, intervalToDuration, type Duration } from "date-fns";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Tag from "primevue/tag";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import InputText from "primevue/inputtext";
import Textarea from "primevue/textarea";
import Message from "primevue/message";
import { useEventsCrud } from "../composables/useEventsCrud";
import {
  REQUEST_PENDING,
  REQUEST_ACCEPTED,
  REQUEST_REJECTED,
} from "../composables/constants";
import type { Event as AppEvent } from "../type/interfaces";
import LoadingSpinner from "../components/UI/LoadingSpinner.vue";

const { loading, deadline, events, createEvent } = useEventsCrud();

const showRegisterModal = ref(false);
const isDeadlinePassed = ref(false);
const timeLeft = ref<Duration | null>(null);
const submitted = ref(false);

const getEmptyForm = (): Omit<AppEvent, "id"> => ({
  scene_name: "",
  performer_full_name: "",
  leader_full_name: "",
  group_name: "",
  media_url: "",
  additional_info: "",
  request_status: REQUEST_PENDING,
  created_at: new Date(),
});

const newEvent = ref(getEmptyForm());

watch(showRegisterModal, (val) => {
  if (!val) {
    submitted.value = false;
  }
});

const allRequests = computed(() => events.value);

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

const handleRegister = async () => {
  submitted.value = true;

  const isValid =
    newEvent.value.performer_full_name &&
    newEvent.value.leader_full_name &&
    newEvent.value.group_name &&
    newEvent.value.scene_name;

  if (!isValid) return;

  await createEvent(newEvent.value);
  showRegisterModal.value = false;
  newEvent.value = getEmptyForm();
  submitted.value = false;
};

let timer: number | null = null;
const updateCountdown = () => {
  if (!deadline.value?.time) return;
  const now = new Date();
  const end = new Date(deadline.value.time);
  if (now >= end) {
    timeLeft.value = null;
    isDeadlinePassed.value = true;
    return;
  }
  isDeadlinePassed.value = false;
  timeLeft.value = intervalToDuration({ start: now, end: end });
};

const countdownText = computed(() => {
  if (isDeadlinePassed.value) return "რეგისტრაცია დასრულდა";
  if (!timeLeft.value) return "ითვლება...";
  const { days, hours, minutes, seconds } = timeLeft.value;
  return `${days ? days + " დღე " : ""}${hours ?? 0}სთ ${minutes ?? 0}წთ ${
    seconds ?? 0
  }წმ`;
});

const formatDate = (dateValue?: any) => {
  if (!dateValue) return "";
  let date: Date;
  if (dateValue?.seconds) {
    date = new Date(dateValue.seconds * 1000);
  } else if (dateValue instanceof Date) {
    date = dateValue;
  } else {
    date = new Date(dateValue);
  }
  if (isNaN(date.getTime())) return "თარიღი არასწორია";
  return format(date, "d MMMM yyyy, HH:mm", { locale: ka });
};

onMounted(() => {
  updateCountdown();
  timer = window.setInterval(updateCountdown, 1000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>

<template>
  <div class="p-4">
    <LoadingSpinner v-if="(loading && events.length <= 0) || !deadline" />

    <div v-else>
      <div
        class="mb-8 text-center p-4 rounded-2xl shadow-2xl border border-slate-200"
      >
        <h2 class="text-3xl font-bold mb-4 text-white">საღამოს გამოსვლები</h2>
        <div class="flex flex-col items-center gap-4">
          <div
            class="bg-slate-900 px-4 py-4 rounded-xl border border-slate-200"
          >
            <div class="text-4xl font-mono text-yellow-400 tracking-wider">
              {{ countdownText }}
            </div>
            <p class="text-slate-400 mt-2 text-sm uppercase tracking-widest">
              რეგისტრაციის დასრულებამდე
            </p>
          </div>
          <p class="text-slate-500 italic">
            დედლაინი: {{ formatDate(deadline?.time) }}
          </p>
          <Button
            v-if="!isDeadlinePassed"
            label="ჩაწერა"
            icon="pi pi-plus-circle"
            severity="success"
            raised
            size="large"
            class="px-8"
            @click="showRegisterModal = true"
          />
        </div>
      </div>

      <div
        class="card shadow-xl rounded-lg overflow-hidden border border-slate-200"
      >
        <DataTable
          :value="allRequests"
          stripedRows
          paginator
          :rows="10"
          responsiveLayout="stack"
        >
          <template #header>
            <div
              class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left"
            >
              <div class="flex flex-col text-left">
                <span class="text-xl font-semibold"
                  >ნომრების სია და სტატუსები</span
                >
                <span class="text-xs text-slate-400 italic"
                  >ცხრილი არ ასახავს გამომსვლელთა თანმიმდევრობას</span
                >
              </div>
              <Tag severity="info" :value="`სულ: ${allRequests.length}`" />
            </div>
          </template>

          <Column field="scene_name" header="ნომერი" sortable />
          <Column field="performer_full_name" header="შემსრულებელი" sortable />
          <Column field="leader_full_name" header="ლიდერი" sortable />
          <Column field="group_name" header="ჯგუფი" sortable />
          <Column field="created_at" header="დრო" sortable>
            <template #body="{ data }">
              <span v-if="data && data.created_at">{{
                formatDate(data.created_at)
              }}</span>
              <span v-else class="text-slate-400">-</span>
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

          <template #empty>
            <div class="text-center p-8 text-slate-500">
              განაცხადები არ არის.
            </div>
          </template>
        </DataTable>
      </div>

      <Dialog
        v-model:visible="showRegisterModal"
        modal
        header="ნომრის რეგისტრაცია"
        :style="{ width: '90vw', maxWidth: '500px' }"
        class="p-fluid"
      >
        <div class="flex flex-col gap-4 py-4">
          <div class="flex flex-col gap-2">
            <label
              >ბავშვის სახელი და გვარი
              <span class="text-red-500">*</span></label
            >
            <InputText
              v-model="newEvent.performer_full_name"
              :class="{
                'p-invalid': submitted && !newEvent.performer_full_name,
              }"
            />
            <Message
              v-if="submitted && !newEvent.performer_full_name"
              severity="error"
              variant="simple"
              size="small"
              >სახელი აუცილებელია</Message
            >
          </div>

          <div class="flex flex-col gap-2">
            <label
              >ლიდერის სახელი და გვარი
              <span class="text-red-500">*</span></label
            >
            <InputText
              v-model="newEvent.leader_full_name"
              :class="{ 'p-invalid': submitted && !newEvent.leader_full_name }"
            />
            <Message
              v-if="submitted && !newEvent.leader_full_name"
              severity="error"
              variant="simple"
              size="small"
              >ლიდერის სახელი აუცილებელია</Message
            >
          </div>

          <div class="flex flex-col gap-2">
            <label>ჯგუფის სახელი <span class="text-red-500">*</span></label>
            <InputText
              v-model="newEvent.group_name"
              :class="{ 'p-invalid': submitted && !newEvent.group_name }"
            />
            <Message
              v-if="submitted && !newEvent.group_name"
              severity="error"
              variant="simple"
              size="small"
              >ჯგუფის დასახელება აუცილებელია</Message
            >
          </div>

          <div class="flex flex-col gap-2">
            <label>ნომრის სახელი <span class="text-red-500">*</span></label>
            <InputText
              v-model="newEvent.scene_name"
              placeholder="მაგ: სიმღერა, ცეკვა, დადგმა..."
              :class="{ 'p-invalid': submitted && !newEvent.scene_name }"
            />
            <Message
              v-if="submitted && !newEvent.scene_name"
              severity="error"
              variant="simple"
              size="small"
              >ნომრის დასახელება აუცილებელია</Message
            >
          </div>

          <div class="flex flex-col gap-2">
            <label>მედია ლინკი</label>
            <InputText
              v-model="newEvent.media_url"
              placeholder="მაგ: YouTube ან Google Drive ლინკი"
            />
          </div>

          <div class="flex flex-col gap-2">
            <label>დამატებითი კომენტარი</label>
            <Textarea v-model="newEvent.additional_info" rows="3" autoResize />
          </div>
        </div>

        <template #footer>
          <Button
            label="გაუქმება"
            icon="pi pi-times"
            text
            @click="showRegisterModal = false"
            :disabled="loading.value"
          />
          <Button
            label="გაგზავნა"
            icon="pi pi-check"
            severity="success"
            @click="handleRegister"
            :loading="loading.value"
          />
        </template>
      </Dialog>
    </div>
  </div>
</template>
