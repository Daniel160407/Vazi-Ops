<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { storeToRefs } from "pinia";
import { ka } from "date-fns/locale";
import { format } from "date-fns";
import DatePicker from "primevue/datepicker";
import { useConfirm } from "primevue";
import { useGlobalStore } from "../stores/GlobalStore";
import { useEventsCrud } from "../composables/useEventsCrud";
import { useSchedulesCrud } from "../composables/useSchedulesCrud";
import {
  REQUEST_PENDING,
  REQUEST_ACCEPTED,
  REQUEST_REJECTED,
} from "../composables/constants";
import type { EveningScheduleItem, Event } from "../type/interfaces";
import LoadingSpinner from "../components/UI/LoadingSpinner.vue";

const globalStore = useGlobalStore();
const { loading: loadingStore, deadline, events } = storeToRefs(globalStore);
const { loading, updateEventStatus, deleteEvent, updateDeadline } =
  useEventsCrud();
const { addEveningSchedule } = useSchedulesCrud();
const confirm = useConfirm();
const newDeadlineDate = ref<Date | null>(null);

watch(
  deadline,
  (val) => {
    if (val?.time) newDeadlineDate.value = new Date(val.time);
  },
  { immediate: true },
);

const handleUpdateDeadline = async () => {
  if (!newDeadlineDate.value) return;
  await updateDeadline(deadline.value?.id, newDeadlineDate.value);
};

const setStatus = async (eventId: string, status: string) => {
  await updateEventStatus(eventId, status);
};

const handleDelete = (id: string) => {
  confirm.require({
    message: "დარწმუნებული ხარ, რომ ნომრის წაშლა გინდა?",
    header: "წაშლა",
    acceptProps: { label: "წაშლა", severity: "danger" },
    rejectProps: { label: "გაუქმება", severity: "secondary", outlined: true },
    accept: async () => {
      await deleteEvent(id);
    },
  });
};

const handleAddToSchedule = async (event: Event) => {
  const item: Omit<EveningScheduleItem, "id"> = {
    scene_name: event.scene_name,
    performer_full_name: event.performer_full_name,
    leader_full_name: event.leader_full_name,
    group_name: event.group_name,
    media_url: event.media_url,
    position: 0,
    created_at: new Date(),
  };
  await addEveningSchedule(item);
};

const activeFilter = ref<"all" | "pending" | "accepted" | "rejected">("all");

const filters = [
  { key: "all", label: "ყველა" },
  { key: "pending", label: "მოლოდინი" },
  { key: "accepted", label: "დადასტური." },
  { key: "rejected", label: "უარყოფილი" },
] as const;

const statusMap: Record<string, string> = {
  pending: REQUEST_PENDING,
  accepted: REQUEST_ACCEPTED,
  rejected: REQUEST_REJECTED,
};

const filteredEvents = computed(() => {
  const sorted = [...events.value].sort((a, b) => {
    const ta =
      a.created_at instanceof Date
        ? a.created_at.getTime()
        : new Date(a.created_at).getTime();
    const tb =
      b.created_at instanceof Date
        ? b.created_at.getTime()
        : new Date(b.created_at).getTime();
    return tb - ta;
  });
  if (activeFilter.value === "all") return sorted;
  return sorted.filter(
    (e) => e.request_status === statusMap[activeFilter.value],
  );
});

const statusMeta = (status: string) => {
  if (status === REQUEST_ACCEPTED)
    return {
      label: "დადასტურებული",
      cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
    };
  if (status === REQUEST_REJECTED)
    return {
      label: "უარყოფილი",
      cls: "bg-red-500/15 text-red-400 border-red-500/25",
    };
  return {
    label: "მოლოდინში",
    cls: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  };
};

const accentBorder = (status: string) => {
  if (status === REQUEST_ACCEPTED) return "border-l-emerald-500/50";
  if (status === REQUEST_REJECTED) return "border-l-red-500/50";
  return "border-l-amber-500/50";
};

const formatDate = (dateValue?: any) => {
  if (!dateValue) return "—";
  const date = dateValue?.seconds
    ? new Date(dateValue.seconds * 1000)
    : new Date(dateValue);
  return isNaN(date.getTime())
    ? "—"
    : format(date, "d MMM, HH:mm", { locale: ka });
};
</script>

