// Utilities
import { defineStore } from 'pinia'

const AUTOSAVE_KEY = 'gnome-field-generator.map-editor.autosave.v1'
const MAP_SYNC_URL = import.meta.env.VITE_MAP_SYNC_URL || 'http://localhost:3002/sync-map'
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

export const useAppStore = defineStore('app', {
  state: () => ({
    width: 32,
    height: 24,
    cellTypes: [
      { color: '#5db0cd', code: 0, description: 'Вода' },
      { color: '#d8cab0', code: 1, description: 'Листочки' },
      { color: '#4f3829', code: 2, description: 'Дверь в подвал' },
      { color: '#d7904a', code: 3, description: 'Булочка' },
      { color: '#d9343f', code: 4, description: 'Банка краски' },
      { color: '#c78f4e', code: 5, description: 'Картон' },
      { color: '#59d9e8', code: 6, description: 'Сканер' },
      { color: '#5fd6e2', code: 7, description: 'Вход вентиляции' },
      { color: '#7b4fd3', code: 8, description: 'Волшебная коробка' },
      { color: '#edae4e', code: 9, description: 'Выход вентиляции' },
    ],
    selectedCellType: 0,
    selectedWallType: -1,
    cells: [],
    highlighted: [],
    portalPairs: [],
    autosaveLoaded: false,
    autosaveUpdatedAt: null,
    syncToGameInProgress: false,
    syncToGameStatus: '',
    syncToGameError: '',
    syncToGameUpdatedAt: null,
  }),
  actions: {
    init () {
      if (this.restoreAutosave()) {
        return
      }
      this.cells = createCells(this.width, this.height)
      this.persistAutosave()
    },
    updateSize (width, height) {
      const nextWidth = Number(width)
      const nextHeight = Number(height)
      if (
        !Number.isInteger(nextWidth)
        || !Number.isInteger(nextHeight)
        || nextWidth < 1
        || nextHeight < 1
      ) {
        return
      }

      this.width = nextWidth
      this.height = nextHeight
      this.cells = createCells(nextWidth, nextHeight)
      this.portalPairs = []
      this.persistAutosave()
    },
    getIndex (i, j) {
      return i * this.width + j
    },
    getCell (i, j) {
      return this.cells[this.getIndex(i, j)]
    },
    paintCell (i, j) {
      const index = i * this.width + j
      this.cells[index].type = this.selectedCellType
      this.persistAutosave()
    },
    addWall (i, j) {
      const index = i * this.width + j
      if (this.selectedWallType === 4) {
        this.cells[index].walls = [false, false, false, false]
        this.persistAutosave()
        return
      }
      this.cells[index].walls[this.selectedWallType] = true
      this.persistAutosave()
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
          if (
            cell1.type === pType
            && cell2.type === pType
            && cell3.type === pType
            && cell4.type === pType
          ) {
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
      const entrances = this
        .getPortals(false)
        .map(tiles => this.portalKey(tiles.map(([i, j]) => this.getIndex(i, j))))
      const exits = this
        .getPortals(true)
        .map(tiles => this.portalKey(tiles.map(([i, j]) => this.getIndex(i, j))))

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

        const entrance = entrances[inI].map(([i, j]) => this.getIndex(i, j))
        const exit = exits[outI].map(([i, j]) => this.getIndex(i, j))
        state.portals.push({
          entrance,
          exit,
        })
      }

      return state
    },
    save () {
      const json = JSON.stringify(this.buildExportState())
      const element = document.createElement('a')
      element.setAttribute(
        'href',
        'data:text/plain;charset=utf-8,' + encodeURIComponent(json),
      )
      element.setAttribute('download', 'map.json')
      element.style.display = 'none'
      document.body.append(element)
      element.click()
      element.remove()
    },
    async syncToGame () {
      this.syncToGameInProgress = true
      this.syncToGameStatus = ''
      this.syncToGameError = ''

      try {
        const response = await fetch(MAP_SYNC_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
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
      const data = JSON.parse(await file.text())
      const width = Number(data.width)
      const height = Number(data.height)
      if (!Number.isInteger(width) || !Number.isInteger(height)) {
        return
      }

      this.width = width
      this.height = height
      this.cells = Array.isArray(data.tiles) && data.tiles.length === width * height
        ? data.tiles.map(cell => normalizeCell(cell))
        : createCells(width, height)
      this.restorePortalPairs(data.portals)
      this.persistAutosave()
    },
    persistAutosave () {
      if (typeof localStorage === 'undefined') {
        return
      }

      const updatedAt = new Date().toISOString()
      const data = {
        version: 1,
        updatedAt,
        width: this.width,
        height: this.height,
        cells: this.cells.map(cell => normalizeCell(cell)),
        portalPairs: [...this.portalPairs],
      }

      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(data))
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
        const data = JSON.parse(stored)
        const width = Number(data.width)
        const height = Number(data.height)

        if (
          !Number.isInteger(width)
          || !Number.isInteger(height)
          || width < 1
          || height < 1
          || !Array.isArray(data.cells)
          || data.cells.length !== width * height
        ) {
          return false
        }

        this.width = width
        this.height = height
        this.cells = data.cells.map(cell => normalizeCell(cell))
        this.portalPairs = Array.isArray(data.portalPairs) ? data.portalPairs : []
        this.autosaveLoaded = true
        this.autosaveUpdatedAt = data.updatedAt || null
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
