import {
  addDoc,
  collection,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../firebase";
import { EVENTS_DB, DEADLINE_DB } from "./constants";
import { computed, ref } from "vue";
import type { Event as AppEvent } from "../type/interfaces";
import { useGlobalStore } from "../stores/GlobalStore";
import { storeToRefs } from "pinia";
import { useToast } from "primevue";

export const useEventsCrud = () => {
  const {
    loading: loadingStore,
    deadline,
    events,
  } = storeToRefs(useGlobalStore());
  const toast = useToast();

  const saving = ref(false);

  const loading = computed(() => saving && loadingStore);

  const createEvent = async (event: Omit<AppEvent, "id">) => {
    saving.value = true;
    try {
      await addDoc(collection(db, EVENTS_DB), event);
    } catch (err) {
      console.error("Create Event Error:", err);
      toast.add({
        severity: "error",
        summary: "მოხდა შეცდომა",
        detail: "ნომერი ვერ დაემატა",
        life: 3000,
      });
    } finally {
      saving.value = false;
    }
  };

  const updateEventStatus = async (eventId: string, status: string) => {
    saving.value = true;
    try {
      const eventRef = doc(db, EVENTS_DB, eventId);
      await updateDoc(eventRef, { request_status: status });
    } catch (err) {
      console.error("Update Status Error:", err);
      toast.add({
        severity: "error",
        summary: "მოხდა შეცდომა",
        detail: "მოხდა შეცდომა ნომრის სტატუსის შეცვლისას",
        life: 3000,
      });
    } finally {
      saving.value = false;
    }
  };

  const deleteEvent = async (eventId: string) => {
    saving.value = true;
    try {
      await deleteDoc(doc(db, EVENTS_DB, eventId));
    } catch (err) {
      console.error("Delete Event Error:", err);
      toast.add({
        severity: "error",
        summary: "მოხდა შეცდომა",
        detail: "ნომერი ვერ წაიშალა",
        life: 3000,
      });
    } finally {
      saving.value = false;
    }
  };

  const updateDeadline = async (
    deadlineId: string | undefined,
    newTime: Date
  ) => {
    saving.value = true;
    try {
      if (deadlineId) {
        const deadlineRef = doc(db, DEADLINE_DB, deadlineId);
        await updateDoc(deadlineRef, { time: newTime });
      } else {
        await addDoc(collection(db, DEADLINE_DB), { time: newTime });
      }
      toast.add({
        severity: "success",
        summary: "დედლაინი განახლებულია",
        life: 3000,
      });
    } catch (err) {
      console.error("Update Deadline Error:", err);
      toast.add({
        severity: "error",
        summary: "მოხდა შეცდომა",
        detail: "დედლაინი ვერ განახლდა",
        life: 3000,
      });
    } finally {
      saving.value = false;
    }
  };

  return {
    deadline,
    events,
    loading,

    createEvent,
    updateEventStatus,
    deleteEvent,
    updateDeadline,
  };
};
