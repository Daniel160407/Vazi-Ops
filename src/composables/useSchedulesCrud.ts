import { ref } from "vue";
import { doc, setDoc, collection } from "firebase/firestore";
import type { Schedule } from "../type/interfaces";
import { db } from "../../firebase";
import { SCHEDULES_DB } from "./constants";

export const useSchedulesCrud = () => {
  const loading = ref(false);
  const error = ref<string | null>(null);

  const saveSchedule = async (scheduleData: Schedule) => {
    loading.value = true;
    error.value = null;

    try {
      const isUpdating = scheduleData.id ? true : false;

      const docRef = isUpdating
        ? doc(db, SCHEDULES_DB, (scheduleData as Schedule).id!)
        : doc(collection(db, SCHEDULES_DB));

      const dataToSave = {
        ...scheduleData,
        id: docRef.id,
      };

      await setDoc(docRef, dataToSave, { merge: true });

      console.log(`Schedule ${isUpdating ? "updated" : "created"}:`, docRef.id);
      return docRef.id;
    } catch (err) {
      console.error(err);
      error.value = "Failed to save schedule";
    } finally {
      loading.value = false;
    }
  };

  return {
    saveSchedule,
    loading,
    error,
  };
};
