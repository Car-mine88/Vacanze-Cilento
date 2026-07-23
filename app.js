// ==================== SUPABASE CONFIG ====================
const SUPABASE_URL = 'https://oxavcnclbbibactjquse.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94YXZjbmNsYmJpYmFjdGpxdXNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2ODQyMTIsImV4cCI6MjEwMDI2MDIxMn0.193nK6TYTK91B1TkXI-nWIl7Z40zxrr83vGbu4Zgq4s';

let supabase;

// Aspetta che Supabase sia caricato
function initSupabase() {
  if (window.supabase && window.supabase.SupabaseClient) {
    supabase = new window.supabase.SupabaseClient(SUPABASE_URL, SUPABASE_KEY);
    console.log('✅ Supabase connesso!');
    return true;
  }
  console.error('❌ Supabase non caricato!');
  return false;
}

// Tenta di inizializzare subito
if (!initSupabase()) {
  // Se non è pronto, aspetta 500ms e riprova
  setTimeout(initSupabase, 500);
}


// ==================== USER ID ====================
let currentUserId = localStorage.getItem('vacanze_user_id');
if (!currentUserId) {
  currentUserId = 'user_' + Math.random().toString(36).substr(2, 9);
  localStorage.setItem('vacanze_user_id', currentUserId);
}

// ==================== VACATION PLANNER CLASS ====================
class VacationPlanner {
  constructor() {
    this.vacations = [];
    this.currentVacationIndex = -1;
    this.init();
  }

  async init() {
    await this.loadVacationsFromSupabase();
    this.render();
    this.setupEventListeners();
    this.setupAutoSync();
  }

  // ==================== SUPABASE OPERATIONS ====================
  async loadVacationsFromSupabase() {
    try {
      const { data, error } = await supabase
        .from('vacations')
        .select('*')
        .eq('user_id', currentUserId);

      if (error) throw error;

      this.vacations = data.map(row => ({
        id: row.id,
        name: row.name,
        ...row.data
      })) || [];

      console.log('✅ Vacanze caricate da Supabase:', this.vacations);
    } catch (error) {
      console.error('❌ Errore caricamento Supabase:', error);
      this.loadVacationsFromLocalStorage();
    }
  }

  loadVacationsFromLocalStorage() {
    const saved = localStorage.getItem('vacanze_data');
    this.vacations = saved ? JSON.parse(saved) : [];
  }

  async saveVacationToSupabase(vacation) {
    try {
      const { id, name, ...data } = vacation;
      
      if (id && id.startsWith('local_')) {
        // È una nuova vacanza, inserisci
        const { data: newRow, error } = await supabase
          .from('vacations')
          .insert([{
            user_id: currentUserId,
            name: name,
            data: data
          }])
          .select();

        if (error) throw error;
        
        vacation.id = newRow[0].id;
        return vacation;
      } else {
        // Aggiorna vacanza esistente
        const { error } = await supabase
          .from('vacations')
          .update({
            name: name,
            data: data,
            updated_at: new Date().toISOString()
          })
          .eq('id', id);

        if (error) throw error;
        return vacation;
      }
    } catch (error) {
      console.error('❌ Errore salvataggio Supabase:', error);
      throw error;
    }
  }

  async deleteVacationFromSupabase(vacationId) {
    try {
      const { error } = await supabase
        .from('vacations')
        .delete()
        .eq('id', vacationId);

      if (error) throw error;
      console.log('✅ Vacanza eliminata da Supabase');
    } catch (error) {
      console.error('❌ Errore eliminazione Supabase:', error);
    }
  }

  // ==================== AUTO SYNC ====================
  setupAutoSync() {
    // Sincronizza ogni 10 secondi
    setInterval(async () => {
      await this.loadVacationsFromSupabase();
      this.render();
    }, 10000);
  }

  // ==================== VACATION METHODS ====================
  addVacation(name) {
    const vacation = {
      id: 'local_' + Date.now(),
      name: name,
      activities: [],
      budget: 0,
      expenses: 0
    };

    this.vacations.push(vacation);
    this.saveVacationToSupabase(vacation);
    this.render();
  }

  deleteVacation(index) {
    const vacation = this.vacations[index];
    if (vacation.id && !vacation.id.startsWith('local_')) {
      this.deleteVacationFromSupabase(vacation.id);
    }
    this.vacations.splice(index, 1);
    this.currentVacationIndex = -1;
    this.render();
  }

  // ==================== ACTIVITY METHODS ====================
  addActivity(name, cost, link, category) {
    if (this.currentVacationIndex < 0) return;

    const vacation = this.vacations[this.currentVacationIndex];
    if (!vacation.activities) vacation.activities = [];

    const activity = {
      id: 'act_' + Date.now(),
      name: name,
      cost: parseFloat(cost) || 0,
      link: link || '',
      category: category || 'Altro',
      photos: [],
      timeSlot: ''
    };

    vacation.activities.push(activity);
    vacation.expenses = (vacation.expenses || 0) + activity.cost;
    this.saveVacationToSupabase(vacation);
    this.render();
  }

