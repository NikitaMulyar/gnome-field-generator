# GitHub Pages Deploy

Эта репа деплоит редактор карты как статический Vite-сайт на GitHub Pages.

## Что уже подготовлено

- workflow: `.github/workflows/deploy-pages.yml`;
- base path для Pages: `/gnome-field-generator/`;
- SPA fallback: `dist/404.html`;
- в Pages-сборке `sync to game` отключен через `VITE_MAP_SYNC_URL=disabled`;
- локально sync API продолжает работать через Docker на `http://localhost:3002/sync-map`.

## Первичная настройка GitHub Pages

1. Открой репозиторий `NikitaMulyar/gnome-field-generator` на GitHub.
2. Перейди в `Settings` -> `Pages`.
3. В `Build and deployment` выбери `Source: GitHub Actions`.
4. Сохрани настройки.
5. Запушь ветку `main`.
6. Открой вкладку `Actions` и дождись успешного workflow `Deploy GitHub Pages`.

После деплоя редактор будет доступен по адресу:

```text
https://nikitamulyar.github.io/gnome-field-generator/
```

## Ручной запуск проверки перед пушем

```bash
cd /Users/nikm/PycharmProjects/gnome-field-generator/map-editor
VITE_BASE_PATH=/gnome-field-generator/ VITE_MAP_SYNC_URL=disabled yarn build
cp dist/index.html dist/404.html
```

Для локального просмотра production build:

```bash
yarn preview --host 0.0.0.0
```

## Что делать с sync to game

`sync to game` требует backend, потому что он:

1. принимает карту из браузера;
2. валидирует JSON;
3. генерирует `out/map.png`;
4. пишет файлы в соседний репозиторий игры.

GitHub Pages не умеет выполнять эти действия. Поэтому в Pages-сборке кнопка отключена.

### Рекомендуемый процесс

Для реальной работы с картой использовать локальный Docker:

```bash
cd /Users/nikm/PycharmProjects/gnome-field-generator
docker compose up --build
```

Адреса:

```text
editor:   http://127.0.0.1:3001/
sync API: http://127.0.0.1:3002/
```

После `sync to game` нужно проверить игру локально, закоммитить изменения в обеих репах и запушить `main`.

### Альтернатива: внешний sync API

Если хочется, чтобы кнопка работала прямо на публичном Pages-сайте, нужен отдельный backend, например Render, Railway, Fly.io, Cloud Run или VPS.

Тогда workflow редактора надо изменить:

```yaml
env:
  VITE_BASE_PATH: /gnome-field-generator/
  VITE_MAP_SYNC_URL: https://your-api.example.com/sync-map
```

Важно: нельзя класть GitHub token в frontend. Если внешний API должен сам коммитить карту в репозитории, токен должен храниться только на backend.

### Самый простой публичный режим

Оставить Pages-редактор только для просмотра/ручного редактирования:

1. отредактировать карту;
2. нажать `save`;
3. скачать `map.json`;
4. применить его локально через sync API или вручную заменить файлы и пересобрать preview.
