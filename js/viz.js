/* =====================================================================
   Chatbots & Recommendation Engines — Interactive Visualizations
   All viz are plain DOM + canvas — no frameworks beyond Chart.js (for line charts).
   ===================================================================== */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const rnd = (a, b) => Math.random() * (b - a) + a;
const irnd = (a, b) => Math.floor(rnd(a, b));
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const fmt = (v, d = 2) => (v == null || isNaN(v)) ? '–' : (+v).toFixed(d);
const sum = a => a.reduce((s, x) => s + x, 0);
const mean = a => a.length ? sum(a) / a.length : 0;
const std = a => { const m = mean(a); return Math.sqrt(mean(a.map(x => (x - m) ** 2))); };
const dot = (a, b) => a.reduce((s, _, i) => s + a[i] * b[i], 0);
const norm = a => Math.sqrt(dot(a, a));
const cosine = (a, b) => {
  const n = norm(a) * norm(b);
  return n === 0 ? 0 : dot(a, b) / n;
};

/* =====================================================================
   §1 — User-Item Utility Matrix
   ===================================================================== */
function utilityMatrix() {
  const root = $('#utilMatrix');
  const uIn = $('#utilU'), iIn = $('#utilI'), rk = $('#utilRank'), rnB = $('#utilRand');
  const uV = $('#utilUv'), iV = $('#utilIv');
  let U, I, M;

  function reseed() {
    U = +uIn.value; I = +iIn.value;
    uV.textContent = U; iV.textContent = I;
    M = Array.from({ length: U }, () => Array.from({ length: I }, () => Math.random() < 0.3 ? 0 : irnd(1, 6)));
    render();
  }

  function render() {
    const showRank = rk.checked;
    root.style.gridTemplateColumns = `60px repeat(${I},minmax(34px,1fr))`;
    root.innerHTML = '';
    const head = document.createElement('div');
    head.className = 'cell head'; head.textContent = ''; root.appendChild(head);
    for (let j = 0; j < I; j++) {
      const c = document.createElement('div');
      c.className = 'cell head'; c.textContent = 'i' + (j + 1); root.appendChild(c);
    }
    for (let i = 0; i < U; i++) {
      const lbl = document.createElement('div');
      lbl.className = 'cell head'; lbl.textContent = 'u' + (i + 1); root.appendChild(lbl);
      // compute row ranking
      const ranked = [...M[i].entries()].sort((a, b) => b[1] - a[1]);
      const rank = {}; ranked.forEach(([j], k) => rank[j] = k + 1);
      const maxV = Math.max(...M[i]);
      for (let j = 0; j < I; j++) {
        const c = document.createElement('div');
        c.className = 'cell';
        const v = M[i][j];
        if (v === 0) { c.classList.add('unrated'); c.textContent = '—'; }
        else {
          c.textContent = showRank ? '#' + rank[j] : v;
          const a = v / 5;
          c.style.background = `rgba(122,162,255,${0.15 + a * 0.5})`;
          if (v === maxV) c.classList.add('best');
        }
        c.onclick = () => {
          M[i][j] = (M[i][j] + 1) % 6;
          render();
        };
        root.appendChild(c);
      }
    }
  }

  uIn.oninput = iIn.oninput = reseed;
  rk.onchange = render;
  rnB.onclick = reseed;
  reseed();
}

/* =====================================================================
   §2 — Recommender Types tabs
   ===================================================================== */
function recTypes() {
  const tabs = $('#recTypeTabs'), body = $('#recTypeBody');
  const content = {
    naive: `
      <h4>Non-personalized</h4>
      <p>Everyone sees the same recommendations. Three flavors:</p>
      <ul>
        <li><b>Random</b> — picks items from a distribution. Useful as a sanity baseline.</li>
        <li><b>Popular</b> — ranks by aggregate rating count or mean.</li>
        <li><b>Demographic</b> — popular per coarse segment (e.g., country, age bucket).</li>
      </ul>
      <p class="hint">No model needs to know who u is. The expensive personalization machinery is absent.</p>
    `,
    cb: `
      <h4>Content-Based</h4>
      <p>Recommend items <i>similar to those the user already liked</i>, where similarity comes from item <b>metadata</b> (genre, tags, text, image embeddings).</p>
      <p><b>Strengths:</b> explainable ("you liked X because of its sci-fi tag"); works on day-1 for new items.</p>
      <p><b>Weakness:</b> over-specialization — filter bubbles. The user keeps seeing more of the same.</p>
    `,
    cf: `
      <h4>Collaborative Filtering</h4>
      <p>Use only the (user, item, rating) feedback tuple — no metadata at all. Similar users like similar items.</p>
      <ul>
        <li><b>Memory-based</b> — user-based or item-based KNN over the rating matrix.</li>
        <li><b>Model-based</b> — factorize the matrix into low-rank embeddings (SVD, NMF).</li>
      </ul>
      <p><b>Strength:</b> serendipity — cross-genre discovery.<br/><b>Weakness:</b> cold-start, sparsity.</p>
    `,
    hyb: `
      <h4>Hybrid</h4>
      <p>Combine two or more recommenders to get the best of each. Common forms:</p>
      <ul>
        <li><b>Weighted</b> — $\\hat r_{ui} = \\sum_k w_k \\cdot RS_k(u,i)$</li>
        <li><b>Switching</b> — pick a recommender based on the situation (cold-start → popular; warm → CF).</li>
        <li><b>Mixed</b> — present multiple lists or rank-aggregate them.</li>
      </ul>
    `,
    ctx: `
      <h4>Context-Aware (CARS)</h4>
      <p>Add a context dimension to the utility function: $g:U\\times I\\times C \\to \\mathbb{R}$. Context might be:</p>
      <ul>
        <li><b>Temporal</b> — time of day, season, holiday.</li>
        <li><b>Environmental</b> — location, weather, device.</li>
        <li><b>Situational</b> — mood, companion, intent.</li>
      </ul>
    `
  };
  function show(t) {
    $$('button', tabs).forEach(b => b.classList.toggle('active', b.dataset.tab === t));
    body.innerHTML = content[t];
    if (window.renderMathInElement) renderMathInElement(body, { delimiters: [{ left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false }] });
  }
  tabs.onclick = e => { if (e.target.dataset.tab) show(e.target.dataset.tab); };
  show('naive');
}

/* =====================================================================
   §3 — Implicit→Explicit map
   ===================================================================== */
function implicitMap() {
  const root = $('#implicitMap');
  const rows = [
    { name: 'view', stars: 1 },
    { name: 'scroll', stars: 2 },
    { name: 'click', stars: 3 },
    { name: 'add to cart', stars: 4 },
    { name: 'purchase', stars: 5 },
  ];
  root.innerHTML = rows.map((r, i) => `
    <div class="imap-row">
      <div class="label">${r.name}</div>
      <div class="bar"><div class="bar-fill" id="bar${i}" style="width:${r.stars * 20}%"></div></div>
      <div class="stars" id="st${i}">${'★'.repeat(r.stars)}${'☆'.repeat(5 - r.stars)}</div>
    </div>
  `).join('');
  rows.forEach((r, i) => {
    const bar = $(`#bar${i}`).parentNode;
    bar.onclick = e => {
      const rect = bar.getBoundingClientRect();
      const ratio = (e.clientX - rect.left) / rect.width;
      const s = clamp(Math.round(ratio * 5), 1, 5);
      $(`#bar${i}`).style.width = (s * 20) + '%';
      $(`#st${i}`).textContent = '★'.repeat(s) + '☆'.repeat(5 - s);
    };
  });
}

/* =====================================================================
   §4 — Random / Popular / Bayesian Average
   ===================================================================== */
function popularDemo() {
  const root = $('#popularChart');
  const C = $('#bayesC'), Cv = $('#bayesCv'), reseed = $('#popularReseed');
  let items = [];
  function gen() {
    const N = 8;
    items = Array.from({ length: N }, (_, i) => {
      const trueQ = rnd(2.5, 4.7);
      const n = irnd(1, 200);
      const ratings = Array.from({ length: n }, () => clamp(Math.round(trueQ + rnd(-1.4, 1.4)), 1, 5));
      return { id: 'item ' + (i + 1), n, mean: mean(ratings), trueQ };
    });
    render();
  }
  function render() {
    const c = +C.value; Cv.textContent = c;
    const mu = mean(items.flatMap(it => [it.mean])); // global mean of means as proxy
    const rows = items.map(it => {
      const bayes = (it.n * it.mean + c * mu) / (it.n + c);
      return { ...it, bayes };
    });
    const max = Math.max(...rows.map(r => Math.max(r.mean, r.bayes)), 5);
    root.innerHTML = `
      <table style="font-size:12px;">
        <tr><th>Item</th><th>n (ratings)</th><th>Raw mean</th><th>Bayesian</th><th>Visualization (raw vs Bayes)</th></tr>
        ${rows.map(r => `
          <tr>
            <td>${r.id}</td>
            <td style="font-family:var(--mono)">${r.n}</td>
            <td style="font-family:var(--mono)">${fmt(r.mean)}</td>
            <td style="font-family:var(--mono);color:var(--good)">${fmt(r.bayes)}</td>
            <td>
              <div style="display:flex;gap:2px;align-items:center;height:18px;">
                <div title="raw" style="width:${(r.mean/5)*120}px;height:8px;background:var(--accent2);border-radius:2px;"></div>
              </div>
              <div style="display:flex;gap:2px;align-items:center;height:18px;">
                <div title="bayes" style="width:${(r.bayes/5)*120}px;height:8px;background:var(--good);border-radius:2px;"></div>
              </div>
            </td>
          </tr>`).join('')}
      </table>
      <div style="font-size:11px;color:var(--ink-dim);margin-top:8px;">
        Pink = raw mean · Green = Bayesian-adjusted. As C → ∞, all items collapse to the global mean.
      </div>
    `;
  }
  C.oninput = render;
  reseed.onclick = gen;
  gen();
}

