export default class Quiz {
  constructor(category, difficulty, numberOfQuestions, playerName) {
    this.category = category;
    this.difficulty = difficulty;
    this.numberOfQuestions = numberOfQuestions;
    this.playerName = playerName;
    this.score = 0;
    this.questions = [];
    this.currentQuestionIndex = 0;
  }

  async getQuestions() {
    let response = await fetch(`https://opentdb.com/api.php?amount=${this.numberOfQuestions}&category=${this.category}&difficulty=${this.difficulty}&type=multiple`);

    if (response.status !== 200) {
      throw new Error("Failed to load questions. Please try again.");
    }

    let data = await response.json();

    if (data.response_code !== 0) {
      throw new Error("Not enough questions for these options. Try fewer questions or another category.");
    }

    this.questions = data.results;
    return this.questions;
  }

  incrementScore() {
    this.score = this.score + 1;
  }

  getCurrentQuestion() {
    if (this.currentQuestionIndex >= this.questions.length) {
      return null;
    }
    return this.questions[this.currentQuestionIndex];
  }

  nextQuestion() {
    this.currentQuestionIndex = this.currentQuestionIndex + 1;
    return this.currentQuestionIndex < this.questions.length;
  }

  isComplete() {
    return this.currentQuestionIndex >= this.questions.length;
  }

  getScorePercentage() {
    return Math.round((this.score / this.numberOfQuestions) * 100);
  }

  getHighScores() {
    try {
      let saved = localStorage.getItem("quizHighScores");
      if (saved) {
        return JSON.parse(saved);
      }
      return [];
    } catch (error) {
      return [];
    }
  }

  saveHighScore() {
    let scores = this.getHighScores();

    scores.push({
      name: this.playerName,
      score: this.score,
      total: this.numberOfQuestions,
      percentage: this.getScorePercentage(),
      difficulty: this.difficulty,
      date: new Date().toLocaleDateString(),
    });

    scores.sort((a, b) => b.percentage - a.percentage);

    scores = scores.slice(0, 10);

    localStorage.setItem("quizHighScores", JSON.stringify(scores));
  }

  isHighScore() {
    let scores = this.getHighScores();
    if (scores.length < 10) {
      return true;
    }
    return this.getScorePercentage() > scores[scores.length - 1].percentage;
  }

  endQuiz() {
    let percentage = this.getScorePercentage();
    let isNewHigh = this.isHighScore();

    if (isNewHigh) {
      this.saveHighScore();
    }

    let scores = this.getHighScores();
    let medals = ["qm-gold", "qm-silver", "qm-bronze"];

    let cartona = "";
    for (let i = 0; i < scores.length; i++) {
      let medal = "";
      if (i < 3) {
        medal = medals[i];
      }
      let name = scores[i].name.replace(/</g, "&lt;");

      cartona += `
        <li class="qm-leaderboard-item ${medal}">
          <span class="qm-leaderboard-rank">#${i + 1}</span>
          <span class="qm-leaderboard-name">${name}</span>
          <span class="qm-leaderboard-score">${scores[i].percentage}%</span>
        </li>
      `;
    }

    let badge = "";
    if (isNewHigh) {
      badge = `
        <div class="qm-record-badge">
          <i class="fa-solid fa-star"></i> New High Score!
        </div>
      `;
    }

    return `
      <div class="qm-card qm-results-card">
        <h2 class="qm-results-title">Quiz Complete!</h2>
        <p class="qm-results-score">${this.score}/${this.numberOfQuestions}</p>
        <p class="qm-results-percentage">${percentage}% Accuracy</p>
        ${badge}
        <div class="qm-leaderboard">
          <h4 class="qm-leaderboard-title">
            <i class="fa-solid fa-trophy"></i> Leaderboard
          </h4>
          <ul class="qm-leaderboard-list">${cartona}</ul>
        </div>
        <div class="qm-actions">
          <button class="qm-btn qm-btn-restart">
            <i class="fa-solid fa-rotate-right"></i> Play Again
          </button>
        </div>
      </div>
    `;
  }
}
