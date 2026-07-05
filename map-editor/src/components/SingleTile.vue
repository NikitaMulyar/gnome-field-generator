<template>
  <div
    class="tile"
    :class="tileClasses"
    @click="tap"
  />
</template>

<script setup>
  import { computed } from 'vue'
  import { useAppStore } from '@/stores/app'

  const store = useAppStore()
  const props = defineProps(['i', 'j'])

  const cell = computed(() => store.getCell(props.i, props.j))
  const color = computed(() => store.cellTypes[cell.value.type].color)
  const isHighlighted = computed(() => store.isHighlighted(props.i, props.j))
  const borderColor = computed(() => isHighlighted.value ? '#00ff00' : '#000000')
  const borderWidth = computed(() => isHighlighted.value ? '2px' : '0.5px')
  const tileClasses = computed(() => {
    const walls = cell.value.walls
    return {
      'top-wall': walls[0],
      'right-wall': walls[1],
      'bottom-wall': walls[2],
      'left-wall': walls[3],
    }
  })

  const tap = () => {
    if (store.selectedCellType !== -1)
      store.paintCell(props.i, props.j)
    if (store.selectedWallType !== -1)
      store.addWall(props.i, props.j)
  }

  const brighten = (color, amount) => {
    const c = color.slice(1)
    const rgb = Number.parseInt(c, 16)
    const r = (rgb >> 16) & 0xff
    const g = (rgb >> 8) & 0xff
    const b = (Math.trunc(rgb)) & 0xff

    const newR = Math.min(255, r + 255 * amount)
    const newG = Math.min(255, g + 255 * amount)
    const newB = Math.min(255, b + 255 * amount)

    return `#${((newR << 16) | (newG << 8) | newB).toString(16)}`
  }
</script>

<style scoped>
.tile {
    background: v-bind(color);
    border: v-bind(borderWidth) solid v-bind(borderColor);
    aspect-ratio: 1;
    width: 100%;
}

.tile:hover {
    background: v-bind(brighten(color, 0.1));
}

.top-wall {
    border-top: 0.3em solid black;
}

.right-wall {
    border-right: 0.3em solid black;
}

.bottom-wall {
    border-bottom: 0.3em solid black;
}

.left-wall {
    border-left: 0.3em solid black;
}
</style>
