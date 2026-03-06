<script setup lang="ts">
import { watch } from "vue";
import { storeToRefs } from "pinia";
import { useGlobalStore } from "../stores/GlobalStore";
import { useSchedulesCrud } from "../composables/useSchedulesCrud";
import OrderList from "primevue/orderlist";
import Button from "primevue/button";

const globalStore = useGlobalStore();
const { fetchEveningSchedule } = globalStore;
const { eveningScheduleItems } = storeToRefs(globalStore);
const { updateScheduleOrder, loading } = useSchedulesCrud();

const saveNewOrder = async () => {
  await updateScheduleOrder(eveningScheduleItems.value);

  await fetchEveningSchedule();
  eveningScheduleItems.value.sort((a, b) => a.position - b.position);
};

watch(
  eveningScheduleItems,
  (newItems) => {
    if (newItems && newItems.length > 0) {
      newItems.sort((a, b) => a.position - b.position);
    }
  },
  { once: true }
);
</script>

<template>
  <div class="card">
    <OrderList v-model="eveningScheduleItems" dataKey="id" breakpoint="575px">
      <template #header> საღამოს პროგრამა </template>

      <template #option="{ option, index }">
        <div class="flex flex-wrap p-2 items-center gap-3">
          <span class="font-mono font-bold text-xl text-primary"
            >{{ index + 1 }}.</span
          >

          <div class="flex-1 flex flex-col gap-1">
            <div class="flex items-center gap-2">
              <span class="font-bold text-lg">{{ option.scene_name }}</span>
              <span class="text-surface-500">|</span>
              <span class="font-medium">{{ option.performer_full_name }}</span>
            </div>

            <div class="flex items-center gap-2 text-sm text-surface-600">
              <i class="pi pi-users text-xs"></i>
              <span>{{ option.group_name }}</span>
              <span v-if="option.leader_full_name" class="italic">
                (ლიდერი: {{ option.leader_full_name }})
              </span>
            </div>
          </div>

          <div v-if="option.media_url" class="flex items-center justify-center">
            <a
              :href="option.media_url"
              target="_blank"
              class="p-button p-button-rounded p-button-text p-button-secondary"
              v-tooltip.top="'მედია ფაილის ნახვა'"
              @click.stop
            >
              <i class="pi pi-play-circle text-2xl text-blue-500"></i>
            </a>
          </div>
        </div>
      </template>
    </OrderList>

    <div class="flex justify-start mt-4">
      <Button
        label="შენახვა"
        :loading="loading"
        severity="success"
        @click="saveNewOrder"
      />
    </div>
  </div>
</template>
