<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { storeToRefs } from "pinia";
import { ka } from "date-fns/locale";
import { format } from "date-fns";
import DatePicker from "primevue/datepicker";
import { useConfirm } from "primevue";
import { useGlobalStore } from "@/stores/GlobalStore";
import { useEventsCrud } from "@/composables/useEventsCrud";
import { useSchedulesCrud } from "@/composables/useSchedulesCrud";
import { REQUEST_PENDING, REQUEST_ACCEPTED, REQUEST_REJECTED } from "@/composables/constants";
import type { EveningScheduleItem, Event } from "@/type/interfaces";
import LoadingSpinner from "@/components/UI/LoadingSpinner.vue";
import InfoRow from "@/components/UI/InfoRow.vue";
import BottomSheet from "@/components/UI/BottomSheet.vue";
import AppInput from "@/components/UI/AppInput.vue";
import SheetField from "@/components/UI/SheetField.vue";
import AppButton from "@/components/UI/AppButton.vue";

const globalStore = useGlobalStore();
const { loading: loadingStore, deadline, events, appUsers, groups } = storeToRefs(globalStore);
const { loading, updateEvent, updateEventStatus, deleteEvent, updateDeadline } = useEventsCrud();
const { addEveningSchedule } = useSchedulesCrud();
const confirm = useConfirm();
const newDeadlineDate = ref<Date | null>(null);

watch(deadline, (val) => {
  if (val?.time) newDeadlineDate.value = new Date(val.time);
}, { immediate: true });

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
    accept: async () => { await deleteEvent(id); },
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

const sheetVisible = ref(false);
const form = ref<Event | null>(null);
const leaderOpen = ref(false);

const leaderSuggestions = computed(() => {
  const q = (form.value?.leader_full_name ?? "").toLowerCase().trim();
  return appUsers.value.filter((u) => u.name.toLowerCase().includes(q));
});

const selectLeader = (name: string) => {
  if (!form.value) return;
  form.value.leader_full_name = name;
  const group = groups.value.find((g) => g.leader === name);
  if (group) form.value.group_name = group.name;
  leaderOpen.value = false;
};

const openEdit = (event: Event) => {
  form.value = { ...event };
  sheetVisible.value = true;
};

const handleSave = async () => {
  if (!form.value) return;
  await updateEvent(form.value);
  sheetVisible.value = false;
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
  const sorted = [...events.value].sort((a, b) => {
    const ta = a.created_at instanceof Date ? a.created_at.getTime() : new Date(a.created_at).getTime();
    const tb = b.created_at instanceof Date ? b.created_at.getTime() : new Date(b.created_at).getTime();
    return tb - ta;
  });
  if (activeFilter.value === "all") return sorted;
  return sorted.filter((e) => e.request_status === statusMap[activeFilter.value]);
});

