"use strict";

const KEY = "golfVoiceScorecard-v0.2.1";
const LEGACY_KEY = "golfVoiceScorecardTestBuild02";
const MAX_PLAYERS = 4;
const pars = [4,4,3,5,4,4,5,3,4,4,3,4,5,4,4,3,5,4];

let state = {
  players: 1,
  names: ["Petri", "P2", "P3", "P4"],
  hole: 1,
  scores: Array.from({ length: 18 }, () => Array(MAX_PLAYERS).fill("")),
  history: [],
  speak: true
};

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

function esc(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;",
    '"': "&quot;", "'": "&#39;"
  })[char]);
}

function normalizeState() {
  state.players = Math.min(MAX_PLAYERS, Math.max(1, Number(state.players) || 1));
  state.hole = Math.min(18, Math.max(1, Number(state.hole) || 1));
  state.names = Array.from({ length: MAX_PLAYERS }, (_, i) =>
    String(state.names?.[i] || (i === 0 ? "Petri" : `P${i + 1}`))
  );
  state.scores = Array.from({ length: 18 }, (_, h) =>
    Array.from({ length: MAX_PLAYERS }, (_, p) => state.scores?.[h]?.[p] ?? "")
  );
  state.history = Array.isArray(state.history) ? state.history : [];
  state.speak = state.speak !== false;
}

function save() {
  localStorage.setItem(KEY, JSON.stringify(state));
}

function load() {
  try {
    const current = JSON.parse(localStorage.getItem(KEY));
    const legacy = JSON.parse(localStorage.getItem(LEGACY_KEY));
    const stored = current || legacy;
    if (stored?.scores) state = { ...state, ...stored };
  } catch (_) {}
  normalizeState();
}

function activePar() {
  return pars[state.hole - 1];
}

function setPar(par) {
  pars[state.hole - 1] = par;
  render();
}

function nextEmptyPlayer(holeIndex = state.hole - 1) {
  for (let player = 0; player < state.players; player += 1) {
    if (state.scores[holeIndex][player] === "") return player;
  }
  return null;
}

function lastFilledPlayer(holeIndex = state.hole - 1) {
  for (let player = state.players - 1; player >= 0; player -= 1) {
    if (state.scores[holeIndex][player] !== "") return player;
  }
  return 0;
}

function updateNextPlayer() {
  const box = $("#nextPlayer");
  if (!box) return;
  const player = nextEmptyPlayer();
  box.textContent = player === null
    ? `Reikä ${state.hole}: kaikkien tulokset kirjattu`
    : `Seuraava kirjaus: ${state.names[player]}`;
}

function render() {
  $("#holeNumber").textContent = state.hole;
  $$("#playerButtons .btn").forEach(button =>
    button.classList.toggle("active", Number(button.dataset.count) === state.players)
  );
  $$(".par-select .btn").forEach(button =>
    button.classList.toggle("active", Number(button.dataset.par) === activePar())
  );
  $("#speakToggle").checked = state.speak;
  renderNames();
  renderTable();
  updateNextPlayer();
  save();
}

function renderSetup() {
  $("#playerButtons").innerHTML = [1,2,3,4].map(count =>
    `<button class="btn ${count === state.players ? "active" : ""}" data-count="${count}">${count}</button>`
  ).join("");

  $("#playerButtons").onclick = event => {
    const button = event.target.closest("[data-count]");
    if (!button) return;
    state.players = Number(button.dataset.count);
    render();
    announce(`Pelaajia ${state.players}. Seuraava kirjaus: ${state.names[nextEmptyPlayer() ?? 0]}.`);
  };
}

function renderNames() {
  $("#nameInputs").innerHTML = Array.from({ length: state.players }, (_, i) =>
    `<input class="name-setup" data-i="${i}" maxlength="15" value="${esc(state.names[i])}" aria-label="Pelaaja ${i + 1}">`
  ).join("");

  $$(".name-setup").forEach(input => {
    input.onchange = () => {
      const index = Number(input.dataset.i);
      state.names[index] = input.value.trim() || `P${index + 1}`;
      render();
    };
  });
}

