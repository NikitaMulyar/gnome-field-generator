# gnome-field map-editor

Vue/Vuetify-редактор карты для `gnome-field`.

## Запуск Через Docker

Из корня `gnome-field-generator`:

```bash
docker compose up --build
```

Editor открывается на:

```text
http://127.0.0.1:3001/
```

Sync API открывается на:

```text
http://127.0.0.1:3002/
```

## Запуск Без Docker

```bash
yarn install
yarn dev
```

Адрес:

```text
http://127.0.0.1:3001/
```

Если нужен base path для Pages:

```bash
VITE_BASE_PATH=/gnome-field-generator/ yarn dev
```

## Команды

```bash
yarn lint
yarn build
yarn preview
```

`yarn lint` может автоформатировать файлы. После запуска проверяй `git diff`.

## Как Пользоваться

- Размер карты задается в блоке размеров.
- Тип клетки выбирается в панели типов.
- Стены задаются отдельными кнопками направлений; в игре они выглядят как фанера.
- Входы и выходы вентиляции создаются 2x2 блоками из клеток `7` и `9`.
- Пары вентиляции настраиваются в portal controls.
- `Save` скачивает `map.json`.
- `Load` загружает существующий `map.json` и восстанавливает portal pairs.
- Черновик автоматически сохраняется в `localStorage`.
- `sync to game` отправляет текущую карту в sync API и обновляет game-проект.

## Формат Карты

```json
{
  "width": 32,
  "height": 24,
  "portals": [
    {
      "entrance": [1, 2, 33, 34],
      "exit": [100, 101, 132, 133]
    }
  ],
  "tiles": [
    {
      "type": 0,
      "walls": [false, false, false, false]
    }
  ]
}
```

Порядок стен: `up`, `right`, `down`, `left`.

## Sync To Game

Кнопка `sync to game` вызывает:

```text
http://localhost:3002/sync-map
```

По умолчанию URL можно переопределить через:

```bash
VITE_MAP_SYNC_URL=http://localhost:3002/sync-map yarn dev
```

Sync API сохраняет карту в generator, запускает `src/generate.py`, а потом копирует:

- `src/assets/map.json` -> `../gnome-field/gnome-field/public/map.json`;
- `out/map.png` -> `../gnome-field/gnome-field/src/assets/map.png`.

## Типы Клеток

| Код | Значение |
| --- | --- |
| `0` | вода |
| `1` | листочки |
| `2` | дверь в подвал |
| `3` | булочка |
| `4` | банка краски |
| `5` | картон |
| `6` | сканер |
| `7` | вход в вентиляцию |
| `8` | волшебная коробка |
| `9` | выход из вентиляции |
