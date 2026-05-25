-- MacroArena: initial seed data for 25.05 stage

TRUNCATE TABLE athlete_data RESTART IDENTITY;

INSERT INTO sports (id, sport_name, average_training_intensity, description) VALUES
  (1, 'Футбол', 'high', 'Командный спорт с интервальной нагрузкой и высокой выносливостью.'),
  (2, 'Бокс', 'very_high', 'Единоборство с высокой интенсивностью, силовой и кардио-нагрузкой.'),
  (3, 'Жүгіру', 'medium', 'Беговые тренировки для выносливости и контроля веса.'),
  (4, 'Жүзу', 'high', 'Плавание с равномерной нагрузкой на все тело.'),
  (5, 'Фитнес', 'medium', 'Силовые и функциональные тренировки в зале.'),
  (6, 'Баскетбол', 'high', 'Игровой спорт с ускорениями, прыжками и интервальной нагрузкой.'),
  (7, 'Велоспорт', 'high', 'Циклический спорт с длительной аэробной нагрузкой.')
ON CONFLICT (id) DO UPDATE SET
  sport_name = EXCLUDED.sport_name,
  average_training_intensity = EXCLUDED.average_training_intensity,
  description = EXCLUDED.description;

SELECT setval('sports_id_seq', (SELECT MAX(id) FROM sports));

INSERT INTO athlete_data (
  age,
  gender,
  height,
  weight,
  sport_id,
  training_days_per_week,
  training_duration,
  activity_level,
  goal,
  average_calories,
  protein,
  fat,
  carbs
) VALUES
  (18, 'male', 178, 72, 1, 4, 90, 'high', 'maintenance', 2950, 145, 82, 390),
  (21, 'male', 182, 78, 1, 5, 100, 'high', 'gain', 3350, 165, 95, 455),
  (19, 'female', 168, 61, 1, 3, 75, 'medium', 'loss', 2150, 118, 58, 285),
  (20, 'male', 176, 70, 2, 5, 80, 'very_high', 'maintenance', 3100, 154, 86, 415),
  (23, 'male', 180, 76, 2, 6, 90, 'very_high', 'loss', 2850, 170, 74, 355),
  (18, 'female', 164, 57, 2, 4, 70, 'high', 'maintenance', 2300, 120, 64, 300),
  (22, 'male', 175, 68, 3, 4, 60, 'medium', 'loss', 2350, 135, 62, 310),
  (20, 'female', 166, 58, 3, 3, 55, 'medium', 'maintenance', 2100, 110, 58, 275),
  (24, 'male', 183, 80, 3, 5, 75, 'high', 'maintenance', 3000, 150, 83, 400),
  (19, 'male', 181, 74, 4, 4, 80, 'high', 'maintenance', 2850, 148, 78, 375),
  (21, 'female', 170, 63, 4, 4, 70, 'high', 'loss', 2250, 126, 60, 285),
  (25, 'male', 185, 84, 4, 5, 90, 'very_high', 'gain', 3500, 180, 98, 465),
  (18, 'male', 172, 66, 5, 3, 60, 'medium', 'gain', 2800, 145, 78, 355),
  (22, 'female', 167, 60, 5, 4, 65, 'medium', 'maintenance', 2200, 118, 61, 285),
  (24, 'male', 179, 82, 5, 5, 75, 'high', 'loss', 2750, 175, 72, 330),
  (19, 'male', 188, 83, 6, 4, 90, 'high', 'maintenance', 3150, 160, 88, 420),
  (21, 'female', 174, 66, 6, 4, 85, 'high', 'maintenance', 2450, 128, 68, 320),
  (23, 'male', 190, 88, 6, 5, 95, 'very_high', 'gain', 3700, 185, 104, 490),
  (22, 'male', 177, 71, 7, 5, 100, 'high', 'maintenance', 3200, 148, 90, 435),
  (26, 'female', 169, 62, 7, 4, 85, 'high', 'loss', 2350, 125, 62, 305),
  (24, 'male', 184, 79, 7, 6, 120, 'very_high', 'gain', 3750, 172, 105, 505);
