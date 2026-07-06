<template>
<<<<<<< HEAD
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
=======
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
>>>>>>> da7a9c7df008230ea9f74e71a0ddd26ab4153897
</template>

<script setup>
  import { computed } from 'vue'
  import { useAppStore } from '@/stores/app'

  const store = useAppStore()

  const load = $event => {
    const file = Array.isArray($event) ? $event[0] : $event
    if (file) store.load(file)
  }

<<<<<<< HEAD
const clearField = () => {
    store.clearField();
};
=======
  const clearAutosave = () => {
    store.clearAutosave()
  }
>>>>>>> da7a9c7df008230ea9f74e71a0ddd26ab4153897

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
