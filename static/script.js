// Const variable with all text that interfaces with the user
const userText = {
  teamName: "Nome da equipe",
  actualAttendance: "Presenças atuais",
  maxAttendance: "Presenças máximas",
  addTeam: "Adicionar equipe",
  removeTeam: "Remover equipe",
  editTeam: "Editar equipe",
  saveChanges: "Salvar alterações",
  cancel: "Cancelar",
  removeTeamConfirmation: "Tem certeza que deseja remover esta equipe?",
  teamNamePlaceholder: "Nome da equipe",
  actualAttendancePlaceholder: "Presenças atuais",
  maxAttendancePlaceholder: "Presenças máximas",
  addTeamButton: "Adicionar equipe",
  removeTeamButton: "Remover equipe",
  editTeamButton: "Editar equipe",
  saveChangesButton: "Salvar alterações",
  cancelEditButton: "Cancelar",
  removeTeamConfirmationButton: "Sim, remover equipe",
  cancelRemoveTeamConfirmationButton: "Não, cancelar",
  teamNameError: "Nome da equipe é necessário",
  actualAttendanceError: "Presenças atuais são necessárias",
  maxAttendanceError: "Presenças máximas são necessárias",
  actualAttendanceExceedsMaxError: "Presenças atuais não podem exceder máximas",
  teamAlreadyExistsError: "Equipe já existe",
  teamNameAlreadyExistsError: "Nome da equipe já existe",
  noTeamsMessage:
    "Nenhuma equipe adicionada ainda. Adicione uma equipe para começar.",
  clearDataConfirmation:
    "Tem certeza que deseja limpar todos os dados? Esta ação não pode ser desfeita.",
  clearAllData: "Limpar todos os dados",
  attendancePercentage: "Participação %",
  teams: "Equipes",
  titleAttendanceTracker: "Rastreador de Participação da Equipe",
  addNewTeam: "Adicionar Nova Equipe",
  teamsList: "Lista de Equipes",
  activityLog: "Registro de Atividades",
  loadedSavedData: "Dados salvos carregados com sucesso",
  clearedAllData: "Todos os dados foram limpos",
};

// DataWrapper class to manage teams data and cookies
class DataWrapper {
  localStorageKey = "teamAttendanceData";
  editingTeamIndex = -1; // Track which team is being edited

  constructor() {
    this.teams = [];
    this.chart = null;
    this.loadFromBrowser();
    this.initializeChart();
  }

  // Add or update a team in the collection
  addTeam(name, actual, max, isEditing = false) {
    // Input validation
    if (!name) {
      this.showValidationError("teamName", userText.teamNameError);
      return false;
    }

    if (!actual && actual !== 0) {
      this.showValidationError(
        "actualAttendance",
        userText.actualAttendanceError
      );
      return false;
    }

    if (!max) {
      this.showValidationError("maxAttendance", userText.maxAttendanceError);
      return false;
    }

    if (parseFloat(actual) > parseFloat(max)) {
      this.showValidationError(
        "actualAttendance",
        userText.actualAttendanceExceedsMaxError
      );
      return false;
    }

    // Parse values properly
    actual = parseFloat(actual);
    max = parseFloat(max);

    // Check if team already exists (only for new teams, not when editing)
    if (!isEditing && this.teams.some((team) => team.name === name)) {
      this.showValidationError(
        "teamName",
        `${userText.teamNameAlreadyExistsError} "${name}"`
      );
      return false;
    }

    const percentage = (actual / max) * 100;

    if (isEditing && this.editingTeamIndex >= 0) {
      // Update existing team
      const originalName = this.teams[this.editingTeamIndex].name;
      this.teams[this.editingTeamIndex] = {
        ...this.teams[this.editingTeamIndex],
        name,
        actual,
        max,
        percentage: parseFloat(percentage.toFixed(2)),
      };
      this.logActivity(
        `${
          userText.editTeam
        } "${originalName}" → "${name}" (${percentage.toFixed(2)}%)`
      );
      this.exitEditMode();
    } else {
      // Add new team
      const randomColor = this.generateRandomColor();
      this.teams.push({
        name,
        actual,
        max,
        percentage: parseFloat(percentage.toFixed(2)),
        color: randomColor,
      });
      this.logActivity(
        `${userText.addTeam} "${name}" (${percentage.toFixed(2)}%)`
      );
    }

    this.updateChart();
    this.saveToBrowser();
    this.renderTeams();
    return true;
  }

