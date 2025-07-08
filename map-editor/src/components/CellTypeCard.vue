<template>
    <v-card @click="store.selectedCellType = props.i" tile
        :style="store.selectedCellType == props.i ? { borderLeftColor: '#00ff00', borderLeftWidth: '3px' } : {}">
        <v-row>
            <v-col cols="1" align-self="center" align="center">
                <div :style="{ backgroundColor: store.cellTypes[props.i].color }"
                    style="aspect-ratio: 1.0; height: 2em; border-radius: 20%"></div>
            </v-col>
            <v-col cols="10">
                <span>{{ store.cellTypes[props.i].description }} ({{ store.cellTypes[props.i].code }})</span>
            </v-col>
        </v-row>
    </v-card>
</template>

<script setup>
import { useAppStore } from '@/stores/app';

const props = defineProps(['i']);
const store = useAppStore();
</script>