/* =====================================================================
   §5 — Regression metric calculator (MAE/MSE/RMSE/R²)
   ===================================================================== */
function regCalc() {
  const root = $('#regCalc');
  const N = 7;
  const y = [4, 5, 3, 5, 2, 4, 3];
  const yh = [3.8, 4.5, 3.2, 4.7, 2.5, 3.9, 2.7];
  function render() {
    const err = y.map((v, i) => v - yh[i]);
    const mae = mean(err.map(Math.abs));
    const mse = mean(err.map(e => e * e));
    const rmse = Math.sqrt(mse);
    const ybar = mean(y);
    const ss_res = sum(err.map(e => e * e));
    const ss_tot = sum(y.map(v => (v - ybar) ** 2));
    const r2 = ss_tot === 0 ? 1 : 1 - ss_res / ss_tot;

    let table = `<table><tr><th>i</th><th>y (true)</th><th>ŷ (pred, drag)</th><th>error</th></tr>`;
    for (let i = 0; i < N; i++) {
      table += `<tr>
        <td>${i + 1}</td>
        <td><input type="range" min="1" max="5" step="1" value="${y[i]}" data-y="${i}" style="width:120px"> <span style="font-family:var(--mono)">${y[i]}</span></td>
        <td><input type="range" min="1" max="5" step="0.1" value="${yh[i]}" data-h="${i}" style="width:120px"> <span style="font-family:var(--mono)">${fmt(yh[i])}</span></td>
        <td style="font-family:var(--mono);color:${Math.abs(err[i]) > 0.7 ? 'var(--bad)' : 'var(--good)'}">${err[i].toFixed(2)}</td>
      </tr>`;
    }
    table += '</table>';

    root.innerHTML = table + `
      <div class="metric-cards">
        <div class="mc"><div class="lbl">MAE</div><div class="val">${fmt(mae)}</div></div>
        <div class="mc"><div class="lbl">MSE</div><div class="val">${fmt(mse)}</div></div>
        <div class="mc"><div class="lbl">RMSE</div><div class="val">${fmt(rmse)}</div></div>
        <div class="mc"><div class="lbl">R²</div><div class="val ${r2 > 0.7 ? 'good' : r2 < 0 ? 'bad' : 'warn'}">${fmt(r2)}</div></div>
      </div>
      <p class="hint" style="margin-top:10px;">RMSE penalizes large errors more than MAE. R² is the proportion of variance explained — can go negative if the model is worse than predicting the mean.</p>
    `;

    $$('input[data-y]', root).forEach(el => el.oninput = () => { y[+el.dataset.y] = +el.value; render(); });
    $$('input[data-h]', root).forEach(el => el.oninput = () => { yh[+el.dataset.h] = +el.value; render(); });
  }
  render();
}

/* =====================================================================
   §6 — Confusion-matrix sandbox
   ===================================================================== */
function confusionDemo() {
  const root = $('#confusion');
  let TP = 32, FN = 8, FP = 12, TN = 48;
  function render() {
    const P = TP / (TP + FP || 1);
    const R = TP / (TP + FN || 1);
    const F1 = (P + R) ? 2 * P * R / (P + R) : 0;
    const acc = (TP + TN) / (TP + TN + FP + FN);
    root.innerHTML = `
      <div class="cm">
        <div></div>
        <div class="cm-head">Predicted Positive</div>
        <div class="cm-head">Predicted Negative</div>
        <div class="cm-head" style="display:flex;align-items:center;justify-content:center">Actual<br/>Positive</div>
        <div class="cm-cell tp"><div class="v" id="TP">${TP}</div><div class="l">True Positive</div></div>
        <div class="cm-cell fn"><div class="v" id="FN">${FN}</div><div class="l">False Negative</div></div>
        <div class="cm-head" style="display:flex;align-items:center;justify-content:center">Actual<br/>Negative</div>
        <div class="cm-cell fp"><div class="v" id="FP">${FP}</div><div class="l">False Positive</div></div>
        <div class="cm-cell tn"><div class="v" id="TN">${TN}</div><div class="l">True Negative</div></div>
      </div>
      <div class="metric-cards">
        <div class="mc"><div class="lbl">Accuracy</div><div class="val">${fmt(acc)}</div></div>
        <div class="mc"><div class="lbl">Precision</div><div class="val good">${fmt(P)}</div></div>
        <div class="mc"><div class="lbl">Recall</div><div class="val good">${fmt(R)}</div></div>
        <div class="mc"><div class="lbl">F1</div><div class="val">${fmt(F1)}</div></div>
      </div>
      <p class="hint" style="margin-top:10px;">Click a cell to ±1 the count (shift-click to −1).</p>
    `;
    ['TP','FN','FP','TN'].forEach(k => {
      const el = $('#' + k, root);
      el.parentElement.onclick = e => {
        const d = e.shiftKey ? -1 : 1;
        if (k === 'TP') TP = Math.max(0, TP + d);
        if (k === 'FN') FN = Math.max(0, FN + d);
        if (k === 'FP') FP = Math.max(0, FP + d);
        if (k === 'TN') TN = Math.max(0, TN + d);
        render();
      };
    });
  }
  render();
}

/* =====================================================================
   §6b — ROC curve sandbox
   ===================================================================== */
