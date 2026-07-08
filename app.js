/**
 * VACANZE CILENTO - Application Engine v2.0
 * Gestione completa vacanze con categorie, orari, foto e sharing
 */

class VacationPlanner {
  constructor() {
    this.vacations = [];
    this.currentVacationId = null;
    this.darkMode = localStorage.getItem('darkMode') === 'true';
    this.init();
  }

  /**
   * ========== INIZIALIZZAZIONE ==========
   */
  init() {
    this.loadVacations();
    this.applyDarkMode();
    this.attachEventListeners();
    this.renderVacations();
  }

  attachEventListeners() {
    // Tab switching
    document.querySelectorAll('[data-tab]').forEach(tab => {
      tab.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
    });

    // Dark mode toggle
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
      darkModeToggle.addEventListener('click', () => this.toggleDarkMode());
    }

    // Create vacation form
    const createBtn = document.getElementById('createVacationBtn');
    if (createBtn) {
      createBtn.addEventListener('click', () => this.showCreateForm());
    }

    // Export/Import buttons
    const exportBtn = document.getElementById('exportBtn');
    const importBtn = document.getElementById('importBtn');
    if (exportBtn) exportBtn.addEventListener('click', () => this.exportAllToJSON());
    if (importBtn) importBtn.addEventListener('click', () => document.getElementById('fileInput').click());

