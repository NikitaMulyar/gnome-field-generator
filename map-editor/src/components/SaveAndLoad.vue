<template>
  <v-row>
    <v-col align="center" align-self="center" cols="3">
      <v-btn prepend-icon="mdi-download" size="large" @click="store.save()">save</v-btn>
    </v-col>
    <v-col cols="4">
      <v-file-input hide-details label="Load" prepend-icon="mdi-upload" @update:model-value="load" />
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
      <v-btn icon="mdi-delete-outline" variant="tonal" @click="clearAutosave" />
    </v-col>
  </v-row>
  <v-row v-if="autosaveStatus || syncStatus" dense>
    <v-col v-if="autosaveStatus" cols="12" md="6">
      <v-chip color="success" size="small" variant="tonal">{{ autosaveStatus }}</v-chip>
    </v-col>
    <v-col v-if="syncStatus" cols="12" md="6">
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
    const file = Array.isArray($event) ? $event[0] : $event
    if (file) store.load(file)
  }

  const clearAutosave = () => {
    store.clearAutosave()
  }

  const syncToGame = () => {
    store.syncToGame()
  }

  const autosaveStatus = computed(() => {
    if (!store.autosaveUpdatedAt) return ''
    return 'draft saved ' + new Date(store.autosaveUpdatedAt).toLocaleString()
  })

  const syncStatus = computed(() => {
    if (store.syncToGameError) return 'sync failed: ' + store.syncToGameError
    if (!store.syncToGameUpdatedAt) return ''
    return store.syncToGameStatus + ' ' + new Date(store.syncToGameUpdatedAt).toLocaleString()
  })
</script>