function rocDemo() {
  const root = $('#rocPanel'), tIn = $('#rocT'), tV = $('#rocTv'), re = $('#rocReseed');
  let pts = [];
  function gen() {
    // 40 items: half positive (scores skewed high), half negative (skewed low) — with overlap
    pts = [];
    for (let i = 0; i < 20; i++) {
      pts.push({ label: 1, score: clamp(rnd(0.35, 1.0) + rnd(-0.15, 0.0), 0, 1) });
      pts.push({ label: 0, score: clamp(rnd(0.0, 0.65) + rnd(0.0, 0.15), 0, 1) });
    }
    render();
  }
  function compute(thr) {
    let TP = 0, FP = 0, TN = 0, FN = 0;
    pts.forEach(p => {
      const pred = p.score >= thr;
      if (pred && p.label === 1) TP++;
      else if (pred && p.label === 0) FP++;
      else if (!pred && p.label === 1) FN++;
      else TN++;
    });
    const TPR = TP / (TP + FN || 1);
    const FPR = FP / (FP + TN || 1);
    const P = TP / (TP + FP || 1);
    return { TP, FP, TN, FN, TPR, FPR, P };
  }
  function render() {
    const thr = +tIn.value / 100; tV.textContent = thr.toFixed(2);
    const m = compute(thr);
    // Compute ROC curve points
    const sorted = [...pts].sort((a, b) => b.score - a.score);
    const roc = [{ fpr: 0, tpr: 0 }];
    let tp = 0, fp = 0;
    const totalP = pts.filter(p => p.label === 1).length;
    const totalN = pts.filter(p => p.label === 0).length;
    sorted.forEach(p => {
      if (p.label === 1) tp++; else fp++;
      roc.push({ fpr: fp / totalN, tpr: tp / totalP });
    });
    // AUC via trapezoid
    let auc = 0;
    for (let i = 1; i < roc.length; i++) auc += (roc[i].fpr - roc[i - 1].fpr) * (roc[i].tpr + roc[i - 1].tpr) / 2;
    const W = 280, H = 220, pad = 30;
    const sx = x => pad + x * (W - 2 * pad);
    const sy = y => H - pad - y * (H - 2 * pad);
    const pathD = roc.map((p, i) => `${i === 0 ? 'M' : 'L'}${sx(p.fpr)},${sy(p.tpr)}`).join(' ');
    root.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;align-items:start;">
        <div>
          <svg width="${W}" height="${H}" style="background:var(--bg2);border:1px solid var(--line);border-radius:8px;">
            <line x1="${pad}" y1="${H - pad}" x2="${W - pad}" y2="${pad}" stroke="#9aa3c0" stroke-dasharray="3,3" />
            <line x1="${pad}" y1="${H - pad}" x2="${W - pad}" y2="${H - pad}" stroke="#9aa3c0" />
            <line x1="${pad}" y1="${pad}" x2="${pad}" y2="${H - pad}" stroke="#9aa3c0" />
            <path d="${pathD}" fill="none" stroke="#7aa2ff" stroke-width="2" />
            <circle cx="${sx(m.FPR)}" cy="${sy(m.TPR)}" r="6" fill="#fbbf24" />
            <text x="${W - pad}" y="${H - 8}" fill="#9aa3c0" font-size="11" text-anchor="end">FPR →</text>
            <text x="10" y="${pad}" fill="#9aa3c0" font-size="11">TPR ↑</text>
          </svg>
          <div style="font-family:var(--mono);font-size:12px;color:var(--ink-dim);margin-top:6px;">yellow dot = current threshold · diagonal = random classifier</div>
        </div>
        <div>
          <div class="metric-cards">
            <div class="mc"><div class="lbl">TP</div><div class="val good">${m.TP}</div></div>
            <div class="mc"><div class="lbl">FP</div><div class="val warn">${m.FP}</div></div>
            <div class="mc"><div class="lbl">FN</div><div class="val bad">${m.FN}</div></div>
            <div class="mc"><div class="lbl">TN</div><div class="val good">${m.TN}</div></div>
            <div class="mc"><div class="lbl">TPR (recall)</div><div class="val">${fmt(m.TPR, 3)}</div></div>
            <div class="mc"><div class="lbl">FPR</div><div class="val">${fmt(m.FPR, 3)}</div></div>
            <div class="mc"><div class="lbl">Precision</div><div class="val">${fmt(m.P, 3)}</div></div>
            <div class="mc"><div class="lbl">AUC</div><div class="val ${auc > .85 ? 'good' : auc > .65 ? 'warn' : 'bad'}">${fmt(auc, 3)}</div></div>
          </div>
        </div>
      </div>
      <div style="margin-top:14px;display:flex;flex-wrap:wrap;gap:4px;">
        ${pts.sort((a, b) => b.score - a.score).map(p => `
          <div title="label=${p.label}, score=${fmt(p.score, 2)}" style="
            display:flex;flex-direction:column;align-items:center;
            background:${p.score >= thr ? 'rgba(122,162,255,.2)' : 'var(--bg2)'};
            border:1px solid ${p.label ? 'var(--good)' : 'var(--bad)'};
            border-radius:5px;padding:3px 6px;font-family:var(--mono);font-size:10px;">
            <div>${p.label}</div><div style="color:var(--ink-dim);">${fmt(p.score, 2)}</div>
          </div>`).join('')}
      </div>
      <p class="hint" style="margin-top:8px;">Each chip = one item. Border green = truly positive, red = truly negative. Background highlight = predicted positive (score ≥ τ).</p>
    `;
  }
  tIn.oninput = render; re.onclick = gen;
  gen();
}

/* =====================================================================
   §15b — Train/Test split visualizer + cold-start
   ===================================================================== */
function splitDemo() {
  const root = $('#splitPanel'), methodEl = $('#splitMethod'), re = $('#splitReseed');
  let interactions = [];
  function gen() {
    // 10 users × 8 items, sparse, with timestamps
    interactions = [];
    const U = 8, I = 10;
    for (let u = 0; u < U; u++) {
      const n = irnd(2, 8);
      const items = [];
      while (items.length < n) {
        const j = irnd(0, I);
        if (!items.includes(j)) items.push(j);
      }
      items.forEach(j => interactions.push({ u, j, r: irnd(1, 6), t: rnd(0, 1) }));
    }
    render();
  }
  function split() {
    const m = methodEl.value;
    let train = [], test = [];
    if (m === 'random') {
      interactions.forEach(it => Math.random() < 0.8 ? train.push(it) : test.push(it));
    } else if (m === 'stratified') {
      // group by user, take 20% per user to test
      const byUser = {};
      interactions.forEach(it => (byUser[it.u] = byUser[it.u] || []).push(it));
      Object.values(byUser).forEach(arr => {
        const shuffled = [...arr].sort(() => Math.random() - 0.5);
        const cut = Math.max(1, Math.floor(arr.length * 0.2));
        test.push(...shuffled.slice(0, cut));
        train.push(...shuffled.slice(cut));
      });
    } else if (m === 'time') {
      const sorted = [...interactions].sort((a, b) => a.t - b.t);
      const cut = Math.floor(sorted.length * 0.8);
      train = sorted.slice(0, cut);
      test = sorted.slice(cut);
    }
    return { train, test };
  }
  function render() {
    const { train, test } = split();
    const trainUsers = new Set(train.map(it => it.u));
    const trainItems = new Set(train.map(it => it.j));
    const coldUsers = new Set();
    const coldItems = new Set();
    test.forEach(it => { if (!trainUsers.has(it.u)) coldUsers.add(it.u); if (!trainItems.has(it.j)) coldItems.add(it.j); });
    const U = 8, I = 10;
    function grid(label, rows, highlight) {
      let html = `<h5 style="margin:0 0 6px;color:var(--ink-dim);font-size:12px;text-transform:uppercase;">${label} (n=${rows.length})</h5>`;
      html += `<div class="matrix" style="grid-template-columns:repeat(${I},minmax(22px,1fr));gap:2px;">`;
      const lookup = {};
      rows.forEach(it => { lookup[`${it.u}-${it.j}`] = it; });
      for (let u = 0; u < U; u++) {
        for (let j = 0; j < I; j++) {
          const it = lookup[`${u}-${j}`];
          const isCold = highlight && (coldUsers.has(u) || coldItems.has(j)) && it;
          let style = '';
          if (it) {
            style = `background:rgba(122,162,255,${0.2 + it.r * 0.12});`;
            if (isCold) style = `background:rgba(248,113,113,.35);outline:1px solid var(--bad);`;
          } else {
            style = 'background:var(--bg);opacity:.3;';
          }
          html += `<div class="cell" style="${style};min-height:20px;font-size:10px;cursor:default;" title="u${u + 1}, i${j + 1}${it ? ', rating=' + it.r : ''}">${it ? it.r : '·'}</div>`;
        }
      }
      html += '</div>';
      return html;
    }
    const overlap = train.length + test.length;
    const ratio = overlap > 0 ? (train.length / overlap * 100).toFixed(0) : 0;
    root.innerHTML = `
      <div class="grid2">
        <div>${grid('Train', train, false)}</div>
        <div>${grid('Test', test, true)}</div>
      </div>
      <div class="metric-cards">
        <div class="mc"><div class="lbl">Train / Test</div><div class="val">${ratio}/${100 - ratio}</div></div>
        <div class="mc"><div class="lbl">Cold users</div><div class="val ${coldUsers.size ? 'bad' : 'good'}">${coldUsers.size}</div></div>
        <div class="mc"><div class="lbl">Cold items</div><div class="val ${coldItems.size ? 'bad' : 'good'}">${coldItems.size}</div></div>
        <div class="mc"><div class="lbl">Test rows hit by cold</div><div class="val ${[...coldUsers].concat([...coldItems]).length ? 'warn' : 'good'}">${test.filter(it => coldUsers.has(it.u) || coldItems.has(it.j)).length}</div></div>
      </div>
      <p class="hint" style="margin-top:10px;">
        Red cells = test interactions where the user or item never appeared in training. A vanilla CF model can't score them — production systems use a fallback (popularity / content-based / random) or exploit-explore (bandits).
        <br/><b>Stratified</b> per-user splits guarantee every user appears in both sets. <b>Time-series</b> mirrors real deployment but reliably creates more cold rows.
      </p>
    `;
  }
  methodEl.onchange = render; re.onclick = gen;
  gen();
}

/* =====================================================================
   §7 — Ranking metrics (drag-to-reorder)
   ===================================================================== */
function ndcgDemo() {
  const root = $('#ndcgDemo'), stats = $('#ndcgStats');
  const Kin = $('#ndcgK'), Kv = $('#ndcgKv'), sh = $('#ndcgShuffle'), id = $('#ndcgIdeal');
  let items = [];
  function gen() {
    items = Array.from({ length: 10 }, (_, i) => ({
      id: 'item ' + String.fromCharCode(65 + i),
      rel: irnd(0, 4)  // 0..3
    }));
    render();
  }
  function shuffle() {
    for (let i = items.length - 1; i > 0; i--) {
      const j = irnd(0, i + 1);[items[i], items[j]] = [items[j], items[i]];
    }
    render();
  }
  function ideal() { items.sort((a, b) => b.rel - a.rel); render(); }
  function render() {
    const K = +Kin.value; Kv.textContent = K;
    const topK = items.slice(0, K);
    const dcg = topK.reduce((s, it, i) => s + it.rel / Math.log2(i + 2), 0);
    const ideal = [...items].sort((a, b) => b.rel - a.rel).slice(0, K);
    const idcg = ideal.reduce((s, it, i) => s + it.rel / Math.log2(i + 2), 0);
    const ndcg = idcg ? dcg / idcg : 0;
    const cg = sum(topK.map(it => it.rel));
    const firstHit = topK.findIndex(it => it.rel > 0);
    const mrr = firstHit >= 0 ? 1 / (firstHit + 1) : 0;
    const relevantInTop = topK.filter(it => it.rel > 0).length;
    const relevantTotal = items.filter(it => it.rel > 0).length;
    const precK = relevantInTop / K;
    const recK = relevantTotal ? relevantInTop / relevantTotal : 0;

    root.innerHTML = `<ol class="rank-list" id="rl">${
      items.map((it, idx) => `
        <li class="rank-item" draggable="true" data-i="${idx}">
          <div class="pos">${idx + 1}${idx + 1 === K ? ' ┊' : ''}</div>
          <div>${it.id}</div>
          <div class="rel" data-r="${it.rel}">rel = ${it.rel}</div>
        </li>`).join('')
    }</ol>`;

    stats.innerHTML = `
      <div class="mc"><div class="lbl">CG@K</div><div class="val">${fmt(cg, 2)}</div></div>
      <div class="mc"><div class="lbl">DCG@K</div><div class="val">${fmt(dcg, 3)}</div></div>
      <div class="mc"><div class="lbl">IDCG@K</div><div class="val">${fmt(idcg, 3)}</div></div>
      <div class="mc"><div class="lbl">NDCG@K</div><div class="val ${ndcg > .9 ? 'good' : ndcg > .5 ? 'warn' : 'bad'}">${fmt(ndcg, 3)}</div></div>
      <div class="mc"><div class="lbl">MRR</div><div class="val">${fmt(mrr, 3)}</div></div>
      <div class="mc"><div class="lbl">P@K</div><div class="val">${fmt(precK, 3)}</div></div>
      <div class="mc"><div class="lbl">R@K</div><div class="val">${fmt(recK, 3)}</div></div>
    `;

    // drag handlers
    let dragIdx = null;
    $$('.rank-item', root).forEach(el => {
      el.ondragstart = e => { dragIdx = +el.dataset.i; el.classList.add('dragging'); };
      el.ondragend = e => { el.classList.remove('dragging'); };
      el.ondragover = e => e.preventDefault();
      el.ondrop = e => {
        e.preventDefault();
        const dropIdx = +el.dataset.i;
        if (dragIdx == null || dragIdx === dropIdx) return;
        const [moved] = items.splice(dragIdx, 1);
        items.splice(dropIdx, 0, moved);
        render();
      };
    });
  }
  Kin.oninput = render;
  sh.onclick = shuffle;
  id.onclick = ideal;
  gen();
}

/* =====================================================================
   §8 — Beyond-accuracy panel
   ===================================================================== */
function diversityPanel() {
  const root = $('#diversityPanel');
  const lam = $('#divLambda'), lamV = $('#divLambdaV'), users = $('#divUsers'), usersV = $('#divUsersV');
  function render() {
    const L = +lam.value / 100; lamV.textContent = L.toFixed(2);
    const U = +users.value; usersV.textContent = U;
    // simulate: catalog of 30 items, 5 categories.
    const N = 30; const C = 5;
    const cat = Array.from({ length: N }, (_, i) => i % C);
    // each user gets a top-5 list. With L=0, all users get popular [0..4]. With L=1, fully personalized random.
    const lists = [];
    for (let u = 0; u < U; u++) {
      const list = [];
      while (list.length < 5) {
        const pickRand = Math.random() < L;
        const candidate = pickRand ? irnd(0, N) : list.length;
        if (!list.includes(candidate)) list.push(candidate);
      }
      lists.push(list);
    }
    const allRecs = new Set(lists.flat());
    const coverage = allRecs.size / N;
    // personalization = 1 - mean jaccard
    let pSum = 0, pN = 0;
    for (let i = 0; i < U; i++) for (let j = i + 1; j < U; j++) {
      const a = new Set(lists[i]), b = new Set(lists[j]);
      const inter = [...a].filter(x => b.has(x)).length;
      const uni = new Set([...a, ...b]).size;
      pSum += 1 - inter / uni; pN++;
    }
    const personalization = pN ? pSum / pN : 0;
    // diversity per user (1 - same-category proportion)
    const divPerUser = lists.map(list => {
      const cats = list.map(i => cat[i]);
      const counts = {};
      cats.forEach(c => counts[c] = (counts[c] || 0) + 1);
      const sameCat = Math.max(...Object.values(counts)) / list.length;
      return 1 - sameCat;
    });
    const diversity = mean(divPerUser);
    const novelty = L; // rough proxy

    root.innerHTML = `
      <div class="metric-cards">
        <div class="mc"><div class="lbl">Coverage</div><div class="val ${coverage>.5?'good':'warn'}">${fmt(coverage)}</div></div>
        <div class="mc"><div class="lbl">Personalization</div><div class="val">${fmt(personalization)}</div></div>
        <div class="mc"><div class="lbl">Diversity (ILS)</div><div class="val">${fmt(diversity)}</div></div>
        <div class="mc"><div class="lbl">Novelty (proxy)</div><div class="val">${fmt(novelty)}</div></div>
      </div>
      <p class="hint" style="margin-top:10px;">At λ=0 the popular recommender gives identical lists → low coverage, zero personalization. As λ→1, recs randomize → coverage rises, personalization rises, but accuracy (not shown) collapses.</p>
    `;
  }
  lam.oninput = users.oninput = render;
  render();
}

/* =====================================================================
   §9 — Cosine similarity (drag-2-vectors)
   ===================================================================== */
function cosineSimDemo() {
  const root = $('#cosineDemo');
  root.innerHTML = `
    <div class="canvas-wrap" style="text-align:center;">
      <canvas id="cosCanvas" width="380" height="380"></canvas>
    </div>
    <div class="metric-cards">
      <div class="mc"><div class="lbl">A</div><div class="val" id="vecA">[ , ]</div></div>
      <div class="mc"><div class="lbl">B</div><div class="val" id="vecB">[ , ]</div></div>
      <div class="mc"><div class="lbl">A · B</div><div class="val" id="dotV"></div></div>
      <div class="mc"><div class="lbl">‖A‖·‖B‖</div><div class="val" id="normV"></div></div>
      <div class="mc"><div class="lbl">cos(θ)</div><div class="val good" id="cosV"></div></div>
      <div class="mc"><div class="lbl">θ</div><div class="val" id="thetaV"></div></div>
    </div>
    <p class="hint">Drag the heads of the two arrows. cos(θ) = A·B / (‖A‖·‖B‖). Identical direction → 1; perpendicular → 0; opposite → −1.</p>
  `;
  const cv = $('#cosCanvas'); const ctx = cv.getContext('2d');
  const W = cv.width, H = cv.height; const cx = W / 2, cy = H / 2;
  let A = { x: 120, y: -40 }, B = { x: 60, y: 90 };
  let dragging = null;

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0b1020'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#2a3258';
    // grid
    for (let x = 0; x < W; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    // axes
    ctx.strokeStyle = '#9aa3c0'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, H); ctx.stroke();
    // vectors
    drawArrow(A.x, A.y, '#7aa2ff');
    drawArrow(B.x, B.y, '#ff8fb1');
    // arc between
    const aAng = Math.atan2(-A.y, A.x); const bAng = Math.atan2(-B.y, B.x);
    ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cy, 40, Math.min(aAng, bAng), Math.max(aAng, bAng)); ctx.stroke();

    // update text
    const a = [A.x, -A.y], b = [B.x, -B.y];
    const c = cosine(a, b);
    $('#vecA').textContent = `[${a[0]},${a[1]}]`;
    $('#vecB').textContent = `[${b[0]},${b[1]}]`;
    $('#dotV').textContent = fmt(dot(a, b), 0);
    $('#normV').textContent = fmt(norm(a) * norm(b), 1);
    $('#cosV').textContent = fmt(c, 3);
    $('#thetaV').textContent = fmt(Math.acos(clamp(c, -1, 1)) * 180 / Math.PI, 1) + '°';
  }
  function drawArrow(dx, dy, color) {
    const x = cx + dx, y = cy + dy;
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x, y); ctx.stroke();
    const ang = Math.atan2(y - cy, x - cx);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 10 * Math.cos(ang - 0.4), y - 10 * Math.sin(ang - 0.4));
    ctx.lineTo(x - 10 * Math.cos(ang + 0.4), y - 10 * Math.sin(ang + 0.4));
    ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.fill();
  }

  cv.onpointerdown = e => {
    const r = cv.getBoundingClientRect();
    const mx = e.clientX - r.left - cx, my = e.clientY - r.top - cy;
    const distA = Math.hypot(mx - A.x, my - A.y), distB = Math.hypot(mx - B.x, my - B.y);
    if (Math.min(distA, distB) < 30) dragging = distA < distB ? A : B;
  };
  cv.onpointermove = e => {
    if (!dragging) return;
    const r = cv.getBoundingClientRect();
    dragging.x = clamp(e.clientX - r.left - cx, -cx + 10, cx - 10);
    dragging.y = clamp(e.clientY - r.top - cy, -cy + 10, cy - 10);
    draw();
  };
  cv.onpointerup = () => dragging = null;
  cv.onpointerleave = () => dragging = null;
  draw();
}

/* =====================================================================
   §10 — KNN-CF sandbox
   ===================================================================== */
function knnCF() {
  const root = $('#knnMatrix'), report = $('#knnReport');
  const K = $('#knnK'), Kv = $('#knnKv'), mode = $('#knnMode'), reseed = $('#knnReseed');
  const U = 6, I = 7;
  let M = [], selected = null;
  function gen() {
    M = Array.from({ length: U }, () => Array.from({ length: I }, () => Math.random() < 0.35 ? 0 : irnd(1, 6)));
    selected = null;
    render();
  }
  function vec(i, isUser) {
    return isUser ? M[i] : M.map(r => r[i]);
  }
  function sim(a, b) {
    // cosine on co-rated cells
    const co = a.map((v, j) => (v && b[j]) ? [v, b[j]] : null).filter(Boolean);
    if (co.length === 0) return 0;
    const av = co.map(p => p[0]), bv = co.map(p => p[1]);
    return cosine(av, bv);
  }
  function render() {
    const k = +K.value; Kv.textContent = k; const m = mode.value;
    root.style.gridTemplateColumns = `60px repeat(${I},minmax(34px,1fr))`;
    root.innerHTML = '';
    const head = document.createElement('div'); head.className = 'cell head'; root.appendChild(head);
    for (let j = 0; j < I; j++) {
      const c = document.createElement('div'); c.className = 'cell head'; c.textContent = 'i' + (j + 1);
      c.style.cursor = m === 'item' ? 'pointer' : 'default';
      if (m === 'item') c.onclick = () => { selected = j; render(); };
      root.appendChild(c);
    }
    let neighbors = [];
    if (selected != null) {
      const v0 = vec(selected, m === 'user');
      const N = m === 'user' ? U : I;
      const sims = Array.from({ length: N }, (_, k2) => ({
        idx: k2,
        sim: k2 === selected ? -2 : sim(v0, vec(k2, m === 'user'))
      })).filter(s => s.sim > -2).sort((a, b) => b.sim - a.sim);
      neighbors = sims.slice(0, k);
    }
    for (let i = 0; i < U; i++) {
      const lbl = document.createElement('div'); lbl.className = 'cell head'; lbl.textContent = 'u' + (i + 1);
      lbl.style.cursor = m === 'user' ? 'pointer' : 'default';
      if (m === 'user') lbl.onclick = () => { selected = i; render(); };
      if (m === 'user' && i === selected) lbl.style.color = 'var(--accent)';
      if (m === 'user' && neighbors.some(n => n.idx === i)) lbl.style.color = 'var(--good)';
      root.appendChild(lbl);
      for (let j = 0; j < I; j++) {
        const c = document.createElement('div');
        c.className = 'cell';
        const v = M[i][j];
        if (v === 0) { c.classList.add('unrated'); c.textContent = '·'; }
        else {
          c.textContent = v;
          c.style.background = `rgba(122,162,255,${0.15 + (v/5) * 0.5})`;
        }
        if (m === 'user' && i === selected) c.classList.add('highlight');
        if (m === 'user' && neighbors.some(n => n.idx === i)) c.style.outline = '2px solid var(--good)';
        if (m === 'item' && j === selected) c.classList.add('highlight');
        if (m === 'item' && neighbors.some(n => n.idx === j)) c.style.outline = '2px solid var(--good)';
        root.appendChild(c);
      }
    }
    // Report
    if (selected == null) {
      report.innerHTML = `<p class="hint">Click a ${m === 'user' ? 'user (row label)' : 'item (column header)'} to see its ${k} nearest neighbours.</p>`;
    } else {
      const me = m === 'user' ? 'u' + (selected + 1) : 'i' + (selected + 1);
      let recsHtml = '';
      if (m === 'user') {
        // predict missing items from neighbour mean weighted by sim
        const preds = [];
        for (let j = 0; j < I; j++) {
          if (M[selected][j] !== 0) continue;
          let num = 0, den = 0;
          neighbors.forEach(n => {
            if (M[n.idx][j] > 0) { num += n.sim * M[n.idx][j]; den += Math.abs(n.sim); }
          });
          if (den > 0) preds.push({ item: 'i' + (j + 1), score: num / den });
        }
        preds.sort((a, b) => b.score - a.score);
        recsHtml = `<b>Predicted top items for ${me}:</b><br/>` + preds.slice(0, 3).map(p => `${p.item} → ${fmt(p.score)}`).join(' · ') || '— no candidates';
      } else {
        recsHtml = `<b>Items similar to ${me}:</b><br/>` + neighbors.map(n => `i${n.idx + 1} (sim=${fmt(n.sim, 2)})`).join(' · ');
      }
      report.innerHTML = `
        <div><b>Selected:</b> ${me}</div>
        <div><b>Top-${k} neighbours by cosine:</b> ${neighbors.map(n => `${m === 'user' ? 'u' : 'i'}${n.idx + 1} (${fmt(n.sim, 2)})`).join(', ')}</div>
        <div style="margin-top:6px;">${recsHtml}</div>
      `;
    }
  }
  K.oninput = render; mode.onchange = () => { selected = null; render(); };
  reseed.onclick = gen;
  gen();
}

/* =====================================================================
   §11 — Matrix Factorization (live SGD)
   ===================================================================== */
function mfDemo() {
  const root = $('#mfMatrices');
  const F = $('#mfFactors'), Fv = $('#mfFactorsV');
  const lr = $('#mfLr'), lrV = $('#mfLrV');
  const ep = $('#mfEpochs'), epV = $('#mfEpochsV');
  const rg = $('#mfReg'), rgV = $('#mfRegV');
  const run = $('#mfRun');
  let chart;
  // sparse true matrix
  const Mtrue = [
    [5, 4, 0, 0, 3, 0],
    [4, 0, 0, 5, 0, 2],
    [0, 3, 4, 0, 0, 3],
    [2, 0, 5, 4, 0, 0],
    [0, 4, 0, 0, 5, 4],
  ];
  const nU = Mtrue.length, nI = Mtrue[0].length;
  function sync() {
    Fv.textContent = F.value; lrV.textContent = (+lr.value / 1000).toFixed(3);
    epV.textContent = ep.value; rgV.textContent = (+rg.value / 100).toFixed(2);
  }
  F.oninput = lr.oninput = ep.oninput = rg.oninput = sync; sync();

  function train() {
    const nF = +F.value, eta = +lr.value / 1000, epochs = +ep.value, reg = +rg.value / 100;
    const P = Array.from({ length: nU }, () => Array.from({ length: nF }, () => rnd(-0.1, 0.1)));
    const Q = Array.from({ length: nI }, () => Array.from({ length: nF }, () => rnd(-0.1, 0.1)));
    // global mean
    const obs = [];
    Mtrue.forEach((r, i) => r.forEach((v, j) => { if (v) obs.push([i, j, v]); }));
    const mu = mean(obs.map(o => o[2]));
    const bU = Array(nU).fill(0), bI = Array(nI).fill(0);
    const losses = [];
    for (let e = 0; e < epochs; e++) {
      // shuffle observations
      for (let s = obs.length - 1; s > 0; s--) { const j = irnd(0, s + 1);[obs[s], obs[j]] = [obs[j], obs[s]]; }
      for (const [i, j, r] of obs) {
        const pred = mu + bU[i] + bI[j] + dot(P[i], Q[j]);
        const err = r - pred;
        bU[i] += eta * (err - reg * bU[i]);
        bI[j] += eta * (err - reg * bI[j]);
        for (let f = 0; f < nF; f++) {
          const pf = P[i][f], qf = Q[j][f];
          P[i][f] += eta * (err * qf - reg * pf);
          Q[j][f] += eta * (err * pf - reg * qf);
        }
      }
      // compute train RMSE
      let se = 0;
      for (const [i, j, r] of obs) {
        const pred = mu + bU[i] + bI[j] + dot(P[i], Q[j]);
        se += (r - pred) ** 2;
      }
      losses.push(Math.sqrt(se / obs.length));
    }
    // build prediction matrix
    const Mpred = Array.from({ length: nU }, (_, i) =>
      Array.from({ length: nI }, (_, j) => mu + bU[i] + bI[j] + dot(P[i], Q[j])));
    renderMats(Mpred);
    renderLoss(losses);
  }
  function renderMats(Mpred) {
    function tableOf(M, cls = '') {
      let html = `<table style="font-family:var(--mono);font-size:11px;${cls}"><tr><th></th>`;
      for (let j = 0; j < nI; j++) html += `<th>i${j + 1}</th>`;
      html += '</tr>';
      for (let i = 0; i < nU; i++) {
        html += `<tr><td>u${i + 1}</td>`;
        for (let j = 0; j < nI; j++) {
          const v = M[i][j];
          const t = Mtrue[i][j];
          let style = '';
          if (t === 0) style = 'color:var(--accent2);';
          html += `<td style="${style}">${fmt(v, 1)}</td>`;
        }
        html += '</tr>';
      }
      return html + '</table>';
    }
    root.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:10px;">
        <div><h5 style="margin:0 0 4px;color:var(--ink-dim);font-size:12px;">Original (sparse)</h5>${tableOf(Mtrue)}</div>
        <div><h5 style="margin:0 0 4px;color:var(--ink-dim);font-size:12px;">Reconstructed</h5>${tableOf(Mpred)}</div>
        <p class="hint" style="margin:0;">Pink values are unobserved cells the model has predicted (collaborative filtering at work).</p>
      </div>
    `;
  }
  function renderLoss(losses) {
    const cv = $('#mfLoss'); const ctx = cv.getContext('2d');
    if (chart) chart.destroy();
    chart = new Chart(ctx, {
      type: 'line',
      data: { labels: losses.map((_, i) => i + 1), datasets: [{ label: 'Train RMSE', data: losses, borderColor: '#7aa2ff', backgroundColor: 'rgba(122,162,255,.2)', tension: .2, pointRadius: 0 }] },
      options: { responsive: false, scales: { x: { ticks: { color: '#9aa3c0', maxTicksLimit: 8 }, grid: { color: '#2a3258' } }, y: { ticks: { color: '#9aa3c0' }, grid: { color: '#2a3258' } } }, plugins: { legend: { labels: { color: '#e7ecf6' } } } }
    });
  }
  run.onclick = train;
  // initial render
  renderMats(Mtrue);
  train();
}

