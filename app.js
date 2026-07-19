"use strict";

const KEY = "golfVoiceScorecard-v0.2.8";
const LEGACY_KEY = "golfVoiceScorecardTestBuild02";
const MAX_PLAYERS = 4;
const pars = [4,4,3,5,4,4,5,3,4,4,3,4,5,4,4,3,5,4];
let coursePars = null;

let state = {
  players: 1,
  names: ["Petri", "", "", ""],
  hole: 1,
  scores: Array.from({ length: 18 }, () => Array(MAX_PLAYERS).fill("")),
  history: [],
  speak: true,
  course: null,
  startHole: 1
};

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
let courses = [];
async function loadCourses(){try{courses=await fetch("data/courses.json").then(r=>r.json());const s=$("#courseSelect");if(!s)return; s.innerHTML='<option value="">Valitse kenttä</option>'+courses.map(c=>`<option value="${c.id}">${c.name}</option>`).join(""); if(state.course){s.value=state.course; const c=courses.find(x=>x.id===state.course); if(c) coursePars=[...c.pars];}}catch(e){ console.error("Kenttien lataus epäonnistui:", e); const s=$("#courseSelect"); if(s) s.innerHTML='<option value="">Kenttiä ei saatu ladattua</option>'; }}


function esc(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;",
    '"': "&quot;", "'": "&#39;"
  })[char]);
}

