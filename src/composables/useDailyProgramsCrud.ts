import { addDoc, collection, deleteDoc, doc, serverTimestamp, updateDoc, writeBatch } from "firebase/firestore";
import { db } from "../../firebase";
import { DAILY_PROGRAMS_DB } from "./constants";
import { useToast } from "primevue";
import { ref } from "vue";
import { storeToRefs } from "pinia";
import { useGlobalStore } from "../stores/GlobalStore";

export const useDailyProgramsCrud = () => {
  const toast = useToast();
  const { dailyPrograms } = storeToRefs(useGlobalStore());
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

  const deleteAllDailyPrograms = async () => {
    const all = dailyPrograms.value.filter((p) => p.id);
    if (!all.length) return;
    loading.value = true;
    try {
      let batch = writeBatch(db);
      let ops = 0;
      for (const p of all) {
        batch.delete(doc(db, DAILY_PROGRAMS_DB, p.id));
        ops++;
        if (ops === 500) {
          await batch.commit();
          batch = writeBatch(db);
          ops = 0;
        }
      }
      if (ops > 0) await batch.commit();
      toast.add({ severity: "success", summary: "ყველა პროგრამა წაიშალა", life: 3000 });
    } catch (err) {
      console.error(err);
      toast.add({ severity: "error", summary: "მოხდა შეცდომა", detail: "პროგრამები ვერ წაიშალა", life: 3000 });
    } finally {
      loading.value = false;
    }
  };

  return { loading, addDailyProgram, updateDailyProgram, deleteDailyProgram, deleteAllDailyPrograms };
};
