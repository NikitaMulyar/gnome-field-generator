<template>
  <v-row>
    <v-col align="center" align-self="center" cols="3">
      <v-btn prepend-icon="mdi-download" size="large" @click="store.save()">save</v-btn>
    </v-col>
    <v-col cols="4">
      <v-file-input
        accept="application/json,.json"
        hide-details
        label="Load JSON"
        prepend-icon="mdi-upload"
        @update:model-value="load"
      />
    </v-col>
    <v-col align="center" align-self="center" cols="3">
      <v-btn
        color="primary"
        :loading="store.syncToGameInProgress"
        prepend-icon="mdi-sync"
        variant="tonal"
        @click="syncToGame"
      >
        sync to game
      </v-btn>
    </v-col>
    <v-col align="center" align-self="center" cols="2">
      <v-btn icon="mdi-delete-outline" title="clear field" variant="tonal" @click="clearField" />
    </v-col>
  </v-row>
  <v-row v-if="autosaveStatus || loadStatus || syncStatus" dense>
    <v-col v-if="autosaveStatus" cols="12" md="4">
      <v-chip color="success" size="small" variant="tonal">{{ autosaveStatus }}</v-chip>
    </v-col>
    <v-col v-if="loadStatus" cols="12" md="4">
      <v-chip :color="store.loadError ? 'error' : 'info'" size="small" variant="tonal">
        {{ loadStatus }}
      </v-chip>
    </v-col>
    <v-col v-if="syncStatus" cols="12" md="4">
      <v-chip :color="store.syncToGameError ? 'error' : 'primary'" size="small" variant="tonal">
        {{ syncStatus }}
      </v-chip>
    </v-col>
  </v-row>
</template>

<script setup>
  import { computed } from 'vue'
  import { useAppStore } from '@/stores/app'

  const store = useAppStore()

  const load = $event => {
    store.load($event)
  }

  const clearField = () => {
    store.clearField()
  }

  const syncToGame = () => {
    store.syncToGame()
  }

  const autosaveStatus = computed(() => {
    if (!store.autosaveUpdatedAt) return ''
    return 'draft saved ' + new Date(store.autosaveUpdatedAt).toLocaleString()
  })

  const loadStatus = computed(() => {
    if (store.loadError) return 'load failed: ' + store.loadError
    return store.loadStatus
  })

  const syncStatus = computed(() => {
    if (store.syncToGameError) return 'sync failed: ' + store.syncToGameError
    if (!store.syncToGameUpdatedAt) return ''
    return store.syncToGameStatus + ' ' + new Date(store.syncToGameUpdatedAt).toLocaleString()
  })
</script>
