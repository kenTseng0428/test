const storageKey = "peQuoteSystemStateV106";
const historyKey = "historyQuotes";
const minPrintWeightKg = 125;

const defaultParams = {
  transparentPrice: 46.5,
  milkWhitePrice: 51.5,
  blackPrice: 71.5,
  specialColorPrice: 58,
  plateFee: 2000,
  printFeePerKgColor: 12,
  sealFeePerKg: 8,
  sealFeePerPcs: 0.3
};

const bagStyles = {
  flat: "平口袋",
  destructive: "破壞袋",
  selfAdhesive: "自黏袋",
  hang: "吊卡袋",
  waist: "腰只袋",
  tshirt: "背心袋",
  softHandle: "軟條手提袋",
  hardHandle: "硬提把手提袋"
};

const materialBagStyles = {
  PE: ["flat", "destructive", "selfAdhesive", "hang", "waist", "tshirt", "softHandle", "hardHandle"],
  PP: ["flat", "selfAdhesive", "hang"],
  OPP: ["flat", "selfAdhesive", "hang"],
  HDPE: ["flat", "selfAdhesive", "waist", "tshirt", "softHandle", "hardHandle"]
};

const fixedSideSealStyles = ["selfAdhesive", "hang", "destructive"];
const fixedNormalSealStyles = ["tshirt", "softHandle", "hardHandle"];

const defaults = {
  quoteNo: "QT20260701610",
  quoteDate: "2026-07-01",
  productCategory: "singleLayer",
  materialType: "PE",
  colorType: "transparent",
  bagStyle: "flat",
  sealType: "normal",
  surface: "glossy",
  hasHandle: "none",
  handleSizeCm: 6,
  flapSizeCm: 4,
  widthCm: 84,
  lengthCm: 66,
  thicknessMm: 0.07,
  sealMode: "kg",
  lossRate: 7,
  targetMargin: 15,
  quoteMode: "pcs",
  customerPrice: "",
  printType: "double",
  printColors: 2,
  plateMode: "separate",
  notes: "",
  params: defaultParams,
  quantityTiers: [
    { quantity: 10000, customerPrice: "" },
    { quantity: 30000, customerPrice: "" }
  ],
  quoteItems: [],
  customFields: [
    { label: "客戶名稱", value: "示範有限公司" },
    { label: "聯繫人員", value: "王小明" },
    { label: "客戶電話", value: "0912-345-678" },
    { label: "客戶統編", value: "12345678" },
    { label: "業務人員", value: "Ken" },
    { label: "交期", value: "常規交期 10天" }
  ],
  extraCosts: [
    { enabled: true, label: "運費", method: "固定費用", amount: 800 }
  ]
};

let state = loadState();
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
    quantityTiers: Array.isArray(saved.quantityTiers) ? saved.quantityTiers : base.quantityTiers,
    quoteItems: Array.isArray(saved.quoteItems) ? saved.quoteItems : base.quoteItems,
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
  return String(dateText || todayString()).replaceAll("-", "");
}

