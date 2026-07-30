import { useToast } from "primevue";
import type { Announcement } from "../type/interfaces";
import { ref } from "vue";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "../../firebase";
import { ANNOUNCEMENTS_DB } from "./constants";
import { storeToRefs } from "pinia";
import { useGlobalStore } from "../stores/GlobalStore";

export const useAnnouncementsCrud = () => {
  const toast = useToast();
  const { announcements } = storeToRefs(useGlobalStore());

  const loading = ref(false);

  const addAnnouncement = async (announcement: Omit<Announcement, "id">) => {
    loading.value = true;

    try {
      await addDoc(collection(db, ANNOUNCEMENTS_DB), announcement);
      toast.add({
        severity: "success",
        summary: "განცხადება დამატებულია",
        life: 3000,
      });
    } catch (err) {
      console.error(err);
      toast.add({
        severity: "error",
        summary: "მოხდა შეცდომა",
        detail: "განცხადება ვერ გამოქვეყნდა",
        life: 3000,
      });
    } finally {
      loading.value = false;
    }
  };

  const updateAnnouncement = async (
    id: string,
    announcement: Omit<Announcement, "id">
  ) => {
    loading.value = true;

    try {
      const announcementRef = doc(db, ANNOUNCEMENTS_DB, id);
      const { ...updatedData } = announcement;

      await updateDoc(announcementRef, updatedData);

      toast.add({
        severity: "success",
        summary: "განცხადება განახლებულია",
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

  const deleteAnnouncement = async (id: string) => {
    loading.value = true;

    try {
      await deleteDoc(doc(db, ANNOUNCEMENTS_DB, id));
      toast.add({
        severity: "success",
        summary: "განცხადება წაიშალა",
        life: 3000,
      });
    } catch (err) {
      console.error(err);
      toast.add({
        severity: "error",
        summary: "მოხდა შეცდომა",
        detail: "განცხადება ვერ წაიშალა",
        life: 3000,
      });
    } finally {
      loading.value = false;
    }
  };

  const deleteAllAnnouncements = async () => {
    const all = announcements.value.filter((a) => a.id);
    if (!all.length) return;
    loading.value = true;
    try {
      let batch = writeBatch(db);
      let ops = 0;
      for (const a of all) {
        batch.delete(doc(db, ANNOUNCEMENTS_DB, a.id));
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
        summary: "ყველა განცხადება წაიშალა",
        life: 3000,
      });
    } catch (err) {
      console.error(err);
      toast.add({
        severity: "error",
        summary: "მოხდა შეცდომა",
        detail: "განცხადებები ვერ წაიშალა",
        life: 3000,
      });
    } finally {
      loading.value = false;
    }
  };

  return {
    loading,
    addAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    deleteAllAnnouncements,
  };
};
