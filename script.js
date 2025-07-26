
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
});

// JSONデータ取得
async function fetchData(path) {
  const res = await fetch(path);
  return await res.json();
}

// ローカルストレージから読み込み
function loadFromStorage() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return data && typeof data === "object" ? data : {};
  } catch {
    return {};
  }
}

// ローカルストレージに保存
function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(checkState));
}

// サマリー表を描画
function renderSummaryTable() {
  const container = document.querySelector(".container");
  const summaryTable = document.createElement("table");
  summaryTable.className = "table table-bordered table-sm mt-4";

  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr>
      <th></th>
      <th>全寝顔</th>
      <th>ワカクサ本島</th>
      <th>シアンの砂浜</th>
      <th>トープ洞窟</th>
      <th>ウノハナ雪原</th>
      <th>ラピスラズリ湖畔</th>
      <th>ゴールド旧発電所</th>
    </tr>`;
  summaryTable.appendChild(thead);

  const rows = [
    ["うとうと", "a", "b", "c", "d", "e", "f", "g"],
    ["すやすや", "h", "i", "j", "k", "l", "m", "n"],
    ["ぐっすり", "o", "p", "q", "r", "s", "t", "u"],
    ["合計", "v", "w", "x", "A", "B", "C", "D"]
  ];

  const tbody = document.createElement("tbody");
  for (const rowData of rows) {
    const tr = document.createElement("tr");
    for (const cell of rowData) {
      const td = document.createElement("td");
      td.textContent = cell;
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }

  summaryTable.appendChild(tbody);

  // フィールド説明文の直後に挿入
  const description = container.querySelector("p");
  description.insertAdjacentElement("afterend", summaryTable);
}

// ページ初期化時に呼び出す
window.addEventListener("DOMContentLoaded", async () => {
  rawData = await fetchData(jsonPath);
  checkState = loadFromStorage();
  renderAllTabs();
  bindExportImport();
  renderSummaryTable();  // ←ここで呼び出し
});

// タブごとの表を描画（出現しないポケモンは除外）
function renderAllTabs() {
  const fieldKeys = {
    "ワカクサ本島": "ワカクサ本島",
    "シアンの砂浜": "シアンの砂浜",
    "トープ洞窟": "トープ洞窟",
    "ウノハナ雪原": "ウノハナ雪原",
    "ラピスラズリ湖畔": "ラピスラズリ湖畔",
    "ゴールド旧発電所": "ゴールド旧発電所"
  };

  const baseData = rawData["すべての寝顔一覧"] || [];

  for (const tabName of [
    "すべての寝顔一覧",
    "ワカクサ本島",
    "シアンの砂浜",
    "トープ洞窟",
    "ウノハナ雪原",
    "ラピスラズリ湖畔",
    "ゴールド旧発電所"
  ]) {
    const tabId = getTabIdByName(tabName);
    const container = document.getElementById(tabId);
    if (!container) continue;

    let displayRecords = baseData;

    if (fieldKeys[tabName]) {
      const fieldKey = fieldKeys[tabName];
      displayRecords = baseData.filter(row => {
        const val = row[fieldKey];
        return typeof val === "string" && val.trim() !== "";
      });
    }

    const table = createTable(displayRecords);
    container.innerHTML = "";
    container.appendChild(table);
  }
}

// タブ名 → HTML上のIDに変換
function getTabIdByName(name) {
  return {
    "すべての寝顔一覧": "tab-all",
    "ワカクサ本島": "tab-wakakusa",
    "シアンの砂浜": "tab-cyan",
    "トープ洞窟": "tab-taupe",
    "ウノハナ雪原": "tab-unohana",
    "ラピスラズリ湖畔": "tab-lapis",
    "ゴールド旧発電所": "tab-gold"
  }[name];
}

// 表の作成
function createTable(data) {
  const table = document.createElement("table");
  table.className = "table table-bordered table-hover table-sm";

  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr>
      <th>取得</th>
      <th>図鑑No</th>
      <th>ポケモン名</th>
      <th>レア度</th>
      <th>睡眠タイプ</th>
      <th>ワカクサ本島</th>
      <th>シアンの砂浜</th>
      <th>トープ洞窟</th>
      <th>ウノハナ雪原</th>
      <th>ラピスラズリ湖畔</th>
      <th>ゴールド旧発電所</th>
    </tr>`;

  const tbody = document.createElement("tbody");
  for (const row of data) {
    const tr = document.createElement("tr");

    // チェックボックス
    const tdCheck = document.createElement("td");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.setAttribute("data-id", row.ID);
    checkbox.checked = !!checkState[row.ID];

    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        checkState[row.ID] = true;
      } else {
        delete checkState[row.ID];
      }
      saveToStorage();
      syncCheckboxes(row.ID, checkbox.checked);
    });

    tdCheck.appendChild(checkbox);
    tr.appendChild(tdCheck);

    // 残りの列
    const columns = [
      row.No, row.Name, row.DisplayRarity, row.Style,
      row["ワカクサ本島"] || "",
      row["シアンの砂浜"] || "",
      row["トープ洞窟"] || "",
      row["ウノハナ雪原"] || "",
      row["ラピスラズリ湖畔"] || "",
      row["ゴールド旧発電所"] || ""
    ];

    for (const col of columns) {
      const td = document.createElement("td");
      td.textContent = col;
      tr.appendChild(td);
    }

    tbody.appendChild(tr);
  }

  table.appendChild(thead);
  table.appendChild(tbody);
  return table;
}

// 同じIDのチェックボックスを全タブで連動
function syncCheckboxes(id, checked) {
  const checkboxes = document.querySelectorAll('input[type="checkbox"][data-id="' + id + '"]');
  checkboxes.forEach(cb => {
    if (cb.checked !== checked) {
      cb.checked = checked;
    }
  });
}

// バックアップ用：エクスポート・インポート
function bindExportImport() {
  const exportBtn = document.getElementById("exportBtn");
  const importFile = document.getElementById("importFile");

  exportBtn.addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(checkState, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "backup.json";
    a.click();
    URL.revokeObjectURL(url);
  });

  importFile.addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const imported = JSON.parse(e.target.result);
        if (typeof imported === "object") {
          checkState = imported;
          saveToStorage();
          renderAllTabs();
        }
      } catch {
        alert("無効なJSONファイルです。");
      }
    };
    reader.readAsText(file);
  });
}
