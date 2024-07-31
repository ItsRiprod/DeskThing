let currentTime = 0;
let targetTime = 0;
let timerInterval;
let isPaused = true;

function startTimer(durationInMinutes) {
  currentTime = 0;
  targetTime = currentTime + (durationInMinutes * 60);
  timerInterval = setInterval(updateDisplay, 1000);
  isPaused = false;
  document.getElementById("pause-resume-btn").textContent = "Pause";
}

function pauseTimer() {
  clearInterval(timerInterval);
  isPaused = true;
  document.getElementById("pause-resume-btn").textContent = "Resume";
}

function resumeTimer() {
  timerInterval = setInterval(updateDisplay, 1000);
  isPaused = false;
  document.getElementById("pause-resume-btn").textContent = "Pause";
}

function resetTimer() {
  currentTime = 0;
  targetTime = 0;
  clearInterval(timerInterval);
  isPaused = true;
  document.getElementById("timer-display").textContent = "00:00"; // Reset the display
  document.getElementById("pause-resume-btn").textContent = "Pause";
}

function updateDisplay() {
  if (!isPaused) {
    const remainingSeconds = Math.max(0, targetTime - currentTime);
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    document.getElementById("timer-display").textContent = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    currentTime++;
    if (currentTime >= targetTime) {
      pauseTimer();
    }
  }
}

// Button Event Listeners
document.getElementById("start-btn").addEventListener("click", () => {
  // Prompt user for duration in minutes
  const duration = prompt("Enter duration in minutes:");
  if (duration) {
    startTimer(parseInt(duration));
  }
});

document.getElementById("pause-resume-btn").addEventListener("click", () => {
  if (isPaused) {
    resumeTimer();
  } else {
    pauseTimer();
  }
});

document.getElementById("reset-btn").addEventListener("click", resetTimer);
