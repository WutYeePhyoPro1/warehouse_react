import { useEffect, useMemo, useRef, useState } from "react";
import Select from "react-select";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { useStateContext } from "../../contexts/stateContext";

const pad2 = (n) => String(n).padStart(2, "0");

const ZONE_OPTIONS = Array.from({ length: 26 }, (_, i) => ({
  value: i + 1,
  label: String.fromCharCode(65 + i),
}));

const NUMBER_OPTIONS = Array.from({ length: 99 }, (_, i) => ({
  value: i + 1,
  label: pad2(i + 1),
}));

const FB_OPTIONS = [
  { value: "F", label: "F" },
  { value: "B", label: "B" },
  { value: "None", label: "None" },
];

const LOCATION_TYPE_OPTIONS = [
  { value: "TOP_MID_WALL", label: "Top stock_Middle shelve & Wall shelve" },
  { value: "PROMOTION_ZONE_GF", label: "Promotion zone,Ground floor" },
  { value: "STATIONARY_DIGITAL", label: "Stationary & Digital-Displays" },
  { value: "HARDWARE_TOOLS", label: "Hardware & Tools Displays" },
  { value: "DOOR_WINDOW", label: "Door & Window Displays" },
  { value: "PAINT_CHEMICAL", label: "Paint & Chemical-Displays" },
  { value: "STRUCTURE_DISPLAYS", label: "Structure -Displays" },
  { value: "GARDEN_ACCESSORIES", label: "Garden & Accessories - Displays" },
  { value: "SANITARY_WARE", label: "Sanitary Ware -Displays" },
  { value: "SURFACE_COVERING", label: "Surface Covering- Displays" },
  { value: "HOUSEWARE_KITCHEN", label: "Houseware & Kitchen -Displays" },
  { value: "HOME_APPLIANCE", label: "Home Appliance- Display" },
  { value: "ELECTRICAL_ACCESSORIES", label: "Electrical & Accessories Displays" },
  { value: "FURNITURE_BEDDING", label: "Furniture & Bedding" },
  { value: "OUTSIDE_STORE", label: "Outside Store- Displays" },
  { value: "RG_WAREHOUSE", label: "RG Warehouse" },
];

const EXCEL_HEADERS = [
  "Branch",
  "Location Type",
  "Zone",
  "Row",
  "Bay",
  "Size",
  "F/B",
];

const normalizeHeader = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_\-/]+/g, "");

const HEADER_ALIASES = {
  branch: "Branch",
  branchname: "Branch",
  branchcode: "Branch",
  locationtype: "Location Type",
  locationcategory: "Location Type",
  category: "Location Type",
  zone: "Zone",
  row: "Row",
  bay: "Bay",
  size: "Size",
  level: "Size",
  fb: "F/B",
  side: "F/B",
  frontback: "F/B",
  branchshortcode: "BranchShort",
  branchshortname: "BranchShort",
  branchshortc: "BranchShort",
  shortcode: "BranchShort",
  shortname: "BranchShort",
  locationcode: "LocationCode",
  locationname: "LocationCode",
  loccode: "LocationCode",
};

const cellText = (value) =>
  String(value ?? "")
    .replace(/\u00a0/g, " ")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const parseNumberField = (raw) => {
  const text = cellText(raw);
  if (!text) return null;
  const n = parseInt(text.replace(/^0+/, "") || "0", 10);
  if (!Number.isFinite(n) || n < 1 || n > 99) return null;
  return n;
};

const compactKey = (value) =>
  cellText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

const resolveBranchId = (raw, branches) => {
  const text = cellText(raw);
  if (!text) return null;
  const lower = text.toLowerCase();
  const compact = compactKey(text);

  const byName = branches.find((b) => b.name?.toLowerCase() === lower);
  if (byName) return byName.id;
  const byShort = branches.find(
    (b) => b.short_name?.toLowerCase() === lower
  );
  if (byShort) return byShort.id;
  const byCode = branches.find(
    (b) => String(b.code || "").toLowerCase() === lower
  );
  if (byCode) return byCode.id;
  const byId = branches.find((b) => String(b.id) === text);
  if (byId) return byId.id;

  const byCompactName = branches.find(
    (b) => compactKey(b.name) === compact && compact.length >= 3
  );
  if (byCompactName) return byCompactName.id;

  const nameMatches = branches.filter((b) =>
    compactKey(b.name).includes(compact)
  );
  if (compact.length >= 4 && nameMatches.length === 1) {
    return nameMatches[0].id;
  }
  return null;
};

