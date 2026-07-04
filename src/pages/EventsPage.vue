<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { ka } from "date-fns/locale";
import { format, intervalToDuration, type Duration } from "date-fns";
import { useEventsCrud } from "../composables/useEventsCrud";
import { useAuth } from "../composables/useAuth";
import { useToast } from "primevue";
import { REQUEST_PENDING, REQUEST_ACCEPTED, REQUEST_REJECTED } from "../composables/constants";
import type { Event as AppEvent } from "../type/interfaces";
import LoadingSpinner from "../components/UI/LoadingSpinner.vue";
import InfoRow from "../components/UI/InfoRow.vue";
import BottomSheet from "../components/UI/BottomSheet.vue";
import SheetField from "../components/UI/SheetField.vue";
import AppButton from "../components/UI/AppButton.vue";
import AppInput from "../components/UI/AppInput.vue";

const { loading, deadline, events, createEvent } = useEventsCrud();
const { fullName, userGroupName } = useAuth();
const toast = useToast();

const isDeadlinePassed = ref(false);
const timeLeft = ref<Duration | null>(null);
let timer: number | null = null;

const updateCountdown = () => {
  if (!deadline.value?.time) return;
  const now = new Date();
  const end = new Date(deadline.value.time);
  if (now >= end) {
    isDeadlinePassed.value = true;
    timeLeft.value = null;
    return;
  }
  isDeadlinePassed.value = false;
  timeLeft.value = intervalToDuration({ start: now, end });
};

onMounted(() => {
  updateCountdown();
  timer = window.setInterval(updateCountdown, 1000);
});
onUnmounted(() => {
  if (timer) clearInterval(timer);
});

const pad = (n?: number) => String(n ?? 0).padStart(2, "0");

const countdownUnits = computed(() => {
  if (!timeLeft.value) return null;
  const { hours, minutes, seconds } = timeLeft.value;
  return [
    { value: pad(hours), label: "სთ" },
    { value: pad(minutes), label: "წთ" },
    { value: pad(seconds), label: "წმ" },
  ];
});

const formatDate = (dateValue?: any) => {
  if (!dateValue) return "";
  const date = dateValue?.seconds ? new Date(dateValue.seconds * 1000) : new Date(dateValue);
  if (isNaN(date.getTime())) return "თარიღი არასწორია";
  return format(date, "d MMMM yyyy, HH:mm", { locale: ka });
};

