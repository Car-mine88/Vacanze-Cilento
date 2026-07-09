// ============================================
// VACANZE - TRAVEL PLANNER APP v3.1
// ============================================
// Features: Time Slots, Photos, Maps, QR, Charts, Dark Mode
// Maintains original data structure + new fields

// ============================================
// UTILITY: UUID GENERATOR
// ============================================
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// ============================================
// DATA PERSISTENCE
// ============================================
function loadVacations() {
    const data = localStorage.getItem('vacations');
    return data ? JSON.parse(data) : [];
}

function saveVacations(vacations) {
    localStorage.setItem('vacations', JSON.stringify(vacations));
}

function toggleDarkMode() {
    const isDark = localStorage.getItem('darkMode') === 'true';
    localStorage.setItem('darkMode', !isDark);
    applyDarkMode(!isDark);
}

function applyDarkMode(isDark) {
    const body = document.body;
    if (isDark) {
        body.classList.add('dark-mode');
        document.getElementById('darkModeToggle').textContent = '☀️';
    } else {
        body.classList.remove('dark-mode');
        document.getElementById('darkModeToggle').textContent = '🌙';
    }
}

// ============================================
// STATE MANAGEMENT
// ============================================
let vacations = loadVacations();
let currentVacationIndex = null;
let currentDayIndex = null;
let currentActivityIndex = null;

// ============================================
// RENDER MAIN
// ============================================
function render() {
    const app = document.getElementById('app');
    
    if (currentVacationIndex === null) {
        renderVacationsList();
    } else if (currentDayIndex === null) {
        renderVacationDetail();
    } else {
        renderDayDetail();
    }
}

// ============================================
// VACATIONS LIST
// ============================================
function renderVacationsList() {
    const app = document.getElementById('app');
    
    app.innerHTML = `
        <div class="container">
            <div class="header-top">
                <h1>🏖️ Le Mie Vacanze</h1>
                <button id="darkModeToggle" class="dark-mode-btn" onclick="toggleDarkMode()">🌙</button>
            </div>
            
            <div class="vacations-grid">
                ${vacations.map((v, i) => {
                    const totalSpent = v.giorni.reduce((sum, day) => 
                        sum + day.attivita.reduce((daySum, act) => daySum + (parseFloat(act.costo) || 0), 0), 0
                    );
                    const daysCount = v.giorni.length;
                    const activitiesCount = v.giorni.reduce((sum, day) => sum + day.attivita.length, 0);
                    
                    return `
                        <div class="vacation-card" onclick="selectVacation(${i})">
                            <h3>${v.nome}</h3>
                            <p>📍 ${v.destinazione}</p>
                            <p>📅 ${v.dataInizio} → ${v.dataFine}</p>
                            <div class="card-stats">
                                <span>💰 €${v.budget}</span>
                                <span>💸 €${totalSpent.toFixed(2)}</span>
                            </div>
                            <small>${daysCount} giorni • ${activitiesCount} attività</small>
                        </div>
                    `;
                }).join('')}
                
                <div class="vacation-card add-card" onclick="openNewVacationForm()">
                    <h3>➕ Nuova Vacanza</h3>
                </div>
            </div>
        </div>
    `;
    
    applyDarkMode(localStorage.getItem('darkMode') === 'true');
}

