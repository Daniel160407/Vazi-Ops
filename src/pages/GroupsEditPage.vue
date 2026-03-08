<script setup lang="ts">
import { GENDER_MALE, GENDER_FEMALE } from "../composables/constants";
import { ref, watch } from "vue";
import type { Group } from "../type/interfaces";
import InputText from "primevue/inputtext";
import InputNumber from "primevue/inputnumber";
import Button from "primevue/button";
import FloatLabel from "primevue/floatlabel";
import Dialog from "primevue/dialog";
import RadioButton from "primevue/radiobutton";
import { useGroupsCrud } from "../composables/useGroupsCrud";
import { Textarea, useConfirm } from "primevue";
import LoadingSpinner from "../components/UI/LoadingSpinner.vue";

const { loading, groups, fetchGroups, addGroup, updateGroup, deleteGroup } =
  useGroupsCrud();
const confirm = useConfirm();

const editingGroups = ref<Group[]>([]);
const childrenStrings = ref<Record<number, string>>({});

const displayAddDialog = ref(false);
const newGroup = ref<Omit<Group, "id">>({
  name: "",
  leader: "",
  age: "",
  cottage_num: 0,
  gender: GENDER_MALE,
  children: [],
});
const newGroupChildrenString = ref("");

const openAddDialog = () => {
  displayAddDialog.value = true;
};

const handleAddGroup = async () => {
  newGroup.value.children = newGroupChildrenString.value
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s !== "");

  await addGroup(newGroup.value);
  await fetchGroups();

  displayAddDialog.value = false;
  newGroup.value = {
    name: "",
    leader: "",
    age: "",
    cottage_num: 0,
    gender: GENDER_MALE,
    children: [],
  };
  newGroupChildrenString.value = "";
};

const handleSaveGroup = async (group: Group, index: number) => {
  if (childrenStrings.value[index] !== undefined) {
    group.children = childrenStrings.value[index]
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s !== "");
  }

  await updateGroup(group);
  await fetchGroups();
};

const handleDeleteGroup = (id: string) => {
  confirm.require({
    message: "დარწმუნებული ხარ, რომ ჯგუფის წაშლა გინდა?",
    header: "წაშლა",
    acceptProps: {
      label: "წაშლა",
      severity: "danger",
    },
    accept: async () => {
      await deleteGroup(id);
      await fetchGroups();
    },
  });
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
  <div class="p-4">
    <LoadingSpinner v-if="loading && groups.length <= 0" />

    <div v-else>
      <div class="mb-4">
        <Button
          label="დამატება"
          icon="pi pi-plus"
          @click="openAddDialog"
          severity="info"
        />
      </div>

      <div
        class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
      >
        <div
          v-for="(group, index) in editingGroups"
          :key="index"
          class="flex flex-col gap-5 rounded-xl p-4 border border-solid"
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

              <div class="flex gap-4">
                <div class="flex items-center gap-2">
                  <RadioButton
                    v-model="group.gender"
                    :value="GENDER_MALE"
                    name="gender"
                    inputId="male"
                  />
                  <label for="male">ვაჟი</label>
                </div>
                <div class="flex items-center gap-2">
                  <RadioButton
                    v-model="group.gender"
                    :value="GENDER_FEMALE"
                    name="gender"
                    inputId="female"
                  />
                  <label for="female">გოგო</label>
                </div>
              </div>
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
              <p class="text-xs text-gray-500">გამოყავით მძიმით</p>
            </FloatLabel>
          </div>

          <div class="flex flex-col sm:flex-row gap-3">
            <Button
              label="წაშლა"
              icon="pi pi-trash"
              severity="danger"
              @click="handleDeleteGroup(group.id)"
              class="flex-1"
              outlined
            />
            <Button
              label="შენახვა"
              icon="pi pi-save"
              severity="success"
              @click="handleSaveGroup(group, index)"
              class="mt-auto flex-1"
              outlined
            />
          </div>
        </div>
      </div>

      <Dialog
        v-model:visible="displayAddDialog"
        modal
        header="ახალი ჯგუფის დამატება"
      >
        <div class="space-y-6 pt-4">
          <FloatLabel variant="on">
            <InputText id="newName" v-model="newGroup.name" class="w-full" />
            <label for="newName">ჯგუფის სახელი</label>
          </FloatLabel>

          <div class="flex gap-4">
            <FloatLabel variant="on" class="flex-1">
              <InputText
                id="newLeader"
                v-model="newGroup.leader"
                class="w-full"
              />
              <label for="newLeader">ლიდერი</label>
            </FloatLabel>
            <FloatLabel variant="on" class="flex-1">
              <InputText id="newAge" v-model="newGroup.age" class="w-full" />
              <label for="newAge">ასაკი</label>
            </FloatLabel>
          </div>

          <FloatLabel variant="on">
            <InputNumber
              id="newCottage"
              v-model="newGroup.cottage_num"
              class="w-full"
            />
            <label for="newCottage">კოტეჯი</label>
          </FloatLabel>

          <div class="flex gap-4 rounded-lg">
            <div class="flex items-center gap-2">
              <RadioButton
                v-model="newGroup.gender"
                :value="GENDER_MALE"
                name="newGender"
                inputId="newMale"
              />
              <label for="newMale">ბიჭები</label>
            </div>
            <div class="flex items-center gap-2">
              <RadioButton
                v-model="newGroup.gender"
                :value="GENDER_FEMALE"
                name="newGender"
                inputId="newFemale"
              />
              <label for="newFemale">გოგოები</label>
            </div>
          </div>

          <FloatLabel variant="on">
            <Textarea
              v-model="newGroupChildrenString"
              class="w-full"
              rows="4"
            ></Textarea>
            <label>ბავშვები (მძიმით გამოყოფილი)</label>
          </FloatLabel>
        </div>

        <template #footer>
          <Button
            label="გაუქმება"
            icon="pi pi-times"
            @click="displayAddDialog = false"
            severity="secondary"
            outlined
          />
          <Button
            label="დამატება"
            icon="pi pi-check"
            @click="handleAddGroup"
            severity="success"
            autofocus
          />
        </template>
      </Dialog>
    </div>
  </div>
</template>
