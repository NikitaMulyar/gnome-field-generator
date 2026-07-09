// Utilities
import { defineStore } from 'pinia'
import defaultMap from '@/assets/map.json'

const AUTOSAVE_KEY = 'gnome-field-generator.map-editor.autosave.v1'
const DEFAULT_MAP_SYNC_URL = 'http://localhost:3002/sync-map'
const DISABLED_MAP_SYNC_VALUES = new Set(['disabled', 'none', 'off', 'false'])
const normalizeMapSyncUrl = value => {
  if (typeof value !== 'string') {
    return DEFAULT_MAP_SYNC_URL
  }

  const normalized = value.trim()
  if (DISABLED_MAP_SYNC_VALUES.has(normalized.toLowerCase())) {
    return ''
  }

  return normalized || DEFAULT_MAP_SYNC_URL
}
const MAP_SYNC_URL = normalizeMapSyncUrl(import.meta.env.VITE_MAP_SYNC_URL)
const MIN_CELL_TYPE = 0
const MAX_CELL_TYPE = 9

export class Cell {
  constructor () {
    this.type = 0
    this.walls = [false, false, false, false]
  }
}

class MapState {
  constructor (width, height) {
    this.width = width
    this.height = height
    this.portals = []
    this.tiles = []
  }
}

const createCells = (width, height) => {
  const cells = []
  for (let i = 0; i < width * height; ++i) {
    cells.push(new Cell())
  }
  return cells
}

const normalizeTileType = type => {
  const normalized = Number(type)
  return Number.isInteger(normalized) && normalized >= MIN_CELL_TYPE && normalized <= MAX_CELL_TYPE
    ? normalized
    : MIN_CELL_TYPE
}

const normalizeCell = cell => ({
  type: normalizeTileType(cell?.type),
  walls: Array.isArray(cell?.walls)
    ? [0, 1, 2, 3].map(index => Boolean(cell.walls[index]))
    : [false, false, false, false],
})

const normalizeDimensions = data => {
  const width = Number(data?.width)
  const height = Number(data?.height)

  if (!Number.isInteger(width) || width < 1) {
    throw new Error('map width must be a positive integer')
  }
  if (!Number.isInteger(height) || height < 1) {
    throw new Error('map height must be a positive integer')
  }

  return { width, height }
}

const normalizeMapData = data => {
  const { width, height } = normalizeDimensions(data)
  if (!Array.isArray(data?.tiles)) {
    throw new TypeError('map tiles must be an array')
  }
  if (data.tiles.length !== width * height) {
    throw new Error(`map must contain ${width * height} tiles, got ${data.tiles.length}`)
  }

  return {
    width,
    height,
    portals: Array.isArray(data.portals) ? data.portals : [],
    tiles: data.tiles.map(cell => normalizeCell(cell)),
  }
}

const mapSignature = data => JSON.stringify({
  width: data.width,
  height: data.height,
  portals: data.portals,
  tiles: data.tiles.map(cell => normalizeCell(cell)),
})

const DEFAULT_MAP_DATA = normalizeMapData(defaultMap)
const DEFAULT_MAP_SIGNATURE = mapSignature(DEFAULT_MAP_DATA)

const normalizeAutosaveData = data => {
  if (data?.baseMapSignature !== DEFAULT_MAP_SIGNATURE) {
    throw new Error('autosave belongs to another source map')
  }

  const { width, height } = normalizeDimensions(data)
  if (!Array.isArray(data?.cells) || data.cells.length !== width * height) {
    throw new Error('autosave cells are invalid')
  }

  return {
    width,
    height,
    cells: data.cells.map(cell => normalizeCell(cell)),
    portalPairs: Array.isArray(data.portalPairs) ? data.portalPairs : [],
    updatedAt: data.updatedAt || null,
  }
}