    // File input for import
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
      fileInput.addEventListener('change', (e) => this.importFromJSON(e));
    }

    // Share button
    const shareBtn = document.getElementById('shareBtn');
    if (shareBtn) {
      shareBtn.addEventListener('click', () => this.generateShareLink());
    }
  }

  /**
   * ========== DARK MODE ==========
   */
  toggleDarkMode() {
    this.darkMode = !this.darkMode;
    localStorage.setItem('darkMode', this.darkMode);
    this.applyDarkMode();
  }

  applyDarkMode() {
    const html = document.documentElement;
    if (this.darkMode) {
      html.setAttribute('data-theme', 'dark');
    } else {
      html.removeAttribute('data-theme');
    }
  }

  /**
   * ========== GESTIONE VACANZE ==========
   */
  loadVacations() {
    const stored = localStorage.getItem('vacanze');
    this.vacations = stored ? JSON.parse(stored) : [];
  }

  saveVacations() {
    localStorage.setItem('vacanze', JSON.stringify(this.vacations));
  }

  createVacation(formData) {
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);

    if (startDate > endDate) {
      alert('La data di inizio deve essere prima della data di fine!');
      return false;
    }

    const vacation = {
      id: this.generateUUID(),
      name: formData.name,
      destination: formData.destination,
      startDate: formData.startDate,
      endDate: formData.endDate,
      totalBudget: parseFloat(formData.totalBudget) || 0,
      createdDate: new Date().toISOString(),
      days: this.generateDays(startDate, endDate),
      darkMode: this.darkMode
    };

    this.vacations.push(vacation);
    this.saveVacations();
    this.renderVacations();
    this.clearCreateForm();
    alert('✅ Vacanza creata con successo!');
    return true;
  }

  generateDays(startDate, endDate) {
    const days = [];
    const current = new Date(startDate);
    let dayNumber = 1;

    while (current <= endDate) {
      days.push({
        date: current.toISOString().split('T')[0],
        dayNumber: dayNumber,
        notes: '',
        activities: []
      });

      current.setDate(current.getDate() + 1);
      dayNumber++;
    }

    return days;
  }

  updateVacation(id, updates) {
    const vacation = this.vacations.find(v => v.id === id);
    if (vacation) {
      Object.assign(vacation, updates);
      this.saveVacations();
    }
  }

  deleteVacation(id) {
    if (confirm('⚠️ Sei sicuro di voler eliminare questa vacanza?')) {
      this.vacations = this.vacations.filter(v => v.id !== id);
      this.saveVacations();
      if (this.currentVacationId === id) {
        this.currentVacationId = null;
      }
      this.renderVacations();
      this.switchTab('create');
    }
  }

  /**
   * ========== GESTIONE ATTIVITÀ ==========
   */
  addActivity(vacationId, dayIndex, activityData) {
    const vacation = this.vacations.find(v => v.id === vacationId);
    if (!vacation) return false;

    const day = vacation.days[dayIndex];
    if (!day) return false;

    const activity = {
      id: this.generateUUID(),
      name: activityData.name,
      location: activityData.location,
      category: activityData.category || 'altro',
      timeSlot: activityData.timeSlot || 'mattina',
      specificTime: activityData.specificTime || '',
      cost: parseFloat(activityData.cost) || 0,
      description: activityData.description || '',
      link: activityData.link || '',
      photos: []
    };

    day.activities.push(activity);
    this.saveVacations();
    return activity;
  }

  updateActivity(vacationId, dayIndex, activityId, updates) {
    const vacation = this.vacations.find(v => v.id === vacationId);
    if (!vacation) return false;

    const activity = vacation.days[dayIndex].activities.find(a => a.id === activityId);
    if (activity) {
      Object.assign(activity, updates);
      this.saveVacations();
      return true;
    }
    return false;
  }

  deleteActivity(vacationId, dayIndex, activityId) {
    const vacation = this.vacations.find(v => v.id === vacationId);
    if (!vacation) return false;

    const day = vacation.days[dayIndex];
    day.activities = day.activities.filter(a => a.id !== activityId);
    this.saveVacations();
    return true;
  }

  /**
   * ========== GESTIONE NOTE GIORNALIERE ==========
   */
  saveNotes(vacationId, dayIndex, notes) {
    const vacation = this.vacations.find(v => v.id === vacationId);
    if (vacation && vacation.days[dayIndex]) {
      vacation.days[dayIndex].notes = notes;
      this.saveVacations();
      return true;
    }
    return false;
  }

  /**
   * ========== GESTIONE FOTO ==========
   */
  addPhoto(vacationId, dayIndex, activityId, imageData) {
    const vacation = this.vacations.find(v => v.id === vacationId);
    if (!vacation) return false;

    const activity = vacation.days[dayIndex].activities.find(a => a.id === activityId);
    if (activity) {
      if (!activity.photos) activity.photos = [];
      activity.photos.push(imageData);
      this.saveVacations();
      return true;
    }
    return false;
  }

  deletePhoto(vacationId, dayIndex, activityId, photoIndex) {
    const vacation = this.vacations.find(v => v.id === vacationId);
    if (!vacation) return false;

    const activity = vacation.days[dayIndex].activities.find(a => a.id === activityId);
    if (activity && activity.photos) {
      activity.photos.splice(photoIndex, 1);
      this.saveVacations();
      return true;
    }
    return false;
  }

  /**
   * ========== STATISTICHE E GRAFICI ==========
   */
  calculateBudgetStats(vacationId) {
    const vacation = this.vacations.find(v => v.id === vacationId);
    if (!vacation) return { spent: 0, remaining: 0, percentage: 0 };

    let spent = 0;
    vacation.days.forEach(day => {
      day.activities.forEach(activity => {
        spent += activity.cost;
      });
    });

    const remaining = vacation.totalBudget - spent;
    const percentage = vacation.totalBudget > 0 
      ? Math.round((spent / vacation.totalBudget) * 100) 
      : 0;

    return { spent, remaining, percentage };
  }

  calculateByCategory(vacationId) {
    const vacation = this.vacations.find(v => v.id === vacationId);
    if (!vacation) return {};

    const categories = {
      trasporti: 0,
      cibo: 0,
      alloggio: 0,
      attivita: 0,
      altro: 0
    };

    vacation.days.forEach(day => {
      day.activities.forEach(activity => {
        const cat = activity.category;
        if (categories[cat] !== undefined) {
          categories[cat] += activity.cost;
        }
      });
    });

    return categories;
  }

  /**
   * ========== EXPORT/IMPORT ==========
   */
  exportToJSON(vacationId) {
    const vacation = this.vacations.find(v => v.id === vacationId);
    if (!vacation) return null;

    const dataStr = JSON.stringify(vacation, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${vacation.name}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  exportAllToJSON() {
    if (this.vacations.length === 0) {
      alert('⚠️ Nessuna vacanza da esportare!');
      return;
    }

    const dataStr = JSON.stringify(this.vacations, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vacanze_cilento_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  importFromJSON(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        
        if (Array.isArray(data)) {
          // Importa array di vacanze
          this.vacations = [...this.vacations, ...data];
        } else {
          // Importa singola vacanza
          this.vacations.push(data);
        }

        this.saveVacations();
        this.renderVacations();
        alert('✅ Vacanze importate con successo!');
      } catch (error) {
        alert('❌ Errore nell\'importazione: ' + error.message);
      }
    };
    reader.readAsText(file);
  }

  /**
   * ========== SHARING ==========
   */
  generateShareLink() {
    if (!this.currentVacationId) {
      alert('Seleziona una vacanza prima!');
      return;
    }

    const vacation = this.vacations.find(v => v.id === this.currentVacationId);
    if (!vacation) return;

    // Genera QR Code
    const qrContainer = document.getElementById('qrCodeContainer');
    if (!qrContainer) return;

    qrContainer.innerHTML = '';
    
    const shareData = {
      name: vacation.name,
      destination: vacation.destination,
      dates: `${vacation.startDate} → ${vacation.endDate}`,
      budget: vacation.totalBudget
    };

    const shareText = `Vacanza: ${shareData.name} a ${shareData.destination} (${shareData.dates}) - Budget: €${shareData.budget}`;
    const shareUrl = `${window.location.href}?share=${encodeURIComponent(JSON.stringify(shareData))}`;

    // QR Code
    new QRCode(qrContainer, {
      text: shareUrl,
      width: 200,
      height: 200
    });

    // Copy link
    const linkInput = document.getElementById('shareLink');
    if (linkInput) {
      linkInput.value = shareUrl;
    }

    alert('✅ QR Code generato! Puoi condividere il link!');
  }

  /**
   * ========== UTILITY ==========
   */
  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  switchTab(tabName) {
    document.querySelectorAll('[data-tab]').forEach(tab => {
      tab.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById(`${tabName}-content`).classList.add('active');
  }

  /**
   * ========== RENDERING ==========
   */
  renderVacations() {
    const container = document.getElementById('vacationsList');
    if (!container) return;

    if (this.vacations.length === 0) {
      container.innerHTML = '<p class="empty-state">📭 Nessuna vacanza ancora. Creane una!</p>';
      return;
    }

    container.innerHTML = this.vacations.map((vacation, index) => `
      <div class="vacation-card" data-vacation-id="${vacation.id}">
        <div class="vacation-header">
          <h3>${vacation.name}</h3>
          <span class="destination">${vacation.destination}</span>
        </div>
        <div class="vacation-info">
          <p>📅 ${this.formatDate(vacation.startDate)} → ${this.formatDate(vacation.endDate)}</p>
          <p>💰 Budget totale: €${vacation.totalBudget.toFixed(2)}</p>
        </div>
        <div class="vacation-actions">
          <button class="btn btn-primary" onclick="planner.openVacation('${vacation.id}')">Visualizza</button>
          <button class="btn btn-secondary" onclick="planner.exportToJSON('${vacation.id}')">Scarica</button>
          <button class="btn btn-danger" onclick="planner.deleteVacation('${vacation.id}')">Elimina</button>
        </div>
      </div>
    `).join('');
  }

  openVacation(vacationId) {
    this.currentVacationId = vacationId;
    this.renderVacationDetail();
    this.switchTab('manage');
  }

  renderVacationDetail() {
    const vacation = this.vacations.find(v => v.id === this.currentVacationId);
    if (!vacation) return;

    const detailContainer = document.getElementById('vacationDetail');
    if (!detailContainer) return;

    const stats = this.calculateBudgetStats(this.currentVacationId);
    const categoryStats = this.calculateByCategory(this.currentVacationId);

    let html = `
      <div class="vacation-detail-header">
        <h2>${vacation.name}</h2>
        <p class="destination">${vacation.destination}</p>
      </div>

      <div class="stats-container">
        <div class="stat-card">
          <h4>Budget Totale</h4>
          <p class="amount">€${vacation.totalBudget.toFixed(2)}</p>
        </div>
        <div class="stat-card">
          <h4>Speso</h4>
          <p class="amount spent">€${stats.spent.toFixed(2)}</p>
        </div>
        <div class="stat-card">
          <h4>Rimanente</h4>
          <p class="amount">€${stats.remaining.toFixed(2)}</p>
        </div>
        <div class="stat-card">
          <h4>Percentuale</h4>
          <p class="amount">${stats.percentage}%</p>
        </div>
      </div>

      <div class="chart-container">
        <h3>Spesa per Categoria</h3>
        <canvas id="categoryChart"></canvas>
      </div>

      <div class="days-container">
    `;

    vacation.days.forEach((day, dayIndex) => {
      const dayDate = new Date(day.date);
      const dayName = dayDate.toLocaleDateString('it-IT', { weekday: 'long' });

      html += `
        <div class="day-section">
          <div class="day-header">
            <h3>Giorno ${day.dayNumber} - ${dayName} (${this.formatDate(day.date)})</h3>
            <button class="btn btn-small" onclick="planner.editNotes('${this.currentVacationId}', ${dayIndex})">
              📝 Note
            </button>
          </div>

          <div class="notes-section">
            <textarea 
              id="notes-${dayIndex}" 
              class="day-notes" 
              placeholder="Aggiungi note per questo giorno..."
              onchange="planner.saveNotes('${this.currentVacationId}', ${dayIndex}, this.value)"
            >${day.notes}</textarea>
          </div>

          <div class="activities-section">
            ${day.activities.length > 0 ? `
              <h4>Attività (${day.activities.length})</h4>
              ${day.activities.map((activity, actIndex) => `
                <div class="activity-card category-${activity.category}">
                  <div class="activity-header">
                    <h5>${activity.name}</h5>
                    <span class="category-badge">${this.getCategoryIcon(activity.category)} ${activity.category}</span>
                  </div>

                  <div class="activity-details">
                    <p><strong>📍 Location:</strong> ${activity.location}</p>
                    <p><strong>⏰ Orario:</strong> ${activity.timeSlot}${activity.specificTime ? ` (${activity.specificTime})` : ''}</p>
                    <p><strong>💰 Costo:</strong> €${activity.cost.toFixed(2)}</p>
                    ${activity.description ? `<p><strong>📝 Descrizione:</strong> ${activity.description}</p>` : ''}
                    ${activity.link ? `<p><strong>🔗 Link:</strong> <a href="${activity.link}" target="_blank">Apri</a></p>` : ''}
                  </div>

                  <div class="activity-photos">
                    ${activity.photos && activity.photos.length > 0 ? `
                      <div class="photo-gallery">
                        ${activity.photos.map((photo, photoIndex) => `
                          <div class="photo-item">
                            <img src="${photo}" alt="foto">
                            <button class="btn-delete-photo" onclick="planner.deletePhoto('${this.currentVacationId}', ${dayIndex}, '${activity.id}', ${photoIndex})">×</button>
                          </div>
                        `).join('')}
                      </div>
                    ` : ''}
                    <label class="upload-photo">
                      <input type="file" accept="image/*" onchange="planner.handlePhotoUpload(event, '${this.currentVacationId}', ${dayIndex}, '${activity.id}')">
                      📸 Aggiungi foto
                    </label>
                  </div>

                  <div class="activity-actions">
                    <button class="btn btn-small" onclick="planner.editActivity('${this.currentVacationId}', ${dayIndex}, '${activity.id}')">Modifica</button>
                    <button class="btn btn-small btn-danger" onclick="planner.deleteActivity('${this.currentVacationId}', ${dayIndex}, '${activity.id}')">Elimina</button>
                  </div>
                </div>
              `).join('')}
            ` : '<p class="empty-state">Nessuna attività per questo giorno</p>'}
          </div>

          <button class="btn btn-add" onclick="planner.showActivityForm('${this.currentVacationId}', ${dayIndex})">
            ➕ Aggiungi Attività
          </button>
        </div>
      `;
    });

    html += '</div>';
    detailContainer.innerHTML = html;

    // Genera grafico
    setTimeout(() => this.generateCategoryChart(categoryStats), 100);
  }

  generateCategoryChart(categoryStats) {
    const ctx = document.getElementById('categoryChart');
    if (!ctx) return;

    const labels = ['Trasporti', 'Cibo', 'Alloggio', 'Attività', 'Altro'];
    const data = [
      categoryStats.trasporti || 0,
      categoryStats.cibo || 0,
      categoryStats.alloggio || 0,
      categoryStats.attivita || 0,
      categoryStats.altro || 0
    ];

    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'];

    if (window.categoryChartInstance) {
      window.categoryChartInstance.destroy();
    }

    window.categoryChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors,
          borderColor: '#fff',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });
  }

  handlePhotoUpload(event, vacationId, dayIndex, activityId) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      this.addPhoto(vacationId, dayIndex, activityId, e.target.result);
      this.renderVacationDetail();
    };
    reader.readAsDataURL(file);
  }

  editNotes(vacationId, dayIndex) {
    // La textarea è già inline
  }

  showActivityForm(vacationId, dayIndex) {
    const modal = document.getElementById('activityModal');
    if (!modal) return;

    modal.innerHTML = `
      <div class="modal-content">
        <h2>Aggiungi Attività</h2>
        <form id="activityForm" onsubmit="planner.submitActivity(event, '${vacationId}', ${dayIndex})">
          <input type="text" name="name" placeholder="Nome attività" required>
          <input type="text" name="location" placeholder="Luogo" required>
          
          <select name="category" required>
            <option value="">-- Categoria --</option>
            <option value="trasporti">✈️ Trasporti</option>
            <option value="cibo">🍽️ Cibo</option>
            <option value="alloggio">🏨 Alloggio</option>
            <option value="attivita">🎭 Attività</option>
            <option value="altro">📌 Altro</option>
          </select>

          <select name="timeSlot" required>
            <option value="">-- Fascia Oraria --</option>
            <option value="mattina">🌅 Mattina</option>
            <option value="pomeriggio">☀️ Pomeriggio</option>
            <option value="sera">🌙 Sera</option>
          </select>

          <input type="time" name="specificTime" placeholder="Orario specifico (opzionale)">
          <input type="number" name="cost" placeholder="Costo (€)" step="0.01" required>
          <textarea name="description" placeholder="Descrizione (opzionale)"></textarea>
          <input type="url" name="link" placeholder="Link (opzionale)">

          <div class="form-actions">
            <button type="submit" class="btn btn-primary">Salva Attività</button>
            <button type="button" class="btn btn-secondary" onclick="planner.closeModal()">Annulla</button>
          </div>
        </form>
      </div>
    `;

    modal.style.display = 'flex';
  }

  editActivity(vacationId, dayIndex, activityId) {
    const vacation = this.vacations.find(v => v.id === vacationId);
    const activity = vacation.days[dayIndex].activities.find(a => a.id === activityId);

    const modal = document.getElementById('activityModal');
    if (!modal) return;

    modal.innerHTML = `
      <div class="modal-content">
        <h2>Modifica Attività</h2>
        <form id="activityForm" onsubmit="planner.submitActivityUpdate(event, '${vacationId}', ${dayIndex}, '${activityId}')">
          <input type="text" name="name" value="${activity.name}" required>
          <input type="text" name="location" value="${activity.location}" required>
          
          <select name="category" required>
            <option value="trasporti" ${activity.category === 'trasporti' ? 'selected' : ''}>✈️ Trasporti</option>
            <option value="cibo" ${activity.category === 'cibo' ? 'selected' : ''}>🍽️ Cibo</option>
            <option value="alloggio" ${activity.category === 'alloggio' ? 'selected' : ''}>🏨 Alloggio</option>
            <option value="attivita" ${activity.category === 'attivita' ? 'selected' : ''}>🎭 Attività</option>
            <option value="altro" ${activity.category === 'altro' ? 'selected' : ''}>📌 Altro</option>
          </select>

          <select name="timeSlot" required>
            <option value="mattina" ${activity.timeSlot === 'mattina' ? 'selected' : ''}>🌅 Mattina</option>
            <option value="pomeriggio" ${activity.timeSlot === 'pomeriggio' ? 'selected' : ''}>☀️ Pomeriggio</option>
            <option value="sera" ${activity.timeSlot === 'sera' ? 'selected' : ''}>🌙 Sera</option>
          </select>

          <input type="time" name="specificTime" value="${activity.specificTime}" placeholder="Orario specifico">
          <input type="number" name="cost" value="${activity.cost}" step="0.01" required>
          <textarea name="description">${activity.description}</textarea>
          <input type="url" name="link" value="${activity.link}">

          <div class="form-actions">
            <button type="submit" class="btn btn-primary">Aggiorna</button>
            <button type="button" class="btn btn-secondary" onclick="planner.closeModal()">Annulla</button>
          </div>
        </form>
      </div>
    `;

    modal.style.display = 'flex';
  }

  submitActivity(event, vacationId, dayIndex) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);

    this.addActivity(vacationId, dayIndex, data);
    this.renderVacationDetail();
    this.closeModal();
  }

  submitActivityUpdate(event, vacationId, dayIndex, activityId) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);

    data.cost = parseFloat(data.cost);
    this.updateActivity(vacationId, dayIndex, activityId, data);
    this.renderVacationDetail();
    this.closeModal();
  }

  showCreateForm() {
    const modal = document.getElementById('activityModal');
    if (!modal) return;

    modal.innerHTML = `
      <div class="modal-content">
        <h2>Nuova Vacanza</h2>
        <form id="vacationForm" onsubmit="planner.submitCreateVacation(event)">
          <input type="text" name="name" placeholder="Nome della vacanza" required>
          <input type="text" name="destination" placeholder="Destinazione" required>
          <input type="date" name="startDate" required>
          <input type="date" name="endDate" required>
          <input type="number" name="totalBudget" placeholder="Budget totale (€)" step="0.01" required>

          <div class="form-actions">
            <button type="submit" class="btn btn-primary">Crea Vacanza</button>
            <button type="button" class="btn btn-secondary" onclick="planner.closeModal()">Annulla</button>
          </div>
        </form>
      </div>
    `;

    modal.style.display = 'flex';
  }

  submitCreateVacation(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);

    if (this.createVacation(data)) {
      this.closeModal();
    }
  }

  clearCreateForm() {
    const form = document.getElementById('vacationForm');
    if (form) form.reset();
  }

  closeModal() {
    const modal = document.getElementById('activityModal');
    if (modal) modal.style.display = 'none';
  }

  /**
   * ========== HELPER FUNCTIONS ==========
   */
  formatDate(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('it-IT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getCategoryIcon(category) {
    const icons = {
      trasporti: '✈️',
      cibo: '🍽️',
      alloggio: '🏨',
      attivita: '🎭',
      altro: '📌'
    };
    return icons[category] || '📌';
  }
}

// ========== INIZIALIZZAZIONE GLOBALE ==========
let planner;
document.addEventListener('DOMContentLoaded', () => {
  planner = new VacationPlanner();
});
