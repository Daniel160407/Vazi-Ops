import { addDoc, collection, deleteDoc, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { DAILY_PROGRAMS_DB } from "./constants";
import { useToast } from "primevue";
import { ref } from "vue";

export const useDailyProgramsCrud = () => {
  const toast = useToast();
  const loading = ref(false);

  const addDailyProgram = async (content: string) => {
    loading.value = true;
    try {
      await addDoc(collection(db, DAILY_PROGRAMS_DB), { content, created_at: serverTimestamp() });
      toast.add({ severity: "success", summary: "პროგრამა დამატებულია", life: 3000 });
    } catch (err) {
      console.error(err);
      toast.add({ severity: "error", summary: "მოხდა შეცდომა", detail: "პროგრამა ვერ დაემატა", life: 3000 });
    } finally {
      loading.value = false;
    }
  };

  const updateDailyProgram = async (id: string, content: string) => {
    loading.value = true;
    try {
      await updateDoc(doc(db, DAILY_PROGRAMS_DB, id), { content });
      toast.add({ severity: "success", summary: "პროგრამა განახლებულია", life: 3000 });
    } catch (err) {
      console.error(err);
      toast.add({ severity: "error", summary: "მოხდა შეცდომა", detail: "პროგრამა ვერ განახლდა", life: 3000 });
    } finally {
      loading.value = false;
    }
  };

  const deleteDailyProgram = async (id: string) => {
    loading.value = true;
    try {
      await deleteDoc(doc(db, DAILY_PROGRAMS_DB, id));
      toast.add({ severity: "success", summary: "პროგრამა წაიშალა", life: 3000 });
    } catch (err) {
      console.error(err);
      toast.add({ severity: "error", summary: "მოხდა შეცდომა", detail: "პროგრამა ვერ წაიშალა", life: 3000 });
    } finally {
      loading.value = false;
    }
  };

  return { loading, addDailyProgram, updateDailyProgram, deleteDailyProgram };
};
