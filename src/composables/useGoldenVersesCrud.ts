import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "../../firebase";
import { GOLDEN_VERSES_DB } from "./constants";
import type { GoldenVerse } from "../type/interfaces";
import { useToast } from "primevue";
import { ref } from "vue";
import { storeToRefs } from "pinia";
import { useGlobalStore } from "../stores/GlobalStore";

export const useGoldenVersesCrud = () => {
  const toast = useToast();
  const { goldenVerses } = storeToRefs(useGlobalStore());

  const loading = ref(false);

  const addGoldenVerse = async (verse: Omit<GoldenVerse, "id">) => {
    loading.value = true;

    try {
      await addDoc(collection(db, GOLDEN_VERSES_DB), verse);
      toast.add({
        severity: "success",
        summary: "ოქროს მუხლი დამატებულია",
        life: 3000,
      });
    } catch (err) {
      console.error(err);
      toast.add({
        severity: "error",
        summary: "მოხდა შეცდომა",
        detail: "ოქროს მუხლი ვერ დაემატა",
        life: 3000,
      });
    } finally {
      loading.value = false;
    }
  };

  const updateGoldenVerse = async (
    id: string,
    verse: Omit<GoldenVerse, "id">
  ) => {
    loading.value = true;

    try {
      const verseRef = doc(db, GOLDEN_VERSES_DB, id);
      const { ...updateData } = verse;

      await updateDoc(verseRef, updateData);

      toast.add({
        severity: "success",
        summary: "ოქროს მუხლი განახლებულია",
        life: 3000,
      });
    } catch (err) {
      console.error(err);
      toast.add({
        severity: "error",
        summary: "მოხდა შეცდომა",
        detail: "ოქროს მუხლი ვერ განახლდა",
        life: 3000,
      });
    } finally {
      loading.value = false;
    }
  };

  const deleteGoldenVerse = async (id: string) => {
    loading.value = true;

    try {
      await deleteDoc(doc(db, GOLDEN_VERSES_DB, id));
      toast.add({
        severity: "success",
        summary: "ოქროს მუხლი წაიშალა",
        life: 3000,
      });
    } catch (err) {
      console.error(err);
      toast.add({
        severity: "error",
        summary: "მოხდა შეცდომა",
        detail: "ოქროს მუხლი ვერ წაიშალა",
        life: 3000,
      });
    } finally {
      loading.value = false;
    }
  };

  const deleteAllGoldenVerses = async () => {
    const all = goldenVerses.value.filter((v) => v.id);
    if (!all.length) return;
    loading.value = true;
    try {
      let batch = writeBatch(db);
      let ops = 0;
      for (const v of all) {
        batch.delete(doc(db, GOLDEN_VERSES_DB, v.id));
        ops++;
        if (ops === 500) {
          await batch.commit();
          batch = writeBatch(db);
          ops = 0;
        }
      }
      if (ops > 0) await batch.commit();
      toast.add({
        severity: "success",
        summary: "ყველა მუხლი წაიშალა",
        life: 3000,
      });
    } catch (err) {
      console.error(err);
      toast.add({
        severity: "error",
        summary: "მოხდა შეცდომა",
        detail: "მუხლები ვერ წაიშალა",
        life: 3000,
      });
    } finally {
      loading.value = false;
    }
  };

  return {
    loading,

    addGoldenVerse,
    updateGoldenVerse,
    deleteGoldenVerse,
    deleteAllGoldenVerses,
  };
};
