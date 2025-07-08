<template>
    <v-row>
        <v-col cols="5">
            <v-number-input @update:model-value="store.updateSize($event, height)" v-model="width" label="Width"
                :min="1" :disabled="locked"></v-number-input>
        </v-col>
        <v-col cols="5">
            <v-number-input @update:model-value="store.updateSize(width, $event)" v-model="height" label="Height"
                :min="1" :disabled="locked"></v-number-input>
        </v-col>
        <v-col cols="2">
            <v-btn @click="locked = !locked" :icon="locked ? 'mdi-lock' : 'mdi-lock-open-variant'"></v-btn>
        </v-col>
    </v-row>
</template>

<script setup>
import { useAppStore } from '@/stores/app';
import { ref } from 'vue';

const store = useAppStore();
const locked = ref(true);

const width = ref(store.width);
const height = ref(store.height);
</script>