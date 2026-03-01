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
        const docRef = await addDoc(collection(db, CLUBS_DB), club);
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
        const { id, ...clubData } = club;

        const dataToUpdate = {
          ...clubData,
          time: clubData.time ? new Date(clubData.time) : null,
        };

        await updateDoc(clubRef, dataToUpdate);
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

        if (!clubSnap.exists()) throw new Error("CLUB_NOT_FOUND");

        const clubData = clubSnap.data() as Club;
        if (!clubData.places_quantity || clubData.places_quantity <= 0) {
          throw new Error("NO_PLACES_LEFT");
        }

        transaction.update(clubRef, {
          places_quantity: clubData.places_quantity - 1,
        });

        const bookingRef = doc(collection(db, CLUB_BOOKINGS_DB));
        transaction.set(bookingRef, {
          ...data,
          club_id: club.id,
          club_name: club.name,
          created_at: new Date(),
        });
      });

      showToast("success", "დარეგისტრირდი წრეზე");
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
    } finally {
      loading.value = false;
    }
  };

  const changeClubBooking = async (oldBooking: ClubBooking, newClub: Club) => {
    if (!oldBooking.id || !oldBooking.club_id || !newClub.id) return;

    loading.value = true;
    try {
      await runTransaction(db, async (transaction) => {
        const oldClubRef = doc(db, CLUBS_DB, oldBooking.club_id);
        const newClubRef = doc(db, CLUBS_DB, newClub.id);
        const bookingRef = doc(db, CLUB_BOOKINGS_DB, oldBooking.id);

        const [oldClubSnap, newClubSnap, bookingSnap] = await Promise.all([
          transaction.get(oldClubRef),
          transaction.get(newClubRef),
          transaction.get(bookingRef),
        ]);

        if (
          !oldClubSnap.exists() ||
          !newClubSnap.exists() ||
          !bookingSnap.exists()
        ) {
          throw new Error("NOT_FOUND");
        }

        const oldClubData = oldClubSnap.data() as Club;
        const newClubData = newClubSnap.data() as Club;

        if (!newClubData.places_quantity || newClubData.places_quantity <= 0) {
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

  return {
    loading,
    addClub,
    updateClub,
    deleteClub,
    registerInClub,
    changeClubBooking,
  };
}