  updateActivity(activityIndex, name, cost, link, category, timeSlot) {
    if (this.currentVacationIndex < 0) return;

    const vacation = this.vacations[this.currentVacationIndex];
    const activity = vacation.activities[activityIndex];

    const oldCost = activity.cost;
    activity.name = name;
    activity.cost = parseFloat(cost) || 0;
    activity.link = link;
    activity.category = category;
    activity.timeSlot = timeSlot;

    vacation.expenses = (vacation.expenses || 0) - oldCost + activity.cost;
    this.saveVacationToSupabase(vacation);
    this.render();
  }

  editActivity(activityIndex) {
    if (this.currentVacationIndex < 0) return;

    const vacation = this.vacations[this.currentVacationIndex];
    const activity = vacation.activities[activityIndex];

    const newName = prompt('Nome attività:', activity.name);
    if (newName === null) return;

    const newCost = prompt('Costo (€):', activity.cost);
    if (newCost === null) return;

    const newLink = prompt('Link:', activity.link || '');
    if (newLink === null) return;

    const newCategory = prompt('Categoria:', activity.category || 'Altro');
    if (newCategory === null) return;

    const newTimeSlot = prompt('Orario:', activity.timeSlot || '');
    if (newTimeSlot === null) return;

    this.updateActivity(activityIndex, newName, newCost, newLink, newCategory, newTimeSlot);
  }

  deleteActivity(activityIndex) {
    if (this.currentVacationIndex < 0) return;

    const vacation = this.vacations[this.currentVacationIndex];
    const activity = vacation.activities[activityIndex];

    vacation.expenses = (vacation.expenses || 0) - activity.cost;
    vacation.activities.splice(activityIndex, 1);

    this.saveVacationToSupabase(vacation);
    this.render();
  }

  // ==================== PHOTO METHODS ====================
  addPhoto(activityIndex, file) {
    if (this.currentVacationIndex < 0) return;

    const vacation = this.vacations[this.currentVacationIndex];
    const activity = vacation.activities[activityIndex];

    if (!activity.photos) activity.photos = [];
    if (activity.photos.length >= 3) {
      alert('Massimo 3 foto per attività');
      return;
    }

    if (file.size > 1024 * 1024) {
      alert('Foto troppo grande (max 1MB)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      activity.photos.push(e.target.result);
      this.saveVacationToSupabase(vacation);
      this.render();
    };
    reader.readAsDataURL(file);
  }

  deletePhoto(activityIndex, photoIndex) {
    if (this.currentVacationIndex < 0) return;

    const vacation = this.vacations[this.currentVacationIndex];
    vacation.activities[activityIndex].photos.splice(photoIndex, 1);

    this.saveVacationToSupabase(vacation);
    this.render();
  }

  // ==================== BUDGET METHODS ====================
  updateBudget(budget) {
    if (this.currentVacationIndex < 0) return;

    this.vacations[this.currentVacationIndex].budget = parseFloat(budget) || 0;
    this.saveVacationToSupabase(this.vacations[this.currentVacationIndex]);
    this.render();
  }

  // ==================== EXPORT/IMPORT ====================
  exportData() {
    const dataStr = JSON.stringify(this.vacations, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'vacanze_export.json';
    link.click();
  }

  importData(file) {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        
        for (const vacation of imported) {
          const newVac = {
            id: 'local_' + Date.now(),
            name: vacation.name,
            activities: vacation.activities || [],
            budget: vacation.budget || 0,
            expenses: vacation.expenses || 0
          };
          await this.saveVacationToSupabase(newVac);
        }

        await this.loadVacationsFromSupabase();
        this.render();
        alert('✅ Dati importati con successo!');
      } catch (error) {
        alert('❌ Errore importazione: ' + error.message);
      }
    };
    reader.readAsText(file);
  }

  // ==================== RENDER ====================
  render() {
    const app = document.getElementById('app');

    if (this.currentVacationIndex < 0) {
      this.renderVacationList(app);
    } else {
      this.renderVacationDetail(app);
    }
  }

