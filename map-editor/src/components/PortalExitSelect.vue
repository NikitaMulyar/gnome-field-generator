<template>
    <v-row @mouseover="highlight" @mouseleave="disableHighlight">
        <v-col cols="6" align-self="center">
            <v-select v-model="selectedEntrance" :items="entranceOptions" variant="underlined" hide-details
                readonly></v-select>
        </v-col>
        <v-col cols="6" align-self="center">
            <v-select @update:model-value="setExit" v-model="selectedExit" :items="exitsOptions" variant="underlined"
                hide-details></v-select>
        </v-col>
    </v-row>
</template>

<script setup>
import { useAppStore } from '@/stores/app';
import { shallowRef } from 'vue';
import { consoleError } from 'vuetify/lib/util/console.mjs';

const store = useAppStore();
const props = defineProps(['i']);

const entranceOptions = ['Entrance ' + (props.i + 1)];
const selectedEntrance = shallowRef(entranceOptions[0]);

const exits = ref(store.getPortals(true));
const exitsOptions = computed(() => {
    return exits.value.map((_, index) => 'Exit ' + (index + 1));
});

const selectedExit = shallowRef('');

watch(() => store.getPortals(true), (newValue, _) => {
    exits.value = newValue;
});

const setExit = ($event) => {
    store.portalPairs = store.portalPairs.filter((pair) => !pair.startsWith(props.i));
    store.portalPairs.push(props.i + '-' + (parseInt($event.slice(5)) - 1));
};

const highlight = () => {
    const entrances = store.getPortals(false);

    for (let [i, j] of entrances[props.i]) store.highlight(i, j);

    if (selectedExit.value) {
        for (let [i, j] of exits.value[parseInt(selectedExit.value.slice(5)) - 1]) store.highlight(i, j);
    }
};

const disableHighlight = () => {
    store.highlighted = [];
};
</script>