# gnome-field-generator

Инструменты для карты `gnome-field`: редактор карты, генератор preview-картинки и скрипт генерации текстур темы `art-camp`.

## Структура

- `map-editor/` - Vue/Vuetify-редактор карты.
- `src/assets/map.json` - исходная карта редактора/генератора.
- `src/generate.py` - собирает PNG preview карты в `out/map.png`.
- `src/assets/textures/art-camp/` - текущие текстуры для preview.
- `scripts/generate_art_theme_assets.py` - генерирует текстуры и копирует их также в игровой проект.
- `out/map-2024.png`, `out/map-2025.png` - сохраненные preview старых карт.
- `out/map.png` - локальный generated preview, намеренно игнорируется git.

Старые текстуры в `src/assets/textures/*.png` оставлены как legacy-набор. Для текущей игры используется `src/assets/textures/art-camp/`.

## Установка Python-Зависимостей

```bash
python3 -m venv .venv
./.venv/bin/pip install -r requirements.txt
```

## Генерация Preview Карты

```bash
./.venv/bin/python src/generate.py
```

Результат появится в:

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

Адрес разработки:

```text
http://127.0.0.1:3000/gnome-field-generator/
```

Если порт занят:

```bash
yarn dev --port 3001
```

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

Фанерные стены сохраняются в `walls` каждой клетки.
