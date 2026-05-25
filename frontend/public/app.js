const form = document.querySelector("#calculatorForm");
const progressForm = document.querySelector("#progressForm");
const nutritionForm = document.querySelector("#nutritionForm");
const formNote = document.querySelector("#formNote");
const clearProgressButton = document.querySelector("#clearProgress");
const clearNutritionButton = document.querySelector("#clearNutrition");

const draftKey = "macroarena.calculatorDraft";
const resultKey = "macroarena.latestResult";
const progressKey = "macroarena.progress";
const foodKey = "macroarena.foodText";

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

const sportProfiles = [
  { sport: "football", durationBase: 85, intensity: 1.06 },
  { sport: "boxing", durationBase: 75, intensity: 1.12 },
  { sport: "running", durationBase: 60, intensity: 1 },
  { sport: "swimming", durationBase: 80, intensity: 1.08 },
  { sport: "fitness", durationBase: 70, intensity: 1.03 },
  { sport: "basketball", durationBase: 90, intensity: 1.09 },
  { sport: "cycling", durationBase: 100, intensity: 1.11 },
];

const bodyTemplates = {
  male: [
    { height: 170, weight: 64 },
    { height: 176, weight: 70 },
    { height: 182, weight: 78 },
    { height: 188, weight: 87 },
  ],
  female: [
    { height: 160, weight: 52 },
    { height: 166, weight: 58 },
    { height: 172, weight: 65 },
    { height: 178, weight: 72 },
  ],
};

