<script setup lang="ts">
import { storeToRefs } from "pinia";
import { ref } from "vue";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../firebase";
import { useGlobalStore } from "../stores/GlobalStore";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import FloatLabel from "primevue/floatlabel";
import InputText from "primevue/inputtext";
import { Card, Select, useToast } from "primevue";
import { format } from "date-fns";
import { useClubsCrud } from "../composables/useClubsCrud";
import type { Club, ClubBooking } from "../type/interfaces";
import { CLUB_BOOKINGS_DB } from "../composables/constants";
import LoadingSpinner from "../components/UI/LoadingSpinner.vue";

const globalStore = useGlobalStore();
const toast = useToast();
const { loading: loadingStore, clubs } = storeToRefs(globalStore);
const { fetchClubs } = globalStore;

const { registerInClub, changeClubBooking, loading } = useClubsCrud();

const selectedClub = ref<Club | null>(null);
const showDialog = ref(false);

const childFirstName = ref("");
const childLastName = ref("");
const leaderName = ref("");
const groupName = ref("");

const userBookings = ref<ClubBooking[]>([]);
const selectionMode = ref<"register" | "switch">("register");
const bookingToReplaceId = ref<string | null>(null);

const formatTime = (value?: string | Date | null) => {
  if (!value) return "-";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return format(date, "HH:mm");
};

const openRegisterDialog = (club: Club) => {
  if (club.places_quantity <= 0) return;
  selectedClub.value = club;
  showDialog.value = true;
  selectionMode.value = "register";
  userBookings.value = [];
  bookingToReplaceId.value = null;
};

const resetForm = () => {
  childFirstName.value = "";
  childLastName.value = "";
  leaderName.value = "";
  groupName.value = "";
  selectionMode.value = "register";
  userBookings.value = [];
  bookingToReplaceId.value = null;
};