/* =====================================================================
   §12 — TF-IDF live calculator
   ===================================================================== */
function tfidfDemo() {
  const docsRoot = $('#tfidfDocs'), panel = $('#tfidfPanel');
  let docs = [
    'space exploration discovers new planets and stars',
    'a love story of programming and coding passion',
    'galaxies and stars fascinate astronomers exploring space',
    'coding bootcamp builds careers in software programming'
  ];
  function render() {
    docsRoot.innerHTML = docs.map((d, i) => `<input class="doc-input" data-i="${i}" value="${d.replace(/"/g, '&quot;')}" />`).join('');
    $$('input', docsRoot).forEach(el => el.oninput = () => { docs[+el.dataset.i] = el.value; recompute(); });
    recompute();
  }
  function tok(s) { return s.toLowerCase().split(/\W+/).filter(x => x.length > 1); }
  function recompute() {
    const tokenized = docs.map(tok);
    const vocab = [...new Set(tokenized.flat())].sort();
    const N = docs.length;
    const df = {}; vocab.forEach(w => df[w] = tokenized.filter(t => t.includes(w)).length);
    const idf = {}; vocab.forEach(w => idf[w] = Math.log(N / df[w]));
    const tf = tokenized.map(t => {
      const o = {}; vocab.forEach(w => o[w] = 0); t.forEach(w => o[w]++); return o;
    });
    const tfidf = tf.map(o => { const r = {}; vocab.forEach(w => r[w] = o[w] * idf[w]); return r; });

    let html = `<div class="tfidf-table" style="margin-top:14px;"><table>`;
    html += `<tr><th>term</th>` + docs.map((_, i) => `<th>d${i + 1} (tf)</th>`).join('') + `<th>df</th><th>idf</th>` + docs.map((_, i) => `<th>d${i + 1} (tfidf)</th>`).join('') + `</tr>`;
    vocab.forEach(w => {
      html += `<tr><td><b>${w}</b></td>`;
      tf.forEach(t => html += `<td class="${t[w] === 0 ? 'v0' : 'vlow'}">${t[w]}</td>`);
      html += `<td>${df[w]}</td><td class="vlow">${fmt(idf[w], 2)}</td>`;
      tfidf.forEach(t => {
        const v = t[w]; const cls = v === 0 ? 'v0' : v > 0.5 ? 'vhigh' : 'vlow';
        html += `<td class="${cls}">${fmt(v, 2)}</td>`;
      });
      html += `</tr>`;
    });
    html += '</table></div>';

    // pairwise cosine
    const vecs = tfidf.map(t => vocab.map(w => t[w]));
    let cosHtml = `<div class="tfidf-table" style="margin-top:14px;"><h5 style="margin:0 0 6px;color:var(--accent);font-size:12px;text-transform:uppercase;">Pairwise cosine similarity</h5><table><tr><th></th>${docs.map((_, i) => `<th>d${i + 1}</th>`).join('')}</tr>`;
    vecs.forEach((v, i) => {
      cosHtml += `<tr><td><b>d${i + 1}</b></td>`;
      vecs.forEach((w, j) => {
        const c = i === j ? 1 : cosine(v, w);
        const intensity = (1 - c) * 100;
        cosHtml += `<td style="background:hsl(220, 50%, ${20 + intensity / 3}%);color:${c > 0.3 ? 'var(--good)' : 'var(--ink-dim)'};">${fmt(c, 2)}</td>`;
      });
      cosHtml += '</tr>';
    });
    cosHtml += '</table></div>';

    panel.innerHTML = html + cosHtml;
  }
  render();
}

