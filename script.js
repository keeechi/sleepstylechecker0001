// 定数・グローバル変数
typedef const jsonPath = "pokemonsleep_data.json";
const STORAGE_KEY = "pokemonSleepChecks";
let rawData = {};
let checkState = {};

// ページ初期化
document.addEventListener("DOMContentLoaded", async () => {
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
  return await res.json();
}

// ローカルストレージ読み込み
function loadFromStorage() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return data && typeof data === "object" ? data : {};
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

  // 既存表を削除
  const existing = container.querySelector("table.mt-4");
  if (existing) existing.remove();

  const fields = ["全寝顔","ワカクサ本島","シアンの砂浜","トープ洞窟","ウノハナ雪原","ラピスラズリ湖畔","ゴールド旧発電所"];
  const styles = ["うとうと","すやすや","ぐっすり"];

  const summaryTable = document.createElement("table");
  summaryTable.className = "table table-bordered table-sm mt-4";

  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr>
      <th></th>
      ${fields.map(f=>`<th>${f}</th>`).join("")}
    </tr>`;
  summaryTable.appendChild(thead);

  const tbody = document.createElement("tbody");
  
  for (const style of styles) {
    const tr = document.createElement("tr");
    const styleCell = document.createElement("th");
    styleCell.textContent = style;
    tr.appendChild(styleCell);

    for (const field of fields) {
      const filtered = baseData.filter(row => {
        if (row.Style !== style) return false;
        if (field === "全寝顔") return true;
        return typeof row[field] === "string" && row[field].trim() !== "";
      });
      const total = filtered.length;
      const checked = filtered.filter(row=>checkState[row.ID]).length;
      const rate = total === 0 ? 0 : Math.round((checked/total)*100);
      const td = document.createElement("td");
      td.innerText = `${checked} / ${total}\n取得率: ${rate}%`;
      tr.appendChild(td);
    }

    tbody.appendChild(tr);
  }

  // 合計行
  const trTotal = document.createElement("tr");
  const totalTh = document.createElement("th"); totalTh.textContent = "合計";
  trTotal.appendChild(totalTh);

  for (const field of fields) {
    const filtered = baseData.filter(row => {
      if (field === "全寝顔") return true;
      return typeof row[field] === "string" && row[field].trim() !== "";
    });
    const total = filtered.length;
    const checked = filtered.filter(row=>checkState[row.ID]).length;
    const rate = total === 0 ? 0 : Math.round((checked/total)*100);
    const td = document.createElement("td");
    td.innerText = `${checked} / ${total}\n取得率: ${rate}%`;
    trTotal.appendChild(td);
  }
  tbody.appendChild(trTotal);
  summaryTable.appendChild(tbody);

  const description = container.querySelector("p");
  description.insertAdjacentElement("afterend", summaryTable);

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
  if (summaryTable) {
    summaryTable.insertAdjacentElement("afterend", tabsWrapper);
  } else {
    container.appendChild(tabsWrapper);
  }

  renderAllTabs();
  bindReverseSearch();

  document.querySelectorAll('a[data-bs-toggle="tab"]').forEach(tab => {
    tab.addEventListener("shown.bs.tab", event => {
      const isReverse = event.target.getAttribute("href") === "#tab-reverse";
      const alltabsPane = document.getElementById("tab-alltabs");
      if (alltabsPane) {
        alltabsPane.style.display = isReverse ? "none" : "";
      }
      if (!isReverse) renderAllTabs();
    });
  });
}

// サブタブオプション生成
function generateRankOptions() {
  const groups = ["ノーマル","スーパー","ハイパー","マスター"];
  let options = "";
  groups.forEach(g => {
    const count = g === "マスター" ? 20 : 5;
    for (let j = 1; j <= count; j++) {
      options += `<option value="${g}${j}">${g}${j}</option>`;
    }
  });
  return options;
}

// ランクの順序を数値化
function getRankIndex(rank) {
  const levels = { ノーマル:0, スーパー:1, ハイパー:2, マスター:3 };
  const match = rank.match(/(ノーマル|スーパー|ハイパー|マスター)(\d+)/);
  if (!match) return -1;
  return levels[match[1]] * 100 + parseInt(match[2], 10);
}

// 色付き◓+相対ランクに変換する
function formatRankDisplay(rankValue) {
  const r = parseInt(rankValue, 10);
  if (isNaN(r)) return "";
  let color, relative;
  if (r >= 1 && r <= 5) {
    color = "#FF0000"; relative = r;
  } else if (r <= 10) {
    color = "#0000FF"; relative = r - 5;
  } else if (r <= 15) {
    color = "#FFFF00"; relative = r - 10;
  } else if (r <= 35) {
    color = "#9933FF"; relative = r - 15;
  } else {
    return String(rankValue);
  }
  return `<span style="color:${color};">◓${relative}</span>`;
}

// 逆引き検索バインド
function bindReverseSearch() {
  document.getElementById("reverseBtn").addEventListener("click", () => {
    const field = document.getElementById("reverseField").value;
    const rank = document.getElementById("reverseRank").value;
    if (!field || !rank) return;
    const baseData = rawData["すべての寝顔一覧"] || [];
    const rankThreshold = getRankIndex(rank);
    const filtered = baseData.filter(row => {
      const fieldRank = row[field];
      if (!fieldRank || getRankIndex(fieldRank) > rankThreshold) return false;
      return !checkState[row.ID];
    });
    renderReverseResult(filtered);
  });
}

// 逆引き結果描画
function renderReverseResult(data) {
  const container = document.getElementById("reverseResult");
  container.innerHTML = "";
  const tableWrapper = createTable(data);
  container.appendChild(tableWrapper);
}

// メイン一覧描画
function renderAllTabs() {
  const activeMainTab = document.querySelector(".nav-link.active[href^='#tab-']");
  if (!activeMainTab || activeMainTab.getAttribute("href") !== "#tab-alltabs") return;
  const fieldKeys = {
    "ワカクサ本島":"ワカクサ本島",
    "シアンの砂浜":"シアンの砂浜",
    "トープ洞窟":"トープ洞窟",
    "ウノハナ雪原":"ウノハナ雪原",\н    "ラピスラズリ湖畔":"ラピスラズリ湖畔",\н    "ゴールド旧発電所":"ゴールド旧発電所"
  };
  const baseData = rawData["すべての寝顔一覧"] || [];
  for (const tabName of ["すべての寝顔一覧","ワカクサ本島","シアンの砂浜","トープ洞窟","ウノハナ雪原","ラピスラズリ湖畔","ゴールド旧発電所"]) {
    const tabId = getTabIdByName(tabName);
    const container = document.getElementById(tabId);
    if (!container) continue;
    let displayRecords = baseData;
    if (fieldKeys[tabName]) {
      displayRecords = baseData.filter(row => {
        const val = row[fieldKeys[tabName]];
        return typeof val === "string" && val.trim() !== "";
      });
    }
    container.innerHTML = "";
    container.appendChild(createTable(displayRecords));
  }
}

// タブID取得
function getTabIdByName(name) {
  return {
    "すべての寝顔一覧":"tab-all",
    "ワカクサ本島":"tab-wakakusa",
    "シアンの砂浜":"tab-cyan",
    "トープ洞窟":"tab-taupe",\н    "ウノハナ雪原":"tab-unohana",
    "ラピスラズリ湖畔":"tab-lapis",
    "ゴールド旧発電所":"tab-gold"
  }[name];
}

// テーブル作成
function createTable(data) {
  const tableWrapper = document.createElement("div");
  // 一括ON/OFFボタン
  const controlWrapper = document.createElement("div"); controlWrapper.className = "mb-2";
  const checkAllBtn = document.createElement("button");
  checkAllBtn.className = "btn btn-sm btn-outline-success me-2";
  checkAllBtn.textContent = "全てを取得済にする";
  const uncheckAllBtn = document.createElement("button");
  uncheckAllBtn.className = "btn btn-sm btn-outline-danger";
  uncheckAllBtn.textContent = "全てを未取得にする";
  controlWrapper.append(checkAllBtn, uncheckAllBtn);
  tableWrapper.appendChild(controlWrapper);
  // モーダルHTML
  const modal = document.createElement("div");
  modal.innerHTML = `
<div class="modal fade" tabindex="-1" id="confirmModal">
  <div class="modal-dialog"><div class="modal-content">
    <div class="modal-header">
      <h5 class="modal-title">確認</h5>
      <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
    </div>
    <div class="modal-body"><p id="confirmMessage">この操作を実行しますか？</p></div>\`