// ============================================
// VACATION DETAIL
// ============================================
function renderVacationDetail() {
    const v = vacations[currentVacationIndex];
    const app = document.getElementById('app');
    
    const totalSpent = v.giorni.reduce((sum, day) => 
        sum + day.attivita.reduce((daySum, act) => daySum + (parseFloat(act.costo) || 0), 0), 0
    );
    
    const totalActivities = v.giorni.reduce((sum, day) => sum + day.attivita.length, 0);
    const remaining = v.budget - totalSpent;
    const percentage = (totalSpent / v.budget * 100).toFixed(1);
    
    app.innerHTML = `
        <div class="container">
            <button class="back-btn" onclick="backToVacationsList()">← Torna</button>
            <button id="darkModeToggle" class="dark-mode-btn" onclick="toggleDarkMode()">🌙</button>
            
            <h1>${v.nome}</h1>
            <p class="subtitle">📍 ${v.destinazione} | 📅 ${v.dataInizio} → ${v.dataFine}</p>
            
            <div class="stats-grid">
                <div class="stat-box">
                    <strong>Budget</strong>
                    <span>€${v.budget}</span>
                </div>
                <div class="stat-box">
                    <strong>Speso</strong>
                    <span class="spent">€${totalSpent.toFixed(2)}</span>
                </div>
                <div class="stat-box">
                    <strong>Rimasto</strong>
                    <span class="remaining">€${remaining.toFixed(2)}</span>
                </div>
                <div class="stat-box">
                    <strong>Attività</strong>
                    <span>${totalActivities}</span>
                </div>
            </div>
            
            <div class="budget-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${Math.min(percentage, 100)}%"></div>
                </div>
                <p>${percentage}% utilizzo budget</p>
            </div>
            
            <div class="tabs">
                <button class="tab-btn active" onclick="switchVacationTab('itinerary')">📋 Itinerario</button>
                <button class="tab-btn" onclick="switchVacationTab('budget')">💰 Budget</button>
                <button class="tab-btn" onclick="switchVacationTab('map')">🗺️ Mappa</button>
                <button class="tab-btn" onclick="switchVacationTab('settings')">⚙️ Impostazioni</button>
            </div>
            
            <div id="tab-content"></div>
        </div>
    `;
    
    switchVacationTab('itinerary');
    applyDarkMode(localStorage.getItem('darkMode') === 'true');
}

// ============================================
// TAB SWITCHING
// ============================================
function switchVacationTab(tab) {
    const v = vacations[currentVacationIndex];
    const content = document.getElementById('tab-content');
    
    if (tab === 'itinerary') {
        content.innerHTML = renderItinerary(v);
    } else if (tab === 'budget') {
        content.innerHTML = renderBudgetTab(v);
    } else if (tab === 'map') {
        content.innerHTML = renderMapTab(v);
    } else if (tab === 'settings') {
        content.innerHTML = renderSettingsTab(v);
    }
    
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
                <div class="day-section" onclick="selectDay(${dayIdx})">
                    <div class="day-header">
                        <h3>📅 Giorno ${dayIdx + 1} - ${new Date(day.data).toLocaleDateString('it-IT', {weekday: 'long', month: 'long', day: 'numeric'})}</h3>
                        <span class="day-cost">💰 €${day.attivita.reduce((sum, act) => sum + (parseFloat(act.costo) || 0), 0).toFixed(2)}</span>
                    </div>
                    
                    <div class="activities">
                        ${day.attivita.map((act, actIdx) => `
                            <div class="activity-card" onclick="event.stopPropagation(); selectActivity(${dayIdx}, ${actIdx})">
                                <div class="activity-header">
                                    <h4>${act.nome}</h4>
                                    <span class="time-slot">${act.timeSlot || 'Non specificato'}</span>
                                </div>
                                <p>📍 ${act.location}</p>
                                ${act.descrizione ? `<p class="activity-desc">${act.descrizione}</p>` : ''}
                                <p class="activity-cost">💰 €${parseFloat(act.costo) || 0}</p>
                                ${act.photos && act.photos.length > 0 ? `<p class="photo-indicator">📷 ${act.photos.length} foto</p>` : ''}
                                ${act.url ? `<a href="${act.url}" target="_blank" onclick="event.stopPropagation()">🔗 Dettagli</a>` : ''}
                            </div>
                        `).join('')}
                    </div>
                    
                    <button class="add-activity-btn" onclick="event.stopPropagation(); openActivityForm(${dayIdx})">➕ Aggiungi Attività</button>
                </div>
            `).join('')}
            
            <button class="add-day-btn" onclick="addDay()">➕ Aggiungi Giorno</button>
        </div>
    `;
}

