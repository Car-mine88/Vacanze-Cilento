// REPOSITORY ATTIVITÀ (predefinite)
const attivitaRepository = {
  giorno: [
    { id: 1, nome: "Visita Spiaggia", luogo: "Marina di Camerota", categoria: "giorno" },
    { id: 2, nome: "Trekking", luogo: "Monti Cilento", categoria: "giorno" },
    { id: 3, nome: "Snorkeling", luogo: "Isola di Dino", categoria: "giorno" },
    { id: 4, nome: "Kayak", luogo: "Fiordo di Furore", categoria: "giorno" },
    { id: 5, nome: "Visita Centro Storico", luogo: "Salerno", categoria: "giorno" },
    { id: 6, nome: "Escursione in Barca", luogo: "Golfo di Policastro", categoria: "giorno" },
    { id: 7, nome: "Bicicletta", luogo: "Strada Costiera", categoria: "giorno" },
  ],
  sera: [
    { id: 8, nome: "Cena al Ristorante", luogo: "Palinuro", categoria: "sera" },
    { id: 9, nome: "Sagra Locale", luogo: "Centola", categoria: "sera" },
    { id: 10, nome: "Concerto Live", luogo: "Piazza Municipio", categoria: "sera" },
    { id: 11, nome: "Passeggiata Lungomare", luogo: "Ascea Marina", categoria: "sera" },
    { id: 12, nome: "Cena Pesce", luogo: "Agropoli", categoria: "sera" },
    { id: 13, nome: "Festival", luogo: "Vallo della Lucania", categoria: "sera" },
    { id: 14, nome: "Gelateria", luogo: "Via Principale", categoria: "sera" },
  ]
};

// DATI VACANZE
let vacanze = JSON.parse(localStorage.getItem("vacanze")) || [];

// UI ELEMENTS
const vacanzaInput = document.getElementById("vacanzaInput");
const dataInizioInput = document.getElementById("dataInizioInput");
const dataFineInput = document.getElementById("dataFineInput");
const aggiungiVacanzaBtn = document.getElementById("aggiungiVacanzaBtn");
const vacanzaSelect = document.getElementById("vacanzaSelect");
const categoriaSelect = document.getElementById("categoriaSelect");
const attivitaSelect = document.getElementById("attivitaSelect");
const attivitaInput = document.getElementById("attivitaInput");
const luogoInput = document.getElementById("luogoInput");
const budgetInput = document.getElementById("budgetInput");
const aggiungiAttivitaBtn = document.getElementById("aggiungiAttivitaBtn");
const listaAttivita = document.getElementById("listaAttivita");
const totaleBudget = document.getElementById("totaleBudget");

// EVENT LISTENERS
aggiungiVacanzaBtn.addEventListener("click", aggiungiVacanza);
aggiungiAttivitaBtn.addEventListener("click", aggiungiAttivita);
vacanzaSelect.addEventListener("change", aggiorna);
categoriaSelect.addEventListener("change", aggiornaSelezioneAttivita);
attivitaSelect.addEventListener("change", selezionaAttivitaDaRepository);

// FUNZIONI

function aggiungiVacanza() {
  const nome = vacanzaInput.value.trim();
  const dataInizio = dataInizioInput.value;
  const dataFine = dataFineInput.value;

  if (!nome || !dataInizio || !dataFine) {
    alert("Inserisci nome e date!");
    return;
  }

  const vacanza = {
    id: Date.now(),
    nome,
    dataInizio,
    dataFine,
    attivita: []
  };

  vacanze.push(vacanza);
  salvaVacanze();
  aggiorna();
  
  vacanzaInput.value = "";
  dataInizioInput.value = "";
  dataFineInput.value = "";
}

function aggiorna() {
  aggiornaSelectVacanze();
  aggiornaAttivita();
}

function aggiornaSelectVacanze() {
  vacanzaSelect.innerHTML = '<option value="">Seleziona vacanza...</option>';
  
  vacanze.forEach(v => {
    const option = document.createElement("option");
    option.value = v.id;
    option.textContent = v.nome;
    vacanzaSelect.appendChild(option);
  });
}

function aggiornaSelezioneAttivita() {
  const categoria = categoriaSelect.value;
  attivitaSelect.innerHTML = '<option value="">Scegli dal repository...</option>';
  attivitaInput.value = "";
  luogoInput.value = "";

  if (categoria) {
    const attivita = attivitaRepository[categoria] || [];
    attivita.forEach(a => {
      const option = document.createElement("option");
      option.value = JSON.stringify(a);
      option.textContent = `${a.nome} - ${a.luogo}`;
      attivitaSelect.appendChild(option);
    });
  }
}

