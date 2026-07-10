// ========== VACATION PLANNER APP ==========
// Build: v3.3-with-activity-edit
// Features: CRUD, Budget Tracking, Itinerary, JSON Export/Import, Photos, Activity Links, EDIT Activity

const MAX_PHOTOS_PER_ACTIVITY = 3;
const MAX_PHOTO_SIZE_MB = 1;

let vacations = [];

// ========== INITIALIZATION ==========
function initApp() {
  loadVacations();
  renderVacationsList();
  console.log('🎉 App initialized - Build:', getBuildStatus().version);
}

function getBuildStatus() {
  return {
    version: 'v3.3-with-activity-edit',
    features: [
      'CRUD Operations',
      'Budget Tracking by Category',
      'Itinerary Planning',
      'JSON Export/Import',
      'Photo Support (max 3 per activity, 1MB limit)',
      'Activity Links',
      'Edit Activity'
    ],
    lastUpdate: new Date().toLocaleDateString('it-IT')
  };
}

// ========== STORAGE ==========
function saveVacations() {
  try {
    const dataStr = JSON.stringify(vacations);
    const size = new Blob([dataStr]).size / 1024 / 1024;
    if (size > 5) {
      alert('⚠️ Dati troppo grandi! Elimina alcune foto.');
      return;
    }
    localStorage.setItem('vacations', dataStr);
    console.log('✅ Dati salvati');
  } catch (e) {
    console.error('❌ Errore nel salvataggio:', e);
    alert('Errore nel salvataggio dei dati');
  }
}

function loadVacations() {
  const data = localStorage.getItem('vacations');
  vacations = data ? JSON.parse(data) : [];
  console.log(`📂 Caricati ${vacations.length} viaggi`);
}