function createQuoteNo(dateText = todayString()) {
  const suffix = String(Math.floor(Math.random() * 900) + 100);
  return `QT${ymd(dateText)}${suffix}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function canDyeMaterial() {
  return state.materialType === "PE" || state.materialType === "HDPE";
}

function colorLabel(colorType = state.colorType) {
  const map = {
    transparent: "透明",
    milkWhite: "白色",
    black: "黑色",
    specialColor: "特殊色"
  };
  return map[colorType] || "透明";
}

function sealTypeLabel(sealType = state.sealType) {
  return sealType === "side" ? "側封" : "普封";
}

function printLabel(printType = state.printType, printColors = state.printColors) {
  const colors = numberValue(printColors);
  if (printType === "none" || colors <= 0) return "無印刷";
  return `${printType === "double" ? "雙面" : "單面"} ${colors} 色印刷`;
}

function plateModeLabel(plateMode = state.plateMode) {
  const map = {
    separate: "版費獨立報",
    included: "版費含內報",
    waived: "無版費"
  };
  return map[plateMode] || "版費獨立報";
}

function selectedMaterialPrice() {
  const map = {
    transparent: state.params.transparentPrice,
    milkWhite: state.params.milkWhitePrice,
    black: state.params.blackPrice,
    specialColor: state.params.specialColorPrice
  };
  return numberValue(map[state.colorType], state.params.transparentPrice);
}

function availableBagStyles(materialType = state.materialType) {
  return materialBagStyles[materialType] || materialBagStyles.PE;
}

function allowedSealTypes() {
  if (state.materialType === "OPP") return ["side"];
  if (fixedSideSealStyles.includes(state.bagStyle)) return ["side"];
  if (fixedNormalSealStyles.includes(state.bagStyle)) return ["normal"];
  return ["normal", "side"];
}

function enforceRules() {
  const styles = availableBagStyles();
  if (!styles.includes(state.bagStyle)) {
    state.bagStyle = styles[0];
  }

  if (!canDyeMaterial()) {
    state.colorType = "transparent";
  }

  const seals = allowedSealTypes();
  if (!seals.includes(state.sealType)) {
    state.sealType = seals[0];
  }

  if (state.materialType === "OPP") {
    state.sealType = "side";
  }

  if (state.sealType === "side" && state.quoteMode !== "kg" && state.bagStyle !== "flat") {
    state.sealMode = "pcs";
  }

  if (state.quoteMode === "kg") {
    state.sealMode = "kg";
  }

  if (state.printType === "none") {
    state.printColors = 0;
  } else if (numberValue(state.printColors) <= 0) {
    state.printColors = 1;
  }

  if (!Array.isArray(state.quantityTiers) || state.quantityTiers.length === 0) {
    state.quantityTiers = [{ quantity: "", customerPrice: "" }];
  }

  if (!state.flapSizeCm) state.flapSizeCm = 4;
  if (!state.handleSizeCm) state.handleSizeCm = 6;
  if (state.bagStyle !== "destructive") {
    state.hasHandle = "none";
  }
}

function pcsPerKgForCurrentSpec() {
  const widthCm = numberValue(state.widthCm);
  const lengthCm = numberValue(state.lengthCm) + (state.bagStyle === "selfAdhesive" ? numberValue(state.flapSizeCm) : 0);
  const thicknessMm = numberValue(state.thicknessMm);
  const widthIn = widthCm / 2.54;
  const lengthIn = lengthCm / 2.54;
  const pcsPerKg = widthIn > 0 && lengthIn > 0 && thicknessMm > 0
    ? (360 * 2.2) / (widthIn * lengthIn * thicknessMm)
    : 0;
  const pcsPerKgFloor = pcsPerKg > 0 ? Math.max(1, Math.floor(pcsPerKg)) : 0;
  return { pcsPerKg, pcsPerKgFloor };
}

function extraSubtotal() {
  return state.extraCosts
    .filter((row) => row.enabled !== false)
    .reduce((sum, row) => sum + numberValue(row.amount), 0);
}

function calculateTier(tier = state.quantityTiers[0]) {
  const quantity = numberValue(tier?.quantity);
  const { pcsPerKg, pcsPerKgFloor } = pcsPerKgForCurrentSpec();
  const totalWeight = pcsPerKgFloor > 0 ? quantity / pcsPerKgFloor : 0;
  const printColors = state.printType === "none" ? 0 : numberValue(state.printColors);
  const chargeablePrintWeight = printColors > 0 ? Math.max(totalWeight, minPrintWeightKg) : 0;
  const materialCost = totalWeight * selectedMaterialPrice();
  const normalPrintCost = totalWeight * numberValue(state.params.printFeePerKgColor) * printColors;
  const minPrintCost = minPrintWeightKg * numberValue(state.params.printFeePerKgColor) * printColors;
  const printCost = printColors > 0 ? Math.max(normalPrintCost, minPrintCost) : 0;
  const sealCost = state.sealMode === "kg"
    ? totalWeight * numberValue(state.params.sealFeePerKg)
    : quantity * numberValue(state.params.sealFeePerPcs);
  const manufacturingSubtotal = materialCost + printCost + sealCost;
  const lossCost = manufacturingSubtotal * (numberValue(state.lossRate) / 100);
  const hasPlate = printColors > 0 && state.plateMode !== "waived";
  const plateCost = hasPlate ? numberValue(state.params.plateFee) : 0;
  const extraCost = extraSubtotal();
  const plateInUnit = state.plateMode === "included" ? plateCost : 0;
  const unitBaseSubtotal = manufacturingSubtotal + lossCost + extraCost + plateInUnit;
  const internalGrandTotal = manufacturingSubtotal + lossCost + extraCost + plateCost;
  const unitDivisor = state.quoteMode === "kg" ? totalWeight : quantity;
  const unitCost = unitDivisor > 0 ? unitBaseSubtotal / unitDivisor : 0;
  const suggestedPrice = state.targetMargin >= 100 ? unitCost : unitCost / (1 - numberValue(state.targetMargin) / 100);
  const customerPrice = numberValue(tier?.customerPrice) > 0 ? numberValue(tier.customerPrice) : ceilMoney(suggestedPrice, 2);
  const unitProfit = customerPrice - unitCost;
  const quoteAmount = customerPrice * unitDivisor;
  const separatePlateAmount = state.plateMode === "separate" ? plateCost : 0;
  const margin = customerPrice > 0 ? (unitProfit / customerPrice) * 100 : 0;

  return {
    quantity,
    pcsPerKg,
    pcsPerKgFloor,
    totalWeight,
    printWeight: chargeablePrintWeight,
    normalPrintCost,
    minPrintCost,
    materialCost,
    printCost,
    sealCost,
    manufacturingSubtotal,
    lossCost,
    plateCost,
    extraCost,
    unitBaseSubtotal,
    internalGrandTotal,
    unitDivisor,
    unitCost,
    suggestedPrice,
    customerPrice,
    unitProfit,
    quoteAmount,
    separatePlateAmount,
    margin
  };
}

function calculateAllTiers() {
  return state.quantityTiers.map((tier) => calculateTier(tier));
}

function productName() {
  const parts = [state.materialType, colorLabel(), state.bagStyle === "destructive" ? surfaceLabel() : "", bagStyles[state.bagStyle]];
  const name = parts.filter(Boolean).join("");
  return state.bagStyle === "destructive" && state.hasHandle === "yes"
    ? `${name}附${numberValue(state.handleSizeCm, 6)}cm手提`
    : name;
}

function surfaceLabel() {
  return state.surface === "matte" ? "霧面" : "亮面";
}

function specText(result = calculateTier()) {
  const extras = [];
  const sizeText = state.bagStyle === "selfAdhesive"
    ? `${state.widthCm || 0}cm × ${state.lengthCm || 0}cm + 舌蓋 ${state.flapSizeCm || 4}cm × ${state.thicknessMm || 0}mm`
    : `${state.widthCm || 0}cm × ${state.lengthCm || 0}cm × ${state.thicknessMm || 0}mm`;
  extras.push(sizeText);
  extras.push(sealTypeLabel());
  if (state.bagStyle === "destructive") extras.push("破壞膠");
  if (state.bagStyle === "destructive" && state.hasHandle === "yes") {
    extras.push(`${numberValue(state.handleSizeCm, 6)}cm手提`);
  }
  return extras.join("，");
}

function quoteUnitText() {
  return state.quoteMode === "kg" ? "KG" : "PCS";
}

function quoteQuantityText(result) {
  return state.quoteMode === "kg"
    ? `${money(result.totalWeight, 1)} KG`
    : `${money(result.quantity, 0)} PCS`;
}

function getCustomValue(label) {
  const found = state.customFields.find((row) => row.label === label);
  return found?.value || "";
}

function getFirstCustomValue(labels) {
  const found = labels.map((label) => getCustomValue(label)).find(Boolean);
  return found || "";
}

function renderFields() {
  enforceRules();
  $("#quoteNo").value = state.quoteNo;
  $("#quoteDate").value = state.quoteDate;
  $("#notes").value = state.notes;
  $("#conditionTitle").textContent = `${bagStyles[state.bagStyle] || "單層"}製袋條件`;

  renderBagStyleOptions();

  $$("[data-field]").forEach((input) => {
    input.value = state[input.dataset.field] ?? "";
  });

  $$("[data-param]").forEach((input) => {
    input.value = state.params[input.dataset.param] ?? "";
  });

  const colorSelect = $('[data-field="colorType"]');
  colorSelect.disabled = !canDyeMaterial();
  colorSelect.title = canDyeMaterial() ? "" : "PP / OPP 不開放染色，系統自動鎖定透明";

  const sealTypeSelect = $('[data-field="sealType"]');
  const sealTypes = allowedSealTypes();
  sealTypeSelect.disabled = sealTypes.length === 1;
  sealTypeSelect.title = sealTypes.length === 1 ? "此材料或袋型會自動決定封口方向" : "";

  const sealModeSelect = $('[data-field="sealMode"]');
  sealModeSelect.disabled = state.quoteMode === "kg";
  sealModeSelect.title = state.quoteMode === "kg" ? "按重量計價時，封口計價會同步使用重量計價" : "";

  $$("[data-visible-for]").forEach((node) => {
    const key = node.dataset.visibleFor;
    if (key === "flap") node.hidden = state.bagStyle !== "selfAdhesive";
    if (key === "surface" || key === "handle") node.hidden = state.bagStyle !== "destructive";
    if (key === "handleSize") node.hidden = state.bagStyle !== "destructive" || state.hasHandle !== "yes";
  });

  renderMarginButtons();
}

function renderBagStyleOptions() {
  const select = $('[data-field="bagStyle"]');
  const options = availableBagStyles().map((key) => (
    `<option value="${key}">${bagStyles[key]}</option>`
  ));
  select.innerHTML = options.join("");
}

function renderDynamicLists() {
  $("#quantityTiers").innerHTML = state.quantityTiers.map((row, index) => {
    const result = calculateTier(row);
    return `
      <div class="tier-row" data-kind="quantityTiers" data-index="${index}">
        <input aria-label="數量" data-dynamic-key="quantity" type="number" step="1" value="${escapeHtml(row.quantity)}" />
        <span data-tier-field="weight">${money(result.totalWeight, 1)}</span>
        <span data-tier-field="unitCost">${money(result.unitCost, 2)}</span>
        <strong data-tier-field="suggestedPrice">${money(result.suggestedPrice, 2)}</strong>
        <input aria-label="客戶售價" data-dynamic-key="customerPrice" type="number" step="0.01" value="${escapeHtml(row.customerPrice)}" placeholder="${money(result.customerPrice, 2)}" />
        <span data-tier-field="amount">${money(result.quoteAmount, 2)}</span>
        <span data-tier-field="profit">${money(result.unitProfit * result.unitDivisor, 1)}</span>
        <span data-tier-field="margin">${pct(result.margin)}</span>
        <button type="button" class="remove-button icon-button" title="刪除階梯" aria-label="刪除階梯">×</button>
      </div>
    `;
  }).join("");

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

  renderQuoteItems();
}

function updateTierComputedRows() {
  $$("#quantityTiers .tier-row").forEach((row) => {
    const index = Number(row.dataset.index);
    const result = calculateTier(state.quantityTiers[index]);
    const setText = (field, value) => {
      const node = row.querySelector(`[data-tier-field="${field}"]`);
      if (node) node.textContent = value;
    };
    setText("weight", money(result.totalWeight, 1));
    setText("unitCost", money(result.unitCost, 2));
    setText("suggestedPrice", money(result.suggestedPrice, 2));
    setText("amount", money(result.quoteAmount, 2));
    setText("profit", money(result.unitProfit * result.unitDivisor, 1));
    setText("margin", pct(result.margin));
  });
}

function extraCostOptions(selected) {
  const options = ["運費", "打樣費", "模具費", "刀模費", "包裝費", "其他"];
  return options.map((option) => `<option value="${option}" ${option === selected ? "selected" : ""}>${option}</option>`).join("");
}

function renderResults() {
  const firstTier = state.quantityTiers[0] || { quantity: 0, customerPrice: "" };
  const result = calculateTier(firstTier);
  const isKgMode = state.quoteMode === "kg";
  const unitName = isKgMode ? "公斤" : "袋子";
  const unitText = isKgMode ? "元/KG" : "元/PCS";
  const profitLabel = isKgMode ? "每公斤利潤" : "每個利潤";
  const extraImpact = result.unitDivisor > 0 ? result.extraCost / result.unitDivisor : 0;

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
  $("#totalProfit").textContent = money(result.unitProfit * result.unitDivisor, 1);
  $("#actualMargin").textContent = pct(result.margin);
  $("#baseSubtotal").textContent = money(result.internalGrandTotal, 1);
  $("#extraSubtotal").textContent = money(result.extraCost, 1);
  $("#extraUnitImpact").textContent = isKgMode
    ? `額外成本換算：每 KG +${money(extraImpact, 2)} 元`
    : `額外成本換算：每個 +${money(extraImpact, 2)} 元`;
  $("#grandTotal").textContent = money(result.internalGrandTotal, 1);

  const sealDesc = state.sealMode === "kg"
    ? `${money(result.totalWeight, 1)} KG × ${state.params.sealFeePerKg} 元/KG`
    : `${money(result.quantity, 0)} PCS × ${state.params.sealFeePerPcs} 元/PCS`;
  const plateDesc = state.plateMode === "included"
    ? "版費含內報，含入單價"
    : state.plateMode === "separate"
      ? "版費獨立報，客戶報價單另列"
      : "無版費";
  const printDesc = result.printWeight > 0
    ? `${money(result.printWeight, 1)} KG × ${state.params.printFeePerKgColor} 元/KG/色 × ${state.printColors} 色（最低基本費 ${money(result.minPrintCost, 1)} 元）`
    : "無印刷";

  const rows = [
    ["原料成本", `總重量 ${money(result.totalWeight, 1)} KG × ${selectedMaterialPrice()} 元/KG (${colorLabel()})`, result.materialCost, ""],
    ["印刷成本", printDesc, result.printCost, ""],
    ["封口加工費", sealDesc, result.sealCost, ""],
    ["製造成本小計", "原料 + 印刷 + 封口加工", result.manufacturingSubtotal, "subtotal-row"],
    ["損耗成本", `製造成本小計 × ${numberValue(state.lossRate).toFixed(1)}%`, result.lossCost, ""],
    ["版費", plateDesc, result.plateCost, ""],
    ["額外成本", "目前勾選的額外成本項目", result.extraCost, ""]
  ];

  $("#costRows").innerHTML = rows.map(([name, desc, amount, className]) => `
    <tr class="${className}">
      <td>${escapeHtml(name)}</td>
      <td>${escapeHtml(desc)}</td>
      <td>${money(amount, 1)}</td>
    </tr>
  `).join("");

  updateTierComputedRows();
  renderFormalQuote();
}

function renderMarginButtons() {
  $$("[data-margin]").forEach((button) => {
    button.classList.toggle("active", numberValue(button.dataset.margin) === numberValue(state.targetMargin));
  });
}

function syncField(key, value) {
  state[key] = value;
  if ((key === "sealType" || key === "bagStyle") && state.sealType === "side" && state.quoteMode !== "kg") {
    state.sealMode = "pcs";
  }
  if (key === "materialType" || key === "bagStyle" || key === "printType" || key === "quoteMode" || key === "sealType" || key === "hasHandle") {
    enforceRules();
  }
  if (key === "customerPrice") {
    state.quantityTiers[0].customerPrice = value;
    saveState();
    updateTierComputedRows();
    renderResults();
    return;
  }
  if (key === "targetMargin") renderMarginButtons();
  saveState();
  render();
}

function blankQuoteData({ keepQuoteIdentity }) {
  const preservedParams = clone(state.params);
  const quoteNo = keepQuoteIdentity ? state.quoteNo : createQuoteNo();
  const quoteDate = keepQuoteIdentity ? state.quoteDate : todayString();

  return {
    ...clone(defaults),
    quoteNo,
    quoteDate,
    customerPrice: "",
    params: preservedParams,
    quoteItems: [],
    customFields: [
      { label: "客戶名稱", value: "" },
      { label: "聯繫人員", value: "" },
      { label: "客戶電話", value: "" },
      { label: "客戶統編", value: "" },
      { label: "業務人員", value: "" },
      { label: "交期", value: "" }
    ],
    extraCosts: []
  };
}

function buildQuoteItem() {
  const tiers = state.quantityTiers
    .filter((tier) => numberValue(tier.quantity) > 0)
    .map((tier) => {
      const result = calculateTier(tier);
      return {
        quantity: result.quantity,
        quantityText: state.quoteMode === "kg" ? `${money(result.totalWeight, 1)} KG` : `${money(result.quantity, 0)} PCS`,
        totalWeight: result.totalWeight,
        unitDivisor: result.unitDivisor,
        unitText: quoteUnitText(),
        unitPrice: result.customerPrice,
        amount: result.quoteAmount,
        unitCost: result.unitCost,
        margin: result.margin,
        separatePlateAmount: result.separatePlateAmount
      };
    });

  return {
    id: `${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    productName: productName(),
    spec: specText(calculateTier(state.quantityTiers[0])),
    materialType: state.materialType,
    colorType: state.colorType,
    bagStyle: state.bagStyle,
    sealType: state.sealType,
    printText: printLabel(),
    plateMode: state.plateMode,
    plateText: plateModeLabel(),
    notes: state.notes,
    tiers
  };
}

