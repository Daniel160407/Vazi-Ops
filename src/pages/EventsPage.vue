<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { ka } from "date-fns/locale";
import { format, intervalToDuration, type Duration } from "date-fns";
import { useEventsCrud } from "../composables/useEventsCrud";
import { useToast } from "primevue";
import {
  REQUEST_PENDING,
  REQUEST_ACCEPTED,
  REQUEST_REJECTED,
} from "../composables/constants";
import type { Event as AppEvent } from "../type/interfaces";
import LoadingSpinner from "../components/UI/LoadingSpinner.vue";

const { loading, deadline, events, createEvent } = useEventsCrud();
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
  const date = dateValue?.seconds
    ? new Date(dateValue.seconds * 1000)
    : new Date(dateValue);
  if (isNaN(date.getTime())) return "თარიღი არასწორია";
  return format(date, "d MMMM yyyy, HH:mm", { locale: ka });
};

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

const activeFilter = ref<"all" | "pending" | "accepted" | "rejected">("all");

const filters = [
  { key: "all", label: "ყველა" },
  { key: "pending", label: "მოლოდინი" },
  { key: "accepted", label: "დადასტურ." },
  { key: "rejected", label: "უარყოფილი" },
] as const;

const statusMap: Record<string, string> = {
  pending: REQUEST_PENDING,
  accepted: REQUEST_ACCEPTED,
  rejected: REQUEST_REJECTED,
};

const filteredEvents = computed(() => {
  if (activeFilter.value === "all") return events.value;
  return events.value.filter(
    (e) => e.request_status === statusMap[activeFilter.value],
  );
});