  // Enter edit mode for a team
  editTeam(name) {
    const index = this.teams.findIndex((team) => team.name === name);
    if (index !== -1) {
      this.editingTeamIndex = index;
      const team = this.teams[index];

      // Populate the form with the team's current values
      const nameInput = document.getElementById("teamName");
      const actualInput = document.getElementById("actualAttendance");
      const maxInput = document.getElementById("maxAttendance");
      const addButton = document.getElementById("addTeamBtn");
      const cancelButton = document.getElementById("cancelEditBtn");

      nameInput.value = team.name;
      actualInput.value = team.actual;
      maxInput.value = team.max;

      // Change button text to indicate editing mode
      addButton.textContent = userText.saveChanges;
      cancelButton.classList.remove("hidden");

      // Scroll to the form
      document
        .querySelector(".form-section")
        .scrollIntoView({ behavior: "smooth" });

      return true;
    }
    return false;
  }

  // Exit edit mode
  exitEditMode() {
    this.editingTeamIndex = -1;

    // Reset form
    const nameInput = document.getElementById("teamName");
    const actualInput = document.getElementById("actualAttendance");
    const maxInput = document.getElementById("maxAttendance");
    const addButton = document.getElementById("addTeamBtn");
    const cancelButton = document.getElementById("cancelEditBtn");

    nameInput.value = "";
    actualInput.value = "";
    maxInput.value = "";

    // Reset button text
    addButton.textContent = userText.addTeamButton;
    cancelButton.classList.add("hidden");
  }

  // Show validation error for a specific input
  showValidationError(inputId, message) {
    const input = document.getElementById(inputId);
    input.classList.add("error-input");

    // Remove any existing error message
    const existingError = input.parentNode.querySelector(".error-message");
    if (existingError) {
      existingError.remove();
    }

    // Add new error message
    const errorMessage = document.createElement("div");
    errorMessage.className = "error-message";
    errorMessage.textContent = message;
    input.parentNode.appendChild(errorMessage);

    // Focus the input
    input.focus();

    // Remove error state after 3 seconds or when user types
    setTimeout(() => {
      input.classList.remove("error-input");
      if (errorMessage.parentNode) {
        errorMessage.remove();
      }
    }, 3000);

    input.addEventListener("input", function onInput() {
      input.classList.remove("error-input");
      if (errorMessage.parentNode) {
        errorMessage.remove();
      }
      input.removeEventListener("input", onInput);
    });

    this.logActivity(`Error: ${message}`);
  }

  // Remove a team by name
  removeTeam(name) {
    if (confirm(userText.removeTeamConfirmation)) {
      const index = this.teams.findIndex((team) => team.name === name);
      if (index !== -1) {
        this.teams.splice(index, 1);
        this.logActivity(`${userText.removeTeam} "${name}"`);
        this.updateChart();
        this.saveToBrowser();
        this.renderTeams();
        return true;
      }
    }
    return false;
  }

  // Clear all teams
  clearAllData() {
    this.teams = [];
    this.logActivity(userText.clearedAllData);
    this.updateChart();
    this.saveToBrowser();
    this.renderTeams();
  }

  // Initialize Chart.js chart
  initializeChart() {
    const ctx = document.getElementById("attendanceChart").getContext("2d");

    this.chart = new Chart(ctx, {
      plugins: [ChartDataLabels],
      type: "bar",
      data: {
        labels: [],
        datasets: [
          {
            label: userText.attendancePercentage,
            data: [],
            backgroundColor: [],
            borderColor: [],
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            title: {
              display: true,
              text: userText.attendancePercentage,
            },
          },
          x: {
            title: {
              display: true,
              text: userText.teams,
            },
          },
        },
        plugins: {
          tooltip: {
            callbacks: {
              afterLabel: function (context) {
                const dataIndex = context.dataIndex;
                const teams = window.dataWrapper.teams;
                if (teams && teams[dataIndex]) {
                  const team = teams[dataIndex];
                  return `${userText.actualAttendance}: ${team.actual} / ${userText.maxAttendance}: ${team.max}`;
                }
                return "";
              },
            },
          },
          datalabels: {
            formatter: function (value, context) {
              return `${
                context.chart.data.datasets[0].data[context.dataIndex]
              } %`;
            },
          },
        },
      },
    });

    this.updateChart();
  }