const fetchUserBookings = async () => {
  const bookingsRef = collection(db, CLUB_BOOKINGS_DB);
  const q = query(
    bookingsRef,
    where("child_first_name", "==", childFirstName.value),
    where("child_last_name", "==", childLastName.value),
    where("leader_name", "==", leaderName.value),
    where("group_name", "==", groupName.value)
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

const handleConfirmRegister = async () => {
  if (!selectedClub.value) {
    toast.add({
      severity: "warn",
      summary: "აირჩიე წრე",
      detail: "გთხოვ, თავიდან აირჩიე წრე, სადაც გინდა დარეგისტრირება.",
      life: 3000,
    });
    return;
  }

  if (
    !childFirstName.value ||
    !childLastName.value ||
    !leaderName.value ||
    !groupName.value
  ) {
    toast.add({
      severity: "warn",
      summary: "შეავსე ყველა ველი",
      detail: "სახელი, გვარი, ლიდერი და ჯგუფი სავალდებულოა.",
      life: 3000,
    });
    return;
  }

  if (selectionMode.value === "register") {
    const existing = await fetchUserBookings();
    userBookings.value = existing;

    if (selectedClub.value.time) {
      const hasSameTime = existing.some((booking) => {
        const clubForBooking = clubs.value.find(
          (c) => c.id === booking.club_id
        );
        return (
          clubForBooking &&
          clubForBooking.time &&
          clubForBooking.time === selectedClub.value!.time
        );
      });

      if (hasSameTime) {
        toast.add({
          severity: "warn",
          summary: "დრო დაკავებულია",
          detail:
            "უკვე გაქვს სხვა წრე იმავე დროს, ამიტომ ამ წრეზე ვეღარ დარეგისტრირდები.",
          life: 6000,
        });
        return;
      }
    }

    if (existing.length < 2) {
      await registerInClub(selectedClub.value, {
        child_first_name: childFirstName.value,
        child_last_name: childLastName.value,
        leader_name: leaderName.value,
        group_name: groupName.value,
      });

      await fetchClubs();
      showDialog.value = false;
      resetForm();
      return;
    }

    selectionMode.value = "switch";
    bookingToReplaceId.value = existing[0]?.id ?? null;
    toast.add({
      severity: "info",
      summary: "უკვე დაჯავშნილია 2 წრე",
      detail: "აირჩიე რომელი წრე გინდა შეცვალო ახალით.",
      life: 3000,
    });
    return;
  }

  if (!bookingToReplaceId.value) {
    toast.add({
      severity: "warn",
      summary: "აირჩიე შესაცვლელი წრე",
      detail: "აირჩიე წრე სიიდან, რომლის შეცვლაც გინდა.",
      life: 3000,
    });
    return;
  }
  const oldBooking = userBookings.value.find(
    (b) => b.id === bookingToReplaceId.value
  );
  if (!oldBooking) {
    toast.add({
      severity: "error",
      summary: "რეგისტრაცია ვერ მოიძებნა",
      detail: "გთხოვ, ცადე თავიდან და აირჩიე შესაცვლელი წრე.",
      life: 3000,
    });
    return;
  }

  const otherBooking = userBookings.value.find(
    (b) => b.id !== bookingToReplaceId.value
  );
  if (otherBooking && selectedClub.value.time) {
    const otherClub = clubs.value.find((c) => c.id === otherBooking.club_id);
    if (
      otherClub &&
      otherClub.time &&
      otherClub.time === selectedClub.value.time
    ) {
      toast.add({
        severity: "warn",
        summary: "დრო უკვე დაკავებულია",
        detail:
          "შენ გაქვს სხვა წრე ამ დროს, ამიტომ ამ წრეზე შეცვლა ვერ მოხერხდა.",
        life: 3000,
      });
      return;
    }
  }

  await changeClubBooking(oldBooking, selectedClub.value);
  await fetchClubs();

  showDialog.value = false;
  resetForm();
};
</script>

<template>
  <div>
    <LoadingSpinner v-if="loadingStore" />

    <div
      v-else
      class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
    >
      <Card
        v-for="club in clubs"
        :key="club.name"
        class="border"
        :style="{
          borderColor: club.places_quantity <= 0 ? '#EE4B2B' : '',
        }"
      >
        <template #title>
          <p class="text-center text-2xl font-bold">
            {{ club.name ?? "წრის სახელი" }}
          </p>
        </template>
        <template #subtitle>
          <div>
            <p>მასწავლებელი: {{ club.teacher ?? "-" }}</p>
            <p>ადგილი: {{ club.place ?? "-" }}</p>
            <p>დრო: {{ formatTime(club.time) ?? "-" }}</p>
            <p>დარჩენილი ადგილები: {{ club.places_quantity ?? "-" }}</p>
          </div>
        </template>
        <template #content>
          <div>
            <p class="font-bold">
              დამატებითი კომენტარი: {{ club.additional_info ?? "-" }}
            </p>

            <Button
              label="ჩაეწერე"
              icon="pi pi-check"
              class="mt-4 w-full"
              :disabled="club.places_quantity <= 0 || loading"
              @click="openRegisterDialog(club)"
            />
          </div>
        </template>
      </Card>

      <Dialog v-model:visible="showDialog" modal header="ჩაეწერე წრეზე">
        <div class="space-y-4 pt-2">
          <p v-if="selectedClub" class="font-semibold">
            წრე: {{ selectedClub?.name }}
          </p>

          <FloatLabel variant="on">
            <InputText
              id="childFirstName"
              v-model="childFirstName"
              class="w-full"
            />
            <label for="childFirstName">სახელი</label>
          </FloatLabel>

          <FloatLabel variant="on">
            <InputText
              id="childLastName"
              v-model="childLastName"
              class="w-full"
            />
            <label for="childLastName">გვარი</label>
          </FloatLabel>

          <FloatLabel variant="on">
            <InputText id="leaderName" v-model="leaderName" class="w-full" />
            <label for="leaderName">ლიდერის სახელი</label>
          </FloatLabel>

          <FloatLabel variant="on">
            <InputText id="groupName" v-model="groupName" class="w-full" />
            <label for="groupName">ჯგუფის სახელი</label>
          </FloatLabel>

          <div v-if="selectionMode === 'switch'" class="space-y-2 mt-2">
            <p class="text-sm text-white-700">
              უკვე დარეგისტრირებული ხარ 2 წრეზე. აირჩიე რომელი გინდა შეცვალო ამ
              წრით.
            </p>
            <Select
              v-model="bookingToReplaceId"
              :options="userBookings"
              optionLabel="club_name"
              optionValue="id"
              placeholder="აირჩიე წრე შესაცვლელად"
              class="w-full"
            />
          </div>
        </div>

        <template #footer>
          <Button
            label="გაუქმება"
            icon="pi pi-times"
            severity="secondary"
            outlined
            @click="
              () => {
                showDialog = false;
                resetForm();
              }
            "
          />
          <Button
            :label="selectionMode === 'switch' ? 'შეცვლა' : 'ჩაწერა'"
            icon="pi pi-check"
            :loading="loading"
            @click="handleConfirmRegister"
          />
        </template>
      </Dialog>
    </div>
  </div>
</template>
