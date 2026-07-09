// ============================================
// VACANZE - TRAVEL PLANNER APP
// ============================================

// Carica i dati dal localStorage
function loadVacations() {
    const data = localStorage.getItem('vacations');
    return data ? JSON.parse(data) : [];
}

// Salva i dati nel localStorage
function saveVacations(vacations) {
    localStorage.setItem('vacations', JSON.stringify(vacations));
}

let vacations = loadVacations();
let currentVacationIndex = null;

// ============================================
// RENDER PRINCIPALE
// ============================================

function render() {
    const app = document.getElementById('app');
    
    if (currentVacationIndex === null) {
        renderVacationsList();
    } else {
        renderVacationDetail();
    }
}

// ============================================
// LISTA VACANZE
// ============================================

function renderVacationsList() {
    const app = document.getElementById('app');
    
    app.innerHTML = `
        <div class="container">
            <h1>🏖️ Le Mie Vacanze</h1>
            
            <div class="vacations-grid">
                ${vacations.map((v, i) => `
                    <div class="vacation-card" onclick="selectVacation(${i})">
                        <h3>${v.nome}</h3>
                        <p>📍 ${v.destinazione}</p>
                        <p>📅 ${v.dataInizio} → ${v.dataFine}</p>
                        <p>💰 €${v.budget}</p>
                        <small>${v.giorni.length} giorni</small>
                    </div>
                `).join('')}
                
                <div class="vacation-card add-card" onclick="openNewVacationForm()">
                    <h3>➕ Nuova Vacanza</h3>
                </div>
            </div>
        </div>
    `;
}

// ============================================
// DETTAGLIO VACANZA
// ============================================

function renderVacationDetail() {
    const v = vacations[currentVacationIndex];
    const app = document.getElementById('app');
    
    const totalSpent = v.giorni.reduce((sum, day) => 
        sum + day.attivita.reduce((daySum, act) => daySum + (parseFloat(act.costo) || 0), 0), 0
    );
    
    const totalActivities = v.giorni.reduce((sum, day) => sum + day.attivita.length, 0);
    
    app.innerHTML = `
        <div class="container">
            <button class="back-btn" onclick="backToList()">← Torna</button>
            
            <h1>${v.nome}</h1>
            <p>📍 ${v.destinazione} | 📅 ${v.dataInizio} → ${v.dataFine}</p>
            
            <div class="stats">
                <div class="stat">
                    <strong>Budget:</strong> €${v.budget}
                </div>
                <div class="stat">
                    <strong>Speso:</strong> €${totalSpent.toFixed(2)}
                </div>
                <div class="stat">
                    <strong>Attività:</strong> ${totalActivities}
                </div>
            </div>
            
            <div class="tabs">
                <button class="tab-btn active" onclick="switchTab('itinerary')">📋 Itinerario</button>
                <button class="tab-btn" onclick="switchTab('budget')">💰 Budget</button>
                <button class="tab-btn" onclick="switchTab('settings')">⚙️ Impostazioni</button>
            </div>
            
            <div id="tab-content"></div>
        </div>
    `;
    
    switchTab('itinerary');
}

// ============================================
// TAB SWITCHING
// ============================================

function switchTab(tab) {
    const v = vacations[currentVacationIndex];
    const content = document.getElementById('tab-content');
    
    if (tab === 'itinerary') {
        content.innerHTML = renderItinerary(v);
    } else if (tab === 'budget') {
        content.innerHTML = renderBudget(v);
    } else if (tab === 'settings') {
        content.innerHTML = renderSettings(v);
    }
    
    // Aggiorna i bottoni tab
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
}

// ============================================
// TAB: ITINERARY
// ============================================

function renderItinerary(v) {
    return `
        <div class="itinerary">
            ${v.giorni.map((day, dayIdx) => `
                <div class="day-section">
                    <h3>📅 Giorno ${dayIdx + 1} - ${day.data}</h3>
                    
                    <div class="activities">
                        ${day.attivita.map((act, actIdx) => `
                            <div class="activity-item">
                                <div class="activity-header">
                                    <strong>${act.nome}</strong>
                                    <button class="delete-btn" onclick="deleteActivity(${dayIdx}, ${actIdx})">❌</button>
                                </div>
                                <p>📍 ${act.location}</p>
                                <p>${act.descrizione}</p>
                                <p>💰 €${act.costo}</p>
                                ${act.url ? `<a href="${act.url}" target="_blank">🔗 Link</a>` : ''}
                            </div>
                        `).join('')}
                    </div>
                    
                    <button class="add-activity-btn" onclick="openActivityForm(${dayIdx})">➕ Aggiungi Attività</button>
                </div>
            `).join('')}
            
            <button class="add-day-btn" onclick="addDay()">➕ Aggiungi Giorno</button>
        </div>
    `;
}

// ============================================
// TAB: BUDGET
// ============================================

