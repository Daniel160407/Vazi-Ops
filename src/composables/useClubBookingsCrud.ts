import { ref } from "vue";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  runTransaction,
  writeBatch,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../../firebase";
import { CLUB_BOOKINGS_DB, CLUBS_DB } from "../composables/constants";
import type { ClubBooking } from "../type/interfaces";
import { useToast } from "primevue";
import { useGlobalStore } from "../stores/GlobalStore";
import { storeToRefs } from "pinia";

export function useClubBookingsCrud() {
  const toast = useToast();

  const { clubBookings } = storeToRefs(useGlobalStore());

  const loading = ref(false);

  const fetchUserBookings = async (
    childFirstName: string,
    childLastName: string,
    leaderName: string,
    groupName: string
  ) => {
    const bookingsRef = collection(db, CLUB_BOOKINGS_DB);
    const q = query(
      bookingsRef,
      where("child_first_name", "==", childFirstName),
      where("child_last_name", "==", childLastName),
      where("leader_name", "==", leaderName),
      where("group_name", "==", groupName)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (d) =>
        ({
          id: d.id,
          ...(d.data() as Omit<ClubBooking, "id">),
        } as ClubBooking)
    );
  };

  const addBooking = async (
    booking: Omit<ClubBooking, "id" | "created_at">
  ) => {
    loading.value = true;
    try {
      await addDoc(collection(db, CLUB_BOOKINGS_DB), {
        ...booking,
        created_at: new Date().toISOString(),
      });
      toast.add({
        severity: "success",
        summary: "რეგისტრაცია დამატებულია",
        life: 3000,
      });
    } catch (err) {
      console.error(err);
      toast.add({
        severity: "error",
        summary: "მოხდა შეცდომა",
        detail: "რეგისტრაცია ვერ დაემატა",
        life: 3000,
      });
    } finally {
      loading.value = false;
    }
  };

  const updateBooking = async (booking: ClubBooking) => {
    if (!booking.id) return;
    loading.value = true;
    try {
      const { id, ...data } = booking;
      const bookingRef = doc(db, CLUB_BOOKINGS_DB, id);
      await updateDoc(bookingRef, data);
      toast.add({
        severity: "success",
        summary: "რეგისტრაცია განახლებულია",
        life: 3000,
      });
    } catch (err) {
      console.error(err);
      toast.add({
        severity: "error",
        summary: "მოხდა შეცდომა",
        detail: "რეგისტრაცია ვერ განახლდა",
        life: 3000,
      });
    } finally {
      loading.value = false;
    }
  };

  const deleteBooking = async (id: string) => {
    loading.value = true;
    try {
      await runTransaction(db, async (transaction) => {
        const bookingRef = doc(db, CLUB_BOOKINGS_DB, id);
        const bookingSnap = await transaction.get(bookingRef);

        if (!bookingSnap.exists()) {
          return;
        }

        const bookingData = bookingSnap.data() as Omit<ClubBooking, "id">;

        if (bookingData.club_id) {
          const clubRef = doc(db, CLUBS_DB, bookingData.club_id);
          const clubSnap = await transaction.get(clubRef);

          if (clubSnap.exists()) {
            const clubData = clubSnap.data() as any;
            const slots: any[] = Array.isArray(clubData.slots) && clubData.slots.length
              ? clubData.slots.map((s: any) => ({ ...s }))
              : [{ id: "legacy", time: clubData.time ?? null, places_quantity: clubData.places_quantity ?? 0 }];
            const idx = slots.findIndex((s) => s.id === (bookingData.slot_id ?? "legacy"));
            if (idx !== -1) {
              slots[idx] = { ...slots[idx], places_quantity: (slots[idx].places_quantity ?? 0) + 1 };
              transaction.update(clubRef, { slots });
            }
          }
        }

        transaction.delete(bookingRef);
      });

      toast.add({
        severity: "success",
        summary: "რეგისტრაცია წაიშალა",
        life: 3000,
      });
    } catch (err) {
      console.error(err);
      toast.add({
        severity: "error",
        summary: "მოხდა შეცდომა",
        detail: "რეგისტრაცია ვერ წაიშალა",
        life: 3000,
      });
    } finally {
      loading.value = false;
    }
  };

  const deleteAllBookings = async () => {
    const all = clubBookings.value.filter((b) => b.id);
    if (!all.length) return;

    loading.value = true;
    try {
      const restore = new Map<string, Map<string, number>>();
      all.forEach((b) => {
        if (!b.club_id) return;
        const slotKey = b.slot_id ?? "legacy";
        if (!restore.has(b.club_id)) restore.set(b.club_id, new Map());
        const slotCounts = restore.get(b.club_id)!;
        slotCounts.set(slotKey, (slotCounts.get(slotKey) ?? 0) + 1);
      });

      for (const [clubId, slotCounts] of restore) {
        const clubRef = doc(db, CLUBS_DB, clubId);
        const clubSnap = await getDoc(clubRef);
        if (!clubSnap.exists()) continue;

        const clubData = clubSnap.data() as any;
        const slots: any[] = Array.isArray(clubData.slots) && clubData.slots.length
          ? clubData.slots.map((s: any) => ({ ...s }))
          : [{ id: "legacy", time: clubData.time ?? null, places_quantity: clubData.places_quantity ?? 0 }];

        slotCounts.forEach((count, slotId) => {
          const idx = slots.findIndex((s) => s.id === slotId);
          if (idx !== -1) {
            slots[idx] = { ...slots[idx], places_quantity: (slots[idx].places_quantity ?? 0) + count };
          }
        });

        await updateDoc(clubRef, { slots });
      }

      let batch = writeBatch(db);
      let ops = 0;
      for (const b of all) {
        batch.delete(doc(db, CLUB_BOOKINGS_DB, b.id));
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
        summary: "ყველა რეგისტრაცია წაიშალა",
        life: 3000,
      });
    } catch (err) {
      console.error(err);
      toast.add({
        severity: "error",
        summary: "მოხდა შეცდომა",
        detail: "რეგისტრაციები ვერ წაიშალა",
        life: 3000,
      });
    } finally {
      loading.value = false;
    }
  };

  return {
    bookings: clubBookings,
    loading,
    fetchUserBookings,
    addBooking,
    updateBooking,
    deleteBooking,
    deleteAllBookings,
  };
}
