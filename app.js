class VacationPlanner {
    constructor() {
        this.vacations = [];
        this.currentVacationId = null;
        this.init();
    }

    init() {
        this.loadFromStorage();
        this.setupEventListeners();
        this.render();
    }

    loadFromStorage() {
        try {
            const data = localStorage.getItem('vacationsData');
            this.vacations = data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Errore caricamento:', e);
            this.vacations = [];
        }
    }

    saveToStorage() {
        try {
            localStorage.setItem('vacationsData', JSON.stringify(this.vacations));
        } catch (e) {
            console.error('Errore salvataggio:', e);
            alert('Memoria piena! Elimina alcune foto.');
        }
    }

    setupEventListeners() {
        // Bottone creazione vacanza
        const createBtn = document.getElementById('createVacationBtn');
        if (createBtn) {
            createBtn.addEventListener('click', () => this.handleCreateVacation());
        }

        // Export
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportJSON());
        }

        // Import
        const importFile = document.getElementById('importFile');
        if (importFile) {
            importFile.addEventListener('change', (e) => this.handleImportJSON(e));
        }
    }

    // ===== VACANZE =====
    handleCreateVacation() {
        const name = document.getElementById('vacationName').value.trim();
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        const budget = document.getElementById('budget').value;

        if (!name || !startDate || !endDate || !budget) {
            alert('⚠️ Compila tutti i campi!');
            return;
        }

        const id = Date.now();
        const vacation = {
            id: id,
            nome: name,
            dataInizio: startDate,
            dataFine: endDate,
            budget: parseFloat(budget),
            giorni: this.generateDays(startDate, endDate),
            createdAt: new Date().toISOString()
        };

        this.vacations.push(vacation);
        this.saveToStorage();

        // Ripulisci form
        document.getElementById('vacationName').value = '';
        document.getElementById('startDate').value = '';
        document.getElementById('endDate').value = '';
        document.getElementById('budget').value = '';

        this.render();
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
        if (confirm('Sei sicuro di voler eliminare questa vacanza?')) {
            this.vacations = this.vacations.filter(v => v.id !== id);
            this.currentVacationId = null;
            this.saveToStorage();
            this.render();
        }
    }

    selectVacation(id) {
        this.currentVacationId = id;
        this.render();
    }

    // ===== ATTIVITÀ =====
    addActivityFromForm(vacationId) {
        const name = document.getElementById('activityName').value.trim();
        const timeSlot = document.getElementById('timeSlot').value;
        const category = document.getElementById('category').value;
        const cost = document.getElementById('activityCost').value;
        const date = document.getElementById('activityDate').value;
        const link = document.getElementById('activityLink').value.trim();  // ← NUOVO

        if (!name || !cost) {
            alert('⚠️ Compila nome e costo!');
            return;
        }

        const vacation = this.vacations.find(v => v.id === vacationId);
        if (!vacation) return;

        const day = vacation.giorni.find(d => d.data === date);
        if (!day) return;

        const activity = {
            id: Date.now(),
            nome: name,
            timeSlot: timeSlot,
            categoria: category,
            costo: parseFloat(cost),
            link: link,  // ← NUOVO
            foto: []
        };

        day.attivita.push(activity);
        this.saveToStorage();

        // Ripulisci form
        document.getElementById('activityName').value = '';
        document.getElementById('activityCost').value = '';
        document.getElementById('activityLink').value = '';  // ← NUOVO

        this.render();
    }

    deleteActivity(vacationId, dayDate, activityId) {
        if (confirm('Elimina questa attività?')) {
            const vacation = this.vacations.find(v => v.id === vacationId);
            if (!vacation) return;

            const day = vacation.giorni.find(d => d.data === dayDate);
            if (!day) return;

            day.attivita = day.attivita.filter(a => a.id !== activityId);
            this.saveToStorage();
            this.render();
        }
    }

    // ===== FOTO =====
    handlePhotoUpload(event, vacationId, dayDate, activityId) {
        const file = event.target.files[0];
        if (!file) return;

        if (file.size > 1000000) {
            alert('⚠️ File troppo grande! Max 1MB');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const vacation = this.vacations.find(v => v.id === vacationId);
            if (!vacation) return;

            const day = vacation.giorni.find(d => d.data === dayDate);
            if (!day) return;

            const activity = day.attivita.find(a => a.id === activityId);
            if (!activity) return;

            if (!activity.foto) activity.foto = [];

            if (activity.foto.length >= 3) {
                alert('⚠️ Massimo 3 foto per attività!');
                return;
            }

            activity.foto.push(e.target.result);
            this.saveToStorage();
            this.render();
        };

        reader.readAsDataURL(file);
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

    // ===== CALCOLI =====
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

    // ===== EXPORT/IMPORT =====
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

    handleImportJSON(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (Array.isArray(data)) {
                    this.vacations = data;
                    this.saveToStorage();
                    this.render();
                    alert('✅ Dati importati con successo!');
                } else {
                    alert('❌ Formato file non valido!');
                }
            } catch (err) {
                alert('❌ Errore durante l\'importazione: ' + err.message);
            }
        };

        reader.readAsText(file);
        event.target.value = '';
    }

    // ===== RENDER =====
    render() {
        this.renderVacationList();
        this.renderVacationDetail();
    }

    renderVacationList() {
        const container = document.getElementById('vacationList');
        if (!container) return;

        if (this.vacations.length === 0) {
            container.innerHTML = '<p style="color: #999;">Nessuna vacanza ancora.</p>';
            return;
        }

        container.innerHTML = this.vacations.map(vacation => {
            const totalSpent = this.calculateTotalSpending(vacation.id);
            const budget = vacation.budget || 0;
            const percentage = budget > 0 ? (totalSpent / budget * 100) : 0;
            const isActive = this.currentVacationId === vacation.id ? 'border-color: #667eea; box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);' : '';

            return `
                <div class="vacation-card" style="${isActive}" onclick="planner.selectVacation(${vacation.id})">
                    <h3>${vacation.nome}</h3>
                    <p>📅 ${vacation.dataInizio}</p>
                    <p>→ ${vacation.dataFine}</p>
                    <p>💰 Budget: €${budget.toFixed(2)}</p>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${Math.min(percentage, 100)}%"></div>
                    </div>
                    <p style="font-size: 0.85em; color: #666;">€${totalSpent.toFixed(2)} / €${budget.toFixed(2)}</p>
                    <button class="btn-delete" onclick="planner.deleteVacation(${vacation.id}); event.stopPropagation();">🗑️ Elimina</button>
                </div>
            `;
        }).join('');
    }

    renderVacationDetail() {
        const itineraryContainer = document.getElementById('vacationDetail');
        if (!itineraryContainer) return;

        if (!this.currentVacationId) {
            itineraryContainer.innerHTML = '<p style="color: #999;">Seleziona una vacanza per iniziare.</p>';
            return;
        }

        const vacation = this.vacations.find(v => v.id === this.currentVacationId);
        if (!vacation) return;

        let html = `
            <div class="vacation-detail">
                <h2>${vacation.nome}</h2>
                <p>📅 ${vacation.dataInizio} → ${vacation.dataFine}</p>
                <p>💰 Budget: €${vacation.budget.toFixed(2)}</p>

                <h3>➕ Aggiungi Attività</h3>
                <div class="form-group">
                    <label>Nome Attività</label>
                    <input type="text" id="activityName" placeholder="Es: Cena al ristorante">
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div class="form-group">
                        <label>Orario</label>
                        <select id="timeSlot">
                            <option value="mattina">🌅 Mattina</option>
                            <option value="pomeriggio">☀️ Pomeriggio</option>
                            <option value="sera">🌙 Sera</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Categoria</label>
                        <select id="category">
                            <option value="alloggio">🏨 Alloggio</option>
                            <option value="ristorazione">🍽️ Ristorazione</option>
                            <option value="trasporto">🚗 Trasporto</option>
                            <option value="attrazione">🎢 Attrazione</option>
                            <option value="shopping">🛍️ Shopping</option>
                            <option value="altro">📌 Altro</option>
                        </select>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div class="form-group">
                        <label>Costo (€)</label>
                        <input type="number" id="activityCost" placeholder="0.00" step="0.01" min="0">
                    </div>

                    <div class="form-group">
                        <label>Giorno</label>
                        <select id="activityDate">
        `;

        vacation.giorni.forEach(day => {
            html += `<option value="${day.data}">${day.data}</option>`;
        });

        html += `
                        </select>
                    </div>
                </div>

                <div class="form-group">
                    <label>Link/URL (opzionale)</label>
                    <input type="url" id="activityLink" placeholder="https://..." style="width: 100%;">
                </div>

                <button class="btn" onclick="planner.addActivityFromForm(${vacation.id})">➕ Aggiungi Attività</button>

                <h3 style="margin-top: 30px;">📅 Itinerario</h3>
        `;

        vacation.giorni.forEach(day => {
            html += `
                <div class="day-section">
                    <h4>📅 ${day.data}</h4>
            `;

            if (day.attivita.length === 0) {
                html += '<p style="color: #999;">Nessuna attività questo giorno.</p>';
            } else {
                day.attivita.forEach(activity => {
                    const cost = activity.costo || 0;
                    html += `
                        <div class="activity-card">
                            <h5>${activity.nome}</h5>
                            <p>
                                <span>${this.getTimeEmoji(activity.timeSlot)} ${activity.timeSlot}</span> |
                                <span>${this.getCategoryEmoji(activity.categoria)} ${activity.categoria}</span> |
                                <span>💰 €${cost.toFixed(2)}</span>
                            </p>
                    `;

                    if (activity.link) {
                        html += `<p><a href="${activity.link}" target="_blank" style="color: #667eea; text-decoration: none; font-weight: bold;">🔗 ${activity.link}</a></p>`;
                    }

                    if (activity.foto && activity.foto.length > 0) {
                        html += '<div class="photo-gallery">';
                        activity.foto.forEach((photo, idx) => {
                            html += `
                                <div class="photo-item">
                                    <img src="${photo}" alt="Foto">
                                    <button class="btn-delete-photo" onclick="planner.deletePhoto(${vacation.id}, '${day.data}', ${activity.id}, ${idx}); event.stopPropagation();">✕</button>
                                </div>
                            `;
                        });
                        html += '</div>';
                    }

                    html += `
                            <input type="file" accept="image/*" onchange="planner.handlePhotoUpload(event, ${vacation.id}, '${day.data}', ${activity.id})" class="photo-input" style="font-size: 0.9em;">
                            <button class="btn-delete" onclick="planner.deleteActivity(${vacation.id}, '${day.data}', ${activity.id})">🗑️ Elimina Attività</button>
                        </div>
                    `;
                });
            }

            html += '</div>';
        });

        html += '</div>';
        itineraryContainer.innerHTML = html;
    }

    renderBudgetTab() {
        const container = document.getElementById('budgetDetail');
        if (!container) return;

        if (!this.currentVacationId) {
            container.innerHTML = '<p>Seleziona una vacanza.</p>';
            return;
        }

        const vacation = this.vacations.find(v => v.id === this.currentVacationId);
        if (!vacation) return;

        const categories = ['alloggio', 'ristorazione', 'trasporto', 'attrazione', 'shopping', 'altro'];
        const totalSpent = this.calculateTotalSpending(vacation.id);
        const budget = vacation.budget || 0;

        let html = `
            <div class="vacation-detail">
                <h2>💰 Budget Dettagliato</h2>
                <p>Budget Totale: <strong>€${budget.toFixed(2)}</strong></p>
                <p>Speso Finora: <strong>€${totalSpent.toFixed(2)}</strong></p>
                <p>Rimanente: <strong style="color: ${totalSpent > budget ? '#dc3545' : '#28a745'};">€${(budget - totalSpent).toFixed(2)}</strong></p>

                <div class="budget-breakdown">
        `;

        categories.forEach(cat => {
            const spent = this.calculateCategorySpending(vacation.id, cat);
            const percentage = budget > 0 ? (spent / budget * 100) : 0;
            const categoryEmoji = this.getCategoryEmoji(cat);

            html += `
                <div class="budget-item">
                    <p>${categoryEmoji} ${cat.toUpperCase()}</p>
                    <p style="font-size: 1.2em; color: #667eea; margin-bottom: 8px;">€${spent.toFixed(2)}</p>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${Math.min(percentage, 100)}%; background: ${spent > budget / 6 ? '#ffc107' : '#667eea'};"></div>
                    </div>
                </div>
            `;
        });

        html += '</div></div>';
        container.innerHTML = html;
    }

    renderSettingsTab() {
        const container = document.getElementById('settingsDetail');
        if (!container) return;

        const status = this.getBuildStatus();

        let html = `
            <div class="vacation-detail">
                <h2>⚙️ Informazioni App</h2>

                <div class="settings-group">
                    <h3>📱 Versione</h3>
                    <p><strong>${status.version}</strong></p>
                </div>

                <div class="settings-group">
                    <h3>✨ Funzionalità</h3>
                    <ul style="list-style: none; padding: 0;">
        `;

        Object.entries(status.features).forEach(([feature, enabled]) => {
            const icon = enabled ? '✅' : '❌';
            const featureName = feature.replace(/([A-Z])/g, ' $1').trim();
            html += `<li style="padding: 5px 0;">${icon} ${featureName}</li>`;
        });

        html += `
                    </ul>
                </div>

                <div class="settings-group">
                    <h3>💾 Memoria</h3>
                    <p>Usata: <strong>${(status.storage.used / 1024).toFixed(2)} KB</strong> / ${(status.storage.limit / 1024 / 1024).toFixed(0)} MB</p>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${status.storage.percentage}%"></div>
                    </div>
                    <p style="color: #666; font-size: 0.9em;">${status.storage.percentage}% utilizzato</p>
                </div>

                <div class="settings-group">
                    <h3>📊 Statistiche</h3>
                    <p>Vacanze Totali: <strong>${this.vacations.length}</strong></p>
                    <p>Giorni Pianificati: <strong>${this.vacations.reduce((sum, v) => sum + v.giorni.length, 0)}</strong></p>
                    <p>Attività Create: <strong>${this.vacations.reduce((sum, v) => sum + v.giorni.reduce((s, d) => s + d.attivita.length, 0), 0)}</strong></p>
                </div>
            </div>
        `;

        container.innerHTML = html;
    }

    getBuildStatus() {
        const totalData = JSON.stringify(localStorage).length;
        return {
            version: '3.2-simplified-fixed-with-links',
            features: {
                'Vacation Management': true,
                'Itinerary Planning': true,
                'Activity Links': true,
                'Photo Support': true,
                'Budget Tracking': true,
                'Data Export/Import': true,
                'Dark Mode': false,
                'Google Maps': false,
                'QR Code': false
            },
            storage: {
                used: totalData,
                limit: 5242880,
                percentage: ((totalData / 5242880) * 100).toFixed(2)
            }
        };
    }

    getTimeEmoji(timeSlot) {
        const emojis = {
            'mattina': '🌅',
            'pomeriggio': '☀️',
            'sera': '🌙'
        };
        return emojis[timeSlot] || '⏰';
    }

    getCategoryEmoji(category) {
        const emojis = {
            'alloggio': '🏨',
            'ristorazione': '🍽️',
            'trasporto': '🚗',
            'attrazione': '🎢',
            'shopping': '🛍️',
            'altro': '📌'
        };
        return emojis[category] || '📌';
    }
}

// ===== INSTANZA GLOBALE =====
let planner;

document.addEventListener('DOMContentLoaded', function() {
    planner = new VacationPlanner();
});
