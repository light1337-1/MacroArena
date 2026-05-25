const form = document.querySelector("#calculatorForm");
const progressForm = document.querySelector("#progressForm");
const formNote = document.querySelector("#formNote");
const clearProgressButton = document.querySelector("#clearProgress");

const draftKey = "macroarena.calculatorDraft";
const resultKey = "macroarena.latestResult";
const progressKey = "macroarena.progress";

const activityFactors = {
  low: 1.25,
  medium: 1.45,
  high: 1.65,
  very_high: 1.85,
};

const activityLabels = {
  low: "Төмен",
  medium: "Орташа",
  high: "Жоғары",
  very_high: "Өте жоғары",
};

const goalLabels = {
  maintenance: "Салмақты сақтау",
  gain: "Бұлшықет массасын жинау",
  loss: "Салмақ азайту",
};

const sportLabels = {
  football: "Футбол",
  boxing: "Бокс",
  running: "Жүгіру",
  swimming: "Жүзу",
  fitness: "Фитнес",
  basketball: "Баскетбол",
  cycling: "Велоспорт",
};

const athleteData = [
  { age: 18, gender: "male", height: 178, weight: 72, sport: "football", trainingDays: 4, activityLevel: "high", goal: "maintenance", averageCalories: 2950, protein: 145, fat: 82, carbs: 390 },
  { age: 21, gender: "male", height: 182, weight: 78, sport: "football", trainingDays: 5, activityLevel: "high", goal: "gain", averageCalories: 3350, protein: 165, fat: 95, carbs: 455 },
  { age: 19, gender: "female", height: 168, weight: 61, sport: "football", trainingDays: 3, activityLevel: "medium", goal: "loss", averageCalories: 2150, protein: 118, fat: 58, carbs: 285 },
  { age: 20, gender: "male", height: 176, weight: 70, sport: "boxing", trainingDays: 5, activityLevel: "very_high", goal: "maintenance", averageCalories: 3100, protein: 154, fat: 86, carbs: 415 },
  { age: 23, gender: "male", height: 180, weight: 76, sport: "boxing", trainingDays: 6, activityLevel: "very_high", goal: "loss", averageCalories: 2850, protein: 170, fat: 74, carbs: 355 },
  { age: 18, gender: "female", height: 164, weight: 57, sport: "boxing", trainingDays: 4, activityLevel: "high", goal: "maintenance", averageCalories: 2300, protein: 120, fat: 64, carbs: 300 },
  { age: 22, gender: "male", height: 175, weight: 68, sport: "running", trainingDays: 4, activityLevel: "medium", goal: "loss", averageCalories: 2350, protein: 135, fat: 62, carbs: 310 },
  { age: 20, gender: "female", height: 166, weight: 58, sport: "running", trainingDays: 3, activityLevel: "medium", goal: "maintenance", averageCalories: 2100, protein: 110, fat: 58, carbs: 275 },
  { age: 24, gender: "male", height: 183, weight: 80, sport: "running", trainingDays: 5, activityLevel: "high", goal: "maintenance", averageCalories: 3000, protein: 150, fat: 83, carbs: 400 },
  { age: 19, gender: "male", height: 181, weight: 74, sport: "swimming", trainingDays: 4, activityLevel: "high", goal: "maintenance", averageCalories: 2850, protein: 148, fat: 78, carbs: 375 },
  { age: 21, gender: "female", height: 170, weight: 63, sport: "swimming", trainingDays: 4, activityLevel: "high", goal: "loss", averageCalories: 2250, protein: 126, fat: 60, carbs: 285 },
  { age: 25, gender: "male", height: 185, weight: 84, sport: "swimming", trainingDays: 5, activityLevel: "very_high", goal: "gain", averageCalories: 3500, protein: 180, fat: 98, carbs: 465 },
  { age: 18, gender: "male", height: 172, weight: 66, sport: "fitness", trainingDays: 3, activityLevel: "medium", goal: "gain", averageCalories: 2800, protein: 145, fat: 78, carbs: 355 },
  { age: 22, gender: "female", height: 167, weight: 60, sport: "fitness", trainingDays: 4, activityLevel: "medium", goal: "maintenance", averageCalories: 2200, protein: 118, fat: 61, carbs: 285 },
  { age: 24, gender: "male", height: 179, weight: 82, sport: "fitness", trainingDays: 5, activityLevel: "high", goal: "loss", averageCalories: 2750, protein: 175, fat: 72, carbs: 330 },
  { age: 19, gender: "male", height: 188, weight: 83, sport: "basketball", trainingDays: 4, activityLevel: "high", goal: "maintenance", averageCalories: 3150, protein: 160, fat: 88, carbs: 420 },
  { age: 21, gender: "female", height: 174, weight: 66, sport: "basketball", trainingDays: 4, activityLevel: "high", goal: "maintenance", averageCalories: 2450, protein: 128, fat: 68, carbs: 320 },
  { age: 23, gender: "male", height: 190, weight: 88, sport: "basketball", trainingDays: 5, activityLevel: "very_high", goal: "gain", averageCalories: 3700, protein: 185, fat: 104, carbs: 490 },
  { age: 22, gender: "male", height: 177, weight: 71, sport: "cycling", trainingDays: 5, activityLevel: "high", goal: "maintenance", averageCalories: 3200, protein: 148, fat: 90, carbs: 435 },
  { age: 26, gender: "female", height: 169, weight: 62, sport: "cycling", trainingDays: 4, activityLevel: "high", goal: "loss", averageCalories: 2350, protein: 125, fat: 62, carbs: 305 },
  { age: 24, gender: "male", height: 184, weight: 79, sport: "cycling", trainingDays: 6, activityLevel: "very_high", goal: "gain", averageCalories: 3750, protein: 172, fat: 105, carbs: 505 },
];

function getJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function setText(id, value) {
  const element = document.querySelector(`#${id}`);

  if (element) {
    element.textContent = value;
  }
}

function round(value) {
  return Math.round(value);
}

function collectFormValues() {
  const values = Object.fromEntries(new FormData(form).entries());

  return {
    ...values,
    age: Number(values.age),
    weight: Number(values.weight),
    height: Number(values.height),
    trainingDays: Number(values.trainingDays),
    trainingDuration: Number(values.trainingDuration),
  };
}

function restoreDraft() {
  const values = getJson(draftKey, null);

  if (!values || !form) {
    return;
  }

  Object.entries(values).forEach(([name, value]) => {
    const field = form.elements[name];

    if (field) {
      field.value = value;
    }
  });
}

function calculateBmr(values) {
  const genderAdjustment = values.gender === "male" ? 5 : -161;
  return 10 * values.weight + 6.25 * values.height - 5 * values.age + genderAdjustment;
}

function calculateNutrition(values) {
  const bmr = calculateBmr(values);
  const factor = activityFactors[values.activityLevel] || 1.45;
  const trainingBonus = values.trainingDays * values.trainingDuration * 1.7;
  const maintenance = bmr * factor + trainingBonus / 7;
  const gain = maintenance + Math.max(250, maintenance * 0.1);
  const loss = maintenance - Math.max(300, maintenance * 0.15);
  const target = values.goal === "gain" ? gain : values.goal === "loss" ? loss : maintenance;
  const protein = values.goal === "loss" ? values.weight * 2.2 : values.weight * 2;
  const fat = values.weight * (values.goal === "gain" ? 1 : 0.85);
  const carbs = Math.max(80, (target - protein * 4 - fat * 9) / 4);

  return {
    bmr: round(bmr),
    maintenanceCalories: round(maintenance),
    gainCalories: round(gain),
    lossCalories: round(loss),
    targetCalories: round(target),
    protein: round(protein),
    fat: round(fat),
    carbs: round(carbs),
    activityFactor: factor,
  };
}

function scoreAthlete(values, athlete) {
  let score = 0;

  if (athlete.sport === values.sport) score += 5;
  if (athlete.goal === values.goal) score += 3;
  if (athlete.gender === values.gender) score += 2;
  if (athlete.activityLevel === values.activityLevel) score += 2;

  score -= Math.abs(athlete.age - values.age) / 8;
  score -= Math.abs(athlete.weight - values.weight) / 12;
  score -= Math.abs(athlete.height - values.height) / 18;
  score -= Math.abs(athlete.trainingDays - values.trainingDays) / 3;

  return score;
}

