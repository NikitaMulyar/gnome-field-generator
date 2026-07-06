<template>
  <div
    class="tile-grid"
    @contextmenu.prevent
    @lostpointercapture="store.stopBrush()"
    @pointercancel="store.stopBrush()"
    @pointerdown.prevent="startBrush"
    @pointerleave="leaveGrid"
    @pointermove.prevent="continueBrush"
    @pointerup.prevent="stopBrush"
  >
    <div v-for="i in store.width * store.height" :key="i">
      <SingleTile :i="Math.floor((i - 1) / store.width)" :j="(i - 1) % store.width" />
    </div>
  </div>
</template>

<script setup>
  import { onBeforeUnmount, onMounted, ref } from 'vue'
  import { useAppStore } from '@/stores/app'

  const store = useAppStore()
  const lastPointerCell = ref(null)

  const cellFromPointer = event => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    if (x < 0 || y < 0 || x > rect.width || y > rect.height) return null

    return {
      i: Math.min(store.height - 1, Math.floor((y / rect.height) * store.height)),
      j: Math.min(store.width - 1, Math.floor((x / rect.width) * store.width)),
    }
  }

  const paintLineTo = cell => {
    const previous = lastPointerCell.value
    if (!previous) {
      store.continueBrush(cell.i, cell.j)
      lastPointerCell.value = cell
      return
    }

    const steps = Math.max(
      Math.abs(cell.i - previous.i),
      Math.abs(cell.j - previous.j),
    )

    for (let step = 1; step <= steps; step++) {
      const t = step / steps
      const i = Math.round(previous.i + (cell.i - previous.i) * t)
      const j = Math.round(previous.j + (cell.j - previous.j) * t)
      store.continueBrush(i, j)
    }

    lastPointerCell.value = cell
  }

  const startBrush = event => {
    if (event.button !== 0) return

    event.currentTarget.setPointerCapture(event.pointerId)
    const cell = cellFromPointer(event)
    if (!cell) return

    lastPointerCell.value = cell
    store.startBrush(cell.i, cell.j)
  }

  const continueBrush = event => {
    if (!store.brushActive) return
    if (event.buttons === 0) {
      store.stopBrush()
      return
    }

    const cell = cellFromPointer(event)
    if (cell) paintLineTo(cell)
  }

  const stopBrush = event => {
    if (event?.currentTarget?.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    lastPointerCell.value = null
    store.stopBrush()
  }

  const leaveGrid = event => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) stopBrush(event)
  }

  const stopBrushFromWindow = () => {
    lastPointerCell.value = null
    store.stopBrush()
  }

  onMounted(() => {
    window.addEventListener('pointerup', stopBrushFromWindow)
    window.addEventListener('blur', stopBrushFromWindow)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('pointerup', stopBrushFromWindow)
    window.removeEventListener('blur', stopBrushFromWindow)
  })
</script>

<style scoped>
.tile-grid {
  margin-top: 1em;
  margin-bottom: 1em;
  display: grid;
  justify-content: center;
  grid-template-columns: repeat(v-bind("store.width"), min(calc(80vw / v-bind("store.width")), calc(80vh / v-bind("store.height"))));
  grid-template-rows: repeat(v-bind("store.height"), min(calc(80vw / v-bind("store.width")), calc(80vh / v-bind("store.height"))));
  user-select: none;
  touch-action: none;
}
</style>
