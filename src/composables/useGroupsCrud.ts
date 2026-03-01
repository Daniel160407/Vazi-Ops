import { ref } from "vue";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../../firebase";
import { GROUPS_DB } from "../composables/constants";
import type { Group } from "../type/interfaces";
import { useToast } from "primevue";

export function useGroupsCrud() {
  const toast = useToast();

  const groups = ref<Group[]>([]);
  const loading = ref(false);

  const addGroup = async (group: Omit<Group, "id">) => {
    loading.value = true;
    try {
      const docRef = await addDoc(collection(db, GROUPS_DB), group);
      toast.add({
        severity: "success",
        summary: "ჯგუფი შენახულია",
        life: 3000,
      });
      return docRef.id;
    } catch (err) {
      console.error(err);
      toast.add({
        severity: "error",
        summary: "მოხდა შეცდომა",
        detail: "ჯგუფი ვერ დაემატა",
        life: 3000,
      });
    } finally {
      loading.value = false;
    }
  };

  const updateGroup = async (group: Group) => {
    if (!group.id) return;
    loading.value = true;
    try {
      const groupRef = doc(db, GROUPS_DB, group.id);
      const { id, ...groupData } = group;
      await updateDoc(groupRef, groupData);

      toast.add({
        severity: "success",
        summary: "განახლებული ჯგუფი შენახულია",
        life: 3000,
      });
    } catch (err) {
      console.error(err);
      toast.add({
        severity: "error",
        summary: "მოხდა შეცდომა",
        detail: "ჯგუფი ვერ განახლდა",
        life: 3000,
      });
    } finally {
      loading.value = false;
    }
  };

  const deleteGroup = async (groupId: string) => {
    loading.value = true;
    try {
      await deleteDoc(doc(db, GROUPS_DB, groupId));
      toast.add({
        severity: "success",
        summary: "ჯგუფი წაიშალა",
        life: 3000,
      });
    } catch (err) {
      console.error(err);
      toast.add({
        severity: "error",
        summary: "მოხდა შეცდომა",
        detail: "ჯგუფი ვერ წაიშალა",
        life: 3000,
      });
    } finally {
      loading.value = false;
    }
  };

  return {
    groups,
    loading,
    addGroup,
    updateGroup,
    deleteGroup,
  };
}
