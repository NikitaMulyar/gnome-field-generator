<template>
  <DimensionControls />
  <CellTypesControls />
  <WallTypeControls />
  <TileGrid />
  <PortalsControls />
  <SaveAndLoad />
</template>

<script setup>
import CellTypesControls from '@/components/CellTypesControls.vue';
import PortalsControls from '@/components/PortalsControls.vue';
import SaveAndLoad from '@/components/SaveAndLoad.vue';
import TileGrid from '@/components/TileGrid.vue';
import WallTypeControls from '@/components/WallTypeControls.vue';
</script>