  // Update the chart with current data
  updateChart() {
    if (!this.chart) return;

    this.chart.data.labels = this.teams.map((team) => team.name);
    this.chart.data.datasets[0].data = this.teams.map(
      (team) => team.percentage
    );
    this.chart.data.datasets[0].backgroundColor = this.teams.map(
      (team) => team.color
    );
    this.chart.data.datasets[0].borderColor = this.teams.map((team) =>
      this.adjustColor(team.color, -20)
    );

    this.chart.update();

    // Update UI elements
    const noTeamsMessage = document.getElementById("noTeamsMessage");
    const teamsContainer = document.getElementById("teamsContainer");

    if (this.teams.length === 0) {
      noTeamsMessage.classList.remove("hidden");
      teamsContainer.classList.add("hidden");
    } else {
      noTeamsMessage.classList.add("hidden");
      teamsContainer.classList.remove("hidden");
    }
  }

  // Render team cards
  renderTeams() {
    const teamsContainer = document.getElementById("teamsContainer");
    teamsContainer.innerHTML = "";

    this.teams.forEach((team) => {
      const teamCard = document.createElement("div");
      teamCard.className =
        "bg-white rounded-lg shadow p-4 border-l-4 team-card fade-in";
      teamCard.style.borderLeftColor = team.color;

      teamCard.innerHTML = `
        <div class="flex justify-between items-start">
          <div>
            <h3 class="font-semibold text-gray-800">${team.name}</h3>
            <div class="mt-1 text-sm">
              <div class="flex items-center space-x-2">
                <div class="w-full bg-gray-200 rounded-full h-2.5">
                  <div class="bg-indigo-600 h-2.5 rounded-full progress-bar-animation" style="width: ${team.percentage}%; background-color: ${team.color}"></div>
                </div>
                <span class="font-medium">${team.percentage}%</span>
              </div>
              <p class="mt-1 text-gray-600">${userText.actualAttendance}: ${team.actual} / ${userText.maxAttendance}: ${team.max}</p>
            </div>
          </div>
          <div class="flex flex-col space-y-2">
            <button class="text-gray-400 hover:text-blue-500 edit-team-btn button-hover-animation" data-team="${team.name}" title="${userText.editTeam}">
              <span class="material-icons text-sm">edit</span>
            </button>
            <button class="text-gray-400 hover:text-red-500 delete-team-btn button-hover-animation" data-team="${team.name}" title="${userText.removeTeam}">
              <span class="material-icons text-sm">delete</span>
            </button>
          </div>
        </div>
      `;

      teamsContainer.appendChild(teamCard);

      // Add event listener to edit button
      const editBtn = teamCard.querySelector(".edit-team-btn");
      editBtn.addEventListener("click", (e) => {
        const teamName = e.currentTarget.getAttribute("data-team");
        this.editTeam(teamName);
      });

      // Add event listener to delete button
      const deleteBtn = teamCard.querySelector(".delete-team-btn");
      deleteBtn.addEventListener("click", (e) => {
        const teamName = e.currentTarget.getAttribute("data-team");
        this.removeTeam(teamName);
      });
    });
  }

  // Save data
  saveToBrowser() {
    const data = JSON.stringify(this.teams);
    localStorage.setItem(this.localStorageKey, data);
  }

  // Load data
  loadFromBrowser() {
    const value = localStorage.getItem(this.localStorageKey);
    if (!value) return;

    let data = null;

    try {
      data = JSON.parse(value);
    } catch (error) {
      console.error("Error parsing localStorage data:", error);
    }

    if (data && Array.isArray(data)) {
      this.teams = data;
      this.logActivity(userText.loadedSavedData);
    }
  }

  // Log activity to the UI
  logActivity(message) {
    console.log(message);
    const logEl = document.getElementById("activityLog");
    if (logEl) {
      const timestamp = new Date().toLocaleTimeString();
      const logItem = document.createElement("li");
      logItem.className = "fade-in";
      logItem.innerHTML = `<span class="text-gray-500">[${timestamp}]</span> ${message}`;
      logEl.prepend(logItem);

      // Limit log items to 50
      const logItems = logEl.querySelectorAll("li");
      if (logItems.length > 50) {
        for (let i = 50; i < logItems.length; i++) {
          logItems[i].remove();
        }
      }
    }
  }