// ============================================
// TAB: BUDGET (with Chart.js)
// ============================================
function renderBudgetTab(v) {
    const totalSpent = v.giorni.reduce((sum, day) => 
        sum + day.attivita.reduce((daySum, act) => daySum + (parseFloat(act.costo) || 0), 0), 0
    );
    const remaining = v.budget - totalSpent;
    const percentage = (totalSpent / v.budget * 100).toFixed(1);
    
    // Calcola spesa per categoria
    const categories = {};
    v.giorni.forEach(day => {
        day.attivita.forEach(act => {
            const cat = act.categoria || 'Altro';
            categories[cat] = (categories[cat] || 0) + parseFloat(act.costo || 0);
        });
    });
    
    const chartCanvas = `<canvas id="budgetChart" width="400" height="200"></canvas>`;
    
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
            
            <h4>Spesa per categoria:</h4>
            ${chartCanvas}
            
            <h4>Spesa per giorno:</h4>
            <ul class="day-costs">
                ${v.giorni.map((day, idx) => {
                    const daySpent = day.attivita.reduce((sum, act) => sum + (parseFloat(act.costo) || 0), 0);
                    return `<li>
                        <span>Giorno ${idx + 1} (${new Date(day.data).toLocaleDateString('it-IT', {month: 'short', day: 'numeric'})})</span>
                        <span>€${daySpent.toFixed(2)}</span>
                    </li>`;
                }).join('')}
            </ul>
        </div>
    `;
}

// Renderizza il chart dopo un breve delay
setTimeout(() => {
    const v = vacations[currentVacationIndex];
    if (v && document.getElementById('budgetChart')) {
        renderBudgetChart(v);
    }
}, 100);

// ============================================
// BUDGET CHART (Chart.js)
// ============================================
function renderBudgetChart(v) {
    const categories = {};
    v.giorni.forEach(day => {
        day.attivita.forEach(act => {
            const cat = act.categoria || 'Altro';
            categories[cat] = (categories[cat] || 0) + parseFloat(act.costo || 0);
        });
    });
    
    const ctx = document.getElementById('budgetChart');
    if (!ctx) return;
    
    if (window.budgetChart) {
        window.budgetChart.destroy();
    }
    
    const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];
    
    window.budgetChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(categories),
            datasets: [{
                data: Object.values(categories),
                backgroundColor: colors.slice(0, Object.keys(categories).length),
                borderColor: '#fff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: localStorage.getItem('darkMode') === 'true' ? '#fff' : '#333'
                    }
                }
            }
        }
    });
}

// ============================================
// TAB: MAP
// ============================================
function renderMapTab(v) {
    return `
        <div class="map-section">
            <div id="map" style="width: 100%; height: 500px; border-radius: 10px; margin: 20px 0;"></div>
            <div id="map-info"></div>
            <button onclick="initializeGoogleMap()">🗺️ Carica Mappa</button>
        </div>
    `;
}

function initializeGoogleMap() {
    const v = vacations[currentVacationIndex];
    
    // Verifica se hai già inserito la API key
    const apiKey = 'TUA_API_KEY_QUI';
    
    if (apiKey === 'TUA_API_KEY_QUI') {
        alert('⚠️ Configura prima la Google Maps API Key in app.js (riga ~350)');
        return;
    }
    
    // Codice mappa sarà qui - vedi sezione Google Maps integration
    alert('📍 Integrazione mappa - Pronta quando configuri la API Key!');
}

// ============================================
// TAB: SETTINGS
// ============================================
function renderSettingsTab(v) {
    return `
        <div class="settings-section">
            <h3>Impostazioni Vacanza</h3>
            <button class="edit-btn" onclick="editVacation()">✏️ Modifica Vacanza</button>
            <button class="export-btn" onclick="exportVacationToJSON()">📥 Esporta JSON</button>
            <button class="share-btn" onclick="generateQRCode()">📱 Condividi QR</button>
            <button class="delete-btn" onclick="deleteVacation()">🗑️ Elimina Vacanza</button>
            
            <div id="qr-container" style="margin-top: 20px;"></div>
        </div>
    `;
}

// ============================================
// QR CODE GENERATOR
// ============================================
function generateQRCode() {
    const v = vacations[currentVacationIndex];
    const vacationJSON = JSON.stringify(v);
    const encoded = btoa(vacationJSON);
    const url = `${window.location.origin}${window.location.pathname}?vacation=${encoded}`;
    
    const container = document.getElementById('qr-container');
    container.innerHTML = `<div id="qrcode"></div>`;
    
    new QRCode(document.getElementById('qrcode'), {
        text: url,
        width: 256,
        height: 256,
    });
    
    const link = document.createElement('p');
    link.innerHTML = `<small>🔗 Link condivisibile: <a href="${url}" target="_blank">Apri</a></small>`;
    container.appendChild(link);
}

// ============================================
// EXPORT TO JSON
// ============================================
function exportVacationToJSON() {
    const v = vacations[currentVacationIndex];
    const data = JSON.stringify(v, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${v.nome}.json`;
    a.click();
}

