"use client";

import { useMemo, useState } from "react";

type Row = Record<string, string>;

type ToolId = "duplicates" | "spaces" | "missing" | "outliers" | "textFormat";

type OutlierMethod = "iqr" | "zscore" | "modified-zscore";
type OutlierTreatment = "review" | "remove" | "median" | "winsorize";

type TextFormatStyle = "title" | "upper" | "lower" | "sentence";

type TextFormatResult = {
  column: string;
  style: TextFormatStyle;
  affectedRows: number[];
  affectedCells: number;
  preview: Row[];
};


type OutlierRecord = {
  rowNumber: number;
  value: number;
};

type OutlierResult = {
  column: string;
  method: OutlierMethod;
  totalValues: number;
  normalValues: number;
  outlierCount: number;
  lowerBound: number;
  upperBound: number;
  outliers: OutlierRecord[];
};

type DuplicateResult = {
  duplicateRows: number[];
  uniqueRows: number;
  duplicateCount: number;
};

type SpacesResult = {
  affectedRows: number[];
  rowsWithSpaces: number;
  cellsWithSpaces: number;
};

type MissingTreatment = "na" | "mean" | "median" | "mode" | "custom";

type MissingColumnInfo = {
  column: string;
  missingCount: number;
  missingPercent: number;
  dataType: "numeric" | "text";
  suggestedMethods: MissingTreatment[];
};

type MissingResult = {
  columns: MissingColumnInfo[];
  totalMissing: number;
  rowsWithMissing: number;
};

const MISSING_MARKERS = new Set([
  "",
  "n/a",
  "na",
  "null",
  "nan",
  "none",
  "empty",
  "missing",
  "unknown",
  "-",
  "--",
]);

function parseCSV(text: string): Row[] {
  const lines = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .filter((line) => line.trim() !== "");

  if (lines.length < 2) return [];

  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (insideQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === "," && !insideQuotes) {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }

    result.push(current);
    return result;
  };

  const headers = parseLine(lines[0]).map(
    (header, index) =>
      header.replace(/^"|"$/g, "").trim() || `Column ${index + 1}`
  );

  return lines.slice(1).map((line) => {
    const values = parseLine(line);
    const row: Row = {};

    headers.forEach((header, index) => {
      row[header] =
        values[index]?.replace(/^"|"$/g, "") ?? "";
    });

    return row;
  });
}

function escapeCSV(value: string) {
  if (
    value.includes(",") ||
    value.includes('"') ||
    value.includes("\n")
  ) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
}

