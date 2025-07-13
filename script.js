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
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

// ローカルストレージに保存
function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(checkState));
}

// タブごとの表を描画
function renderAllTabs() {
  for (const [key, records] of Object.entries(rawData)) {
    const tabId = getTabIdByName(key);
    const container = document.getElementById(tabId);
    if (container) {
      const table = createTable(records);
      container.innerHTML = "";
      container.appendChild(table);
    }
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
    </tr>`;

  const tbody = document.createElement("tbody");
  for (const row of data) {
    const tr = document.createElement("tr");

    // 取得状況（チェックボックス）
    const tdCheck = document.createElement("td");
    tdCheck.className = "checkbox-cell";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
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
    tr.innerHTML += `
      <td>${row.No}</td>
      <td>${row.Name}</td>
      <td>${row.DisplayRarity}</td>
      <td>${row.Style}</td>`;
    tr.children[0].appendChild(checkbox);
    tbody.appendChild(tr);
  }

  table.appendChild(thead);
  table.appendChild(tbody);
  return table;
}

// 同じIDのチェックボックスを全タブで連動
function syncCheckboxes(id, checked) {
  document.querySelectorAll("input[type=checkbox]").forEach(cb => {
    const tr = cb.closest("tr");
    if (!tr) return;
    const cells = tr.querySelectorAll("td");
    if (cells[1] && cells[1].textContent === id.toString()) {
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
