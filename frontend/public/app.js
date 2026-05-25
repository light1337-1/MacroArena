const form = document.querySelector("#calculatorForm");
const formNote = document.querySelector("#formNote");

const draftKey = "macroarena.calculatorDraft";

function restoreDraft() {
  const savedDraft = localStorage.getItem(draftKey);

  if (!savedDraft || !form) {
    return;
  }

  const values = JSON.parse(savedDraft);

  Object.entries(values).forEach(([name, value]) => {
    const field = form.elements[name];

    if (field) {
      field.value = value;
    }
  });
}

function collectFormValues() {
  return Object.fromEntries(new FormData(form).entries());
}

if (form) {
  restoreDraft();

  form.addEventListener("input", () => {
    localStorage.setItem(draftKey, JSON.stringify(collectFormValues()));
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    localStorage.setItem(draftKey, JSON.stringify(collectFormValues()));
    formNote.textContent = "Деректер сақталды. Нақты есептеу 27.05 кезеңінде қосылады.";
  });
}
