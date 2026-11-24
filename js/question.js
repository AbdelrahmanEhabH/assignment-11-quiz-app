const WARNING_FROM_SECOND = 5;
const WARNING_BEEP = { frequency: 500, duration: 0.1, volume: 0.05 };
const END_BEEP = { frequency: 196, duration: 0.6, volume: 0.3 };
const CORRECT_BEEP = { frequency: 880, duration: 0.2, volume: 0.1 };
const WRONG_BEEP = { frequency: 250, duration: 0.4, volume: 0.15 };
let audioCtx = new (window.AudioContext)();

let beep = (sound) => {
  audioCtx.resume().then(() => {
    let oscillator = audioCtx.createOscillator();
    let gain = audioCtx.createGain();

    oscillator.type = "square";
    oscillator.frequency.value = sound.frequency;
    gain.gain.value = sound.volume;
    oscillator.connect(gain);
    gain.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + sound.duration);
  });
};

export default class Question {
  constructor(quiz, container, onQuizEnd) {
    this.quiz = quiz;
    this.container = container;
    this.onQuizEnd = onQuizEnd;

    this.questionData = quiz.getCurrentQuestion();
    this.index = quiz.currentQuestionIndex;

    this.question = this.questionData.question;
    this.correctAnswer = this.questionData.correct_answer;
    this.category = this.questionData.category;
    this.wrongAnswers = this.questionData.incorrect_answers;

    this.allAnswers = this.Answers();

    this.answered = false;
    this.timerInterval = null;
    this.timeRemaining = 15;
    this.keyHandler = null;
  }

  showHtml(html) {
    let doc = new DOMParser().parseFromString(html, "text/html");
    return doc.documentElement.textContent;
  }

