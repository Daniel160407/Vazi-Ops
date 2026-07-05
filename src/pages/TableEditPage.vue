<script setup lang="ts">
import { ref, watch } from "vue";
import { useTableCrud } from "@/composables/useTableCrud";
import AppButton from "@/components/UI/AppButton.vue";
import AppInput from "@/components/UI/AppInput.vue";
import LoadingSpinner from "@/components/UI/LoadingSpinner.vue";

const { tableData, tableDataLoaded, saving, loading, saveTable } =
  useTableCrud();

const headers = ref<string[]>(["სვეტი 1", "სვეტი 2", "სვეტი 3"]);
const rowLabels = ref<string[]>(["სტრიქონი 1", "სტრიქონი 2"]);
const cells = ref<string[][]>([
  ["", "", ""],
  ["", "", ""],
]);

const initialized = ref(false);

const addColumn = () => {
  headers.value.push(`სვეტი ${headers.value.length + 1}`);
  cells.value.forEach((row) => row.push(""));
};

const removeColumn = (ci: number) => {
  if (headers.value.length <= 1) return;
  headers.value.splice(ci, 1);
  cells.value.forEach((row) => row.splice(ci, 1));
};

const addRow = () => {
  rowLabels.value.push(`სტრიქონი ${rowLabels.value.length + 1}`);
  cells.value.push(new Array(headers.value.length).fill(""));
};

const removeRow = (ri: number) => {
  if (cells.value.length <= 1) return;
  rowLabels.value.splice(ri, 1);
  cells.value.splice(ri, 1);
};

const handleSave = () => {
  (document.activeElement as HTMLElement)?.blur();
  saveTable({
    headers: headers.value,
    row_labels: rowLabels.value,
    cells: cells.value,
  });
};

watch(
  tableDataLoaded,
  (loaded) => {
    if (!loaded || initialized.value) return;
    if (tableData.value) {
      headers.value = [...tableData.value.headers];
      rowLabels.value = [...tableData.value.row_labels];
      cells.value = tableData.value.cells.map((row) => [...row]);
    }
    initialized.value = true;
  },
  { immediate: true },
);
</script>

<template>
  <div class="relative pb-4">
    <LoadingSpinner v-if="loading && !initialized" />

    <template v-else>
      <div class="mb-5 grid grid-cols-2 gap-3">
        <div class="rounded-2xl border border-blue-900/20 bg-[#0d1829] p-4">
          <p
            class="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-500"
          >
            სტრიქონები
          </p>
          <p class="text-3xl font-bold text-white">{{ cells.length }}</p>
        </div>
        <div class="rounded-2xl border border-blue-900/20 bg-[#0d1829] p-4">
          <p
            class="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-500"
          >
            სვეტები
          </p>
          <p class="text-3xl font-bold text-white">{{ headers.length }}</p>
        </div>
      </div>

      <div class="overflow-x-auto rounded-2xl border border-blue-900/20">
        <table class="w-full border-collapse">
          <thead>
            <tr>
              <th
                class="w-10 border-r border-b border-blue-900/20 bg-[#07101e]"
              />
              <th
                class="min-w-32.5 border-r border-b border-blue-900/20 bg-[#07101e] px-3 py-2.5 text-left"
              >
                <span
                  class="text-[10px] font-bold uppercase tracking-widest text-blue-500/50"
                  >სტრიქონი</span
                >
              </th>
              <th
                v-for="(_, ci) in headers"
                :key="ci"
                class="group border-r border-b border-blue-900/20 bg-[#07101e] p-0 text-left"
              >
                <div class="flex items-center gap-1 pl-1 pr-1">
                  <AppInput
                    v-model="headers[ci]"
                    variant="table-header"
                    placeholder="სვეტი"
                  />
                  <AppButton
                    v-if="headers.length > 1"
                    variant="table-remove-column"
                    icon="pi-times"
                    @click="removeColumn(ci)"
                  />
                </div>
              </th>
              <th class="w-10 border-b border-blue-900/20 bg-[#07101e]">
                <AppButton
                  variant="table-add-column"
                  icon="pi-plus"
                  @click="addColumn"
                />
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, ri) in cells" :key="ri" class="group/row">
              <td
                class="w-10 border-r border-b border-blue-900/20 bg-[#07101e] px-3 py-2 text-center text-xs text-slate-600"
              >
                {{ ri + 1 }}
              </td>
              <td class="border-r border-b border-blue-900/20 bg-[#07101e] p-0">
                <AppInput
                  v-model="rowLabels[ri]"
                  variant="table-row-label"
                  placeholder="სტრიქონის სახელი"
                />
              </td>
              <td
                v-for="(_cell, ci) in row"
                :key="ci"
                class="border-r border-b border-blue-900/20 p-0"
              >
                <AppInput v-model="row[ci]" variant="table-cell" />
              </td>
              <td class="w-10 border-b border-blue-900/20 bg-[#07101e]">
                <AppButton
                  v-if="cells.length > 1"
                  variant="table-remove-row"
                  icon="pi-times"
                  @click="removeRow(ri)"
                />
              </td>
            </tr>
            <tr>
              <td
                :colspan="headers.length + 3"
                class="border-t border-blue-900/10 bg-[#07101e] p-0"
              >
                <AppButton
                  variant="table-add-row"
                  icon="pi-plus"
                  @click="addRow"
                  >სტრიქონის დამატება</AppButton
                >
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="mt-4">
        <AppButton
          variant="primary"
          icon="pi-check"
          :disabled="saving"
          class="w-full"
          @click="handleSave"
        >
          {{ saving ? "ინახება..." : "შენახვა" }}
        </AppButton>
      </div>
    </template>
  </div>
</template>
