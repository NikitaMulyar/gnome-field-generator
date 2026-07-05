// Utilities
import { defineStore } from 'pinia';

const AUTOSAVE_KEY = 'gnome-field-generator.map-editor.autosave.v1';

export class Cell {
  constructor() {
    this.type = 0;
    this.walls = [false, false, false, false];
  }
}

class MapState {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.portals = [];
    this.tiles = [];
  }
}

const createCells = (width, height) => {
  const cells = [];
  for (let i = 0; i < width * height; ++i) {
    cells.push(new Cell());
  }
  return cells;
};

const normalizeCell = (cell) => ({
  type: Number(cell?.type) || 0,
  walls: Array.isArray(cell?.walls)
    ? [0, 1, 2, 3].map((index) => Boolean(cell.walls[index]))
    : [false, false, false, false],
});

export const useAppStore = defineStore('app', {
  state: () => ({
    width: 32,
    height: 24,
    cellTypes: [
      { "color": "#6d9eeb", "code": 0, "description": "Water" },
      { "color": "#9d632c", "code": 1, "description": "Stone" },
      { "color": "#c27ba0", "code": 2, "description": "Entrance" },
      { "color": "#b7b7b7", "code": 3, "description": "Cliff" },
      { "color": "#ff0000", "code": 4, "description": "Bomb" },
      { "color": "#fff2cc", "code": 5, "description": "Sand" },
      { "color": "#8e7cc3", "code": 6, "description": "Mole" },
      { "color": "#ff00ff", "code": 7, "description": "PortalEntrance" },
      { "color": "#04ff00", "code": 8, "description": "Target" },
      { "color": "#b306b7", "code": 9, "description": "PortalExit" },
    ],
    selectedCellType: 0,
    selectedWallType: -1,
    cells: [],
    highlighted: [],
    portalPairs: [],
    autosaveLoaded: false,
    autosaveUpdatedAt: null,
  }),
  actions: {
    init() {
      if (this.restoreAutosave()) return;
      this.cells = createCells(this.width, this.height);
      this.persistAutosave();
    },
    updateSize(width, height) {
      this.width = width;
      this.height = height;
      this.cells = createCells(width, height);
      this.portalPairs = [];
      this.persistAutosave();
    },
    getIndex(i, j) {
      return i * this.width + j;
    },
    getCell(i, j) {
      return this.cells[this.getIndex(i, j)];
    },
    paintCell(i, j) {
      const index = i * this.width + j;
      this.cells[index].type = this.selectedCellType;
      this.persistAutosave();
    },
    addWall(i, j) {
      const index = i * this.width + j;
      if (this.selectedWallType == 4) {
        this.cells[index].walls = [false, false, false, false];
        this.persistAutosave();
        return;
      }
      this.cells[index].walls[this.selectedWallType] = true;
      this.persistAutosave();
    },
    getPortals(exists = false) {
      const pType = exists ? 9 : 7;
      let portals = [];
      for (let i = 0; i < this.height - 1; ++i) {
        for (let j = 0; j < this.width - 1; ++j) {
          const cell1 = this.getCell(i, j);
          const cell2 = this.getCell(i + 1, j);
          const cell3 = this.getCell(i, j + 1);
          const cell4 = this.getCell(i + 1, j + 1);
          if (cell1.type == pType && cell2.type == pType && cell3.type == pType && cell4.type == pType) {
            portals.push([[i, j], [i + 1, j], [i, j + 1], [i + 1, j + 1]]);
          }
        }
      }
      return portals;
    },
    highlight(i, j) {
      this.highlighted.push(i + '-' + j);
    },
    isHighlighted(i, j) {
      return this.highlighted.includes(i + '-' + j);
    },
    buildExportState() {
      let state = new MapState(this.width, this.height);
      state.tiles = this.cells.map(normalizeCell);

      for (let pair of this.portalPairs) {
        const [inI, outI] = pair.split('-').map(el => {
          let n = Number(el);
          return n === 0 ? n : n || el;
        });

        const entrancePortal = this.getPortals(false)[inI];
        const exitPortal = this.getPortals(true)[outI];
        if (!entrancePortal || !exitPortal) continue;

        const entrance = entrancePortal.map(([i, j]) => this.getIndex(i, j));
        const exit = exitPortal.map(([i, j]) => this.getIndex(i, j));
        state.portals.push({
          "entrance": entrance,
          "exit": exit,
        });
      }

      return state;
    },
    save() {
      const json = JSON.stringify(this.buildExportState());
      let element = document.createElement("a");
      element.setAttribute(
        "href",
        "data:text/plain;charset=utf-8," + encodeURIComponent(json)
      );
      element.setAttribute("download", "map.json");
      element.style.display = "none";
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    },
    setPortalPair(entranceIndex, exitIndex) {
      this.portalPairs = this.portalPairs.filter((pair) => !pair.startsWith(entranceIndex + '-'));
      this.portalPairs.push(entranceIndex + '-' + exitIndex);
      this.persistAutosave();
    },
    async load(file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const data = JSON.parse(event.target.result);
        this.width = data.width;
        this.height = data.height;
        this.cells = data.tiles.map(normalizeCell);
        this.portalPairs = [];
        this.persistAutosave();
      };
      reader.readAsText(file);
    },
    persistAutosave() {
      if (typeof localStorage === 'undefined') return;

      const updatedAt = new Date().toISOString();
      const data = {
        version: 1,
        updatedAt,
        width: this.width,
        height: this.height,
        cells: this.cells.map(normalizeCell),
        portalPairs: [...this.portalPairs],
      };

      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(data));
      this.autosaveUpdatedAt = updatedAt;
    },
    restoreAutosave() {
      if (typeof localStorage === 'undefined') return false;

      const stored = localStorage.getItem(AUTOSAVE_KEY);
      if (!stored) return false;

      try {
        const data = JSON.parse(stored);
        const width = Number(data.width);
        const height = Number(data.height);

        if (
          !Number.isInteger(width) ||
          !Number.isInteger(height) ||
          width < 1 ||
          height < 1 ||
          !Array.isArray(data.cells) ||
          data.cells.length !== width * height
        ) {
          return false;
        }

        this.width = width;
        this.height = height;
        this.cells = data.cells.map(normalizeCell);
        this.portalPairs = Array.isArray(data.portalPairs) ? data.portalPairs : [];
        this.autosaveLoaded = true;
        this.autosaveUpdatedAt = data.updatedAt || null;
        return true;
      } catch (error) {
        console.error('Failed to restore map autosave:', error);
        return false;
      }
    },
    clearAutosave() {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(AUTOSAVE_KEY);
      }
      this.autosaveLoaded = false;
      this.autosaveUpdatedAt = null;
    },
  },
});