const resolveLocationType = (raw) => {
  const text = cellText(raw);
  if (!text) return null;
  const lower = text.toLowerCase();
  const compact = lower.replace(/&/g, "and").replace(/[^a-z0-9]+/g, "");
  if (compact.length < 2) return null;

  const byValue = LOCATION_TYPE_OPTIONS.find(
    (opt) => opt.value.toLowerCase() === lower
  );
  if (byValue) return byValue.value;

  const byLabel = LOCATION_TYPE_OPTIONS.find(
    (opt) => opt.label.toLowerCase() === lower
  );
  if (byLabel) return byLabel.value;

  const byCompact = LOCATION_TYPE_OPTIONS.find(
    (opt) =>
      opt.label.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "") ===
      compact
  );
  return byCompact?.value ?? null;
};

const resolveZoneId = (raw) => {
  const text = cellText(raw).toUpperCase();
  if (!text) return null;
  if (/^[A-Z]$/.test(text)) {
    return text.charCodeAt(0) - 64;
  }
  if (/^[A-Z]{2,6}$/.test(text)) {
    return text;
  }
  const n = parseInt(text, 10);
  if (Number.isFinite(n) && n >= 1 && n <= 26) return n;
  return null;
};

const isNoneSide = (side) => !side || side === "None" || side === "Natural";

const resolveSide = (raw) => {
  const text = cellText(raw);
  if (!text) return "None";
  const lower = text.toLowerCase().replace(/[^a-z]/g, "");
  if (!lower) return "None";
  if (["f", "front", "fr"].includes(lower)) return "F";
  if (["b", "back", "bk"].includes(lower)) return "B";
  if (["n", "none", "natural"].includes(lower)) return "None";
  if (lower.startsWith("front")) return "F";
  if (lower.startsWith("back")) return "B";
  if (lower.startsWith("none") || lower.startsWith("natural")) return "None";
  if (lower.startsWith("f")) return "F";
  if (lower.startsWith("b")) return "B";
  if (lower.startsWith("n")) return "None";
  return FB_OPTIONS.find((opt) => opt.value.toLowerCase() === lower)?.value ?? "";
};

const isBlankLine = (line) =>
  !line.zone_id &&
  !line.row_id &&
  !line.bay_id &&
  !line.level_id &&
  isNoneSide(line.side);

const emptyLine = (branchId = null) => ({
  key: `${Date.now()}-${Math.random()}`,
  branch_id: branchId,
  location_category: "RG_WAREHOUSE",
  zone_id: null,
  row_id: null,
  bay_id: null,
  level_id: null,
  side: "None",
  excel_short_name: null,
  excel_location_code: null,
});

const getOptionLabel = (options, value) =>
  options.find((opt) => opt.value === value)?.label ?? "?";

const buildPreviewCode = (line, branches) => {
  if (line.excel_location_code) {
    return line.excel_location_code;
  }

  const branch = branches.find(
    (b) => String(b.id) === String(line.branch_id)
  );
  const short =
    cellText(line.excel_short_name).toUpperCase() ||
    branch?.short_name ||
    "?";
  const letter = line.location_category === "RG_WAREHOUSE" ? "W" : "S";
  const zone = typeof line.zone_id === "string"
    ? line.zone_id
    : line.zone_id
      ? getOptionLabel(ZONE_OPTIONS, line.zone_id)
      : "?";
  const row = line.row_id ? getOptionLabel(NUMBER_OPTIONS, line.row_id) : "?";
  const bay = line.bay_id ? getOptionLabel(NUMBER_OPTIONS, line.bay_id) : "?";
  const size = line.level_id ? getOptionLabel(NUMBER_OPTIONS, line.level_id) : "?";

  if (isNoneSide(line.side) || (letter === "W" && !line.side)) {
    return `${short}${letter}_${zone}_${row}_${bay}_${size}`;
  }

  const side = line.side || "?";
  return `${short}${letter}_${zone}_${row}_${side}_${bay}_${size}`;
};

