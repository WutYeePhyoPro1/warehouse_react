import { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useStateContext } from "../../contexts/stateContext";

const pad2 = (n) => String(n).padStart(2, "0");

// Match seeded master IDs (zones A–Z, rows/bays/levels 01–99)
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
  { value: "Natural", label: "Natural" },
];

const LOCATION_TYPE_OPTIONS = [
  {
    value: "TOP_MID_WALL",
    label: "Top stock_Middle shelve & Wall shelve",
  },
  {
    value: "PROMOTION_ZONE_GF",
    label: "Promotion zone,Ground floor",
  },
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
  {
    value: "ELECTRICAL_ACCESSORIES",
    label: "Electrical & Accessories Displays",
  },
  { value: "FURNITURE_BEDDING", label: "Furniture & Bedding" },
  { value: "OUTSIDE_STORE", label: "Outside Store- Displays" },
  { value: "RG_WAREHOUSE", label: "RG Warehouse" },
];

export default function AddLocation() {
  const navigate = useNavigate();
  const { user } = useStateContext();

  const branchId = user?.user?.branch_id;

  const [branches, setBranches] = useState([]);
  const [branch, setBranch] = useState(branchId ?? null);
  const [loadingBranches, setLoadingBranches] = useState(true);

  const [locationType, setLocationType] = useState("RG_WAREHOUSE");
  const [fb, setFb] = useState("");

  const [zone, setZone] = useState(null);
  const [row, setRow] = useState(null);
  const [bay, setBay] = useState(null);
  const [size, setSize] = useState(null);

  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState(new Set());
  const [duplicateInfo, setDuplicateInfo] = useState(null);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);

  const clearFieldError = (field) => {
    setFieldErrors((prev) => {
      if (!prev.has(field)) return prev;
      const next = new Set(prev);
      next.delete(field);
      return next;
    });
  };

  const scrollToFirstError = (missing) => {
    const order = ["branch", "zone", "row", "bay", "size", "fb"];
    const first = order.find((field) => missing.has(field));
    if (first) {
      document
        .getElementById(`field-${first}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  // Light endpoint — branches + shortcut only (no 300+ master rows)
  useEffect(() => {
    const fetchBranches = async () => {
      setLoadingBranches(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/user-branch", {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const list = json.data || [];

        setBranches(list);

        const activeId = branchId ?? null;
        if (activeId && list.some((b) => b.id === activeId)) {
          setBranch(activeId);
        } else if (list.length === 1) {
          setBranch(list[0].id);
        }
      } catch (err) {
        console.error("Failed to load branches:", err);
        toast.error("Failed to load branches.");
      } finally {
        setLoadingBranches(false);
      }
    };

    fetchBranches();
  }, [branchId]);

  const formattedBranches = useMemo(
    () =>
      (branches || []).map((item) => ({
        value: item.id,
        label: item.name,
      })),
    [branches]
  );

  const branchShortcut = useMemo(() => {
    const found = (branches || []).find((b) => b.id === branch);
    return found?.short_name || "";
  }, [branches, branch]);

  const mappedLocationType =
    locationType === "RG_WAREHOUSE" ? "W" : "S";

  const locationTypeLetter = mappedLocationType;

  const getMissingFields = () => {
    const missing = new Set();
    if (!branch) missing.add("branch");
    if (!zone) missing.add("zone");
    if (!row) missing.add("row");
    if (!bay) missing.add("bay");
    if (!size) missing.add("size");
    if (mappedLocationType === "S" && !fb) missing.add("fb");
    return missing;
  };

  const getOptionLabel = (options, value) =>
    options.find((opt) => opt.value === value)?.label ?? "?";

  const locationCodePreview = useMemo(() => {
    const prefix = branchShortcut
      ? `${branchShortcut}${locationTypeLetter}`
      : `?${locationTypeLetter}`;

    const zoneLabel = zone ? getOptionLabel(ZONE_OPTIONS, zone) : "?";
    const rowLabel = row ? getOptionLabel(NUMBER_OPTIONS, row) : "?";
    const bayLabel = bay ? getOptionLabel(NUMBER_OPTIONS, bay) : "?";
    const sizeLabel = size ? getOptionLabel(NUMBER_OPTIONS, size) : "?";

    // Natural = no F/B segment in location code
    if (fb === "Natural") {
      return `${prefix}_${zoneLabel}_${rowLabel}_${bayLabel}_${sizeLabel}`;
    }

    const sideLabel = fb || "?";
    return `${prefix}_${zoneLabel}_${rowLabel}_${sideLabel}_${bayLabel}_${sizeLabel}`;
  }, [
    branchShortcut,
    locationTypeLetter,
    zone,
    row,
    bay,
    size,
    fb,
  ]);

  const isPreviewComplete = !locationCodePreview.includes("?");

  useEffect(() => {
    if (!isPreviewComplete) {
      setDuplicateInfo(null);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setCheckingDuplicate(true);
      try {
        const token = localStorage.getItem("token");
        const params = new URLSearchParams({
          location_name: locationCodePreview,
        });
        const res = await fetch(`/api/location-check?${params.toString()}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          signal: controller.signal,
        });

        if (!res.ok) return;
        const json = await res.json();
        setDuplicateInfo(json.exists ? json : null);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Failed to check duplicate location:", err);
        }
      } finally {
        setCheckingDuplicate(false);
      }
    }, 400);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [locationCodePreview, isPreviewComplete]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const missing = getMissingFields();
    if (missing.size > 0) {
      setFieldErrors(missing);
      scrollToFirstError(missing);
      toast.error("Please fill in the highlighted fields.");
      return;
    }

    setFieldErrors(new Set());

    if (duplicateInfo?.exists) {
      toast.error(
        duplicateInfo.in_locations
          ? "This location code already exists in locations."
          : "A pending request for this location code already exists."
      );
      return;
    }

    const payload = {
      branch_id: branch,
      location_category: locationType,
      zone_id: zone,
      row_id: row,
      bay_id: bay,
      level_id: size,
      location_type: mappedLocationType,
      ...(fb ? { side: fb } : {}),
    };

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/location-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message =
          typeof result?.message === "string"
            ? result.message
            : result?.message
              ? JSON.stringify(result.message)
              : "Failed to submit location request.";
        toast.error(message);
        return;
      }

      toast.success("Location request submitted!");
      navigate("/location_requests");
    } catch (err) {
      console.error("Request error:", err);
      toast.error("An error occurred while saving location.");
    } finally {
      setLoading(false);
    }
  };

  const SelectField = ({
    label,
    options,
    value,
    onChange,
    inputId,
    isLoading = false,
    hasError = false,
  }) => (
    <div className="w-full" id={`field-${inputId}`}>
      <label
        htmlFor={inputId}
        className={`block text-sm font-medium ${hasError ? "text-red-600" : "text-gray-900"}`}
      >
        {label}
        {hasError && <span className="ml-1 text-red-500">*</span>}
      </label>
      <div className="mt-2">
        <Select
          inputId={inputId}
          options={options}
          isLoading={isLoading}
          value={options.find((opt) => opt.value === value) || null}
          onChange={(selected) => onChange(selected?.value || null)}
          styles={{
            control: (base, state) => ({
              ...base,
              borderColor: hasError ? "#dc3545" : state.isFocused ? "#107a8b" : base.borderColor,
              boxShadow: hasError
                ? "0 0 0 1px #dc3545"
                : state.isFocused
                  ? "0 0 0 1px #107a8b"
                  : base.boxShadow,
              "&:hover": {
                borderColor: hasError ? "#dc3545" : "#107a8b",
              },
            }),
          }}
        />
      </div>
      {hasError && (
        <p className="mt-1 text-xs text-red-600">This field is required.</p>
      )}
    </div>
  );

  const renderPreviewPart = (part, index) =>
    part === "?" ? (
      <span key={index} className="text-red-500">
        ?
      </span>
    ) : (
      <span key={index}>{part}</span>
    );

  return (
    <form onSubmit={handleSubmit} className="md:bg-gray-200 md:p-[20px]">
      <div className="space-y-12 pb-0 md:w-[75%] md:m-auto border-1 border-[#107a8b] shadow rounded-3xl bg-[#107a8b]">
        <div className="md:h-15 h-10 flex items-center justify-between rounded px-6">
          <button
            type="button"
            onClick={() => navigate("/locations")}
            className="text-white hover:opacity-90 flex items-center gap-2"
          >
            <span className="text-xl leading-none">&larr;</span>
            <span className="font-semibold">Back</span>
          </button>

          <h2 className="text-2xl font-bold text-white mt-10 pr-4">
            Add Location
          </h2>
        </div>

        <div className="border-b border-gray-900/10 pb-12 bg-white w-full p-10 rounded-t-4xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-8">
            <SelectField
              label="Location Type"
              inputId="location_type"
              options={LOCATION_TYPE_OPTIONS}
              value={locationType}
              onChange={setLocationType}
            />

            <SelectField
              label="Branch"
              inputId="branch"
              options={formattedBranches}
              value={branch}
              onChange={(val) => {
                setBranch(val);
                clearFieldError("branch");
              }}
              isLoading={loadingBranches}
              hasError={fieldErrors.has("branch")}
            />

            <div className="w-full">
              <label className="block text-sm font-medium text-gray-900">
                Branch Shortcut
              </label>
              <input
                type="text"
                value={
                  loadingBranches && !branchShortcut
                    ? "Loading…"
                    : branchShortcut
                }
                disabled
                className="py-2 rounded-lg mt-2 border border-gray-200 text-sm shadow-sm w-full px-4 bg-gray-100"
              />
            </div>

            <div className="w-full">
              <label className="block text-sm font-medium text-gray-900">
                Type (S/W)
              </label>
              <input
                type="text"
                value={locationTypeLetter}
                disabled
                className="py-2 rounded-lg mt-2 border border-gray-200 text-sm shadow-sm w-full px-4 bg-gray-100"
              />
            </div>

            <SelectField
              label="Zone"
              inputId="zone"
              options={ZONE_OPTIONS}
              value={zone}
              onChange={(val) => {
                setZone(val);
                clearFieldError("zone");
              }}
              hasError={fieldErrors.has("zone")}
            />
            <SelectField
              label="Row"
              inputId="row"
              options={NUMBER_OPTIONS}
              value={row}
              onChange={(val) => {
                setRow(val);
                clearFieldError("row");
              }}
              hasError={fieldErrors.has("row")}
            />
            <SelectField
              label="Bay"
              inputId="bay"
              options={NUMBER_OPTIONS}
              value={bay}
              onChange={(val) => {
                setBay(val);
                clearFieldError("bay");
              }}
              hasError={fieldErrors.has("bay")}
            />
            <SelectField
              label="Size"
              inputId="size"
              options={NUMBER_OPTIONS}
              value={size}
              onChange={(val) => {
                setSize(val);
                clearFieldError("size");
              }}
              hasError={fieldErrors.has("size")}
            />

            <SelectField
              label="F/B"
              inputId="fb"
              options={FB_OPTIONS}
              value={fb}
              onChange={(val) => {
                setFb(val);
                clearFieldError("fb");
              }}
              hasError={fieldErrors.has("fb")}
            />

            <div className="w-full sm:col-span-2 mt-2">
              <label className="block text-sm font-medium text-gray-900">
                Location Code (Preview)
              </label>
              <div
                className={`mt-2 rounded-xl border px-4 py-3 shadow-sm bg-white ${
                  duplicateInfo?.exists ? "border-red-300" : "border-[#107a8b]/30"
                }`}
              >
                <div
                  className={`-mx-4 -mt-3 mb-4 h-2 rounded-t-xl ${
                    duplicateInfo?.exists
                      ? "bg-red-500"
                      : "bg-[#107a8b]"
                  }`}
                />
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p
                      className={`font-mono text-base sm:text-lg font-extrabold break-all leading-tight ${
                        duplicateInfo?.exists ? "text-red-800" : "text-[#107a8b]"
                      }`}
                    >
                      {locationCodePreview.split("_").map((part, index, arr) => (
                        <span key={index}>
                          {renderPreviewPart(part, index)}
                          {index < arr.length - 1 ? "_" : ""}
                        </span>
                      ))}
                    </p>

                    {checkingDuplicate && isPreviewComplete && (
                      <p className="mt-2 text-xs text-gray-500">
                        Checking duplicate…
                      </p>
                    )}

                    <p className="mt-2 text-xs text-gray-500">
                      Format: {"{BranchShortcut}{S/W}_{Zone}_{Row}_{F/B}_{Bay}_{Size}"}
                      {" "}(Natural omits F/B)
                    </p>
                  </div>

                  <div className="shrink-0 pt-1">
                    {duplicateInfo?.in_locations && (
                      <span className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                        <span
                          className="inline-flex h-2 w-2 rounded-full bg-red-500"
                          aria-hidden="true"
                        />
                        Already in locations
                      </span>
                    )}

                    {duplicateInfo?.in_requests && !duplicateInfo?.in_locations && (
                      <span className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                        <span
                          className="inline-flex h-2 w-2 rounded-full bg-red-500"
                          aria-hidden="true"
                        />
                        Pending request exists
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-x-6 w-full sm:col-span-2">
              <button
                type="submit"
                disabled={
                  loading ||
                  loadingBranches ||
                  checkingDuplicate ||
                  duplicateInfo?.exists
                }
                className="rounded-md bg-primary px-6 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus:outline-2 focus:outline-offset-2 focus:outline-indigo-600 disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