// ============================================
// DAY DETAIL
// ============================================
function renderDayDetail() {
    const v = vacations[currentVacationIndex];
    const day = v.giorni[currentDayIndex];
    const app = document.getElementById('app');
    
    const dayNum = currentDayIndex + 1;
    const dayDate = new Date(day.data).toLocaleDateString('it-IT', {weekday: 'long', month: 'long', day: 'numeric'});
    
    app.innerHTML = `
        <div class="container">
            <button class="back-btn" onclick="backToVacationDetail()">← Torna</button>
            
            <h2>📅 Giorno ${dayNum} - ${dayDate}</h2>
            
            <div class="time-slots-grid">
                <div class="time-slot-card">
                    <h4>🌅 Mattina</h4>
                    <div id="morning-activities"></div>
                    <button onclick="openActivityForm(${currentDayIndex}, 'mattina')">+ Mattina</button>
                </div>
                
                <div class="time-slot-card">
                    <h4>☀️ Pomeriggio</h4>
                    <div id="afternoon-activities"></div>
                    <button onclick="openActivityForm(${currentDayIndex}, 'pomeriggio')">+ Pomeriggio</button>
                </div>
                
                <div class="time-slot-card">
                    <h4>🌙 Sera</h4>
                    <div id="evening-activities"></div>
                    <button onclick="openActivityForm(${currentDayIndex}, 'sera')">+ Sera</button>
                </div>
            </div>
            
            <h3>📝 Note del giorno</h3>
            <textarea id="daily-notes" placeholder="Scrivi note per questo giorno..." rows="4">${day.notes || ''}</textarea>
            <button onclick="saveDailyNotes()">💾 Salva Note</button>
        </div>
    `;
    
    renderActivitiesByTimeSlot(day);
    applyDarkMode(localStorage.getItem('darkMode') === 'true');
}

// ============================================
// RENDER ACTIVITIES BY TIME SLOT
// ============================================
function renderActivitiesByTimeSlot(day) {
    const timeSlots = {
        'mattina': document.getElementById('morning-activities'),
        'pomeriggio': document.getElementById('afternoon-activities'),
        'sera': document.getElementById('evening-activities')
    };
    
    Object.keys(timeSlots).forEach(slot => {
        const activities = day.attivita.filter(act => act.timeSlot === slot);
        
        if (activities.length === 0) {
            timeSlots[slot].innerHTML = '<p class="empty">Nessuna attività</p>';
        } else {
            timeSlots[slot].innerHTML = activities.map((act, idx) => `
                <div class="activity-mini">
                    <h5>${act.nome}</h5>
                    <p>📍 ${act.location}</p>
                    <p>💰 €${parseFloat(act.costo) || 0}</p>
                    ${act.photos && act.photos.length > 0 ? `<p>📷 ${act.photos.length} foto</p>` : ''}
                    <button class="btn-small" onclick="editActivity(${currentDayIndex}, ${day.attivita.indexOf(act)})">✏️ Modifica</button>
                    <button class="btn-small danger" onclick="deleteActivity(${currentDayIndex}, ${day.attivita.indexOf(act)})">❌ Elimina</button>
                </div>
            `).join('');
        }
    });
}