/* =====================================================================
   §13 — PCA embedding playground (mini, hand-built)
   ===================================================================== */
function pcaDemo() {
  const root = $('#pcaDemo');
  // 8 mini words with fake 5-d "embeddings"
  const words = [
    { w: 'cat', v: [0.9, 0.1, 0.8, 0.2, 0.1] },
    { w: 'kitten', v: [0.88, 0.12, 0.82, 0.18, 0.11] },
    { w: 'dog', v: [0.85, 0.2, 0.7, 0.3, 0.1] },
    { w: 'puppy', v: [0.83, 0.18, 0.72, 0.28, 0.12] },
    { w: 'car', v: [0.1, 0.9, 0.2, 0.8, 0.3] },
    { w: 'truck', v: [0.12, 0.88, 0.18, 0.82, 0.32] },
    { w: 'plane', v: [0.15, 0.5, 0.1, 0.6, 0.9] },
    { w: 'jet', v: [0.18, 0.52, 0.12, 0.62, 0.88] },
  ];
  // 2-D PCA via centering + 2 random projections (cheap demo)
  function project(active) {
    const sel = words.filter(w => active.includes(w.w));
    // center
    const m = sel[0].v.map((_, k) => mean(sel.map(s => s.v[k])));
    const centered = sel.map(s => s.v.map((x, k) => x - m[k]));
    // 2 fixed projections (precomputed roughly capturing variance)
    const ax1 = [1, -1, 0.8, -0.7, 0.2];
    const ax2 = [0.2, 0.3, -0.4, 0.4, 1];
    const pts = centered.map((c, i) => ({
      w: sel[i].w,
      x: dot(c, ax1),
      y: dot(c, ax2),
    }));
    return pts;
  }
  let active = words.map(w => w.w);
  function render() {
    const pts = project(active);
    const minX = Math.min(...pts.map(p => p.x)), maxX = Math.max(...pts.map(p => p.x));
    const minY = Math.min(...pts.map(p => p.y)), maxY = Math.max(...pts.map(p => p.y));
    const W = 400, H = 280, pad = 40;
    const sx = x => pad + (x - minX) / (maxX - minX || 1) * (W - 2 * pad);
    const sy = y => H - pad - (y - minY) / (maxY - minY || 1) * (H - 2 * pad);
    root.innerHTML = `
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;">
        ${words.map(w => `<label style="font-size:12px;background:var(--bg2);padding:4px 8px;border-radius:6px;cursor:pointer;border:1px solid ${active.includes(w.w) ? 'var(--accent)' : 'var(--line)'};">
          <input type="checkbox" data-w="${w.w}" ${active.includes(w.w) ? 'checked' : ''} style="margin-right:4px;"> ${w.w}
        </label>`).join('')}
      </div>
      <svg width="${W}" height="${H}" style="background:var(--bg2);border-radius:8px;border:1px solid var(--line);">
        <line x1="${pad}" y1="${H - pad}" x2="${W - pad}" y2="${H - pad}" stroke="#9aa3c0" />
        <line x1="${pad}" y1="${pad}" x2="${pad}" y2="${H - pad}" stroke="#9aa3c0" />
        <text x="${W - pad}" y="${H - 10}" fill="#9aa3c0" font-size="11" text-anchor="end">PC1</text>
        <text x="10" y="${pad}" fill="#9aa3c0" font-size="11">PC2</text>
        ${pts.map(p => `
          <circle cx="${sx(p.x)}" cy="${sy(p.y)}" r="6" fill="${p.w.match(/cat|kitten|dog|puppy/) ? '#7aa2ff' : p.w.match(/car|truck/) ? '#ff8fb1' : '#6ee7b7'}" />
          <text x="${sx(p.x) + 9}" y="${sy(p.y) + 4}" fill="#e7ecf6" font-size="12">${p.w}</text>
        `).join('')}
      </svg>
      <p class="hint">Words from the same semantic cluster (pets / vehicles / aircraft) project close together. This is exactly what TF-IDF cannot capture but BERT does.</p>
    `;
    $$('input[type=checkbox]', root).forEach(el => el.onchange = () => {
      if (el.checked) active.push(el.dataset.w);
      else active = active.filter(w => w !== el.dataset.w);
      render();
    });
  }
  render();
}

