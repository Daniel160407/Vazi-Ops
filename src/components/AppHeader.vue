<script setup lang="ts">
import logo from "../assets/images/logo.png";
</script>

<template>
  <header
    class="sticky mb-4 top-0 z-20 flex w-full items-center gap-3 border-b border-blue-900/20 bg-[#03060f]/95 px-5 py-3.5 backdrop-blur-md lg:hidden"
    style="box-shadow: 0 2px 20px 0 rgba(0, 6, 30, 0.5)"
  >
    <div
      class="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-950/60 ring-1 ring-blue-800/30"
    >
      <img :src="logo" alt="ბანაკი ვაზი" class="h-8 w-8 object-contain" />
    </div>
    <h1 class="text-[24px] font-bold tracking-tight text-white">
      ბანაკი <span class="text-blue-400">"ვაზი"</span>
    </h1>
  </header>
</template>
