<script setup lang="ts">
import { storeToRefs } from "pinia";
import { ref } from "vue";
import { useGlobalStore } from "../stores/GlobalStore";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import FloatLabel from "primevue/floatlabel";
import InputText from "primevue/inputtext";
import { Card, Select, useToast } from "primevue";
import { format } from "date-fns";
import { useClubsCrud } from "../composables/useClubsCrud";
import type { Club, ClubBooking } from "../type/interfaces";
import LoadingSpinner from "../components/UI/LoadingSpinner.vue";
import { useClubBookingsCrud } from "../composables/useClubBookingsCrud";

const globalStore = useGlobalStore();
const toast = useToast();
const { loading: loadingStore, clubs } = storeToRefs(globalStore);

const { registerInClub, changeClubBooking, loading } = useClubsCrud();
const { fetchUserBookings } = useClubBookingsCrud();

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

const handleConfirmRegister = async () => {
  if (!selectedClub.value) {
    toast.add({
      severity: "warn",
      summary: "აირჩიე წრე",
      detail: "გთხოვ, თავიდან აირჩიე წრე.",
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
      detail: "ყველა ველი სავალდებულოა.",
      life: 3000,
    });
    return;
  }

  if (selectionMode.value === "register") {
    const existing = await fetchUserBookings(
      childFirstName.value,
      childLastName.value,
      leaderName.value,
      groupName.value
    );
    userBookings.value = existing;

    if (selectedClub.value.time) {
      const hasSameTime = existing.some((booking) => {
        const clubForBooking = clubs.value.find(
          (c) => c.id === booking.club_id
        );
        return clubForBooking?.time === selectedClub.value!.time;
      });

      if (hasSameTime) {
        toast.add({
          severity: "warn",
          summary: "დრო დაკავებულია",
          detail: "უკვე გაქვს სხვა წრე ამ დროს.",
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

      showDialog.value = false;
      resetForm();
      return;
    }

    selectionMode.value = "switch";
    bookingToReplaceId.value = existing[0]?.id ?? null;
    toast.add({
      severity: "info",
      summary: "უკვე დაჯავშნილია 2 წრე",
      detail: "აირჩიე რომელი გინდა შეცვალო.",
      life: 3000,
    });
    return;
  }

  if (!bookingToReplaceId.value) {
    toast.add({
      severity: "warn",
      summary: "აირჩიე შესაცვლელი წრე",
      detail: "აირჩიე წრე სიიდან.",
      life: 3000,
    });
    return;
  }

  const oldBooking = userBookings.value.find(
    (b) => b.id === bookingToReplaceId.value
  );
  if (!oldBooking) return;

  await changeClubBooking(oldBooking, selectedClub.value);

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
        :key="club.id"
        class="border"
        :style="{ borderColor: club.places_quantity <= 0 ? '#EE4B2B' : '' }"
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
            <p
              class="font-bold"
              :class="club.places_quantity <= 3 ? 'text-red-500' : ''"
            >
              დარჩენილი ადგილები: {{ club.places_quantity ?? "0" }}
            </p>
          </div>
        </template>
        <template #content>
          <div>
            <p class="text-sm opacity-80">
              კომენტარი: {{ club.additional_info ?? "-" }}
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

      <Dialog
        v-model:visible="showDialog"
        modal
        header="ჩაეწერე წრეზე"
        class="mx-4 w-full max-w-md"
      >
        <div class="space-y-4 pt-2">
          <p v-if="selectedClub" class="font-semibold text-primary">
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

          <div
            v-if="selectionMode === 'switch'"
            class="p-3 bg-blue-50 border-round"
          >
            <p class="text-sm mb-2">
              უკვე გაქვს 2 წრე. აირჩიე რომელი ჩაანაცვლო:
            </p>
            <Select
              v-model="bookingToReplaceId"
              :options="userBookings"
              optionLabel="club_name"
              optionValue="id"
              placeholder="აირჩიე წრე"
              class="w-full"
            />
          </div>
        </div>
        <template #footer>
          <Button
            label="გაუქმება"
            icon="pi pi-times"
            severity="secondary"
            text
            @click="
              showDialog = false;
              resetForm();
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
