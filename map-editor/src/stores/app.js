// Utilities
import { defineStore } from 'pinia';


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
  }),
  actions: {
    init() {
      this.cells = [];
      for (let i = 0; i < this.width * this.height; ++i) {
        this.cells.push(new Cell());
      }
    },
    updateSize(width, height) {
      this.width = width;
      this.height = height;
      this.cells = [];
      for (let i = 0; i < width * height; ++i) {
        this.cells.push(new Cell());
      }
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
    },
    addWall(i, j) {
      const index = i * this.width + j;
      if (this.selectedWallType == 4) {
        this.cells[index].walls = [false, false, false, false];
        return;
      }
      this.cells[index].walls[this.selectedWallType] = true;
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
    save() {
      let state = new MapState(this.width, this.height);
      state.tiles = this.cells;

      for (let pair of this.portalPairs) {
        const [inI, outI] = pair.split('-').map(el => {
          let n = Number(el);
          return n === 0 ? n : n || el;
        });

        const entrance = this.getPortals(false)[inI].map(([i, j]) => this.getIndex(i, j));
        const exit = this.getPortals(true)[outI].map(([i, j]) => this.getIndex(i, j));
        state.portals.push({
          "entrance": entrance,
          "exit": exit,
        });
      }

      const json = JSON.stringify(state);
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
    async load(file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const data = JSON.parse(event.target.result);
        this.updateSize(data.width, data.height);
        this.cells = data.tiles;
      };
      reader.readAsText(file);
    },
  },
});