const statusMeta = (status: string) => {
  if (status === REQUEST_ACCEPTED) return { label: "დადასტურებული", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25" };
  if (status === REQUEST_REJECTED) return { label: "უარყოფილი", cls: "bg-red-500/15 text-red-400 border-red-500/25" };
  return { label: "მოლოდინში", cls: "bg-amber-500/15 text-amber-400 border-amber-500/25" };
};

const accentBorder = (status: string) => {
  if (status === REQUEST_ACCEPTED) return "border-l-emerald-500/50";
  if (status === REQUEST_REJECTED) return "border-l-red-500/50";
  return "border-l-amber-500/50";
};

const formatDate = (dateValue?: any) => {
  if (!dateValue) return "—";
  const date = dateValue?.seconds ? new Date(dateValue.seconds * 1000) : new Date(dateValue);
  return isNaN(date.getTime()) ? "—" : format(date, "d MMM, HH:mm", { locale: ka });
};
</script>

<template>
  <div class="pb-4">
    <LoadingSpinner v-if="loadingStore && events.length === 0" />

    <div v-else>
      <div class="mb-5 rounded-2xl border border-blue-900/20 bg-[#0d1829] p-4">
        <p class="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">
          რეგისტრაციის დედლაინი
        </p>
        <div class="flex items-end gap-3">
          <div class="flex-1">
            <DatePicker
              v-model="newDeadlineDate"
              show-time
              hour-format="24"
              date-format="dd/mm/yy"
              placeholder="აირჩიე თარიღი და დრო"
              fluid
              :pt="{ input: { class: 'rounded-xl border border-blue-900/30 bg-[#07101e] px-4 py-3 text-sm text-slate-200 w-full outline-none' } }"
            />
          </div>
          <AppButton
            variant="primary"
            :disabled="loading || !newDeadlineDate"
            icon="pi-check"
            class="px-4"
            @click="handleUpdateDeadline"
          >
            შენახვა
          </AppButton>
        </div>
      </div>

      <div class="mb-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div class="rounded-xl border border-blue-900/20 bg-[#0d1829] p-3 text-center">
          <p class="text-lg font-bold text-white">{{ events.length }}</p>
          <p class="text-[10px] text-slate-600">სულ</p>
        </div>
        <div class="rounded-xl border border-amber-900/20 bg-[#0d1829] p-3 text-center">
          <p class="text-lg font-bold text-amber-400">{{ events.filter((e) => e.request_status === REQUEST_PENDING).length }}</p>
          <p class="text-[10px] text-slate-600">მოლოდინში</p>
        </div>
        <div class="rounded-xl border border-emerald-900/20 bg-[#0d1829] p-3 text-center">
          <p class="text-lg font-bold text-emerald-400">{{ events.filter((e) => e.request_status === REQUEST_ACCEPTED).length }}</p>
          <p class="text-[10px] text-slate-600">დადასტურებული</p>
        </div>
        <div class="rounded-xl border border-red-900/20 bg-[#0d1829] p-3 text-center">
          <p class="text-lg font-bold text-red-400">{{ events.filter((e) => e.request_status === REQUEST_REJECTED).length }}</p>
          <p class="text-[10px] text-slate-600">უარყოფილი</p>
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
          class="overflow-hidden rounded-2xl border border-l-4 border-blue-900/20 bg-[#0d1829]"
          :class="accentBorder(event.request_status)"
        >
          <div class="p-4">
            <div class="mb-3 flex items-start justify-between gap-2">
              <h3 class="font-bold leading-tight text-white">{{ event.scene_name }}</h3>
              <span class="shrink-0 rounded-lg border px-2 py-0.5 text-xs font-semibold" :class="statusMeta(event.request_status).cls">
                {{ statusMeta(event.request_status).label }}
              </span>
            </div>

            <div class="mb-3 flex flex-col gap-1.5">
              <InfoRow icon="pi-user"><span class="text-sm text-slate-400">{{ event.performer_full_name }}</span></InfoRow>
              <InfoRow icon="pi-users"><span class="text-sm text-slate-400">{{ event.leader_full_name }} · {{ event.group_name }}</span></InfoRow>
              <InfoRow v-if="event.media_url" icon="pi-link">
                <a :href="event.media_url" target="_blank" class="text-sm text-blue-400 underline underline-offset-2 hover:text-blue-300">მედია</a>
              </InfoRow>
              <InfoRow v-if="event.additional_info" icon="pi-comment">
                <span class="text-sm leading-relaxed text-slate-500">{{ event.additional_info }}</span>
              </InfoRow>
              <InfoRow icon="pi-clock"><span class="text-xs text-slate-600">{{ formatDate(event.created_at) }}</span></InfoRow>
            </div>

            <div class="flex gap-2 border-t border-blue-900/20 pt-3">
              <AppButton
                v-if="event.request_status !== REQUEST_ACCEPTED"
                variant="plain"
                :disabled="loading"
                class="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-emerald-900/30 bg-emerald-500/10 py-2 text-xs font-semibold text-emerald-400 transition-all hover:bg-emerald-500/20 disabled:opacity-50"
                @click="setStatus(event.id, REQUEST_ACCEPTED)"
              >
                <i class="pi pi-check text-xs" /> დადასტურება
              </AppButton>
              <AppButton
                v-if="event.request_status !== REQUEST_REJECTED"
                variant="plain"
                :disabled="loading"
                class="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-900/30 bg-red-500/10 py-2 text-xs font-semibold text-red-400 transition-all hover:bg-red-500/20 disabled:opacity-50"
                @click="setStatus(event.id, REQUEST_REJECTED)"
              >
                <i class="pi pi-times text-xs" /> უარყოფა
              </AppButton>
              <AppButton
                v-if="event.request_status === REQUEST_ACCEPTED"
                variant="plain"
                :disabled="loading"
                class="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-blue-900/30 bg-blue-500/10 py-2 text-xs font-semibold text-blue-400 transition-all hover:bg-blue-500/20 disabled:opacity-50"
                @click="handleAddToSchedule(event)"
              >
                <i class="pi pi-calendar text-xs" /> დამატება
              </AppButton>
              <AppButton
                variant="icon-edit"
                size="md"
                icon="pi-pencil"
                @click="openEdit(event)"
              />
              <AppButton
                variant="icon-delete"
                size="md"
                icon="pi-trash"
                @click="handleDelete(event.id)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

  <BottomSheet :visible="sheetVisible" title="ნომრის რედაქტირება" @close="sheetVisible = false">
    <div v-if="form" class="flex flex-col gap-4">
      <SheetField label="ნომრის სახელი">
        <AppInput v-model="form.scene_name" />
      </SheetField>

      <SheetField label="შემსრულებელი">
        <AppInput v-model="form.performer_full_name" />
      </SheetField>

      <div class="grid grid-cols-2 gap-3">
        <SheetField label="ლიდერი">
          <div class="relative">
            <AppInput v-model="form.leader_full_name" autocomplete="off" @focus="leaderOpen = true" @blur="leaderOpen = false" />
            <Transition
              enter-active-class="transition-all duration-150 ease-out"
              enter-from-class="opacity-0 -translate-y-1"
              enter-to-class="opacity-100 translate-y-0"
              leave-active-class="transition-all duration-100 ease-in"
              leave-from-class="opacity-100 translate-y-0"
              leave-to-class="opacity-0 -translate-y-1"
            >
              <ul
                v-if="leaderOpen && leaderSuggestions.length"
                class="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-48 overflow-y-auto rounded-xl border border-blue-900/30 bg-[#07101e] py-1 shadow-xl"
                style="box-shadow: 0 8px 32px 0 rgba(0,6,30,0.8)"
                @mousedown.prevent
              >
                <li
                  v-for="u in leaderSuggestions"
                  :key="u.id"
                  class="flex cursor-pointer items-center gap-3 px-3 py-2.5 transition-colors hover:bg-blue-900/20"
                  @click="selectLeader(u.name)"
                >
                  <div class="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-900/40 text-xs font-bold text-blue-300">
                    <img v-if="u.avatar_url" :src="u.avatar_url" class="h-full w-full object-cover" />
                    <span v-else>{{ u.name.charAt(0).toUpperCase() }}</span>
                  </div>
                  <span class="text-sm text-slate-200">{{ u.name }}</span>
                </li>
              </ul>
            </Transition>
          </div>
        </SheetField>
        <SheetField label="ჯგუფი">
          <AppInput v-model="form.group_name" />
        </SheetField>
      </div>

      <SheetField label="მედია ლინკი">
        <AppInput v-model="form.media_url" />
      </SheetField>

      <SheetField label="დამატებითი ინფორმაცია">
        <textarea
          v-model="form.additional_info"
          rows="3"
          class="w-full resize-none rounded-xl border border-blue-900/30 bg-[#0d1829] px-4 py-3 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-blue-700/60"
        />
      </SheetField>
    </div>

    <div class="mt-5 flex gap-3">
      <AppButton variant="primary" :disabled="loading" icon="pi-check" class="flex-1" @click="handleSave">
        შენახვა
      </AppButton>
    </div>
  </BottomSheet>
  </div>
</template>
