<template>
    <v-card title="Portals" style="margin-bottom: 1em;">
        <v-container>
            <PortalExitSelect v-for="(_, index) of entrances" :key="index" :i="index" />
        </v-container>
    </v-card>
</template>

<script setup>
import { useAppStore } from '@/stores/app';


const store = useAppStore();

const entrances = ref(store.getPortals(false));
watch(() => store.getPortals(false), (newValue, _) => {
    entrances.value = newValue;
});
</script>