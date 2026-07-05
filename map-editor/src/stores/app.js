// Utilities
import { defineStore } from 'pinia'

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
  }),
  actions: {
    init () {
      this.cells = []
      for (let i = 0; i < this.width * this.height; ++i) {
        this.cells.push(new Cell())
      }
    },
    updateSize (width, height) {
      this.width = width
      this.height = height
      this.cells = []
      for (let i = 0; i < width * height; ++i) {
        this.cells.push(new Cell())
      }
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
    },
    addWall (i, j) {
      const index = i * this.width + j
      if (this.selectedWallType == 4) {
        this.cells[index].walls = [false, false, false, false]
        return
      }
      this.cells[index].walls[this.selectedWallType] = true
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
          if (cell1.type == pType && cell2.type == pType && cell3.type == pType && cell4.type == pType) {
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
        const entranceIndex = entrances.indexOf(this.portalKey(portal.entrance))
        const exitIndex = exits.indexOf(this.portalKey(portal.exit))
        if (entranceIndex !== -1 && exitIndex !== -1) {
          this.portalPairs.push(entranceIndex + '-' + exitIndex)
        }
      }
    },
    save () {
      const state = new MapState(this.width, this.height)
      state.tiles = this.cells
      const entrances = this.getPortals(false)
      const exits = this.getPortals(true)

      for (const pair of this.portalPairs) {
        const [inI, outI] = pair.split('-').map(el => {
          const n = Number(el)
          return n === 0 ? n : n || el
        })
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

      const json = JSON.stringify(state)
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
    async load (file) {
      const data = JSON.parse(await file.text())
      this.updateSize(data.width, data.height)
      this.cells = data.tiles
      this.restorePortalPairs(data.portals)
    },
  },
})
