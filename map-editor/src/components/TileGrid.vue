<template>
    <div class="tile-grid">
        <div v-for="i in store.width * store.height" :key="i">
            <SingleTile :i="Math.floor((i - 1) / store.width)" :j="(i - 1) % store.width" />
        </div>
    </div>
</template>

<script setup>
import { useAppStore } from '@/stores/app';

const store = useAppStore();
</script>

<style scoped>
.tile-grid {
    margin-top: 1em;
    margin-bottom: 1em;
    display: grid;
    justify-content: center;
    grid-template-columns: repeat(v-bind("store.width"), min(calc(80vw / v-bind("store.width")), calc(80vh / v-bind("store.height"))));
    grid-template-rows: repeat(v-bind("store.height"), min(calc(80vw / v-bind("store.width")), calc(80vh / v-bind("store.height"))));
}
</style>