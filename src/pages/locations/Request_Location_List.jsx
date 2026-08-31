import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useStateContext } from "../../contexts/stateContext";
import LocationRequestStatusBadge from "../../components/LocationRequestStatusBadge";
import Pagination from "../../components/Pagination";
import RequirePermission from "../../components/RequirePermission";
import { REQUEST_LOCATION_PERMISSION } from "../../utils/permissions";

const ViewAction = ({ id }) => (
  <Link to={`/location_request/${id}`} title="View">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="size-6 bg-primary px-1 rounded-md text-white"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
      />
    </svg>
  </Link>
);

const pad2 = (value) => String(value).padStart(2, "0");

const isoToDdMmYy = (iso) => {
  if (!iso) return "";
  const [year, month, day] = iso.split("-");
  if (!year || !month || !day) return "";
  return `${day}/${month}/${year.slice(-2)}`;
};

const ddMmYyToIso = (text) => {
  const match = String(text).match(/^(\d{2})\/(\d{2})\/(\d{2})$/);
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = 2000 + Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return `${year}-${pad2(month)}-${pad2(day)}`;
};

const maskDdMmYy = (raw) => {
  const digits = String(raw).replace(/\D/g, "").slice(0, 6);
  const day = digits.slice(0, 2);
  const month = digits.slice(2, 4);
  const year = digits.slice(4, 6);
  if (digits.length <= 2) return day;
  if (digits.length <= 4) return `${day}/${month}`;
  return `${day}/${month}/${year}`;
};

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  const dd = pad2(date.getDate());
  const mm = pad2(date.getMonth() + 1);
  const yy = String(date.getFullYear()).slice(-2);
  const time = date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return `${dd}/${mm}/${yy}, ${time}`;
};

const DateInput = ({ value, onChange }) => {
  const [text, setText] = useState(isoToDdMmYy(value));

  useEffect(() => {
    setText(isoToDdMmYy(value));
  }, [value]);

  const applyText = (raw) => {
    const formatted = maskDdMmYy(raw);
    setText(formatted);

    if (!formatted) {
      onChange("");
      return;
    }

    if (formatted.length === 8) {
      const iso = ddMmYyToIso(formatted);
      if (iso) onChange(iso);
    }
  };

  return (
    <div className="relative mt-2">
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="DD/MM/YY"
        value={text}
        onChange={(e) => applyText(e.target.value)}
        onBlur={() => {
          if (!text) {
            onChange("");
            return;
          }
          const iso = ddMmYyToIso(text);
          setText(iso ? isoToDdMmYy(iso) : isoToDdMmYy(value));
          if (iso) onChange(iso);
        }}
        className="py-2 rounded-lg border border-primary text-sm shadow-sm w-full px-4 pr-10"
      />
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="pointer-events-none absolute right-2 top-1/2 size-5 -translate-y-1/2 text-gray-500"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6.75 3v2.25M17.25 3v2.25M3 9.75h18M4.5 6.75h15A1.5 1.5 0 0 1 21 8.25v11.25A1.5 1.5 0 0 1 19.5 21h-15A1.5 1.5 0 0 1 3 19.5V8.25A1.5 1.5 0 0 1 4.5 6.75Z"
        />
      </svg>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 cursor-pointer opacity-0"
        aria-label="Open calendar"
      />
    </div>
  );
};

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "request", label: "Request" },
  { value: "completed", label: "Completed" },
  { value: "cancel", label: "Cancel" },
];

