import {
  addDoc,
  collection,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../firebase";
import { EVENTS_DB, DEADLINE_DB } from "./constants";
import { ref } from "vue";
import type { Event as AppEvent } from "../type/interfaces";

export const useEventsCrud = () => {
  const loading = ref(false);

  const createEvent = async (event: Omit<AppEvent, "id">) => {
    loading.value = true;
    try {
      await addDoc(collection(db, EVENTS_DB), event);
    } catch (err) {
      console.error("Create Event Error:", err);
    } finally {
      loading.value = false;
    }
  };

  const updateEventStatus = async (eventId: string, status: string) => {
    loading.value = true;
    try {
      const eventRef = doc(db, EVENTS_DB, eventId);
      await updateDoc(eventRef, { request_status: status });
    } catch (err) {
      console.error("Update Status Error:", err);
    } finally {
      loading.value = false;
    }
  };

  const deleteEvent = async (eventId: string) => {
    loading.value = true;
    try {
      await deleteDoc(doc(db, EVENTS_DB, eventId));
    } catch (err) {
      console.error("Delete Event Error:", err);
    } finally {
      loading.value = false;
    }
  };

  const updateDeadline = async (
    deadlineId: string | undefined,
    newTime: Date
  ) => {
    loading.value = true;
    try {
      if (deadlineId) {
        const deadlineRef = doc(db, DEADLINE_DB, deadlineId);
        await updateDoc(deadlineRef, { time: newTime });
      } else {
        await addDoc(collection(db, DEADLINE_DB), { time: newTime });
      }
    } catch (err) {
      console.error("Update Deadline Error:", err);
    } finally {
      loading.value = false;
    }
  };

  return {
    loading,
    createEvent,
    updateEventStatus,
    deleteEvent,
    updateDeadline,
  };
};
