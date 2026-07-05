<template>
  <v-row @mouseleave="disableHighlight" @mouseover="highlight">
    <v-col align-self="center" cols="6">
      <v-select
        v-model="selectedEntrance"
        hide-details
        :items="entranceOptions"
        readonly
        variant="underlined"
      />
    </v-col>
    <v-col align-self="center" cols="6">
      <v-select v-model="selectedExit" hide-details :items="exitsOptions" variant="underlined" />
    </v-col>
  </v-row>
</template>

<script setup>
  import { useAppStore } from '@/stores/app'

  const store = useAppStore()
  const props = defineProps(['i'])

  const entranceOptions = ['Entrance ' + (props.i + 1)]
  const selectedEntrance = ref(entranceOptions[0])

  const exits = ref(store.getPortals(true))
  const exitsOptions = computed(() => {
    return exits.value.map((_, index) => 'Exit ' + (index + 1))
  })

  const selectedExit = computed({
    get () {
      const pair = store.portalPairs.find(pair => pair.startsWith(props.i + '-'))
      if (!pair) return ''
      const exitIndex = Number(pair.split('-')[1])
      return Number.isFinite(exitIndex) ? 'Exit ' + (exitIndex + 1) : ''
    },
    set (value) {
      setExit(value)
    },
  })

  watch(() => store.getPortals(true), (newValue, _) => {
    exits.value = newValue
  })

  const setExit = $event => {
    store.portalPairs = store.portalPairs.filter(pair => !pair.startsWith(props.i + '-'))
    store.portalPairs.push(props.i + '-' + (Number.parseInt($event.slice(5)) - 1))
  }

  const highlight = () => {
    const entrances = store.getPortals(false)

    for (const [i, j] of entrances[props.i]) store.highlight(i, j)

    if (selectedExit.value) {
      for (const [i, j] of exits.value[Number.parseInt(selectedExit.value.slice(5)) - 1]) store.highlight(i, j)
    }
  }

  const disableHighlight = () => {
    store.highlighted = []
  }
</script>
