class VacationPlanner {
    constructor() {
        this.vacations = [];
        this.currentVacationId = null;
        this.init();
    }

    init() {
        this.loadFromStorage();
        this.render();
        this.attachEventListeners();
    }

    // GESTIONE MEMORIZZAZIONE
    loadFromStorage() {
        try {
            const data = localStorage.getItem('vacationsData');
            this.vacations = data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Errore caricamento dati:', e);
            this.vacations = [];
        }
    }

    saveToStorage() {
        try {
            localStorage.setItem('vacationsData', JSON.stringify(this.vacations));
        } catch (e) {
            console.error('Errore salvataggio dati:', e);
            alert('Memoria piena! Elimina alcune foto.');
        }
    }

    // CRUD VACANZE
    createVacation(name, startDate, endDate, budget) {
        if (!name || !startDate || !endDate || !budget) {
            alert('Compila tutti i campi!');
            return false;
        }

        const id = Date.now();
        const vacation = {
            id: id,
            nome: name,
            dataInizio: startDate,
            dataFine: endDate,
            budget: parseFloat(budget) || 0,
            giorni: this.generateDays(startDate, endDate),
            createdAt: new Date().toISOString()
        };

        this.vacations.push(vacation);
        this.saveToStorage();
        this.render();
        return true;
    }

    generateDays(startDate, endDate) {
        const days = [];
        const current = new Date(startDate);
        const end = new Date(endDate);

        while (current <= end) {
            days.push({
                data: current.toISOString().split('T')[0],
                attivita: []
            });
            current.setDate(current.getDate() + 1);
        }

        return days;
    }

    deleteVacation(id) {
        this.vacations = this.vacations.filter(v => v.id !== id);
        this.currentVacationId = null;
        this.saveToStorage();
        this.render();
    }

    // ATTIVITÀ
    addActivity(vacationId, dayDate, activityName, timeSlot, category, cost) {
        const vacation = this.vacations.find(v => v.id === vacationId);
        if (!vacation) return false;

        const day = vacation.giorni.find(d => d.data === dayDate);
        if (!day) return false;

        const activity = {
            id: Date.now(),
            nome: activityName,
            timeSlot: timeSlot || 'mattina',
            categoria: category || 'altro',
            costo: parseFloat(cost) || 0,
            foto: []
        };

        day.attivita.push(activity);
        this.saveToStorage();
        this.render();
        return true;
    }

    deleteActivity(vacationId, dayDate, activityId) {
        const vacation = this.vacations.find(v => v.id === vacationId);
        if (!vacation) return;

        const day = vacation.giorni.find(d => d.data === dayDate);
        if (!day) return;

        day.attivita = day.attivita.filter(a => a.id !== activityId);
        this.saveToStorage();
        this.render();
    }

    addPhotoToActivity(vacationId, dayDate, activityId, photoBase64) {
        const vacation = this.vacations.find(v => v.id === vacationId);
        if (!vacation) return false;

        const day = vacation.giorni.find(d => d.data === dayDate);
        if (!day) return false;

        const activity = day.attivita.find(a => a.id === activityId);
        if (!activity) return false;

        if (!activity.foto) activity.foto = [];
        if (activity.foto.length >= 3) {
            alert('Massimo 3 foto per attività!');
            return false;
        }

        activity.foto.push(photoBase64);
        this.saveToStorage();
        this.render();
        return true;
    }

    deletePhoto(vacationId, dayDate, activityId, photoIndex) {
        const vacation = this.vacations.find(v => v.id === vacationId);
        if (!vacation) return;

        const day = vacation.giorni.find(d => d.data === dayDate);
        if (!day) return;

        const activity = day.attivita.find(a => a.id === activityId);
        if (!activity || !activity.foto) return;

        activity.foto.splice(photoIndex, 1);
        this.saveToStorage();
        this.render();
    }

    // CALCOLI BUDGET
    calculateCategorySpending(vacationId, category) {
        const vacation = this.vacations.find(v => v.id === vacationId);
        if (!vacation) return 0;

        let total = 0;
        vacation.giorni.forEach(day => {
            day.attivita.forEach(activity => {
                if (activity.categoria === category) {
                    total += activity.costo || 0;
                }
            });
        });

        return total;
    }