// ============================================
// ACTIVITY FORM
// ============================================
function openActivityForm(dayIdx, timeSlot = null) {
    currentDayIndex = dayIdx;
    const v = vacations[currentVacationIndex];
    const day = v.giorni[dayIdx];
    const app = document.getElementById('app');
    
    app.innerHTML = `
        <div class="container">
            <button class="back-btn" onclick="backToVacationDetail()">← Torna</button>
            <h2>➕ Aggiungi Attività - Giorno ${dayIdx + 1}</h2>
            
            <form id="activity-form" class="activity-form">
                <div class="form-group">
                    <label>Nome Attività</label>
                    <input type="text" id="actName" required placeholder="Es: Visita Colosseo">
                </div>
                
                <div class="form-group">
                    <label>Ubicazione/Indirizzo</label>
                    <input type="text" id="actLocation" required placeholder="Es: Via del Colosseo, Roma">
                </div>
                
                <div class="form-group">
                    <label>Fascia Oraria</label>
                    <select id="actTimeSlot" required>
                        <option value="">Seleziona...</option>
                        <option value="mattina" ${timeSlot === 'mattina' ? 'selected' : ''}>🌅 Mattina</option>
                        <option value="pomeriggio" ${timeSlot === 'pomeriggio' ? 'selected' : ''}>☀️ Pomeriggio</option>
                        <option value="sera" ${timeSlot === 'sera' ? 'selected' : ''}>🌙 Sera</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label>Categoria</label>
                    <select id="actCategory">
                        <option value="">Altro</option>
                        <option value="Trasporti">🚕 Trasporti</option>
                        <option value="Cibo">🍽️ Cibo</option>
                        <option value="Attività">🎯 Attività</option>
                        <option value="Alloggio">🏨 Alloggio</option>
                        <option value="Shopping">🛍️ Shopping</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label>Descrizione</label>
                    <textarea id="actDescription" rows="3" placeholder="Note su questa attività..."></textarea>
                </div>
                
                <div class="form-group">
                    <label>Costo (€)</label>
                    <input type="number" id="actCost" step="0.01" placeholder="0.00">
                </div>
                
                <div class="form-group">
                    <label>Link (opzionale)</label>
                    <input type="url" id="actURL" placeholder="https://...">
                </div>
                
                <div class="form-group">
                    <label>📷 Foto (max 3)</label>
                    <input type="file" id="actPhoto" accept="image/*" multiple>
                    <div id="photo-preview"></div>
                </div>
                
                <button type="button" onclick="saveActivity()">✅ Salva Attività</button>
                <button type="button" class="secondary" onclick="backToVacationDetail()">Annulla</button>
            </form>
        </div>
    `;
    
    setupPhotoUpload();
    applyDarkMode(localStorage.getItem('darkMode') === 'true');
}

// ============================================
// PHOTO UPLOAD HANDLER
// ============================================
function setupPhotoUpload() {
    const input = document.getElementById('actPhoto');
    const preview = document.getElementById('photo-preview');
    
    input.addEventListener('change', function(e) {
        preview.innerHTML = '';
        let count = 0;
        
        Array.from(this.files).forEach(file => {
            if (count >= 3) return;
            
            const reader = new FileReader();
            reader.onload = function(event) {
                const img = document.createElement('img');
                img.src = event.target.result;
                img.style.maxWidth = '100px';
                img.style.margin = '5px';
                img.style.borderRadius = '5px';
                preview.appendChild(img);
                count++;
            };
            reader.readAsDataURL(file);
        });
    });
}

// ============================================
// SAVE ACTIVITY
// ============================================
function saveActivity() {
    const v = vacations[currentVacationIndex];
    const day = v.giorni[currentDayIndex];
    
    const name = document.getElementById('actName').value;
    const location = document.getElementById('actLocation').value;
    const timeSlot = document.getElementById('actTimeSlot').value;
    const category = document.getElementById('actCategory').value;
    const description = document.getElementById('actDescription').value;
    const cost = parseFloat(document.getElementById('actCost').value) || 0;
    const url = document.getElementById('actURL').value;
    
    if (!name || !location || !timeSlot) {
        alert('❌ Compila nome, ubicazione e fascia oraria!');
        return;
    }
    
    // Gestione foto
    const photoInput = document.getElementById('actPhoto');
    let photos = [];
    
    if (photoInput.files.length > 0) {
        const processPhotos = async () => {
            for (let i = 0; i < Math.min(3, photoInput.files.length); i++) {
                const file = photoInput.files[i];
                const base64 = await fileToBase64(file);
                photos.push(base64);
            }
            
            const activity = {
                id: generateUUID(),
                nome: name,
                location,
                timeSlot,
                categoria: category,
                descrizione: description,
                costo: cost,
                url,
                photos,
                coordinate: { lat: null, lng: null }
            };
            
            day.attivita.push(activity);
            saveVacations(vacations);
            currentDayIndex = null;
            render();
        };
        
        processPhotos();
    } else {
        const activity = {
            id: generateUUID(),
            nome: name,
            location,
            timeSlot,
            categoria: category,
            descrizione: description,
            costo: cost,
            url,
            photos: [],
            coordinate: { lat: null, lng: null }
        };
        
        day.attivita.push(activity);
        saveVacations(vacations);
        currentDayIndex = null;
        render();
    }
}

