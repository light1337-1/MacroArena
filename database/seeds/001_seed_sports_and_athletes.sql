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

WITH sport_profiles (sport_id, duration_base, intensity) AS (
  VALUES
    (1, 85, 1.06),
    (2, 75, 1.12),
    (3, 60, 1.00),
    (4, 80, 1.08),
    (5, 70, 1.03),
    (6, 90, 1.09),
    (7, 100, 1.11)
),
gender_profiles (gender, height_base, weight_base, gender_adjustment) AS (
  VALUES
    ('male', 170, 64, 5),
    ('female', 160, 52, -161)
),
goals (goal, goal_weight_delta, protein_factor, fat_factor) AS (
  VALUES
    ('maintenance', 0, 2.05, 0.85),
    ('gain', 3, 2.05, 1.00),
    ('loss', -2, 2.25, 0.85)
),
activities (activity_level, activity_factor, days_base) AS (
  VALUES
    ('low', 1.25, 2),
    ('medium', 1.45, 3),
    ('high', 1.65, 5),
    ('very_high', 1.85, 6)
),
age_bands (age_base, age_index) AS (
  VALUES
    (16, 0),
    (19, 1),
    (22, 2),
    (26, 3),
    (31, 4),
    (37, 5)
),
body_templates (template_index, height_delta, weight_delta) AS (
  VALUES
    (0, 0, 0),
    (1, 6, 6),
    (2, 12, 14),
    (3, 18, 23)
),
body_variants (variant_index, height_delta, weight_delta) AS (
  VALUES
    (0, -3, -5),
    (1, 0, 0),
    (2, 3, 5),
    (3, 6, 9)
),
profiles AS (
  SELECT
    age_bands.age_base + ((sport_profiles.sport_id + body_templates.template_index + body_variants.variant_index) % 3) AS age,
    gender_profiles.gender,
    gender_profiles.height_base + body_templates.height_delta + body_variants.height_delta + (sport_profiles.sport_id % 3) - 1 AS height,
    gender_profiles.weight_base + body_templates.weight_delta + body_variants.weight_delta + age_bands.age_index * 1.4 + goals.goal_weight_delta AS weight,
    sport_profiles.sport_id,
    LEAST(7, GREATEST(1, activities.days_base + ((sport_profiles.sport_id + body_variants.variant_index) % 2))) AS training_days_per_week,
    sport_profiles.duration_base + age_bands.age_index * 3 + body_variants.variant_index * 5 AS training_duration,
    activities.activity_level,
    activities.activity_factor,
    goals.goal,
    goals.protein_factor,
    goals.fat_factor,
    sport_profiles.intensity,
    body_variants.variant_index,
    gender_profiles.gender_adjustment
  FROM sport_profiles
  CROSS JOIN gender_profiles
  CROSS JOIN goals
  CROSS JOIN activities
  CROSS JOIN age_bands
  CROSS JOIN body_templates
  CROSS JOIN body_variants
),
calculated AS (
  SELECT
    *,
    10 * weight + 6.25 * height - 5 * age + gender_adjustment AS bmr
  FROM profiles
),
targets AS (
  SELECT
    *,
    CASE goal
      WHEN 'gain' THEN (bmr * activity_factor + (training_days_per_week * training_duration * 1.7) / 7) * 1.10
      WHEN 'loss' THEN (bmr * activity_factor + (training_days_per_week * training_duration * 1.7) / 7) * 0.85
      ELSE bmr * activity_factor + (training_days_per_week * training_duration * 1.7) / 7
    END AS target_calories
  FROM calculated
),
macros AS (
  SELECT
    *,
    ROUND(target_calories * intensity + (variant_index - 1.5) * 45) AS average_calories,
    ROUND(weight * protein_factor) AS protein,
    ROUND(weight * fat_factor) AS fat
  FROM targets
)
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
)
SELECT
  age,
  gender,
  ROUND(height::numeric, 1),
  ROUND(weight::numeric, 1),
  sport_id,
  training_days_per_week,
  training_duration,
  activity_level,
  goal,
  average_calories,
  protein,
  fat,
  ROUND(GREATEST(80, (average_calories - protein * 4 - fat * 9) / 4)) AS carbs
FROM macros;
