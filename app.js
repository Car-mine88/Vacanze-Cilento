// ============================================
// VACANZE CILENTO - Build v3.2 (Simplified)
// ============================================

const APP_VERSION = "3.2-simplified";
const BUILD_TIMESTAMP = new Date().toISOString();

// ============================================
// 1. DATA MODEL & STORAGE
// ============================================

let vacations = [];

// Carica dati da localStorage
function loadFromStorage() {
  const stored = localStorage.getItem('vacations');
  if (stored) {
    vacations = JSON.parse(stored);
  }
}

// Salva dati su localStorage
function saveToStorage() {
  localStorage.setItem('vacations', JSON.stringify(vacations));
  console.log('✅ Dati salvati');
}

// ============================================
// 2. VACATION MANAGEMENT
// ============================================

function createVacation() {
  const name = document.getElementById('vacationName').value.trim();
  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;
  const budget = parseFloat(document.getElementById('totalBudget').value) || 0;

  if (!name || !startDate || !endDate) {
    alert('❌ Compila tutti i campi!');
    return;
  }

  const newVacation = {
    id: Date.now(),
    name: name,
    startDate: startDate,
    endDate: endDate,
    totalBudget: budget,
    createdAt: new Date().toISOString(),
    giorni: [],
    notes: ''
  };

  vacations.push(newVacation);
  saveToStorage();
  
  // Pulisci form
  document.getElementById('vacationName').value = '';
  document.getElementById('startDate').value = '';
  document.getElementById('endDate').value = '';
  document.getElementById('totalBudget').value = '';

  renderVacationsList();
  showNotification('✅ Vacanza creata!');
}

function deleteVacation(vacationId) {
  if (confirm('⚠️ Elimina questa vacanza?')) {
    vacations = vacations.filter(v => v.id !== vacationId);
    saveToStorage();
    renderVacationsList();
    closeVacationDetails();
    showNotification('✅ Vacanza eliminata');
  }
}

function editVacationName(vacationId) {
  const vacation = vacations.find(v => v.id === vacationId);
  if (!vacation) return;

  const newName = prompt('Nuovo nome vacanza:', vacation.name);
  if (newName && newName.trim()) {
    vacation.name = newName.trim();
    saveToStorage();
    renderVacationsList();
    showVacationDetails(vacationId);
    showNotification('✅ Nome aggiornato');
  }
}

// ============================================
// 3. DAYS MANAGEMENT
// ============================================

function addDay(vacationId) {
  const vacation = vacations.find(v => v.id === vacationId);
  if (!vacation) return;

  const dayDate = document.getElementById('dayDate').value;
  if (!dayDate) {
    alert('❌ Seleziona una data!');
    return;
  }

  const newDay = {
    id: Date.now(),
    date: dayDate,
    attivita: [],
    note: ''
  };

  vacation.giorni.push(newDay);
  saveToStorage();
  
  document.getElementById('dayDate').value = '';
  renderDaysList(vacationId);
  showNotification('✅ Giorno aggiunto');
}

function deleteDay(vacationId, dayId) {
  const vacation = vacations.find(v => v.id === vacationId);
  if (!vacation) return;

  if (confirm('⚠️ Elimina questo giorno?')) {
    vacation.giorni = vacation.giorni.filter(d => d.id !== dayId);
    saveToStorage();
    renderDaysList(vacationId);
    showNotification('✅ Giorno eliminato');
  }
}

// ============================================
// 4. ACTIVITIES MANAGEMENT
// ============================================

