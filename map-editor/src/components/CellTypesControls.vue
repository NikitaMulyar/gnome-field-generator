<template>
    <v-btn-toggle color="deep-purple-accent-3" v-model="selected">
        <v-btn v-for="(_, i) in store.cellTypes" :key="i"
            @click="store.selectedCellType = i; store.selectedWallType = -1">
            <v-icon start :color="store.cellTypes[i].color">
                mdi-square
            </v-icon>
            <span class="hidden-sm-and-down">{{ store.cellTypes[i].description }} ({{ store.cellTypes[i].code }})</span>
        </v-btn>
    </v-btn-toggle>
</template>

<script setup>
import { useAppStore } from '@/stores/app';
import { ref } from 'vue';

const store = useAppStore();
const selected = ref('');

watch(() => store.selectedCellType, (newValue, _) => {
    selected.value = newValue;
});
</script>