function normalizeState() {
  state.players = Math.min(MAX_PLAYERS, Math.max(1, Number(state.players) || 1));
  state.hole = Math.min(18, Math.max(1, Number(state.hole) || 1));
  state.startHole = Number(state.startHole) === 10 ? 10 : 1;
  state.names = Array.from({ length: MAX_PLAYERS }, (_, i) =>
    String(state.names?.[i] || (i === 0 ? "Petri" : ""))
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
  return (coursePars || pars)[state.hole - 1];
}

function setPar(par) {
  if (coursePars) {
    coursePars = [...coursePars];
    coursePars[state.hole - 1] = par;
  } else {
    pars[state.hole - 1] = par;
  }
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
  renderStartHole();
  renderTable();
  save();
}


function renderStartHole() {
  const box = $("#startHoleButtons");
  if (!box) return;
  box.innerHTML = [1,10].map(h =>
    `<button class="btn ${state.startHole===h ? "active":""}" data-starthole="${h}">Reikä ${h}</button>`
  ).join("");

  box.onclick = event => {
    const button = event.target.closest("[data-starthole]");
    if (!button) return;
    state.startHole = Number(button.dataset.starthole);
    state.hole = state.startHole;
    render();
    announce(`Aloitusreikä ${state.startHole} valittu.`);
  };
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
      state.names[index] = input.value.trim();
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

  $("#tbody").innerHTML = Array.from({ length: 18 }, (_, h) => {
    const row = `<tr class="${h + 1 === state.hole ? "current-row" : ""}">
      <td><b>${h + 1}</b></td>
      <td>${(coursePars || pars)[h]}</td>
      ${Array.from({ length: state.players }, (_, p) =>
        `<td><input class="score ${
          h + 1 === state.hole && p === nextPlayer ? "next-score" : ""
        }" inputmode="numeric" data-h="${h}" data-p="${p}" value="${esc(state.scores[h][p])}"></td>`
      ).join("")}
    </tr>`;

    if (h === 8) {
      const front = Array.from({ length: state.players }, (_, p) =>
        state.scores.slice(0, 9).reduce((sum, r) => sum + (Number(r[p]) || 0), 0)
      );

      return row +
        `<tr class="nine-total"><td colspan="2">Ulos</td>${
          front.map(total => `<td>${total}</td>`).join("")
        }</tr>`;
    }

    return row;
  }).join("");

  const totals = Array.from({ length: state.players }, (_, p) =>
    state.scores.reduce((sum, row) => sum + (Number(row[p]) || 0), 0)
  );

  const relative = totals.map((_, p) => {
    let strokes = 0;
    let par = 0;
    state.scores.forEach((row, h) => {
      if (row[p] !== "") {
        strokes += Number(row[p]) || 0;
        par += (coursePars || pars)[h];
      }
    });
    return strokes - par;
  });

  const frontNine = Array.from({ length: state.players }, (_, p) =>
    state.scores.slice(0, 9).reduce((sum, row) => sum + (Number(row[p]) || 0), 0)
  );

  const backNine = Array.from({ length: state.players }, (_, p) =>
    state.scores.slice(9, 18).reduce((sum, row) => sum + (Number(row[p]) || 0), 0)
  );

  $("#tfoot").innerHTML =
    `<tr class="nine-total"><td colspan="2">Ulos</td>${
      frontNine.map(total => `<td>${total}</td>`).join("")
    }</tr>
    <tr class="nine-total"><td colspan="2">Sisään</td>${
      backNine.map(total => `<td>${total}</td>`).join("")
    }</tr>
    <tr class="total"><td colspan="2">Yhteensä</td>${
      totals.map((total, i) =>
        `<td>${total} <small>(${relative[i] >= 0 ? "+" : ""}${relative[i]})</small></td>`
      ).join("")
    }</tr>`;

  $$(".name").forEach(input => {
    input.onchange = () => {
      const index = Number(input.dataset.name);
      state.names[index] = input.value.trim();
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

const termAliases = {
  birdie: ["birdie","birdi","birdy","bird","birkku","pirkku","pördi","pirdi","pirti","perdi","berdi","bordi","boordi","böördi","böördie","boordie"], 
  par: ["par","paar","paari","paa","pari","parsa"],
  bogey: ["bogey","bogi","boki","poki","pogi"],
  eagle: ["eagle","iigle","iikli","eegle"],
  albatross: ["albatross","albatros"],
  triple: ["triple","tripla","kolmoisbogi","kolmoisbogey"],
  double: ["tupla","tuplabogi","double","doublebogey"]
};

function editDistance(a, b) {
  const rows = b.length + 1;
  const cols = a.length + 1;
  const dp = Array.from({ length: rows }, () => Array(cols).fill(0));
  for (let i = 0; i < rows; i += 1) dp[i][0] = i;
  for (let j = 0; j < cols; j += 1) dp[0][j] = j;
  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (b[i - 1] === a[j - 1] ? 0 : 1)
      );
    }
  }
  return dp[rows - 1][cols - 1];
}

function tokenMatches(token, aliases) {
  if (aliases.includes(token)) return true;
  if (token.length < 4) return false;
  return aliases.some(alias =>
    alias.length >= 4 &&
    Math.abs(alias.length - token.length) <= 1 &&
    editDistance(token, alias) <= 1
  );
}

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

function scoreFromTokens(tokens, index = 0, par = activePar()) {
  const token = tokens[index] || "";
  const next = tokens[index + 1] || "";

  if (tokenMatches(token, termAliases.albatross)) return { score: par - 3, length: 1 };
  if (tokenMatches(token, termAliases.eagle)) return { score: par - 2, length: 1 };
  if (tokenMatches(token, termAliases.birdie)) return { score: par - 1, length: 1 };
  if (tokenMatches(token, termAliases.par)) return { score: par, length: 1 };
  if (tokenMatches(token, termAliases.triple)) return { score: par + 3, length: 1 };

  // Tuplabogi|bogey|boki|poki|pogi hyväksytään vain, kun puheessa on selvä tupla/double-sana.
  if (tokenMatches(token, termAliases.double)) {
    const consumesBogey = tokenMatches(next, termAliases.bogey) ? 2 : 1;
    return { score: par + 2, length: consumesBogey };
  }

  if (tokenMatches(token, termAliases.bogey)) return { score: par + 1, length: 1 };

  const number = numberFrom([token]);
  if (number !== null) return { score: number, length: 1 };

  return null;
}

function extractScoreMentions(text) {
  const tokens = norm(text).split(" ").filter(Boolean);
  const mentions = [];

  for (let i = 0; i < tokens.length; i += 1) {
    const parsed = scoreFromTokens(tokens, i);
    if (!parsed) continue;
    mentions.push({
      score: parsed.score,
      tokenIndex: i,
      tokenLength: parsed.length
    });
    i += parsed.length - 1;
  }
  return { tokens, mentions };
}

function golfScore(text) {
  return extractScoreMentions(text).mentions[0]?.score ?? null;
}

function playerMentions(tokens) {
  const result = [];
  for (let player = 0; player < state.players; player += 1) {
    const nameTokens = norm(state.names[player]).split(" ").filter(Boolean);
    if (!nameTokens.length) continue;

    for (let i = 0; i <= tokens.length - nameTokens.length; i += 1) {
      if (nameTokens.every((nameToken, offset) => tokens[i + offset] === nameToken)) {
        result.push({ player, tokenIndex: i });
      }
    }
  }
  return result.sort((a, b) => a.tokenIndex - b.tokenIndex);
}

function parseMultipleScores(raw) {
  const { tokens, mentions } = extractScoreMentions(raw);
  if (mentions.length < state.players) return null;

  const namedPlayers = playerMentions(tokens);
  const assignments = [];
  const alreadyAssigned = new Set();

  mentions.forEach((mention, mentionIndex) => {
    let player = null;

    // Prefer the closest unused player name before this score.
    const preceding = namedPlayers
      .filter(item => item.tokenIndex <= mention.tokenIndex && !alreadyAssigned.has(item.player))
      .sort((a, b) => b.tokenIndex - a.tokenIndex)[0];

    if (preceding) player = preceding.player;

    // If no name was spoken, assign scores in the current player order.
    if (player === null) {
      const candidates = Array.from({ length: state.players }, (_, i) => i)
        .filter(i => !alreadyAssigned.has(i));
      player = candidates[0] ?? null;
    }

    if (player !== null) {
      alreadyAssigned.add(player);
      assignments.push({ player, score: mention.score });
    }
  });

  return assignments.length >= 2 ? assignments : null;
}

function plainText(value) {
  const temp = document.createElement("div");
  temp.innerHTML = value;
  return temp.textContent || "";
}

let voices = [];

function refreshVoices() {
  if ("speechSynthesis" in window) {
    voices = window.speechSynthesis.getVoices();
    window.speechSynthesis.resume();
  }
}

function initSpeech() {
  if ("speechSynthesis" in window) {
    refreshVoices();
    window.speechSynthesis.getVoices();
    window.speechSynthesis.resume();
  }
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



function finnishNumberWord(number) {
  const words = {
    1: "yksi",
    2: "kaksi",
    3: "kolme",
    4: "neljä",
    5: "viisi",
    6: "kuusi",
    7: "seitsemän",
    8: "kahdeksan",
    9: "yhdeksän",
    10: "kymmenen"
  };
  return words[number] || String(number);
}

function advanceAfterCompleteHole() {
  const holeIndex = state.hole - 1;
  const complete = state.scores[holeIndex]
    .slice(0, state.players)
    .every(value => value !== "");

  if (!complete) return false;

  const finishedHole = state.hole;

  // Aloitus reiältä 10: väylä 18 jälkeen ilmoitetaan takaysin tulos
  // ja jatketaan väylälle 1.
  if (state.startHole === 10 && finishedHole === 18) {
    const summaries = Array.from({ length: state.players }, (_, player) => {
      const total = state.scores
        .slice(9, 18)
        .reduce((sum, row) => sum + (Number(row[player]) || 0), 0);

      const parTotal = (coursePars || pars)
        .slice(9, 18)
        .reduce((sum, value) => sum + value, 0);

      const diff = total - parTotal;

      return `${state.names[player]} ${total} (${diff >= 0 ? "+" : ""}${diff})`;
    }).join(". ");

    state.hole = 1;
    render();

    announce(
      `Takaysi valmis. Väylien 10-18 tulos: ${summaries}. Seuraava reikä 1, par ${finnishNumberWord(activePar())}.`
    );

    return true;
  }

  if (state.hole < 18) {
    if (finishedHole === 9) {
      const summaries = Array.from({ length: state.players }, (_, player) => {
        const total = state.scores
          .slice(0, 9)
          .reduce((sum, row) => sum + (Number(row[player]) || 0), 0);

        const parTotal = (coursePars || pars)
          .slice(0, 9)
          .reduce((sum, value) => sum + value, 0);

        const diff = total - parTotal;

        return `${state.names[player]} ${total} (${diff >= 0 ? "+" : ""}${diff})`;
      }).join(". ");

      state.hole += 1;
      render();

      announce(
        `Etuyhdeksikkö valmis. ${summaries}. Seuraava reikä ${state.hole}, par ${finnishNumberWord(activePar())}.`
      );

      return true;
    }

    state.hole += 1;
    render();

    announce(
      `Reikä ${finishedHole} valmis. Seuraava reikä ${state.hole}, par ${finnishNumberWord(activePar())}.`
    );

    return true;
  }

  render();
  announce("Kierroksen kaikki tulokset on kirjattu. Tarkista tuloskortti.");

  return true;
}


function spokenHoleNumber(text) {
  const normalized = norm(text);
  const match = normalized.match(/(?:reika\s*)?(\d{1,2})/);
  if (match) {
    const n = Number(match[1]);
    if (n >= 1 && n <= 18) return n;
  }

  const words = {
    yksi:1, kaksi:2, kolme:3, nelja:4, viisi:5,
    kuusi:6, seitseman:7, kahdeksan:8, yhdeksan:9,
    kymmenen:10, yksitoista:11, kaksitoista:12,
    kolmetoista:13, neljatoista:14, viisitoista:15,
    kuusitoista:16, seitsemantoista:17, kahdeksantoista:18
  };

  for (const w of normalized.split(" ")) {
    if (words[w]) return words[w];
  }
  return null;
}

function processCorrection(raw) {
  const normalized = norm(raw);
  if (!/\b(korjaa|vaihda|muuta)\b/.test(normalized)) return false;

  const hole = spokenHoleNumber(normalized);
  const player = playerFrom(raw);

  // Poistetaan korjauskomento, reikä ja pelaajan nimi ennen tuloksen hakua.
  // Näin "korjaa reikä 8 petri 6" ei tulkitse reikänumeroa tulokseksi.
  let scoreText = normalized
    .replace(/\b(korjaa|vaihda|muuta)\b/g, " ")
    .replace(/\b(reika|reikä)\s*(\d+|[a-z]+)\b/g, " ");

  for (let i = 0; i < state.players; i += 1) {
    const name = norm(state.names[i]);
    if (name) scoreText = scoreText.replace(name, " ");
  }

  const score = golfScore(scoreText);

  if (!hole || score === null || player === null) {
    announce("Korjauksesta puuttuu reikä, pelaaja tai tulos.");
    return true;
  }

  const h = hole - 1;
  pushHistory(h, player, state.scores[h][player], score);
  state.scores[h][player] = score;
  save();
  render();

  announce(`Korjattu ${state.names[player]}, reikä ${hole}, tulos ${score}.`);
  return true;
}


function targetHoleFromSpeech(text) {
  const normalized = norm(text);

  const match = normalized.match(/\breika\s+(\d{1,2})\b/);
  if (match) {
    const h = Number(match[1]);
    if (h >= 1 && h <= 18) return h;
  }

  const words = {
    yksi:1, kaksi:2, kolme:3, nelja:4, viisi:5,
    kuusi:6, seitseman:7, kahdeksan:8, yhdeksan:9,
    kymmenen:10, yksitoista:11, kaksitoista:12,
    kolmetoista:13, neljatoista:14, viisitoista:15,
    kuusitoista:16, seitsemantoista:17, kahdeksantoista:18
  };

  const wordMatch = normalized.match(/\breika\s+([a-z]+)\b/);
  if (wordMatch && words[wordMatch[1]]) return words[wordMatch[1]];

  return null;
}

function processSpeech(raw) {
  const normalized = norm(raw);
  if (!normalized) return;

  if (processCorrection(raw)) return;

  if (/\b(peru|undo|poista viimeinen)\b/.test(normalized)) {
    undo();
    return;
  }

  if (/\b(mika reika|mikä reikä)\b/.test(raw.toLowerCase())) {
    announce(`Nyt pelataan reikää ${state.hole}, par ${activePar()}.`);
    return;
  }

  // Kaikki tai ei mitään -periaate:
  // yhden reiän tulokset kirjataan vasta kun kaikille aktiivisille pelaajille on tulos.
  let assignments = parseMultipleScores(raw);

  if (!assignments) {
    const parsed = parseCandidate(raw);
    if (parsed.score !== null) {
      assignments = [{ player: parsed.player ?? 0, score: parsed.score }];
    }
  }

  if (!assignments || assignments.length < state.players) {
    announce("Tuloksia puuttuu.");
    return;
  }

  const unique = new Map();
  assignments.forEach(item => {
    if (item.player < state.players && item.score >= 1 && item.score <= 20) {
      unique.set(item.player, item.score);
    }
  });

  if (unique.size < state.players) {
    announce("Tuloksia puuttuu.");
    return;
  }

  const targetHole = targetHoleFromSpeech(raw) || state.hole;
  const holeIndex = targetHole - 1;

  unique.forEach((score, player) => {
    pushHistory(holeIndex, player, state.scores[holeIndex][player], score);
    state.scores[holeIndex][player] = score;
  });

  save();
  render();

  const values = Array.from({ length: state.players }, (_, player) =>
    unique.get(player)
  ).join(", ");

  announce(`${values} kirjattu`);
  advanceAfterCompleteHole();
}

function bestRecognitionCandidate(result) {
  const candidates = [];
  for (let i = 0; i < result.length; i += 1) {
    candidates.push({
      transcript: result[i].transcript,
      confidence: Number(result[i].confidence) || 0
    });
  }

  candidates.sort((a, b) => b.confidence - a.confidence);
  const top = candidates[0]?.transcript || "";

  // Do not replace a clear top result such as "bogi|bogey|boki|poki|pogi" with a lower-confidence
  // alternative such as "double bogey".
  if (
    /\b(peru|undo|poista viimeinen)\b/.test(norm(top)) ||
    golfScore(top) !== null
  ) {
    return top;
  }

  return candidates.find(item =>
    /\b(peru|undo|poista viimeinen)\b/.test(norm(item.transcript)) ||
    golfScore(item.transcript) !== null
  )?.transcript || top;
}

function startVoice() {
  // iOS requires a user gesture before speech synthesis can reliably speak.
  if (state.speak && "speechSynthesis" in window) {
    refreshVoices();
    window.speechSynthesis.resume();
  }

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
initSpeech();
loadCourses();

if ("speechSynthesis" in window) {
  window.speechSynthesis.onvoiceschanged = refreshVoices;
}

$(".par-select").onclick = event => {
  const button = event.target.closest("[data-par]");
  if (button) setPar(Number(button.dataset.par));
};

$("#voiceButton").onclick = startVoice;
function selectCourse(courseId) {
  const c = courses.find(x => x.id === courseId);
  if (!c) return;

  state.course = c.id;
  coursePars = [...c.pars];
  state.hole = 1;

  render();

  // Varmistetaan että valinta näkyy myös DOM:ssa
  const select = $("#courseSelect");
  if (select) select.value = c.id;

  announce(`Kenttä ${c.name} valittu.`);
  save();
}

$("#courseSelect").addEventListener("change", e => {
  selectCourse(e.target.value);
});

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
  state.hole = state.startHole;
  render();
  announce(`Uusi testikierros aloitettu reiältä ${state.startHole}.`);
};
