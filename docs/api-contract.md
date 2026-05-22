# API Contracts (Draft)

## Health
- `GET /api/health` — статус сервиса.

## Sports
- `GET /api/sports` — список видов спорта.

## Users
- `POST /api/users` — создать/обновить профиль пользователя.
- `GET /api/users/:id` — получить профиль.

## Calculations
- `POST /api/calculations` — рассчитать и сохранить BMR/калории/БЖУ.
- `GET /api/calculations/:userId/latest` — последний расчет пользователя.

## Comparison
- `GET /api/comparison/:userId` — сравнение с похожими спортсменами.

## Progress
- `POST /api/progress` — добавить точку веса.
- `GET /api/progress/:userId` — получить историю прогресса.