const formatSaveError = (json) => {
  const raw = json?.message;
  if (!raw) return "Failed to submit location request.";
  if (typeof raw === "object") {
    const first = Object.values(raw).flat().find(Boolean);
    return String(first || "Failed to submit location request.");
  }
  const text = String(raw);
  if (
    text.includes("SQLSTATE") ||
    text.includes("duplicate key") ||
    text.toLowerCase().includes("unique violation")
  ) {
    return "Failed to save location request. Please try again.";
  }
  return text;
};

const SelectField = ({
  label,
  options,
  value,
  onChange,
  isLoading,
  hasError,
  className = "",
  compact = false,
}) => (
  <div className={`w-full ${className}`}>
    {label && !compact && (
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
    )}
    <Select
      options={options}
      value={
        options.find((opt) => String(opt.value) === String(value)) || null
      }
      onChange={(selected) => onChange(selected?.value ?? null)}
      isLoading={isLoading}
      menuPortalTarget={typeof document !== "undefined" ? document.body : null}
      menuPosition="fixed"
      classNamePrefix="react-select"
      styles={{
        control: (base) => ({
          ...base,
          minHeight: compact ? 32 : 38,
          height: compact ? 32 : undefined,
          borderColor: hasError ? "#ef4444" : base.borderColor,
          backgroundColor: hasError ? "#fef2f2" : base.backgroundColor,
          fontSize: compact ? 12 : 14,
        }),
        valueContainer: (base) => ({
          ...base,
          padding: compact ? "0 6px" : base.padding,
        }),
        indicatorsContainer: (base) => ({
          ...base,
          height: compact ? 30 : base.height,
        }),
        dropdownIndicator: (base) => ({
          ...base,
          padding: compact ? 4 : base.padding,
        }),
        clearIndicator: (base) => ({
          ...base,
          padding: compact ? 4 : base.padding,
        }),
        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
      }}
    />
  </div>
);

