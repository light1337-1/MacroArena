# DB Schema Overview

Таблицы по ТЗ:
- `users` — профиль пользователя.
- `sports` — справочник видов спорта.
- `athlete_data` — агрегированные/эталонные данные для сравнения.
- `calculation_results` — история расчетов калорий и БЖУ.
- `progress` — динамика веса.

Связи:
- `users.sport_id -> sports.id`
- `athlete_data.sport_id -> sports.id`
- `calculation_results.user_id -> users.id`
- `progress.user_id -> users.id`

Seed-данные:
- `database/seeds/001_seed_sports_and_athletes.sql` — виды спорта и большой синтетический набор похожих спортсменов для аналитики.
