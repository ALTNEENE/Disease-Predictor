const XLSX = require("xlsx");

const aliases = {
  disease: ["disease", "disease type", "disease name", "dataname", "diagnosis", "illness", "condition", "المرض", "نوع المرض"],
  cases: ["cases", "case count", "total cases", "case total", "expected cases", "patients", "infections", "عدد الحالات", "حالات"],
  deaths: ["deaths", "death", "fatalities", "mortality", "عدد الوفيات", "وفيات"],
  state: ["state", "province", "city", "region", "district", "governorate", "محافظة", "ولاية", "مدينة"],
  weather: ["weather", "temperature", "climate", "rain", "humidity", "الطقس", "درجة الحرارة"],
  month: ["month", "date", "report date", "period", "periodname", "الشهر", "تاريخ"],
  gender: ["gender", "sex", "الجنس", "نوع الجنس"],
  age: ["age", "patient age", "العمر", "سن"]
};

function normalize(value) {
  return String(value || "").trim().toLowerCase().replace(/[\s_\-./]+/g, "");
}

function parseWorkbook(filePath) {
  const workbook = XLSX.readFile(filePath, { cellDates: true, WTF: false });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null, raw: true });
  const promoted = promoteHeader(matrix);
  const nonEmptyColumns = Object.keys(promoted[0] || {}).filter((column) =>
    promoted.some((row) => row[column] !== null && row[column] !== undefined && String(row[column]).trim() !== "")
  );
  const rows = promoted.map((row) => {
    const clean = {};
    nonEmptyColumns.forEach((key) => {
      const value = row[key];
      clean[String(key).trim()] = typeof value === "string" ? value.trim() : value;
    });
    return clean;
  });
  return addDerivedCases(rows);
}

function headerScore(values = []) {
  const aliasValues = Object.values(aliases).flat().map(normalize);
  return values.reduce((score, value) => {
    const key = normalize(value);
    if (!key) return score;
    let next = aliasValues.includes(key) ? score + 2 : score;
    if (aliasValues.some((alias) => alias.length > 3 && key.includes(alias))) next += 1;
    if (key.includes("year") || key.includes("age")) next += 1;
    return next;
  }, 0);
}

function makeUniqueHeaders(values = []) {
  const seen = new Map();
  return values.map((value, index) => {
    let name = value === null || value === undefined || String(value).trim() === "" ? `Column ${index + 1}` : String(value).trim();
    if (seen.has(name)) {
      const count = seen.get(name) + 1;
      seen.set(name, count);
      name = `${name} ${count}`;
    } else {
      seen.set(name, 0);
    }
    return name;
  });
}

function promoteHeader(matrix) {
  const nonEmptyRows = matrix.filter((row) => row.some((cell) => cell !== null && cell !== undefined && String(cell).trim() !== ""));
  if (!nonEmptyRows.length) return [];
  const search = nonEmptyRows.slice(0, 5);
  let bestIndex = 0;
  let bestScore = -1;
  search.forEach((row, index) => {
    const score = headerScore(row);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  });
  if (bestScore < 2) bestIndex = 0;
  const headers = makeUniqueHeaders(nonEmptyRows[bestIndex]);
  return nonEmptyRows.slice(bestIndex + 1).map((row) =>
    headers.reduce((record, header, index) => {
      record[header] = row[index] ?? null;
      return record;
    }, {})
  );
}

function addDerivedCases(rows) {
  const detected = detectColumns(rows);
  if (detected.cases || !rows.length) return rows;
  const deaths = detected.deaths;
  const month = detected.month;
  const columns = Object.keys(rows[0] || {});
  const numericCandidates = columns.filter((column) => {
    const key = normalize(column);
    if (column === deaths || column === month || key.includes("date") || key.includes("period") || key.includes("month")) return false;
    const values = rows.map((row) => row[column]).filter((value) => value !== null && value !== undefined && value !== "");
    if (!values.length) return false;
    const numericValues = values.filter((value) => Number.isFinite(Number(String(value).replace(/,/g, ""))));
    const total = numericValues.reduce((sum, value) => sum + Number(String(value).replace(/,/g, "")), 0);
    return numericValues.length / values.length > 0.75 && total > 0;
  });
  if (numericCandidates.length < 2) return rows;
  return rows.map((row) => ({
    ...row,
    "Total Cases": numericCandidates.reduce((sum, column) => sum + toNumber(row[column]), 0)
  }));
}

