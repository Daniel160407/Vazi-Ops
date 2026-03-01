import { ref } from "vue";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  runTransaction,
} from "firebase/firestore";
import { db } from "../../firebase";
import { CLUBS_DB, CLUB_BOOKINGS_DB } from "../composables/constants";
import type { Club, ClubBooking } from "../type/interfaces";
import { useToast } from "primevue";

export function useClubsCrud() {
  const toast = useToast();

  const loading = ref(false);

  const addClub = async (club: Omit<Club, "id">) => {
    loading.value = true;
    try {
      const docRef = await addDoc(collection(db, CLUBS_DB), club);
      toast.add({
        severity: "success",
        summary: "წრე შენახულია",
        life: 3000,
      });
      return docRef.id;
    } catch (err) {
      console.error(err);
      toast.add({
        severity: "error",
        summary: "მოხდა შეცდომა",
        detail: "წრე ვერ დაემატა",
        life: 3000,
      });
    } finally {
      loading.value = false;
    }
  };

  // Inside updateClub in useClubsCrud.ts
  const updateClub = async (club: Club) => {
    if (!club.id) return;
    loading.value = true;
    try {
      const clubRef = doc(db, CLUBS_DB, club.id);
      const { id, ...clubData } = club;

      // Ensure time is stored in a way Firestore likes
      const dataToUpdate = {
        ...clubData,
        time: clubData.time ? new Date(clubData.time) : null, // Converts string/Date to Firestore-friendly format
      };

      await updateDoc(clubRef, dataToUpdate);

      toast.add({
        severity: "success",
        summary: "წრე განახლებულია",
        life: 3000,
      });
    } catch (err) {
      // ... error handling
    } finally {
      loading.value = false;
    }
  };

  const registerInClub = async (
    club: Club,
    data: Pick<
      ClubBooking,
      "child_first_name" | "child_last_name" | "leader_name" | "group_name"
    >
  ) => {
    if (!club.id) return;

    loading.value = true;
    try {
      await runTransaction(db, async (transaction) => {
        const clubRef = doc(db, CLUBS_DB, club.id);
        const clubSnap = await transaction.get(clubRef);

        if (!clubSnap.exists()) {
          throw new Error("CLUB_NOT_FOUND");
        }

        const clubData = clubSnap.data() as Club;

        if (!clubData.places_quantity || clubData.places_quantity <= 0) {
          throw new Error("NO_PLACES_LEFT");
        }

        transaction.update(clubRef, {
          places_quantity: clubData.places_quantity - 1,
        });

        const bookingRef = doc(collection(db, CLUB_BOOKINGS_DB));
        transaction.set(bookingRef, {
          club_id: club.id,
          club_name: club.name,
          child_first_name: data.child_first_name,
          child_last_name: data.child_last_name,
          leader_name: data.leader_name,
          group_name: data.group_name,
          created_at: new Date().toISOString(),
        });
      });

      toast.add({
        severity: "success",
        summary: "დარეგისტრირდი წრეზე",
        life: 3000,
      });
    } catch (err: any) {
      console.error(err);

      if (err?.message === "NO_PLACES_LEFT") {
        toast.add({
          severity: "warn",
          summary: "ადგილები აღარ არის",
          detail: "ამ წრეში თავისუფალი ადგილი აღარ დარჩა",
          life: 3000,
        });
      } else {
        toast.add({
          severity: "error",
          summary: "მოხდა შეცდომა",
          detail: "დარეგისტრირება ვერ მოხერხდა",
          life: 3000,
        });
      }
    } finally {
      loading.value = false;
    }
  };

  const deleteClub = async (clubId: string) => {
    loading.value = true;
    try {
      await deleteDoc(doc(db, CLUBS_DB, clubId));
      toast.add({
        severity: "success",
        summary: "წრე წაიშალა",
        life: 3000,
      });
    } catch (err) {
      console.error(err);
      toast.add({
        severity: "error",
        summary: "მოხდა შეცდომა",
        detail: "წრე ვერ წაიშალა",
        life: 3000,
      });
    } finally {
      loading.value = false;
    }
  };

  return {
    loading,
    addClub,
    updateClub,
    deleteClub,
    registerInClub,
    changeClubBooking: async (oldBooking: ClubBooking, newClub: Club) => {
      if (!oldBooking.id || !oldBooking.club_id || !newClub.id) return;

      loading.value = true;
      try {
        await runTransaction(db, async (transaction) => {
          const oldClubRef = doc(db, CLUBS_DB, oldBooking.club_id);
          const newClubRef = doc(db, CLUBS_DB, newClub.id);
          const bookingRef = doc(db, CLUB_BOOKINGS_DB, oldBooking.id);

          const oldClubSnap = await transaction.get(oldClubRef);
          const newClubSnap = await transaction.get(newClubRef);
          const bookingSnap = await transaction.get(bookingRef);

          if (
            !oldClubSnap.exists() ||
            !newClubSnap.exists() ||
            !bookingSnap.exists()
          ) {
            throw new Error("NOT_FOUND");
          }

          const oldClubData = oldClubSnap.data() as Club;
          const newClubData = newClubSnap.data() as Club;

          if (
            !newClubData.places_quantity ||
            newClubData.places_quantity <= 0
          ) {
            throw new Error("NO_PLACES_LEFT");
          }

          transaction.update(oldClubRef, {
            places_quantity: (oldClubData.places_quantity ?? 0) + 1,
          });

          transaction.update(newClubRef, {
            places_quantity: newClubData.places_quantity - 1,
          });

          transaction.update(bookingRef, {
            club_id: newClub.id,
            club_name: newClub.name,
          });
        });

        toast.add({
          severity: "success",
          summary: "წრე წარმატებით შეიცვალა",
          life: 3000,
        });
      } catch (err: any) {
        console.error(err);

        if (err?.message === "NO_PLACES_LEFT") {
          toast.add({
            severity: "warn",
            summary: "ადგილები აღარ არის",
            detail: "ამ ახალ წრეში თავისუფალი ადგილი აღარ დარჩა",
            life: 3000,
          });
        } else {
          toast.add({
            severity: "error",
            summary: "მოხდა შეცდომა",
            detail: "წრის შეცვლა ვერ მოხერხდა",
            life: 3000,
          });
        }
      } finally {
        loading.value = false;
      }
    },
  };
}