const statusMeta = (status: string) => {
  if (status === REQUEST_ACCEPTED) return { label: "დადასტურებული", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25" };
  if (status === REQUEST_REJECTED) return { label: "უარყოფილი", cls: "bg-red-500/15 text-red-400 border-red-500/25" };
  return { label: "მოლოდინში", cls: "bg-amber-500/15 text-amber-400 border-amber-500/25" };
};

const activeFilter = ref<"all" | "pending" | "accepted" | "rejected">("all");

const filters = [
  { key: "all", label: "ყველა" },
  { key: "pending", label: "მოლოდინში" },
  { key: "accepted", label: "დადასტურებული" },
  { key: "rejected", label: "უარყოფილი" },
] as const;

const statusMap: Record<string, string> = {
  pending: REQUEST_PENDING, accepted: REQUEST_ACCEPTED, rejected: REQUEST_REJECTED,
};

const filteredEvents = computed(() => {
  if (activeFilter.value === "all") return events.value;
  return events.value.filter((e) => e.request_status === statusMap[activeFilter.value]);
});

const sheetVisible = ref(false);
const submitted = ref(false);

const getEmptyForm = (): Omit<AppEvent, "id"> => ({
  scene_name: "", performer_full_name: "", leader_full_name: fullName.value, group_name: userGroupName.value,
  media_url: "", additional_info: "", request_status: REQUEST_PENDING, created_at: new Date(),
});

const form = ref(getEmptyForm());

const openSheet = () => {
  form.value = getEmptyForm();
  submitted.value = false;
  sheetVisible.value = true;
};

const closeSheet = () => {
  sheetVisible.value = false;
  submitted.value = false;
};

watch(sheetVisible, (v) => {
  if (!v) submitted.value = false;
});

const handleRegister = async () => {
  submitted.value = true;
  if (!form.value.performer_full_name || !form.value.leader_full_name || !form.value.group_name || !form.value.scene_name) {
    toast.add({ severity: "warn", summary: "შეავსე ყველა სავალდებულო ველი", life: 3000 });
    return;
  }
  await createEvent(form.value);
  closeSheet();
};
</script>

<template>
  <div class="pb-4">
    <LoadingSpinner v-if="loading && events.length === 0 && !deadline" />

    <div v-else>
      <div class="mb-5 overflow-hidden rounded-3xl border border-blue-900/30 bg-[#0d1829]">
        <div class="p-5">
          <p class="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">საღამოს ნომრები</p>

          <div v-if="!isDeadlinePassed && countdownUnits" class="mb-4 flex gap-2">
            <div
              v-for="unit in countdownUnits"
              :key="unit.label"
              class="flex flex-1 flex-col items-center rounded-2xl border border-yellow-900/30 bg-[#07101e] py-4"
            >
              <span class="font-mono text-4xl font-bold tabular-nums tracking-wider text-yellow-400">{{ unit.value }}</span>
              <span class="mt-1 text-[10px] font-bold uppercase tracking-widest text-yellow-900">{{ unit.label }}</span>
            </div>
          </div>

          <div v-else-if="isDeadlinePassed" class="mb-4 flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3">
            <i class="pi pi-lock text-red-400" />
            <span class="text-sm font-semibold text-red-400">რეგისტრაცია დასრულდა</span>
          </div>

          <div v-else class="mb-4 flex h-16 items-center justify-center">
            <i class="pi pi-spin pi-spinner text-slate-500" />
          </div>

          <div class="mb-4 flex items-center gap-2 text-xs text-slate-600">
            <i class="pi pi-calendar" />
            <span>დედლაინი: {{ formatDate(deadline?.time) || "—" }}</span>
          </div>

          <AppButton
            v-if="!isDeadlinePassed"
            variant="primary"
            icon="pi-plus-circle"
            rounded="2xl"
            class="w-full active:scale-95"
            @click="openSheet"
          >
            რეგისტრაცია
          </AppButton>
        </div>
      </div>

      <div class="mb-4 grid grid-cols-3 gap-2">
        <div class="rounded-xl border border-blue-900/20 bg-[#0d1829] p-3 text-center">
          <p class="text-xl font-bold text-white">{{ events.length }}</p>
          <p class="text-[10px] text-slate-600">სულ</p>
        </div>
        <div class="rounded-xl border border-amber-900/20 bg-[#0d1829] p-3 text-center">
          <p class="text-xl font-bold text-amber-400">{{ events.filter((e) => e.request_status === REQUEST_PENDING).length }}</p>
          <p class="text-[10px] text-slate-600">მოლოდინში</p>
        </div>
        <div class="rounded-xl border border-emerald-900/20 bg-[#0d1829] p-3 text-center">
          <p class="text-xl font-bold text-emerald-400">{{ events.filter((e) => e.request_status === REQUEST_ACCEPTED).length }}</p>
          <p class="text-[10px] text-slate-600">დადასტურებული</p>
        </div>
      </div>

      <div class="mb-4 grid grid-cols-2 sm:grid-cols-4 gap-2 overflow-x-auto pb-1">
        <AppButton
          v-for="f in filters"
          :key="f.key"
          variant="filter"
          :active="activeFilter === f.key"
          @click="activeFilter = f.key"
        >
          {{ f.label }}
        </AppButton>
      </div>

      <p v-if="filteredEvents.length === 0" class="py-10 text-center text-sm text-slate-600">
        ნომრები არ მოიძებნა
      </p>

      <div class="flex flex-col gap-3">
        <div
          v-for="event in filteredEvents"
          :key="event.id"
          class="rounded-2xl border border-blue-900/20 bg-[#0d1829] p-4"
        >
          <div class="mb-3 flex items-start justify-between gap-2">
            <h3 class="font-bold text-white">{{ event.scene_name }}</h3>
            <span class="shrink-0 rounded-lg border px-2 py-0.5 text-xs font-semibold" :class="statusMeta(event.request_status).cls">
              {{ statusMeta(event.request_status).label }}
            </span>
          </div>

          <div class="flex flex-col gap-1.5">
            <InfoRow icon="pi-user"><span class="text-sm text-slate-400">{{ event.performer_full_name }}</span></InfoRow>
            <InfoRow icon="pi-users"><span class="text-sm text-slate-400">{{ event.leader_full_name }} · {{ event.group_name }}</span></InfoRow>
            <InfoRow v-if="event.media_url" icon="pi-link">
              <a :href="event.media_url" target="_blank" class="text-sm text-blue-400 underline underline-offset-2 hover:text-blue-300">მედია ლინკი</a>
            </InfoRow>
            <InfoRow v-if="event.additional_info" icon="pi-comment">
              <span class="text-sm leading-relaxed text-slate-500">{{ event.additional_info }}</span>
            </InfoRow>
          </div>
        </div>
      </div>
    </div>

    <BottomSheet :visible="sheetVisible" title="ნომრის ჩაწერა" @close="closeSheet">
      <div class="flex flex-col gap-4">
        <SheetField label="ბავშვის სახელი და გვარი" :required="true" :error="submitted && !form.performer_full_name ? 'სავალდებულოა' : ''">
          <AppInput v-model="form.performer_full_name" :error="submitted && !form.performer_full_name" />
        </SheetField>

        <SheetField label="ლიდერის სახელი და გვარი" :required="true" :error="submitted && !form.leader_full_name ? 'სავალდებულოა' : ''">
          <AppInput v-model="form.leader_full_name" :error="submitted && !form.leader_full_name" />
        </SheetField>

        <div class="grid grid-cols-2 gap-3">
          <SheetField label="ჯგუფის სახელი" :required="true" :error="submitted && !form.group_name ? 'სავალდებულოა' : ''">
            <AppInput v-model="form.group_name" :error="submitted && !form.group_name" />
          </SheetField>
          <SheetField label="ნომრის სახელი" :required="true" :error="submitted && !form.scene_name ? 'სავალდებულოა' : ''">
            <AppInput v-model="form.scene_name" placeholder="სიმღერა, ცეკვა..." :error="submitted && !form.scene_name" />
          </SheetField>
        </div>

        <SheetField label="მედია ლინკი">
          <AppInput v-model="form.media_url" type="url" placeholder="YouTube, Google Drive..." />
        </SheetField>

        <SheetField label="დამატებითი კომენტარი">
          <textarea
            v-model="form.additional_info"
            rows="3"
            class="w-full resize-none rounded-xl border border-blue-900/30 bg-[#0d1829] px-4 py-3 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-blue-700/60"
          />
        </SheetField>
      </div>

      <div class="mt-5 flex gap-3">
        <AppButton variant="ghost" @click="closeSheet">გაუქმება</AppButton>
        <AppButton variant="primary" :disabled="loading" class="flex-1" icon="pi-check" @click="handleRegister">
          გაგზავნა
        </AppButton>
      </div>
    </BottomSheet>
  </div>
</template>
