import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type {
  Group,
  Club,
  ClubBooking,
  ClubRegistration,
  Schedule,
  Event,
  Deadline,
  EveningScheduleItem,
  GoldenVerse,
  Announcement,
  AppUser,
  TableData,
  PageVisibility,
  DailyProgram,
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
  USERS_DB,
  TABLE_DB,
  PAGE_VISIBILITY_DB,
  DAILY_PROGRAMS_DB,
} from "../composables/constants";
import type {
  FirestoreError,
  Query,
  QueryDocumentSnapshot,
  QuerySnapshot} from "firebase/firestore";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  type DocumentData,
} from "firebase/firestore";
import { db } from "../../firebase";
import { useToast } from "primevue";

export const useGlobalStore = defineStore("globalStore", () => {
  const toast = useToast();

  const tableData = ref<TableData | null>(null);
  const tableDataLoaded = ref(false);
  const appUsers = ref<AppUser[]>([]);
  const pageVisibilities = ref<PageVisibility[]>([]);
  const groups = ref<Group[]>([]);
  const clubs = ref<Club[]>([]);
  const clubBookings = ref<ClubBooking[]>([]);
  const clubRegistration = ref<ClubRegistration | null>(null);
  const schedules = ref<Schedule[]>([]);
  const eveningScheduleItems = ref<EveningScheduleItem[]>([]);
  const events = ref<Event[]>([]);
  const deadline = ref<Deadline | null>(null);
  const goldenVerses = ref<GoldenVerse[]>([]);
  const announcements = ref<Announcement[]>([]);
  const dailyPrograms = ref<DailyProgram[]>([]);

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

  const toDate = (value: any) =>
    value?.toDate ? value.toDate() : value ? new Date(value) : null;

  const minutesOfDay = (d: Date | null) =>
    d ? d.getHours() * 60 + d.getMinutes() : Infinity;

  const fetchClubs = () => {
    subscribe("clubs", CLUBS_DB, (data) => {
      clubs.value = data.map((d) => {
        const legacyTime = toDate(d.time);
        const slots = (Array.isArray(d.slots) && d.slots.length
          ? d.slots.map((s: any) => ({ ...s, time: toDate(s.time) }))
          : [{ id: "legacy", time: legacyTime, places_quantity: d.places_quantity ?? 0 }]
        ).sort((a: any, b: any) => minutesOfDay(a.time) - minutesOfDay(b.time));
        return { ...d, time: legacyTime, slots };
      }) as Club[];
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
      clubBookings.value = data
        .filter((d) => d.id !== "registration")
        .map((d) => ({
          ...d,
          slot_time: toDate(d.slot_time),
          created_at: d.created_at?.toDate
            ? d.created_at.toDate()
            : new Date(d.created_at),
        })) as ClubBooking[];
    });
  };

  const fetchAppUsers = () =>
    subscribe("users", USERS_DB, (data) => (appUsers.value = data as AppUser[]));

  const pageVisibilitiesLoaded = ref(false);

  const fetchPageVisibilities = () =>
    subscribe("pageVisibilities", PAGE_VISIBILITY_DB, (data) => {
      pageVisibilities.value = data as PageVisibility[];
      pageVisibilitiesLoaded.value = true;
    });

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

  const fetchTableData = () => {
    if (subscriptions["tableData"]) return;
    loadingCount.value++;
    subscriptions["tableData"] = onSnapshot(doc(db, TABLE_DB, "main"), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        tableData.value = {
          id: snap.id,
          headers: d.headers,
          row_labels: d.row_labels,
          cells: (d.cells as Array<{ values: string[] }>).map((r) => r.values),
        } as TableData;
      } else {
        tableData.value = null;
      }
      tableDataLoaded.value = true;
      if (loadingCount.value > 0) loadingCount.value--;
    });
  };

  const fetchClubRegistration = () => {
    if (subscriptions["clubRegistration"]) return;
    subscriptions["clubRegistration"] = onSnapshot(doc(db, CLUB_BOOKINGS_DB, "registration"), (snap) => {
      if (snap.exists()) {
        clubRegistration.value = { id: snap.id, open: snap.data().open ?? false } as ClubRegistration;
      } else {
        clubRegistration.value = null;
      }
    });
  };

  const fetchDailyPrograms = () => {
    const q = query(collection(db, DAILY_PROGRAMS_DB), orderBy("created_at", "asc"));
    subscribe(
      "dailyPrograms",
      DAILY_PROGRAMS_DB,
      (data) =>
        (dailyPrograms.value = data.map((d) => ({
          ...d,
          created_at: d.created_at?.toDate ? d.created_at.toDate() : new Date(d.created_at),
        })) as DailyProgram[]),
      q
    );
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
    fetchTableData();
    fetchAppUsers();
    fetchPageVisibilities();
    fetchGroups();
    fetchClubs();
    fetchClubBookings();
    fetchClubRegistration();
    fetchSchedules();
    fetchEveningSchedule();
    fetchEvents();
    fetchDeadline();
    fetchGoldenVerses();
    fetchAnnouncements();
    fetchDailyPrograms();
  };

  return {
    tableData,
    tableDataLoaded,
    appUsers,
    pageVisibilities,
    pageVisibilitiesLoaded,
    fetchPageVisibilities,
    groups,
    clubs,
    clubBookings,
    clubRegistration,
    schedules,
    eveningScheduleItems,
    events,
    deadline,
    goldenVerses,
    announcements,
    dailyPrograms,
    loading,
    setData,
  };
});
