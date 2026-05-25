# Seeds

Здесь будут тестовые данные для:
- `sports`
- `athlete_data`

Готовый seed-файл:
- `001_seed_sports_and_athletes.sql`

Файл генерирует `250` строк `athlete_data` через SQL-комбинации спорта, пола, цели, активности, возраста и телосложения.

Пример запуска:

```bash
psql "$DATABASE_URL" -f database/schema.sql
psql "$DATABASE_URL" -f database/seeds/001_seed_sports_and_athletes.sql
```
