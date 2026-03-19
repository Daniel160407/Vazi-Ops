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
  Announcement,
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
  ANNOUNCEMENTS_DB,
} from "../composables/constants";
import {
  collection,
  FirestoreError,
  onSnapshot,
  orderBy,
  Query,
  query,
  QueryDocumentSnapshot,
  QuerySnapshot,
  type DocumentData,
} from "firebase/firestore";
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
  const announcements = ref<Announcement[]>([]);

  const loadingCount = ref<number>(0);
  const loading = computed(() => loadingCount.value > 0);

  const subscriptions: Record<string, () => void> = {};

  const subscribe = (
    key: string,
    collectionName: string,
    callback: (data: any[]) => void,
    queryConstraints?: Query<DocumentData>
  ) => {
    if (subscriptions[key]) return;

    loadingCount.value++;

    const q: Query<DocumentData> =
      queryConstraints || query(collection(db, collectionName));

    subscriptions[key] = onSnapshot(
      q,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const data = snapshot.docs.map(
          (doc: QueryDocumentSnapshot<DocumentData>) => ({
            id: doc.id,
            ...doc.data(),
          })
        );

        callback(data);

        if (loadingCount.value > 0) loadingCount.value--;
      },
      (err: FirestoreError) => {
        console.error(`Listener Error (${key}):`, err);
        if (loadingCount.value > 0) loadingCount.value--;
        toast.add({
          severity: "error",
          summary: "შეცდომა",
          detail: "მონაცემების სინქრონიზაცია ვერ მოხერხდა",
        });
      }
    );
  };

  const fetchClubs = () => {
    subscribe("clubs", CLUBS_DB, (data) => {
      clubs.value = data.map((d) => ({
        ...d,
        time: d.time?.toDate ? d.time.toDate() : new Date(d.time),
      })) as Club[];
    });
  };

  const fetchAnnouncements = () => {
    const q = query(collection(db, ANNOUNCEMENTS_DB), orderBy("date", "desc"));
    subscribe(
      "announcements",
      ANNOUNCEMENTS_DB,
      (data) => {
        announcements.value = data as Announcement[];
      },
      q
    );
  };

  const fetchClubBookings = () => {
    subscribe("bookings", CLUB_BOOKINGS_DB, (data) => {
      clubBookings.value = data.map((d) => ({
        ...d,
        created_at: d.created_at?.toDate
          ? d.created_at.toDate()
          : new Date(d.created_at),
      })) as ClubBooking[];
    });
  };

  const fetchGroups = () =>
    subscribe("groups", GROUPS_DB, (data) => (groups.value = data as Group[]));
  const fetchSchedules = () =>
    subscribe(
      "schedules",
      SCHEDULES_DB,
      (data) => (schedules.value = data as Schedule[])
    );
  const fetchEveningSchedule = () => {
    const q = query(
      collection(db, EVENING_SCHEDULE_DB),
      orderBy("position", "asc")
    );

    subscribe(
      "evening",
      EVENING_SCHEDULE_DB,
      (data) => (eveningScheduleItems.value = data as EveningScheduleItem[]),
      q
    );
  };
  const fetchEvents = () =>
    subscribe("events", EVENTS_DB, (data) => (events.value = data as Event[]));

  const fetchDeadline = () => {
    if (subscriptions["deadline"]) return;
    onSnapshot(collection(db, DEADLINE_DB), (snap) => {
      if (!snap.empty) {
        const d = snap.docs[0]!.data();
        deadline.value = {
          id: snap.docs[0]!.id,
          time: d.time?.toDate ? d.time.toDate() : new Date(d.time),
        } as Deadline;
      }
    });
  };

  const fetchGoldenVerses = () => {
    const q = query(collection(db, GOLDEN_VERSES_DB), orderBy("day", "asc"));
    subscribe(
      "verses",
      GOLDEN_VERSES_DB,
      (data) => (goldenVerses.value = data as GoldenVerse[]),
      q
    );
  };

  const setData = () => {
    fetchGroups();
    fetchClubs();
    fetchClubBookings();
    fetchSchedules();
    fetchEveningSchedule();
    fetchEvents();
    fetchDeadline();
    fetchGoldenVerses();
    fetchAnnouncements();
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
    announcements,
    loading,
    setData,
  };
});
