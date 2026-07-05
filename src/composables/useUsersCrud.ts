import { computed, ref } from "vue";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "@/firebase";
import { USERS_DB } from "@/composables/constants";
import type { UserRole } from "@/type/interfaces";
import type { AppUser } from "@/type/interfaces";
import { useToast } from "primevue";
import { useGlobalStore } from "@/stores/GlobalStore";
import { storeToRefs } from "pinia";

export function useUsersCrud() {
  const toast = useToast();
  const { loading: loadingStore, appUsers } = storeToRefs(useGlobalStore());

  const saving = ref(false);
  const loading = computed(() => loadingStore.value || saving.value);

  const addUser = async (appUser: Omit<AppUser, "id">) => {
    saving.value = true;
    try {
      const usersRef = collection(db, USERS_DB);
      const q = query(usersRef, where("email", "==", appUser.email));
      const existing = await getDocs(q);
      if (!existing.empty) {
        toast.add({
          severity: "error",
          summary: "ელ-ფოსტა დაკავებულია",
          detail: "ამ ელ-ფოსტით მომხმარებელი უკვე არსებობს",
          life: 3000,
        });
        return;
      }

      const docRef = await addDoc(collection(db, USERS_DB), appUser);
      toast.add({
        severity: "success",
        summary: "მომხმარებელი დამატებულია",
        life: 3000,
      });
      return docRef.id;
    } catch (err) {
      console.error(err);
      toast.add({
        severity: "error",
        summary: "მოხდა შეცდომა",
        detail: "მომხმარებელი ვერ დაემატა",
        life: 3000,
      });
    } finally {
      saving.value = false;
    }
  };

  const updateUser = async (appUser: AppUser) => {
    if (!appUser.id) return;
    saving.value = true;
    try {
      const usersRef = collection(db, USERS_DB);
      const q = query(usersRef, where("email", "==", appUser.email));
      const existing = await getDocs(q);
      const conflict = existing.docs.find((d) => d.id !== appUser.id);
      if (conflict) {
        toast.add({
          severity: "error",
          summary: "ელ-ფოსტა დაკავებულია",
          detail: "ამ ელ-ფოსტით სხვა მომხმარებელი უკვე არსებობს",
          life: 3000,
        });
        return;
      }

      const userRef = doc(db, USERS_DB, appUser.id);
      const { id, ...userData } = appUser;
      await updateDoc(userRef, userData);

      toast.add({
        severity: "success",
        summary: "მომხმარებელი განახლებულია",
        life: 3000,
      });
    } catch (err) {
      console.error(err);
      toast.add({
        severity: "error",
        summary: "მოხდა შეცდომა",
        detail: "მომხმარებელი ვერ განახლდა",
        life: 3000,
      });
    } finally {
      saving.value = false;
    }
  };

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    saving.value = true;
    try {
      await updateDoc(doc(db, USERS_DB, userId), { role: newRole });
      toast.add({
        severity: "success",
        summary: "როლი შეიცვალა",
        life: 3000,
      });
    } catch (err) {
      console.error(err);
      toast.add({
        severity: "error",
        summary: "მოხდა შეცდომა",
        detail: "როლი ვერ შეიცვალა",
        life: 3000,
      });
    } finally {
      saving.value = false;
    }
  };

  const deleteUser = async (userId: string) => {
    saving.value = true;
    try {
      await deleteDoc(doc(db, USERS_DB, userId));
      toast.add({
        severity: "success",
        summary: "მომხმარებელი წაიშალა",
        life: 3000,
      });
    } catch (err) {
      console.error(err);
      toast.add({
        severity: "error",
        summary: "მოხდა შეცდომა",
        detail: "მომხმარებელი ვერ წაიშალა",
        life: 3000,
      });
    } finally {
      saving.value = false;
    }
  };

  return {
    appUsers,
    loading,
    addUser,
    updateUser,
    updateUserRole,
    deleteUser,
  };
}
