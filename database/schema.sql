-- MacroArena: initial schema (architecture-level)

CREATE TABLE IF NOT EXISTS sports (
  id SERIAL PRIMARY KEY,
  sport_name VARCHAR(100) NOT NULL,
  average_training_intensity VARCHAR(50),
  description TEXT
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  age INTEGER NOT NULL CHECK (age > 0),
  gender VARCHAR(20) NOT NULL,
  height NUMERIC(5,2) NOT NULL CHECK (height > 0),
  weight NUMERIC(5,2) NOT NULL CHECK (weight > 0),
  sport_id INTEGER REFERENCES sports(id),
  goal VARCHAR(50) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS athlete_data (
  id SERIAL PRIMARY KEY,
  age INTEGER NOT NULL,
  gender VARCHAR(20) NOT NULL,
  height NUMERIC(5,2) NOT NULL,
  weight NUMERIC(5,2) NOT NULL,
  sport_id INTEGER REFERENCES sports(id),
  training_days_per_week INTEGER NOT NULL,
  training_duration INTEGER NOT NULL,
  activity_level VARCHAR(50) NOT NULL,
  goal VARCHAR(50) NOT NULL,
  average_calories INTEGER NOT NULL,
  protein NUMERIC(6,2) NOT NULL,
  fat NUMERIC(6,2) NOT NULL,
  carbs NUMERIC(6,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS calculation_results (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bmr NUMERIC(8,2) NOT NULL,
  maintenance_calories INTEGER NOT NULL,
  gain_calories INTEGER NOT NULL,
  loss_calories INTEGER NOT NULL,
  protein NUMERIC(6,2) NOT NULL,
  fat NUMERIC(6,2) NOT NULL,
  carbs NUMERIC(6,2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS progress (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  weight NUMERIC(5,2) NOT NULL,
  date DATE NOT NULL,
  note TEXT
);

CREATE INDEX IF NOT EXISTS idx_users_sport_id ON users(sport_id);
CREATE INDEX IF NOT EXISTS idx_athlete_data_sport_goal ON athlete_data(sport_id, goal);
CREATE INDEX IF NOT EXISTS idx_calculation_results_user_created ON calculation_results(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_progress_user_date ON progress(user_id, date);