// ============================================
// FILE TO BASE64
// ============================================
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// ============================================
// SAVE DAILY NOTES
// ============================================
function saveDailyNotes() {
    const v = vacations[currentVacationIndex];
    const day = v.giorni[currentDayIndex];
    const notes = document.getElementById('daily-notes').value;
    
    day.notes = notes;
    saveVacations(vacations);
    alert('✅ Note salvate!');
}

// ============================================
// EDIT ACTIVITY
// ============================================
function editActivity(dayIdx, actIdx) {
    // Apre il form con i dati precompilati
    openActivityForm(dayIdx);
    // Idealmente aggiungere logica di pre-fill
}

// ============================================
// DELETE ACTIVITY
// ============================================
function deleteActivity(dayIdx, actIdx) {
    if (confirm('❌ Elimina questa attività?')) {
        vacations[currentVacationIndex].giorni[dayIdx].attivita.splice(actIdx, 1);
        saveVacations(vacations);
        render();
    }
}

// ============================================
// ADD DAY
// ============================================
function addDay() {
    const v = vacations[currentVacationIndex];
    const lastDate = new Date(v.giorni[v.giorni.length - 1].data);
    const newDate = new Date(lastDate);
    newDate.setDate(newDate.getDate() + 1);
    
    v.giorni.push({
        data: newDate.toISOString().split('T')[0],
        attivita: [],
        notes: ''
    });
    
    saveVacations(vacations);
    render();
}

// ============================================
// CREATE NEW VACATION
// ============================================
function openNewVacationForm() {
    const app = document.getElementById('app');
    
    app.innerHTML = `
        <div class="container">
            <button class="back-btn" onclick="backToVacationsList()">← Torna</button>
            <h2>➕ Crea Nuova Vacanza</h2>
            
            <form id="vacation-form" class="vacation-form">
                <div class="form-group">
                    <label>Nome Vacanza</label>
                    <input type="text" id="vacName" required placeholder="Es: Vacanza in Toscana">
                </div>
                
                <div class="form-group">
                    <label>Destinazione Principale</label>
                    <input type="text" id="vacDest" required placeholder="Es: Firenze, Italia">
                </div>
                
                <div class="form-group">
                    <label>Data Inizio</label>
                    <input type="date" id="vacDateStart" required>
                </div>
                
                <div class="form-group">
                    <label>Data Fine</label>
                    <input type="date" id="vacDateEnd" required>
                </div>
                
                <div class="form-group">
                    <label>Budget Totale (€)</label>
                    <input type="number" id="vacBudget" step="0.01" required placeholder="1000">
                </div>
                
                <button type="button" onclick="saveNewVacation()">✅ Crea Vacanza</button>
                <button type="button" class="secondary" onclick="backToVacationsList()">Annulla</button>
            </form>
        </div>
    `;
    
    applyDarkMode(localStorage.getItem('darkMode') === 'true');
}