function renderTable() {
  $("#thead").innerHTML =
    `<tr><th>Reikä</th><th>Par</th>${
      Array.from({ length: state.players }, (_, i) =>
        `<th><input class="name" data-name="${i}" value="${esc(state.names[i])}"></th>`
      ).join("")
    }</tr>`;

  const nextPlayer = nextEmptyPlayer();

  $("#tbody").innerHTML = Array.from({ length: 18 }, (_, h) =>
    `<tr class="${h + 1 === state.hole ? "current-row" : ""}">
      <td><b>${h + 1}</b></td>
      <td>${pars[h]}</td>
      ${Array.from({ length: state.players }, (_, p) =>
        `<td><input class="score ${
          h + 1 === state.hole && p === nextPlayer ? "next-score" : ""
        }" inputmode="numeric" data-h="${h}" data-p="${p}" value="${esc(state.scores[h][p])}"></td>`
      ).join("")}
    </tr>`
  ).join("");

  const totals = Array.from({ length: state.players }, (_, p) =>
    state.scores.reduce((sum, row) => sum + (Number(row[p]) || 0), 0)
  );

  const relative = totals.map((_, p) => {
    let strokes = 0;
    let par = 0;
    state.scores.forEach((row, h) => {
      if (row[p] !== "") {
        strokes += Number(row[p]) || 0;
        par += pars[h];
      }
    });
    return strokes - par;
  });

  $("#tfoot").innerHTML =
    `<tr class="total"><td colspan="2">Yhteensä</td>${
      totals.map((total, i) =>
        `<td>${total} <small>(${relative[i] >= 0 ? "+" : ""}${relative[i]})</small></td>`
      ).join("")
    }</tr>`;

  $$(".name").forEach(input => {
    input.onchange = () => {
      const index = Number(input.dataset.name);
      state.names[index] = input.value.trim() || `P${index + 1}`;
      render();
    };
  });

  $$(".score").forEach(input => {
    input.onchange = () => {
      const h = Number(input.dataset.h);
      const p = Number(input.dataset.p);
      const value = input.value.trim();
      state.scores[h][p] = /^(?:[1-9]|1\d|20)$/.test(value) ? Number(value) : "";
      save();
      renderTable();
      updateNextPlayer();
    };
  });
}

function norm(value) {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.,!?;:]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const numbers = {
  yksi:1, yks:1, ykkonen:1,
  kaksi:2, kaks:2, kakkonen:2,
  kolme:3, kolmonen:3,
  nelja:4, nelonen:4, nelkku:4,
  viisi:5, viis:5, viitonen:5, vitonen:5,
  kuusi:6, kuus:6, kuutonen:6,
  seitseman:7, seiska:7,
  kahdeksan:8, kasi:8,
  yhdeksan:9, ysi:9, yska:9,
  kymmenen:10, kymppi:10
};

function numberFrom(words) {
  for (const word of words) {
    if (/^\d{1,2}$/.test(word)) {
      const number = Number(word);
      if (number >= 1 && number <= 20) return number;
    }
    if (numbers[word]) return numbers[word];
  }
  return null;
}

function playerFrom(text) {
  const normalized = norm(text);

  for (let i = 0; i < state.players; i += 1) {
    const name = norm(state.names[i]);
    if (name && normalized.includes(name)) return i;
  }

  const explicit = normalized.match(/pelaaja\s*([1-4])/);
  if (explicit && Number(explicit[1]) <= state.players) return Number(explicit[1]) - 1;

  if (/\b(minulle|mulle|mina|ma)\b/.test(normalized)) return 0;
  return null;
}

function golfScore(text) {
  const normalized = norm(text);
  const par = activePar();

  if (/\b(albatross|albatros)\b/.test(normalized)) return par - 3;
  if (/\b(eagle|iigle|iikli)\b/.test(normalized)) return par - 2;
  if (/\b(birdie|birdi|birdy|pirdi|pördi|bordi|bördi|pirkku)\b/.test(normalized)) return par - 1;
  if (/\b(par|paar|paari|pariin)\b/.test(normalized)) return par;
  if (/\b(triple|tripla|kolmoisbogi|kolmois bogi)\b/.test(normalized)) return par + 3;
  if (/\b(double bogey|double|tupla|tuplabogi|tupla bogi)\b/.test(normalized)) return par + 2;
  if (/\b(bogey|bogi|boki)\b/.test(normalized)) return par + 1;

  return numberFrom(normalized.split(" "));
}

function plainText(value) {
  const temp = document.createElement("div");
  temp.innerHTML = value;
  return temp.textContent || "";
}

let voices = [];

function refreshVoices() {
  if ("speechSynthesis" in window) voices = window.speechSynthesis.getVoices();
}

function speakText(text) {
  if (!state.speak || !("speechSynthesis" in window)) return;

  const synth = window.speechSynthesis;
  synth.cancel();
  synth.resume();

  const utterance = new SpeechSynthesisUtterance(text);
  const finnishVoice = voices.find(voice => /^fi([-_]|$)/i.test(voice.lang));
  if (finnishVoice) utterance.voice = finnishVoice;
  utterance.lang = finnishVoice?.lang || "fi-FI";
  utterance.rate = 0.95;
  utterance.volume = 1;

  window.setTimeout(() => {
    synth.resume();
    synth.speak(utterance);
  }, 80);
}

function announce(message, shouldSpeak = true) {
  $("#status").innerHTML = message;
  const text = plainText(message);
  addLog(text);
  if (shouldSpeak) speakText(text);
}

function addLog(message) {
  const item = document.createElement("li");
  item.textContent =
    new Date().toLocaleTimeString("fi-FI", { hour: "2-digit", minute: "2-digit" }) +
    " – " + message;
  $("#log").prepend(item);
}

function pushHistory(h, p, oldValue, newValue) {
  state.history.push({ h, p, oldValue, newValue });
  if (state.history.length > 50) state.history.shift();
}

function scoreTerm(score, par = activePar()) {
  if (score === par - 3) return "Albatross";
  if (score === par - 2) return "Eagle";
  if (score === par - 1) return "Birdie";
  if (score === par) return "Par";
  if (score === par + 1) return "Bogi";
  if (score === par + 2) return "Tuplabogi";
  if (score === par + 3) return "Tripla";
  return `${score} lyöntiä`;
}

function setScore(h, p, value, correcting = false) {
  const oldValue = state.scores[h][p];
  pushHistory(h, p, oldValue, value);
  state.scores[h][p] = value;
  save();
  renderTable();
  updateNextPlayer();

  const term = scoreTerm(value, pars[h]);
  announce(
    `<span class="heard">${esc(state.names[p])}: ${esc(term)}, ${value} lyöntiä.</span><br>` +
    `${correcting ? "Korjaus tehty" : "Tulos kirjattu"}, reikä ${h + 1}.`
  );
}

function undo() {
  const item = state.history.pop();
  if (!item) {
    announce("Ei peruttavaa kirjausta.");
    return;
  }

  state.scores[item.h][item.p] = item.oldValue;
  state.hole = item.h + 1;
  render();
  announce(`Peruttu. ${esc(state.names[item.p])}, reikä ${item.h + 1}.`);
}

function parseCandidate(raw) {
  const normalized = norm(raw);
  const correcting = /\b(korjaa|muuta|vaihda)\b/.test(normalized);
  const score = golfScore(raw);
  let player = playerFrom(raw);

  if (player === null) {
    player = correcting ? lastFilledPlayer() : nextEmptyPlayer();
  }

  return { raw, normalized, correcting, score, player };
}

function processSpeech(raw) {
  const normalized = norm(raw);
  if (!normalized) return;

  if (/\b(peru|undo|poista viimeinen)\b/.test(normalized)) {
    undo();
    return;
  }

  if (/\b(mika reika|mikä reikä)\b/.test(raw.toLowerCase())) {
    announce(`Nyt pelataan reikää ${state.hole}, par ${activePar()}.`);
    return;
  }

  const parsed = parseCandidate(raw);
  if (parsed.score === null || parsed.score < 1 || parsed.score > 20) {
    announce(`En saanut tulosta varmasti selville: “${esc(raw)}”. Sano esimerkiksi birdie, par, bogi tai numero.`);
    return;
  }

  if (parsed.player === null) {
    announce(`Reiän ${state.hole} kaikkien pelaajien tulokset on jo kirjattu. Sano pelaajan nimi korjauksen yhteydessä tai siirry seuraavalle reiälle.`);
    return;
  }

  const holeIndex = state.hole - 1;
  setScore(holeIndex, parsed.player, parsed.score, parsed.correcting);

  const complete = state.scores[holeIndex]
    .slice(0, state.players)
    .every(value => value !== "");

  if (complete && state.hole < 18) {
    const finishedHole = state.hole;
    state.hole += 1;
    render();
    announce(
      `Reikä ${finishedHole} valmis. Seuraava reikä ${state.hole}, par ${activePar()}. ` +
      `Ensimmäisenä ${state.names[0]}.`
    );
  } else if (complete) {
    announce("Kierroksen kaikki tulokset on kirjattu. Tarkista tuloskortti.");
  } else {
    const next = nextEmptyPlayer(holeIndex);
    if (next !== null) {
      announce(
        `${state.names[parsed.player]}: ${scoreTerm(parsed.score)} kirjattu. ` +
        `Seuraavana ${state.names[next]}.`
      );
    }
  }
}

function bestRecognitionCandidate(result) {
  const candidates = [];
  for (let i = 0; i < result.length; i += 1) {
    candidates.push(result[i].transcript);
  }

  return candidates.find(candidate => {
    const normalized = norm(candidate);
    return /\b(peru|undo|poista viimeinen)\b/.test(normalized) ||
      golfScore(candidate) !== null;
  }) || candidates[0] || "";
}

function startVoice() {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Recognition) {
    announce("Tämä selain ei tue Web Speech -puheentunnistusta. Testaa Chrome- tai Edge-selaimella HTTPS-osoitteessa.");
    return;
  }

  const recognition = new Recognition();
  recognition.lang = "fi-FI";
  recognition.interimResults = false;
  recognition.maxAlternatives = 5;

  $("#voiceButton").classList.add("listening");
  $("#voiceButton").textContent = "🎙️ Kuuntelen…";

  recognition.onresult = event => {
    const text = bestRecognitionCandidate(event.results[0]);
    announce(`Kuulin: <span class="heard">“${esc(text)}”</span>`, false);
    window.setTimeout(() => processSpeech(text), 120);
  };

  recognition.onerror = event =>
    announce(`Puheentunnistus epäonnistui (${esc(event.error)}). Kokeile uudelleen.`);

  recognition.onend = () => {
    $("#voiceButton").classList.remove("listening");
    $("#voiceButton").textContent = "🎤 Anna tulos puheella";
  };

  recognition.start();
}

load();
renderSetup();
render();
refreshVoices();

if ("speechSynthesis" in window) {
  window.speechSynthesis.onvoiceschanged = refreshVoices;
}

$(".par-select").onclick = event => {
  const button = event.target.closest("[data-par]");
  if (button) setPar(Number(button.dataset.par));
};

$("#voiceButton").onclick = startVoice;

$$(".quick-score").forEach(button => {
  button.onclick = () => processSpeech(button.dataset.speech);
});

$("#testSpeechButton").onclick = () => {
  state.speak = true;
  $("#speakToggle").checked = true;
  save();
  speakText("Puheääni toimii. Golf Voice Scorecard on valmis.");
  announce("Puheäänen testi käynnistettiin.", false);
};

$("#speakToggle").onchange = event => {
  state.speak = event.target.checked;
  save();
  if (state.speak) speakText("Puhutut vahvistukset ovat käytössä.");
};

$("#undoButton").onclick = undo;
$("#prevHole").onclick = () => {
  state.hole = Math.max(1, state.hole - 1);
  render();
};
$("#nextHole").onclick = () => {
  state.hole = Math.min(18, state.hole + 1);
  render();
};

$("#resetButton").onclick = () => {
  if (!confirm("Tyhjennetäänkö Test Build-02:n kierros?")) return;
  state.scores = Array.from({ length: 18 }, () => Array(MAX_PLAYERS).fill(""));
  state.history = [];
  state.hole = 1;
  render();
  announce("Uusi testikierros aloitettu.");
};
