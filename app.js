const storageKey = "peQuoteSystemStateV104";
const historyKey = "historyQuotes";

const defaultParams = {
  transparentPrice: 46.5,
  milkWhitePrice: 51.5,
  blackPrice: 71.5,
  specialColorPrice: 58,
  plateFee: 2000,
  printFeePerKgColor: 12,
  sealFeePerKg: 8,
  sealFeePerPcs: 0.3,
  minPrintKg: 200
};

const defaults = {
  quoteNo: "QT20260701610",
  quoteDate: "2026-07-01",
  bagType: "PE 平口袋",
  widthCm: 84,
  lengthCm: 66,
  thicknessMm: 0.07,
  material: "transparent",
  quantity: 3000,
  printColors: 2,
  sealMode: "kg",
  lossRate: 7,
  targetMargin: 15,
  quoteMode: "pcs",
  customerPrice: 8.23,
  notes: "",
  params: defaultParams,
  customFields: [
    { label: "客戶名稱", value: "示範有限公司" },
    { label: "產品名稱", value: "PE透明平口袋" },
    { label: "業務人員", value: "Ken" },
    { label: "交期", value: "常規交期 10天" }
  ],
  extraCosts: [
    { enabled: true, label: "運費", method: "固定費用", amount: 800 },
    { enabled: true, label: "打樣費", method: "固定費用", amount: 1500 },
    { enabled: true, label: "模具費", method: "固定費用", amount: 2000 }
  ]
};

let state = loadState();
if (state.quoteMode === "kg") state.sealMode = "kg";
let toastTimer = 0;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadState() {
  const saved = localStorage.getItem(storageKey);
  if (!saved) return clone(defaults);

  try {
    return mergeState(clone(defaults), JSON.parse(saved));
  } catch {
    return clone(defaults);
  }
}