<template>
  <div class="pb-4">
    <LoadingSpinner v-if="loadingStore && events.length === 0" />

    <div v-else>
      <div class="mb-5 rounded-2xl border border-blue-900/20 bg-[#0d1829] p-4">
        <p
          class="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500"
        >
          რეგისტრაციის დედლაინი
        </p>
        <div class="flex items-end gap-3">
          <div class="flex-1">
            <DatePicker
              v-model="newDeadlineDate"
              showTime
              hourFormat="24"
              dateFormat="dd/mm/yy"
              placeholder="აირჩიე თარიღი და დრო"
              fluid
              :pt="{
                input: {
                  class:
                    'rounded-xl border border-blue-900/30 bg-[#07101e] px-4 py-3 text-sm text-slate-200 w-full outline-none',
                },
              }"
            />
          </div>
          <button
            @click="handleUpdateDeadline"
            :disabled="loading || !newDeadlineDate"
            class="flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-blue-500 disabled:opacity-50"
          >
            <i class="pi pi-check" />
            შენახვა
          </button>
        </div>
      </div>

      <div class="mb-4 grid grid-cols-4 gap-2">
        <div
          class="rounded-xl border border-blue-900/20 bg-[#0d1829] p-3 text-center"
        >
          <p class="text-lg font-bold text-white">{{ events.length }}</p>
          <p class="text-[10px] text-slate-600">სულ</p>
        </div>
        <div
          class="rounded-xl border border-amber-900/20 bg-[#0d1829] p-3 text-center"
        >
          <p class="text-lg font-bold text-amber-400">
            {{
              events.filter((e) => e.request_status === REQUEST_PENDING).length
            }}
          </p>
          <p class="text-[10px] text-slate-600">მოლოდინში</p>
        </div>
        <div
          class="rounded-xl border border-emerald-900/20 bg-[#0d1829] p-3 text-center"
        >
          <p class="text-lg font-bold text-emerald-400">
            {{
              events.filter((e) => e.request_status === REQUEST_ACCEPTED).length
            }}
          </p>
          <p class="text-[10px] text-slate-600">დადასტურებ.</p>
        </div>
        <div
          class="rounded-xl border border-red-900/20 bg-[#0d1829] p-3 text-center"
        >
          <p class="text-lg font-bold text-red-400">
            {{
              events.filter((e) => e.request_status === REQUEST_REJECTED).length
            }}
          </p>
          <p class="text-[10px] text-slate-600">უარყოფილი</p>
        </div>
      </div>

      <div class="mb-4 flex gap-2 overflow-x-auto pb-1">
        <button
          v-for="f in filters"
          :key="f.key"
          @click="activeFilter = f.key"
          class="shrink-0 cursor-pointer rounded-xl px-3 py-1.5 text-xs font-semibold transition-all"
          :class="
            activeFilter === f.key
              ? 'bg-blue-600 text-white'
              : 'border border-blue-900/20 bg-[#0d1829] text-slate-500 hover:text-slate-300'
          "
        >
          {{ f.label }}
        </button>
      </div>

      <p
        v-if="filteredEvents.length === 0"
        class="py-10 text-center text-sm text-slate-600"
      >
        ნომრები არ მოიძებნა
      </p>

      <div class="flex flex-col gap-3">
        <div
          v-for="event in filteredEvents"
          :key="event.id"
          class="overflow-hidden rounded-2xl border border-l-4 border-blue-900/20 bg-[#0d1829]"
          :class="accentBorder(event.request_status)"
        >
          <div class="p-4">
            <div class="mb-3 flex items-start justify-between gap-2">
              <h3 class="font-bold leading-tight text-white">
                {{ event.scene_name }}
              </h3>
              <span
                class="shrink-0 rounded-lg border px-2 py-0.5 text-xs font-semibold"
                :class="statusMeta(event.request_status).cls"
              >
                {{ statusMeta(event.request_status).label }}
              </span>
            </div>

            <div class="mb-3 flex flex-col gap-1.5">
              <div class="flex items-center gap-2.5">
                <div
                  class="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-900/30"
                >
                  <i class="pi pi-user text-[10px] text-blue-400" />
                </div>
                <span class="text-sm text-slate-400">{{
                  event.performer_full_name
                }}</span>
              </div>
              <div class="flex items-center gap-2.5">
                <div
                  class="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-900/30"
                >
                  <i class="pi pi-users text-[10px] text-blue-400" />
                </div>
                <span class="text-sm text-slate-400"
                  >{{ event.leader_full_name }} · {{ event.group_name }}</span
                >
              </div>
              <div v-if="event.media_url" class="flex items-center gap-2.5">
                <div
                  class="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-900/30"
                >
                  <i class="pi pi-link text-[10px] text-blue-400" />
                </div>
                <a
                  :href="event.media_url"
                  target="_blank"
                  class="text-sm text-blue-400 underline underline-offset-2 hover:text-blue-300"
                >
                  მედია
                </a>
              </div>
              <div
                v-if="event.additional_info"
                class="flex items-start gap-2.5"
              >
                <div
                  class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-900/30"
                >
                  <i class="pi pi-comment text-[10px] text-blue-400" />
                </div>
                <span class="text-sm leading-relaxed text-slate-500">{{
                  event.additional_info
                }}</span>
              </div>
              <div class="flex items-center gap-2.5">
                <div
                  class="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-900/30"
                >
                  <i class="pi pi-clock text-[10px] text-blue-400" />
                </div>
                <span class="text-xs text-slate-600">{{
                  formatDate(event.created_at)
                }}</span>
              </div>
            </div>

            <div class="flex gap-2 border-t border-blue-900/20 pt-3">
              <button
                v-if="event.request_status !== REQUEST_ACCEPTED"
                @click="setStatus(event.id, REQUEST_ACCEPTED)"
                :disabled="loading"
                class="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-emerald-900/30 bg-emerald-500/10 py-2 text-xs font-semibold text-emerald-400 transition-all hover:bg-emerald-500/20 disabled:opacity-50"
              >
                <i class="pi pi-check text-xs" /> დადასტურება
              </button>
              <button
                v-if="event.request_status !== REQUEST_REJECTED"
                @click="setStatus(event.id, REQUEST_REJECTED)"
                :disabled="loading"
                class="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-red-900/30 bg-red-500/10 py-2 text-xs font-semibold text-red-400 transition-all hover:bg-red-500/20 disabled:opacity-50"
              >
                <i class="pi pi-times text-xs" /> უარყოფა
              </button>
              <button
                v-if="event.request_status === REQUEST_ACCEPTED"
                @click="handleAddToSchedule(event)"
                :disabled="loading"
                class="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-blue-900/30 bg-blue-500/10 py-2 text-xs font-semibold text-blue-400 transition-all hover:bg-blue-500/20 disabled:opacity-50"
              >
                <i class="pi pi-calendar text-xs" /> დამატება
              </button>
              <button
                @click="handleDelete(event.id)"
                class="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-red-900/20 bg-red-500/5 text-red-500/60 transition-all hover:bg-red-500/15 hover:text-red-400"
              >
                <i class="pi pi-trash text-xs" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