  // Generate a random color
  generateRandomColor() {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 70%, 65%)`;
  }

  // Adjust color brightness
  adjustColor(color, amount) {
    // For HSL colors
    if (color.startsWith("hsl")) {
      const match = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
      if (match) {
        const h = match[1];
        const s = match[2];
        let l = parseInt(match[3]);
        l = Math.max(0, Math.min(100, l + amount));
        return `hsl(${h}, ${s}%, ${l}%)`;
      }
    }
    return color;
  }
}

// Initialize the DataWrapper
window.dataWrapper = new DataWrapper();

// Event listeners
document.addEventListener("DOMContentLoaded", () => {
  // Update UI text using userText object
  updateUIText();

  // Render existing teams
  window.dataWrapper.renderTeams();

  // Add team button
  document.getElementById("addTeamBtn").addEventListener("click", () => {
    handleTeamFormSubmit();
  });

  // Cancel edit button (add if not present)
  const formSection =
    document.querySelector(".form-section") ||
    document.querySelector(".bg-gray-50.p-4.rounded-lg.shadow.md\\:col-span-2");
  if (formSection) {
    const cancelBtn = document.getElementById("cancelEditBtn");
    if (!cancelBtn) {
      const addBtnContainer = document.getElementById("addTeamBtn").parentNode;
      const newCancelBtn = document.createElement("button");
      newCancelBtn.id = "cancelEditBtn";
      newCancelBtn.className =
        "hidden w-full md:w-auto bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200";
      newCancelBtn.textContent = userText.cancelEditButton;
      addBtnContainer.appendChild(newCancelBtn);

      newCancelBtn.addEventListener("click", () => {
        window.dataWrapper.exitEditMode();
      });
    } else {
      cancelBtn.addEventListener("click", () => {
        window.dataWrapper.exitEditMode();
      });
    }
  }

  // Enter key on inputs
  const inputs = [
    document.getElementById("teamName"),
    document.getElementById("actualAttendance"),
    document.getElementById("maxAttendance"),
  ];

  inputs.forEach((input) => {
    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        handleTeamFormSubmit();
      }
    });

    // Clear error styling on input
    input.addEventListener("input", () => {
      input.classList.remove("error-input");
      const errorMessage = input.parentNode.querySelector(".error-message");
      if (errorMessage) {
        errorMessage.remove();
      }
    });
  });

  // Clear data button
  const clearDataBtn = document.getElementById("clearDataBtn");
  if (clearDataBtn) {
    clearDataBtn.addEventListener("click", () => {
      if (confirm(userText.clearDataConfirmation)) {
        window.dataWrapper.clearAllData();
      }
    });
  }
});

// Update UI text elements
function updateUIText() {
  // Update labels and placeholders
  updateElementText("teamNameLabel", userText.teamName);
  updateElementText("actualAttendanceLabel", userText.actualAttendance);
  updateElementText("maxAttendanceLabel", userText.maxAttendance);

  // Update input placeholders
  updateElementAttribute(
    "teamName",
    "placeholder",
    userText.teamNamePlaceholder
  );
  updateElementAttribute(
    "actualAttendance",
    "placeholder",
    userText.actualAttendancePlaceholder
  );
  updateElementAttribute(
    "maxAttendance",
    "placeholder",
    userText.maxAttendancePlaceholder
  );

  // Update buttons
  updateElementText("addTeamBtn", userText.addTeamButton);
  updateElementText("clearDataBtn", userText.clearAllData);

  // Update headers and other text
  updateElementText("pageTitle", userText.titleAttendanceTracker);
  updateElementText("addNewTeamTitle", userText.addNewTeam);
  updateElementText("teamsListTitle", userText.teamsList);
  updateElementText("activityLogTitle", userText.activityLog);
  updateElementText("noTeamsMessage", userText.noTeamsMessage);
}

// Helper function to update text content
function updateElementText(id, text) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = text;
  }
}

// Helper function to update attribute
function updateElementAttribute(id, attribute, value) {
  const element = document.getElementById(id);
  if (element) {
    element.setAttribute(attribute, value);
  }
}

// Function to handle team form submission (add or edit)
function handleTeamFormSubmit() {
  const nameInput = document.getElementById("teamName");
  const actualInput = document.getElementById("actualAttendance");
  const maxInput = document.getElementById("maxAttendance");

  const name = nameInput.value.trim();
  const actual = actualInput.value;
  const max = maxInput.value;

  // Check if we're in edit mode
  const isEditing = window.dataWrapper.editingTeamIndex >= 0;

  if (window.dataWrapper.addTeam(name, actual, max, isEditing)) {
    // Clear inputs if not editing (editing mode will be exited by the addTeam method)
    if (!isEditing) {
      nameInput.value = "";
      actualInput.value = "";
      maxInput.value = "";
      nameInput.focus();
    }
  }
}
