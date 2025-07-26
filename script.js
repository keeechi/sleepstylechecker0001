
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
  const baseData = rawData["すべての寝顔一覧"] || [];

// 既存のサマリー表を削除
  const existing = container.querySelector("table.mt-4");
  if (existing) existing.remove();

//描画
  const fields = ["全寝顔", "ワカクサ本島", "シアンの砂浜", "トープ洞窟", "ウノハナ雪原", "ラピスラズリ湖畔", "ゴールド旧発電所"];
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
      const checked = filtered.filter(row => checkState[row.ID]).length;
      const rate = total === 0 ? 0 : Math.round((checked / total) * 100);
      const td = document.createElement("td");
      td.innerText = `${checked} / ${total}\n取得率: ${rate}%`;
      tr.appendChild(td);
    }

    tbody.appendChild(tr);
  }

  // 合計行
  const trTotal = document.createElement("tr");
  const totalTh = document.createElement("th");
  totalTh.textContent = "合計";
  trTotal.appendChild(totalTh);

  for (const field of fields) {
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
  }

  tbody.appendChild(trTotal);
  summaryTable.appendChild(tbody);

  // フィールド説明文の直後に挿入
  const description = container.querySelector("p");
  description.insertAdjacentElement("afterend", summaryTable);
}
;

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

  const tableWrapper = document.createElement("div");

// 表にフィルターUI追加
  const filterWrapper = document.createElement("div");
  filterWrapper.className = "mb-2";

  const styleTypes = ["うとうと", "すやすや", "ぐっすり"];
  const rarities = ["★1", "★2", "★3", "★4", "★5"];

  const selectedStyles = new Set(styleTypes);
  const selectedRarities = new Set(rarities);

  const styleLabel = document.createElement("label");
  styleLabel.textContent = "睡眠タイプ: ";
  filterWrapper.appendChild(styleLabel);

  styleTypes.forEach(type => {
    const label = document.createElement("label");
    label.className = "ms-2";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = true;
    input.className = "me-1";
    input.addEventListener("change", () => {
      if (input.checked) selectedStyles.add(type);
      else selectedStyles.delete(type);
      updateFilteredRows();
    });
    label.appendChild(input);
    label.append(type);
    filterWrapper.appendChild(label);
  });

// 表の作成-再開
  const rarityLabel = document.createElement("label");
  rarityLabel.textContent = "　レア度: ";
  filterWrapper.appendChild(rarityLabel);

  rarities.forEach(rarity => {
    const label = document.createElement("label");
    label.className = "ms-2";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = true;
    input.className = "me-1";
    input.addEventListener("change", () => {
      if (input.checked) selectedRarities.add(rarity);
      else selectedRarities.delete(rarity);
      updateFilteredRows();
    });
    label.appendChild(input);
    label.append(rarity);
    filterWrapper.appendChild(label);
  });

  tableWrapper.appendChild(filterWrapper);

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
      renderSummaryTable();
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
  renderSummaryTable();
  tableWrapper.appendChild(table);

  function updateFilteredRows() {
    const rows = table.querySelectorAll("tbody tr");
    rows.forEach(row => {
      const style = row.cells[4].textContent;
      const rarity = row.cells[3].textContent;
      const show = selectedStyles.has(style) && selectedRarities.has(rarity);
      row.style.display = show ? "" : "none";
    });
  }

  return tableWrapper;
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