function addActivity(vacationId, dayId) {
  const vacation = vacations.find(v => v.id === vacationId);
  if (!vacation) return;

  const day = vacation.giorni.find(d => d.id === dayId);
  if (!day) return;

  const title = document.getElementById(`activityTitle-${dayId}`).value.trim();
  const description = document.getElementById(`activityDescription-${dayId}`).value.trim();
  const timeSlot = document.getElementById(`activityTimeSlot-${dayId}`).value;
  const category = document.getElementById(`activityCategory-${dayId}`).value;
  const cost = parseFloat(document.getElementById(`activityCost-${dayId}`).value) || 0;

  if (!title) {
    alert('❌ Inserisci il titolo dell\'attività!');
    return;
  }

  const newActivity = {
    id: Date.now(),
    title: title,
    description: description,
    timeSlot: timeSlot, // mattina, pomeriggio, sera
    category: category,
    cost: cost,
    photos: [],
    createdAt: new Date().toISOString()
  };

  day.attivita.push(newActivity);
  saveToStorage();

  // Pulisci form
  document.getElementById(`activityTitle-${dayId}`).value = '';
  document.getElementById(`activityDescription-${dayId}`).value = '';
  document.getElementById(`activityTimeSlot-${dayId}`).value = 'mattina';
  document.getElementById(`activityCategory-${dayId}`).value = 'ristorazione';
  document.getElementById(`activityCost-${dayId}`).value = '';

  renderActivitiesList(vacationId, dayId);
  showNotification('✅ Attività aggiunta');
}

function deleteActivity(vacationId, dayId, activityId) {
  const vacation = vacations.find(v => v.id === vacationId);
  if (!vacation) return;

  const day = vacation.giorni.find(d => d.id === dayId);
  if (!day) return;

  if (confirm('⚠️ Elimina questa attività?')) {
    day.attivita = day.attivita.filter(a => a.id !== activityId);
    saveToStorage();
    renderActivitiesList(vacationId, dayId);
    showNotification('✅ Attività eliminata');
  }
}

// ============================================
// 5. PHOTO MANAGEMENT
// ============================================

function handlePhotoUpload(vacationId, dayId, activityId, fileInput) {
  const file = fileInput.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    alert('❌ Carica un\'immagine!');
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    const vacation = vacations.find(v => v.id === vacationId);
    if (!vacation) return;

    const day = vacation.giorni.find(d => d.id === dayId);
    if (!day) return;

    const activity = day.attivita.find(a => a.id === activityId);
    if (!activity) return;

    // Max 3 foto per attività
    if (activity.photos.length >= 3) {
      alert('❌ Max 3 foto per attività!');
      return;
    }

    activity.photos.push({
      id: Date.now(),
      data: e.target.result
    });

    saveToStorage();
    renderPhotos(vacationId, dayId, activityId);
    showNotification('✅ Foto caricata');
  };

  reader.readAsDataURL(file);
  fileInput.value = '';
}

function deletePhoto(vacationId, dayId, activityId, photoId) {
  const vacation = vacations.find(v => v.id === vacationId);
  if (!vacation) return;

  const day = vacation.giorni.find(d => d.id === dayId);
  if (!day) return;

  const activity = day.attivita.find(a => a.id === activityId);
  if (!activity) return;

  activity.photos = activity.photos.filter(p => p.id !== photoId);
  saveToStorage();
  renderPhotos(vacationId, dayId, activityId);
  showNotification('✅ Foto eliminata');
}

// ============================================
// 6. RENDERING FUNCTIONS
// ============================================

function renderVacationsList() {
  const container = document.getElementById('vacationsList');
  container.innerHTML = '';

  if (vacations.length === 0) {
    container.innerHTML = '<p style="text-align: center; padding: 20px;">📋 Nessuna vacanza. Creane una!</p>';
    return;
  }

  vacations.forEach(vacation => {
    const card = document.createElement('div');
    card.className = 'vacation-card';
    card.innerHTML = `
      <div class="vacation-card-header">
        <h3>${vacation.name}</h3>
        <span class="vacation-dates">${formatDate(vacation.startDate)} - ${formatDate(vacation.endDate)}</span>
      </div>
      <p class="vacation-budget">💰 Budget: €${vacation.totalBudget.toFixed(2)}</p>
      <div class="vacation-card-actions">
        <button onclick="showVacationDetails(${vacation.id})" class="btn-primary">📖 Dettagli</button>
        <button onclick="editVacationName(${vacation.id})" class="btn-secondary">✏️ Rinomina</button>
        <button onclick="deleteVacation(${vacation.id})" class="btn-danger">🗑️ Elimina</button>
      </div>
    `;
    container.appendChild(card);
  });
}

