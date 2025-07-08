<template>
    <v-row>
        <v-col cols="3" align-self="center" align="center">
            <v-btn @click="store.save()" prepend-icon="mdi-download" size="large">save</v-btn>
        </v-col>
        <v-col cols="9">
            <v-file-input @update:model-value="load" label="Load" prepend-icon="mdi-upload" hide-details></v-file-input>
        </v-col>
    </v-row>
</template>

<script setup>
import { useAppStore } from '@/stores/app';

const store = useAppStore();

const load = ($event) => {
    store.load($event);
};
</script>