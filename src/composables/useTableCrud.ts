import { ref, computed } from "vue";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { TABLE_DB } from "./constants";
import { useToast } from "primevue";
import { storeToRefs } from "pinia";
import { useGlobalStore } from "../stores/GlobalStore";
import type { TableData } from "../type/interfaces";

export const useTableCrud = () => {
  const toast = useToast();
  const store = useGlobalStore();
  const { tableData, tableDataLoaded } = storeToRefs(store);

  const saving = ref(false);
  const loading = computed(() => saving.value || !tableDataLoaded.value);

  const saveTable = async (data: Omit<TableData, "id">) => {
    saving.value = true;
    try {
      await setDoc(doc(db, TABLE_DB, "main"), {
        headers: data.headers,
        row_labels: data.row_labels,
        cells: data.cells.map((row) => ({ values: row })),
      });
      toast.add({ severity: "success", summary: "ცხრილი შენახულია", life: 3000 });
    } catch(error) {
      console.error(error);
      toast.add({ severity: "error", summary: "შეცდომა შენახვისას", life: 3000 });
    } finally {
      saving.value = false;
    }
  };

  return { tableData, tableDataLoaded, saving, loading, saveTable };
};
