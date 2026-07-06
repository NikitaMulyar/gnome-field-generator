<template>
  <v-btn-toggle v-model="selected" color="deep-purple-accent-3">
    <v-btn
      v-for="(_, i) in store.cellTypes"
      :key="i"
      @click="store.selectedCellType = i; store.selectedWallType = -1"
    >
      <v-icon :color="store.cellTypes[i].color" start>
        mdi-square
      </v-icon>
      <span class="hidden-sm-and-down">{{ store.cellTypes[i].description }} ({{ store.cellTypes[i].code }})</span>
    </v-btn>
  </v-btn-toggle>
</template>

<script setup>
  import { ref } from 'vue'
  import { useAppStore } from '@/stores/app'

  const store = useAppStore()
  const selected = ref('')

  watch(() => store.selectedCellType, (newValue, _) => {
    selected.value = newValue
  })
</script>