function showVacationDetails(vacationId) {
  const vacation = vacations.find(v => v.id === vacationId);
  if (!vacation) return;

  // Nascondi lista, mostra dettagli
  document.getElementById('vacationsList').style.display = 'none';
  document.getElementById('createVacationForm').style.display = 'none';
  document.getElementById('vacationDetails').style.display = 'block';

  // Salva vacationId corrente per altre operazioni
  window.currentVacationId = vacationId;

  // Render header
  document.getElementById('vacationDetailsHeader').innerHTML = `
    <h2>${vacation.name}</h2>
    <p>${formatDate(vacation.startDate)} - ${formatDate(vacation.endDate)}</p>
    <p>💰 Budget totale: €${vacation.totalBudget.toFixed(2)}</p>
  `;

  // Render tabs
  renderItinerary(vacationId);
  renderBudgetTab(vacationId);
}

function renderItinerary(vacationId) {
  const vacation = vacations.find(v => v.id === vacationId);
  if (!vacation) return;

  const container = document.getElementById('itineraryTab');
  container.innerHTML = `
    <h3>📋 Itinerario</h3>
    <div class="day-input">
      <input type="date" id="dayDate" placeholder="Data">
      <button onclick="addDay(${vacationId})" class="btn-primary">➕ Aggiungi Giorno</button>
    </div>
    <div id="daysList"></div>
  `;

  renderDaysList(vacationId);
}

function renderDaysList(vacationId) {
  const vacation = vacations.find(v => v.id === vacationId);
  if (!vacation) return;

  const container = document.getElementById('daysList');
  container.innerHTML = '';

  if (vacation.giorni.length === 0) {
    container.innerHTML = '<p>Nessun giorno ancora. Aggiungine uno!</p>';
    return;
  }

  vacation.giorni.forEach(day => {
    const dayElement = document.createElement('div');
    dayElement.className = 'day-card';
    dayElement.innerHTML = `
      <div class="day-header">
        <h4>📅 ${formatDate(day.date)}</h4>
        <button onclick="deleteDay(${vacationId}, ${day.id})" class="btn-danger btn-small">🗑️ Elimina giorno</button>
      </div>
      <div id="activities-${day.id}"></div>
      <div class="activity-form">
        <input type="text" id="activityTitle-${day.id}" placeholder="Titolo attività" class="form-input">
        <textarea id="activityDescription-${day.id}" placeholder="Descrizione" class="form-input"></textarea>
        <select id="activityTimeSlot-${day.id}" class="form-input">
          <option value="mattina">🌅 Mattina</option>
          <option value="pomeriggio">☀️ Pomeriggio</option>
          <option value="sera">🌙 Sera</option>
        </select>
        <select id="activityCategory-${day.id}" class="form-input">
          <option value="ristorazione">🍽️ Ristorazione</option>
          <option value="trasporto">🚗 Trasporto</option>
          <option value="alloggio">🏨 Alloggio</option>
          <option value="attrazione">🎢 Attrazione</option>
          <option value="shopping">🛍️ Shopping</option>
          <option value="altro">📌 Altro</option>
        </select>
        <input type="number" id="activityCost-${day.id}" placeholder="Costo (€)" class="form-input" step="0.01">
        <button onclick="addActivity(${vacationId}, ${day.id})" class="btn-primary">✅ Aggiungi Attività</button>
      </div>
    `;
    container.appendChild(dayElement);
    renderActivitiesList(vacationId, day.id);
  });
}

