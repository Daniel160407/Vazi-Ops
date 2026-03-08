import { computed, ref } from "vue";
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
import { useGlobalStore } from "../stores/GlobalStore";
import { storeToRefs } from "pinia";

export function useGroupsCrud() {
  const toast = useToast();
  const globalStore = useGlobalStore();
  const { loading: loadingStore, groups } = storeToRefs(globalStore);
  const { fetchGroups } = globalStore;

  const saving = ref(false);
  const loading = computed(() => loadingStore && saving);

  const addGroup = async (group: Omit<Group, "id">) => {
    saving.value = true;
    try {
      const isCottageOccupied = groups.value.some(
        (g) => g.cottage_num === group.cottage_num
      );

      if (isCottageOccupied) {
        toast.add({
          severity: "error",
          summary: "კოტეჯი დაკავებულია",
          detail: `მე-${group.cottage_num} კოტეჯი უკვე დაკავებულია!`,
          life: 3000,
        });
        return;
      }

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
      saving.value = false;
    }
  };

  const updateGroup = async (group: Group) => {
    if (!group.id) return;
    saving.value = true;
    try {
      const isCottageOccupied = groups.value.some(
        (g) => g.cottage_num === group.cottage_num && g.id !== group.id
      );

      if (isCottageOccupied) {
        toast.add({
          severity: "error",
          summary: "კოტეჯი დაკავებულია",
          detail: `მე-${group.cottage_num} კოტეჯი უკვე დაკავებულია სხვა ჯგუფის მიერ!`,
          life: 3000,
        });
        return;
      }

      const groupRef = doc(db, GROUPS_DB, group.id);
      const { id, ...groupData } = group;
      await updateDoc(groupRef, groupData);

      toast.add({
        severity: "success",
        summary: "ჯგუფი განახლებულია",
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
      saving.value = false;
    }
  };

  const deleteGroup = async (groupId: string) => {
    saving.value = true;
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
      saving.value = false;
    }
  };

  return {
    groups,
    loading,

    fetchGroups,
    addGroup,
    updateGroup,
    deleteGroup,
  };
}
