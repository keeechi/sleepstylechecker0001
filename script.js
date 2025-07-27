// 定数・グローバル変数
const jsonPath = "pokemonsleep_data.json";
const STORAGE_KEY = "pokemonSleepChecks";
let rawData = {};
let checkState = {};

// ページ初期化
window.addEventListener("DOMContentLoaded", async () => {
  rawData = await fetchData(jsonPath);
  checkState = loadFromStorage();
  renderAllTabs();
  bindExportImport();
  renderSummaryTable();
  renderMainTabs();
});

// JSONデータ取得
async function fetchData(path) {
  const res = await fetch(path);
  return res.json();
}

// ローカルストレージ読み込み
function loadFromStorage() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return data && typeof data === 'object' ? data : {};
  } catch {
    return {};
  }
}

// ローカルストレージ保存
function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(checkState));
}

// サマリー表描画
function renderSummaryTable() {
  const container = document.querySelector(".container");
  const baseData = rawData["すべての寝顔一覧"] || [];

  // 既存サマリー表を削除
  const existing = container.querySelector("table.mt-4");
  if (existing) existing.remove();

  const fields = [
    "全寝顔", "ワカクサ本島", "シアンの砂浜", "トープ洞窟",
    "ウノハナ雪原", "ラピスラズリ湖畔", "ゴールド旧発電所"
  ];
  const styles = ["うとうと", "すやすや", "ぐっすり"];

  const summaryTable = document.createElement("table");
  summaryTable.className = "table table-bordered table-sm mt-4";

  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr>
      <th></th>
      ${fields.map(f => `<th>${f}</th>`).join("")}
    </tr>`;
  summaryTable.appendChild(thead);

  const tbody = document.createElement("tbody");

  styles.forEach(style => {
    const tr = document.createElement("tr");
    const th = document.createElement("th");
    th.textContent = style;
    tr.appendChild(th);

    fields.forEach(field => {
      const filtered = baseData.filter(row => {
        if (row.Style !== style) return false;
        if (field === "全寝顔") return true;
        return typeof row[field] === "string" && row[field].trim() !== "";
      });
      const total = filtered.length;
      const checked = filtered.filter(row => checkState[row.ID]).length;
      const rate = total === 0 ? 0 : Math.round((checked / total) * 100);
      const td = document.createElement("td");
      td.innerText = `${checked} / ${total}\n取得率: ${rate}%`;
      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });

  // 合計行
  const trTotal = document.createElement("tr");
  const totalTh = document.createElement("th");
  totalTh.textContent = "合計";
  trTotal.appendChild(totalTh);

  fields.forEach(field => {
    const filtered = baseData.filter(row => {
      if (field === "全寝顔") return true;
      return typeof row[field] === "string" && row[field].trim() !== "";
    });
    const total = filtered.length;
    const checked = filtered.filter(row => checkState[row.ID]).length;
    const rate = total === 0 ? 0 : Math.round((checked / total) * 100);
    const td = document.createElement("td");
    td.innerText = `${checked} / ${total}\n取得率: ${rate}%`;
    trTotal.appendChild(td);
  });
  tbody.appendChild(trTotal);
  summaryTable.appendChild(tbody);

  const description = container.querySelector("p");
  if (description) description.insertAdjacentElement("afterend", summaryTable);

  renderMainTabs();
}

// メインタブ描画
function renderMainTabs() {
  const container = document.querySelector(".container");
  const existing = document.getElementById("main-tabs");
  if (existing) existing.remove();

  const tabsWrapper = document.createElement("div");
  tabsWrapper.id = "main-tabs";

  const nav = document.createElement("ul");
  nav.className = "nav nav-tabs mt-3";
  nav.innerHTML = `
    <li class="nav-item">
      <a class="nav-link active" data-bs-toggle="tab" href="#tab-alltabs">寝顔の一覧・フィールドごとの情報</a>
    </li>
    <li class="nav-item">
      <a class="nav-link" data-bs-toggle="tab" href="#tab-reverse">現在のフィールド・ランクから検索</a>
    </li>`;
  tabsWrapper.appendChild(nav);

  const content = document.createElement("div");
  content.className = "tab-content border border-top-0 p-3 bg-white";
  content.innerHTML = `
    <div class="tab-pane fade show active" id="tab-alltabs">
      <ul class="nav nav-tabs mb-3" id="subTabNav">
        <li class="nav-item"><a class="nav-link active" data-bs-toggle="tab" href="#tab-all">すべての寝顔一覧</a></li>
        <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#tab-wakakusa">ワカクサ本島</a></li>
        <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#tab-cyan">シアンの砂浜</a></li>
        <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#tab-taupe">トープ洞窟</a></li>
        <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#tab-unohana">ウノハナ雪原</a></li>
        <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#tab-lapis">ラピスラズリ湖畔</a></li>
        <li class="nav-item"><a class="nav-link" data-bs-toggle="tab" href="#tab-gold">ゴールド旧発電所</a></li>
      </ul>
      <div class="tab-content" id="subTabContent">
        <div class="tab-pane fade show active" id="tab-all"></div>
        <div class="tab-pane fade" id="tab-wakakusa"></div>
        <div class="tab-pane fade" id="tab-cyan"></div>
        <div class="tab-pane fade" id="tab-taupe"></div>
        <div class="tab-pane fade" id="tab-unohana"></div>
        <div class="tab-pane fade" id="tab-lapis"></div>
        <div class="tab-pane fade" id="tab-gold"></div>
      </div>
    </div>
    <div class="tab-pane fade" id="tab-reverse">
      <div id="reverse-search" class="mb-3">
        <label>現在のフィールド:
          <select id="reverseField" class="form-select form-select-sm d-inline w-auto ms-2">
            <option value="">--選択--</option>
            <option value="ワカクサ本島">ワカクサ本島</option>
            <option value="シアンの砂浜">シアンの砂浜</option>
            <option value="トープ洞窟">トープ洞窟</option>
            <option value="ウノハナ雪原">ウノハナ雪原</option>
            <option value="ラピスラズリ湖畔">ラピスラズリ湖畔</option>
            <option value="ゴールド旧発電所">ゴールド旧発電所</option>
          </select>
        </label>
        <label class="ms-4">現在のランク:
          <select id="reverseRank" class="form-select form-select-sm d-inline w-auto ms-2">
            <option value="">--選択--</option>
            ${generateRankOptions()}
          </select>
        </label>
        <button id="reverseBtn" class="btn btn-sm btn-outline-primary ms-4">未取得の寝顔を表示</button>
      </div>
      <div id="reverseResult"></div>
    </div>`;
  tabsWrapper.appendChild(content);

  const summaryTable = document.querySelector("table.mt-4");
  if (summaryTable) summaryTable.insertAdjacentElement("afterend", tabsWrapper);
  else container.appendChild(tabsWrapper);

  renderAllTabs();
  bindReverseSearch();

  document.querySelectorAll('a[data-bs-toggle="tab"]').forEach(tab => {
    tab.addEventListener("shown.bs.tab", event => {
      const isReverse = event.target.getAttribute("href") === "#tab-reverse";
      const alltabsPane = document.getElementById("tab-alltabs");
      if (alltabsPane) alltabsPane.style.display = isReverse ? "none" : "";
      if (!isReverse) renderAllTabs();
    });
  });
}

// サブタブオプション生成
function generateRankOptions() {
  const groups = ["ノーマル", "スーパー", "ハイパー", "マスター"];
  let options = "";
  groups.forEach(g => {
    const count = g === "マスター" ? 20 : 5;
    for (let i = 1; i <= count; i++) {
      options += `<option value="${g}${i}">${g}${i}</option>`;
    }
  });
  return options;
}

// ランクを数値化
function getRankIndex(rank) {
  const levels = { ノーマル: 0, スーパー: 1, ハイパー: 2, マスター: 3 };
  const match = rank.match(/(ノーマル|スーパー|ハイパー|マスター)(\d+)/);
  return match ? levels[match[1]] * 100 + parseInt(match[2], 10) : -1;
}

// 色付き◓+相対ランク
function formatRankDisplay(rankValue) {
  const r = parseInt(rankValue, 10);
  if (isNaN(r)) return "";
  let color, rel;
  if (r <= 5) { color = "#FF0000"; rel = r; }
  else if (r <= 10) { color = "#0000FF"; rel = r - 5; }
  else if (r <= 15) { color = "#FFFF00"; rel = r - 10; }
  else if (r <= 35) { color = "#9933FF"; rel = r - 15; }
  else return String(rankValue);
  return `<span style="color:${color};">◓${rel}</span>`;
}

// 逆引き検索登録
function bindReverseSearch() {
  document.getElementById("reverseBtn").addEventListener("click", () => {
    const field = document.getElementById("reverseField").value;
    const rank = document.getElementById("reverseRank").value;
    if (!field || !rank) return;
    const baseData = rawData["すべての寝顔一覧"] || [];
    const thr = getRankIndex(rank);
    const filtered = baseData.filter(r => r[field] && getRankIndex(r[field]) <= thr && !checkState[r.ID]);
    renderReverseResult(filtered);
  });
}

// 逆引き結果描画
function renderReverseResult(data) {
  const container = document.getElementById("reverseResult");
  container.innerHTML = "";
  container.appendChild(createTable(data));
}

// メイン一覧描画
function renderAllTabs() {
  const active = document.querySelector(".nav-link.active[href^='#tab-']");
  if (!active || active.getAttribute("href") !== "#tab-alltabs") return;
  const fieldKeys = {
    "ワカクサ本島":"ワカクサ本島",
    "シアンの砂浜":"シアンの砂浜",
    "トープ洞窟":"トープ洞窟",
    "ウノハナ雪原":"ウノハナ雪原",
    "ラピスラズリ湖畔":"ラピスラズリ湖畔",
    "ゴールド旧発電所":"ゴールド旧発電所"
  };
  const baseData = rawData["すべての寝顔一覧"] || [];
  for (const tabName of Object.keys(fieldKeys).concat("すべての寝顔一覧")) {
    const id = getTabIdByName(tabName);
    const pane = document.getElementById(id);
    if (!pane) continue;
    let records = baseData;
    if (fieldKeys[tabName]) {
      records = baseData.filter(row => row[fieldKeys[tabName]] && row[fieldKeys[tabName]].trim());
    }
    pane.innerHTML = "";
    pane.appendChild(createTable(records));
  }
}

// タブID取得
function getTabIdByName(name) {
  return {
    "すべての寝顔一覧":"tab-all",
    "ワカクサ本島":"tab-wakakusa",
    "シアンの砂浜":"tab-cyan",
    "トープ洞窟":"tab-taupe",
    "ウノハナ雪原":"tab-unohana",
    "ラピスラズリ湖畔":"tab-lapis",
    "ゴールド旧発電所":"tab-gold"
  }[name];
}

// 表作成
function createTable(data) {
  const wrapper = document.createElement("div");
  // 一括ボタン
  const ctrl = document.createElement("div"); ctrl.className = "mb-2";
  const btnAll = document.createElement("button"); btnAll.className = "btn btn-sm btn-outline-success me-2"; btnAll.textContent = "全てを取得済にする";
  const btnNone = document.createElement("button"); btnNone.className = "btn btn-sm btn-outline-danger"; btnNone.textContent = "全てを未取得にする";
  ctrl.append(btnAll, btnNone); wrapper.appendChild(ctrl);
  // モーダル
  const modal = document.createElement("div");
  modal.innerHTML = `<div class="modal fade" id="confirmModal" tabindex="-1"><div class="modal-dialog"><div class="modal-content"><div class="modal-header"><h5 class="modal-title">確認</h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div><div class="modal-body"><p id="confirmMessage">この操作を実行しますか？</p></div><div class="modal-footer"><button type="button" class="btn btn-secondary" data-bs-dismiss="modal">実行しません</button><button type="button" class="btn btn-primary" id="confirmOkBtn">実行します</button></div></div></div></div>`;
  document.body.appendChild(modal);
  const confirmModal = new bootstrap.Modal(document.getElementById("confirmModal"));
  let action = null;
  btnAll.addEventListener("click", () => {
    document.getElementById("confirmMessage").textContent = "全ての寝顔を取得済の状態にしますか？";
    action = () => { data.forEach(r => checkState[r.ID] = true); saveToStorage(); renderAllTabs(); renderSummaryTable(); };
    confirmModal.show();
  });
  btnNone.addEventListener("click", () => {
    document.getElementById("confirmMessage").textContent = "全ての寝顔を未取得の状態にしますか？";
    action = () => { data.forEach(r => delete checkState[r.ID]); saveToStorage(); renderAllTabs(); renderSummaryTable(); };
    confirmModal.show();
  });
  document.getElementById("confirmOkBtn").addEventListener("click", () => { if (action) action(); confirmModal.hide(); });

  const table = document.createElement("table"); table.className = "table table-bordered table-hover table-sm";
  const thead = document.createElement("thead");
  const filterRow = document.createElement("tr");
  const headerRow = document.createElement("tr");
  const cols = ["取得","図鑑No","ポケモン名","レア度","睡眠タイプ","ワカクサ本島","シアンの砂浜","トープ洞窟","ウノハナ雪原","ラピスラズリ湖畔","ゴールド旧発電所"];
  const selects = {};
  cols.forEach(col => {
    const thH = document.createElement("th"); thH.textContent = col; headerRow.appendChild(thH);
    const thF = document.createElement("th");
    if (col === "取得") {
      const sel = document.createElement("select"); sel.className = "form-select form-select-sm";
      sel.innerHTML = `<option value="">全て</option><option value="取得済">取得済</option><option value="未取得">未取得</option>`;
      thF.appendChild(sel); selects[col] = sel; sel.addEventListener("change", updateFilteredRows);
    } else if (col === "レア度" || col === "睡眠タイプ") {
      const sel = document.createElement("select"); sel.className = "form-select form-select-sm";
      sel.innerHTML = `<option value="">全て</option>`;
      thF.appendChild(sel); selects[col] = sel; sel.addEventListener("change", updateFilteredRows);
    } else if (col === "ポケモン名") {
      const inp = document.createElement("input"); inp.type = "text"; inp.placeholder = "名前で検索"; inp.className = "form-control form-control-sm";
      thF.appendChild(inp); selects[col] = inp; inp.addEventListener("input", updateFilteredRows);
    }
    filterRow.appendChild(thF);
  });
  thead.append(filterRow, headerRow); table.appendChild(thead);

  const tbody = document.createElement("tbody");
  const allRows = [];
  data.forEach(row => {
    const tr = document.createElement("tr");
    // チェック列
    const tdC = document.createElement("td"); const cb = document.createElement("input"); cb.type = "checkbox"; cb.dataset.id = row.ID;
    cb.checked = !!checkState[row.ID]; cb.addEventListener("change", () => {
      if (cb.checked) checkState[row.ID] = true; else delete checkState[row.ID];
      saveToStorage(); syncCheckboxes(row.ID, cb.checked); renderSummaryTable(); renderMainTabs();
    }); tdC.appendChild(cb); tr.appendChild(tdC);
    // その他列
    const vals = [row.No, row.Name, row.DisplayRarity, row.Style,
      row["ワカクサ本島"], row["シアンの砂浜"], row["トープ洞窟"], row["ウノハナ雪原"], row["ラピスラズリ湖畔"], row["ゴールド旧発電所"]
    ];
    vals.forEach((v,i) => {
      const td = document.createElement("td");
      if (i >= 4) td.innerHTML = formatRankDisplay(v);
      else td.textContent = v != null ? v : "";
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
    allRows.push({element: tr, row});
  });
  table.appendChild(tbody);
  wrapper.appendChild(table);

  // セレクトにユニーク値追加
  [...new Set(data.map(r => r.DisplayRarity))].forEach(val => {
    const opt = document.createElement("option"); opt.value = val; opt.textContent = val;
    selects["レア度"].appendChild(opt);
  });
  [...new Set(data.map(r => r.Style))].forEach(val => {
    const opt = document.createElement("option"); opt.value = val; opt.textContent = val;
    selects["睡眠タイプ"].appendChild(opt);
  });

  function toHira(s) {
    return s.replace(/[ァ-ヶ]/g, ch => String.fromCharCode(ch.charCodeAt(0)-0x60));
  }
  function updateFilteredRows() {
    const fRarity = selects["レア度"].value;
    const fStyle = selects["睡眠タイプ"].value;
    const fName = selects["ポケモン名"].value.trim();
    const fCheck = selects["取得"].value;
    const hira = toHira(fName);
    allRows.forEach(({element,row}) => {
      const okR = !fRarity || row.DisplayRarity === fRarity;
      const okS = !fStyle || row.Style === fStyle;
      const okN = !fName || row.Name.includes(fName) || toHira(row.Name).includes(hira);
      const isChecked = !!checkState[row.ID];
      const okC = !fCheck || (fCheck==="取得済"&&isChecked) || (fCheck==="未取得"&&!isChecked);
      element.style.display = (okR && okS && okN && okC) ? "" : "none";
    });
  }

  return wrapper;
}

// 全タブのチェック連動
function syncCheckboxes(id, checked) {
  document.querySelectorAll(`input[type=checkbox][data-id="${id}"]`).forEach(cb => cb.checked = checked);
}

// バックアップイベント登録
function bindExportImport() {
  document.getElementById("exportBtn").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(checkState,null,2)],{type:"application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href=url; a.download="backup.json"; a.click(); URL.revokeObjectURL(url);
  });
  document.getElementById("importFile").addEventListener("change", e => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const d = JSON.parse(r.result);
        if (typeof d==="object") { checkState=d; saveToStorage(); renderAllTabs(); renderSummaryTable(); }
      } catch { alert("無効なJSONファイルです。"); }
    };
    r.readAsText(f);
  });
}