  renderVacationList(app) {
    app.innerHTML = `
      <div class="container">
        <header>
          <h1>🏖️ Vacanze Cilento</h1>
          <p style="font-size: 12px; color: #999;">v3.5-Supabase | ID: ${currentUserId}</p>
        </header>

        <section>
          <h2>Le mie vacanze</h2>
          <div class="vacation-list">
            ${this.vacations.map((v, i) => `
              <div class="vacation-card">
                <div>
                  <h3>${v.name}</h3>
                  <p>📍 ${v.activities?.length || 0} attività</p>
                  <p>💰 €${(v.expenses || 0).toFixed(2)} / €${(v.budget || 0).toFixed(2)}</p>
                </div>
                <div class="card-buttons">
                  <button onclick="planner.currentVacationIndex = ${i}; planner.render();">📖</button>
                  <button onclick="planner.deleteVacation(${i}); planner.render();">🗑️</button>
                </div>
              </div>
            `).join('')}
          </div>

          <div style="margin-top: 20px;">
            <input type="text" id="vacationName" placeholder="Nome vacanza" style="width: 100%; padding: 10px; margin-bottom: 10px;">
            <button onclick="planner.addVacation(document.getElementById('vacationName').value); document.getElementById('vacationName').value = '';" style="width: 100%; padding: 10px; background: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer;">
              ➕ Aggiungi vacanza
            </button>
          </div>
        </section>

        <section style="margin-top: 20px;">
          <h2>⚙️ Impostazioni</h2>
          <button onclick="planner.exportData();" style="width: 100%; padding: 10px; margin-bottom: 10px; background: #2196F3; color: white; border: none; border-radius: 5px; cursor: pointer;">
            📥 Esporta dati
          </button>
          <input type="file" id="importFile" accept=".json" style="display: none;">
          <button onclick="document.getElementById('importFile').click();" style="width: 100%; padding: 10px; background: #FF9800; color: white; border: none; border-radius: 5px; cursor: pointer;">
            📤 Importa dati
          </button>
        </section>
      </div>
    `;

    document.getElementById('importFile').addEventListener('change', (e) => {
      if (e.target.files[0]) {
        this.importData(e.target.files[0]);
      }
    });
  }

  renderVacationDetail(app) {
    const vacation = this.vacations[this.currentVacationIndex];

    app.innerHTML = `
      <div class="container">
        <header>
          <button onclick="planner.currentVacationIndex = -1; planner.render();" style="background: none; border: none; font-size: 24px; cursor: pointer;">⬅️</button>
          <h1>${vacation.name}</h1>
        </header>

        <section>
          <h2>💰 Budget</h2>
          <input type="number" id="budgetInput" placeholder="Budget totale" value="${vacation.budget || 0}" style="width: 100%; padding: 10px; margin-bottom: 10px;">
          <button onclick="planner.updateBudget(document.getElementById('budgetInput').value); planner.render();" style="width: 100%; padding: 10px; background: #2196F3; color: white; border: none; border-radius: 5px; cursor: pointer;">
            💾 Salva budget
          </button>
          <p style="margin-top: 10px;">Spese: €${(vacation.expenses || 0).toFixed(2)} / €${(vacation.budget || 0).toFixed(2)}</p>
          <div style="background: #f0f0f0; height: 20px; border-radius: 10px; overflow: hidden; margin-top: 10px;">
            <div style="background: ${(vacation.expenses || 0) > (vacation.budget || 0) ? '#ff6b6b' : '#4CAF50'}; height: 100%; width: ${Math.min(100, ((vacation.expenses || 0) / (vacation.budget || 0) * 100) || 0)}%;"></div>
          </div>
        </section>

        <section>
          <h2>📅 Attività</h2>
          <div class="activity-list">
            ${(vacation.activities || []).map((activity, i) => `
              <div class="activity-card">
                <div>
                  <h3>${activity.name}</h3>
                  <p>💰 €${activity.cost || 0}</p>
                  <p>🏷️ ${activity.category || 'Altro'}</p>
                  ${activity.timeSlot ? `<p>⏰ ${activity.timeSlot}</p>` : ''}
                  ${activity.link ? `<p><a href="${activity.link}" target="_blank">🔗 Link</a></p>` : ''}
                </div>
                <div class="card-buttons">
                  <button onclick="planner.editActivity(${i});">✏️</button>
                  <button onclick="planner.deleteActivity(${i}); planner.render();">🗑️</button>
                </div>
              </div>
            `).join('')}
          </div>

          <div style="margin-top: 20px;">
            <input type="text" id="activityName" placeholder="Nome attività" style="width: 100%; padding: 10px; margin-bottom: 10px;">
            <input type="number" id="activityCost" placeholder="Costo (€)" style="width: 100%; padding: 10px; margin-bottom: 10px;">
            <input type="text" id="activityLink" placeholder="Link (opzionale)" style="width: 100%; padding: 10px; margin-bottom: 10px;">
            <input type="text" id="activityCategory" placeholder="Categoria" style="width: 100%; padding: 10px; margin-bottom: 10px;">
            <input type="text" id="activityTimeSlot" placeholder="Orario (opzionale)" style="width: 100%; padding: 10px; margin-bottom: 10px;">
            <button onclick="planner.addActivity(document.getElementById('activityName').value, document.getElementById('activityCost').value, document.getElementById('activityLink').value, document.getElementById('activityCategory').value); document.getElementById('activityName').value = ''; document.getElementById('activityCost').value = ''; document.getElementById('activityLink').value = ''; document.getElementById('activityCategory').value = '';" style="width: 100%; padding: 10px; background: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer;">
              ➕ Aggiungi attività
            </button>
          </div>
        </section>
      </div>
    `;
  }

  setupEventListeners() {
    // Auto-save per input
    document.addEventListener('change', () => {
      if (this.currentVacationIndex >= 0) {
        this.saveVacationToSupabase(this.vacations[this.currentVacationIndex]);
      }
    });
  }
}

// ==================== INIT ====================
let planner;
document.addEventListener('DOMContentLoaded', () => {
  planner = new VacationPlanner();
});