const sheetVisible = ref(false);
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
  if (
    !form.value.performer_full_name ||
    !form.value.leader_full_name ||
    !form.value.group_name ||
    !form.value.scene_name
  ) {
    toast.add({
      severity: "warn",
      summary: "შეავსე ყველა სავალდებულო ველი",
      life: 3000,
    });
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
      <div
        class="mb-5 overflow-hidden rounded-3xl border border-blue-900/30 bg-[#0d1829]"
      >
        <div class="p-5">
          <p
            class="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500"
          >
            საღამოს ნომრები
          </p>

          <div
            v-if="!isDeadlinePassed && countdownUnits"
            class="mb-4 flex gap-2"
          >
            <div
              v-for="unit in countdownUnits"
              :key="unit.label"
              class="flex flex-1 flex-col items-center rounded-2xl bg-[#07101e] py-4 border border-yellow-900/30"
            >
              <span
                class="font-mono text-4xl font-bold text-yellow-400 tabular-nums tracking-wider"
                >{{ unit.value }}</span
              >
              <span
                class="mt-1 text-[10px] font-bold uppercase tracking-widest text-yellow-900"
                >{{ unit.label }}</span
              >
            </div>
          </div>

          <div
            v-else-if="isDeadlinePassed"
            class="mb-4 flex items-center gap-3 rounded-2xl bg-red-500/10 px-4 py-3 border border-red-500/20"
          >
            <i class="pi pi-lock text-red-400" />
            <span class="text-sm font-semibold text-red-400"
              >რეგისტრაცია დასრულდა</span
            >
          </div>

          <div v-else class="mb-4 h-16 flex items-center justify-center">
            <i class="pi pi-spin pi-spinner text-slate-500" />
          </div>

          <div class="mb-4 flex items-center gap-2 text-xs text-slate-600">
            <i class="pi pi-calendar" />
            <span>დედლაინი: {{ formatDate(deadline?.time) || "—" }}</span>
          </div>

          <button
            v-if="!isDeadlinePassed"
            @click="openSheet"
            class="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-blue-600 py-3 text-sm font-semibold text-white transition-all hover:bg-blue-500 active:scale-95"
          >
            <i class="pi pi-plus-circle" />
            ნომრის ჩაწერა
          </button>
        </div>
      </div>

      <div class="mb-4 grid grid-cols-3 gap-2">
        <div
          class="rounded-xl border border-blue-900/20 bg-[#0d1829] p-3 text-center"
        >
          <p class="text-xl font-bold text-white">{{ events.length }}</p>
          <p class="text-[10px] text-slate-600">სულ</p>
        </div>
        <div
          class="rounded-xl border border-amber-900/20 bg-[#0d1829] p-3 text-center"
        >
          <p class="text-xl font-bold text-amber-400">
            {{
              events.filter((e) => e.request_status === REQUEST_PENDING).length
            }}
          </p>
          <p class="text-[10px] text-slate-600">მოლოდინი</p>
        </div>
        <div
          class="rounded-xl border border-emerald-900/20 bg-[#0d1829] p-3 text-center"
        >
          <p class="text-xl font-bold text-emerald-400">
            {{
              events.filter((e) => e.request_status === REQUEST_ACCEPTED).length
            }}
          </p>
          <p class="text-[10px] text-slate-600">დადასტურ.</p>
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
              : 'bg-[#0d1829] text-slate-500 hover:text-slate-300 border border-blue-900/20'
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
          class="rounded-2xl border border-blue-900/20 bg-[#0d1829] p-4"
        >
          <div class="mb-3 flex items-start justify-between gap-2">
            <h3 class="font-bold text-white">{{ event.scene_name }}</h3>
            <span
              class="shrink-0 rounded-lg border px-2 py-0.5 text-xs font-semibold"
              :class="statusMeta(event.request_status).cls"
            >
              {{ statusMeta(event.request_status).label }}
            </span>
          </div>

          <div class="flex flex-col gap-1.5">
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
                მედია ლინკი
              </a>
            </div>
            <div v-if="event.additional_info" class="flex items-start gap-2.5">
              <div
                class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-900/30"
              >
                <i class="pi pi-comment text-[10px] text-blue-400" />
              </div>
              <span class="text-sm leading-relaxed text-slate-500">{{
                event.additional_info
              }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="backdrop">
        <div
          v-if="sheetVisible"
          class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
          @click="closeSheet"
        />
      </Transition>

      <Transition name="sheet">
        <div
          v-if="sheetVisible"
          class="fixed bottom-0 left-0 right-0 z-50 max-h-[92vh] overflow-y-auto rounded-t-3xl border-t border-blue-900/40 bg-[#07101e] p-5"
          style="box-shadow: 0 -8px 40px 0 rgba(0, 10, 40, 0.8)"
          @click.stop
        >
          <div class="mx-auto mb-4 h-1 w-10 rounded-full bg-blue-900/60" />

          <div class="mb-5 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span class="h-4 w-[3px] rounded-full bg-blue-500" />
              <span class="text-sm font-bold text-slate-200"
                >ნომრის ჩაწერა</span
              >
            </div>
            <button
              @click="closeSheet"
              class="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-blue-900/30 text-slate-400 hover:bg-blue-900/60 hover:text-white"
            >
              <i class="pi pi-times text-xs" />
            </button>
          </div>

          <div class="flex flex-col gap-4">
            <div>
              <label
                class="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500"
              >
                ბავშვის სახელი და გვარი <span class="text-red-400">*</span>
              </label>
              <input
                v-model="form.performer_full_name"
                type="text"
                placeholder="მაგ: ნიკა გელაშვილი"
                class="w-full rounded-xl border px-4 py-3 text-sm text-slate-200 placeholder-slate-600 outline-none transition-colors"
                :class="
                  submitted && !form.performer_full_name
                    ? 'border-red-600/60 bg-red-500/5'
                    : 'border-blue-900/30 bg-[#0d1829] focus:border-blue-700/60'
                "
              />
              <p
                v-if="submitted && !form.performer_full_name"
                class="mt-1 text-xs text-red-400"
              >
                სავალდებულოა
              </p>
            </div>

            <div>
              <label
                class="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500"
              >
                ლიდერის სახელი და გვარი <span class="text-red-400">*</span>
              </label>
              <input
                v-model="form.leader_full_name"
                type="text"
                class="w-full rounded-xl border px-4 py-3 text-sm text-slate-200 placeholder-slate-600 outline-none transition-colors"
                :class="
                  submitted && !form.leader_full_name
                    ? 'border-red-600/60 bg-red-500/5'
                    : 'border-blue-900/30 bg-[#0d1829] focus:border-blue-700/60'
                "
              />
              <p
                v-if="submitted && !form.leader_full_name"
                class="mt-1 text-xs text-red-400"
              >
                სავალდებულოა
              </p>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label
                  class="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500"
                >
                  ჯგუფი <span class="text-red-400">*</span>
                </label>
                <input
                  v-model="form.group_name"
                  type="text"
                  class="w-full rounded-xl border px-4 py-3 text-sm text-slate-200 outline-none transition-colors"
                  :class="
                    submitted && !form.group_name
                      ? 'border-red-600/60 bg-red-500/5'
                      : 'border-blue-900/30 bg-[#0d1829] focus:border-blue-700/60'
                  "
                />
                <p
                  v-if="submitted && !form.group_name"
                  class="mt-1 text-xs text-red-400"
                >
                  სავალდებულოა
                </p>
              </div>
              <div>
                <label
                  class="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500"
                >
                  ნომრის სახელი <span class="text-red-400">*</span>
                </label>
                <input
                  v-model="form.scene_name"
                  type="text"
                  placeholder="სიმღერა, ცეკვა..."
                  class="w-full rounded-xl border px-4 py-3 text-sm text-slate-200 placeholder-slate-600 outline-none transition-colors"
                  :class="
                    submitted && !form.scene_name
                      ? 'border-red-600/60 bg-red-500/5'
                      : 'border-blue-900/30 bg-[#0d1829] focus:border-blue-700/60'
                  "
                />
                <p
                  v-if="submitted && !form.scene_name"
                  class="mt-1 text-xs text-red-400"
                >
                  სავალდებულოა
                </p>
              </div>
            </div>

            <div>
              <label
                class="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500"
              >
                მედია ლინკი
                <span class="text-slate-600 normal-case font-normal"
                  >(სურვილისამებრ)</span
                >
              </label>
              <input
                v-model="form.media_url"
                type="url"
                placeholder="YouTube, Google Drive..."
                class="w-full rounded-xl border border-blue-900/30 bg-[#0d1829] px-4 py-3 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-blue-700/60"
              />
            </div>

            <div>
              <label
                class="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500"
              >
                კომენტარი
                <span class="text-slate-600 normal-case font-normal"
                  >(სურვილისამებრ)</span
                >
              </label>
              <textarea
                v-model="form.additional_info"
                rows="3"
                class="w-full resize-none rounded-xl border border-blue-900/30 bg-[#0d1829] px-4 py-3 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-blue-700/60"
              />
            </div>
          </div>

          <div class="mt-5 flex gap-3">
            <button
              @click="closeSheet"
              class="cursor-pointer rounded-xl border border-blue-900/30 bg-[#0d1829] px-5 py-3 text-sm font-semibold text-slate-400 transition-all hover:text-slate-200"
            >
              გაუქმება
            </button>
            <button
              @click="handleRegister"
              :disabled="loading"
              class="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition-all hover:bg-blue-500 disabled:opacity-50"
            >
              <i class="pi pi-check" />
              გაგზავნა
            </button>
          </div>

          <div class="h-6" />
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.backdrop-enter-active {
  transition: opacity 0.25s ease;
}
.backdrop-leave-active {
  transition: opacity 0.2s ease;
}
.backdrop-enter-from,
.backdrop-leave-to {
  opacity: 0;
}

.sheet-enter-active {
  transition: transform 0.35s cubic-bezier(0.32, 0.72, 0, 1);
}
.sheet-leave-active {
  transition: transform 0.25s cubic-bezier(0.4, 0, 1, 1);
}
.sheet-enter-from,
.sheet-leave-to {
  transform: translateY(100%);
}
</style>