export default function AddLocation() {
  const navigate = useNavigate();
  const { user } = useStateContext();
  const activeBranchId = user?.user?.branch_id;

  const [branches, setBranches] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(true);
  const [lines, setLines] = useState([emptyLine(activeBranchId)]);
  const [selectedKeys, setSelectedKeys] = useState(() => new Set());
  const [loading, setLoading] = useState(false);
  const [lineErrors, setLineErrors] = useState({});
  const [saveProgress, setSaveProgress] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchBranches = async () => {
      setLoadingBranches(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/branches", {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const list = json.data || [];
        setBranches(list);

        if (activeBranchId && list.some((b) => b.id === activeBranchId)) {
          setLines((prev) =>
            prev.map((line, idx) =>
              idx === 0 ? { ...line, branch_id: activeBranchId } : line
            )
          );
        } else if (list.length === 1) {
          setLines((prev) =>
            prev.map((line, idx) =>
              idx === 0 ? { ...line, branch_id: list[0].id } : line
            )
          );
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load branches.");
      } finally {
        setLoadingBranches(false);
      }
    };

    fetchBranches();
  }, [activeBranchId]);

  const formattedBranches = useMemo(
    () =>
      (branches || []).map((item) => ({
        value: item.id,
        label: item.name,
      })),
    [branches]
  );

  const zoneSelectOptions = useMemo(() => {
    const extras = [];
    const seen = new Set(ZONE_OPTIONS.map((opt) => String(opt.value)));
    lines.forEach((line) => {
      if (typeof line.zone_id === "string" && !seen.has(line.zone_id)) {
        seen.add(line.zone_id);
        extras.push({ value: line.zone_id, label: line.zone_id });
      }
    });
    return [...ZONE_OPTIONS, ...extras];
  }, [lines]);

  const docPreview = useMemo(() => {
    const branch = branches.find((b) => b.id === activeBranchId) || branches[0];
    const short = branch?.short_name || "???";
    const date = new Date();
    const ymd = `${date.getFullYear()}${pad2(date.getMonth() + 1)}${pad2(
      date.getDate()
    )}`;
    return `LR${short}${ymd}-????`;
  }, [branches, activeBranchId]);

  const updateLine = (key, patch) => {
    setLines((prev) =>
      prev.map((line) => {
        if (line.key !== key) return line;
        const next = { ...line, ...patch };
        if (
          patch.branch_id !== undefined ||
          patch.zone_id !== undefined ||
          patch.row_id !== undefined ||
          patch.bay_id !== undefined ||
          patch.level_id !== undefined ||
          patch.side !== undefined ||
          patch.location_category !== undefined
        ) {
          next.excel_location_code = null;
        }
        if (patch.branch_id !== undefined) {
          next.excel_short_name = null;
        }
        return next;
      })
    );
    setLineErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const addLine = () => {
    setLines((prev) => [...prev, emptyLine(activeBranchId)]);
  };

  const removeLine = (key) => {
    setLines((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((l) => l.key !== key);
    });
    setSelectedKeys((prev) => {
      if (!prev.has(key)) return prev;
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  };

  const allSelected =
    lines.length > 0 && lines.every((line) => selectedKeys.has(line.key));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedKeys(new Set());
      return;
    }
    setSelectedKeys(new Set(lines.map((line) => line.key)));
  };

  const toggleSelectOne = (key) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const removeSelectedLines = () => {
    if (selectedKeys.size === 0) {
      toast.error("Select at least one line.");
      return;
    }
    setLines((prev) => {
      const remaining = prev.filter((line) => !selectedKeys.has(line.key));
      return remaining.length > 0
        ? remaining
        : [emptyLine(activeBranchId)];
    });
    setSelectedKeys(new Set());
    setLineErrors({});
  };

  const downloadExcelTemplate = () => {
    const sampleBranch =
      branches.find((b) => b.id === activeBranchId)?.short_name ||
      branches[0]?.short_name ||
      "LAN";
    const rows = [
      EXCEL_HEADERS,
      [sampleBranch, "RG Warehouse", "A", "01", "01", "01", "None"],
      [sampleBranch, "Top stock_Middle shelve & Wall shelve", "B", "02", "03", "01", "F"],
    ];
    const sheet = XLSX.utils.aoa_to_sheet(rows);
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, "Locations");
    XLSX.writeFile(book, "location_request_template.xlsx");
  };

  const mapExcelRowsToLines = (rows) => {
    if (!rows?.length) {
      throw new Error("Excel file is empty.");
    }

    const headerRow = rows[0] || [];
    const colIndex = {};
    headerRow.forEach((header, idx) => {
      const key = HEADER_ALIASES[normalizeHeader(header)];
      if (key && colIndex[key] === undefined) colIndex[key] = idx;
    });

    const missing = EXCEL_HEADERS.filter((h) => colIndex[h] === undefined);
    if (missing.length) {
      throw new Error(
        `Missing columns: ${missing.join(", ")}. Use Download Template.`
      );
    }

    const imported = [];
    const warnings = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i] || [];
      const excelRow = i + 1;
      const allEmpty = EXCEL_HEADERS.every(
        (h) => !cellText(row[colIndex[h]])
      );
      if (allEmpty) continue;

      const branchRaw = row[colIndex.Branch];
      const branchShortRaw =
        colIndex.BranchShort !== undefined ? row[colIndex.BranchShort] : "";
      const typeRaw = row[colIndex["Location Type"]];
      const zoneRaw = row[colIndex.Zone];
      const rowRaw = row[colIndex.Row];
      const bayRaw = row[colIndex.Bay];
      const sizeRaw = row[colIndex.Size];
      const fbRaw = row[colIndex["F/B"]];
      const locationCodeRaw =
        colIndex.LocationCode !== undefined ? row[colIndex.LocationCode] : "";
      const excelShortName = cellText(branchShortRaw).toUpperCase() || null;
      const excelLocationCode = cellText(locationCodeRaw).toUpperCase() || null;

      const excelBranch = cellText(branchRaw) || cellText(branchShortRaw);
      const branch_id = excelBranch
        ? resolveBranchId(branchRaw, branches) ||
          resolveBranchId(branchShortRaw, branches)
        : activeBranchId || null;
      const location_category =
        resolveLocationType(typeRaw) || "RG_WAREHOUSE";
      const zone_id = resolveZoneId(zoneRaw);
      const row_id = parseNumberField(rowRaw);
      const bay_id = parseNumberField(bayRaw);
      const level_id = parseNumberField(sizeRaw);
      const side = resolveSide(fbRaw);

      const fieldErrors = [];
      if (!branch_id) fieldErrors.push("branch");
      if (!location_category) fieldErrors.push("type");
      if (!zone_id) fieldErrors.push("zone");
      if (!row_id) fieldErrors.push("row");
      if (!bay_id) fieldErrors.push("bay");
      if (!level_id) fieldErrors.push("size");
      const isSale = location_category !== "RG_WAREHOUSE";
      if (isSale && !side) fieldErrors.push("fb");

      if (
        excelBranch &&
        !resolveBranchId(branchRaw, branches) &&
        !resolveBranchId(branchShortRaw, branches)
      ) {
        warnings.push(`Row ${excelRow}: unknown branch "${excelBranch}"`);
      }
      if (cellText(typeRaw) && !resolveLocationType(typeRaw)) {
        warnings.push(
          `Row ${excelRow}: unknown location type "${cellText(typeRaw)}"`
        );
      }
      if (cellText(zoneRaw) && !zone_id) {
        warnings.push(`Row ${excelRow}: invalid Zone "${cellText(zoneRaw)}"`);
      }
      if (cellText(rowRaw) && !row_id) {
        warnings.push(`Row ${excelRow}: invalid Row "${cellText(rowRaw)}"`);
      }
      if (cellText(bayRaw) && !bay_id) {
        warnings.push(`Row ${excelRow}: invalid Bay "${cellText(bayRaw)}"`);
      }
      if (cellText(sizeRaw) && !level_id) {
        warnings.push(`Row ${excelRow}: invalid Size "${cellText(sizeRaw)}"`);
      }
      if (cellText(fbRaw) && !side) {
        warnings.push(`Row ${excelRow}: invalid F/B "${cellText(fbRaw)}"`);
      }

      imported.push({
        key: `import-${Date.now()}-${excelRow}-${Math.random()}`,
        branch_id,
        location_category,
        zone_id,
        row_id,
        bay_id,
        level_id,
        side,
        excel_short_name: excelShortName,
        excel_location_code: excelLocationCode,
        fieldErrors,
      });
    }

    if (!imported.length) {
      throw new Error("No data rows found in Excel.");
    }

    return { imported, warnings };
  };

  const handleExcelImport = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) throw new Error("No sheet found in Excel file.");
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        defval: "",
        raw: false,
      });

      const { imported, warnings } = mapExcelRowsToLines(rows);
      const nextErrors = {};
      const cleaned = imported.map((line) => {
        const { fieldErrors, ...rest } = line;
        if (fieldErrors?.length) nextErrors[rest.key] = fieldErrors;
        return rest;
      });

      setLines((prev) => {
        const onlyBlank =
          prev.length === 1 && isBlankLine(prev[0]);
        return onlyBlank ? cleaned : [...prev, ...cleaned];
      });
      setSelectedKeys(new Set());
      setLineErrors(nextErrors);

      toast.success(`Imported ${cleaned.length} line(s) from Excel.`);
      if (warnings.length) {
        toast.error(
          `${warnings.length} field(s) could not be read from Excel. Fill the highlighted cells (Zone: A–Z, F/B: F, B, or None).`
        );
        console.warn("Excel import warnings:", warnings);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to import Excel.");
    }
  };

  const validateLines = () => {
    const errors = {};
    lines.forEach((line) => {
      const missing = [];
      if (!line.branch_id) missing.push("branch");
      if (!line.location_category) missing.push("type");
      if (!line.zone_id) missing.push("zone");
      if (!line.row_id) missing.push("row");
      if (!line.bay_id) missing.push("bay");
      if (!line.level_id) missing.push("size");
      const isSale = line.location_category !== "RG_WAREHOUSE";
      if (isSale && !line.side) missing.push("fb");
      if (missing.length) errors[line.key] = missing;
    });
    setLineErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const buildSaveSteps = (lineCount) => [
    { id: "validate", label: "Validate form fields" },
    { id: "duplicates", label: "Check duplicate location codes" },
    { id: "document", label: "Create document number" },
    {
      id: "lines",
      label: `Save ${lineCount} location line${lineCount === 1 ? "" : "s"}`,
    },
    { id: "notify", label: "Notify approver" },
    { id: "done", label: "Complete" },
  ];

  const openSaveProgress = (lineCount) => {
    setSaveProgress({
      steps: buildSaveSteps(lineCount).map((step, index) => ({
        ...step,
        status: index === 0 ? "done" : index === 1 ? "active" : "pending",
      })),
      error: null,
      documentNumber: null,
    });
  };

  const completeAllSteps = (documentNumber) => {
    setSaveProgress((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        documentNumber,
        error: null,
        steps: prev.steps.map((step) => ({ ...step, status: "done" })),
      };
    });
  };

  const resolveFailedStep = (json) => {
    const message = String(json?.message || "").toLowerCase();
    if (
      json?.duplicate_in ||
      message.includes("already exists") ||
      message.includes("duplicate location")
    ) {
      return "duplicates";
    }
    if (json?.errors || message.includes("required") || message.includes("invalid")) {
      return "validate";
    }
    if (message.includes("document number") || message.includes("create document")) {
      return "document";
    }
    if (message.includes("notify") || message.includes("approver")) {
      return "notify";
    }
    return "lines";
  };

  const failSaveProgress = (message, stepId) => {
    setSaveProgress((prev) => {
      if (!prev) return prev;
      const targetIndex = prev.steps.findIndex((step) => step.id === stepId);
      const failIndex =
        targetIndex >= 0
          ? targetIndex
          : Math.max(
              0,
              prev.steps.findIndex((step) => step.status === "active")
            );
      return {
        ...prev,
        error: message,
        steps: prev.steps.map((step, index) => {
          if (index < failIndex) return { ...step, status: "done" };
          if (index === failIndex) return { ...step, status: "error" };
          return { ...step, status: "pending" };
        }),
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateLines()) {
      toast.error("Please complete all highlighted fields.");
      return;
    }

    const payload = {
      lines: lines.map((line) => ({
        branch_id: line.branch_id,
        location_category: line.location_category,
        zone_id: line.zone_id,
        row_id: line.row_id,
        bay_id: line.bay_id,
        level_id: line.level_id,
        location_type: line.location_category === "RG_WAREHOUSE" ? "W" : "S",
        side: isNoneSide(line.side) ? "None" : line.side,
        zone_id: typeof line.zone_id === "number" ? line.zone_id : undefined,
        zone:
          typeof line.zone_id === "string"
            ? line.zone_id
            : getOptionLabel(ZONE_OPTIONS, line.zone_id),
        location_name: buildPreviewCode(line, branches),
        branch_short_name: line.excel_short_name || undefined,
      })),
    };

    setLoading(true);
    openSaveProgress(lines.length);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/location-request-documents", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!res.ok) {
        const errorMessage = formatSaveError(json);
        failSaveProgress(errorMessage, resolveFailedStep(json));
        if (json.line) {
          const failedLine = lines[json.line - 1];
          if (failedLine) {
            setLineErrors((prev) => ({
              ...prev,
              [failedLine.key]: ["duplicate"],
            }));
          }
        }
        toast.error(errorMessage);
        return;
      }

      const documentNumber = json.data?.document_number || "document";
      completeAllSteps(documentNumber);
      toast.success(`Submitted ${documentNumber} successfully.`);
      setTimeout(() => navigate("/location_requests"), 900);
    } catch (err) {
      console.error(err);
      failSaveProgress("Failed to submit location request.", "lines");
      toast.error("Failed to submit location request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="md:bg-gray-200 md:p-[12px]">
      <div className="space-y-4 pb-4 md:w-[98%] md:m-auto border border-[#107a8b] shadow rounded-2xl bg-[#107a8b]">
        <div className="h-12 flex items-center justify-between rounded px-4">
          <button
            type="button"
            onClick={() => navigate("/location_requests")}
            className="text-white hover:opacity-90 flex items-center gap-2"
          >
            <span className="text-xl leading-none">&larr;</span>
            <span className="font-semibold text-sm">Back</span>
          </button>
          <h2 className="text-lg font-bold text-white">Add Location Request</h2>
          <div className="w-14" />
        </div>

        <div className="bg-white w-full p-3 md:p-4 rounded-t-2xl space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-3 rounded-lg border border-[#107a8b]/30 bg-[#f0f9fa] px-3 py-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#107a8b]">
                Document No (auto)
              </p>
              <p className="font-mono text-base font-bold text-[#107a8b]">
                {docPreview}
              </p>
              <p className="text-[11px] text-gray-500">
                Final number on save · LR{"{Short}"}
                {"{YYYYMMDD}"}-0001
              </p>
            </div>
            <p className="text-sm font-semibold text-gray-700">
              Lines: {lines.length}
              {selectedKeys.size > 0 ? ` · Selected: ${selectedKeys.size}` : ""}
            </p>
          </div>

          <div className="overflow-auto max-h-[65vh] rounded-xl border border-gray-200">
            <table className="min-w-[1140px] w-full text-xs border-collapse">
              <thead className="sticky top-0 z-10 bg-[#107a8b] text-white">
                <tr>
                  <th className="px-2 py-2 text-center w-10">
                    <input
                      type="checkbox"
                      className="accent-white w-4 h-4 cursor-pointer"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      title="Select all"
                    />
                  </th>
                  <th className="px-2 py-2 text-left w-10">#</th>
                  <th className="px-2 py-2 text-left min-w-[140px]">Branch</th>
                  <th className="px-2 py-2 text-left min-w-[180px]">Location Type</th>
                  <th className="px-2 py-2 text-left min-w-[90px]">Zone</th>
                  <th className="px-2 py-2 text-left min-w-[90px]">Row</th>
                  <th className="px-2 py-2 text-left min-w-[90px]">Bay</th>
                  <th className="px-2 py-2 text-left min-w-[90px]">Size</th>
                  <th className="px-2 py-2 text-left min-w-[100px]">F/B</th>
                  <th className="px-2 py-2 text-left min-w-[180px]">Preview</th>
                  <th className="px-2 py-2 text-center w-16">Del</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, index) => {
                  const errors = new Set(lineErrors[line.key] || []);
                  const preview = buildPreviewCode(line, branches);
                  const checked = selectedKeys.has(line.key);
                  return (
                    <tr
                      key={line.key}
                      className={`border-b border-gray-100 ${
                        errors.has("duplicate")
                          ? "bg-red-50"
                          : checked
                            ? "bg-[#e8f6f8]"
                            : index % 2 === 0
                              ? "bg-white"
                              : "bg-slate-50"
                      }`}
                    >
                      <td className="px-2 py-1.5 text-center align-middle">
                        <input
                          type="checkbox"
                          className="accent-[#107a8b] w-4 h-4 cursor-pointer"
                          checked={checked}
                          onChange={() => toggleSelectOne(line.key)}
                        />
                      </td>
                      <td className="px-2 py-1.5 font-semibold text-gray-600 align-middle">
                        {index + 1}
                      </td>
                      <td className="px-1 py-1 align-middle">
                        <SelectField
                          compact
                          options={formattedBranches}
                          value={line.branch_id}
                          onChange={(val) =>
                            updateLine(line.key, { branch_id: val })
                          }
                          isLoading={loadingBranches}
                          hasError={errors.has("branch")}
                        />
                      </td>
                      <td className="px-1 py-1 align-middle">
                        <SelectField
                          compact
                          options={LOCATION_TYPE_OPTIONS}
                          value={line.location_category}
                          onChange={(val) =>
                            updateLine(line.key, { location_category: val })
                          }
                          hasError={errors.has("type")}
                        />
                      </td>
                      <td className="px-1 py-1 align-middle">
                        <SelectField
                          compact
                          options={zoneSelectOptions}
                          value={line.zone_id}
                          onChange={(val) =>
                            updateLine(line.key, { zone_id: val })
                          }
                          hasError={errors.has("zone")}
                        />
                      </td>
                      <td className="px-1 py-1 align-middle">
                        <SelectField
                          compact
                          options={NUMBER_OPTIONS}
                          value={line.row_id}
                          onChange={(val) =>
                            updateLine(line.key, { row_id: val })
                          }
                          hasError={errors.has("row")}
                        />
                      </td>
                      <td className="px-1 py-1 align-middle">
                        <SelectField
                          compact
                          options={NUMBER_OPTIONS}
                          value={line.bay_id}
                          onChange={(val) =>
                            updateLine(line.key, { bay_id: val })
                          }
                          hasError={errors.has("bay")}
                        />
                      </td>
                      <td className="px-1 py-1 align-middle">
                        <SelectField
                          compact
                          options={NUMBER_OPTIONS}
                          value={line.level_id}
                          onChange={(val) =>
                            updateLine(line.key, { level_id: val })
                          }
                          hasError={errors.has("size")}
                        />
                      </td>
                      <td className="px-1 py-1 align-middle">
                        <SelectField
                          compact
                          options={FB_OPTIONS}
                          value={line.side}
                          onChange={(val) =>
                            updateLine(line.key, { side: val })
                          }
                          hasError={errors.has("fb")}
                        />
                      </td>
                      <td className="px-2 py-1.5 align-middle">
                        <span
                          className={`font-mono text-[11px] font-bold break-all ${
                            preview.includes("?")
                              ? "text-red-500"
                              : "text-[#107a8b]"
                          }`}
                        >
                          {preview}
                        </span>
                      </td>
                      <td className="px-2 py-1.5 text-center align-middle">
                        <button
                          type="button"
                          onClick={() => removeLine(line.key)}
                          disabled={lines.length <= 1}
                          className="text-red-600 hover:underline disabled:opacity-30 disabled:no-underline"
                          title="Remove line"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm">
            <div className="flex flex-wrap gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleExcelImport}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={loadingBranches}
                className="rounded-lg border border-[#107a8b] bg-[#107a8b] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#0d6e7b] disabled:opacity-50"
              >
                Import Excel
              </button>
              <button
                type="button"
                onClick={downloadExcelTemplate}
                className="rounded-lg border border-[#107a8b] px-3 py-1.5 text-sm font-semibold text-[#107a8b] hover:bg-[#f0f9fa]"
              >
                Download Template
              </button>
              <button
                type="button"
                onClick={addLine}
                className="rounded-lg border border-[#107a8b] px-3 py-1.5 text-sm font-semibold text-[#107a8b] hover:bg-[#f0f9fa]"
              >
                + Add Line
              </button>
              <button
                type="button"
                onClick={removeSelectedLines}
                disabled={selectedKeys.size === 0}
                className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-40"
              >
                Delete Selected ({selectedKeys.size})
              </button>
            </div>
            <button
              type="submit"
              disabled={loading || loadingBranches}
              className="rounded-md bg-[#107a8b] px-5 py-2 text-sm font-semibold text-white hover:bg-[#0d6e7b] disabled:opacity-50"
            >
              {loading ? "Saving…" : `Save Document (${lines.length})`}
            </button>
          </div>
        </div>
      </div>

      {saveProgress && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="border-b border-gray-100 px-5 py-4">
              <h3 className="text-base font-bold text-[#107a8b]">
                Saving location request
              </h3>
              <p className="mt-0.5 text-xs text-gray-500">
                Please wait while each step completes.
              </p>
            </div>

            <ul className="space-y-2.5 px-5 py-4">
              {saveProgress.steps.map((step) => {
                const isDone = step.status === "done";
                const isActive = step.status === "active";
                const isError = step.status === "error";
                return (
                  <li key={step.id} className="flex items-center gap-3 text-sm">
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                        isDone
                          ? "bg-emerald-500 text-white"
                          : isError
                            ? "bg-red-500 text-white"
                            : isActive
                              ? "bg-[#107a8b] text-white"
                              : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      {isDone ? (
                        "✓"
                      ) : isError ? (
                        "!"
                      ) : isActive ? (
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      ) : (
                        "·"
                      )}
                    </span>
                    <span
                      className={
                        isDone
                          ? "font-medium text-emerald-700"
                          : isError
                            ? "font-semibold text-red-600"
                            : isActive
                              ? "font-semibold text-[#107a8b]"
                              : "text-gray-400"
                      }
                    >
                      {step.label}
                      {isActive ? "…" : ""}
                    </span>
                  </li>
                );
              })}
            </ul>

            {saveProgress.documentNumber && !saveProgress.error && (
              <p className="px-5 pb-2 text-sm font-semibold text-emerald-700">
                Document: {saveProgress.documentNumber}
              </p>
            )}

            {saveProgress.error && (
              <div className="mx-5 mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {saveProgress.error}
              </div>
            )}

            {(saveProgress.error || saveProgress.documentNumber) && (
              <div className="flex justify-end border-t border-gray-100 px-5 py-3">
                <button
                  type="button"
                  onClick={() => {
                    if (saveProgress.documentNumber && !saveProgress.error) {
                      navigate("/location_requests");
                      return;
                    }
                    setSaveProgress(null);
                  }}
                  className="rounded-md bg-[#107a8b] px-4 py-1.5 text-sm font-semibold text-white hover:bg-[#0d6e7b]"
                >
                  {saveProgress.error ? "Close" : "Continue"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </form>
  );
}
