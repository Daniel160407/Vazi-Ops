import { ref } from "vue";
import {
  doc,
  setDoc,
  collection,
  query,
  where,
  addDoc,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import type { EveningScheduleItem, Schedule } from "../type/interfaces";
import { db } from "../../firebase";
import { EVENING_SCHEDULE_DB, SCHEDULES_DB } from "./constants";
import { useToast } from "primevue";
import { storeToRefs } from "pinia";
import { useGlobalStore } from "../stores/GlobalStore";

export const useSchedulesCrud = () => {
  const toast = useToast();
  const globalStore = useGlobalStore();
  const { fetchEveningSchedule } = globalStore;
  const { eveningScheduleItems } = storeToRefs(globalStore);

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
  const addEveningSchedule = async (
    scheduleItem: Omit<EveningScheduleItem, "id">
  ) => {
    loading.value = true;
    error.value = null;

    try {
      const q = query(
        collection(db, EVENING_SCHEDULE_DB),
        where("performer_full_name", "==", scheduleItem.performer_full_name),
        where("scene_name", "==", scheduleItem.scene_name)
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        toast.add({
          severity: "warn",
          summary: "ეს ნომერი უკვე დამატებულია პროგრამაში!",
          life: 3000,
        });
        return null;
      }

      await addDoc(collection(db, EVENING_SCHEDULE_DB), {
        ...scheduleItem,
        position: eveningScheduleItems.value.length + 1,
        created_at: new Date(),
      });

      toast.add({
        severity: "success",
        summary: "ნომერი დაემატა საღამოს პროგრამაში",
        life: 3000,
      });

      fetchEveningSchedule();
    } catch (err) {
      console.error("Error adding evening schedule: ", err);
      toast.add({
        severity: "error",
        summary: "მოხდა შეცდომა",
        detail: "ნომერი ვერ დაემატა პროგრამაში",
        life: 3000,
      });
    } finally {
      loading.value = false;
    }
  };

  const updateScheduleOrder = async (items: EveningScheduleItem[]) => {
    loading.value = true;
    const batch = writeBatch(db);

    try {
      items.forEach((item, index) => {
        if (!item.id) {
          console.error("Item missing ID at index:", index);
          return;
        }

        const docRef = doc(db, EVENING_SCHEDULE_DB, item.id);
        const newPosition = index + 1;

        batch.update(docRef, {
          position: newPosition,
        });
      });

      await batch.commit();

      toast.add({
        severity: "success",
        summary: "რიგითობა შენახულია",
        life: 2000,
      });
    } catch (err: any) {
      console.error("Firebase Error Details:", err);
      toast.add({
        severity: "error",
        summary: "შენახვა ვერ მოხერხდა",
        detail: err.message,
        life: 5000,
      });
    } finally {
      loading.value = false;
    }
  };

  return {
    saveSchedule,
    addEveningSchedule,
    updateScheduleOrder,

    loading,
    error,
  };
};
