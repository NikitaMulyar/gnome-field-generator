<template>
    <v-row>
        <v-col cols="3" align-self="center" align="center">
            <v-btn @click="store.save()" prepend-icon="mdi-download" size="large">save</v-btn>
        </v-col>
        <v-col cols="4">
            <v-file-input @update:model-value="load" label="Load" prepend-icon="mdi-upload" hide-details></v-file-input>
        </v-col>
        <v-col cols="3" align-self="center" align="center">
            <v-btn
                @click="syncToGame"
                :loading="store.syncToGameInProgress"
                prepend-icon="mdi-sync"
                color="primary"
                variant="tonal"
            >sync to game</v-btn>
        </v-col>
        <v-col cols="2" align-self="center" align="center">
            <v-btn @click="clearField" icon="mdi-delete-outline" variant="tonal" title="clear field"></v-btn>
        </v-col>
    </v-row>
    <v-row v-if="autosaveStatus || syncStatus" dense>
        <v-col cols="12" md="6" v-if="autosaveStatus">
            <v-chip size="small" color="success" variant="tonal">{{ autosaveStatus }}</v-chip>
        </v-col>
        <v-col cols="12" md="6" v-if="syncStatus">
            <v-chip size="small" :color="store.syncToGameError ? 'error' : 'primary'" variant="tonal">
                {{ syncStatus }}
            </v-chip>
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

const clearField = () => {
    store.clearField();
};

const syncToGame = () => {
    store.syncToGame();
};

const autosaveStatus = computed(() => {
    if (!store.autosaveUpdatedAt) return '';
    return 'draft saved ' + new Date(store.autosaveUpdatedAt).toLocaleString();
});

const syncStatus = computed(() => {
    if (store.syncToGameError) return 'sync failed: ' + store.syncToGameError;
    if (!store.syncToGameUpdatedAt) return '';
    return store.syncToGameStatus + ' ' + new Date(store.syncToGameUpdatedAt).toLocaleString();
});
</script>