function getSimilarAthletes(values) {
  return athleteData
    .map((athlete) => ({ ...athlete, score: scoreAthlete(values, athlete) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);
}

function average(items, key) {
  if (!items.length) {
    return 0;
  }

  return items.reduce((sum, item) => sum + item[key], 0) / items.length;
}

function buildInsight(values, nutrition, difference) {
  if (values.goal === "gain") {
    return difference >= 250
      ? "Калорияңыз ұқсас спортшылардан жоғары. Масса жинау үшін жарайды, бірақ апта сайын салмақ динамикасын бақылаңыз."
      : "Масса жинау үшін калорияны тұрақты ұстап, ақуызды жеткілікті деңгейде сақтаңыз.";
  }

  if (values.goal === "loss") {
    return difference <= -250
      ? "Салмақ азайту бағыты анық. Егер күш азайса, тапшылықты тым қатты қылмай, прогресті бақылаңыз."
      : "Салмақ азайту үшін жеңіл калория тапшылығы және тұрақты жаттығу режимі маңызды.";
  }

  return Math.abs(difference) <= 180
    ? "Нәтиже ұқсас спортшылардың орташа көрсеткішіне жақын. Қазіргі жоспарды жалғастыруға болады."
    : "Нормаңыз орташа мәннен өзгеше. Бұл дене параметрлері мен жаттығу жүктемесіне байланысты болуы мүмкін.";
}

function drawMacroChart(nutrition) {
  const canvas = document.querySelector("#macroChart");

  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const values = [nutrition.protein * 4, nutrition.fat * 9, nutrition.carbs * 4];
  const colors = ["#6dff8d", "#ffd166", "#55d6ff"];
  const total = values.reduce((sum, value) => sum + value, 0);
  let start = -Math.PI / 2;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  values.forEach((value, index) => {
    const angle = (value / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(160, 120);
    ctx.arc(160, 120, 92, start, start + angle);
    ctx.closePath();
    ctx.fillStyle = colors[index];
    ctx.fill();
    start += angle;
  });

  ctx.beginPath();
  ctx.arc(160, 120, 54, 0, Math.PI * 2);
  ctx.fillStyle = "#101c18";
  ctx.fill();
  ctx.fillStyle = "#f4fff9";
  ctx.font = "700 22px Trebuchet MS";
  ctx.textAlign = "center";
  ctx.fillText(`${nutrition.targetCalories}`, 160, 116);
  ctx.fillStyle = "#a8b8b0";
  ctx.font = "14px Trebuchet MS";
  ctx.fillText("ккал", 160, 140);
}

function renderResults(payload) {
  const { values, nutrition, similarAthletes } = payload;
  const averageCalories = round(average(similarAthletes, "averageCalories"));
  const difference = nutrition.targetCalories - averageCalories;

  setText("heroCalories", nutrition.targetCalories);
  setText("heroGoal", goalLabels[values.goal]);
  setText("heroProtein", `${nutrition.protein}g`);
  setText("heroFat", `${nutrition.fat}g`);
  setText("heroCarbs", `${nutrition.carbs}g`);
  setText("bmrValue", `${nutrition.bmr} ккал`);
  setText("maintenanceValue", `${nutrition.maintenanceCalories} ккал`);
  setText("gainValue", `${nutrition.gainCalories} ккал`);
  setText("lossValue", `${nutrition.lossCalories} ккал`);
  setText("proteinValue", `${nutrition.protein} г`);
  setText("fatValue", `${nutrition.fat} г`);
  setText("carbsValue", `${nutrition.carbs} г`);
  setText("selectedGoal", goalLabels[values.goal]);
  setText("targetCalories", `${nutrition.targetCalories} ккал`);
  setText("activityFactor", `${nutrition.activityFactor}`);
  setText("goalTitle", `${sportLabels[values.sport]} / ${goalLabels[values.goal]}`);
  setText("resultSummary", `${values.name}, сіздің күндік мақсат: ${nutrition.targetCalories} ккал. БЖУ: ${nutrition.protein}г / ${nutrition.fat}г / ${nutrition.carbs}г.`);
  setText("goalInsight", buildInsight(values, nutrition, difference));

  setText("similarCount", `${similarAthletes.length}`);
  setText("averageWeight", `${round(average(similarAthletes, "weight"))} кг`);
  setText("averageHeight", `${round(average(similarAthletes, "height"))} см`);
  setText("averageCalories", `${averageCalories} ккал`);
  setText("calorieDifference", `${difference > 0 ? "+" : ""}${difference} ккал`);
  setText("comparisonSummary", `Ұқсас спортшылардың орташа калориясы ${averageCalories} ккал. Сіздің айырмашылығыңыз: ${difference > 0 ? "+" : ""}${difference} ккал.`);

  drawMacroChart(nutrition);
}

function saveCalculation(values) {
  const nutrition = calculateNutrition(values);
  const similarAthletes = getSimilarAthletes(values);
  const payload = {
    values,
    nutrition,
    similarAthletes,
    createdAt: new Date().toISOString(),
  };

  localStorage.setItem(draftKey, JSON.stringify(values));
  localStorage.setItem(resultKey, JSON.stringify(payload));
  renderResults(payload);
}

function getProgress() {
  return getJson(progressKey, []);
}

function saveProgress(items) {
  localStorage.setItem(progressKey, JSON.stringify(items));
}

function drawProgressChart(items) {
  const canvas = document.querySelector("#progressChart");

  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "rgba(244, 255, 249, 0.16)";
  ctx.lineWidth = 1;
  for (let i = 1; i <= 4; i += 1) {
    const y = 30 + i * 42;
    ctx.beginPath();
    ctx.moveTo(42, y);
    ctx.lineTo(canvas.width - 24, y);
    ctx.stroke();
  }

  if (items.length < 2) {
    ctx.fillStyle = "#a8b8b0";
    ctx.font = "18px Trebuchet MS";
    ctx.fillText("Кемінде 2 салмақ нүктесін қосыңыз", 42, 130);
    return;
  }

  const weights = items.map((item) => Number(item.weight));
  const min = Math.min(...weights) - 1;
  const max = Math.max(...weights) + 1;
  const xStep = (canvas.width - 90) / (items.length - 1);
  const points = items.map((item, index) => ({
    x: 42 + xStep * index,
    y: 220 - ((item.weight - min) / (max - min)) * 170,
  }));

  ctx.strokeStyle = "#6dff8d";
  ctx.lineWidth = 4;
  ctx.beginPath();
  points.forEach((point, index) => {
    if (index === 0) {
      ctx.moveTo(point.x, point.y);
    } else {
      ctx.lineTo(point.x, point.y);
    }
  });
  ctx.stroke();

  points.forEach((point, index) => {
    ctx.beginPath();
    ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = index === points.length - 1 ? "#55d6ff" : "#6dff8d";
    ctx.fill();
  });
}

function getProgressAdvice(items, goal) {
  if (items.length < 2) {
    return "Прогресс қорытындысы үшін кемінде екі апта салмағын енгізіңіз.";
  }

  const first = items[0].weight;
  const last = items[items.length - 1].weight;
  const change = last - first;

  if (Math.abs(change) < 0.4) {
    return "Салмақ тұрақты. Егер мақсат сақтау болса, жоспар жақсы жүріп жатыр.";
  }

  if (goal === "gain" && change > 0.4) {
    return change > 2 ? "Салмақ тез өсіп жатыр. Калорияны аздап азайтып бақылаңыз." : "Масса жинау бағыты жақсы.";
  }

  if (goal === "loss" && change < -0.4) {
    return change < -2 ? "Салмақ тез азайып жатыр. Калория тапшылығын тым қатты қылмаңыз." : "Салмақ азайту бағыты жақсы.";
  }

  return "Динамика мақсатпен толық сәйкес емес. Калория нормасын қайта тексеруге болады.";
}

function renderProgress() {
  const items = getProgress().sort((a, b) => a.date.localeCompare(b.date));
  const latest = getJson(resultKey, null);
  const list = document.querySelector("#progressList");

  setText("progressSummary", getProgressAdvice(items, latest?.values?.goal));
  drawProgressChart(items);

  if (!list) return;

  if (!items.length) {
    list.innerHTML = "<p>Әзірге салмақ жазбасы жоқ.</p>";
    return;
  }

  list.innerHTML = items
    .map((item) => `<div><span>${item.date}</span><strong>${item.weight} кг</strong><small>${item.note || "Ескерту жоқ"}</small></div>`)
    .join("");
}

function setDefaultDate() {
  const dateInput = progressForm?.elements.date;

  if (dateInput && !dateInput.value) {
    dateInput.value = new Date().toISOString().slice(0, 10);
  }
}

if (form) {
  restoreDraft();

  form.addEventListener("input", () => {
    localStorage.setItem(draftKey, JSON.stringify(collectFormValues()));
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const values = collectFormValues();
    saveCalculation(values);
    formNote.textContent = "Есептеу дайын. Нәтиже, салыстыру және БЖУ диаграммасы жаңартылды.";
    window.location.hash = "results";
  });
}

if (progressForm) {
  setDefaultDate();

  progressForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(progressForm).entries());
    const items = getProgress().filter((item) => item.date !== values.date);

    items.push({
      date: values.date,
      weight: Number(values.weight),
      note: values.note.trim(),
    });

    saveProgress(items);
    renderProgress();
    progressForm.reset();
    setDefaultDate();
  });
}

if (clearProgressButton) {
  clearProgressButton.addEventListener("click", () => {
    saveProgress([]);
    renderProgress();
  });
}

const latestResult = getJson(resultKey, null);

if (latestResult) {
  renderResults(latestResult);
} else {
  drawMacroChart({ protein: 150, fat: 80, carbs: 390, targetCalories: 2900 });
}

renderProgress();