function detectColumns(rows) {
  const columns = Object.keys(rows[0] || {});
  const normalized = new Map(columns.map((column) => [normalize(column), column]));
  const detected = {};

  Object.entries(aliases).forEach(([semantic, candidates]) => {
    let found = null;
    for (const alias of candidates) {
      const key = normalize(alias);
      if (normalized.has(key)) {
        found = normalized.get(key);
        break;
      }
    }
    if (!found) {
      for (const [key, original] of normalized.entries()) {
        if (candidates.some((alias) => key.includes(normalize(alias)))) {
          found = original;
          break;
        }
      }
    }
    detected[semantic] = found;
  });

  return detected;
}

function toNumber(value) {
  if (value === null || value === undefined || value === "") return 0;
  const parsed = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

const monthNames = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12
};

function normalizeYear(value) {
  const year = Number(value);
  if (!Number.isFinite(year)) return null;
  if (year < 100) return year >= 50 ? 1900 + year : 2000 + year;
  return year;
}

function formatMonth(year, month) {
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) return null;
  return `${year}-${String(month).padStart(2, "0")}`;
}

function excelSerialDate(value) {
  if (!Number.isFinite(value) || value < 25569) return null;
  const parsed = XLSX.SSF.parse_date_code(value);
  return parsed ? formatMonth(parsed.y, parsed.m) : null;
}

function isDateValue(value) {
  return value instanceof Date && !Number.isNaN(value.getTime());
}

function sampleValue(value) {
  if (isDateValue(value)) return value.toISOString().slice(0, 10);
  return String(value);
}

function groupRows(rows, groupColumn, valueColumn, valueName = "cases", limit = 20) {
  if (!groupColumn) return [];
  const map = new Map();
  rows.forEach((row) => {
    const label = row[groupColumn] || "Unknown";
    const amount = valueColumn ? toNumber(row[valueColumn]) : 1;
    map.set(String(label), (map.get(String(label)) || 0) + amount);
  });
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([label, value]) => ({ label, [valueName]: Number(value.toFixed(2)) }));
}

function monthLabel(value) {
  if (value === null || value === undefined || value === "") return "Unknown";

  if (value instanceof Date) {
    return formatMonth(value.getFullYear(), value.getMonth() + 1) || "Unknown";
  }

  if (typeof value === "number") {
    return excelSerialDate(value) || String(value);
  }

  const text = String(value).trim();
  if (!text) return "Unknown";

  let match = text.match(/^(\d{4})[-/.](\d{1,2})(?:[-/.]\d{1,2})?$/);
  if (match) {
    return formatMonth(Number(match[1]), Number(match[2])) || text;
  }

  match = text.match(/^([A-Za-z]+)[\s\-.\/]+(\d{2}|\d{4})$/);
  if (match) {
    const month = monthNames[match[1].toLowerCase()];
    const year = normalizeYear(match[2]);
    return formatMonth(year, month) || text;
  }

  match = text.match(/^(\d{2}|\d{4})[\s\-.\/]+([A-Za-z]+)$/);
  if (match) {
    const year = normalizeYear(match[1]);
    const month = monthNames[match[2].toLowerCase()];
    return formatMonth(year, month) || text;
  }

  const hasExplicitYear = /\b\d{4}\b/.test(text) || /\b\d{1,2}[-/.]\d{1,2}[-/.]\d{2}\b/.test(text);
  if (!hasExplicitYear) return text;

  const date = new Date(text);
  if (!Number.isNaN(date.getTime())) {
    return formatMonth(date.getFullYear(), date.getMonth() + 1);
  }
  return text;
}

function ageGroup(value) {
  const age = toNumber(value);
  if (age <= 12) return "0-12";
  if (age <= 18) return "13-18";
  if (age <= 35) return "19-35";
  if (age <= 50) return "36-50";
  if (age <= 65) return "51-65";
  return "65+";
}

