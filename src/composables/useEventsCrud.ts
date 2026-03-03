import { addDoc, collection } from "firebase/firestore";
import { db } from "../../firebase";
import { EVENTS_DB } from "./constants";
import { ref } from "vue";
import type { Event as AppEvent } from "../type/interfaces";

export const useEventsCrud = () => {
  const loading = ref(false);

  const createEvent = async (event: Omit<AppEvent, "id">) => {
    loading.value = true;
    try {
      await addDoc(collection(db, EVENTS_DB), event);
    } catch (err) {
      console.error(err);
    } finally {
      loading.value = false;
    }
  };

  return { loading, createEvent };
};