// Quando selezioni dal repository, compila i campi
function selezionaAttivitaDaRepository() {
  const selezionato = attivitaSelect.value;
  if (selezionato) {
    const attivita = JSON.parse(selezionato);
    attivitaInput.value = attivita.nome;
    luogoInput.value = attivita.luogo;
  } else {
    attivitaInput.value = "";
    luogoInput.value = "";
  }
}

function aggiungiAttivita() {
  const vacanzaId = vacanzaSelect.value;
  const categoria = categoriaSelect.value;
  const nomeAttivita = attivitaInput.value.trim();
  const luogo = luogoInput.value.trim();
  const budget = budgetInput.value;

  if (!vacanzaId || !categoria || !nomeAttivita || !luogo) {
    alert("Completa tutti i campi!");
    return;
  }

  const attivita = {
    id: Date.now(),
    nome: nomeAttivita,
    luogo: luogo,
    categoria: categoria,
    budget: parseFloat(budget) || 0
  };

  const vacanza = vacanze.find(v => v.id == vacanzaId);
  if (vacanza) {
    vacanza.attivita.push(attivita);
    salvaVacanze();
    aggiornaAttivita();
    
    // Reset form
    categoriaSelect.value = "";
    attivitaSelect.innerHTML = '<option value="">Scegli dal repository...</option>';
    attivitaInput.value = "";
    luogoInput.value = "";
    budgetInput.value = "";
  }
}

function aggiornaAttivita() {
  const vacanzaId = vacanzaSelect.value;
  listaAttivita.innerHTML = "";

  if (!vacanzaId) {
    totaleBudget.textContent = "0.00";
    return;
  }

  const vacanza = vacanze.find(v => v.id == vacanzaId);
  if (!vacanza) return;

  // Dividi attività per categoria
  const attivitaGiorno = vacanza.attivita.filter(a => a.categoria === "giorno");
  const attivitaSera = vacanza.attivita.filter(a => a.categoria === "sera");

  // Mostra attività GIORNO
  if (attivitaGiorno.length > 0) {
    const titolo = document.createElement("h4");
    titolo.textContent = "☀️ Attività Giorno";
    titolo.style.color = "#FFA500";
    listaAttivita.appendChild(titolo);

    attivitaGiorno.forEach((a, index) => {
      const li = creaElementoAttivita(a, vacanza.id, index, "giorno");
      listaAttivita.appendChild(li);
    });
  }

  // Mostra attività SERA
  if (attivitaSera.length > 0) {
    const titolo = document.createElement("h4");
    titolo.textContent = "🌙 Attività Sera";
    titolo.style.color = "#1a1a2e";
    listaAttivita.appendChild(titolo);

    attivitaSera.forEach((a, index) => {
      const li = creaElementoAttivita(a, vacanza.id, index, "sera");
      listaAttivita.appendChild(li);
    });
  }

  // Calcola budget totale
  const totale = vacanza.attivita.reduce((sum, a) => sum + (a.budget || 0), 0);
  totaleBudget.textContent = totale.toFixed(2);
}

function creaElementoAttivita(attivita, vacanzaId, index, categoria) {
  const li = document.createElement("li");
  li.className = `attivita-item ${categoria}`;
  li.style.borderLeft = categoria === "giorno" ? "5px solid #FFA500" : "5px solid #1a1a2e";
  li.style.padding = "10px";
  li.style.marginBottom = "10px";
  li.style.backgroundColor = categoria === "giorno" ? "#fff9e6" : "#f0f0f0";
  li.style.borderRadius = "5px";

  li.innerHTML = `
    <strong>${attivita.nome}</strong><br>
    📍 ${attivita.luogo}<br>
    💰 €${(attivita.budget || 0).toFixed(2)}
    <button onclick="eliminaAttivita(${vacanzaId}, '${categoria}', ${index})">❌ Elimina</button>
  `;

  return li;
}

function eliminaAttivita(vacanzaId, categoria, index) {
  const vacanza = vacanze.find(v => v.id == vacanzaId);
  if (vacanza) {
    const attivitaFiltrata = vacanza.attivita.filter(a => a.categoria === categoria);
    const attivitaDaEliminare = attivitaFiltrata[index];
    
    vacanza.attivita = vacanza.attivita.filter(a => a !== attivitaDaEliminare);
    salvaVacanze();
    aggiornaAttivita();
  }
}

function salvaVacanze() {
  localStorage.setItem("vacanze", JSON.stringify(vacanze));
}

// INIZIALIZZA
aggiorna();
