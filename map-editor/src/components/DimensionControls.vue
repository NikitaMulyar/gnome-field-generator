<template>
  <v-row>
    <v-col cols="5">
      <v-number-input
        v-model="width"
        :disabled="locked"
        label="Width"
        :min="1"
        @update:model-value="store.updateSize($event, height)"
      />
    </v-col>
    <v-col cols="5">
      <v-number-input
        v-model="height"
        :disabled="locked"
        label="Height"
        :min="1"
        @update:model-value="store.updateSize(width, $event)"
      />
    </v-col>
    <v-col cols="2">
      <v-btn :icon="locked ? 'mdi-lock' : 'mdi-lock-open-variant'" @click="locked = !locked" />
    </v-col>
  </v-row>
</template>

<script setup>
  import { ref } from 'vue'
  import { useAppStore } from '@/stores/app'

  const store = useAppStore()
  const locked = ref(true)

  const width = ref(store.width)
  const height = ref(store.height)
</script>
