// DATI VACANZE
let vacanze = JSON.parse(localStorage.getItem("vacanze")) || [];

// UI ELEMENTS
const vacanzaInput = document.getElementById("vacanzaInput");
const dataInizioInput = document.getElementById("dataInizioInput");
const dataFineInput = document.getElementById("dataFineInput");
const aggiungiVacanzaBtn = document.getElementById("aggiungiVacanzaBtn");
const vacanzaSelect = document.getElementById("vacanzaSelect");
const categoriaSelect = document.getElementById("categoriaSelect");
const attivitaInput = document.getElementById("attivitaInput");
const luogoInput = document.getElementById("luogoInput");
const budgetInput = document.getElementById("budgetInput");
const aggiungiAttivitaBtn = document.getElementById("aggiungiAttivitaBtn");
const listaAttivita = document.getElementById("listaAttivita");
const totaleBudget = document.getElementById("totaleBudget");

// EVENT LISTENERS
aggiungiVacanzaBtn.addEventListener("click", aggiungiVacanza);
aggiungiAttivitaBtn.addEventListener("click", aggiungiAttivita);
vacanzaSelect.addEventListener("change", aggiornaAttivita);

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
  aggiornaSelectVacanze();
  
  vacanzaInput.value = "";
  dataInizioInput.value = "";
  dataFineInput.value = "";
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

function aggiungiAttivita() {
  const vacanzaId = vacanzaSelect.value;
  const categoria = categoriaSelect.value;
  const nomeAttivita = attivitaInput.value.trim();
  const luogo = luogoInput.value.trim();
  const budget = parseFloat(budgetInput.value) || 0;

  if (!vacanzaId || !categoria || !nomeAttivita || !luogo) {
    alert("Compila tutti i campi!");
    return;
  }

  const attivita = {
    id: Date.now(),
    nome: nomeAttivita,
    luogo: luogo,
    categoria: categoria,
    budget: budget
  };

  const vacanza = vacanze.find(v => v.id == vacanzaId);
  if (vacanza) {
    vacanza.attivita.push(attivita);
    salvaVacanze();
    aggiornaAttivita();
    
    // Reset form
    categoriaSelect.value = "";
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
aggiornaSelectVacanze();
