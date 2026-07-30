import { ref } from "vue";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  runTransaction,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "../../firebase";
import { CLUBS_DB, CLUB_BOOKINGS_DB } from "../composables/constants";
import type { Club, ClubBooking, ClubRegistration } from "../type/interfaces";
import { useToast } from "primevue";
import { storeToRefs } from "pinia";
import { useGlobalStore } from "../stores/GlobalStore";

const serializeSlots = (club: Partial<Club>) =>
  (club.slots ?? []).map((s) => ({
    id: s.id,
    time: s.time ? new Date(s.time) : null,
    places_quantity: Number(s.places_quantity) || 0,
  }));

const rawSlots = (data: any): any[] => {
  if (Array.isArray(data.slots) && data.slots.length) {
    return data.slots.map((s: any) => ({ ...s }));
  }
  return [{ id: "legacy", time: data.time ?? null, places_quantity: data.places_quantity ?? 0 }];
};

export function useClubsCrud() {
  const toast = useToast();
  const { clubs } = storeToRefs(useGlobalStore());
  const loading = ref(false);

  const showToast = (
    severity: "success" | "error" | "warn",
    summary: string,
    detail?: string
  ) => {
    toast.add({
      severity,
      summary,
      detail,
      life: 3000,
    });
  };

  const handleAsyncOperation = async <T>(
    operation: () => Promise<T>,
    errorSummary: string,
    errorDetail: string
  ): Promise<T | undefined> => {
    loading.value = true;
    try {
      return await operation();
    } catch (err) {
      console.error(err);
      showToast("error", errorSummary, errorDetail);
      return undefined;
    } finally {
      loading.value = false;
    }
  };

  const addClub = async (club: Omit<Club, "id">) => {
    return await handleAsyncOperation(
      async () => {
        const payload = {
          name: club.name,
          teacher: club.teacher,
          place: club.place,
          additional_info: club.additional_info,
          slots: serializeSlots(club),
        };
        const docRef = await addDoc(collection(db, CLUBS_DB), payload);
        showToast("success", "წრე შენახულია");
        return docRef.id;
      },
      "მოხდა შეცდომა",
      "წრე ვერ დაემატა"
    );
  };

  const updateClub = async (club: Club) => {
    if (!club.id) return;

    await handleAsyncOperation(
      async () => {
        const clubRef = doc(db, CLUBS_DB, club.id);
        await updateDoc(clubRef, {
          name: club.name,
          teacher: club.teacher,
          place: club.place,
          additional_info: club.additional_info,
          slots: serializeSlots(club),
        });
        showToast("success", "წრე განახლებულია");
      },
      "მოხდა შეცდომა",
      "წრე ვერ განახლდა"
    );
  };

  const deleteClub = async (clubId: string) => {
    await handleAsyncOperation(
      async () => {
        await deleteDoc(doc(db, CLUBS_DB, clubId));
        showToast("success", "წრე წაიშალა");
      },
      "მოხდა შეცდომა",
      "წრე ვერ წაიშალა"
    );
  };

  const deleteAllClubs = async () => {
    const all = clubs.value.filter((c) => c.id);
    if (!all.length) return;
    await handleAsyncOperation(
      async () => {
        let batch = writeBatch(db);
        let ops = 0;
        for (const c of all) {
          batch.delete(doc(db, CLUBS_DB, c.id));
          ops++;
          if (ops === 500) {
            await batch.commit();
            batch = writeBatch(db);
            ops = 0;
          }
        }
        if (ops > 0) await batch.commit();
        showToast("success", "ყველა წრე წაიშალა");
      },
      "მოხდა შეცდომა",
      "წრეები ვერ წაიშალა"
    );
  };

  const registerInClub = async (
    club: Club,
    slotId: string,
    data: Pick<
      ClubBooking,
      "child_first_name" | "child_last_name" | "leader_name" | "group_name"
    >,
    silent = false
  ): Promise<boolean> => {
    if (!club.id || !slotId) return false;

    loading.value = true;
    try {
      await runTransaction(db, async (transaction) => {
        const clubRef = doc(db, CLUBS_DB, club.id);
        const clubSnap = await transaction.get(clubRef);

        if (!clubSnap.exists()) throw new Error("CLUB_NOT_FOUND");

        const clubData = clubSnap.data();
        const slots = rawSlots(clubData);
        const idx = slots.findIndex((s) => s.id === slotId);
        if (idx === -1) throw new Error("SLOT_NOT_FOUND");

        const slot = slots[idx];
        if (!slot.places_quantity || slot.places_quantity <= 0) {
          throw new Error("NO_PLACES_LEFT");
        }

        slots[idx] = { ...slot, places_quantity: slot.places_quantity - 1 };
        transaction.update(clubRef, { slots });

        const bookingRef = doc(collection(db, CLUB_BOOKINGS_DB));
        transaction.set(bookingRef, {
          ...data,
          club_id: club.id,
          club_name: club.name,
          slot_id: slotId,
          slot_time: slot.time ?? null,
          created_at: new Date(),
        });
      });

      if (!silent) showToast("success", "შენ წარმატებით ჩაეწერე ამ წრეზე");
      return true;
    } catch (err: any) {
      console.error(err);
      if (err?.message === "NO_PLACES_LEFT") {
        showToast(
          "warn",
          "ადგილები აღარ არის",
          "ამ წრეში თავისუფალი ადგილი აღარ დარჩა"
        );
      } else {
        showToast("error", "მოხდა შეცდომა", "დარეგისტრირება ვერ მოხერხდა");
      }
      return false;
    } finally {
      loading.value = false;
    }
  };

  const changeClubBooking = async (
    oldBooking: ClubBooking,
    newClub: Club,
    newSlotId: string
  ) => {
    if (!oldBooking.id || !oldBooking.club_id || !newClub.id || !newSlotId) return;

    const oldSlotId = oldBooking.slot_id ?? "legacy";
    const sameClub = oldBooking.club_id === newClub.id;

    loading.value = true;
    try {
      await runTransaction(db, async (transaction) => {
        const oldClubRef = doc(db, CLUBS_DB, oldBooking.club_id);
        const newClubRef = doc(db, CLUBS_DB, newClub.id);
        const bookingRef = doc(db, CLUB_BOOKINGS_DB, oldBooking.id);

        const [oldClubSnap, newClubSnap, bookingSnap] = await Promise.all([
          transaction.get(oldClubRef),
          sameClub ? Promise.resolve(null) : transaction.get(newClubRef),
          transaction.get(bookingRef),
        ]);

        if (!oldClubSnap.exists() || !bookingSnap.exists()) {
          throw new Error("NOT_FOUND");
        }
        if (!sameClub && !newClubSnap!.exists()) throw new Error("NOT_FOUND");

        if (sameClub) {
          const slots = rawSlots(oldClubSnap.data());
          const newIdx = slots.findIndex((s) => s.id === newSlotId);
          if (newIdx === -1) throw new Error("SLOT_NOT_FOUND");
          if (!slots[newIdx].places_quantity || slots[newIdx].places_quantity <= 0) {
            throw new Error("NO_PLACES_LEFT");
          }
          const oldIdx = slots.findIndex((s) => s.id === oldSlotId);
          if (oldIdx !== -1) {
            slots[oldIdx] = {
              ...slots[oldIdx],
              places_quantity: (slots[oldIdx].places_quantity ?? 0) + 1,
            };
          }
          slots[newIdx] = {
            ...slots[newIdx],
            places_quantity: slots[newIdx].places_quantity - 1,
          };
          transaction.update(oldClubRef, { slots });
        } else {
          const oldSlots = rawSlots(oldClubSnap.data());
          const newSlots = rawSlots(newClubSnap!.data());
          const newIdx = newSlots.findIndex((s) => s.id === newSlotId);
          if (newIdx === -1) throw new Error("SLOT_NOT_FOUND");
          if (!newSlots[newIdx].places_quantity || newSlots[newIdx].places_quantity <= 0) {
            throw new Error("NO_PLACES_LEFT");
          }
          const oldIdx = oldSlots.findIndex((s) => s.id === oldSlotId);
          if (oldIdx !== -1) {
            oldSlots[oldIdx] = {
              ...oldSlots[oldIdx],
              places_quantity: (oldSlots[oldIdx].places_quantity ?? 0) + 1,
            };
          }
          newSlots[newIdx] = {
            ...newSlots[newIdx],
            places_quantity: newSlots[newIdx].places_quantity - 1,
          };
          transaction.update(oldClubRef, { slots: oldSlots });
          transaction.update(newClubRef, { slots: newSlots });
        }

        const newSlotTime = (sameClub
          ? rawSlots(oldClubSnap.data())
          : rawSlots(newClubSnap!.data())
        ).find((s) => s.id === newSlotId)?.time ?? null;

        transaction.update(bookingRef, {
          club_id: newClub.id,
          club_name: newClub.name,
          slot_id: newSlotId,
          slot_time: newSlotTime,
        });
      });

      showToast("success", "წრე წარმატებით შეიცვალა");
    } catch (err: any) {
      console.error(err);
      if (err?.message === "NO_PLACES_LEFT") {
        showToast(
          "warn",
          "ადგილები აღარ არის",
          "ამ ახალ წრეში თავისუფალი ადგილი აღარ დარჩა"
        );
      } else {
        showToast("error", "მოხდა შეცდომა", "წრის შეცვლა ვერ მოხერხდა");
      }
    } finally {
      loading.value = false;
    }
  };

  const toggleRegistration = async (current: ClubRegistration | null) => {
    await handleAsyncOperation(
      async () => {
        await setDoc(doc(db, CLUB_BOOKINGS_DB, "registration"), { open: !(current?.open ?? false) });
        showToast("success", current?.open ? "რეგისტრაცია დაიხურა" : "რეგისტრაცია გაიხსნა");
      },
      "მოხდა შეცდომა",
      "სტატუსი ვერ შეიცვალა"
    );
  };

  return {
    loading,
    addClub,
    updateClub,
    deleteClub,
    deleteAllClubs,
    registerInClub,
    changeClubBooking,
    toggleRegistration,
  };
}