function downloadCSV(data: Row[], filename: string) {
  if (!data.length) return;

  const headers = Object.keys(data[0]);

  const csv = [
    headers.map(escapeCSV).join(","),
    ...data.map((row) =>
      headers
        .map((header) => escapeCSV(row[header] ?? ""))
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

function isMissingValue(value: string) {
  return MISSING_MARKERS.has(value.trim().toLowerCase());
}

function getRowKey(row: Row, headers: string[]) {
  return JSON.stringify(
    headers.map((header) =>
      (row[header] ?? "").trim().toLowerCase()
    )
  );
}

function getMissingAnalysis(
  data: Row[],
  headers: string[]
): MissingResult {
  if (!data.length) {
    return {
      columns: [],
      totalMissing: 0,
      rowsWithMissing: 0,
    };
  }

  const columns: MissingColumnInfo[] = [];
  let totalMissing = 0;
  const rowsWithMissingSet = new Set<number>();

  headers.forEach((column) => {
    const values = data.map((row, index) => {
      const value = row[column] ?? "";

      if (isMissingValue(value)) {
        rowsWithMissingSet.add(index);
      }

      return value;
    });

    const missingCount = values.filter(isMissingValue).length;

    if (missingCount === 0) return;

    const validValues = values.filter(
      (value) => !isMissingValue(value)
    );

    const numeric = validValues.length > 0 &&
      validValues.every((value) => {
        const cleaned = value.trim();
        return cleaned !== "" && !Number.isNaN(Number(cleaned));
      });

    const normalizedColumn = column.trim().toLowerCase();
    const isEmailColumn = normalizedColumn === "email" ||
      normalizedColumn.includes("email");
    const isIdColumn =
      normalizedColumn === "id" ||
      normalizedColumn.endsWith(" id") ||
      normalizedColumn.includes("id");

    columns.push({
      column,
      missingCount,
      missingPercent: Number(
        ((missingCount / data.length) * 100).toFixed(2)
      ),
      dataType: numeric ? "numeric" : "text",
      // N/A is available for EVERY column.
      // Statistical methods are additionally available
      // where they make sense for the detected data type.
      suggestedMethods:
        numeric
          ? ["na", "median", "mean", "mode", "custom"]
          : ["na", "mode", "custom"],
    });

    totalMissing += missingCount;
  });

  return {
    columns,
    totalMissing,
    rowsWithMissing: rowsWithMissingSet.size,
  };
}

function getMode(values: string[]) {
  const frequency = new Map<string, number>();

  values.forEach((value) => {
    const key = value.trim();

    if (!key) return;

    frequency.set(key, (frequency.get(key) ?? 0) + 1);
  });

  let mode = "";
  let highestFrequency = 0;

  frequency.forEach((count, value) => {
    if (count > highestFrequency) {
      highestFrequency = count;
      mode = value;
    }
  });

  return mode;
}

function getMean(values: string[]) {
  const numbers = values
    .filter((value) => !isMissingValue(value))
    .map((value) => Number(value.trim()))
    .filter((value) => !Number.isNaN(value));

  if (!numbers.length) return "";

  const mean =
    numbers.reduce((sum, value) => sum + value, 0) /
    numbers.length;

  return String(Number(mean.toFixed(2)));
}

function getMedian(values: string[]) {
  const numbers = values
    .filter((value) => !isMissingValue(value))
    .map((value) => Number(value.trim()))
    .filter((value) => !Number.isNaN(value))
    .sort((a, b) => a - b);

  if (!numbers.length) return "";

  const middle = Math.floor(numbers.length / 2);

  const median =
    numbers.length % 2 === 0
      ? (numbers[middle - 1] + numbers[middle]) / 2
      : numbers[middle];

  return String(Number(median.toFixed(2)));
}


function isNumericColumn(data: Row[], column: string) {
  const values = data
    .map((row) => (row[column] ?? "").trim())
    .filter((value) => !isMissingValue(value));

  return (
    values.length > 0 &&
    values.every((value) => value !== "" && Number.isFinite(Number(value)))
  );
}

function getNumericValues(data: Row[], column: string) {
  return data
    .map((row, index) => ({
      rowNumber: index + 1,
      value: Number((row[column] ?? "").trim()),
    }))
    .filter((item) => Number.isFinite(item.value));
}

function getMedianNumber(values: number[]) {
  if (!values.length) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function getOutlierAnalysis(
  data: Row[],
  column: string,
  method: OutlierMethod
): OutlierResult | null {
  const numericValues = getNumericValues(data, column);
  const values = numericValues.map((item) => item.value);

  if (!values.length) return null;

  let lowerBound = -Infinity;
  let upperBound = Infinity;
  let outliers: OutlierRecord[] = [];

  if (method === "iqr") {
    const sorted = [...values].sort((a, b) => a - b);
    const q1 = getMedianNumber(sorted.slice(0, Math.floor(sorted.length / 2)));
    const q3 = getMedianNumber(
      sorted.slice(Math.ceil(sorted.length / 2))
    );
    const iqr = q3 - q1;

    lowerBound = q1 - 1.5 * iqr;
    upperBound = q3 + 1.5 * iqr;

    outliers = numericValues.filter(
      (item) => item.value < lowerBound || item.value > upperBound
    );
  }

  if (method === "zscore") {
    const mean =
      values.reduce((sum, value) => sum + value, 0) / values.length;

    const variance =
      values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) /
      values.length;

    const standardDeviation = Math.sqrt(variance);

    if (standardDeviation === 0) {
      lowerBound = mean;
      upperBound = mean;
      outliers = [];
    } else {
      lowerBound = mean - 3 * standardDeviation;
      upperBound = mean + 3 * standardDeviation;

      outliers = numericValues.filter(
        (item) =>
          Math.abs((item.value - mean) / standardDeviation) > 3
      );
    }
  }

  if (method === "modified-zscore") {
    const median = getMedianNumber(values);
    const absoluteDeviations = values.map((value) =>
      Math.abs(value - median)
    );
    const mad = getMedianNumber(absoluteDeviations);

    if (mad === 0) {
      lowerBound = median;
      upperBound = median;
      outliers = [];
    } else {
      // Modified Z-score threshold of 3.5.
      lowerBound = median - (3.5 * mad) / 0.6745;
      upperBound = median + (3.5 * mad) / 0.6745;

      outliers = numericValues.filter(
        (item) =>
          Math.abs((0.6745 * (item.value - median)) / mad) > 3.5
      );
    }
  }

  return {
    column,
    method,
    totalValues: values.length,
    normalValues: values.length - outliers.length,
    outlierCount: outliers.length,
    lowerBound,
    upperBound,
    outliers,
  };
}

function formatNumber(value: number) {
  if (!Number.isFinite(value)) return "—";
  return Number(value.toFixed(4)).toString();
}

function formatTextValue(value: string, style: TextFormatStyle) {
  if (!value) return value;

  if (style === "upper") return value.toUpperCase();
  if (style === "lower") return value.toLowerCase();

  const normalized = value
    .replace(/\s+/g, " ")
    .trim();

  if (style === "sentence") {
    return normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase();
  }

  return normalized
    .toLowerCase()
    .split(" ")
    .map((word) =>
      word ? word.charAt(0).toUpperCase() + word.slice(1) : word
    )
    .join(" ");
}


export default function DashboardPage() {
  const [dataset, setDataset] = useState<Row[]>([]);
  const [fileName, setFileName] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const [activeTool, setActiveTool] =
    useState<ToolId>("duplicates");

  const [duplicateResult, setDuplicateResult] =
    useState<DuplicateResult | null>(null);

  const [spacesResult, setSpacesResult] =
    useState<SpacesResult>({
      affectedRows: [],
      rowsWithSpaces: 0,
      cellsWithSpaces: 0,
    });

  const [missingResult, setMissingResult] =
    useState<MissingResult | null>(null);

  const [missingTreatment, setMissingTreatment] =
    useState<Record<string, MissingTreatment>>({});

  const [customMissingValues, setCustomMissingValues] =
    useState<Record<string, string>>({});

  const [duplicatesRemoved, setDuplicatesRemoved] =
    useState(false);

  const [spacesFixed, setSpacesFixed] =
    useState(false);

  const [missingValuesFilled, setMissingValuesFilled] =
    useState(false);

  const [outlierColumn, setOutlierColumn] = useState("");
  const [outlierMethod, setOutlierMethod] =
    useState<OutlierMethod>("iqr");
  const [outlierTreatment, setOutlierTreatment] =
    useState<OutlierTreatment>("review");
  const [outlierResult, setOutlierResult] =
    useState<OutlierResult | null>(null);
  const [outlierPreview, setOutlierPreview] =
    useState<Row[] | null>(null);
  const [outlierApplied, setOutlierApplied] =
    useState(false);

  const [textFormatColumn, setTextFormatColumn] = useState("");
  const [textFormatStyle, setTextFormatStyle] = useState<TextFormatStyle>("title");
  const [textFormatResult, setTextFormatResult] = useState<TextFormatResult | null>(null);
  const [textFormatApplied, setTextFormatApplied] = useState(false);

  const headers = useMemo(() => {
    if (!dataset.length) return [];
    return Object.keys(dataset[0]);
  }, [dataset]);

  const handleFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      alert("Please upload a CSV file.");
      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      const text = event.target?.result;

      if (typeof text !== "string") {
        alert("Could not read the file.");
        return;
      }

      const parsed = parseCSV(text);

      if (!parsed.length) {
        alert("The CSV file does not contain usable data.");
        return;
      }

      const parsedHeaders = Object.keys(parsed[0]);

      setDataset(parsed);
      setFileName(file.name);

      setDuplicateResult(null);

      setSpacesResult({
        affectedRows: [],
        rowsWithSpaces: 0,
        cellsWithSpaces: 0,
      });

      setMissingResult(null);
      setMissingTreatment({});
      setCustomMissingValues({});

      setDuplicatesRemoved(false);
      setSpacesFixed(false);
      setMissingValuesFilled(false);

      const firstNumericColumn =
        parsedHeaders.find((header) =>
          isNumericColumn(parsed, header)
        ) ?? "";

      setOutlierColumn(firstNumericColumn);
      setOutlierMethod("iqr");
      setOutlierTreatment("review");
      setOutlierResult(null);
      setOutlierPreview(null);
      setOutlierApplied(false);

      const firstTextColumn = parsedHeaders.find((header) =>
        parsed.some((row) => {
          const value = (row[header] ?? "").trim();
          return value !== "" && Number.isNaN(Number(value));
        })
      ) ?? "";

      setTextFormatColumn(firstTextColumn);
      setTextFormatStyle("title");
      setTextFormatResult(null);
      setTextFormatApplied(false);

      setActiveTool("duplicates");

      // Make sure the uploaded dataset itself determines its
      // row/column count and all future checks use the same data.
      void parsedHeaders;
    };

    reader.readAsText(file);
  };

  const handleUploadChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (file) {
      handleFile(file);
    }

    // Allows uploading the same filename again.
    event.target.value = "";
  };

  /*
  ============================================================
  DUPLICATE CHECK
  ============================================================

  A duplicate means the COMPLETE ROW is repeated.

  The ID alone is NOT used to determine duplicates.
  */

  const checkDuplicates = () => {
    if (!dataset.length) return;

    const seen = new Set<string>();
    const duplicateRows: number[] = [];
    const uniqueRows = new Set<string>();

    dataset.forEach((row, index) => {
      const rowKey = getRowKey(row, headers);

      if (seen.has(rowKey)) {
        duplicateRows.push(index + 1);
      } else {
        seen.add(rowKey);
        uniqueRows.add(rowKey);
      }
    });

    setDuplicateResult({
      duplicateRows,
      uniqueRows: uniqueRows.size,
      duplicateCount: duplicateRows.length,
    });

    setDuplicatesRemoved(false);
  };

  const removeDuplicates = () => {
    if (!dataset.length) return;

    const seen = new Set<string>();

    const cleanedDataset = dataset.filter((row) => {
      const rowKey = getRowKey(row, headers);

      if (seen.has(rowKey)) {
        return false;
      }

      seen.add(rowKey);
      return true;
    });

    const removedCount =
      dataset.length - cleanedDataset.length;

    setDataset(cleanedDataset);

    setDuplicateResult({
      duplicateRows: [],
      uniqueRows: cleanedDataset.length,
      duplicateCount: removedCount,
    });

    setDuplicatesRemoved(true);

    // Recalculate the other cleaning result because the
    // dataset has changed.
    setSpacesResult({
      affectedRows: [],
      rowsWithSpaces: 0,
      cellsWithSpaces: 0,
    });

    setMissingResult(
      getMissingAnalysis(cleanedDataset, headers)
    );
  };

  /*
  ============================================================
  FIX SPACES
  ============================================================

  Detects:
  " Shaiza"
  "Shaiza "
  "Shaiza  Kanwal"
  "Shaiza   Kanwal"
  tabs
  multiple whitespace
  */

  const checkSpaces = () => {
    if (!dataset.length) return;

    let rowsWithSpaces = 0;
    let cellsWithSpaces = 0;
    const affectedRows: number[] = [];

    dataset.forEach((row, index) => {
      let rowHasSpaces = false;

      headers.forEach((header) => {
        const value = row[header] ?? "";

        const hasExtraSpaces =
          value !== value.trim() ||
          /\s{2,}/.test(value) ||
          /\t/.test(value);

        if (hasExtraSpaces) {
          cellsWithSpaces++;
          rowHasSpaces = true;
        }
      });

      if (rowHasSpaces) {
        rowsWithSpaces++;
        affectedRows.push(index + 1);
      }
    });

    setSpacesResult({
      affectedRows,
      rowsWithSpaces,
      cellsWithSpaces,
    });

    setSpacesFixed(false);
  };

  const fixSpaces = () => {
    if (!dataset.length) return;

    const cleanedDataset = dataset.map((row) => {
      const newRow = { ...row };

      headers.forEach((header) => {
        const value = newRow[header] ?? "";

        newRow[header] = value
          .replace(/\s+/g, " ")
          .trim();
      });

      return newRow;
    });

    setDataset(cleanedDataset);

    setSpacesResult({
      affectedRows: [],
      rowsWithSpaces: 0,
      cellsWithSpaces: 0,
    });

    setSpacesFixed(true);

    // Refresh the missing-value analysis because the
    // dataset has changed.
    setMissingResult(
      getMissingAnalysis(cleanedDataset, headers)
    );
  };

  /*
  ============================================================
  MISSING VALUES CHECK
  ============================================================

  Missing indicators:
  - blank / whitespace-only
  - N/A / NA
  - NULL / NaN / None
  - Empty / Missing / Unknown
  - - / --

  Professional defaults:
  - ID / Email / Name -> N/A (never invent another record's value)
  - City / Department / Category -> Mode (an observed value)
  - Other numeric columns -> Median
  - Other text columns -> Mode

  Other available treatments:
  - N/A
  - Mean (numeric)
  - Median (numeric)
  - Mode
  - User-Specified Value

  We do NOT delete rows automatically.
  */

  const checkMissingValues = () => {
    if (!dataset.length) return;

    const analysis = getMissingAnalysis(
      dataset,
      headers
    );

    setMissingResult(analysis);
    setMissingValuesFilled(false);

    // Create sensible default suggestions.
    const suggested: Record<
      string,
      MissingTreatment
    > = {};

    analysis.columns.forEach((column) => {
      const normalizedColumn = column.column.trim().toLowerCase();

      // Professional defaults are based on the meaning of the column,
      // not simply on whether the value is text or numeric.
      const isEmailColumn =
        normalizedColumn === "email" ||
        normalizedColumn.includes("email");

      const isIdColumn =
        normalizedColumn === "id" ||
        normalizedColumn.endsWith(" id") ||
        normalizedColumn.endsWith("_id") ||
        normalizedColumn.includes("id");

      const isNameColumn =
        normalizedColumn === "name" ||
        normalizedColumn.includes("name");

      const isCategoricalColumn =
        normalizedColumn === "city" ||
        normalizedColumn.includes("city") ||
        normalizedColumn === "department" ||
        normalizedColumn.includes("department") ||
        normalizedColumn === "category" ||
        normalizedColumn.includes("category");

      // Never invent IDs, emails, or names. Use N/A instead.
      // For categorical business fields such as City/Department,
      // Mode is the default because it uses an observed value.
      if (isEmailColumn || isIdColumn || isNameColumn) {
        suggested[column.column] = "na";
      } else if (isCategoricalColumn) {
        suggested[column.column] = "mode";
      } else {
        suggested[column.column] =
          column.dataType === "numeric"
            ? "median"
            : "mode";
      }
    });

    setMissingTreatment(suggested);
  };

  const fillMissingValues = () => {
    if (!dataset.length || !missingResult) return;

    const cleanedDataset = dataset.map((row) => {
      const newRow = { ...row };

      missingResult.columns.forEach((info) => {
        const currentValue =
          newRow[info.column] ?? "";

        if (!isMissingValue(currentValue)) {
          return;
        }

        const treatment =
          missingTreatment[info.column];

        if (!treatment) {
          return;
        }

        const validValues = dataset
          .map(
            (item) =>
              item[info.column]?.trim() ?? ""
          )
          .filter(
            (value) => !isMissingValue(value)
          );

        let replacement = "";

        if (treatment === "na") {
          replacement = "N/A";
        }

        if (treatment === "mean") {
          replacement = getMean(validValues);
        }

        if (treatment === "median") {
          replacement = getMedian(validValues);
        }

        if (treatment === "mode") {
          replacement = getMode(validValues);
        }

        if (treatment === "custom") {
          replacement =
            customMissingValues[info.column] ?? "";
        }

        // Do not replace a missing value with another
        // missing value accidentally.
        if (!isMissingValue(replacement)) {
          newRow[info.column] = replacement;
        }
      });

      return newRow;
    });

    setDataset(cleanedDataset);

    const afterCleaning = getMissingAnalysis(
      cleanedDataset,
      headers
    );

    setMissingResult(afterCleaning);
    setMissingValuesFilled(true);

    // Other tool results can become stale after data changes.
    setDuplicateResult(null);

    setSpacesResult({
      affectedRows: [],
      rowsWithSpaces: 0,
      cellsWithSpaces: 0,
    });
  };


  const textColumns = useMemo(
    () =>
      headers.filter((header) =>
        dataset.some((row) => {
          const value = (row[header] ?? "").trim();
          return value !== "" && Number.isNaN(Number(value));
        })
      ),
    [dataset, headers]
  );

  const checkTextFormat = () => {
    if (!dataset.length || !textFormatColumn) return;

    const affectedRows: number[] = [];
    let affectedCells = 0;

    const preview = dataset.map((row, index) => {
      const current = row[textFormatColumn] ?? "";
      const formatted = formatTextValue(current, textFormatStyle);

      if (current !== formatted) {
        affectedRows.push(index + 1);
        affectedCells += 1;
      }

      return { ...row, [textFormatColumn]: formatted };
    });

    setTextFormatResult({
      column: textFormatColumn,
      style: textFormatStyle,
      affectedRows,
      affectedCells,
      preview,
    });
    setTextFormatApplied(false);
  };

  const applyTextFormat = () => {
    if (!textFormatResult || !dataset.length) return;
    setDataset(textFormatResult.preview);
    setTextFormatApplied(true);
    setDuplicateResult(null);
    setSpacesResult({ affectedRows: [], rowsWithSpaces: 0, cellsWithSpaces: 0 });
    setMissingResult(getMissingAnalysis(textFormatResult.preview, headers));
  };

  /*
  ============================================================
  OUTLIER DETECTION
  ============================================================

  Professional behavior:
  - Only numeric columns are eligible.
  - IQR is the recommended default.
  - Z-Score uses the conventional |z| > 3 threshold.
  - Modified Z-Score uses |M| > 3.5.
  - Detection never changes data.
  - Review / Keep is the safe default.
  - Treatment is previewed before it is applied.
  */

  const numericColumns = useMemo(
    () =>
      headers.filter((header) =>
        isNumericColumn(dataset, header)
      ),
    [dataset, headers]
  );

  const checkOutliers = () => {
    if (!dataset.length || !outlierColumn) return;

    const result = getOutlierAnalysis(
      dataset,
      outlierColumn,
      outlierMethod
    );

    setOutlierResult(result);
    setOutlierPreview(null);
    setOutlierApplied(false);
  };

  const buildOutlierTreatment = () => {
    if (!dataset.length || !outlierResult) return;

    if (
      outlierTreatment === "review" ||
      outlierResult.outlierCount === 0
    ) {
      setOutlierPreview([...dataset]);
      return;
    }

    const outlierRowNumbers = new Set(
      outlierResult.outliers.map((item) => item.rowNumber)
    );

    const median = getMedianNumber(
      getNumericValues(dataset, outlierResult.column).map(
        (item) => item.value
      )
    );

    const preview = dataset.map((row, index) => {
      const rowNumber = index + 1;

      if (!outlierRowNumbers.has(rowNumber)) {
        return { ...row };
      }

      const newRow = { ...row };

      if (outlierTreatment === "median") {
        newRow[outlierResult.column] = String(
          Number(median.toFixed(4))
        );
      }

      if (outlierTreatment === "winsorize") {
        const original = Number(
          newRow[outlierResult.column]
        );

        newRow[outlierResult.column] = String(
          Number(
            Math.min(
              outlierResult.upperBound,
              Math.max(
                outlierResult.lowerBound,
                original
              )
            ).toFixed(4)
          )
        );
      }

      return newRow;
    });

    setOutlierPreview(
      outlierTreatment === "remove"
        ? preview.filter(
            (_, index) =>
              !outlierRowNumbers.has(index + 1)
          )
        : preview
    );
  };

  const applyOutlierTreatment = () => {
    if (!dataset.length || !outlierResult) return;

    if (outlierTreatment === "review") {
      setOutlierApplied(true);
      setOutlierPreview([...dataset]);
      return;
    }

    buildOutlierTreatment();

    // Build the exact final dataset here instead of relying on
    // the asynchronous preview state.
    const outlierRowNumbers = new Set(
      outlierResult.outliers.map((item) => item.rowNumber)
    );

    if (outlierTreatment === "remove") {
      const cleanedDataset = dataset.filter(
        (_, index) =>
          !outlierRowNumbers.has(index + 1)
      );

      setDataset(cleanedDataset);
      setOutlierApplied(true);
      setOutlierPreview(cleanedDataset);
      setOutlierResult({
        ...outlierResult,
        totalValues: Math.max(
          0,
          outlierResult.totalValues -
            outlierResult.outlierCount
        ),
        normalValues: Math.max(
          0,
          outlierResult.normalValues
        ),
        outlierCount: 0,
        outliers: [],
      });
    }

    if (
      outlierTreatment === "median" ||
      outlierTreatment === "winsorize"
    ) {
      const median = getMedianNumber(
        getNumericValues(
          dataset,
          outlierResult.column
        ).map((item) => item.value)
      );

      const cleanedDataset = dataset.map(
        (row, index) => {
          if (!outlierRowNumbers.has(index + 1)) {
            return { ...row };
          }

          const newRow = { ...row };

          if (outlierTreatment === "median") {
            newRow[outlierResult.column] = String(
              Number(median.toFixed(4))
            );
          } else {
            const original = Number(
              newRow[outlierResult.column]
            );

            newRow[outlierResult.column] = String(
              Number(
                Math.min(
                  outlierResult.upperBound,
                  Math.max(
                    outlierResult.lowerBound,
                    original
                  )
                ).toFixed(4)
              )
            );
          }

          return newRow;
        }
      );

      setDataset(cleanedDataset);
      setOutlierApplied(true);
      setOutlierPreview(cleanedDataset);

      // Re-run the selected method after treatment so the
      // result reflects the cleaned data.
      const afterTreatment = getOutlierAnalysis(
        cleanedDataset,
        outlierResult.column,
        outlierResult.method
      );

      setOutlierResult(afterTreatment);
    }

    setDuplicateResult(null);
    setDuplicatesRemoved(false);
    setSpacesResult({
      affectedRows: [],
      rowsWithSpaces: 0,
      cellsWithSpaces: 0,
    });
    setSpacesFixed(false);
    setMissingResult(
      getMissingAnalysis(dataset, headers)
    );
  };

  const outlierMethodLabel =
    outlierMethod === "iqr"
      ? "IQR"
      : outlierMethod === "zscore"
      ? "Z-Score"
      : "Modified Z-Score";

  const outlierTreatmentLabel =
    outlierTreatment === "review"
      ? "Review / Keep"
      : outlierTreatment === "remove"
      ? "Remove"
      : outlierTreatment === "median"
      ? "Replace with Median"
      : "Cap / Winsorize";

  /*
  ============================================================
  SIDEBAR TOOL SELECTION
  ============================================================
  */

  const selectTool = (tool: ToolId) => {
    setActiveTool(tool);

    if (!dataset.length) return;

    if (tool === "duplicates") {
      checkDuplicates();
    }

    if (tool === "spaces") {
      checkSpaces();
    }

    if (tool === "missing") {
      checkMissingValues();
    }

    if (tool === "outliers") {
      checkOutliers();
    }

    if (tool === "textFormat") {
      checkTextFormat();
    }
  };

  const missingCells =
    missingResult?.totalMissing ?? 0;

  return (
    <main className="min-h-screen bg-[#f5f8ff] text-[#17356f]">

      {/* HEADER */}

      <header className="h-[88px] bg-white border-b border-blue-100 flex items-center justify-between px-10">

        <div>
          <h1 className="text-3xl font-bold text-[#17356f]">
            InsightOS
          </h1>

          <p className="text-[#6380aa] text-base">
            Intelligent Data Cleaning & Analysis
          </p>
        </div>

        <div className="flex items-center gap-5">

          <button className="w-12 h-12 rounded-xl border border-blue-100 bg-white shadow-sm text-xl">
            🔔
          </button>

          <div className="flex items-center gap-3">

            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700">
              SK
            </div>

            <div>
              <p className="font-semibold text-[#17356f]">
                User
              </p>

              <p className="text-sm text-[#7890b5]">
                Data Analyst
              </p>
            </div>

          </div>

        </div>

      </header>

      <div className="flex">

        {/* SIDEBAR */}

        <aside className="w-[280px] min-h-[calc(100vh-88px)] bg-white border-r border-blue-100 px-6 py-8">

          <p className="text-sm font-semibold tracking-wider text-[#8ba0c1] mb-5">
            WORKSPACE
          </p>

          <div className="space-y-2">

            <button className="w-full flex items-center gap-4 px-5 py-4 rounded-xl text-left text-[#536f98] hover:bg-[#f6f9ff]">
              <span className="text-xl">🏠</span>
              <span>Dashboard</span>
            </button>

            <button className="w-full flex items-center gap-4 px-5 py-4 rounded-xl text-left text-[#536f98] hover:bg-[#f6f9ff]">
              <span className="text-xl">📁</span>
              <span>Upload Data</span>
            </button>

            {/* DATA CLEANING */}

            <div className="mt-3">

              <div className="w-full flex items-center gap-4 px-5 py-4 rounded-xl bg-[#edf4ff] text-blue-700 font-semibold">
                <span className="text-xl">🧹</span>
                <span>Data Cleaning</span>
              </div>

              {/* ALL CLEANING FEATURES ARE INSIDE DATA CLEANING */}

              <div className="ml-6 mt-2 pl-4 border-l-2 border-blue-100 space-y-1">

                {/* REMOVE DUPLICATES */}

                <button
                  onClick={() =>
                    selectTool("duplicates")
                  }
                  disabled={!dataset.length}
                  className={`w-full text-left px-4 py-3 rounded-lg transition ${
                    activeTool === "duplicates"
                      ? "bg-blue-50 text-blue-700 font-semibold"
                      : "text-[#607a9e] hover:bg-[#f7faff]"
                  } ${
                    !dataset.length
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span>♻️</span>

                    <div>
                      <p className="text-sm">
                        Remove Duplicates
                      </p>

                      <p className="text-xs text-[#91a5c4]">
                        Find repeated rows
                      </p>
                    </div>
                  </div>
                </button>

                {/* FIX SPACES */}

                <button
                  onClick={() =>
                    selectTool("spaces")
                  }
                  disabled={!dataset.length}
                  className={`w-full text-left px-4 py-3 rounded-lg transition ${
                    activeTool === "spaces"
                      ? "bg-blue-50 text-blue-700 font-semibold"
                      : "text-[#607a9e] hover:bg-[#f7faff]"
                  } ${
                    !dataset.length
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span>↔️</span>

                    <div>
                      <p className="text-sm">
                        Fix Spaces
                      </p>

                      <p className="text-xs text-[#91a5c4]">
                        Remove extra spaces
                      </p>
                    </div>
                  </div>
                </button>

                {/* MISSING VALUES */}

                <button
                  onClick={() =>
                    selectTool("missing")
                  }
                  disabled={!dataset.length}
                  className={`w-full text-left px-4 py-3 rounded-lg transition ${
                    activeTool === "missing"
                      ? "bg-blue-50 text-blue-700 font-semibold"
                      : "text-[#607a9e] hover:bg-[#f7faff]"
                  } ${
                    !dataset.length
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span>◻️</span>

                    <div>
                      <p className="text-sm">
                        Missing Values
                      </p>

                      <p className="text-xs text-[#91a5c4]">
                        Detect and fill missing data
                      </p>
                    </div>
                  </div>
                </button>


                {/* OUTLIERS */}

                <button
                  onClick={() =>
                    selectTool("outliers")
                  }
                  disabled={!dataset.length}
                  className={`w-full text-left px-4 py-3 rounded-lg transition ${
                    activeTool === "outliers"
                      ? "bg-blue-50 text-blue-700 font-semibold"
                      : "text-[#607a9e] hover:bg-[#f7faff]"
                  } ${
                    !dataset.length
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span>📈</span>

                    <div>
                      <p className="text-sm">
                        Outliers
                      </p>

                      <p className="text-xs text-[#91a5c4]">
                        Detect unusual values
                      </p>
                    </div>
                  </div>
                </button>

                {/* TEXT FORMAT */}

                <button
                  onClick={() => selectTool("textFormat")}
                  disabled={!dataset.length}
                  className={`w-full text-left px-4 py-3 rounded-lg transition ${
                    activeTool === "textFormat"
                      ? "bg-blue-50 text-blue-700 font-semibold"
                      : "text-[#607a9e] hover:bg-[#f7faff]"
                  } ${!dataset.length ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <span>🔤</span>
                    <div>
                      <p className="text-sm">Text Format</p>
                      <p className="text-xs text-[#91a5c4]">Standardize text capitalization</p>
                    </div>
                  </div>
                </button>

              </div>
            </div>

            <button className="w-full flex items-center gap-4 px-5 py-4 rounded-xl text-left text-[#536f98] hover:bg-[#f6f9ff]">
              <span className="text-xl">📊</span>
              <span>Analysis</span>
            </button>

            <button className="w-full flex items-center gap-4 px-5 py-4 rounded-xl text-left text-[#536f98] hover:bg-[#f6f9ff]">
              <span className="text-xl">💡</span>
              <span>Insights</span>
            </button>

            <button className="w-full flex items-center gap-4 px-5 py-4 rounded-xl text-left text-[#536f98] hover:bg-[#f6f9ff]">
              <span className="text-xl">📄</span>
              <span>Reports</span>
            </button>

          </div>

        </aside>

        {/* MAIN */}

        <section className="flex-1 p-10">

          <div className="max-w-[1500px] mx-auto">

            {/* TITLE */}

            <div className="mb-8">

              <p className="text-blue-600 font-medium text-lg">
                Data Cleaning Workspace
              </p>

              <h2 className="text-5xl font-bold mt-2 text-[#17356f]">
                Clean your data
              </h2>

              <p className="mt-3 text-lg text-[#6882a8]">
                Upload your dataset once and perform multiple cleaning operations.
              </p>

            </div>

            {/* UPLOAD */}

            <section className="bg-white rounded-3xl border border-blue-100 shadow-sm p-8 mb-7">

              <div className="flex items-center justify-between mb-6">

                <div>

                  <h3 className="text-2xl font-bold">
                    {dataset.length
                      ? "Dataset loaded"
                      : "Upload your dataset"}
                  </h3>

                  <p className="text-[#7087a9] mt-1">
                    {dataset.length
                      ? "Your dataset is ready for cleaning."
                      : "Upload a CSV dataset to begin."}
                  </p>

                </div>

                {/* ALWAYS AVAILABLE */}

                <label className="cursor-pointer">

                  <span className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#294ba4] text-white font-semibold hover:bg-[#1f3d8e]">
                    📁 Upload Dataset
                  </span>

                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleUploadChange}
                    className="hidden"
                  />

                </label>

              </div>

              {!dataset.length && (

                <label
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() =>
                    setIsDragging(false)
                  }
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);

                    const file =
                      e.dataTransfer.files?.[0];

                    if (file) {
                      handleFile(file);
                    }
                  }}
                  className={`min-h-[240px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer ${
                    isDragging
                      ? "border-blue-500 bg-blue-50"
                      : "border-blue-200 bg-[#f9fbff]"
                  }`}
                >

                  <div className="w-20 h-20 rounded-2xl bg-blue-50 flex items-center justify-center text-4xl mb-4">
                    📁
                  </div>

                  <h4 className="text-xl font-semibold">
                    Drop your dataset here
                  </h4>

                  <p className="text-[#7d93b3] mt-2">
                    CSV files supported
                  </p>

                  <span className="mt-5 px-7 py-3 rounded-xl bg-[#294ba4] text-white font-semibold">
                    + Upload Dataset
                  </span>

                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleUploadChange}
                    className="hidden"
                  />

                </label>

              )}

              {dataset.length > 0 && (

                <div className="rounded-2xl bg-[#f5f9ff] border border-blue-100 p-6">

                  <div className="flex items-center gap-4">

                    <div className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center text-2xl">
                      ✓
                    </div>

                    <div>

                      <p className="font-bold text-lg">
                        {fileName}
                      </p>

                      <p className="text-[#6f86a7]">
                        {dataset.length} rows ×{" "}
                        {headers.length} columns
                        {" • "}
                        Dataset loaded successfully.
                      </p>

                    </div>

                  </div>

                </div>

              )}

            </section>

            {/* STATISTICS */}

            {dataset.length > 0 && (

              <section className="grid grid-cols-4 gap-5 mb-7">

                <div className="bg-white rounded-2xl border border-blue-100 p-6 shadow-sm">
                  <p className="text-sm text-[#8aa0c0]">
                    Total Rows
                  </p>

                  <p className="text-3xl font-bold mt-2">
                    {dataset.length}
                  </p>
                </div>

                <div className="bg-white rounded-2xl border border-blue-100 p-6 shadow-sm">
                  <p className="text-sm text-[#8aa0c0]">
                    Total Columns
                  </p>

                  <p className="text-3xl font-bold mt-2">
                    {headers.length}
                  </p>
                </div>

                {activeTool === "duplicates" && (
                  <>
                    <div className="bg-white rounded-2xl border border-blue-100 p-6 shadow-sm">
                      <p className="text-sm text-[#8aa0c0]">
                        Unique Rows
                      </p>

                      <p className="text-3xl font-bold mt-2 text-green-600">
                        {duplicateResult
                          ? duplicateResult.uniqueRows
                          : "—"}
                      </p>
                    </div>

                    <div className="bg-white rounded-2xl border border-blue-100 p-6 shadow-sm">
                      <p className="text-sm text-[#8aa0c0]">
                        Duplicate Rows
                      </p>

                      <p className="text-3xl font-bold mt-2 text-red-500">
                        {duplicateResult
                          ? duplicateResult.duplicateCount
                          : "—"}
                      </p>
                    </div>
                  </>
                )}

                {activeTool === "spaces" && (
                  <>
                    <div className="bg-white rounded-2xl border border-blue-100 p-6 shadow-sm">
                      <p className="text-sm text-[#8aa0c0]">
                        Rows With Extra Spaces
                      </p>

                      <p className="text-3xl font-bold mt-2 text-orange-500">
                        {spacesResult.rowsWithSpaces}
                      </p>
                    </div>

                    <div className="bg-white rounded-2xl border border-blue-100 p-6 shadow-sm">
                      <p className="text-sm text-[#8aa0c0]">
                        Extra Space Cells
                      </p>

                      <p className="text-3xl font-bold mt-2 text-red-500">
                        {spacesResult.cellsWithSpaces}
                      </p>
                    </div>
                  </>
                )}

                {activeTool === "missing" && (
                  <>
                    <div className="bg-white rounded-2xl border border-blue-100 p-6 shadow-sm">
                      <p className="text-sm text-[#8aa0c0]">
                        Rows With Missing Values
                      </p>

                      <p className="text-3xl font-bold mt-2 text-orange-500">
                        {missingResult
                          ? missingResult.rowsWithMissing
                          : "—"}
                      </p>
                    </div>

                    <div className="bg-white rounded-2xl border border-blue-100 p-6 shadow-sm">
                      <p className="text-sm text-[#8aa0c0]">
                        Missing Cells
                      </p>

                      <p className="text-3xl font-bold mt-2 text-red-500">
                        {missingResult
                          ? missingResult.totalMissing
                          : "—"}
                      </p>
                    </div>
                  </>

                )}
                {activeTool === "outliers" && (
                  <>
                    <div className="bg-white rounded-2xl border border-blue-100 p-6 shadow-sm">
                      <p className="text-sm text-[#8aa0c0]">
                        Numeric Values
                      </p>

                      <p className="text-3xl font-bold mt-2">
                        {outlierResult
                          ? outlierResult.totalValues
                          : "—"}
                      </p>
                    </div>

                    <div className="bg-white rounded-2xl border border-blue-100 p-6 shadow-sm">
                      <p className="text-sm text-[#8aa0c0]">
                        Outliers
                      </p>

                      <p className="text-3xl font-bold mt-2 text-red-500">
                        {outlierResult
                          ? outlierResult.outlierCount
                          : "—"}
                      </p>
                    </div>
                  </>
                )}

              </section>

            )}

            {/* ACTIVE CLEANING TOOL */}

            {dataset.length > 0 && (

              <section className="bg-white rounded-3xl border border-blue-100 shadow-sm p-8 mb-7">

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-blue-600 font-medium">
                      Data Cleaning
                    </p>

                    <h3 className="text-3xl font-bold mt-1">

                      {activeTool === "duplicates"
                        ? "Remove Duplicates"
                        : activeTool === "spaces"
                        ? "Fix Spaces"
                        : activeTool === "missing"
                        ? "Missing Values"
                        : activeTool === "outliers"
                        ? "Outlier Detection"
                        : "Text Format"}

                    </h3>

                    <p className="text-[#7087a9] mt-2">

                      {activeTool === "duplicates"
                        ? "Find repeated complete rows in your dataset."
                        : activeTool === "spaces"
                        ? "Find and remove leading, trailing, and repeated spaces."
                        : activeTool === "missing"
                        ? "Detect missing values and choose how to fill them."
                        : activeTool === "outliers"
                        ? "Detect unusual numeric values using professional statistical methods."
                        : "Standardize text capitalization while preserving complete multi-word values."}

                    </p>

                  </div>

                  <button
                    onClick={() => {
                      if (activeTool === "duplicates") {
                        checkDuplicates();
                      }

                      if (activeTool === "spaces") {
                        checkSpaces();
                      }

                      if (activeTool === "missing") {
                        checkMissingValues();
                      }

                      if (activeTool === "outliers") {
                        checkOutliers();
                      }

                      if (activeTool === "textFormat") {
                        checkTextFormat();
                      }
                    }}
                    className="px-7 py-3 rounded-xl bg-[#294ba4] text-white font-semibold hover:bg-[#1f3d8e]"
                  >
                    🔍 Check{" "}
                    {activeTool === "duplicates"
                      ? "Duplicates"
                      : activeTool === "spaces"
                      ? "Extra Spaces"
                      : activeTool === "missing"
                      ? "Missing Values"
                      : "Outliers"}
                  </button>

                </div>

                {/* DUPLICATES */}

                {activeTool === "duplicates" &&
                  duplicateResult && (

                    <div className="mt-7">

                      {duplicatesRemoved ? (

                        <div className="rounded-2xl border border-green-200 bg-green-50 p-6">

                          <div className="flex items-center gap-4">

                            <div className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center text-2xl">
                              ✓
                            </div>

                            <div>

                              <h4 className="text-xl font-bold text-green-800">
                                Duplicates removed successfully
                              </h4>

                              <p className="text-green-700 mt-1">
                                {
                                  duplicateResult.duplicateCount
                                } duplicate rows were removed.
                              </p>

                            </div>

                          </div>

                        </div>

                      ) : duplicateResult.duplicateCount > 0 ? (

                        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">

                          <div className="flex items-start justify-between">

                            <div>

                              <h4 className="text-xl font-bold text-red-700">
                                {
                                  duplicateResult.duplicateCount
                                } duplicate rows found
                              </h4>

                              <p className="text-red-600 mt-1">
                                {
                                  duplicateResult.uniqueRows
                                } unique rows found.
                              </p>

                            </div>

                            <div className="text-right">

                              <p className="text-xs text-red-400">
                                DUPLICATES
                              </p>

                              <p className="text-4xl font-bold text-red-600">
                                {
                                  duplicateResult.duplicateCount
                                }
                              </p>

                            </div>

                          </div>

                          <div className="mt-6">

                            <p className="font-semibold mb-3">
                              Duplicated row numbers
                            </p>

                            <div className="flex flex-wrap gap-2 max-h-[180px] overflow-auto">

                              {duplicateResult.duplicateRows.map(
                                (rowNumber) => (
                                  <span
                                    key={rowNumber}
                                    className="px-3 py-2 rounded-lg bg-white border border-red-200 text-sm text-red-700"
                                  >
                                    Row {rowNumber}
                                  </span>
                                )
                              )}

                            </div>

                          </div>

                          <button
                            onClick={removeDuplicates}
                            className="mt-6 px-7 py-3 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700"
                          >
                            🗑 Remove{" "}
                            {
                              duplicateResult.duplicateCount
                            }{" "}
                            Duplicate Rows
                          </button>

                        </div>

                      ) : (

                        <div className="rounded-2xl border border-green-200 bg-green-50 p-6">

                          <div className="flex items-center gap-4">

                            <div className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center text-2xl">
                              ✓
                            </div>

                            <div>

                              <h4 className="text-xl font-bold text-green-800">
                                No duplicate rows found
                              </h4>

                              <p className="text-green-700 mt-1">
                                All {dataset.length} rows are unique.
                              </p>

                            </div>

                          </div>

                        </div>

                      )}

                    </div>
                  )}

                {/* SPACES */}

                {activeTool === "spaces" && (

                  <div className="mt-7">

                    {spacesFixed ? (

                      <div className="rounded-2xl border border-green-200 bg-green-50 p-6">

                        <div className="flex items-center gap-4">

                          <div className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center text-2xl">
                            ✓
                          </div>

                          <div>

                            <h4 className="text-xl font-bold text-green-800">
                              Extra spaces fixed successfully
                            </h4>

                            <p className="text-green-700 mt-1">
                              Leading, trailing, and repeated spaces have been cleaned.
                            </p>

                          </div>

                        </div>

                      </div>

                    ) : spacesResult.cellsWithSpaces > 0 ? (

                      <div className="rounded-2xl border border-orange-200 bg-orange-50 p-6">

                        <div className="flex items-start justify-between">

                          <div>

                            <h4 className="text-xl font-bold text-orange-700">
                              {spacesResult.cellsWithSpaces} cells with extra spaces found
                            </h4>

                            <p className="text-orange-700 mt-1">
                              {spacesResult.rowsWithSpaces} rows contain extra spaces.
                            </p>

                          </div>

                          <div className="text-right">

                            <p className="text-xs text-orange-500">
                              EXTRA SPACES
                            </p>

                            <p className="text-4xl font-bold text-orange-600">
                              {spacesResult.cellsWithSpaces}
                            </p>

                          </div>

                        </div>

                        <div className="mt-6">

                          <p className="font-semibold mb-3">
                            Rows with extra spaces
                          </p>

                          <div className="flex flex-wrap gap-2 max-h-[180px] overflow-auto">

                            {spacesResult.affectedRows.map(
                              (rowNumber) => (
                                <span
                                  key={rowNumber}
                                  className="px-3 py-2 rounded-lg bg-white border border-orange-200 text-sm text-orange-700"
                                >
                                  Row {rowNumber}
                                </span>
                              )
                            )}

                          </div>

                        </div>

                        <button
                          onClick={fixSpaces}
                          className="mt-6 px-7 py-3 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600"
                        >
                          🧹 Fix{" "}
                          {spacesResult.cellsWithSpaces}{" "}
                          Extra Space Cells
                        </button>

                      </div>

                    ) : (

                      <div className="rounded-2xl border border-green-200 bg-green-50 p-6">

                        <div className="flex items-center gap-4">

                          <div className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center text-2xl">
                            ✓
                          </div>

                          <div>

                            <h4 className="text-xl font-bold text-green-800">
                              No extra spaces found
                            </h4>

                            <p className="text-green-700 mt-1">
                              Your dataset spacing looks clean.
                            </p>

                          </div>

                        </div>

                      </div>

                    )}

                  </div>
                )}

                {/* MISSING VALUES */}

                {activeTool === "missing" && (

                  <div className="mt-7">

                    {missingValuesFilled &&
                    missingResult &&
                    missingResult.totalMissing === 0 ? (

                      <div className="rounded-2xl border border-green-200 bg-green-50 p-6">

                        <div className="flex items-center gap-4">

                          <div className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center text-2xl">
                            ✓
                          </div>

                          <div>

                            <h4 className="text-xl font-bold text-green-800">
                              Missing values handled successfully
                            </h4>

                            <p className="text-green-700 mt-1">
                              All detected missing values have been handled using the selected methods. Email and ID blanks use N/A; numeric blanks use Median; other text blanks use Mode.
                            </p>

                          </div>

                        </div>

                      </div>

                    ) : missingResult &&
                    missingResult.totalMissing > 0 ? (

                      <div className="rounded-2xl border border-orange-200 bg-orange-50 p-6">

                        <div className="flex items-start justify-between">

                          <div>

                            <h4 className="text-xl font-bold text-orange-700">
                              {missingResult.totalMissing} missing cells found
                            </h4>

                            <p className="text-orange-700 mt-1">
                              {missingResult.rowsWithMissing} rows contain missing values.
                            </p>

                          </div>

                          <div className="text-right">

                            <p className="text-xs text-orange-500">
                              MISSING CELLS
                            </p>

                            <p className="text-4xl font-bold text-orange-600">
                              {missingResult.totalMissing}
                            </p>

                          </div>

                        </div>

                        <div className="mt-6">

                          <p className="font-semibold mb-3">
                            Missing values by column
                          </p>

                          <div className="overflow-auto border border-orange-100 rounded-2xl bg-white">

                            <table className="min-w-full text-sm">

                              <thead className="bg-orange-50">

                                <tr>

                                  <th className="px-4 py-3 text-left">
                                    Column
                                  </th>

                                  <th className="px-4 py-3 text-left">
                                    Missing
                                  </th>

                                  <th className="px-4 py-3 text-left">
                                    Missing %
                                  </th>

                                  <th className="px-4 py-3 text-left">
                                    Data Type
                                  </th>

                                  <th className="px-4 py-3 text-left">
                                    Fill Method
                                  </th>

                                </tr>

                              </thead>

                              <tbody>

                                {missingResult.columns.map(
                                  (info) => (

                                    <tr
                                      key={info.column}
                                      className="border-t border-orange-50"
                                    >

                                      <td className="px-4 py-4 font-semibold whitespace-nowrap">
                                        {info.column}
                                      </td>

                                      <td className="px-4 py-4 text-red-600 font-semibold">
                                        {info.missingCount}
                                      </td>

                                      <td className="px-4 py-4">
                                        {info.missingPercent}%
                                      </td>

                                      <td className="px-4 py-4">
                                        <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700">
                                          {info.dataType}
                                        </span>
                                      </td>

                                      <td className="px-4 py-4">

                                        <select
                                          value={
                                            missingTreatment[
                                              info.column
                                            ] ?? ""
                                          }
                                          onChange={(event) =>
                                            setMissingTreatment(
                                              (previous) => ({
                                                ...previous,
                                                [info.column]:
                                                  event.target
                                                    .value as MissingTreatment,
                                              })
                                            )
                                          }
                                          className="border border-blue-200 rounded-xl px-3 py-2 bg-white"
                                        >

                                          <option value="">
                                            Select method
                                          </option>

                                          {info.suggestedMethods.includes(
                                            "na"
                                          ) && (
                                            <option value="na">
                                              N/A
                                            </option>
                                          )}

                                          {info.suggestedMethods.includes(
                                            "median"
                                          ) && (
                                            <option value="median">
                                              Median
                                            </option>
                                          )}

                                          {info.suggestedMethods.includes(
                                            "mean"
                                          ) && (
                                            <option value="mean">
                                              Mean
                                            </option>
                                          )}

                                          {info.suggestedMethods.includes(
                                            "mode"
                                          ) && (
                                            <option value="mode">
                                              Mode
                                            </option>
                                          )}

                                          <option value="custom">
                                            User-Specified Value
                                          </option>

                                        </select>

                                      </td>

                                    </tr>

                                  )
                                )}

                              </tbody>

                            </table>

                          </div>

                        </div>

                        {/* CUSTOM VALUES */}

                        {missingResult.columns.some(
                          (info) =>
                            missingTreatment[
                              info.column
                            ] === "custom"
                        ) && (

                          <div className="mt-6 rounded-2xl bg-white border border-blue-100 p-5">

                            <h4 className="font-bold text-lg">
                              User-Specified Values
                            </h4>

                            <p className="text-sm text-[#7087a9] mt-1 mb-4">
                              Enter the value to use for each column where you selected User-Specified Value.
                            </p>

                            <div className="grid md:grid-cols-2 gap-4">

                              {missingResult.columns
                                .filter(
                                  (info) =>
                                    missingTreatment[
                                      info.column
                                    ] === "custom"
                                )
                                .map((info) => (

                                  <div
                                    key={info.column}
                                  >

                                    <label className="block text-sm font-semibold mb-2">
                                      {info.column}
                                    </label>

                                    <input
                                      type="text"
                                      value={
                                        customMissingValues[
                                          info.column
                                        ] ?? ""
                                      }
                                      onChange={(event) =>
                                        setCustomMissingValues(
                                          (previous) => ({
                                            ...previous,
                                            [info.column]:
                                              event.target.value,
                                          })
                                        )
                                      }
                                      placeholder={
                                        info.dataType === "numeric"
                                          ? "Example: 0"
                                          : "Example: Unknown"
                                      }
                                      className="w-full border border-blue-200 rounded-xl px-4 py-3"
                                    />

                                  </div>

                                ))}

                            </div>

                          </div>

                        )}

                        <div className="mt-6 rounded-2xl bg-white border border-blue-100 p-5">

                          <p className="font-semibold">
                            Recommended treatment
                          </p>

                          <p className="text-sm text-[#7087a9] mt-1">
                            Professional treatment is based on the meaning of each column. ID, Email, and Name default to N/A because we should never invent or copy another record's identity. City, Department, and other categorical fields default to Mode because it uses an observed value. Other numeric fields default to Median. N/A is available for every column, and you can change the method before applying it.
                          </p>

                        </div>

                        <button
                          onClick={fillMissingValues}
                          className="mt-6 px-7 py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700"
                        >
                          ✓ Fill Missing Values
                        </button>

                      </div>

                    ) : missingResult &&
                    missingResult.totalMissing === 0 ? (

                      <div className="rounded-2xl border border-green-200 bg-green-50 p-6">

                        <div className="flex items-center gap-4">

                          <div className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center text-2xl">
                            ✓
                          </div>

                          <div>

                            <h4 className="text-xl font-bold text-green-800">
                              No missing values found
                            </h4>

                            <p className="text-green-700 mt-1">
                              No blank, N/A, NA, NULL, or similar missing values were detected.
                            </p>

                          </div>

                        </div>

                      </div>

                    ) : (

                      <div className="rounded-2xl border border-blue-100 bg-[#f7faff] p-6">

                        <p className="font-semibold">
                          Click "Check Missing Values" to scan the dataset.
                        </p>

                      </div>

                    )}

                  </div>
                )}

              </section>

            )}


                {/* OUTLIERS */}

                {activeTool === "outliers" && (

                  <div className="mt-7">

                    <div className="grid md:grid-cols-3 gap-5">

                      <div>
                        <label className="block text-sm font-semibold mb-2">
                          Numeric Column
                        </label>

                        <select
                          value={outlierColumn}
                          onChange={(event) => {
                            setOutlierColumn(event.target.value);
                            setOutlierResult(null);
                            setOutlierPreview(null);
                            setOutlierApplied(false);
                          }}
                          className="w-full border border-blue-200 rounded-xl px-4 py-3 bg-white"
                        >
                          <option value="">
                            Select numeric column
                          </option>

                          {numericColumns.map((column) => (
                            <option key={column} value={column}>
                              {column}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold mb-2">
                          Detection Method
                        </label>

                        <select
                          value={outlierMethod}
                          onChange={(event) => {
                            setOutlierMethod(
                              event.target.value as OutlierMethod
                            );
                            setOutlierResult(null);
                            setOutlierPreview(null);
                            setOutlierApplied(false);
                          }}
                          className="w-full border border-blue-200 rounded-xl px-4 py-3 bg-white"
                        >
                          <option value="iqr">
                            IQR — Recommended
                          </option>
                          <option value="zscore">
                            Z-Score
                          </option>
                          <option value="modified-zscore">
                            Modified Z-Score
                          </option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold mb-2">
                          Treatment
                        </label>

                        <select
                          value={outlierTreatment}
                          onChange={(event) => {
                            setOutlierTreatment(
                              event.target.value as OutlierTreatment
                            );
                            setOutlierPreview(null);
                            setOutlierApplied(false);
                          }}
                          className="w-full border border-blue-200 rounded-xl px-4 py-3 bg-white"
                        >
                          <option value="review">
                            Review / Keep
                          </option>
                          <option value="remove">
                            Remove
                          </option>
                          <option value="median">
                            Replace with Median
                          </option>
                          <option value="winsorize">
                            Cap / Winsorize
                          </option>
                        </select>
                      </div>

                    </div>

                    {!numericColumns.length && (
                      <div className="mt-6 rounded-2xl border border-orange-200 bg-orange-50 p-5 text-orange-700">
                        No numeric columns were detected. Outlier analysis is
                        available only for numeric data.
                      </div>
                    )}

                    {outlierResult && (
                      <div className="mt-7">

                        <div className="rounded-2xl border border-blue-100 bg-[#f7faff] p-6">

                          <div className="flex items-start justify-between gap-6">

                            <div>
                              <p className="text-sm text-blue-600 font-semibold">
                                OUTLIER ANALYSIS
                              </p>

                              <h4 className="text-2xl font-bold mt-1">
                                {outlierResult.column}
                              </h4>

                              <p className="text-[#7087a9] mt-1">
                                {outlierMethodLabel} detection •{" "}
                                {outlierTreatmentLabel}
                              </p>
                            </div>

                            <div className="text-right">
                              <p className="text-xs text-[#8ba0c1]">
                                OUTLIERS FOUND
                              </p>

                              <p className="text-4xl font-bold text-red-500">
                                {outlierResult.outlierCount}
                              </p>
                            </div>

                          </div>

                          <div className="grid md:grid-cols-4 gap-4 mt-6">

                            <div className="bg-white rounded-xl border border-blue-100 p-4">
                              <p className="text-xs text-[#8aa0c0]">
                                Total Numeric Values
                              </p>
                              <p className="text-2xl font-bold mt-1">
                                {outlierResult.totalValues}
                              </p>
                            </div>

                            <div className="bg-white rounded-xl border border-blue-100 p-4">
                              <p className="text-xs text-[#8aa0c0]">
                                Normal Values
                              </p>
                              <p className="text-2xl font-bold mt-1 text-green-600">
                                {outlierResult.normalValues}
                              </p>
                            </div>

                            <div className="bg-white rounded-xl border border-blue-100 p-4">
                              <p className="text-xs text-[#8aa0c0]">
                                Lower Bound
                              </p>
                              <p className="text-2xl font-bold mt-1">
                                {formatNumber(outlierResult.lowerBound)}
                              </p>
                            </div>

                            <div className="bg-white rounded-xl border border-blue-100 p-4">
                              <p className="text-xs text-[#8aa0c0]">
                                Upper Bound
                              </p>
                              <p className="text-2xl font-bold mt-1">
                                {formatNumber(outlierResult.upperBound)}
                              </p>
                            </div>

                          </div>

                        </div>

                        {outlierResult.outlierCount > 0 ? (

                          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6">

                            <div className="flex items-start justify-between">

                              <div>
                                <h4 className="text-xl font-bold text-red-700">
                                  {outlierResult.outlierCount} unusual values detected
                                </h4>

                                <p className="text-red-600 mt-1">
                                  Outliers are flagged for review. They are not
                                  automatically errors.
                                </p>
                              </div>

                              <span className="px-4 py-2 rounded-xl bg-white border border-red-200 text-red-700 font-semibold">
                                Review recommended
                              </span>

                            </div>

                            <div className="mt-6 overflow-auto max-h-[260px] border border-red-100 rounded-2xl bg-white">

                              <table className="min-w-full text-sm">

                                <thead className="bg-red-50 sticky top-0">
                                  <tr>
                                    <th className="px-4 py-3 text-left">
                                      Row
                                    </th>
                                    <th className="px-4 py-3 text-left">
                                      {outlierResult.column}
                                    </th>
                                  </tr>
                                </thead>

                                <tbody>
                                  {outlierResult.outliers.map((item) => (
                                    <tr
                                      key={`${item.rowNumber}-${item.value}`}
                                      className="border-t border-red-50"
                                    >
                                      <td className="px-4 py-3 font-semibold">
                                        Row {item.rowNumber}
                                      </td>
                                      <td className="px-4 py-3 text-red-700 font-semibold">
                                        {formatNumber(item.value)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>

                              </table>

                            </div>

                            <div className="mt-6 rounded-2xl bg-white border border-blue-100 p-5">

                              <p className="font-semibold">
                                Treatment selected: {outlierTreatmentLabel}
                              </p>

                              <p className="text-sm text-[#7087a9] mt-1">
                                {outlierTreatment === "review"
                                  ? "No values will be changed. Use this option when an unusual value may be legitimate."
                                  : outlierTreatment === "remove"
                                  ? "The complete rows containing detected outliers will be removed."
                                  : outlierTreatment === "median"
                                  ? "Detected outliers will be replaced with the median of the valid values in this column."
                                  : "Detected outliers will be capped at the calculated lower or upper bound without deleting the records."}
                              </p>

                            </div>

                            <div className="mt-6 flex flex-wrap gap-3">

                              {outlierTreatment === "review" ? (

                                <button
                                  onClick={applyOutlierTreatment}
                                  className="px-7 py-3 rounded-xl bg-[#294ba4] text-white font-semibold hover:bg-[#1f3d8e]"
                                >
                                  ✓ Keep & Mark as Reviewed
                                </button>

                              ) : !outlierPreview ? (

                                <button
                                  onClick={buildOutlierTreatment}
                                  className="px-7 py-3 rounded-xl bg-[#294ba4] text-white font-semibold hover:bg-[#1f3d8e]"
                                >
                                  👁 Preview Changes
                                </button>

                              ) : null}

                            </div>

                          </div>

                        ) : (

                          <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-6">

                            <div className="flex items-center gap-4">

                              <div className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center text-2xl">
                                ✓
                              </div>

                              <div>
                                <h4 className="text-xl font-bold text-green-800">
                                  No outliers detected
                                </h4>

                                <p className="text-green-700 mt-1">
                                  No unusual numeric values were found using{" "}
                                  {outlierMethodLabel}.
                                </p>
                              </div>

                            </div>

                          </div>

                        )}

                        {outlierPreview && (
                          <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-6">

                            <div className="flex items-center justify-between gap-4">

                              <div>
                                <h4 className="text-xl font-bold text-blue-800">
                                  Preview Changes
                                </h4>

                                <p className="text-blue-700 mt-1">
                                  This preview shows the dataset after the selected
                                  treatment. Review it before applying.
                                </p>
                              </div>

                              <button
                                onClick={() =>
                                  setOutlierPreview(null)
                                }
                                className="px-4 py-2 rounded-xl bg-white border border-blue-200 text-blue-700 font-semibold"
                              >
                                Cancel Preview
                              </button>

                            </div>

                            <div className="mt-5 overflow-auto max-h-[300px] border border-blue-100 rounded-2xl bg-white">

                              <table className="min-w-full text-sm">

                                <thead className="bg-[#f5f8ff] sticky top-0">
                                  <tr>
                                    <th className="px-4 py-3 text-left">
                                      #
                                    </th>

                                    {headers.map((header) => (
                                      <th
                                        key={header}
                                        className="px-4 py-3 text-left whitespace-nowrap"
                                      >
                                        {header}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>

                                <tbody>
                                  {outlierPreview.slice(0, 50).map(
                                    (row, rowIndex) => (
                                      <tr
                                        key={rowIndex}
                                        className="border-t border-blue-50"
                                      >
                                        <td className="px-4 py-3 text-[#8ba0bd]">
                                          {rowIndex + 1}
                                        </td>

                                        {headers.map((header) => (
                                          <td
                                            key={header}
                                            className="px-4 py-3 whitespace-nowrap"
                                          >
                                            {row[header] || "Empty"}
                                          </td>
                                        ))}
                                      </tr>
                                    )
                                  )}
                                </tbody>

                              </table>

                            </div>

                            {outlierTreatment !== "review" && (
                              <div className="mt-5 flex justify-end">

                                <button
                                  onClick={applyOutlierTreatment}
                                  className="px-7 py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700"
                                >
                                  ✓ Apply These Changes
                                </button>

                              </div>
                            )}

                          </div>
                        )}

                        {outlierApplied && (
                          <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-5">

                            <div className="flex items-center gap-3">
                              <div className="w-11 h-11 rounded-xl bg-green-100 flex items-center justify-center text-xl">
                                ✓
                              </div>

                              <div>
                                <p className="font-bold text-green-800">
                                  Outlier treatment completed
                                </p>

                                <p className="text-sm text-green-700 mt-1">
                                  The dataset has been updated. You can continue
                                  cleaning or download the cleaned CSV below.
                                </p>
                              </div>
                            </div>

                          </div>
                        )}

                      </div>
                    )}

                  </div>
                )}

            {/* TEXT FORMAT */}

            {dataset.length > 0 && activeTool === "textFormat" && (
              <section className="bg-white rounded-3xl border border-blue-100 shadow-sm p-8 mb-7">
                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Text Column</label>
                    <select
                      value={textFormatColumn}
                      onChange={(event) => {
                        setTextFormatColumn(event.target.value);
                        setTextFormatResult(null);
                        setTextFormatApplied(false);
                      }}
                      className="w-full border border-blue-200 rounded-xl px-4 py-3 bg-white"
                    >
                      <option value="">Select text column</option>
                      {textColumns.map((column) => (
                        <option key={column} value={column}>{column}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Standardization</label>
                    <select
                      value={textFormatStyle}
                      onChange={(event) => {
                        setTextFormatStyle(event.target.value as TextFormatStyle);
                        setTextFormatResult(null);
                        setTextFormatApplied(false);
                      }}
                      className="w-full border border-blue-200 rounded-xl px-4 py-3 bg-white"
                    >
                      <option value="title">Title Case — Recommended</option>
                      <option value="upper">UPPERCASE</option>
                      <option value="lower">lowercase</option>
                      <option value="sentence">Sentence case</option>
                    </select>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-blue-100 bg-[#f7faff] p-5">
                  <p className="font-semibold">Multi-word values are preserved</p>
                  <p className="text-sm text-[#7087a9] mt-1">
                    For example, <b>salt lake city</b> becomes <b>Salt Lake City</b>. Text Format changes capitalization; Fix Spaces remains responsible for extra spaces.
                  </p>
                </div>

                {textFormatResult && (
                  <div className={`mt-6 rounded-2xl border p-6 ${textFormatResult.affectedCells > 0 ? "border-orange-200 bg-orange-50" : "border-green-200 bg-green-50"}`}>
                    <div className="flex items-start justify-between gap-5">
                      <div>
                        <h4 className={`text-xl font-bold ${textFormatResult.affectedCells > 0 ? "text-orange-700" : "text-green-800"}`}>
                          {textFormatResult.affectedCells > 0 ? `${textFormatResult.affectedCells} values need standardization` : "Text format is already consistent"}
                        </h4>
                        <p className="mt-1 text-sm text-[#7087a9]">
                          Column: <b>{textFormatResult.column}</b> • Style: <b>{textFormatResult.style}</b>
                        </p>
                      </div>
                      <span className="px-4 py-2 rounded-xl bg-white border border-blue-100 font-semibold">
                        {textFormatResult.affectedRows.length} rows
                      </span>
                    </div>

                    {textFormatResult.affectedCells > 0 && (
                      <div className="mt-5 overflow-auto max-h-[260px] border border-orange-100 rounded-2xl bg-white">
                        <table className="min-w-full text-sm">
                          <thead className="bg-orange-50 sticky top-0">
                            <tr>
                              <th className="px-4 py-3 text-left">Row</th>
                              <th className="px-4 py-3 text-left">Original</th>
                              <th className="px-4 py-3 text-left">Standardized</th>
                            </tr>
                          </thead>
                          <tbody>
                            {textFormatResult.affectedRows.slice(0, 50).map((rowNumber) => {
                              const original = dataset[rowNumber - 1]?.[textFormatResult.column] ?? "";
                              const standardized = textFormatResult.preview[rowNumber - 1]?.[textFormatResult.column] ?? "";
                              return (
                                <tr key={rowNumber} className="border-t border-orange-50">
                                  <td className="px-4 py-3 font-semibold">Row {rowNumber}</td>
                                  <td className="px-4 py-3">{original}</td>
                                  <td className="px-4 py-3 text-green-700 font-semibold">{standardized}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {textFormatResult.affectedCells > 0 && !textFormatApplied && (
                      <div className="mt-5 flex justify-end">
                        <button
                          onClick={applyTextFormat}
                          className="px-7 py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700"
                        >
                          ✓ Apply Text Formatting
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {textFormatApplied && (
                  <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-5">
                    <p className="font-bold text-green-800">✓ Text formatting applied successfully</p>
                    <p className="text-sm text-green-700 mt-1">The standardized values are now part of the loaded dataset.</p>
                  </div>
                )}

                {!textColumns.length && (
                  <div className="mt-6 rounded-2xl border border-orange-200 bg-orange-50 p-5 text-orange-700">
                    No text columns were detected in this dataset.
                  </div>
                )}
              </section>
            )}

            {/* FULL DATASET */}

            {dataset.length > 0 && (

              <section className="bg-white rounded-3xl border border-blue-100 shadow-sm p-8">

                <div className="flex items-center justify-between mb-5">

                  <div>

                    <h3 className="text-2xl font-bold">
                      Dataset
                    </h3>

                    <p className="text-[#8499b7] mt-1">
                      Showing all {dataset.length} rows and{" "}
                      {headers.length} columns.
                    </p>

                  </div>

                  <div className="px-4 py-2 rounded-xl bg-blue-50 text-blue-700 font-semibold">
                    {dataset.length} × {headers.length}
                  </div>

                </div>

                <div className="overflow-auto max-h-[650px] border border-blue-100 rounded-2xl">

                  <table className="min-w-full text-sm">

                    <thead className="bg-[#f5f8ff] sticky top-0 z-10">

                      <tr>

                        <th className="px-4 py-3 text-left border-b border-blue-100">
                          #
                        </th>

                        {headers.map((header) => (

                          <th
                            key={header}
                            className="px-4 py-3 text-left border-b border-blue-100 whitespace-nowrap"
                          >
                            {header}
                          </th>

                        ))}

                      </tr>

                    </thead>

                    <tbody>

                      {dataset.map((row, rowIndex) => (

                        <tr
                          key={rowIndex}
                          className="hover:bg-[#f8faff]"
                        >

                          <td className="px-4 py-3 border-b border-blue-50 text-[#8ba0bd]">
                            {rowIndex + 1}
                          </td>

                          {headers.map((header) => (

                            <td
                              key={header}
                              className="px-4 py-3 border-b border-blue-50 whitespace-nowrap"
                            >
                              {row[header] || (
                                <span className="text-red-400">
                                  Empty
                                </span>
                              )}
                            </td>

                          ))}

                        </tr>

                      ))}

                    </tbody>

                  </table>

                </div>

                {/* DOWNLOAD */}

                <div className="mt-6 flex justify-end">

                  <button
                    onClick={() =>
                      downloadCSV(
                        dataset,
                        "InsightOS_Cleaned_Dataset.csv"
                      )
                    }
                    className="px-7 py-3 rounded-xl bg-[#294ba4] text-white font-semibold hover:bg-[#1f3d8e]"
                  >
                    ⬇ Download Cleaned Dataset
                  </button>

                </div>

              </section>

            )}

          </div>

        </section>

      </div>

    </main>
  );
}
