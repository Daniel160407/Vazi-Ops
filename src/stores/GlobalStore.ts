import { defineStore } from "pinia";
import { ref } from "vue";
import type { Group, Club, ClubBooking } from "../type/interfaces";
import {
  GROUPS_DB,
  CLUBS_DB,
  CLUB_BOOKINGS_DB,
} from "../composables/constants";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import { useToast } from "primevue";

export const useGlobalStore = defineStore("globalStore", () => {
  const toast = useToast();

  const groups = ref<Group[]>([]);
  const clubs = ref<Club[]>([]);
  const clubBookings = ref<ClubBooking[]>([]);
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
          summary: "მოხდა შეცდომა",
          detail: "ჯგუფების ინფორმაცია ვერ ჩაიტვირთა",
          life: 3000,
        });
      }
    });
  };

  const fetchClubs = async () => {
    await withLoading(async () => {
      try {
        // Fetch documents from Firestore
        const querySnapshot = await getDocs(collection(db, CLUBS_DB));

        // Map documents to the Club type and update the state
        clubs.value = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...(data as Omit<Club, "id" | "time">),
            // Convert Firestore Timestamp to JS Date
            time: data.time?.toDate ? data.time.toDate() : new Date(data.time),
          } as Club;
        });
      } catch (err) {
        console.error("Fetch Error:", err);
        toast.add({
          severity: "error",
          summary: "მოხდა შეცდომა",
          detail: "წრეების ინფორმაცია ვერ ჩაიტვირთა",
          life: 3000,
        });
      }
    });
  };
  const fetchClubBookings = async () => {
    await withLoading(async () => {
      try {
        const querySnapshot = await getDocs(collection(db, CLUB_BOOKINGS_DB));
        clubBookings.value = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            // Spread the rest of the data
            ...(data as Omit<ClubBooking, "id" | "created_at">),
            // Convert Firestore Timestamp or String to JS Date
            created_at: data.created_at?.toDate
              ? data.created_at.toDate()
              : new Date(data.created_at),
          } as ClubBooking;
        });
      } catch (err) {
        console.error("Fetch Error:", err);
        toast.add({
          severity: "error",
          summary: "მოხდა შეცდომა",
          detail: "კლუბების რეგისტრაციები ვერ ჩაიტვირთა",
          life: 3000,
        });
      }
    });
  };

  const setData = async () => {
    // Ensuring all functions complete and loading state is managed
    await Promise.all([fetchGroups(), fetchClubs(), fetchClubBookings()]);
  };

  return {
    groups,
    clubs,
    clubBookings,
    loadingCount,
    fetchGroups,
    fetchClubs,
    fetchClubBookings,
    withLoading,
    setData,
  };
});