function currentPreviewItem() {
  return buildQuoteItem();
}

function renderQuoteItems() {
  const tbody = $("#quoteItems");
  if (!state.quoteItems.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-cell">尚未加入明細。請先完成試算，再按「加入報價單」。</td></tr>`;
    return;
  }

  tbody.innerHTML = state.quoteItems.map((item, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${escapeHtml(item.productName)}</td>
      <td>${escapeHtml(item.spec)}</td>
      <td>${escapeHtml(item.printText)}<br /><small>${escapeHtml(item.plateText)}</small></td>
      <td>${item.tiers.map((tier) => `${escapeHtml(tier.quantityText || `${money(tier.quantity, 0)} PCS`)}：${money(tier.unitPrice, 2)} / ${tier.unitText}`).join("<br />")}</td>
      <td><button type="button" class="remove-button icon-button" data-remove-quote-item="${item.id}" title="刪除品項" aria-label="刪除品項">×</button></td>
    </tr>
  `).join("");
}

function formalRowsForItems(items) {
  const rows = [];
  items.forEach((item, itemIndex) => {
    item.tiers.forEach((tier, tierIndex) => {
      rows.push({
        no: tierIndex === 0 ? String(itemIndex + 1) : `${itemIndex + 1}-${tierIndex + 1}`,
        productName: item.productName,
        spec: item.spec,
        quantity: tier.quantityText || `${money(tier.quantity, 0)} PCS`,
        unitPrice: `${money(tier.unitPrice, 2)} / ${tier.unitText}`,
        amount: tier.amount,
        notes: [item.printText, item.notes].filter(Boolean).join(" / "),
        isAlternative: item.tiers.length > 1
      });
    });

    const firstPlate = item.tiers.find((tier) => tier.separatePlateAmount > 0);
    if (firstPlate) {
      rows.push({
        no: "",
        productName: "版費",
        spec: `${item.productName} ${item.printText}`,
        quantity: "1 式",
        unitPrice: money(firstPlate.separatePlateAmount, 2),
        amount: firstPlate.separatePlateAmount,
        notes: "版費獨立報",
        isPlate: true,
        isAlternative: item.tiers.length > 1
      });
    }
  });
  return rows;
}

function renderFormalQuote() {
  const items = state.quoteItems.length ? state.quoteItems : [currentPreviewItem()];
  const rows = formalRowsForItems(items);
  const hasAlternatives = items.some((item) => item.tiers.length > 1);
  const subtotal = rows.reduce((sum, row) => sum + (row.isAlternative ? 0 : numberValue(row.amount)), 0);
  const tax = subtotal * 0.05;
  const total = subtotal + tax;
  const customerName = getCustomValue("客戶名稱");
  const delivery = getCustomValue("交期") || "收到正式訂單後安排交貨";
  const sales = getCustomValue("業務人員") || "Ken";

  $("#formalQuoteNo").textContent = state.quoteNo || "";
  $("#formalQuoteDate").textContent = displayDate(state.quoteDate);
  $("#formalCustomerName").textContent = customerName;
  $("#formalContact").textContent = getFirstCustomValue(["聯繫人員", "聯絡人", "窗口"]);
  $("#formalPhone").textContent = getFirstCustomValue(["客戶電話", "電話"]);
  $("#formalTaxId").textContent = getFirstCustomValue(["客戶統編", "統一編號"]);
  $("#formalDelivery").textContent = delivery;
  $("#formalDestination").textContent = customerName;
  $("#formalSales").textContent = sales;

  $("#formalItems").innerHTML = rows.map((row) => `
    <tr>
      <td>${escapeHtml(row.no)}</td>
      <td>${escapeHtml(row.productName)}</td>
      <td>${escapeHtml(row.spec)}</td>
      <td>${escapeHtml(row.quantity)}</td>
      <td>${escapeHtml(row.unitPrice)}</td>
      <td>${money(row.amount, 2)}</td>
      <td>${escapeHtml(row.notes)}</td>
    </tr>
  `).join("") + `<tr class="formal-empty-row"><td colspan="7">${hasAlternatives ? "階梯報價為不同數量方案，總額依客戶選定數量計算。" : "(以下空白)"}</td></tr>`;

  $("#formalSubtotalAmount").textContent = hasAlternatives ? "依選定數量計算" : money(subtotal, 2);
  $("#formalTaxAmount").textContent = hasAlternatives ? "依選定數量計算" : money(tax, 2);
  $("#formalTotalAmount").textContent = hasAlternatives ? "依選定數量計算" : money(total, 2);
}

function buildHistoryRecord() {
  return {
    savedAt: new Date().toISOString(),
    quoteNo: state.quoteNo,
    quoteDate: state.quoteDate,
    customerName: getCustomValue("客戶名稱"),
    items: clone(state.quoteItems),
    currentPreview: currentPreviewItem()
  };
}

function saveToHistory() {
  const history = JSON.parse(localStorage.getItem(historyKey) || "[]");
  history.push(buildHistoryRecord());
  localStorage.setItem(historyKey, JSON.stringify(history));
  showToast("已儲存到歷史報價");
}

function applySuggestedPrice() {
  state.quantityTiers = state.quantityTiers.map((tier) => {
    const result = calculateTier({ ...tier, customerPrice: "" });
    return { ...tier, customerPrice: result.suggestedPrice > 0 ? ceilMoney(result.suggestedPrice, 2) : "" };
  });
  state.customerPrice = state.quantityTiers[0]?.customerPrice || "";
  saveState();
  render();
}

function bindEvents() {
  $("#quoteNo").addEventListener("input", (event) => {
    state.quoteNo = event.target.value;
    saveState();
    renderFormalQuote();
  });

  $("#quoteDate").addEventListener("input", (event) => {
    state.quoteDate = event.target.value;
    saveState();
    renderFormalQuote();
  });

  $("#notes").addEventListener("input", (event) => {
    state.notes = event.target.value;
    saveState();
    renderFormalQuote();
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
      render();
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
      if (row.dataset.kind === "quantityTiers" && Number(row.dataset.index) === 0 && input.dataset.dynamicKey === "customerPrice") {
        state.customerPrice = item.customerPrice;
      }
      saveState();
      if (row.dataset.kind === "quantityTiers") {
        updateTierComputedRows();
        renderResults();
        return;
      }
      render();
    }
  });

  document.addEventListener("change", (event) => {
    const input = event.target;
    if (!input.matches("select[data-dynamic-key]")) return;
    const row = input.closest("[data-kind]");
    state[row.dataset.kind][Number(row.dataset.index)][input.dataset.dynamicKey] = input.value;
    saveState();
    render();
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
    if (typeof next.select === "function" && next.tagName !== "SELECT") next.select();
  });

  $("#addQuantityTier").addEventListener("click", () => {
    state.quantityTiers.push({ quantity: "", customerPrice: "" });
    saveState();
    render();
  });

  $("#addCustomField").addEventListener("click", () => {
    state.customFields.push({ label: "自訂欄位", value: "" });
    saveState();
    renderDynamicLists();
  });

  $("#addExtraCost").addEventListener("click", () => {
    state.extraCosts.push({ enabled: true, label: "其他", method: "固定費用", amount: 0 });
    saveState();
    render();
  });

  document.addEventListener("click", (event) => {
    if (event.target.matches(".remove-button") && event.target.dataset.removeQuoteItem) {
      state.quoteItems = state.quoteItems.filter((item) => item.id !== event.target.dataset.removeQuoteItem);
      saveState();
      render();
      return;
    }

    if (event.target.matches(".remove-button")) {
      const row = event.target.closest("[data-kind]");
      if (!row) return;
      state[row.dataset.kind].splice(Number(row.dataset.index), 1);
      if (row.dataset.kind === "quantityTiers" && state.quantityTiers.length === 0) {
        state.quantityTiers.push({ quantity: "", customerPrice: "" });
      }
      saveState();
      render();
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
    showToast("已依目標毛利率重算全部階梯售價");
  });

  $("#addQuoteItem").addEventListener("click", () => {
    const item = buildQuoteItem();
    if (!item.tiers.length) {
      showToast("請先輸入至少一個階梯數量");
      return;
    }
    state.quoteItems.push(item);
    saveState();
    render();
    showToast("已加入報價單明細");
  });

  $("#clearQuoteItems").addEventListener("click", () => {
    state.quoteItems = [];
    saveState();
    render();
    showToast("已清空報價單明細");
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
  enforceRules();
  renderFields();
  renderDynamicLists();
  renderResults();
}

bindEvents();
render();
