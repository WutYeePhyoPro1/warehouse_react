import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useStateContext } from "../../contexts/stateContext";
import LocationRequestStatusBadge from "../../components/LocationRequestStatusBadge";

const formatDate = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleString();
};

const pad2 = (n) => String(n).padStart(2, "0");

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

const LOCATION_CATEGORY_LABELS = Object.fromEntries(
  LOCATION_TYPE_OPTIONS.map((opt) => [opt.value, opt.label])
);

export default function RequestLocationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useStateContext();
  const [document, setDocument] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectRemark, setRejectRemark] = useState("");
  const [rejectError, setRejectError] = useState("");
  const [deletingLineId, setDeletingLineId] = useState(null);
  const [editLine, setEditLine] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [branches, setBranches] = useState([]);

  const isApprover = user?.user?.emp_id === "000-000167";
  const canAction = isApprover && document?.status === "request";
  const canEditLine = canAction;
  const canDeleteLine = canAction;

  useEffect(() => {
    if (!isApprover) return;
    const loadBranches = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/branches", {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });
        if (!res.ok) return;
        const json = await res.json();
        setBranches(json.data || []);
      } catch (err) {
        console.error(err);
      }
    };
    loadBranches();
  }, [isApprover]);

  const fetchDocument = async ({ silent = false } = {}) => {
    if (!silent) setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/location-request-documents/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        credentials: "include",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setDocument(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchDocument();
  }, [id]);

  const handleApprove = async () => {
    if (!canAction) return;
    setIsApproving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/location-request-documents/${id}/approve`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.message || "Failed to approve document.");
        return;
      }
      toast.success(json.message || "Document approved.");
      setShowApproveModal(false);
      window.dispatchEvent(new Event("location-notifications-refresh"));
      await fetchDocument();
    } catch (err) {
      console.error(err);
      toast.error("Failed to approve document.");
    } finally {
      setIsApproving(false);
    }
  };

  const openEditLine = (line) => {
    setEditLine(line);
    setEditForm({
      branch_id: line.branch_id,
      location_category: line.location_category,
      zone: line.zone?.name || "",
      row_id: line.row_id,
      bay_id: line.bay_id,
      level_id: line.level_id,
      side: !line.side || line.side === "Natural" ? "None" : line.side,
    });
  };

  const editPreview = useMemo(() => {
    if (!editForm) return "";
    const branch = branches.find(
      (b) => String(b.id) === String(editForm.branch_id)
    );
    const sameBranch =
      editLine && String(editLine.branch_id) === String(editForm.branch_id);
    const short = (
      (sameBranch && editLine.branch_short_name) ||
      branch?.short_name ||
      "?"
    ).toUpperCase();
    const letter = editForm.location_category === "RG_WAREHOUSE" ? "W" : "S";
    const zone = (editForm.zone || "?").toUpperCase();
    const row = editForm.row_id
      ? NUMBER_OPTIONS.find((o) => o.value === Number(editForm.row_id))?.label
      : "?";
    const bay = editForm.bay_id
      ? NUMBER_OPTIONS.find((o) => o.value === Number(editForm.bay_id))?.label
      : "?";
    const size = editForm.level_id
      ? NUMBER_OPTIONS.find((o) => o.value === Number(editForm.level_id))?.label
      : "?";
    if (!editForm.side || editForm.side === "None" || letter === "W") {
      return `${short}${letter}_${zone}_${row}_${bay}_${size}`;
    }
    return `${short}${letter}_${zone}_${row}_${editForm.side}_${bay}_${size}`;
  }, [editForm, editLine, branches]);

  const handleSaveEdit = async () => {
    if (!canEditLine || !editLine || !editForm) return;
    if (
      !editForm.branch_id ||
      !editForm.location_category ||
      !editForm.zone ||
      !editForm.row_id ||
      !editForm.bay_id ||
      !editForm.level_id
    ) {
      toast.error("Please complete all fields.");
      return;
    }

    setSavingEdit(true);
    try {
      const token = localStorage.getItem("token");
      const sameBranch =
        String(editLine.branch_id) === String(editForm.branch_id);
      const res = await fetch(
        `/api/location-request-documents/${id}/lines/${editLine.id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            branch_id: Number(editForm.branch_id),
            location_category: editForm.location_category,
            zone: String(editForm.zone).trim().toUpperCase(),
            row_id: Number(editForm.row_id),
            bay_id: Number(editForm.bay_id),
            level_id: Number(editForm.level_id),
            location_type:
              editForm.location_category === "RG_WAREHOUSE" ? "W" : "S",
            side: editForm.side,
            branch_short_name: sameBranch
              ? editLine.branch_short_name
              : undefined,
          }),
        }
      );
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.message || "Failed to update line.");
        return;
      }
      toast.success(json.message || "Line updated.");
      setEditLine(null);
      setEditForm(null);
      await fetchDocument({ silent: true });
    } catch (err) {
      console.error(err);
      toast.error("Failed to update line.");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteLine = async (line) => {
    if (!canDeleteLine || !line?.id) return;
    const code = line.location_name || "this line";
    if (!window.confirm(`Delete location line ${code}?`)) return;

    setDeletingLineId(line.id);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `/api/location-request-documents/${id}/lines/${line.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.message || "Failed to delete line.");
        return;
      }

      toast.success(json.message || "Line deleted.");
      window.dispatchEvent(new Event("location-notifications-refresh"));

      if (json.data?.document_deleted) {
        navigate("/location_requests");
        return;
      }

      await fetchDocument({ silent: true });
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete line.");
    } finally {
      setDeletingLineId(null);
    }
  };

  const handleReject = async () => {
    if (!canAction) return;
    const remark = rejectRemark.trim();
    if (!remark) {
      setRejectError("Remark is required.");
      return;
    }
    setIsRejecting(true);
    setRejectError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/location-request-documents/${id}/reject`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ remark }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.message?.remark?.[0] || json.message || "Reject failed.");
        return;
      }
      toast.success(json.message || "Document rejected.");
      setShowRejectModal(false);
      setRejectRemark("");
      window.dispatchEvent(new Event("location-notifications-refresh"));
      await fetchDocument();
    } catch (err) {
      console.error(err);
      toast.error("Failed to reject document.");
    } finally {
      setIsRejecting(false);
    }
  };

  if (isLoading) {
    return <p className="p-6 text-center text-gray-500">Loading…</p>;
  }

  if (!document) {
    return <p className="p-6 text-center text-gray-500">Document not found.</p>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-4">
      <div className="bg-white shadow-md rounded-xl overflow-hidden">
        <div className="bg-[#107a8b] px-6 py-4">
          <h2 className="text-xl font-semibold text-white text-center">
            Location Request Document
          </h2>
        </div>

        {document.remark && (
          <div className="mx-6 mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-rose-600">
              Rejection reason
            </p>
            <p className="mt-1 text-sm text-gray-800 whitespace-pre-wrap">
              {document.remark}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
          <div>
            <p className="text-sm text-gray-500">Document No</p>
            <p className="font-mono text-lg font-bold text-[#107a8b]">
              {document.document_number}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <div className="mt-1">
              <LocationRequestStatusBadge status={document.status} />
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500">Requested By</p>
            <p className="font-medium text-gray-800">
              {document.user?.name || document.user?.emp_id || "-"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Date</p>
            <p className="font-medium text-gray-800">
              {formatDate(document.created_at)}
            </p>
          </div>
        </div>

        <div className="px-6 pb-4">
          <h3 className="font-semibold text-gray-800 mb-3">
            Lines ({document.lines?.length || 0})
          </h3>
          <div className="overflow-x-auto rounded-xl border">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100 text-gray-700">
                <tr>
                  <th className="px-3 py-2 text-left">#</th>
                  <th className="px-3 py-2 text-left">Location Code</th>
                  <th className="px-3 py-2 text-left">Branch</th>
                  <th className="px-3 py-2 text-left">Type</th>
                  <th className="px-3 py-2 text-left">S/W</th>
                  <th className="px-3 py-2 text-left">Zone</th>
                  <th className="px-3 py-2 text-left">Row</th>
                  <th className="px-3 py-2 text-left">F/B</th>
                  <th className="px-3 py-2 text-left">Bay</th>
                  <th className="px-3 py-2 text-left">Level</th>
                  {canAction && (
                    <th className="px-3 py-2 text-center">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {(document.lines || []).map((line, idx) => (
                  <tr key={line.id} className="border-t">
                    <td className="px-3 py-2">{idx + 1}</td>
                    <td className="px-3 py-2 font-mono font-semibold text-[#107a8b]">
                      {line.location_name}
                    </td>
                    <td className="px-3 py-2">
                      {line.branch?.branch_name || "-"}
                    </td>
                    <td className="px-3 py-2">
                      {LOCATION_CATEGORY_LABELS[line.location_category] ||
                        line.location_category}
                    </td>
                    <td className="px-3 py-2">
                      {line.location_type === "Sale"
                        ? "S"
                        : line.location_type === "Warehouse"
                          ? "W"
                          : line.location_type}
                    </td>
                    <td className="px-3 py-2">{line.zone?.name || "-"}</td>
                    <td className="px-3 py-2">{line.row?.name || "-"}</td>
                    <td className="px-3 py-2">
                      {!line.side || line.side === "Natural" || line.side === "None"
                        ? ""
                        : line.side}
                    </td>
                    <td className="px-3 py-2">{line.bay?.name || "-"}</td>
                    <td className="px-3 py-2">{line.level?.name || "-"}</td>
                    {canAction && (
                      <td className="px-3 py-2 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openEditLine(line)}
                          className="mr-2 rounded-md border border-[#107a8b] px-2 py-1 text-xs font-semibold text-[#107a8b] hover:bg-[#f0f9fa]"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteLine(line)}
                          disabled={deletingLineId === line.id}
                          className="rounded-md border border-red-300 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                          title="Delete line"
                        >
                          {deletingLineId === line.id ? "…" : "Delete"}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="p-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => navigate("/location_requests")}
            className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
          >
            Back
          </button>
          {canAction && (
            <>
              <button
                type="button"
                onClick={() => setShowApproveModal(true)}
                disabled={isApproving || isRejecting}
                className="px-4 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-50"
              >
                Approve Document
              </button>
              <button
                type="button"
                onClick={() => {
                  setRejectRemark("");
                  setRejectError("");
                  setShowRejectModal(true);
                }}
                disabled={isApproving || isRejecting}
                className="px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-50"
              >
                Reject Document
              </button>
            </>
          )}
          {document.status === "completed" && (
            <button
              type="button"
              onClick={() => navigate("/locations")}
              className="px-4 py-2 rounded-lg bg-[#107a8b] text-white font-semibold hover:bg-[#0d6e7b]"
            >
              View Locations
            </button>
          )}
        </div>
      </div>

      {showApproveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
            <div className="border-b px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Confirm Approve
              </h3>
            </div>
            <div className="px-6 py-4 space-y-2">
              <p className="text-sm text-gray-700">
                Approve this whole document and all location lines?
              </p>
              <p className="font-mono text-sm font-bold text-[#107a8b]">
                {document.document_number}
              </p>
              <p className="text-xs text-gray-500">
                {document.lines?.length || 0} line(s) will be saved to locations.
              </p>
            </div>
            <div className="flex justify-end gap-3 border-t px-6 py-4">
              <button
                type="button"
                onClick={() => setShowApproveModal(false)}
                disabled={isApproving}
                className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApprove}
                disabled={isApproving}
                className="px-4 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-50"
              >
                {isApproving ? "Approving…" : "Yes, Approve"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
            <div className="border-b px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Confirm Reject
              </h3>
            </div>
            <div className="px-6 py-4 space-y-3">
              <p className="text-sm text-gray-700">
                Reject this whole document and all lines?
              </p>
              <p className="font-mono text-sm font-bold text-[#107a8b]">
                {document.document_number}
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Remark <span className="text-red-600">*</span>
                </label>
                <textarea
                  rows={4}
                  value={rejectRemark}
                  onChange={(e) => {
                    setRejectRemark(e.target.value);
                    if (rejectError) setRejectError("");
                  }}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#107a8b] focus:outline-none"
                  placeholder="Enter reason for rejection"
                />
                {rejectError && (
                  <p className="mt-1 text-sm text-red-600">{rejectError}</p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t px-6 py-4">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                disabled={isRejecting}
                className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={isRejecting}
                className="px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-50"
              >
                {isRejecting ? "Rejecting…" : "Yes, Reject"}
              </button>
            </div>
          </div>
        </div>
      )}

      {editLine && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
            <div className="border-b px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-800">Edit Line</h3>
              <p className="mt-1 font-mono text-xs text-[#107a8b]">
                {editLine.location_name}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 px-6 py-4">
              <label className="col-span-2 text-sm">
                <span className="mb-1 block text-gray-600">Branch</span>
                <select
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  value={editForm.branch_id || ""}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, branch_id: e.target.value }))
                  }
                >
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="col-span-2 text-sm">
                <span className="mb-1 block text-gray-600">Location Type</span>
                <select
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  value={editForm.location_category}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      location_category: e.target.value,
                    }))
                  }
                >
                  {LOCATION_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-gray-600">Zone</span>
                <input
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm uppercase"
                  value={editForm.zone}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, zone: e.target.value }))
                  }
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-gray-600">Row</span>
                <select
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  value={editForm.row_id}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, row_id: e.target.value }))
                  }
                >
                  {NUMBER_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-gray-600">F/B</span>
                <select
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  value={editForm.side}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, side: e.target.value }))
                  }
                >
                  {FB_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-gray-600">Bay</span>
                <select
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  value={editForm.bay_id}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, bay_id: e.target.value }))
                  }
                >
                  {NUMBER_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-gray-600">Level</span>
                <select
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  value={editForm.level_id}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, level_id: e.target.value }))
                  }
                >
                  {NUMBER_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
              <div className="col-span-2 rounded-lg bg-[#f0f9fa] px-3 py-2">
                <p className="text-xs text-gray-500">Preview</p>
                <p className="font-mono text-sm font-bold text-[#107a8b]">
                  {editPreview}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t px-6 py-4">
              <button
                type="button"
                onClick={() => {
                  setEditLine(null);
                  setEditForm(null);
                }}
                disabled={savingEdit}
                className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={savingEdit}
                className="px-4 py-2 rounded-lg bg-[#107a8b] text-white font-semibold hover:bg-[#0d6e7b] disabled:opacity-50"
              >
                {savingEdit ? "Saving…" : "Save Line"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