function renderBudget(v) {
    const totalSpent = v.giorni.reduce((sum, day) => 
        sum + day.attivita.reduce((daySum, act) => daySum + (parseFloat(act.costo) || 0), 0), 0
    );
    const remaining = v.budget - totalSpent;
    const percentage = (totalSpent / v.budget * 100).toFixed(1);
    
    return `
        <div class="budget-section">
            <div class="budget-bar">
                <div class="progress" style="width: ${Math.min(percentage, 100)}%"></div>
            </div>
            <p>${percentage}% utilizzato</p>
            
            <div class="budget-details">
                <p>💰 Budget: €${v.budget}</p>
                <p>💸 Speso: €${totalSpent.toFixed(2)}</p>
                <p>💵 Rimasto: €${remaining.toFixed(2)}</p>
            </div>
            
            <h4>Spesa per giorno:</h4>
            <ul>
                ${v.giorni.map((day, idx) => {
                    const daySpent = day.attivita.reduce((sum, act) => sum + (parseFloat(act.costo) || 0), 0);
                    return `<li>Giorno ${idx + 1}: €${daySpent.toFixed(2)}</li>`;
                }).join('')}
            </ul>
        </div>
    `;
}

// ============================================
// TAB: SETTINGS
// ============================================

function renderSettings(v) {
    return `
        <div class="settings-section">
            <button class="edit-btn" onclick="editVacation()">✏️ Modifica Vacanza</button>
            <button class="delete-btn" onclick="deleteVacation()">🗑️ Elimina Vacanza</button>
            <button class="export-btn" onclick="exportData()">📥 Esporta Dati</button>
        </div>
    `;
}

// ============================================
// FORM: NUOVA VACANZA
// ============================================

function openNewVacationForm() {
    const nome = prompt('Nome vacanza:');
    if (!nome) return;
    
    const destinazione = prompt('Destinazione:');
    const dataInizio = prompt('Data inizio (YYYY-MM-DD):');
    const dataFine = prompt('Data fine (YYYY-MM-DD):');
    const budget = prompt('Budget (€):');
    
    vacations.push({
        nome,
        destinazione,
        dataInizio,
        dataFine,
        budget: parseFloat(budget) || 0,
        giorni: []
    });
    
    saveVacations(vacations);
    currentVacationIndex = vacations.length - 1;
    render();
}

// ============================================
// FORM: NUOVA ATTIVITÀ
// ============================================

function openActivityForm(dayIdx) {
    const nome = prompt('Nome attività:');
    if (!nome) return;
    
    const location = prompt('Luogo:');
    const descrizione = prompt('Descrizione:');
    const costo = prompt('Costo (€):');
    const url = prompt('Link (opzionale):');
    
    if (!vacations[currentVacationIndex].giorni[dayIdx]) {
        vacations[currentVacationIndex].giorni[dayIdx] = { data: '', attivita: [] };
    }
    
    vacations[currentVacationIndex].giorni[dayIdx].attivita.push({
        nome,
        location,
        descrizione,
        costo: parseFloat(costo) || 0,
        url
    });
    
    saveVacations(vacations);
    render();
}

// ============================================
// AGGIUNGI GIORNO
// ============================================

function addDay() {
    const data = prompt('Data giorno (YYYY-MM-DD):');
    if (!data) return;
    
    vacations[currentVacationIndex].giorni.push({
        data,
        attivita: []
    });
    
    saveVacations(vacations);
    render();
}

// ============================================
// ELIMINA ATTIVITÀ
// ============================================

function deleteActivity(dayIdx, actIdx) {
    if (confirm('Elimina questa attività?')) {
        vacations[currentVacationIndex].giorni[dayIdx].attivita.splice(actIdx, 1);
        saveVacations(vacations);
        render();
    }
}

// ============================================
// ELIMINA VACANZA
// ============================================

function deleteVacation() {
    if (confirm('Eliminare questa vacanza? Non si può annullare!')) {
        vacations.splice(currentVacationIndex, 1);
        saveVacations(vacations);
        currentVacationIndex = null;
        render();
    }
}

// ============================================
// MODIFICA VACANZA
// ============================================

function editVacation() {
    const v = vacations[currentVacationIndex];
    const nome = prompt('Nome:', v.nome) || v.nome;
    const destinazione = prompt('Destinazione:', v.destinazione) || v.destinazione;
    const budget = prompt('Budget (€):', v.budget) || v.budget;
    
    v.nome = nome;
    v.destinazione = destinazione;
    v.budget = parseFloat(budget);
    
    saveVacations(vacations);
    render();
}

// ============================================
// ESPORTA DATI
// ============================================

function exportData() {
    const data = JSON.stringify(vacations, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vacanze.json';
    a.click();
}

// ============================================
// NAVIGAZIONE
// ============================================

function selectVacation(index) {
    currentVacationIndex = index;
    render();
}

function backToList() {
    currentVacationIndex = null;
    render();
}

// ============================================
// INIT
// ============================================

render();

// Service Worker Registration
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js').catch(err => console.log(err));
}
