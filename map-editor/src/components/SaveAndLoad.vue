<template>
  <v-row>
    <v-col align="center" align-self="center" cols="3">
      <v-btn prepend-icon="mdi-download" size="large" @click="store.save()">save</v-btn>
    </v-col>
    <v-col cols="9">
      <v-file-input hide-details label="Load" prepend-icon="mdi-upload" @update:model-value="load" />
    </v-col>
  </v-row>
</template>

<script setup>
  import { useAppStore } from '@/stores/app'

  const store = useAppStore()

  const load = $event => {
    const file = Array.isArray($event) ? $event[0] : $event
    if (file) store.load(file)
  }
</script>