function renderActivitiesList(vacationId, dayId) {
  const vacation = vacations.find(v => v.id === vacationId);
  if (!vacation) return;

  const day = vacation.giorni.find(d => d.id === dayId);
  if (!day) return;

  const container = document.getElementById(`activities-${dayId}`);
  container.innerHTML = '';

  const timeSlots = ['mattina', 'pomeriggio', 'sera'];

  timeSlots.forEach(slot => {
    const activities = day.attivita.filter(a => a.timeSlot === slot);
    if (activities.length === 0) return;

    const slotIcon = {
      'mattina': '🌅',
      'pomeriggio': '☀️',
      'sera': '🌙'
    }[slot];

    const slotDiv = document.createElement('div');
    slotDiv.className = 'time-slot';
    slotDiv.innerHTML = `<h5>${slotIcon} ${slot.charAt(0).toUpperCase() + slot.slice(1)}</h5>`;

    activities.forEach(activity => {
      const categoryIcons = {
        'ristorazione': '🍽️',
        'trasporto': '🚗',
        'alloggio': '🏨',
        'attrazione': '🎢',
        'shopping': '🛍️',
        'altro': '📌'
      };

      const activityDiv = document.createElement('div');
      activityDiv.className = 'activity-item';
      activityDiv.innerHTML = `
        <div class="activity-header">
          <h6>${activity.title}</h6>
          <span class="category-badge">${categoryIcons[activity.category] || '📌'} ${activity.category}</span>
        </div>
        <p>${activity.description}</p>
        <p class="activity-cost">💰 €${activity.cost.toFixed(2)}</p>
        <div class="photos-section" id="photos-${activity.id}"></div>
        <div class="photo-upload">
          <input type="file" id="photoInput-${activity.id}" accept="image/*" onchange="handlePhotoUpload(${vacationId}, ${dayId}, ${activity.id}, this)">
          <label for="photoInput-${activity.id}" class="btn-secondary btn-small">📷 Aggiungi Foto</label>
        </div>
        <button onclick="deleteActivity(${vacationId}, ${dayId}, ${activity.id})" class="btn-danger btn-small">🗑️ Elimina</button>
      `;
      slotDiv.appendChild(activityDiv);
      renderPhotos(vacationId, dayId, activity.id);
    });

    container.appendChild(slotDiv);
  });
}

function renderPhotos(vacationId, dayId, activityId) {
  const vacation = vacations.find(v => v.id === vacationId);
  if (!vacation) return;

  const day = vacation.giorni.find(d => d.id === dayId);
  if (!day) return;

  const activity = day.attivita.find(a => a.id === activityId);
  if (!activity) return;

  const container = document.getElementById(`photos-${activityId}`);
  container.innerHTML = '';

  if (activity.photos.length === 0) return;

  const photosGrid = document.createElement('div');
  photosGrid.className = 'photos-grid';

  activity.photos.forEach(photo => {
    const photoDiv = document.createElement('div');
    photoDiv.className = 'photo-item';
    photoDiv.innerHTML = `
      <img src="${photo.data}" alt="Foto attività">
      <button onclick="deletePhoto(${vacationId}, ${dayId}, ${activityId}, ${photo.id})" class="btn-danger btn-small">🗑️</button>
    `;
    photosGrid.appendChild(photoDiv);
  });

  container.appendChild(photosGrid);
}

function renderBudgetTab(vacationId) {
  const vacation = vacations.find(v => v.id === vacationId);
  if (!vacation) return;

  const container = document.getElementById('budgetTab');
  container.innerHTML = '<h3>💰 Budget</h3>';

  // Calcola spese per categoria
  let categorySpending = {};
  let totalSpent = 0;

  vacation.giorni.forEach(day => {
    day.attivita.forEach(activity => {
      totalSpent += activity.cost;
      if (!categorySpending[activity.category]) {
        categorySpending[activity.category] = 0;
      }
      categorySpending[activity.category] += activity.cost;
    });
  });

  // Mostra riepilogo
  const summaryDiv = document.createElement('div');
  summaryDiv.className = 'budget-summary';
  summaryDiv.innerHTML = `
    <p><strong>Totale speso:</strong> €${totalSpent.toFixed(2)}</p>
    <p><strong>Budget disponibile:</strong> €${vacation.totalBudget.toFixed(2)}</p>
    <p><strong>Rimanente:</strong> €${(vacation.totalBudget - totalSpent).toFixed(2)}</p>
    <div class="progress-bar">
      <div class="progress-fill" style="width: ${Math.min((totalSpent / vacation.totalBudget) * 100, 100)}%"></div>
    </div>
  `;
  container.appendChild(summaryDiv);

  // Mostra spese per categoria
  const categoriesDiv = document.createElement('div');
  categoriesDiv.className = 'category-breakdown';
  categoriesDiv.innerHTML = '<h4>Spese per Categoria:</h4>';

  const categoryIcons = {
    'ristorazione': '🍽️',
    'trasporto': '🚗',
    'alloggio': '🏨',
    'attrazione': '🎢',
    'shopping': '🛍️',
    'altro': '📌'
  };

  Object.entries(categorySpending).forEach(([category, amount]) => {
    const percentage = vacation.totalBudget > 0 ? (amount / vacation.totalBudget) * 100 : 0;
    const categoryDiv = document.createElement('div');
    categoryDiv.className = 'category-item';
    categoryDiv.innerHTML = `
      <div class="category-label">${categoryIcons[category] || '📌'} ${category}</div>
      <div class="category-progress">
        <div class="category-progress-fill" style="width: ${Math.min(percentage, 100)}%"></div>
      </div>
      <div class="category-amount">€${amount.toFixed(2)}</div>
    `;
    categoriesDiv.appendChild(categoryDiv);
  });

  container.appendChild(categoriesDiv);
}

