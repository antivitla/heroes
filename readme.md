# Разработка

Нужно создать файл `credentials.json` - в котором будут несколько защищенных данных. Во-первых ключи Telegram API (нужно для работы с телеграм-каналами), во-вторых ключи Yandex.Cloud.

```json

{
  "telegram": {
    "session": "...",
    "apiId": "...",
    "apiHash": "...",
    "phoneNumber": "..."
  },
  "yandex.vision": {
    "folderId": "...",
    "iam.token": "..."
  }
}
```

**Yandex.Vision**

Взять `folderId`: https://cloud.yandex.ru/docs/resource-manager/operations/folder/get-id

Генерировать `iam.token` для распознавания текста на Yandex.Cloud

`$ yc iam create-token` (Yandex.Cloud CLI)

**Telegram**

Нужно подставитть номер телефона, Telegram API ID и Hash. Session он сам создаст.

**Поднимаем локально**

Поднимать локальный сервер через `docker-compose up` (Docker), так как требуется PHP при разработке. Для дистрибутива PHP не нужен.

## TODO

- Парсить текст на предмет:
  - награды
  - теги обстоятельств