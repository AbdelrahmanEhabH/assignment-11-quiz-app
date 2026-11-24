import Quiz from "./quiz.js";
import Question from "./question.js";

let playerNameInput = document.getElementById("playerName");
let categoryInput = document.getElementById("categoryMenu");
let difficultyOptions = document.getElementById("difficultyOptions");
let questionsNumber = document.getElementById("questionsNumber");
let startQuizBtn = document.getElementById("startQuiz");
let quizOptionsForm = document.getElementById("quizOptions");
let questionsContainer = document.querySelector(".qm-questions-container");

let currentQuiz = " ";

let categoryIds = {
  "General Knowledge": "9",
  Computers: "18",
  Sports: "21",
  History: "23",
  Science: "17",
};

let showLoading = () => {
  questionsContainer.innerHTML = `
    <div class="qm-loading">
      <div class="qm-spinner"></div>
      <p class="qm-loading-text">Loading Questions...</p>
    </div>
  `;
};

let hideLoading = () => {
  let overlay = document.querySelector(".qm-loading");
  if (overlay) {
    overlay.remove();
  }
};

let showError = (message) => {
  questionsContainer.innerHTML = `
    <div class="qm-card qm-error-card">
      <div class="qm-error-icon">
        <i class="fa-solid fa-triangle-exclamation"></i>
      </div>
      <h3 class="qm-error-title">Oops! Something went wrong</h3>
      <p class="qm-error-message">${message}</p>
      <button class="qm-btn qm-btn-primary qm-retry-btn">
        <i class="fa-solid fa-rotate-right"></i> Try Again
      </button>
    </div>
  `;

  document.querySelector(".qm-retry-btn").addEventListener("click", () => {
    resetToStart();
  });
};

let validateForm = () => {
  let number = questionsNumber.value;

  if (number === "" && Number(number) < 1) {
    return { isValid: false, error: "Please enter the number of questions." };
  }
  if (Number(number) < 1) {
    return { isValid: false, error: "Minimum number of questions is 1." };
  }
  if (Number(number) > 50) {
    return { isValid: false, error: "Maximum number of questions is 50." };
  }
  return { isValid: true, error: null };
};

let showFormError = (message) => {
  let errorDiv = document.createElement("div");
  errorDiv.className = "qm-form-error";
  errorDiv.style.transition = "opacity 0.5s";
  errorDiv.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${message}`;

  startQuizBtn.before(errorDiv);

  setTimeout(() => {
    errorDiv.style.opacity = "0";
    setTimeout(() => {
      errorDiv.remove();
    }, 500);
  }, 3000);
};

let resetToStart = () => {
  questionsContainer.innerHTML = "";
  playerNameInput.value = "";
  questionsNumber.value = 10;
  quizOptionsForm.classList.remove("qm-hidden");
  currentQuiz = null;
};

let startQuiz = async () => {
  let validation = validateForm();
  if (validation.isValid === false) {
    showFormError(validation.error);
    return;
  }

  let playerName = playerNameInput.value.trim();
  if (playerName === "") {
    playerName = "new player";
  }

  let category = categoryIds[categoryInput.value] || "";
  let difficulty = difficultyOptions.value;
  let numberOfQuestions = parseInt(questionsNumber.value);

  currentQuiz = new Quiz(category, difficulty, numberOfQuestions, playerName);

  quizOptionsForm.classList.add("qm-hidden");
  showLoading();

  try {
    await currentQuiz.getQuestions();
    hideLoading();

    let firstQuestion = new Question(currentQuiz, questionsContainer, resetToStart);
    firstQuestion.displayQuestion();
  } catch (error) {
    hideLoading();
    showError(error.message);
  }
};

startQuizBtn.addEventListener("click", () => {
  startQuiz();
});

questionsNumber.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    startQuiz();
  }
});
