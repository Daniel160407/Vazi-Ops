import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type {
  Group,
  Club,
  ClubBooking,
  Schedule,
  Event,
  Deadline,
  EveningScheduleItem,
  GoldenVerse,
} from "../type/interfaces";
import {
  GROUPS_DB,
  CLUBS_DB,
  CLUB_BOOKINGS_DB,
  SCHEDULES_DB,
  EVENTS_DB,
  DEADLINE_DB,
  EVENING_SCHEDULE_DB,
  GOLDEN_VERSES_DB,
} from "../composables/constants";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../../firebase";
import { useToast } from "primevue";

export const useGlobalStore = defineStore("globalStore", () => {
  const toast = useToast();

  const groups = ref<Group[]>([]);
  const clubs = ref<Club[]>([]);
  const clubBookings = ref<ClubBooking[]>([]);
  const schedules = ref<Schedule[]>([]);
  const eveningScheduleItems = ref<EveningScheduleItem[]>([]);
  const events = ref<Event[]>([]);
  const deadline = ref<Deadline | null>(null);
  const goldenVerses = ref<GoldenVerse[]>([]);

  const loadingCount = ref<number>(0);

  const loading = computed(() => loadingCount.value > 0);

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
        const querySnapshot = await getDocs(collection(db, CLUBS_DB));

        clubs.value = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...(data as Omit<Club, "id" | "time">),
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
            ...(data as Omit<ClubBooking, "id" | "created_at">),
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

  const fetchSchedules = async () => {
    await withLoading(async () => {
      try {
        const querySnapshot = await getDocs(collection(db, SCHEDULES_DB));
        schedules.value = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Schedule, "id">),
        }));
      } catch (err) {
        console.error("Fetch Error:", err);
        toast.add({
          severity: "error",
          summary: "მოხდა შეცდომა",
          detail: "განრიგის ინფორმაცია ვერ ჩაიტვირთა",
          life: 3000,
        });
      }
    });
  };

  const fetchEveningSchedule = async () => {
    await withLoading(async () => {
      try {
        const querySnapshot = await getDocs(
          collection(db, EVENING_SCHEDULE_DB)
        );
        eveningScheduleItems.value = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<EveningScheduleItem, "id">),
        }));
      } catch (err) {
        console.error(err);
        toast.add({
          severity: "error",
          summary: "შეცდომა",
          detail: "განრიგი ვერ ჩაიტვირთა",
          life: 3000,
        });
      }
    });
  };

  const fetchEvents = async () => {
    await withLoading(async () => {
      try {
        const querySnapshot = await getDocs(collection(db, EVENTS_DB));
        events.value = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Event, "id">),
        }));
      } catch (err) {
        console.error("Fetch Error:", err);
        toast.add({
          severity: "error",
          summary: "მოხდა შეცდომა",
          detail: "საღამოს გამოსვლებზე ინფორმაცია ვერ ჩაიტვირთა",
          life: 3000,
        });
      }
    });
  };

  const fetchDeadline = async () => {
    await withLoading(async () => {
      try {
        const querySnapshot = await getDocs(collection(db, DEADLINE_DB));

        if (!querySnapshot.empty) {
          const docSnap = querySnapshot.docs[0];
          const data = docSnap!.data();

          deadline.value = {
            id: docSnap!.id,
            time: data.time?.toDate ? data.time.toDate() : new Date(data.time),
          } as Deadline;
        }
      } catch (err) {
        console.error("Deadline Fetch Error:", err);
        toast.add({
          severity: "error",
          summary: "შეცდომა",
          detail: "დედლაინი ვერ ჩაიტვირთა",
          life: 3000,
        });
      }
    });
  };

  const fetchGoldenVerses = async () => {
    await withLoading(async () => {
      try {
        const q = query(
          collection(db, GOLDEN_VERSES_DB),
          orderBy("day", "asc")
        );
        const querySnapshot = await getDocs(q);

        goldenVerses.value = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<GoldenVerse, "id">),
        }));
      } catch (err) {
        console.error(err);
        toast.add({
          severity: "error",
          summary: "შეცდომა",
          detail: "ოქროს მუხლების სია ვერ ჩაიტვირთა",
          life: 3000,
        });
      }
    });
  };

  const setData = async () => {
    await Promise.all([
      fetchGroups(),
      fetchClubs(),
      fetchClubBookings(),
      fetchSchedules(),
      fetchEveningSchedule(),
      fetchEvents(),
      fetchDeadline(),
      fetchGoldenVerses(),
    ]);
  };

  return {
    groups,
    clubs,
    clubBookings,
    schedules,
    eveningScheduleItems,
    events,
    deadline,
    goldenVerses,

    loading,

    fetchGroups,
    fetchClubs,
    fetchClubBookings,
    fetchSchedules,
    fetchEveningSchedule,
    fetchEvents,
    fetchDeadline,
    fetchGoldenVerses,

    setData,
  };
});