function mergeState(base, saved) {
  return {
    ...base,
    ...saved,
    params: { ...base.params, ...(saved.params || {}) },
    customFields: Array.isArray(saved.customFields) ? saved.customFields : base.customFields,
    extraCosts: Array.isArray(saved.extraCosts) ? saved.extraCosts : base.extraCosts
  };
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function numberValue(value, fallback = 0) {
  const parsed = Number(String(value ?? "").replaceAll(",", ""));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function money(value, digits = 1) {
  return numberValue(value).toLocaleString("zh-TW", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  });
}

function ceilMoney(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.ceil(numberValue(value) * factor - 1e-9) / factor;
}

function pct(value) {
  return `${numberValue(value).toFixed(1)}%`;
}

function displayDate(dateText) {
  if (!dateText) return "";
  const [year, month, day] = String(dateText).split("-");
  if (!year || !month || !day) return dateText;
  return `${year}/${month}/${day}`;
}

function todayString() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function ymd(dateText) {
  return dateText.replaceAll("-", "");
}

function createQuoteNo(dateText = todayString()) {
  const suffix = String(Math.floor(Math.random() * 900) + 100);
  return `QT${ymd(dateText)}${suffix}`;
}

function selectedMaterialPrice() {
  const map = {
    transparent: state.params.transparentPrice,
    milkWhite: state.params.milkWhitePrice,
    black: state.params.blackPrice,
    specialColor: state.params.specialColorPrice
  };
  return numberValue(map[state.material], state.params.transparentPrice);
}

function materialLabel() {
  const map = {
    transparent: "透明",
    milkWhite: "乳白",
    black: "黑色",
    specialColor: "特殊色"
  };
  return map[state.material] || "透明";
}

function calculate() {
  const widthCm = numberValue(state.widthCm);
  const lengthCm = numberValue(state.lengthCm);
  const thicknessMm = numberValue(state.thicknessMm);
  const quantity = numberValue(state.quantity);
  const printColors = numberValue(state.printColors);
  const lossRate = numberValue(state.lossRate);
  const customerPriceInput = numberValue(state.customerPrice);
  const targetMargin = numberValue(state.targetMargin);
  const quoteMode = state.quoteMode === "kg" ? "kg" : "pcs";

  const widthIn = widthCm / 2.54;
  const lengthIn = lengthCm / 2.54;
  const pcsPerKg = widthIn > 0 && lengthIn > 0 && thicknessMm > 0
    ? (360 * 2.2) / (widthIn * lengthIn * thicknessMm)
    : 0;
  const pcsPerKgFloor = pcsPerKg > 0 ? Math.max(1, Math.floor(pcsPerKg)) : 0;
  const totalWeight = pcsPerKgFloor > 0 ? quantity / pcsPerKgFloor : 0;
  const printWeight = Math.max(totalWeight, numberValue(state.params.minPrintKg));
  const materialCost = totalWeight * selectedMaterialPrice();
  const printCost = printWeight * numberValue(state.params.printFeePerKgColor) * printColors;
  const sealCost = state.sealMode === "kg"
    ? totalWeight * numberValue(state.params.sealFeePerKg)
    : quantity * numberValue(state.params.sealFeePerPcs);
  const manufacturingSubtotal = materialCost + printCost + sealCost;
  const lossCost = manufacturingSubtotal * (lossRate / 100);
  const baseSubtotal = manufacturingSubtotal + lossCost + numberValue(state.params.plateFee);
  const enabledExtraCosts = state.extraCosts.filter((row) => row.enabled !== false);
  const extraSubtotal = enabledExtraCosts.reduce((sum, row) => sum + numberValue(row.amount), 0);
  const grandTotal = baseSubtotal + extraSubtotal;
  const unitDivisor = quoteMode === "kg" ? totalWeight : quantity;
  const totalProfitDivisor = quoteMode === "kg" ? totalWeight : quantity;
  const unitCost = unitDivisor > 0 ? baseSubtotal / unitDivisor : 0;
  const extraUnitImpact = unitDivisor > 0 ? extraSubtotal / unitDivisor : 0;
  const suggestedPrice = targetMargin >= 100 ? unitCost : unitCost / (1 - targetMargin / 100);
  const customerPrice = customerPriceInput > 0 ? customerPriceInput : suggestedPrice;
  const unitProfit = customerPrice - unitCost;
  const totalProfit = unitProfit * totalProfitDivisor;
  const margin = customerPrice > 0 ? (unitProfit / customerPrice) * 100 : 0;

  return {
    widthIn,
    lengthIn,
    pcsPerKg,
    pcsPerKgFloor,
    totalWeight,
    printWeight,
    materialCost,
    printCost,
    sealCost,
    manufacturingSubtotal,
    lossCost,
    baseSubtotal,
    extraSubtotal,
    extraUnitImpact,
    grandTotal,
    unitDivisor,
    unitCost,
    suggestedPrice,
    customerPrice,
    unitProfit,
    totalProfit,
    margin
  };
}

function renderFields() {
  $("#quoteNo").value = state.quoteNo;
  $("#quoteDate").value = state.quoteDate;
  $("#notes").value = state.notes;

  $$("[data-field]").forEach((input) => {
    input.value = state[input.dataset.field] ?? "";
  });

  $$("[data-param]").forEach((input) => {
    input.value = state.params[input.dataset.param] ?? "";
  });

  const sealModeSelect = $('[data-field="sealMode"]');
  if (sealModeSelect) {
    sealModeSelect.disabled = state.quoteMode === "kg";
    sealModeSelect.title = state.quoteMode === "kg" ? "按重量計價時，封口計價會同步使用重量計價" : "";
  }

  renderMarginButtons();
}

function renderDynamicLists() {
  $("#customFields").innerHTML = state.customFields.map((row, index) => `
    <div class="custom-row" data-kind="customFields" data-index="${index}">
      <input class="label-input" aria-label="欄位名稱" data-dynamic-key="label" value="${escapeHtml(row.label)}" />
      <input aria-label="欄位內容" data-dynamic-key="value" value="${escapeHtml(row.value)}" />
      <button type="button" class="remove-button icon-button" title="刪除欄位" aria-label="刪除欄位">×</button>
    </div>
  `).join("");

  $("#extraCosts").innerHTML = state.extraCosts.map((row, index) => `
    <tr data-kind="extraCosts" data-index="${index}">
      <td><input aria-label="是否計入" data-dynamic-key="enabled" type="checkbox" ${row.enabled !== false ? "checked" : ""} /></td>
      <td>
        <select aria-label="項目名稱" data-dynamic-key="label">
          ${extraCostOptions(row.label)}
        </select>
      </td>
      <td><input aria-label="計算方式" data-dynamic-key="method" value="${escapeHtml(row.method || "固定費用")}" /></td>
      <td><input aria-label="金額" data-dynamic-key="amount" type="number" step="1" value="${escapeHtml(row.amount)}" /></td>
      <td class="row-actions">
        <button type="button" class="edit-button icon-button" title="編輯項目" aria-label="編輯項目">✎</button>
        <button type="button" class="remove-button icon-button" title="刪除項目" aria-label="刪除項目">×</button>
      </td>
    </tr>
  `).join("");
}

function extraCostOptions(selected) {
  const options = ["運費", "打樣費", "模具費", "刀模費", "包裝費", "其他"];
  return options.map((option) => `<option value="${option}" ${option === selected ? "selected" : ""}>${option}</option>`).join("");
}

function renderResults() {
  const result = calculate();
  const isKgMode = state.quoteMode === "kg";
  const unitName = isKgMode ? "公斤" : "袋子";
  const unitText = isKgMode ? "元/KG" : "元/PCS";
  const profitLabel = isKgMode ? "每公斤利潤" : "每個利潤";
  const extraImpactText = isKgMode
    ? `額外成本換算：每 KG +${money(result.extraUnitImpact, 2)} 元`
    : `額外成本換算：每個 +${money(result.extraUnitImpact, 2)} 元`;

  $("#kpiCostLabel").textContent = `${unitName}成本 (${unitText})`;
  $("#kpiPriceLabel").textContent = `建議售價 (${unitText})`;
  $("#unitCostLabel").textContent = `${unitName}成本 (${unitText})`;
  $("#customerPriceLabel").textContent = `客戶售價 (${unitText})`;
  $("#unitProfitLabel").textContent = profitLabel;

  $("#kpiWeight").textContent = money(result.totalWeight, 1);
  $("#kpiCost").textContent = money(result.unitCost, 2);
  $("#kpiPrice").textContent = money(result.suggestedPrice, 2);
  $("#kpiMargin").textContent = pct(result.margin);

  $("#pcsPerKg").textContent = money(result.pcsPerKg, 1);
  $("#totalWeight").textContent = money(result.totalWeight, 1);
  $("#unitCost").textContent = money(result.unitCost, 2);
  $("#unitProfit").textContent = money(result.unitProfit, 2);
  $("#totalProfit").textContent = money(result.totalProfit, 1);
  $("#actualMargin").textContent = pct(result.margin);
  $("#baseSubtotal").textContent = money(result.baseSubtotal, 1);
  $("#extraSubtotal").textContent = money(result.extraSubtotal, 1);
  $("#extraUnitImpact").textContent = extraImpactText;
  $("#grandTotal").textContent = money(result.grandTotal, 1);

  const sealDesc = state.sealMode === "kg"
    ? `${money(result.totalWeight, 1)} KG × ${state.params.sealFeePerKg} 元/KG`
    : `${money(state.quantity, 0)} PCS × ${state.params.sealFeePerPcs} 元/PCS`;

  const rows = [
    ["原料成本", `總重量 ${money(result.totalWeight, 1)} KG × ${selectedMaterialPrice()} 元/KG (${materialLabel()})`, result.materialCost, ""],
    ["印刷成本", `${money(result.printWeight, 1)} KG × ${state.params.printFeePerKgColor} 元/KG/色 × ${state.printColors} 色`, result.printCost, ""],
    ["封口加工費", sealDesc, result.sealCost, ""],
    ["製造成本小計", "原料 + 印刷 + 封口加工", result.manufacturingSubtotal, "subtotal-row"],
    ["損耗成本", `製造成本小計 × ${numberValue(state.lossRate).toFixed(1)}%`, result.lossCost, ""],
    ["版費", "固定收費", state.params.plateFee, ""]
  ];

  $("#costRows").innerHTML = rows.map(([name, desc, amount, className]) => `
    <tr class="${className}">
      <td>${escapeHtml(name)}</td>
      <td>${escapeHtml(desc)}</td>
      <td>${money(amount, 1)}</td>
    </tr>
  `).join("");

  renderFormalQuote(result);
}

function renderMarginButtons() {
  $$("[data-margin]").forEach((button) => {
    button.classList.toggle("active", numberValue(button.dataset.margin) === numberValue(state.targetMargin));
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function syncField(key, value) {
  state[key] = value;
  if (key === "targetMargin") renderMarginButtons();
  if (key === "quoteMode") {
    if (state.quoteMode === "kg") state.sealMode = "kg";
    const result = calculate();
    state.customerPrice = result.suggestedPrice > 0 ? ceilMoney(result.suggestedPrice, 2) : "";
    saveState();
    renderFields();
    renderResults();
    return;
  }
  if (key === "sealMode" && state.quoteMode === "kg") {
    state.sealMode = "kg";
    renderFields();
  }
  saveState();
  renderResults();
}

function blankQuoteData({ keepQuoteIdentity }) {
  const preservedParams = clone(state.params);
  const quoteNo = keepQuoteIdentity ? state.quoteNo : createQuoteNo();
  const quoteDate = keepQuoteIdentity ? state.quoteDate : todayString();

  return {
    ...clone(defaults),
    quoteNo,
    quoteDate,
    bagType: "PE 平口袋",
    widthCm: "",
    lengthCm: "",
    thicknessMm: "",
    material: "transparent",
    quantity: "",
    printColors: 0,
    sealMode: "pcs",
    lossRate: "",
    targetMargin: 15,
    quoteMode: "pcs",
    customerPrice: "",
    notes: "",
    params: preservedParams,
    customFields: [
      { label: "客戶名稱", value: "" },
      { label: "產品名稱", value: "" },
      { label: "業務人員", value: "" },
      { label: "交期", value: "" }
    ],
    extraCosts: []
  };
}

function getCustomValue(label) {
  const found = state.customFields.find((row) => row.label === label);
  return found?.value || "";
}

function getFirstCustomValue(labels) {
  const found = labels.map((label) => getCustomValue(label)).find(Boolean);
  return found || "";
}

function quoteUnitText() {
  return state.quoteMode === "kg" ? "KG" : "PCS";
}

function quoteQuantityText(result) {
  return state.quoteMode === "kg"
    ? `${money(result.totalWeight, 1)} KG`
    : `${money(state.quantity, 0)} PCS`;
}

function quoteSpecText(result) {
  const printText = numberValue(state.printColors) > 0 ? `，印刷 ${numberValue(state.printColors)} 色` : "，無印刷";
  const sealText = state.sealMode === "kg" ? "，封口重量計價" : "，封口單價計價";
  const kgModeText = state.quoteMode === "kg" ? `，參考袋數 ${money(state.quantity, 0)} PCS` : `，總重量 ${money(result.totalWeight, 1)} KG`;
  return `${state.bagType}，${state.widthCm || 0}cm × ${state.lengthCm || 0}cm × ${state.thicknessMm || 0}mm，${materialLabel()}${printText}${sealText}${kgModeText}`;
}

function renderFormalQuote(result = calculate()) {
  const customerName = getCustomValue("客戶名稱");
  const productName = getCustomValue("產品名稱") || state.bagType;
  const contact = getFirstCustomValue(["聯繫人員", "聯絡人", "窗口"]);
  const phone = getFirstCustomValue(["客戶電話", "電話"]);
  const taxId = getFirstCustomValue(["客戶統編", "統一編號"]);
  const delivery = getCustomValue("交期") || "收到正式訂單後安排交貨";
  const sales = getCustomValue("業務人員") || "Ken";
  const quoteAmount = result.customerPrice * result.unitDivisor;
  const itemNotes = [
    state.notes,
    state.quoteMode === "kg" ? "本報價採重量計價。" : "",
    numberValue(state.printColors) > 0 ? `印刷 ${numberValue(state.printColors)} 色` : ""
  ].filter(Boolean).join(" / ");

  $("#formalQuoteNo").textContent = state.quoteNo || "";
  $("#formalQuoteDate").textContent = displayDate(state.quoteDate);
  $("#formalCustomerName").textContent = customerName;
  $("#formalContact").textContent = contact;
  $("#formalPhone").textContent = phone;
  $("#formalTaxId").textContent = taxId;
  $("#formalProductName").textContent = productName;
  $("#formalSpec").textContent = quoteSpecText(result);
  $("#formalQuantity").textContent = quoteQuantityText(result);
  $("#formalUnitPrice").textContent = `${money(result.customerPrice, 2)} / ${quoteUnitText()}`;
  $("#formalTotal").textContent = money(quoteAmount, 2);
  $("#formalItemNotes").textContent = itemNotes;
  $("#formalTotalAmount").textContent = money(quoteAmount, 2);
  $("#formalDelivery").textContent = delivery;
  $("#formalDestination").textContent = customerName;
  $("#formalSales").textContent = sales;
}

function buildHistoryRecord() {
  const result = calculate();
  return {
    savedAt: new Date().toISOString(),
    quoteNo: state.quoteNo,
    quoteDate: state.quoteDate,
    bagType: state.bagType,
    customerName: getCustomValue("客戶名稱"),
    productName: getCustomValue("產品名稱"),
    size: `${state.widthCm || 0} × ${state.lengthCm || 0} cm`,
    thickness: state.thicknessMm,
    material: materialLabel(),
    quantity: numberValue(state.quantity),
    printColors: numberValue(state.printColors),
    sealMode: state.sealMode === "kg" ? "重量計價 (元/KG)" : "單價計價 (元/PCS)",
    lossRate: numberValue(state.lossRate),
    totalWeight: result.totalWeight,
    unitCost: result.unitCost,
    customerPrice: result.customerPrice,
    margin: result.margin,
    quoteMode: state.quoteMode,
    totalCost: result.grandTotal,
    extraCosts: clone(state.extraCosts),
    notes: state.notes
  };
}

function saveToHistory() {
  const history = JSON.parse(localStorage.getItem(historyKey) || "[]");
  history.push(buildHistoryRecord());
  localStorage.setItem(historyKey, JSON.stringify(history));
  showToast("已儲存到歷史報價");
}

function applySuggestedPrice() {
  const result = calculate();
  state.customerPrice = result.suggestedPrice > 0 ? ceilMoney(result.suggestedPrice, 2) : "";
  saveState();
  renderFields();
  renderResults();
}

function bindEvents() {
  $("#quoteNo").addEventListener("input", (event) => {
    state.quoteNo = event.target.value;
    saveState();
  });

  $("#quoteDate").addEventListener("input", (event) => {
    state.quoteDate = event.target.value;
    saveState();
  });

  $("#notes").addEventListener("input", (event) => {
    state.notes = event.target.value;
    saveState();
  });

  document.addEventListener("input", (event) => {
    const input = event.target;

    if (input.matches("[data-field]")) {
      const value = input.type === "number" ? (input.value === "" ? "" : numberValue(input.value)) : input.value;
      syncField(input.dataset.field, value);
    }

    if (input.matches("[data-param]")) {
      state.params[input.dataset.param] = input.value === "" ? "" : numberValue(input.value);
      saveState();
      renderResults();
    }

    if (input.matches("[data-dynamic-key]")) {
      const row = input.closest("[data-kind]");
      const collection = state[row.dataset.kind];
      const item = collection[Number(row.dataset.index)];
      item[input.dataset.dynamicKey] = input.type === "checkbox"
        ? input.checked
        : input.type === "number"
          ? (input.value === "" ? "" : numberValue(input.value))
          : input.value;
      saveState();
      renderResults();
    }
  });

  document.addEventListener("change", (event) => {
    if (!event.target.matches("select[data-dynamic-key]")) return;
    const input = event.target;
    const row = input.closest("[data-kind]");
    state[row.dataset.kind][Number(row.dataset.index)][input.dataset.dynamicKey] = input.value;
    saveState();
    renderResults();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    const input = event.target;
    if (!input.matches("input:not([type='checkbox']), select, textarea")) return;
    if (input.tagName === "TEXTAREA") return;

    const fields = $$("input:not([type='hidden']):not([type='checkbox']), select, textarea")
      .filter((field) => !field.disabled && field.offsetParent !== null);
    const currentIndex = fields.indexOf(input);
    if (currentIndex === -1) return;

    event.preventDefault();
    const next = fields[(currentIndex + 1) % fields.length];
    next.focus();
    if (typeof next.select === "function" && next.tagName !== "SELECT") {
      next.select();
    }
  });

  $("#addCustomField").addEventListener("click", () => {
    state.customFields.push({ label: "自訂欄位", value: "" });
    saveState();
    renderDynamicLists();
  });

  $("#addExtraCost").addEventListener("click", () => {
    state.extraCosts.push({ enabled: true, label: "其他", method: "固定費用", amount: 0 });
    saveState();
    renderDynamicLists();
    renderResults();
  });

  document.addEventListener("click", (event) => {
    if (event.target.matches(".remove-button")) {
      const row = event.target.closest("[data-kind]");
      state[row.dataset.kind].splice(Number(row.dataset.index), 1);
      saveState();
      renderDynamicLists();
      renderResults();
    }

    if (event.target.matches(".edit-button")) {
      const row = event.target.closest("tr");
      const amount = row.querySelector('[data-dynamic-key="amount"]');
      amount.focus();
      amount.select();
    }

    if (event.target.matches("[data-margin]")) {
      state.targetMargin = numberValue(event.target.dataset.margin);
      applySuggestedPrice();
      showToast(`已套用 ${state.targetMargin}% 毛利率`);
    }
  });

  $("#recalcPrice").addEventListener("click", () => {
    applySuggestedPrice();
    showToast("已依目標毛利率重算售價");
  });

  $("#newQuote").addEventListener("click", () => {
    state = blankQuoteData({ keepQuoteIdentity: false });
    saveState();
    render();
    showToast("已新增空白報價");
  });

  $("#saveQuote").addEventListener("click", () => {
    saveToHistory();
  });

  $("#printQuote").addEventListener("click", () => {
    document.body.classList.toggle("print-internal", $("#internalPrint").checked);
    window.print();
  });
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 1800);
}

function render() {
  renderFields();
  renderDynamicLists();
  renderResults();
}

bindEvents();
render();
