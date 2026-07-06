<template>
<<<<<<< HEAD
    <div class="tile-grid" @pointerleave="store.stopBrush()">
        <div v-for="i in store.width * store.height" :key="i">
            <SingleTile :i="Math.floor((i - 1) / store.width)" :j="(i - 1) % store.width" />
        </div>
=======
  <div class="tile-grid">
    <div v-for="i in store.width * store.height" :key="i">
      <SingleTile :i="Math.floor((i - 1) / store.width)" :j="(i - 1) % store.width" />
>>>>>>> da7a9c7df008230ea9f74e71a0ddd26ab4153897
    </div>
  </div>
</template>

<script setup>
<<<<<<< HEAD
import { onBeforeUnmount, onMounted } from 'vue';
import { useAppStore } from '@/stores/app';

const store = useAppStore();

const stopBrush = () => {
    store.stopBrush();
};

onMounted(() => {
    window.addEventListener('pointerup', stopBrush);
    window.addEventListener('blur', stopBrush);
});

onBeforeUnmount(() => {
    window.removeEventListener('pointerup', stopBrush);
    window.removeEventListener('blur', stopBrush);
});
=======
  import { useAppStore } from '@/stores/app'

  const store = useAppStore()
>>>>>>> da7a9c7df008230ea9f74e71a0ddd26ab4153897
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
}
</style>
