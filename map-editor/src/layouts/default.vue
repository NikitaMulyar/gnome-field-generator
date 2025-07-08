<template>
  <v-main>
    <v-container>
      <router-view />
    </v-container>
  </v-main>
</template>

<script setup>
import { useAppStore } from '@/stores/app';

const store = useAppStore();
store.init();
</script>