  Answers() {
    let answer = [...this.wrongAnswers, this.correctAnswer];

    for (let i = answer.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1));
      [answer[i], answer[j]] = [answer[j], answer[i]];
    }

    return answer;
  }

  getProgress() {
    return Math.round(((this.index + 1) / this.quiz.numberOfQuestions) * 100);
  }

  displayQuestion() {
    let total = this.quiz.numberOfQuestions;
    let difficulty = this.quiz.difficulty;

    let difficultyIcon = "fa-face-smile";
    if (difficulty === "medium") {
      difficultyIcon = "fa-face-meh";
    } else if (difficulty === "hard") {
      difficultyIcon = "fa-skull";
    }

    let answersHtml = "";
    for (let i = 0; i < this.allAnswers.length; i++) {
      answersHtml += `
        <button class="qm-answer-btn" data-index="${i}">
          <span class="qm-answer-key">${i + 1}</span>
          <span class="qm-answer-text">${this.allAnswers[i]}</span>
        </button>
      `;
    }

    this.container.innerHTML = `
      <div class="qm-card qm-question-card">
        <div class="qm-progress-wrapper">
          <div class="qm-progress-header">
            <span class="qm-progress-label"><i class="fa-solid fa-bolt"></i> Progress</span>
            <span class="qm-progress-value">Question ${this.index + 1}/${total}</span>
          </div>
          <div class="qm-progress-bar">
            <div class="qm-progress-fill" style="width: ${this.getProgress()}%"></div>
          </div>
        </div>

        <div class="qm-stats-row">
          <div class="qm-badge qm-badge-category">
            <i class="fa-solid fa-bookmark"></i>
            <span>${this.category}</span>
          </div>
          <div class="qm-badge qm-badge-difficulty qm-${difficulty}">
            <i class="fa-solid ${difficultyIcon}"></i>
            <span>${difficulty}</span>
          </div>
          <div class="qm-badge qm-badge-timer">
            <i class="fa-solid fa-stopwatch"></i>
            <span class="qm-timer-value">${this.timeRemaining}</span>s
          </div>
          <div class="qm-badge qm-badge-counter">
            <i class="fa-solid fa-gamepad"></i>
            <span>${this.index + 1}/${total}</span>
          </div>
        </div>

        <h2 class="qm-question-text">${this.question}</h2>

        <div class="qm-answers-grid">${answersHtml}</div>

        <p class="qm-keyboard-hint">
          <i class="fa-regular fa-keyboard"></i> Press 1-4 to select
        </p>

        <div class="qm-score-panel">
          <div class="qm-score-item">
            <div class="qm-score-label">Score</div>
            <div class="qm-score-value">${this.quiz.score}</div>
          </div>
        </div>
      </div>
    `;

    this.addEventListeners();
    this.startTimer();
  }

  addEventListeners() {
    let buttons = document.querySelectorAll(".qm-answer-btn");

    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        this.checkAnswer(button);
      });
    });

    let validKeys = ["1", "2", "3", "4"];
    this.keyHandler = (event) => {
      let position = validKeys.indexOf(event.key);
      if (position !== -1) {
        this.checkAnswer(buttons[position]);
      }
    };
    document.addEventListener("keydown", this.keyHandler);
  }

  removeEventListeners() {
    document.removeEventListener("keydown", this.keyHandler);
  }

  startTimer() {
    let timerValue = document.querySelector(".qm-timer-value");
    let timerBadge = document.querySelector(".qm-badge-timer");

    this.timerInterval = setInterval(() => {
      this.timeRemaining = this.timeRemaining - 1;
      timerValue.textContent = this.timeRemaining;

      if (this.timeRemaining <= 5) {
        timerBadge.classList.add("qm-warning");
      }

      if (this.timeRemaining === 0) {
        beep(END_BEEP);
        this.stopTimer();
        this.handleTimeUp();
      } else if (this.timeRemaining <= WARNING_FROM_SECOND) {
        beep(WARNING_BEEP);
      }
    }, 1000);
  }

  stopTimer() {
    clearInterval(this.timerInterval);
  }

  handleTimeUp() {
    this.answered = true;
    this.removeEventListeners();

    this.highlightCorrectAnswer();

    document.querySelector(".qm-question-card").innerHTML += `
      <div class="qm-timeup-msg">
        <i class="fa-solid fa-clock"></i> TIME'S UP!
      </div>
    `;

    this.animateQuestion(500);
  }

  checkAnswer(choiceElement) {
    if (this.answered) {
      return;
    }
    this.answered = true;
    this.stopTimer();
    this.removeEventListeners();

    let selected = this.allAnswers[choiceElement.dataset.index];

    if (selected.toLowerCase() === this.correctAnswer.toLowerCase()) {
      beep(CORRECT_BEEP);
      choiceElement.classList.add("qm-correct");
      this.quiz.incrementScore();
      document.querySelector(".qm-score-value").textContent = this.quiz.score;
    } else {
      beep(WRONG_BEEP);
      choiceElement.classList.add("qm-wrong");
      this.highlightCorrectAnswer();
    }

    document.querySelectorAll(".qm-answer-btn").forEach((button) => {
      if (
        button !== choiceElement &&
        button.classList.contains("qm-correct-reveal") === false
      ) {
        button.classList.add("qm-disabled");
      }
    });

    this.animateQuestion(500);
  }

  highlightCorrectAnswer() {
    let buttons = document.querySelectorAll(".qm-answer-btn");

    for (let i = 0; i < buttons.length; i++) {
      if (this.allAnswers[i] === this.correctAnswer) {
        buttons[i].classList.add("qm-correct-reveal");
      }
    }
  }

  getNextQuestion() {
    if (this.quiz.nextQuestion()) {
      let next = new Question(this.quiz, this.container, this.onQuizEnd);
      next.displayQuestion();
    } else {
      this.container.innerHTML = this.quiz.endQuiz();

      document.querySelector(".qm-btn-restart").addEventListener("click", () => {
        this.onQuizEnd();
      });
    }
  }

  animateQuestion(duration) {
    setTimeout(() => {
      document.querySelector(".qm-question-card").classList.add("qm-exit");

      setTimeout(() => {
        this.getNextQuestion();
      }, duration);
    }, 1500);
  }
}