export const useAppStore = defineStore('app', {
  state: () => ({
    width: 32,
    height: 24,
    cellTypes: [
      { color: '#6d9eeb', code: 0, description: 'Water' },
      { color: '#9d632c', code: 1, description: 'Stone' },
      { color: '#c27ba0', code: 2, description: 'Entrance' },
      { color: '#b7b7b7', code: 3, description: 'Cliff' },
      { color: '#ff0000', code: 4, description: 'Bomb' },
      { color: '#fff2cc', code: 5, description: 'Sand' },
      { color: '#8e7cc3', code: 6, description: 'Mole' },
      { color: '#ff00ff', code: 7, description: 'PortalEntrance' },
      { color: '#04ff00', code: 8, description: 'Target' },
      { color: '#b306b7', code: 9, description: 'PortalExit' },
    ],
    selectedCellType: 0,
    selectedWallType: -1,
    cells: [],
    highlighted: [],
    portalPairs: [],
    autosaveLoaded: false,
    autosaveUpdatedAt: null,
    loadStatus: '',
    loadError: '',
    syncToGameInProgress: false,
    syncToGameStatus: '',
    syncToGameError: '',
    syncToGameUpdatedAt: null,
    brushActive: false,
    lastBrushedCell: null,
  }),
  getters: {
    isMapSyncAvailable: () => Boolean(MAP_SYNC_URL),
    mapSyncUrl: () => MAP_SYNC_URL,
  },
  actions: {
    init () {
      if (this.restoreAutosave()) {
        return
      }
      this.applyMapData(DEFAULT_MAP_DATA)
      this.persistAutosave()
    },
    applyMapData (data) {
      const normalized = normalizeMapData(data)
      this.width = normalized.width
      this.height = normalized.height
      this.cells = normalized.tiles.map(cell => normalizeCell(cell))
      this.highlighted = []
      this.restorePortalPairs(normalized.portals)
    },
    updateSize (width, height) {
      const nextWidth = Number(width)
      const nextHeight = Number(height)
      if (!Number.isInteger(nextWidth) || !Number.isInteger(nextHeight) || nextWidth < 1 || nextHeight < 1) {
        return
      }

      this.width = nextWidth
      this.height = nextHeight
      this.cells = createCells(nextWidth, nextHeight)
      this.portalPairs = []
      this.persistAutosave()
    },
    clearField () {
      this.stopBrush()
      this.cells = createCells(this.width, this.height)
      this.portalPairs = []
      this.highlighted = []
      this.loadStatus = ''
      this.loadError = ''
      this.syncToGameStatus = ''
      this.syncToGameError = ''
      this.syncToGameUpdatedAt = null
      this.persistAutosave()
    },
    getIndex (i, j) {
      return i * this.width + j
    },
    getCell (i, j) {
      return this.cells[this.getIndex(i, j)]
    },
    paintCell (i, j) {
      const index = this.getIndex(i, j)
      if (!this.cells[index]) {
        return
      }
      this.cells[index].type = this.selectedCellType
      this.persistAutosave()
    },
    addWall (i, j) {
      const index = this.getIndex(i, j)
      if (!this.cells[index]) {
        return
      }
      if (this.selectedWallType === 4) {
        this.cells[index].walls = [false, false, false, false]
        this.persistAutosave()
        return
      }
      if (this.selectedWallType < 0 || this.selectedWallType > 3) {
        return
      }
      this.cells[index].walls[this.selectedWallType] = true
      this.persistAutosave()
    },
    applySelectedTool (i, j) {
      const key = i + '-' + j
      if (this.lastBrushedCell === key) {
        return
      }

      this.lastBrushedCell = key
      if (this.selectedCellType !== -1) {
        this.paintCell(i, j)
      }
      if (this.selectedWallType !== -1) {
        this.addWall(i, j)
      }
    },
    startBrush (i, j) {
      this.brushActive = true
      this.lastBrushedCell = null
      this.applySelectedTool(i, j)
    },
    continueBrush (i, j) {
      if (!this.brushActive) {
        return
      }
      this.applySelectedTool(i, j)
    },
    stopBrush () {
      this.brushActive = false
      this.lastBrushedCell = null
    },
    getPortals (exists = false) {
      const pType = exists ? 9 : 7
      const portals = []
      for (let i = 0; i < this.height - 1; ++i) {
        for (let j = 0; j < this.width - 1; ++j) {
          const cell1 = this.getCell(i, j)
          const cell2 = this.getCell(i + 1, j)
          const cell3 = this.getCell(i, j + 1)
          const cell4 = this.getCell(i + 1, j + 1)
          if (cell1.type === pType && cell2.type === pType && cell3.type === pType && cell4.type === pType) {
            portals.push([[i, j], [i + 1, j], [i, j + 1], [i + 1, j + 1]])
          }
        }
      }
      return portals
    },
    highlight (i, j) {
      this.highlighted.push(i + '-' + j)
    },
    isHighlighted (i, j) {
      return this.highlighted.includes(i + '-' + j)
    },
    portalKey (indices) {
      return [...indices].sort((a, b) => a - b).join(',')
    },
    restorePortalPairs (portals = []) {
      this.portalPairs = []
      const entrances = this.getPortals(false).map(tiles => this.portalKey(tiles.map(([i, j]) => this.getIndex(i, j))))
      const exits = this.getPortals(true).map(tiles => this.portalKey(tiles.map(([i, j]) => this.getIndex(i, j))))

      for (const portal of portals) {
        if (!Array.isArray(portal?.entrance) || !Array.isArray(portal?.exit)) {
          continue
        }
        const entranceIndex = entrances.indexOf(this.portalKey(portal.entrance))
        const exitIndex = exits.indexOf(this.portalKey(portal.exit))
        if (entranceIndex !== -1 && exitIndex !== -1) {
          this.portalPairs.push(entranceIndex + '-' + exitIndex)
        }
      }
    },
    buildExportState () {
      const state = new MapState(this.width, this.height)
      state.tiles = this.cells.map(cell => normalizeCell(cell))
      const entrances = this.getPortals(false)
      const exits = this.getPortals(true)

      for (const pair of this.portalPairs) {
        const [inI, outI] = pair.split('-').map(Number)
        if (!entrances[inI] || !exits[outI]) {
          continue
        }
        state.portals.push({
          entrance: entrances[inI].map(([i, j]) => this.getIndex(i, j)),
          exit: exits[outI].map(([i, j]) => this.getIndex(i, j)),
        })
      }

      return state
    },
    save () {
      const json = JSON.stringify(this.buildExportState())
      const element = document.createElement('a')
      element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(json))
      element.setAttribute('download', 'map.json')
      element.style.display = 'none'
      document.body.append(element)
      element.click()
      element.remove()
    },
    async syncToGame () {
      if (!MAP_SYNC_URL) {
        this.syncToGameStatus = ''
        this.syncToGameError = 'sync API is disabled in this static build. Use save/load JSON or run the editor locally with map-sync-api.'
        return
      }

      this.syncToGameInProgress = true
      this.syncToGameStatus = ''
      this.syncToGameError = ''

      try {
        const response = await fetch(MAP_SYNC_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.buildExportState()),
        })

        const result = await response.json().catch(() => ({}))
        if (!response.ok || result.ok === false) {
          throw new Error(result.error || `Sync failed with status ${response.status}`)
        }

        this.syncToGameUpdatedAt = new Date().toISOString()
        this.syncToGameStatus = 'map synced to game'
      } catch (error) {
        const message = error.message || String(error)
        this.syncToGameError = message === 'Failed to fetch'
          ? `sync API is not reachable at ${MAP_SYNC_URL}. Start Docker Compose with map-sync-api and try again.`
          : message
      } finally {
        this.syncToGameInProgress = false
      }
    },
    setPortalPair (entranceIndex, exitIndex) {
      this.portalPairs = this.portalPairs.filter(pair => !pair.startsWith(entranceIndex + '-'))
      if (Number.isInteger(exitIndex) && exitIndex >= 0) {
        this.portalPairs.push(entranceIndex + '-' + exitIndex)
      }
      this.persistAutosave()
    },
    async load (file) {
      this.loadStatus = ''
      this.loadError = ''
      try {
        const selectedFile = Array.isArray(file) ? file[0] : file
        if (!selectedFile) {
          return
        }

        const data = normalizeMapData(JSON.parse(await selectedFile.text()))
        this.stopBrush()
        this.applyMapData(data)
        this.persistAutosave()
        this.loadStatus = 'map loaded'
      } catch (error) {
        this.loadError = error.message || String(error)
      }
    },
    persistAutosave () {
      if (typeof localStorage === 'undefined') {
        return
      }

      const updatedAt = new Date().toISOString()
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify({
        version: 1,
        baseMapSignature: DEFAULT_MAP_SIGNATURE,
        updatedAt,
        width: this.width,
        height: this.height,
        cells: this.cells.map(cell => normalizeCell(cell)),
        portalPairs: [...this.portalPairs],
      }))
      this.autosaveUpdatedAt = updatedAt
    },
    restoreAutosave () {
      if (typeof localStorage === 'undefined') {
        return false
      }

      const stored = localStorage.getItem(AUTOSAVE_KEY)
      if (!stored) {
        return false
      }

      try {
        const data = normalizeAutosaveData(JSON.parse(stored))
        this.width = data.width
        this.height = data.height
        this.cells = data.cells
        this.portalPairs = data.portalPairs
        this.autosaveLoaded = true
        this.autosaveUpdatedAt = data.updatedAt
        return true
      } catch (error) {
        console.error('Failed to restore map autosave:', error)
        return false
      }
    },
    clearAutosave () {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(AUTOSAVE_KEY)
      }
      this.autosaveLoaded = false
      this.autosaveUpdatedAt = null
    },
  },
})
