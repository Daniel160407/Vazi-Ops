import { defineStore } from "pinia";
import { ref } from "vue";
import type { Group } from "../type/interfaces";
import { GROUPS_DB } from "../composables/constants";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import { useToast } from "primevue";

export const useGlobalStore = defineStore("globalStore", () => {
  const toast = useToast();

  const groups = ref<Group[]>([]);
  const loadingCount = ref<number>(0);

  const withLoading = async <T>(
    fn: () => Promise<T>
  ): Promise<T | undefined> => {
    loadingCount.value++;
    try {
      return await fn();
    } finally {
      loadingCount.value--;
    }
  };

  const fetchGroups = async () => {
    await withLoading(async () => {
      try {
        const querySnapshot = await getDocs(collection(db, GROUPS_DB));

        groups.value = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Group, "id">),
        }));
      } catch (err) {
        console.error("Fetch Error:", err);
        toast.add({
          severity: "error",
          summary: "Error appeared",
          detail: "Groups could not be fetched",
          life: 3000,
        });
      }
    });
  };

  const setData = async () => {
    await Promise.allSettled([fetchGroups()]);
  };

  return {
    groups,
    
    loadingCount,
    fetchGroups,
    withLoading,

    setData,
  };
});
