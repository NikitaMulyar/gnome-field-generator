<template>
    <div @click="tap" @mouseover="mouseOver" class="tile" :class="{
        'top-wall': store.getCell(props.i, props.j).walls[0],
        'right-wall': store.getCell(props.i, props.j).walls[1],
        'bottom-wall': store.getCell(props.i, props.j).walls[2],
        'left-wall': store.getCell(props.i, props.j).walls[3],
    }" </div>
</template>

<script setup>
import { useAppStore } from '@/stores/app';
import { ref } from 'vue';

const store = useAppStore();
const props = defineProps(['i', 'j']);
const color = ref(store.cellTypes[store.getCell(props.i, props.j).type].color);
const borderColor = ref(store.isHighlighted(props.i, props.j) ? "#00ff00" : "#000000");
const borderWidth = ref(store.isHighlighted(props.i, props.j) ? "2px" : "0.5px");

watch(() => store.cellTypes[store.getCell(props.i, props.j).type].color, (newValue, _) => {
    color.value = newValue;
});

watch(() => store.isHighlighted(props.i, props.j), (newValue, _) => {
    borderColor.value = newValue ? "#00ff00" : "#000000";
    borderWidth.value = newValue ? "2px" : "0.5px";
});

const tap = () => {
    if (store.selectedCellType != -1)
        store.paintCell(props.i, props.j);
    if (store.selectedWallType != -1)
        store.addWall(props.i, props.j);
};

const brighten = (color, amount) => {
    const c = color.substring(1);
    const rgb = parseInt(c, 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;

    const newR = Math.min(255, r + 255 * amount);
    const newG = Math.min(255, g + 255 * amount);
    const newB = Math.min(255, b + 255 * amount);

    return `#${((newR << 16) | (newG << 8) | newB).toString(16)}`;
};
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