const ageBands = [16, 19, 22, 26, 31, 37];
const bodyVariants = [
  { height: -3, weight: -5 },
  { height: 0, weight: 0 },
  { height: 3, weight: 5 },
  { height: 6, weight: 9 },
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

function formatSigned(value) {
  return `${value > 0 ? "+" : ""}${value}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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

function calculateBmi(values) {
  return values.weight / (values.height / 100) ** 2;
}

function generateAthleteDataset() {
  const profiles = [];
  let id = 1;

  sportProfiles.forEach((sportProfile, sportIndex) => {
    ["male", "female"].forEach((gender) => {
      Object.keys(goalLabels).forEach((goal) => {
        Object.keys(activityFactors).forEach((activityLevel) => {
          ageBands.forEach((ageBase, ageIndex) => {
            bodyTemplates[gender].forEach((template, templateIndex) => {
              bodyVariants.forEach((variant, variantIndex) => {
                const age = ageBase + ((sportIndex + templateIndex + variantIndex) % 3);
                const trainingDaysBase = { low: 2, medium: 3, high: 5, very_high: 6 }[activityLevel];
                const trainingDays = Math.min(7, Math.max(1, trainingDaysBase + ((sportIndex + variantIndex) % 2)));
                const trainingDuration = sportProfile.durationBase + ageIndex * 3 + variantIndex * 5;
                const height = template.height + variant.height + (sportIndex % 3) - 1;
                const goalWeightDelta = goal === "gain" ? 3 : goal === "loss" ? -2 : 0;
                const weight = template.weight + variant.weight + ageIndex * 1.4 + goalWeightDelta;
                const rawProfile = {
                  id,
                  age,
                  gender,
                  height: Number(height.toFixed(1)),
                  weight: Number(weight.toFixed(1)),
                  sport: sportProfile.sport,
                  trainingDays,
                  trainingDuration,
                  activityLevel,
                  goal,
                };
                const nutrition = calculateNutrition(rawProfile);
                const calories = round(nutrition.targetCalories * sportProfile.intensity + (variantIndex - 1.5) * 45);
                const protein = round(goal === "loss" ? rawProfile.weight * 2.25 : rawProfile.weight * 2.05);
                const fat = round(rawProfile.weight * (goal === "gain" ? 1 : 0.85));
                const carbs = round(Math.max(80, (calories - protein * 4 - fat * 9) / 4));

                profiles.push({
                  ...rawProfile,
                  averageCalories: calories,
                  protein,
                  fat,
                  carbs,
                  bmi: Number(calculateBmi(rawProfile).toFixed(1)),
                  experienceYears: Math.max(1, round((age - 14) / 2 + trainingDays / 2)),
                });

                id += 1;
              });
            });
          });
        });
      });
    });
  });

  return profiles.slice(0, 250);
}

const athleteData = generateAthleteDataset();

function scoreAthlete(values, athlete) {
  const userBmi = calculateBmi(values);
  const exactScore =
    (athlete.sport === values.sport ? 24 : 0) +
    (athlete.goal === values.goal ? 16 : 0) +
    (athlete.gender === values.gender ? 10 : 0) +
    (athlete.activityLevel === values.activityLevel ? 8 : 0);
  const numericScore =
    Math.max(0, 1 - Math.abs(athlete.age - values.age) / 18) * 10 +
    Math.max(0, 1 - Math.abs(athlete.weight - values.weight) / 28) * 10 +
    Math.max(0, 1 - Math.abs(athlete.height - values.height) / 30) * 7 +
    Math.max(0, 1 - Math.abs(athlete.trainingDays - values.trainingDays) / 6) * 6 +
    Math.max(0, 1 - Math.abs(athlete.trainingDuration - values.trainingDuration) / 100) * 5 +
    Math.max(0, 1 - Math.abs(athlete.bmi - userBmi) / 8) * 4;

  return Math.max(0, Math.min(100, round(exactScore + numericScore)));
}

function getSimilarAthletes(values) {
  return athleteData
    .map((athlete) => ({ ...athlete, score: scoreAthlete(values, athlete) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 30);
}

function average(items, key) {
  if (!items.length) {
    return 0;
  }

  return items.reduce((sum, item) => sum + item[key], 0) / items.length;
}

function median(items, key) {
  if (!items.length) {
    return 0;
  }

  const values = items.map((item) => item[key]).sort((a, b) => a - b);
  const middle = Math.floor(values.length / 2);

  return values.length % 2 ? values[middle] : (values[middle - 1] + values[middle]) / 2;
}

function percentile(items, key, value) {
  if (!items.length) {
    return 0;
  }

  const lowerOrEqual = items.filter((item) => item[key] <= value).length;
  return round((lowerOrEqual / items.length) * 100);
}

function getRange(items, key) {
  const values = items.map((item) => item[key]);

  return {
    min: Math.min(...values),
    max: Math.max(...values),
  };
}

function buildComparison(values, nutrition, similarAthletes) {
  const averageCalories = round(average(similarAthletes, "averageCalories"));
  const medianCalories = round(median(similarAthletes, "averageCalories"));
  const calorieRange = getRange(similarAthletes, "averageCalories");
  const difference = nutrition.targetCalories - averageCalories;
  const percentileValue = percentile(similarAthletes, "averageCalories", nutrition.targetCalories);
  const averageScore = round(average(similarAthletes, "score"));

  return {
    averageCalories,
    medianCalories,
    calorieRange,
    difference,
    percentileValue,
    averageScore,
    averageWeight: round(average(similarAthletes, "weight")),
    averageHeight: round(average(similarAthletes, "height")),
  };
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

const foodDatabase = [
  { name: "Жұмыртқа", aliases: ["яйцо", "яйца", "жұмыртқа", "жумыртка"], unit: "piece", calories: 70, protein: 6, fat: 5, carbs: 0.5, water: 0 },
  { name: "Су", aliases: ["вода", "воды", "су"], unit: "ml", calories: 0, protein: 0, fat: 0, carbs: 0, water: 1 },
  { name: "Тауық еті", aliases: ["курица", "курицы", "тауық", "тауык", "chicken"], unit: "100g", calories: 165, protein: 31, fat: 3.6, carbs: 0, water: 0 },
  { name: "Күріш", aliases: ["рис", "риса", "күріш", "куриш"], unit: "100g", calories: 130, protein: 2.7, fat: 0.3, carbs: 28, water: 0 },
  { name: "Қарақұмық", aliases: ["гречка", "гречки", "қарақұмық", "каракумык"], unit: "100g", calories: 110, protein: 3.6, fat: 1.2, carbs: 20, water: 0 },
  { name: "Сұлы ботқасы", aliases: ["овсянка", "овсянки", "сұлы", "сулы"], unit: "100g", calories: 68, protein: 2.4, fat: 1.4, carbs: 12, water: 0 },
  { name: "Банан", aliases: ["банан", "banana"], unit: "piece", calories: 105, protein: 1.3, fat: 0.4, carbs: 27, water: 0 },
  { name: "Алма", aliases: ["яблоко", "яблока", "алма"], unit: "piece", calories: 95, protein: 0.5, fat: 0.3, carbs: 25, water: 0 },
  { name: "Нан", aliases: ["хлеб", "нан"], unit: "100g", calories: 250, protein: 8, fat: 3, carbs: 49, water: 0 },
  { name: "Сүт", aliases: ["молоко", "молока", "сүт", "сут"], unit: "ml", calories: 0.62, protein: 0.032, fat: 0.033, carbs: 0.048, water: 0.9 },
  { name: "Айран", aliases: ["кефир", "айран"], unit: "ml", calories: 0.5, protein: 0.03, fat: 0.025, carbs: 0.04, water: 0.9 },
  { name: "Сүзбе", aliases: ["творог", "творога", "сүзбе", "сузбе"], unit: "100g", calories: 121, protein: 17, fat: 5, carbs: 3, water: 0 },
  { name: "Сиыр еті", aliases: ["говядина", "говядины", "сиыр еті", "говядина"], unit: "100g", calories: 217, protein: 26, fat: 12, carbs: 0, water: 0 },
  { name: "Балық", aliases: ["рыба", "рыбы", "балық", "балык", "fish"], unit: "100g", calories: 140, protein: 22, fat: 5, carbs: 0, water: 0 },
  { name: "Картоп", aliases: ["картошка", "картофель", "картоп"], unit: "100g", calories: 87, protein: 1.9, fat: 0.1, carbs: 20, water: 0 },
  { name: "Макарон", aliases: ["макароны", "паста", "макарон"], unit: "100g", calories: 158, protein: 5.8, fat: 0.9, carbs: 31, water: 0 },
  { name: "Ірімшік", aliases: ["сыр", "сыра", "ірімшік", "иримшик"], unit: "100g", calories: 350, protein: 25, fat: 27, carbs: 2, water: 0 },
  { name: "Жаңғақ", aliases: ["орех", "орехи", "жаңғақ", "жангак"], unit: "100g", calories: 607, protein: 20, fat: 54, carbs: 21, water: 0 },
  { name: "Протеин", aliases: ["протеин", "protein"], unit: "portion", calories: 120, protein: 24, fat: 2, carbs: 3, water: 0 },
  { name: "Салат", aliases: ["салат", "овощи", "көкөніс", "коконис"], unit: "100g", calories: 35, protein: 1.5, fat: 0.3, carbs: 7, water: 0 },
  { name: "Қияр", aliases: ["огурец", "огурцы", "қияр", "кияр"], unit: "100g", calories: 15, protein: 0.7, fat: 0.1, carbs: 3.6, water: 0 },
  { name: "Қызанақ", aliases: ["помидор", "помидоры", "қызанақ", "кызанак"], unit: "100g", calories: 18, protein: 0.9, fat: 0.2, carbs: 3.9, water: 0 },
];

function findFood(segment) {
  const normalized = segment.toLowerCase();
  return foodDatabase.find((food) => food.aliases.some((alias) => normalized.includes(alias)));
}

function getAmount(segment, food) {
  const normalized = segment.toLowerCase().replace(",", ".");
  const rangeMatch = normalized.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/);
  const numberMatch = normalized.match(/(\d+(?:\.\d+)?)/);
  let amount = rangeMatch
    ? (Number(rangeMatch[1]) + Number(rangeMatch[2])) / 2
    : numberMatch
      ? Number(numberMatch[1])
      : 1;

  if (/(кг|килограмм)/.test(normalized)) return amount * 1000;
  if (/(л|литр)/.test(normalized)) return amount * 1000;
  if (/(мл|миллилитр)/.test(normalized)) return amount;
  if (/(г|гр|грамм)/.test(normalized)) return amount;
  if (food.unit === "100g") return amount > 10 ? amount : amount * 100;
  if (food.unit === "ml") return amount > 10 ? amount : amount * 1000;
  return amount;
}

function calculateFoodItem(segment) {
  const food = findFood(segment);

  if (!food) {
    return { raw: segment.trim(), recognized: false };
  }

  const amount = getAmount(segment, food);
  const multiplier = food.unit === "100g" ? amount / 100 : amount;

  return {
    raw: segment.trim(),
    recognized: true,
    name: food.name,
    amount,
    calories: round(food.calories * multiplier),
    protein: round(food.protein * multiplier),
    fat: round(food.fat * multiplier),
    carbs: round(food.carbs * multiplier),
    water: food.unit === "ml" ? round(food.water * amount) : round(food.water * multiplier),
    unit: food.unit,
  };
}

function parseMealText(text) {
  return text
    .split(/[\n,;]+|\s+и\s+|\s+және\s+/i)
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map(calculateFoodItem);
}

function sumFood(items, key) {
  return items
    .filter((item) => item.recognized)
    .reduce((sum, item) => sum + item[key], 0);
}

function getFoodRecommendations(totals, latest) {
  if (!latest?.nutrition) {
    return ["Алдымен калькуляторда күндік норманы есептеңіз, сонда сайт қанша қалғанын нақты көрсетеді."];
  }

  const nutrition = latest.nutrition;
  const remainingCalories = nutrition.targetCalories - totals.calories;
  const remainingProtein = nutrition.protein - totals.protein;
  const remainingCarbs = nutrition.carbs - totals.carbs;
  const recommendations = [];

  if (remainingCalories > 700) {
    recommendations.push("Калория әлі көп қалды: күріш, қарақұмық, картоп немесе макарон қосуға болады.");
  } else if (remainingCalories < -150) {
    recommendations.push("Калория нормадан асып кетті: келесі тамақта жеңіл ақуыз және көкөніс таңдаңыз.");
  } else {
    recommendations.push("Калория күндік мақсатқа жақын. Қалған бөлікті жеңіл тамақпен жабуға болады.");
  }

  if (remainingProtein > 25) {
    recommendations.push("Ақуыз жетіспейді: тауық еті, балық, сүзбе, жұмыртқа немесе протеин ыңғайлы.");
  }

  if (remainingCarbs > 60 && remainingCalories > 200) {
    recommendations.push("Көмірсу аз: банан, күріш, сұлы немесе картоп жаттығудан кейін жақсы келеді.");
  }

  if (totals.water < 1500) {
    recommendations.push("Су аз: бүгін кемінде тағы 0.5-1 литр су ішуге тырысыңыз.");
  }

  return recommendations;
}

function renderNutrition(text) {
  const items = parseMealText(text);
  const latest = getJson(resultKey, null);
  const totals = {
    calories: sumFood(items, "calories"),
    protein: sumFood(items, "protein"),
    fat: sumFood(items, "fat"),
    carbs: sumFood(items, "carbs"),
    water: sumFood(items, "water"),
  };
  const targetCalories = latest?.nutrition?.targetCalories ?? 0;
  const remainingCalories = targetCalories ? targetCalories - totals.calories : 0;
  const recognized = items.filter((item) => item.recognized);
  const unknown = items.filter((item) => !item.recognized);
  const foodList = document.querySelector("#foodList");
  const foodRecommendations = document.querySelector("#foodRecommendations");

  setText("eatenCalories", `${totals.calories} ккал`);
  setText("remainingCalories", targetCalories ? `${formatSigned(remainingCalories)} ккал` : "--");
  setText("waterValue", `${totals.water} мл`);
  setText("eatenProtein", `${totals.protein} г`);
  setText("eatenFat", `${totals.fat} г`);
  setText("eatenCarbs", `${totals.carbs} г`);
  setText("foodSummary", targetCalories
    ? `Күндік мақсат ${targetCalories} ккал. Қазір желінгені ${totals.calories} ккал, қалғаны ${formatSigned(remainingCalories)} ккал.`
    : "Рацион есептелді. Күндік қалдықты көру үшін алдымен калькуляторды толтырыңыз.");

  if (foodList) {
    foodList.innerHTML = recognized.length
      ? recognized.map((item) => `
          <article>
            <span>${escapeHtml(item.raw)}</span>
            <strong>${item.name}: ${item.calories} ккал</strong>
            <p>${item.protein}г ақуыз · ${item.fat}г май · ${item.carbs}г көмірсу${item.water ? ` · ${item.water} мл су` : ""}</p>
          </article>
        `).join("")
      : "<article><strong>Танылған өнім жоқ</strong><p>Мысалы: 2 яйца, 150г курицы, 1 литр воды.</p></article>";
  }

  if (foodRecommendations) {
    const recommendations = getFoodRecommendations(totals, latest);
    foodRecommendations.innerHTML = recommendations
      .map((recommendation) => `<article><span>Ұсыныс</span><strong>${escapeHtml(recommendation)}</strong></article>`)
      .join("");
  }

  return { recognized, unknown };
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

function renderSimilarProfiles(profiles) {
  const container = document.querySelector("#similarProfiles");

  if (!container) return;

  if (!profiles.length) {
    container.innerHTML = "<p>Ұқсас профиль табылмады.</p>";
    return;
  }

  container.innerHTML = profiles
    .map((profile) => `
      <article>
        <span class="profile-score">${profile.score}/100 match</span>
        <strong>${sportLabels[profile.sport]} · ${goalLabels[profile.goal]}</strong>
        <p>${profile.age} жас, ${profile.gender === "male" ? "ер" : "әйел"}, ${profile.height} см, ${profile.weight} кг</p>
        <p>${activityLabels[profile.activityLevel]}, аптасына ${profile.trainingDays} жаттығу, ${profile.trainingDuration} мин</p>
        <p>${profile.averageCalories} ккал · ${profile.protein}г/${profile.fat}г/${profile.carbs}г</p>
      </article>
    `)
    .join("");
}

function renderResults(payload) {
  const { values, nutrition, similarAthletes } = payload;
  const comparison = buildComparison(values, nutrition, similarAthletes);

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
  setText("resultSummary", `${values.name}, сіздің күндік мақсат: ${nutrition.targetCalories} ккал. БЖУ: ${nutrition.protein}г / ${nutrition.fat}г / ${nutrition.carbs}г. Салыстыру ${athleteData.length} профильден таңдалған топ-30 бойынша жасалды.`);
  setText("goalInsight", buildInsight(values, nutrition, comparison.difference));

  setText("datasetSize", `${athleteData.length} профиль`);
  setText("similarCount", `${similarAthletes.length} профиль`);
  setText("matchQuality", `${comparison.averageScore}/100`);
  setText("calorieRange", `${comparison.calorieRange.min}-${comparison.calorieRange.max} ккал`);
  setText("averageWeight", `${comparison.averageWeight} кг`);
  setText("averageHeight", `${comparison.averageHeight} см`);
  setText("averageCalories", `${comparison.averageCalories} ккал`);
  setText("calorieDifference", `${formatSigned(comparison.difference)} ккал`);
  setText("caloriePercentile", `${comparison.percentileValue}%`);
  setText("comparisonSummary", `Датасетте ${athleteData.length} спортшы профилі бар. Топ-30 ұқсас профильдің орташа калориясы ${comparison.averageCalories} ккал, медианасы ${comparison.medianCalories} ккал, диапазоны ${comparison.calorieRange.min}-${comparison.calorieRange.max} ккал. Сіздің айырмашылығыңыз: ${formatSigned(comparison.difference)} ккал.`);
  setText("profileSummary", `Ең жақын профильдер ${sportLabels[values.sport]}, ${goalLabels[values.goal]}, ${activityLabels[values.activityLevel]} белсенділік бойынша сұрыпталды.`);

  drawMacroChart(nutrition);
  renderSimilarProfiles(similarAthletes.slice(0, 5));
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
  renderNutrition(localStorage.getItem(foodKey) || "");
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
    .map((item) => `<div><span>${escapeHtml(item.date)}</span><strong>${escapeHtml(item.weight)} кг</strong><small>${escapeHtml(item.note || "Ескерту жоқ")}</small></div>`)
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

if (nutritionForm) {
  const savedFoodText = localStorage.getItem(foodKey);
  const textArea = nutritionForm.elements.mealText;

  if (savedFoodText && textArea) {
    textArea.value = savedFoodText;
    renderNutrition(savedFoodText);
  }

  nutritionForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const text = nutritionForm.elements.mealText.value.trim();
    const result = renderNutrition(text);

    localStorage.setItem(foodKey, text);
    setText("nutritionNote", result.unknown.length
      ? `Есеп дайын. Танылмаған өнімдер: ${result.unknown.map((item) => item.raw).join(", ")}.`
      : "Рацион есептелді, қалдық және ұсыныстар жаңартылды.");
  });
}

if (clearNutritionButton) {
  clearNutritionButton.addEventListener("click", () => {
    localStorage.removeItem(foodKey);
    if (nutritionForm?.elements.mealText) {
      nutritionForm.elements.mealText.value = "";
    }
    renderNutrition("");
    setText("nutritionNote", "Рацион тазаланды.");
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

if (latestResult?.values) {
  const upgradedResult = {
    ...latestResult,
    nutrition: calculateNutrition(latestResult.values),
    similarAthletes: getSimilarAthletes(latestResult.values),
  };

  localStorage.setItem(resultKey, JSON.stringify(upgradedResult));
  renderResults(upgradedResult);
} else {
  drawMacroChart({ protein: 150, fat: 80, carbs: 390, targetCalories: 2900 });
}

renderNutrition(localStorage.getItem(foodKey) || "");
renderProgress();
