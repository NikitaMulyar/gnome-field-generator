<template>
    <v-row>
        <v-col cols="3" align-self="center" align="center">
            <v-btn @click="store.save()" prepend-icon="mdi-download" size="large">save</v-btn>
        </v-col>
        <v-col cols="6">
            <v-file-input @update:model-value="load" label="Load" prepend-icon="mdi-upload" hide-details></v-file-input>
        </v-col>
        <v-col cols="3" align-self="center" align="center">
            <v-btn @click="clearAutosave" prepend-icon="mdi-delete-outline" variant="tonal">clear draft</v-btn>
        </v-col>
    </v-row>
    <v-row v-if="autosaveStatus" dense>
        <v-col>
            <v-chip size="small" color="success" variant="tonal">{{ autosaveStatus }}</v-chip>
        </v-col>
    </v-row>
</template>

<script setup>
import { computed } from 'vue';
import { useAppStore } from '@/stores/app';

const store = useAppStore();

const load = ($event) => {
    store.load($event);
};

const clearAutosave = () => {
    store.clearAutosave();
};

const autosaveStatus = computed(() => {
    if (!store.autosaveUpdatedAt) return '';
    return 'draft saved ' + new Date(store.autosaveUpdatedAt).toLocaleString();
});
</script>
