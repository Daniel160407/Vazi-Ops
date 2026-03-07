<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useGlobalStore } from "../stores/GlobalStore";
import { GENDER_MALE } from "../composables/constants";
import LoadingSpinner from "../components/UI/LoadingSpinner.vue";

const { loading, groups } = storeToRefs(useGlobalStore());
</script>
<template>
  <div>
    <LoadingSpinner v-if="loading" />

    <div
      v-else
      class="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
    >
      <div
        v-for="group in groups"
        :key="group.name"
        class="flex flex-col gap-3 rounded-xl p-4 my-4 mx-6 border border-solid"
        :style="{
          borderColor: group.gender === GENDER_MALE ? '#305CDE' : '#EE4B2B',
        }"
      >
        <div>
          <p
            class="text-xl text-center font-bold mb-3"
            :style="{
              color: group.gender === GENDER_MALE ? '#305CDE' : '#EE4B2B',
            }"
          >
            {{ group.name ?? "ჯგუფის სახელი" }}
          </p>
          <p>ლიდერი: {{ group.leader ?? "-" }}</p>
          <p>ასაკი: {{ group.age ?? "-" }}</p>
          <p>კოტეჯი: {{ group.cottage_num ?? "-" }}</p>
        </div>
        <div class="border w-full"></div>
        <div>
          <p v-for="(child, index) in group.children" :key="index">
            {{ index + 1 }}. {{ child }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
