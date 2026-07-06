<template>
  <v-btn-toggle v-model="selected" color="deep-purple-accent-3">
    <v-btn icon="mdi-border-top-variant" @click="store.selectedWallType = 0; store.selectedCellType = -1;" />
    <v-btn
      icon="mdi-border-right-variant"
      @click="store.selectedWallType = 1; store.selectedCellType = -1;"
    />
    <v-btn
      icon="mdi-border-bottom-variant"
      @click="store.selectedWallType = 2; store.selectedCellType = -1;"
    />
    <v-btn icon="mdi-border-left-variant" @click="store.selectedWallType = 3; store.selectedCellType = -1;" />
    <v-btn icon="mdi-border-none-variant" @click="store.selectedWallType = 4; store.selectedCellType = -1;" />
  </v-btn-toggle>
</template>

<script setup>
  import { ref } from 'vue'
  import { useAppStore } from '@/stores/app'

  const store = useAppStore()
  const selected = ref('')

  watch(() => store.selectedWallType, (newValue, _) => {
    selected.value = newValue
  })
</script>
