<script setup lang="ts">
import logo from "../assets/images/logo.png";
</script>

<template>
  <div class="flex items-center justify-center gap-3 px-4 pb-4 pt-8 lg:hidden">
    <img :src="logo" alt="ბანაკი ვაზი" class="h-10 w-10 object-contain" />
    <h1 class="text-2xl font-semibold tracking-tight">ბანაკი "ვაზი"</h1>
  </div>

  <div class="hidden w-full items-center gap-3 px-8 pb-4 pt-8 lg:flex">
    <img :src="logo" alt="ბანაკი ვაზი" class="h-8 w-8 object-contain" />
    <h1 class="text-xl font-semibold tracking-tight text-slate-200">ბანაკი "ვაზი"</h1>
  </div>
</template>