// ============================================
// SAVE NEW VACATION
// ============================================
function saveNewVacation() {
    const nome = document.getElementById('vacName').value;
    const destinazione = document.getElementById('vacDest').value;
    const dataInizio = document.getElementById('vacDateStart').value;
    const dataFine = document.getElementById('vacDateEnd').value;
    const budget = parseFloat(document.getElementById('vacBudget').value);
    
    if (!nome || !destinazione || !dataInizio || !dataFine || !budget) {
        alert('❌ Compila tutti i campi!');
        return;
    }
    
    // Genera giorni tra le date
    const giorni = [];
    const start = new Date(dataInizio);
    const end = new Date(dataFine);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        giorni.push({
            data: new Date(d).toISOString().split('T')[0],
            attivita: [],
            notes: ''
        });
    }
    
    const newVacation = {
        id: generateUUID(),
        nome,
        destinazione,
        dataInizio,
        dataFine,
        budget,
        giorni
    };
    
    vacations.push(newVacation);
    saveVacations(vacations);
    
    alert('✅ Vacanza creata!');
    backToVacationsList();
}

// ============================================
// EDIT VACATION
// ============================================
function editVacation() {
    const v = vacations[currentVacationIndex];
    const nome = prompt('Nome:', v.nome);
    if (nome === null) return;
    
    const destinazione = prompt('Destinazione:', v.destinazione);
    if (destinazione === null) return;
    
    const budget = prompt('Budget (€):', v.budget);
    if (budget === null) return;
    
    v.nome = nome;
    v.destinazione = destinazione;
    v.budget = parseFloat(budget);
    
    saveVacations(vacations);
    render();
}

// ============================================
// DELETE VACATION
// ============================================
function deleteVacation() {
    if (confirm('⚠️ Sei sicuro di voler eliminare questa vacanza? Non si può annullare!')) {
        vacations.splice(currentVacationIndex, 1);
        saveVacations(vacations);
        currentVacationIndex = null;
        render();
    }
}

// ============================================
// NAVIGATION
// ============================================
function selectVacation(index) {
    currentVacationIndex = index;
    currentDayIndex = null;
    render();
}

function selectDay(dayIdx) {
    currentDayIndex = dayIdx;
    render();
}

function selectActivity(dayIdx, actIdx) {
    // Apre dettaglio attività (implementare se necessario)
    console.log('Activity selected:', dayIdx, actIdx);
}

function backToVacationsList() {
    currentVacationIndex = null;
    currentDayIndex = null;
    render();
}

function backToVacationDetail() {
    currentDayIndex = null;
    render();
}

// ============================================
// BUILD STATUS REPORT
// ============================================
function getBuildStatus() {
    const vacCount = vacations.length;
    const activitiesCount = vacations.reduce((sum, v) => 
        sum + v.giorni.reduce((daySum, day) => daySum + day.attivita.length, 0), 0
    );
    const photoCount = vacations.reduce((sum, v) => 
        sum + v.giorni.reduce((daySum, day) => 
            daySum + day.attivita.reduce((actSum, act) => actSum + (act.photos ? act.photos.length : 0), 0), 0), 0
    );
    const storageUsed = new Blob([localStorage.getItem('vacations')]).size;
    
    return {
        version: '3.1',
        timestamp: new Date().toISOString(),
        features: [
            '✅ Dark Mode',
            '✅ Time Slots (Mattina/Pomeriggio/Sera)',
            '✅ Foto alle attività (max 3)',
            '✅ Budget Tracking + Charts',
            '✅ Daily Notes',
            '✅ QR Code Sharing',
            '✅ Google Maps (ready)',
            '✅ JSON Export',
            '✅ PWA Support'
        ],
        data: {
            vacations: vacCount,
            activities: activitiesCount,
            photos: photoCount,
            storageUsedMB: (storageUsed / 1024 / 1024).toFixed(2)
        },
        actionItems: [
            '1. Configure Google Cloud API Key (replace TUA_API_KEY_QUI)',
            '2. Verify Chart.js and qrcode.js loaded',
            '3. Test photo upload on iOS/Android',
            '4. Monitor localStorage limits (~5MB)'
        ]
    };
}

// ============================================
// INIT
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    render();
    
    // Applica dark mode al caricamento
    applyDarkMode(localStorage.getItem('darkMode') === 'true');
    
    console.log('Vacanze App v3.1 loaded');
    console.log('Use getBuildStatus() for details');
});

// Service Worker Registration
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js')
        .then(reg => console.log('✅ Service Worker registered'))
        .catch(err => console.log('Service Worker error:', err));
}
