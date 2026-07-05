# gnome-field-generator

Инструменты для подготовки поля игры: визуальный редактор карты, JSON с описанием клеток и Python-скрипт, который собирает большую PNG-карту из тайлов.

Эта папка производит два главных артефакта для игры:

- `map.json` - логическая карта: размеры, типы клеток, стены и порталы.
- `map.png` - фоновая картинка поля, поверх которой игра рисует интерактивную сетку.

## Структура

```text
gnome-field-generator/
  docker-compose.yml        # запуск редактора и Python-генератора
  Dockerfile                # Python-образ для generate.py
  src/
    generate.py             # рендерит PNG-карту из JSON и текстур
    assets/
      map.json              # входная карта для generate.py
      textures/             # картинки клеток и стен
  out/
    map-2024.png            # сохраненные примеры/версии карт
    map-2025.png
  map-editor/               # Vue/Vuetify-редактор map.json
  requirements.txt          # Python-зависимости для generate.py
```

## Запуск через Docker

Из этой папки можно поднять редактор карты отдельно:

```bash
docker compose up --build map-editor
```

Редактор будет доступен здесь:

```text
http://localhost:3001/
```

Из корня `C:\NotGnomes` можно поднять сразу игру и редактор:

```bash
docker compose up --build
```

## Сгенерировать PNG-карту через Docker

Только генерация `out/map.png`:

```bash
docker compose --profile tools run --rm map-generator
```

Из корня `C:\NotGnomes` можно сразу сгенерировать PNG и скопировать карту в игру:

```bash
docker compose --profile tools run --rm map-sync
```

## Формат `map.json`

Минимальная структура:

```json
{
  "width": 32,
  "height": 24,
  "portals": [],
  "tiles": [
    {
      "type": 0,
      "walls": [false, false, false, false]
    }
  ]
}
```

Правила:

- `width` и `height` задают размер поля.
- `tiles` - плоский массив длиной `width * height`.
- Индекс клетки считается так: `index = row * width + column`.
- `walls` всегда хранит 4 значения в порядке `[up, right, down, left]`.
- `portals` связывает 2x2-блок входа с 2x2-блоком выхода.

Пример портала:

```json
{
  "entrance": [100, 101, 132, 133],
  "exit": [300, 301, 332, 333]
}
```

## Типы клеток

| Код | Тип в игре | Текущая текстура генератора |
| --- | --- | --- |
| `0` | `Water` | `milk.png` |
| `1` | `Stone` | `cheese.png` |
| `2` | `Entrance` | `entrance.png` |
| `3` | `Cliff` | `lolipop.png` |
| `4` | `Bomb` | `agusha.png` |
| `5` | `Sand` | `chocolate.png` |
| `6` | `Mole` | `mouse.png` |
| `7` | `PortalEntrance` | `portal-in.png` |
| `8` | `Target` | `machine.png` |
| `9` | `PortalExit` | `portal-out.png` |

## Как работает `src/generate.py`

1. Читает `src/assets/map.json`.
2. Создает прозрачное изображение размером `width * 64` на `height * 64`.
3. Рисует обычные клетки по их типам.
4. Отдельно ищет 2x2-блоки порталов (`7` или `9`) и рисует для них одну большую текстуру.
5. Поверх клеток рисует стены из `wall-up.png`, `wall-right.png`, `wall-down.png`, `wall-left.png`.
6. Сохраняет результат в `out/map.png`.

Размер одного тайла сейчас захардкожен:

```python
TILE_SIZE = 64
```

## Важные ограничения

- `generate.py` не валидирует карту: если в JSON неправильный код клетки, неправильная длина `tiles` или нет нужной текстуры, ошибка появится только во время запуска.
- В редакторе порталы определяются как 2x2-блоки. Одинокая клетка типа `PortalEntrance` или `PortalExit` не считается полноценным порталом.
- В текущем редакторе загрузка файла восстанавливает размеры и клетки, но пары порталов в UI могут потребовать повторного выбора перед сохранением.
- В проекте есть несколько наборов текстур (`2024`, `minecraft`), но `generate.py` сейчас использует только файлы напрямую из `src/assets/textures/`.
