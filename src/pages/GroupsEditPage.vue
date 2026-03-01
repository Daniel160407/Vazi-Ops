<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useGlobalStore } from "../stores/GlobalStore";
import { GENDER_MALE } from "../composables/constants";
import { ref, onMounted, watch } from "vue";
import type { Group } from "../type/interfaces";
import InputText from "primevue/inputtext";
import InputNumber from "primevue/inputnumber";
import Button from "primevue/button";
import FloatLabel from "primevue/floatlabel";
import { useGroupsCrud } from "../composables/useGroupsCrud";
import { Textarea } from "primevue";

const globalStore = useGlobalStore();
const { groups } = storeToRefs(globalStore);
const { updateGroup } = useGroupsCrud();

const editingGroups = ref<Group[]>([]);
const childrenStrings = ref<Record<number, string>>({});

const saveGroup = async (group: Group, index: number) => {
  if (childrenStrings.value[index] !== undefined) {
    group.children = childrenStrings.value[index]
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s !== "");
  }

  await updateGroup(group);
};

watch(
  groups,
  (newGroups) => {
    editingGroups.value = JSON.parse(JSON.stringify(newGroups));

    editingGroups.value.forEach((group, index) => {
      childrenStrings.value[index] = group.children.join(", ");
    });
  },
  { deep: true, immediate: true }
);
</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
    <div
      v-for="(group, index) in editingGroups"
      :key="index"
      class="flex flex-col gap-5 rounded-xl p-4 my-4 mx-6 border border-solid"
      :style="{
        borderColor: group.gender === GENDER_MALE ? '#305CDE' : '#EE4B2B',
      }"
    >
      <div>
        <FloatLabel variant="on">
          <InputText
            id="name"
            v-model="group.name"
            class="w-full text-center font-bold"
            :style="{
              color: group.gender === GENDER_MALE ? '#305CDE' : '#EE4B2B',
            }"
          />
          <label for="name">ჯგუფის სახელი</label>
        </FloatLabel>

        <div class="space-y-6 mt-6">
          <FloatLabel variant="on">
            <InputText id="leader" v-model="group.leader" class="w-full" />
            <label for="leader">ლიდერი</label>
          </FloatLabel>

          <FloatLabel variant="on">
            <InputText id="age" v-model="group.age" class="w-full" />
            <label for="age">ასაკი</label>
          </FloatLabel>

          <FloatLabel variant="on">
            <InputNumber
              id="cottage"
              v-model="group.cottage_num"
              class="w-full"
            />
            <label for="cottage">კოტეჯი</label>
          </FloatLabel>
        </div>
      </div>

      <div>
        <FloatLabel variant="on">
          <Textarea
            v-model="childrenStrings[index]"
            class="w-full p-2 border rounded"
            rows="3"
          ></Textarea>
          <label class="font-bold mb-3">ბავშვები</label>
          <p class="text-xs text-gray-500">
            გამოყავით მძიმით (მაგ. ნიკა გელაშვილი, გიორგი გეგეჭკორი)
          </p>
        </FloatLabel>
      </div>

      <Button
        label="შენახვა"
        icon="pi pi-save"
        severity="success"
        @click="saveGroup(group, index)"
        class="mt-auto"
      />
    </div>
  </div>
</template>