export default function RequestLocationList() {
  const { user } = useStateContext();
  const branchId = user?.user?.branch_id;
  const canFilterBranch = user?.user?.emp_id === "000-000167";

  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current_page: 1,
    total: 0,
    per_page: 20,
  });
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [filterBranchId, setFilterBranchId] = useState(
    () => (branchId != null ? String(branchId) : "all")
  );
  const [branches, setBranches] = useState([]);
  const searchDebounceRef = useRef(null);

  useEffect(() => {
    if (!canFilterBranch) return;
    const fetchBranches = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/branches", {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          credentials: "include",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setBranches(json.data ?? []);
      } catch (err) {
        console.error("Failed to load branches:", err);
      }
    };
    fetchBranches();
  }, [canFilterBranch]);

  useEffect(() => {
    if (branchId != null && canFilterBranch) {
      setFilterBranchId(String(branchId));
    }
  }, [branchId, canFilterBranch]);

  useEffect(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    searchDebounceRef.current = setTimeout(() => {
      setSearch(searchInput.trim());
    }, 400);

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [searchInput]);

  const fetchDocuments = useCallback(
    async (page = 1) => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem("token");
        const params = new URLSearchParams({ page: page.toString() });
        if (search) params.set("search", search);
        if (status) params.set("status", status);
        if (fromDate) params.set("from_date", fromDate);
        if (toDate) params.set("to_date", toDate);
        if (canFilterBranch && filterBranchId && filterBranchId !== "all") {
          params.set("branch_id", filterBranchId);
        }

        const res = await fetch(
          `/api/location-request-documents?${params.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
            credentials: "include",
          }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const rows = json.data?.data ?? [];
        setDocuments(rows);
        setPagination({
          current_page: json.data?.current_page ?? 1,
          total: json.data?.total ?? rows.length,
          per_page: json.data?.per_page ?? rows.length,
        });
      } catch (err) {
        console.error("Failed to load location documents:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [search, status, fromDate, toDate, canFilterBranch, filterBranchId]
  );

  useEffect(() => {
    fetchDocuments(1);
  }, [fetchDocuments]);

  const handleClearFilters = () => {
    setSearchInput("");
    setSearch("");
    setStatus("");
    setFromDate("");
    setToDate("");
    if (canFilterBranch) {
      setFilterBranchId(branchId != null ? String(branchId) : "all");
    }
  };

  const hasActiveFilters =
    search ||
    status ||
    fromDate ||
    toDate ||
    (canFilterBranch && filterBranchId !== "all" && filterBranchId !== String(branchId ?? ""));

  return (
    <RequirePermission permission={REQUEST_LOCATION_PERMISSION}>
    <>
      <div className="flex justify-between items-center me-2 md:me-5 shadow p-4 mx-4 mt-2">
        <h2 className="font-semibold text-gray-800">Location Request Documents</h2>
        <Link
          to="/add_location"
          className="bg-[#107a8b] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#0d6e7b]"
        >
          + Add Location
        </Link>
      </div>

      <div className="me-2 md:me-5 mx-4 mt-4 shadow p-4 bg-white rounded-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <div className="xl:col-span-2">
            <label className="font-medium block text-sm text-gray-700">
              Search
            </label>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="py-2 rounded-lg mt-2 border border-primary text-sm shadow-sm w-full px-4"
              placeholder="Document no or requester"
            />
          </div>

          <div>
            <label className="font-medium block text-sm text-gray-700">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="py-2 rounded-lg mt-2 border border-primary text-sm shadow-sm w-full px-4 bg-white"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value || "all"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {canFilterBranch && (
            <div>
              <label className="font-medium block text-sm text-gray-700">
                Branch
              </label>
              <select
                value={filterBranchId}
                onChange={(e) => setFilterBranchId(e.target.value)}
                className="py-2 rounded-lg mt-2 border border-primary text-sm shadow-sm w-full px-4 bg-white"
              >
                <option value="all">All Branches</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={String(branch.id)}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="font-medium block text-sm text-gray-700">
              From Date
            </label>
            <DateInput value={fromDate} onChange={setFromDate} />
          </div>

          <div>
            <label className="font-medium block text-sm text-gray-700">
              To Date
            </label>
            <DateInput value={toDate} onChange={setToDate} />
          </div>
        </div>

        {hasActiveFilters && (
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-sm font-medium text-[#107a8b] hover:text-[#0d6e7b]"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      <div className="p-4 space-y-4 me-2 md:me-5">
        {isLoading ? (
          <div className="overflow-x-auto bg-white rounded-xl shadow">
            <table className="min-w-full text-sm">
              <thead className="bg-[#107a8b] text-white">
                <tr>
                  <th className="px-4 py-3 text-left">Document No</th>
                  <th className="px-4 py-3 text-left">Lines</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Requested By</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 6 }).map((_, index) => (
                  <tr
                    key={`doc-skeleton-${index}`}
                    className="border-b hover:bg-gray-50"
                  >
                    <td className="px-4 py-3">
                      <div className="h-4 w-36 rounded bg-gray-200 animate-pulse" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-10 rounded bg-gray-200 animate-pulse" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-5 w-28 rounded bg-gray-200 animate-pulse" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-28 rounded bg-gray-200 animate-pulse" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-4 w-44 rounded bg-gray-200 animate-pulse" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="mx-auto h-6 w-6 rounded bg-gray-200 animate-pulse" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : documents.length === 0 ? (
          <p className="p-4 text-center text-gray-500">No documents found.</p>
        ) : (
          <div className="overflow-x-auto bg-white rounded-xl shadow">
            <table className="min-w-full text-sm">
              <thead className="bg-[#107a8b] text-white">
                <tr>
                  <th className="px-4 py-3 text-left">Document No</th>
                  <th className="px-4 py-3 text-left">Lines</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Requested By</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono font-semibold text-[#107a8b]">
                      {item.document_number}
                    </td>
                    <td className="px-4 py-3">{item.lines_count ?? "-"}</td>
                    <td className="px-4 py-3">
                      <LocationRequestStatusBadge status={item.status} />
                    </td>
                    <td className="px-4 py-3">
                      {item.user?.name || item.user?.emp_id || "-"}
                    </td>
                    <td className="px-4 py-3">{formatDate(item.created_at)}</td>
                    <td className="px-4 py-3">
                      <ViewAction id={item.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Pagination
        currentPage={pagination.current_page}
        total={pagination.total}
        perPage={pagination.per_page}
        onPageChange={fetchDocuments}
        isLoading={isLoading}
      />
    </>
    </RequirePermission>
  );
}
