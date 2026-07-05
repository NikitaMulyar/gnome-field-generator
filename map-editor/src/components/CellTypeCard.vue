<template>
  <v-card
    :style="store.selectedCellType == props.i ? { borderLeftColor: '#00ff00', borderLeftWidth: '3px' } : {}"
    tile
    @click="store.selectedCellType = props.i"
  >
    <v-row>
      <v-col align="center" align-self="center" cols="1">
        <div
          style="aspect-ratio: 1.0; height: 2em; border-radius: 20%"
          :style="{ backgroundColor: store.cellTypes[props.i].color }"
        />
      </v-col>
      <v-col cols="10">
        <span>{{ store.cellTypes[props.i].description }} ({{ store.cellTypes[props.i].code }})</span>
      </v-col>
    </v-row>
  </v-card>
</template>

<script setup>
  import { useAppStore } from '@/stores/app'

  const props = defineProps(['i'])
  const store = useAppStore()
</script>