function closeVacationDetails() {
  document.getElementById('vacationDetails').style.display = 'none';
  document.getElementById('vacationsList').style.display = 'grid';
  document.getElementById('createVacationForm').style.display = 'block';
  window.currentVacationId = null;
}

// ============================================
// 7. DARK MODE
// ============================================

function toggleDarkMode() {
  const isDark = document.body.classList.toggle('dark-mode');
  localStorage.setItem('darkMode', isDark);
}

function initDarkMode() {
  const isDark = localStorage.getItem('darkMode') === 'true';
  if (isDark) {
    document.body.classList.add('dark-mode');
    document.getElementById('darkModeToggle').textContent = '☀️';
  }
}

// ============================================
// 8. EXPORT FUNCTIONS
// ============================================

function exportAsJSON() {
  const dataStr = JSON.stringify(vacations, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `vacanze-${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  showNotification('✅ Dati esportati');
}

function importJSON() {
  const input = document.getElementById('importFileInput');
  const file = input.files[0];
  if (!file) {
    alert('❌ Seleziona un file!');
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const imported = JSON.parse(e.target.result);
      if (Array.isArray(imported)) {
        vacations = imported;
        saveToStorage();
        renderVacationsList();
        showNotification('✅ Dati importati');
        input.value = '';
      } else {
        alert('❌ Formato file non valido!');
      }
    } catch (error) {
      alert('❌ Errore nel file: ' + error.message);
    }
  };
  reader.readAsText(file);
}

// ============================================
// 9. UTILITIES
// ============================================

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('it-IT', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric' 
  });
}

function showNotification(message) {
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add('show');
  }, 10);

  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 2000);
}

// ============================================
// 10. BUILD STATUS (per debug)
// ============================================

function getBuildStatus() {
  const usedStorage = new Blob([JSON.stringify(localStorage)]).size / 1024 / 1024;

  return {
    version: APP_VERSION,
    timestamp: BUILD_TIMESTAMP,
    features: [
      '✅ Create/Edit/Delete Vacations',
      '✅ Add Days to Itinerary',
      '✅ Add Activities with Time Slots',
      '✅ Photo Upload (up to 3 per activity)',
      '✅ Budget Tracking by Category',
      '✅ Dark Mode',
      '✅ JSON Export/Import',
      '❌ Google Maps (excluded)',
      '❌ QR Code Sharing (excluded)'
    ],
    data: {
      vacations: vacations.length,
      totalDays: vacations.reduce((sum, v) => sum + v.giorni.length, 0),
      totalActivities: vacations.reduce((sum, v) => sum + v.giorni.reduce((ds, d) => ds + d.attivita.length, 0), 0),
      totalPhotos: vacations.reduce((sum, v) => sum + v.giorni.reduce((ds, d) => ds + d.attivita.reduce((as, a) => as + a.photos.length, 0), 0), 0),
      storageUsedMB: usedStorage.toFixed(2)
    }
  };
}

// ============================================
// 11. INITIALIZATION
// ============================================

window.addEventListener('DOMContentLoaded', function() {
  loadFromStorage();
  initDarkMode();
  renderVacationsList();
  
  console.log('✅ App loaded. Run getBuildStatus() to check status.');
});