/* =====================================================================
   §14 — Hybrid weighted slider + mixed (rank aggregation)
   ===================================================================== */
function hybridDemo() {
  const root = $('#hybridChart'), W = $('#hybW'), Wv = $('#hybWv');
  const cf = { A: 4.2, B: 3.5, C: 4.8, D: 2.9, E: 3.7 };
  const cb = { A: 3.0, B: 4.7, C: 3.8, D: 4.2, E: 2.8 };
  function render() {
    const w1 = +W.value / 100; Wv.textContent = w1.toFixed(2);
    const w2 = 1 - w1;
    const rows = Object.keys(cf).map(k => ({ k, cf: cf[k], cb: cb[k], mix: w1 * cf[k] + w2 * cb[k] }));
    rows.sort((a, b) => b.mix - a.mix);
    root.innerHTML = `
      <table><tr><th>item</th><th>CF (w₁=${w1.toFixed(2)})</th><th>CB (w₂=${w2.toFixed(2)})</th><th>blend</th><th>bar</th></tr>
      ${rows.map(r => `
        <tr><td><b>${r.k}</b></td>
          <td style="font-family:var(--mono)">${fmt(r.cf)}</td>
          <td style="font-family:var(--mono)">${fmt(r.cb)}</td>
          <td style="font-family:var(--mono);color:var(--good)">${fmt(r.mix)}</td>
          <td><div style="background:var(--grad);width:${(r.mix/5)*180}px;height:10px;border-radius:3px;"></div></td>
        </tr>`).join('')}
      </table>
    `;
  }
  W.oninput = render; render();
}

function mixedHybrid() {
  const root = $('#mixedHybrid');
  const RS1 = ['D', 'A', 'B', 'C']; // rank: D=4,A=3,B=2,C=1
  const RS2 = ['A', 'B', 'D', 'C']; // rank: A=4,B=3,D=2,C=1
  const score = {};
  ['A','B','C','D'].forEach(k => {
    score[k] = (RS1.length - RS1.indexOf(k)) + (RS2.length - RS2.indexOf(k));
  });
  const ordered = Object.entries(score).sort((a,b) => b[1] - a[1]);
  root.innerHTML = `
    <table>
      <tr><th>RS1 ranking</th><th>RS2 ranking</th><th>combined score</th><th>final order</th></tr>
      <tr>
        <td>${RS1.map((k,i) => `${k} (${RS1.length-i})`).join(' → ')}</td>
        <td>${RS2.map((k,i) => `${k} (${RS2.length-i})`).join(' → ')}</td>
        <td>${Object.entries(score).map(([k,v]) => `${k}=${v}`).join(', ')}</td>
        <td style="font-family:var(--mono);color:var(--good)">${ordered.map(([k]) => k).join(' → ')}</td>
      </tr>
    </table>
    <p class="hint" style="margin-top:8px;">Each recommender contributes a rank score (higher = better). We sum and re-sort. Borda count, essentially.</p>
  `;
}

/* =====================================================================
   §15 — CARS paradigms
   ===================================================================== */
function carsDemo() {
  const tabs = $('#carsTabs'), body = $('#carsBody');
  const content = {
    pre: `
      <h4>Contextual Pre-Filtering</h4>
      <p>Split the data by context value, train a separate 2D RS per subset, pick the matching model at inference.</p>
      <pre style="background:var(--bg2);border:1px solid var(--line);border-radius:6px;padding:10px;font-size:12px;overflow:auto;">
data ────► split by context ────► [ Weekend  data → RS_w ]
                                  [ Weekday  data → RS_d ]
                                  [ Holiday  data → RS_h ]
inference:  pick the model that matches today's context, query for top-k.
      </pre>
      <p><b>Pros:</b> any base RS works (CF, CB, hybrid).<br/>
      <b>Cons:</b> each sub-model sees less data.</p>
    `,
    post: `
      <h4>Contextual Post-Filtering</h4>
      <p>Train one 2D RS on everything. Then filter or re-rank the candidate list using context rules.</p>
      <pre style="background:var(--bg2);border:1px solid var(--line);border-radius:6px;padding:10px;font-size:12px;overflow:auto;">
all-data ──► single RS ──► candidates ──► [context-aware filter / re-rank] ──► final list
      </pre>
      <p><b>Example:</b> A user only watches comedies on weekends. The base RS proposes a mixed list; the post-filter drops dramas on Saturday.</p>
    `,
    model: `
      <h4>Contextual Modeling</h4>
      <p>Context becomes a first-class input to the model. The function jumps from 2D to 3D: $g:U\\times I\\times C \\to \\mathbb{R}$.</p>
      <p>Needs algorithms that consume the extra dimension natively — Tensor Factorization, Factorization Machines, DeepFM.</p>
      <pre style="background:var(--bg2);border:1px solid var(--line);border-radius:6px;padding:10px;font-size:12px;overflow:auto;">
user_id, item_id, context_features ──► model ──► predicted score
      </pre>
    `
  };
  function show(t) {
    $$('button', tabs).forEach(b => b.classList.toggle('active', b.dataset.tab === t));
    body.innerHTML = content[t];
    if (window.renderMathInElement) renderMathInElement(body, { delimiters: [{ left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false }] });
  }
  tabs.onclick = e => { if (e.target.dataset.tab) show(e.target.dataset.tab); };
  show('pre');
}

