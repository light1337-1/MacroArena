# Seeds

Здесь будут тестовые данные для:
- `sports`
- `athlete_data`

Готовый seed-файл:
- `001_seed_sports_and_athletes.sql`

Пример запуска:

```bash
psql "$DATABASE_URL" -f database/schema.sql
psql "$DATABASE_URL" -f database/seeds/001_seed_sports_and_athletes.sql
```