function applyFilters(rows, detected, filters = {}) {
  return rows.filter((row) => {
    if (filters.state && detected.state && String(row[detected.state]) !== String(filters.state)) return false;
    if (filters.weather && detected.weather && String(row[detected.weather]) !== String(filters.weather)) return false;
    if (filters.gender && detected.gender && String(row[detected.gender]) !== String(filters.gender)) return false;
    if (filters.month && detected.month && monthLabel(row[detected.month]) !== String(filters.month)) return false;
    if (filters.ageGroup && detected.age && ageGroup(row[detected.age]) !== String(filters.ageGroup)) return false;
    return true;
  });
}

function columnSummary(rows) {
  const columns = Object.keys(rows[0] || {});
  return columns.map((column) => {
    const values = rows.map((row) => row[column]).filter((value) => value !== null && value !== undefined && value !== "");
    const unique = new Set(values.map(String));
    const dateCount = values.filter(isDateValue).length;
    const numericCount = values.filter((value) => !isDateValue(value) && Number.isFinite(Number(value))).length;
    return {
      name: column,
      type: dateCount > values.length * 0.7 ? "datetime" : numericCount > values.length * 0.7 ? "numeric" : unique.size <= Math.max(20, rows.length * 0.1) ? "categorical" : "text",
      missing: rows.length - values.length,
      unique: unique.size,
      sample_values: values.slice(0, 5).map(sampleValue)
    };
  });
}

function buildAnalytics(rows, detected) {
  const disease = detected.disease;
  const cases = detected.cases;
  const deaths = detected.deaths;

  const monthlyRows = detected.month
    ? rows.map((row) => ({ ...row, _month: monthLabel(row[detected.month]) }))
    : [];
  const ageRows = detected.age
    ? rows.map((row) => ({ ...row, _ageGroup: ageGroup(row[detected.age]) }))
    : [];

  const mortality = disease && deaths
    ? groupRows(rows, disease, deaths, "deaths").map((item) => {
        const diseaseRows = rows.filter((row) => String(row[disease] || "Unknown") === item.label);
        const caseTotal = cases ? diseaseRows.reduce((sum, row) => sum + toNumber(row[cases]), 0) : 0;
        return {
          label: item.label,
          mortality_rate: caseTotal ? Number(((item.deaths / caseTotal) * 100).toFixed(2)) : item.deaths
        };
      })
    : [];

  return {
    disease_distribution: groupRows(rows, disease, cases, "cases"),
    monthly_trends: groupRows(monthlyRows, "_month", cases, "cases", 36).sort((a, b) => a.label.localeCompare(b.label)),
    weather_correlation: groupRows(rows, detected.weather, cases, "cases"),
    state_comparison: groupRows(rows, detected.state, cases, "cases"),
    gender_analysis: groupRows(rows, detected.gender, cases, "cases"),
    age_group_analysis: groupRows(ageRows, "_ageGroup", cases, "cases"),
    mortality_analysis: mortality
  };
}

function optionValues(rows, detected) {
  const pick = (column, mapper = (value) => String(value || "Unknown")) => {
    if (!column) return [];
    return [...new Set(rows.map((row) => mapper(row[column])).filter(Boolean))].slice(0, 100);
  };
  return {
    states: pick(detected.state),
    weather: pick(detected.weather),
    months: pick(detected.month, monthLabel),
    genders: pick(detected.gender),
    ageGroups: detected.age ? ["0-12", "13-18", "19-35", "36-50", "51-65", "65+"] : []
  };
}

function analyzeFile(filePath, filters = {}) {
  const rows = parseWorkbook(filePath);
  const detected = detectColumns(rows);
  const filteredRows = applyFilters(rows, detected, filters);
  const columns = columnSummary(rows);
  return {
    profile: {
      rows: rows.length,
      filteredRows: filteredRows.length,
      columns: Object.keys(rows[0] || {}).length,
      missing_cells: columns.reduce((sum, column) => sum + column.missing, 0)
    },
    detected_columns: detected,
    columns,
    options: optionValues(rows, detected),
    analytics: buildAnalytics(filteredRows, detected)
  };
}

module.exports = {
  analyzeFile,
  parseWorkbook,
  detectColumns,
  applyFilters,
  buildAnalytics
};