/* =====================================================================
   §16 — Hyperparameter optimisation
   ===================================================================== */
function hpoDemo() {
  const root = $('#hpoPanel');
  const W = 320, H = 220;
  // hidden loss surface: bumpy w/ global min around (0.7, 0.4)
  function loss(x, y) {
    return 0.5 + 0.4 * Math.sin(5 * x) * Math.cos(5 * y) + 1.2 * ((x - 0.7) ** 2 + (y - 0.4) ** 2);
  }
  // pre-compute heatmap
  function bg(ctx) {
    const img = ctx.createImageData(W, H);
    for (let py = 0; py < H; py++) for (let px = 0; px < W; px++) {
      const x = px / W, y = 1 - py / H;
      const l = loss(x, y);
      const t = clamp((l - 0.1) / 1.5, 0, 1);
      const r = Math.floor(20 + 60 * t), g = Math.floor(20 + 30 * t), b = Math.floor(70 + 100 * (1 - t));
      const idx = (py * W + px) * 4;
      img.data[idx] = r; img.data[idx + 1] = g; img.data[idx + 2] = b; img.data[idx + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }
  function drawPoints(ctx, pts, bestIdx) {
    pts.forEach((p, i) => {
      const px = p.x * W, py = (1 - p.y) * H;
      ctx.fillStyle = i === bestIdx ? '#6ee7b7' : '#fbbf24';
      ctx.beginPath(); ctx.arc(px, py, i === bestIdx ? 6 : 3, 0, Math.PI * 2); ctx.fill();
    });
  }
  function render(gPts = [], bPts = []) {
    root.innerHTML = `
      <div class="hpo-grid">
        <div>
          <h5>Grid Search — exhaustive 8×8 = 64 evals</h5>
          <canvas id="hpoG" width="${W}" height="${H}" style="background:#0b1020;border:1px solid var(--line);border-radius:6px;"></canvas>
          <div class="stats" id="hpoGstats">— click "Run Grid Search"</div>
        </div>
        <div>
          <h5>Bayesian Opt — guided exploration (~15 evals)</h5>
          <canvas id="hpoB" width="${W}" height="${H}" style="background:#0b1020;border:1px solid var(--line);border-radius:6px;"></canvas>
          <div class="stats" id="hpoBstats">— click "Run Bayesian Opt"</div>
        </div>
      </div>
      <p class="hint">Same hidden loss surface. Yellow dots = explored, green = best so far. Bayesian opt focuses near the dark/low region after a few samples.</p>
    `;
    const gC = $('#hpoG').getContext('2d'); const bC = $('#hpoB').getContext('2d');
    bg(gC); bg(bC);
    if (gPts.length) {
      const bestI = gPts.reduce((bi, p, i) => p.l < gPts[bi].l ? i : bi, 0);
      drawPoints(gC, gPts, bestI);
      $('#hpoGstats').innerHTML = `Best: f(${fmt(gPts[bestI].x, 2)}, ${fmt(gPts[bestI].y, 2)}) = ${fmt(gPts[bestI].l, 3)} · evals: ${gPts.length}`;
    }
    if (bPts.length) {
      const bestI = bPts.reduce((bi, p, i) => p.l < bPts[bi].l ? i : bi, 0);
      drawPoints(bC, bPts, bestI);
      $('#hpoBstats').innerHTML = `Best: f(${fmt(bPts[bestI].x, 2)}, ${fmt(bPts[bestI].y, 2)}) = ${fmt(bPts[bestI].l, 3)} · evals: ${bPts.length}`;
    }
  }
  let gpts = [], bpts = [];
  $('#hpoGrid').onclick = () => {
    gpts = [];
    for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) {
      const x = (i + 0.5) / 8, y = (j + 0.5) / 8;
      gpts.push({ x, y, l: loss(x, y) });
    }
    render(gpts, bpts);
  };
  $('#hpoBayes').onclick = () => {
    bpts = [];
    // simple BO: initial 3 random points, then iteratively pick argmin of GP-mean - 0.4*var (proxy)
    for (let k = 0; k < 3; k++) {
      const x = Math.random(), y = Math.random();
      bpts.push({ x, y, l: loss(x, y) });
    }
    for (let k = 0; k < 12; k++) {
      let bestX, bestY, bestAcq = Infinity;
      for (let i = 0; i < 600; i++) {
        const x = Math.random(), y = Math.random();
        // mean = weighted by inv distance; var = min distance proxy
        let num = 0, den = 0, minD = Infinity;
        bpts.forEach(p => {
          const d = Math.hypot(p.x - x, p.y - y) + 1e-6;
          num += p.l / d; den += 1 / d; minD = Math.min(minD, d);
        });
        const mu = num / den, sigma = Math.min(0.5, minD);
        const acq = mu - 1.5 * sigma;
        if (acq < bestAcq) { bestAcq = acq; bestX = x; bestY = y; }
      }
      bpts.push({ x: bestX, y: bestY, l: loss(bestX, bestY) });
    }
    render(gpts, bpts);
  };
  $('#hpoReset').onclick = () => { gpts = []; bpts = []; render(); };
  render();
}

/* =====================================================================
   §17 — Feedback loop + position bias
   ===================================================================== */
function loopDiagram() {
  const root = $('#loopDiagram');
  const nodes = [
    { i: '📥', n: 'Data Collection', b: 'Selection · Exposure · Conformity · Position' },
    { i: '🧠', n: 'Model Learning', b: 'Inductive bias' },
    { i: '🚀', n: 'Serving', b: 'Popularity · Unfairness' },
    { i: '👥', n: 'User Interaction', b: 'Drives next round of data' },
  ];
  root.innerHTML = `
    <div class="loop">
      ${nodes.map(n => `<div class="node"><div class="icon">${n.i}</div><div class="name">${n.n}</div><div class="bias">${n.b}</div></div>`).join('')}
    </div>
    <p class="hint">Bias compounds: a model trained on biased data produces biased recs, which generate biased clicks, which become next-cycle training data. Without intervention, this is a runaway loop.</p>
  `;
}

function positionBiasDemo() {
  const root = $('#positionBias');
  const positions = [1,2,3,4,5,6,7,8];
  const propensity = positions.map(p => 1 / Math.pow(p, 0.7));   // click prob by position
  const observed = [0.42, 0.28, 0.21, 0.17, 0.14, 0.12, 0.10, 0.09];
  const corrected = observed.map((o, i) => o / propensity[i]);
  root.innerHTML = `
    <table>
      <tr><th>position</th><th>observed CTR</th><th>position propensity Pₚ</th><th>corrected R̂</th></tr>
      ${positions.map((p,i) => `
        <tr>
          <td>${p}</td>
          <td style="font-family:var(--mono)">${fmt(observed[i],3)}</td>
          <td style="font-family:var(--mono)">${fmt(propensity[i],3)}</td>
          <td style="font-family:var(--mono);color:var(--good)">${fmt(corrected[i],3)}</td>
        </tr>`).join('')}
    </table>
    <p class="hint">Items shown at the top get more clicks even when they're not better. Divide each observed click rate by the position propensity to estimate true relevance.</p>
  `;
}

/* =====================================================================
   §18 — Multi-armed bandits: ε-greedy + Thompson
   ===================================================================== */
function epsGreedy() {
  const root = $('#egPanel');
  const trueP = [0.05, 0.15, 0.30, 0.10, 0.45];
  let pulls = trueP.map(() => 0), wins = trueP.map(() => 0);
  let totalReward = 0, totalRegret = 0, t = 0;
  const optimal = Math.max(...trueP);
  const epsIn = $('#egEps'), epsV = $('#egEpsV');

  function step(n = 1) {
    const eps = +epsIn.value / 100;
    for (let k = 0; k < n; k++) {
      let arm;
      if (Math.random() < eps) arm = irnd(0, 5);
      else {
        const means = trueP.map((_, i) => pulls[i] ? wins[i] / pulls[i] : 0);
        arm = means.indexOf(Math.max(...means));
      }
      const r = Math.random() < trueP[arm] ? 1 : 0;
      pulls[arm]++; wins[arm] += r;
      totalReward += r;
      totalRegret += optimal - trueP[arm];
      t++;
    }
    render();
  }
  function reset() {
    pulls = trueP.map(() => 0); wins = trueP.map(() => 0);
    totalReward = 0; totalRegret = 0; t = 0;
    render();
  }
  function render() {
    const eps = +epsIn.value / 100; epsV.textContent = eps.toFixed(2);
    root.innerHTML = `
      <div class="arm-grid">
        ${trueP.map((p, i) => {
          const est = pulls[i] ? wins[i] / pulls[i] : 0;
          const best = i === trueP.indexOf(Math.max(...trueP));
          return `<div class="arm-card ${best?'best':''}">
            <h5>Arm ${i + 1}${best ? ' 🥇' : ''}</h5>
            <div class="ab">true CTR = ${fmt(p, 3)} ${best ? '(optimal)' : ''}</div>
            <div class="ctr" style="margin-top:4px;">est = <b style="color:${Math.abs(est-p)<.05?'var(--good)':'var(--warn)'}">${fmt(est, 3)}</b></div>
            <div class="ab">pulls: ${pulls[i]} · wins: ${wins[i]}</div>
            <div style="height:6px;background:var(--bg);border-radius:3px;margin-top:6px;"><div style="background:var(--grad);height:100%;width:${(pulls[i]/(t||1))*100}%;border-radius:3px;"></div></div>
          </div>`;
        }).join('')}
      </div>
      <div class="metric-cards">
        <div class="mc"><div class="lbl">Rounds</div><div class="val">${t}</div></div>
        <div class="mc"><div class="lbl">Total reward</div><div class="val good">${totalReward}</div></div>
        <div class="mc"><div class="lbl">Cumulative regret</div><div class="val ${totalRegret>15?'warn':''}">${fmt(totalRegret, 2)}</div></div>
        <div class="mc"><div class="lbl">Avg reward</div><div class="val">${fmt(t ? totalReward/t : 0, 3)}</div></div>
      </div>
    `;
  }
  $('#egStep').onclick = () => step(1);
  $('#egRun').onclick = () => step(500);
  $('#egReset').onclick = reset;
  epsIn.oninput = render;
  reset();
}

function thompson() {
  const root = $('#tsPanel');
  const trueP = [0.10, 0.20, 0.50, 0.35, 0.15];
  let A = trueP.map(() => 1), B = trueP.map(() => 1);
  let t = 0, totalReward = 0;

  // sample from Beta(a,b) via two Gamma approximations (sum of exponentials)
  function gamma(k) {
    let x = 0;
    for (let i = 0; i < k; i++) x += -Math.log(Math.random());
    return x;
  }
  function betaSample(a, b) {
    // crude but adequate beta sampler using rejection with normal approx for big a,b
    if (a < 1) a = 1; if (b < 1) b = 1;
    const x = gamma(Math.floor(a)), y = gamma(Math.floor(b));
    return x / (x + y);
  }
  function step(n = 1) {
    for (let k = 0; k < n; k++) {
      const samples = trueP.map((_, i) => betaSample(A[i], B[i]));
      const arm = samples.indexOf(Math.max(...samples));
      const r = Math.random() < trueP[arm] ? 1 : 0;
      if (r) A[arm]++; else B[arm]++;
      totalReward += r; t++;
    }
    render();
  }
  function reset() {
    A = trueP.map(() => 1); B = trueP.map(() => 1);
    t = 0; totalReward = 0; render();
  }
  function pdfBeta(a, b, x) {
    // unnormalized
    return Math.pow(x, a - 1) * Math.pow(1 - x, b - 1);
  }
  function drawArm(canvas, a, b, isBest) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0b1020'; ctx.fillRect(0, 0, w, h);
    // build curve
    const xs = []; for (let i = 0; i <= 100; i++) xs.push(i / 100);
    const ys = xs.map(x => pdfBeta(a, b, x));
    const maxY = Math.max(...ys);
    ctx.strokeStyle = isBest ? '#6ee7b7' : '#7aa2ff';
    ctx.fillStyle = isBest ? 'rgba(110,231,183,.3)' : 'rgba(122,162,255,.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    xs.forEach((x, i) => {
      const px = x * w, py = h - (ys[i] / maxY) * (h - 6) - 3;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    });
    ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath();
    ctx.fill(); ctx.stroke();
    // mean
    const m = a / (a + b);
    ctx.strokeStyle = '#fbbf24';
    ctx.beginPath(); ctx.moveTo(m * w, 0); ctx.lineTo(m * w, h); ctx.stroke();
  }
  function render() {
    const bestIdx = trueP.indexOf(Math.max(...trueP));
    root.innerHTML = `
      <div class="arm-grid">
        ${trueP.map((p, i) => {
          const m = A[i] / (A[i] + B[i]);
          return `<div class="arm-card ${i === bestIdx?'best':''}">
            <h5>Arm ${i + 1}${i === bestIdx ? ' 🥇' : ''}</h5>
            <div class="ab">α=${A[i]} · β=${B[i]} · true=${fmt(p, 2)}</div>
            <canvas id="ts${i}" width="170" height="60"></canvas>
            <div class="ctr">post. mean = <b>${fmt(m, 3)}</b></div>
          </div>`;
        }).join('')}
      </div>
      <div class="metric-cards">
        <div class="mc"><div class="lbl">Rounds</div><div class="val">${t}</div></div>
        <div class="mc"><div class="lbl">Total reward</div><div class="val good">${totalReward}</div></div>
        <div class="mc"><div class="lbl">Avg reward</div><div class="val">${fmt(t ? totalReward / t : 0, 3)}</div></div>
        <div class="mc"><div class="lbl">Best mean est</div><div class="val good">${fmt(A[bestIdx] / (A[bestIdx] + B[bestIdx]), 3)}</div></div>
      </div>
    `;
    trueP.forEach((_, i) => drawArm($('#ts' + i), A[i], B[i], i === bestIdx));
  }
  $('#tsStep').onclick = () => step(1);
  $('#tsRun').onclick = () => step(200);
  $('#tsReset').onclick = reset;
  reset();
}