    calculateTotalSpending(vacationId) {
        const vacation = this.vacations.find(v => v.id === vacationId);
        if (!vacation) return 0;

        let total = 0;
        vacation.giorni.forEach(day => {
            day.attivita.forEach(activity => {
                total += activity.costo || 0;
            });
        });

        return total;
    }

    // EXPORT/IMPORT
    exportJSON() {
        const dataStr = JSON.stringify(this.vacations, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `vacanze-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
    }

    importJSON(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (Array.isArray(data)) {
                    this.vacations = data;
                    this.saveToStorage();
                    this.render();
                    alert('Dati importati con successo!');
                } else {
                    alert('Formato file non valido!');
                }
            } catch (err) {
                alert('Errore durante l\'importazione: ' + err.message);
            }
        };
        reader.readAsText(file);
    }

    // RENDER UI
    render() {
        this.renderVacationList();
        this.renderVacationDetail();
    }

    renderVacationList() {
        const container = document.getElementById('vacationList');
        if (!container) return;

        if (this.vacations.length === 0) {
            container.innerHTML = '<p>Nessuna vacanza. Creane una!</p>';
            return;
        }

        container.innerHTML = this.vacations.map(vacation => {
            const totalSpent = this.calculateTotalSpending(vacation.id);
            const budget = parseFloat(vacation.budget) || 0;
            const percentage = budget > 0 ? (totalSpent / budget * 100) : 0;

            return `
                <div class="vacation-card" onclick="planner.selectVacation(${vacation.id})">
                    <h3>${vacation.nome}</h3>
                    <p>📅 ${vacation.dataInizio} → ${vacation.dataFine}</p>
                    <p>💰 Budget: €${budget.toFixed(2)}</p>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${Math.min(percentage, 100)}%"></div>
                    </div>
                    <p>Speso: €${totalSpent.toFixed(2)} / €${budget.toFixed(2)}</p>
                    <button onclick="planner.deleteVacation(${vacation.id}); event.stopPropagation();" class="btn-delete">🗑️ Elimina</button>
                </div>
            `;
        }).join('');
    }

    renderVacationDetail() {
        const container = document.getElementById('vacationDetail');
        if (!container) return;

        if (!this.currentVacationId) {
            container.innerHTML = '<p>Seleziona una vacanza per visualizzare i dettagli.</p>';
            return;
        }

        const vacation = this.vacations.find(v => v.id === this.currentVacationId);
        if (!vacation) return;

        let html = `
            <div class="vacation-detail">
                <h2>${vacation.nome}</h2>
                <p>📅 ${vacation.dataInizio} → ${vacation.dataFine}</p>
                <p>💰 Budget: €${(parseFloat(vacation.budget) || 0).toFixed(2)}</p>

                <h3>Aggiungi Attività</h3>
                <div class="form-group">
                    <input type="text" id="activityName" placeholder="Nome attività">
                    <select id="timeSlot">
                        <option value="mattina">Mattina</option>
                        <option value="pomeriggio">Pomeriggio</option>
                        <option value="sera">Sera</option>
                    </select>
                    <select id="category">
                        <option value="alloggio">Alloggio</option>
                        <option value="ristorazione">Ristorazione</option>
                        <option value="trasporto">Trasporto</option>
                        <option value="attrazione">Attrazione</option>
                        <option value="shopping">Shopping</option>
                        <option value="altro">Altro</option>
                    </select>
                    <input type="number" id="activityCost" placeholder="Costo" step="0.01">
                    <select id="activityDate">
        `;

        vacation.giorni.forEach(day => {
            html += `<option value="${day.data}">${day.data}</option>`;
        });

        html += `
                    </select>
                    <button onclick="planner.addActivityFromForm(${vacation.id})" class="btn-primary">➕ Aggiungi Attività</button>
                </div>

                <h3>Itinerario</h3>
                <div class="itinerary">
        `;

        vacation.giorni.forEach(day => {
            html += `
                <div class="day-section">
                    <h4>📅 ${day.data}</h4>
            `;

            if (day.attivita.length === 0) {
                html += '<p>Nessuna attività.</p>';
            } else {
                day.attivita.forEach(activity => {
                    const cost = parseFloat(activity.costo) || 0;
                    html += `
                        <div class="activity-card">
                            <h5>${activity.nome}</h5>
                            <p>⏰ ${activity.timeSlot} | 📂 ${activity.categoria} | 💰 €${cost.toFixed(2)}</p>
                    `;

                    if (activity.foto && activity.foto.length > 0) {
                        html += '<div class="photo-gallery">';
                        activity.foto.forEach((photo, idx) => {
                            html += `
                                <div class="photo-item">
                                    <img src="${photo}" alt="Foto">
                                    <button onclick="planner.deletePhoto(${vacation.id}, '${day.data}', ${activity.id}, ${idx})" class="btn-delete-photo">✕</button>
                                </div>
                            `;
                        });
                        html += '</div>';
                    }

                    html += `
                            <input type="file" accept="image/*" onchange="planner.handlePhotoUpload(event, ${vacation.id}, '${day.data}', ${activity.id})" class="photo-input">
                            <button onclick="planner.deleteActivity(${vacation.id}, '${day.data}', ${activity.id})" class="btn-delete">🗑️ Elimina</button>
                        </div>
                    `;
                });
            }

            html += '</div>';
        });

        html += `
                </div>

                <h3>Budget per Categoria</h3>
                <div class="budget-breakdown">
        `;

        const categories = ['alloggio', 'ristorazione', 'trasporto', 'attrazione', 'shopping', 'altro'];
        categories.forEach(cat => {
            const spent = this.calculateCategorySpending(vacation.id, cat);
            html += `
                <div class="budget-item">
                    <p>${cat}: €${spent.toFixed(2)}</p>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${Math.min((spent / (parseFloat(vacation.budget) || 1)) * 100, 100)}%"></div>
                    </div>
                </div>
            `;
        });

        html += `
                </div>
            </div>
        `;

        container.innerHTML = html;
    }

    selectVacation(id) {
        this.currentVacationId = id;
        this.render();
    }

    addActivityFromForm(vacationId) {
        const name = document.getElementById('activityName').value;
        const timeSlot = document.getElementById('timeSlot').value;
        const category = document.getElementById('category').value;
        const cost = document.getElementById('activityCost').value;
        const date = document.getElementById('activityDate').value;

        if (this.addActivity(vacationId, date, name, timeSlot, category, cost)) {
            document.getElementById('activityName').value = '';
            document.getElementById('activityCost').value = '';
        }
    }

    handlePhotoUpload(event, vacationId, dayDate, activityId) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            this.addPhotoToActivity(vacationId, dayDate, activityId, e.target.result);
        };
        reader.readAsDataURL(file);
    }
}

// ISTANZA GLOBALE
let planner;

document.addEventListener('DOMContentLoaded', function() {
    planner = new VacationPlanner();

    // EVENT LISTENERS
    const createBtn = document.getElementById('createVacationBtn');
    if (createBtn) {
        createBtn.addEventListener('click', function() {
            const name = document.getElementById('vacationName').value;
            const startDate = document.getElementById('startDate').value;
            const endDate = document.getElementById('endDate').value;
            const budget = document.getElementById('budget').value;

            if (planner.createVacation(name, startDate, endDate, budget)) {
                document.getElementById('vacationName').value = '';
                document.getElementById('startDate').value = '';
                document.getElementById('endDate').value = '';
                document.getElementById('budget').value = '';
            }
        });
    }

    // EXPORT/IMPORT
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => planner.exportJSON());
    }

    const importFile = document.getElementById('importFile');
    if (importFile) {
        importFile.addEventListener('change', (e) => {
            if (e.target.files[0]) {
                planner.importJSON(e.target.files[0]);
                e.target.value = '';
            }
        });
    }
});

// FUNZIONE GLOBALE (per onclick inline)
function createVacation() {
    const name = document.getElementById('vacationName').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const budget = document.getElementById('budget').value;

    if (planner.createVacation(name, startDate, endDate, budget)) {
        document.getElementById('vacationName').value = '';
        document.getElementById('startDate').value = '';
        document.getElementById('endDate').value = '';
        document.getElementById('budget').value = '';
    }
}

// DIAGNOSTICA
function getBuildStatus() {
    const totalData = JSON.stringify(localStorage).length;
    return {
        version: '3.2-simplified',
        features: {
            vacationManagement: true,
            itinerary: true,
            photoSupport: true,
            budgeting: true,
            jsonExportImport: true,
            darkMode: false,
            googleMaps: false,
            qrCode: false
        },
        storage: {
            used: totalData,
            limit: 5242880,
            percentage: ((totalData / 5242880) * 100).toFixed(2)
        }
    };
}
