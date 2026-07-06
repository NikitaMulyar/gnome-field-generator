# gnome-field-generator

Инструменты для карты `gnome-field`: Vue/Vuetify-редактор, autosave, sync-to-game API, генератор preview-картинки и генератор текстур темы `art-camp`.

## Структура

- `map-editor/` - Vue/Vuetify-редактор карты.
- `src/assets/map.json` - исходная карта редактора/генератора.
- `src/generate.py` - собирает PNG preview карты в `out/map.png`.
- `src/sync_server.py` - локальный API, который принимает карту из editor, генерирует preview и копирует JSON/PNG в game.
- `src/assets/textures/art-camp/` - текущие текстуры для preview.
- `scripts/generate_art_theme_assets.py` - генерирует текстуры и копирует их также в игровой проект.
- `out/map-2024.png`, `out/map-2025.png` - сохраненные preview старых карт.
- `out/map.png` - generated preview текущей карты.

Старые текстуры в `src/assets/textures/*.png` оставлены как legacy-набор. Для текущей игры используется `src/assets/textures/art-camp/`.

## Docker

Из корня этого репозитория можно поднять editor и sync API:

```bash
docker compose up --build
```

Обычно удобнее запускать общий compose из родительской рабочей папки, где рядом лежат оба проекта:

```text
gnome-field/
gnome-field-generator/
```

Sync API ожидает доступ к game-проекту, чтобы обновлять:

- `../gnome-field/gnome-field/public/map.json`;
- `../gnome-field/gnome-field/src/assets/map.png`.

## Python-Зависимости

```bash
python3 -m venv .venv
./.venv/bin/pip install -r requirements.txt
```

## Генерация Preview Карты

```bash
./.venv/bin/python src/generate.py
```

Результат:

```text
out/map.png
```

## Генерация Текстур Темы

```bash
./.venv/bin/python scripts/generate_art_theme_assets.py
```

Скрипт обновляет два набора файлов:

- `src/assets/textures/art-camp/` в этом репозитории;
- `../gnome-field/gnome-field/src/assets/map-tiles/art-camp/` в игровом репозитории.

Он также обновляет игровые эффекты:

- `paint-explosion.gif`;
- `paint-explosion.png`;
- `paint-stain.png`.

## Редактор Карты

```bash
cd map-editor
yarn install
yarn dev
```

Адрес по умолчанию:

```text
http://127.0.0.1:3001/
```

Для GitHub Pages/base-path проверки:

```bash
VITE_BASE_PATH=/gnome-field-generator/ yarn dev
```

## Autosave И Sync To Game

Редактор сохраняет черновик в `localStorage` после изменения карты.

Кнопка `sync to game` отправляет текущую карту в sync API:

```text
http://localhost:3002/sync-map
```

API:

1. валидирует карту;
2. записывает ее в `src/assets/map.json`;
3. запускает `src/generate.py`;
4. копирует JSON в game `public/map.json`;
5. копирует preview PNG в game `src/assets/map.png`.

## Проверки

```bash
cd map-editor
yarn lint
yarn build
```

Из корня generator-проекта:

```bash
./.venv/bin/python src/generate.py
```

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

Фанерные стены сохраняются в `walls` каждой клетки в порядке `up`, `right`, `down`, `left`.