// ========== VACATION CRUD ==========
function createVacation() {
  const name = document.getElementById('vacationName').value.trim();
  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;
  const budget = parseFloat(document.getElementById('budget').value) || 0;

  if (!name || !startDate || !endDate || budget <= 0) {
    alert('Compila tutti i campi correttamente!');
    return;
  }

  if (new Date(startDate) > new Date(endDate)) {
    alert('La data di inizio deve essere prima della data di fine!');
    return;
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

  if (days > 30) {
    alert('Il viaggio non può durare più di 30 giorni!');
    return;
  }

  const vacation = {
    id: Date.now().toString(),
    name,
    startDate,
    endDate,
    budget,
    days: Array.from({ length: days }, (_, i) => ({
      dayNumber: i + 1,
      date: new Date(start.getTime() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      activities: []
    }))
  };

  vacations.push(vacation);
  saveVacations();
  resetVacationForm();
  renderVacationsList();
  alert(`✅ Viaggio "${name}" creato con ${days} giorni!`);
}

function deleteVacation(id) {
  if (confirm('Sei sicuro? Questa azione non può essere annullata!')) {
    vacations = vacations.filter(v => v.id !== id);
    saveVacations();
    renderVacationsList();
    alert('✅ Viaggio eliminato');
  }
}

function resetVacationForm() {
  document.getElementById('vacationName').value = '';
  document.getElementById('startDate').value = '';
  document.getElementById('endDate').value = '';
  document.getElementById('budget').value = '';
}

// ========== ACTIVITY CRUD ==========
function addActivityFromForm() {
  const vacationId = document.getElementById('currentVacationId').value;
  const dayIndex = parseInt(document.getElementById('currentDayIndex').value);
  const timeSlot = document.getElementById('activityTime').value;
  const category = document.getElementById('activityCategory').value;
  const cost = parseFloat(document.getElementById('activityCost').value) || 0;
  const link = document.getElementById('activityLink').value;
  const description = document.getElementById('activityDescription').value;

  if (!timeSlot || !category) {
    alert('Compila almeno Orario e Categoria!');
    return;
  }

  const vacation = vacations.find(v => v.id === vacationId);
  if (!vacation) return;

  const activity = {
    timeSlot,
    category,
    cost,
    link,
    description,
    photos: []
  };

  vacation.days[dayIndex].activities.push(activity);
  saveVacations();
  resetActivityForm();
  resetActivityFormButton();
  renderVacationDetail(vacationId);
  alert('✅ Attività aggiunta!');
}

function deleteActivity(vacationId, dayIndex, activityIndex) {
  if (confirm('Elimina questa attività?')) {
    const vacation = vacations.find(v => v.id === vacationId);
    if (vacation) {
      vacation.days[dayIndex].activities.splice(activityIndex, 1);
      saveVacations();
      renderVacationDetail(vacationId);
      alert('✅ Attività eliminata');
    }
  }
}

// ========== EDIT ACTIVITY ==========
function editActivity(vacationId, dayIndex, activityIndex) {
  const vacation = vacations.find(v => v.id === vacationId);
  if (!vacation) return;

  const activity = vacation.days[dayIndex].activities[activityIndex];
  if (!activity) return;

  // Popola il form con i dati dell'attività
  document.getElementById('activityTime').value = activity.timeSlot || '';
  document.getElementById('activityCategory').value = activity.category || '';
  document.getElementById('activityCost').value = activity.cost || '';
  document.getElementById('activityLink').value = activity.link || '';
  document.getElementById('activityDescription').value = activity.description || '';

  // Mostra il form
  document.getElementById('activityForm').style.display = 'block';

  // Cambia il bottone "Aggiungi" in "Salva Modifiche"
  const addBtn = document.getElementById('addActivityBtn');
  addBtn.textContent = '💾 Salva Modifiche';
  addBtn.style.backgroundColor = '#ff9800';
  addBtn.onclick = function() {
    saveActivityChanges(vacationId, dayIndex, activityIndex);
  };

  // Mostra il bottone "Annulla"
  document.getElementById('cancelEditBtn').style.display = 'inline-block';

  // Scroll al form
  document.getElementById('activityForm').scrollIntoView({ behavior: 'smooth' });
}

// Salva le modifiche dell'attività
function saveActivityChanges(vacationId, dayIndex, activityIndex) {
  const vacation = vacations.find(v => v.id === vacationId);
  if (!vacation) return;

  const timeSlot = document.getElementById('activityTime').value;
  const category = document.getElementById('activityCategory').value;
  const cost = parseFloat(document.getElementById('activityCost').value) || 0;
  const link = document.getElementById('activityLink').value;
  const description = document.getElementById('activityDescription').value;

  if (!timeSlot || !category) {
    alert('Compila almeno Orario e Categoria!');
    return;
  }

  // Aggiorna l'attività mantenendo le foto
  vacation.days[dayIndex].activities[activityIndex] = {
    timeSlot,
    category,
    cost,
    link,
    description,
    photos: vacation.days[dayIndex].activities[activityIndex].photos || []
  };

  saveVacations();
  resetActivityForm();
  resetActivityFormButton();
  renderVacationDetail(vacationId);

  alert('✅ Attività modificata con successo!');
}

// Annulla la modifica e torna al form normale
function cancelEditActivity() {
  resetActivityForm();
  resetActivityFormButton();
  document.getElementById('cancelEditBtn').style.display = 'none';
}

// Reset del bottone "Aggiungi"
function resetActivityFormButton() {
  const addBtn = document.getElementById('addActivityBtn');
  addBtn.textContent = '➕ Aggiungi Attività';
  addBtn.style.backgroundColor = '#4CAF50';
  addBtn.onclick = addActivityFromForm;
}

function resetActivityForm() {
  document.getElementById('activityTime').value = '';
  document.getElementById('activityCategory').value = '';
  document.getElementById('activityCost').value = '';
  document.getElementById('activityLink').value = '';
  document.getElementById('activityDescription').value = '';
  document.getElementById('photoInput').value = '';
}

// ========== PHOTO MANAGEMENT ==========
function addPhotoToActivity(vacationId, dayIndex, activityIndex) {
  const fileInput = document.getElementById('photoInput');
  const file = fileInput.files[0];

  if (!file) {
    alert('Seleziona una foto!');
    return;
  }

  if (file.size > MAX_PHOTO_SIZE_MB * 1024 * 1024) {
    alert(`⚠️ La foto non deve superare ${MAX_PHOTO_SIZE_MB}MB!`);
    return;
  }

  const vacation = vacations.find(v => v.id === vacationId);
  if (!vacation) return;

  const activity = vacation.days[dayIndex].activities[activityIndex];
  if (!activity) return;

  if (activity.photos.length >= MAX_PHOTOS_PER_ACTIVITY) {
    alert(`⚠️ Massimo ${MAX_PHOTOS_PER_ACTIVITY} foto per attività!`);
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    activity.photos.push(e.target.result);
    saveVacations();
    renderVacationDetail(vacationId);
    alert('✅ Foto aggiunta!');
  };
  reader.readAsDataURL(file);
}

function removePhoto(vacationId, dayIndex, activityIndex, photoIndex) {
  const vacation = vacations.find(v => v.id === vacationId);
  if (vacation) {
    vacation.days[dayIndex].activities[activityIndex].photos.splice(photoIndex, 1);
    saveVacations();
    renderVacationDetail(vacationId);
    alert('✅ Foto rimossa');
  }
}

// ========== BUDGET CALCULATIONS ==========
function calculateBudgetByCategory(vacationId) {
  const vacation = vacations.find(v => v.id === vacationId);
  if (!vacation) return {};

  const byCategory = {};
  vacation.days.forEach(day => {
    day.activities.forEach(activity => {
      if (!byCategory[activity.category]) {
        byCategory[activity.category] = 0;
      }
      byCategory[activity.category] += activity.cost;
    });
  });

  return byCategory;
}

function calculateTotalSpent(vacationId) {
  const vacation = vacations.find(v => v.id === vacationId);
  if (!vacation) return 0;

  return vacation.days.reduce((sum, day) => {
    return sum + day.activities.reduce((daySum, activity) => daySum + activity.cost, 0);
  }, 0);
}

// ========== RENDERING ==========
function renderVacationsList() {
  const container = document.getElementById('vacationsList');
  container.innerHTML = '';

  if (vacations.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: #999;">Nessun viaggio creato. Comincia a pianificare! ✈️</p>';
    return;
  }

  vacations.forEach(vacation => {
    const totalSpent = calculateTotalSpent(vacation.id);
    const remaining = vacation.budget - totalSpent;
    const progressPercent = (totalSpent / vacation.budget) * 100;

    const div = document.createElement('div');
    div.className = 'vacation-card';
    div.innerHTML = `
      <h3>${vacation.name}</h3>
      <p><strong>📅 Date:</strong> ${vacation.startDate} → ${vacation.endDate} (${vacation.days.length} giorni)</p>
      <p><strong>💰 Budget:</strong> €${vacation.budget}</p>
      <div class="budget-bar">
        <div class="budget-progress" style="width: ${Math.min(progressPercent, 100)}%; background-color: ${progressPercent > 100 ? '#f44336' : '#4CAF50'};"></div>
      </div>
      <p style="margin: 5px 0;"><strong>Speso:</strong> €${totalSpent.toFixed(2)} / Rimanente: €${remaining.toFixed(2)}</p>
      <div style="margin-top: 10px;">
        <button onclick="renderVacationDetail('${vacation.id}')" style="background-color: #2196F3; margin-right: 10px;">👁️ Visualizza</button>
        <button onclick="deleteVacation('${vacation.id}')" style="background-color: #f44336;">🗑️ Elimina</button>
      </div>
    `;
    container.appendChild(div);
  });
}

function renderVacationDetail(vacationId) {
  const vacation = vacations.find(v => v.id === vacationId);
  if (!vacation) return;

  const detailContainer = document.getElementById('vacationDetail');
  detailContainer.innerHTML = '';

  // Header
  const header = document.createElement('div');
  header.innerHTML = `
    <h2>${vacation.name}</h2>
    <p><strong>📅</strong> ${vacation.startDate} → ${vacation.endDate}</p>
    <button onclick="renderVacationsList()" style="background-color: #999;">← Torna alla lista</button>
  `;
  detailContainer.appendChild(header);

  // Budget Summary
  const budgetSummary = document.createElement('div');
  budgetSummary.className = 'budget-summary';
  const totalSpent = calculateTotalSpent(vacationId);
  const remaining = vacation.budget - totalSpent;
  const byCategory = calculateBudgetByCategory(vacationId);

  budgetSummary.innerHTML = `
    <h3>📊 Budget Overview</h3>
    <p><strong>Totale Budget:</strong> €${vacation.budget}</p>
    <p><strong>Speso:</strong> €${totalSpent.toFixed(2)}</p>
    <p><strong>Rimanente:</strong> €${remaining.toFixed(2)}</p>
    <div class="budget-bar">
      <div class="budget-progress" style="width: ${Math.min((totalSpent / vacation.budget) * 100, 100)}%; background-color: ${totalSpent > vacation.budget ? '#f44336' : '#4CAF50'};"></div>
    </div>
  `;

  if (Object.keys(byCategory).length > 0) {
    budgetSummary.innerHTML += '<h4>Per Categoria:</h4>';
    Object.entries(byCategory).forEach(([category, amount]) => {
      budgetSummary.innerHTML += `<p>${category}: €${amount.toFixed(2)}</p>`;
    });
  }

  detailContainer.appendChild(budgetSummary);

  // Activity Form
  const formSection = document.createElement('div');
  formSection.id = 'activityForm';
  formSection.className = 'form-section';
  formSection.innerHTML = `
    <h3>➕ Aggiungi/Modifica Attività</h3>
    <input type="hidden" id="currentVacationId" value="${vacation.id}">
    <input type="hidden" id="currentDayIndex" value="0">
    
    <label>Giorno:</label>
    <select id="daySelect" onchange="updateActivityForm()">
      ${vacation.days.map((day, idx) => `<option value="${idx}">Giorno ${day.dayNumber} - ${day.date}</option>`).join('')}
    </select>

    <label>Orario:</label>
    <input type="time" id="activityTime" placeholder="es. 10:30">

    <label>Categoria:</label>
    <select id="activityCategory">
      <option value="">-- Seleziona --</option>
      <option value="Trasporto">🚗 Trasporto</option>
      <option value="Alloggio">🏨 Alloggio</option>
      <option value="Cibo">🍽️ Cibo</option>
      <option value="Attrazione">🎪 Attrazione</option>
      <option value="Shopping">🛍️ Shopping</option>
      <option value="Altro">📌 Altro</option>
    </select>

    <label>Costo (€):</label>
    <input type="number" id="activityCost" placeholder="0.00" step="0.01">

    <label>Link Esterno (URL):</label>
    <input type="url" id="activityLink" placeholder="https://esempio.com">

    <label>Descrizione:</label>
    <textarea id="activityDescription" placeholder="Note aggiuntive..."></textarea>

    <button id="addActivityBtn" onclick="addActivityFromForm" style="background-color: #4CAF50;">➕ Aggiungi Attività</button>
    <button id="cancelEditBtn" onclick="cancelEditActivity()" style="background-color: #999; margin-left: 10px; display: none;">❌ Annulla Modifica</button>
  `;
  detailContainer.appendChild(formSection);

  // Activities by Day
  vacation.days.forEach((day, dayIndex) => {
    const daySection = document.createElement('div');
    daySection.className = 'day-section';
    daySection.innerHTML = `<h3>📅 Giorno ${day.dayNumber} - ${day.date}</h3>`;

    if (day.activities.length === 0) {
      daySection.innerHTML += '<p style="color: #999;">Nessuna attività pianificata</p>';
    } else {
      day.activities.forEach((activity, activityIndex) => {
        const activityDiv = document.createElement('div');
        activityDiv.className = 'activity-card';
        activityDiv.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: start;">
            <div style="flex: 1;">
              <h4>⏰ ${activity.timeSlot}</h4>
              <p><strong>Categoria:</strong> ${activity.category}</p>
              <p><strong>Costo:</strong> €${activity.cost.toFixed(2)}</p>
              ${activity.description ? `<p><strong>Note:</strong> ${activity.description}</p>` : ''}
              ${activity.link ? `<p><strong>Link:</strong> <a href="${activity.link}" target="_blank" rel="noopener noreferrer">🔗 Vai al sito</a></p>` : ''}
            </div>
          </div>

          <div style="margin-top: 10px;">
            <button onclick="editActivity('${vacation.id}', ${dayIndex}, ${activityIndex})" 
              style="background-color: #ff9800; margin-right: 10px;">
              ✏️ Modifica
            </button>
            <button onclick="deleteActivity('${vacation.id}', ${dayIndex}, ${activityIndex})">
              🗑️ Elimina
            </button>
          </div>
        `;

        // Photos section
        if (activity.photos && activity.photos.length > 0) {
          const photosDiv = document.createElement('div');
          photosDiv.innerHTML = '<p style="margin-top: 10px; font-weight: bold;">📸 Foto:</p>';
          activity.photos.forEach((photo, photoIndex) => {
            const photoElement = document.createElement('div');
            photoElement.style.display = 'inline-block';
            photoElement.style.position = 'relative';
            photoElement.style.margin = '5px';
            photoElement.innerHTML = `
              <img src="${photo}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 5px;">
              <button onclick="removePhoto('${vacation.id}', ${dayIndex}, ${activityIndex}, ${photoIndex})" 
                style="position: absolute; top: 0; right: 0; background-color: #f44336; border: none; color: white; padding: 2px 5px; border-radius: 3px;">
                ✕
              </button>
            `;
            photosDiv.appendChild(photoElement);
          });
          activityDiv.appendChild(photosDiv);
        }

        // Photo upload
        const photoUploadDiv = document.createElement('div');
        photoUploadDiv.style.marginTop = '10px';
        photoUploadDiv.innerHTML = `
          <input type="file" id="photoInput" accept="image/*" style="margin-right: 10px;">
          <button onclick="addPhotoToActivity('${vacation.id}', ${dayIndex}, ${activityIndex})" style="background-color: #2196F3;">
            📸 Aggiungi Foto
          </button>
        `;
        activityDiv.appendChild(photoUploadDiv);

        daySection.appendChild(activityDiv);
      });
    }

    detailContainer.appendChild(daySection);
  });

  // Export/Import section
  const exportSection = document.createElement('div');
  exportSection.className = 'form-section';
  exportSection.innerHTML = `
    <h3>📥 Esporta / Importa</h3>
    <button onclick="exportVacationJSON('${vacation.id}')" style="background-color: #2196F3; margin-right: 10px;">📥 Esporta JSON</button>
    <button onclick="importVacationJSON()" style="background-color: #FF9800;">📤 Importa JSON</button>
    <input type="file" id="importFileInput" accept=".json" style="display: none;">
  `;
  detailContainer.appendChild(exportSection);
}

function updateActivityForm() {
  const dayIndex = document.getElementById('daySelect').value;
  document.getElementById('currentDayIndex').value = dayIndex;
}

// ========== EXPORT / IMPORT ==========
function exportVacationJSON(vacationId) {
  const vacation = vacations.find(v => v.id === vacationId);
  if (!vacation) return;

  const dataStr = JSON.stringify(vacation, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${vacation.name}-${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  alert('✅ File esportato!');
}

function importVacationJSON() {
  const fileInput = document.getElementById('importFileInput');
  fileInput.click();
  fileInput.onchange = function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
      try {
        const importedVacation = JSON.parse(event.target.result);
        importedVacation.id = Date.now().toString();
        vacations.push(importedVacation);
        saveVacations();
        renderVacationsList();
        alert(`✅ Viaggio "${importedVacation.name}" importato!`);
      } catch (e) {
        alert('❌ Errore nel file JSON!');
      }
    };
    reader.readAsText(file);
  };
}

// ========== INITIALIZATION ON PAGE LOAD ==========
document.addEventListener('DOMContentLoaded', initApp);