/* =====================================================================
   §19 — Production funnel
   ===================================================================== */
function funnelDemo() {
  const root = $('#funnel');
  const stages = [
    { name: 'Catalog', count: '100,000,000+', detail: 'All items.', color: '#2a3258' },
    { name: '① Retrieval', count: '~1,000–10,000', detail: 'MF · two-tower · ANN · graph traversal. Cheap per-item, broad recall, often multi-source.' },
    { name: '② Filtering', count: '~5,000', detail: 'Business rules. Out-of-stock, age restrictions, already-consumed, geo-licensing, Bloom filters.' },
    { name: '③ Scoring', count: '~500', detail: 'Heavy ranker: deep CF / DLRM / transformer. Highest compute per item.' },
    { name: '④ Ordering', count: '~20', detail: 'Diversity re-rank, exploration injection, business-rule reorder. Final UI list.' },
  ];
  let active = 1;
  function render() {
    root.innerHTML = stages.map((s, i) => `
      <div class="funnel-stage ${i === active ? 'active' : ''}" data-i="${i}" style="width:${100 - i * 12}%;">
        <div><div class="name">${s.name}</div><div class="count" style="font-size:11px;">${s.detail || ''}</div></div>
        <div class="count">${s.count}</div>
      </div>`).join('');
    $$('.funnel-stage', root).forEach(el => el.onclick = () => { active = +el.dataset.i; render(); });
  }
  render();
}

/* =====================================================================
   §20 — Learning to Rank illustrated
   ===================================================================== */
function ltrDemo() {
  const root = $('#ltrDemo');
  const items = [
    { id: 'A', rel: 3, score: 0.4 },
    { id: 'B', rel: 0, score: 0.7 },
    { id: 'C', rel: 2, score: 0.5 },
    { id: 'D', rel: 1, score: 0.3 },
    { id: 'E', rel: 3, score: 0.6 },
  ];
  function pointwise() {
    return items.map(it => ({ ...it, loss: it.rel === 0 ? it.score : 1 - it.score })).map(it => ({ ...it, loss: it.loss }));
  }
  function pairwise() {
    let inversions = 0;
    for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
      if (items[i].rel > items[j].rel && items[i].score < items[j].score) inversions++;
      if (items[i].rel < items[j].rel && items[i].score > items[j].score) inversions++;
    }
    return inversions;
  }
  function listwise() {
    // NDCG vs ideal
    const sorted = [...items].sort((a, b) => b.score - a.score);
    const dcg = sorted.reduce((s, it, i) => s + it.rel / Math.log2(i + 2), 0);
    const idcg = [...items].sort((a, b) => b.rel - a.rel).reduce((s, it, i) => s + it.rel / Math.log2(i + 2), 0);
    return idcg ? dcg / idcg : 0;
  }
  const pw = pointwise();
  const inv = pairwise();
  const ndcg = listwise();
  root.innerHTML = `
    <table>
      <tr><th>item</th><th>true rel</th><th>predicted score</th><th>pointwise loss</th></tr>
      ${pw.map(it => `<tr><td>${it.id}</td><td>${it.rel}</td><td style="font-family:var(--mono)">${fmt(it.score)}</td><td style="font-family:var(--mono);color:${it.loss>0.5?'var(--bad)':'var(--good)'}">${fmt(it.loss)}</td></tr>`).join('')}
    </table>
    <div class="metric-cards" style="margin-top:14px;">
      <div class="mc"><div class="lbl">Pointwise total loss</div><div class="val">${fmt(sum(pw.map(p=>p.loss)))}</div></div>
      <div class="mc"><div class="lbl">Pairwise inversions</div><div class="val ${inv>2?'warn':''}">${inv}</div></div>
      <div class="mc"><div class="lbl">Listwise NDCG</div><div class="val ${ndcg>.85?'good':'warn'}">${fmt(ndcg, 3)}</div></div>
    </div>
    <p class="hint" style="margin-top:10px;">Pointwise treats every item independently. Pairwise counts <i>"out-of-order"</i> pairs (BPR's target). Listwise measures the whole list's NDCG/MRR (RankALS, CLiMF).</p>
  `;
}

/* =====================================================================
   Init all
   ===================================================================== */
window.RECSYS_INIT = function () {
  utilityMatrix();
  recTypes();
  implicitMap();
  popularDemo();
  regCalc();
  confusionDemo();
  rocDemo();
  ndcgDemo();
  diversityPanel();
  cosineSimDemo();
  knnCF();
  mfDemo();
  tfidfDemo();
  pcaDemo();
  hybridDemo();
  mixedHybrid();
  carsDemo();
  splitDemo();
  hpoDemo();
  loopDiagram();
  positionBiasDemo();
  epsGreedy();
  thompson();
  funnelDemo();
  ltrDemo();
};
