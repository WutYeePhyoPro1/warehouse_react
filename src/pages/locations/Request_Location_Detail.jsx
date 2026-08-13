import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useStateContext } from "../../contexts/stateContext";
import LocationRequestStatusBadge from "../../components/LocationRequestStatusBadge";

const formatDate = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleString();
};

const LOCATION_CATEGORY_LABELS = {
  TOP_MID_WALL: "Top stock_Middle shelve & Wall shelve",
  PROMOTION_ZONE_GF: "Promotion zone,Ground floor",
  STATIONARY_DIGITAL: "Stationary & Digital-Displays",
  HARDWARE_TOOLS: "Hardware & Tools Displays",
  DOOR_WINDOW: "Door & Window Displays",
  PAINT_CHEMICAL: "Paint & Chemical-Displays",
  STRUCTURE_DISPLAYS: "Structure -Displays",
  GARDEN_ACCESSORIES: "Garden & Accessories - Displays",
  SANITARY_WARE: "Sanitary Ware -Displays",
  SURFACE_COVERING: "Surface Covering- Displays",
  HOUSEWARE_KITCHEN: "Houseware & Kitchen -Displays",
  HOME_APPLIANCE: "Home Appliance- Display",
  ELECTRICAL_ACCESSORIES: "Electrical & Accessories Displays",
  FURNITURE_BEDDING: "Furniture & Bedding",
  OUTSIDE_STORE: "Outside Store- Displays",
  RG_WAREHOUSE: "RG Warehouse",
};

export default function RequestLocationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useStateContext();
  const [request, setRequest] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectRemark, setRejectRemark] = useState("");
  const [rejectError, setRejectError] = useState("");

  const isApprover = user?.user?.emp_id === "000-000167";
  const canAction = isApprover && request?.status === "request";

  const fetchRequest = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/location-requests/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        credentials: "include",
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setRequest(json.data);
    } catch (err) {
      console.error("Failed to load location request:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchRequest();
  }, [id]);

  const handleApprove = async () => {
    if (!canAction) return;

    setIsApproving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/location-requests/${id}/approve`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        credentials: "include",
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.message || "Failed to approve request.");
        return;
      }

      toast.success(json.message || "Location approved successfully.");
      setShowApproveModal(false);
      window.dispatchEvent(new Event("location-notifications-refresh"));
      await fetchRequest();
    } catch (err) {
      console.error("Approve failed:", err);
      toast.error("Failed to approve request.");
    } finally {
      setIsApproving(false);
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
      const res = await fetch(`/api/location-requests/${id}/reject`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ remark }),
      });

      const json = await res.json();

      if (!res.ok) {
        const message =
          json.message?.remark?.[0] ||
          json.message ||
          "Failed to reject request.";
        toast.error(message);
        return;
      }

      toast.success(json.message || "Location request rejected.");
      setShowRejectModal(false);
      setRejectRemark("");
      window.dispatchEvent(new Event("location-notifications-refresh"));
      await fetchRequest();
    } catch (err) {
      console.error("Reject failed:", err);
      toast.error("Failed to reject request.");
    } finally {
      setIsRejecting(false);
    }
  };

  if (isLoading) {
    return <p className="p-6 text-center text-gray-500">Loading…</p>;
  }

  if (!request) {
    return <p className="p-6 text-center text-gray-500">Request not found.</p>;
  }

  const categoryLabel =
    LOCATION_CATEGORY_LABELS[request.location_category] ||
    request.location_category;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white shadow-md rounded-xl overflow-hidden">
        <div className="bg-[#107a8b] px-6 py-4">
          <h2 className="text-xl font-semibold text-white text-center">
            Location Request Detail
          </h2>
        </div>

        <table className="min-w-full divide-y divide-gray-200">
          <tbody className="divide-y divide-gray-100">
            {request.remark && (
              <tr className="bg-slate-50/80">
                <td className="py-4 px-4 font-medium text-gray-600 w-1/3 align-top">
                  <span className="inline-flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="size-4"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.657l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.657l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                    Remark
                  </span>
                </td>
                <td className="py-4 px-4">
                  <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-rose-600">
                      Rejection reason
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-gray-800 whitespace-pre-wrap">
                      {request.remark}
                    </p>
                  </div>
                </td>
              </tr>
            )}
            <tr>
              <td className="py-3 px-4 font-medium text-gray-600 w-1/3">
                Location Code
              </td>
              <td className="py-3 px-4 font-mono font-semibold text-[#107a8b]">
                {request.location_name}
              </td>
            </tr>
            <tr>
              <td className="py-3 px-4 font-medium text-gray-600">Branch</td>
              <td className="py-3 px-4 text-gray-800">
                {request.branch?.branch_name || "-"}
              </td>
            </tr>
            <tr>
              <td className="py-3 px-4 font-medium text-gray-600">
                Branch Shortcut
              </td>
              <td className="py-3 px-4 text-gray-800">
                {request.branch_short_name || request.branch?.branch_short_name || "-"}
              </td>
            </tr>
            <tr>
              <td className="py-3 px-4 font-medium text-gray-600">
                Location Type
              </td>
              <td className="py-3 px-4 text-gray-800">{categoryLabel}</td>
            </tr>
            <tr>
              <td className="py-3 px-4 font-medium text-gray-600">Type (S/W)</td>
              <td className="py-3 px-4 text-gray-800">
                {request.location_type === "Sale"
                  ? "S"
                  : request.location_type === "Warehouse"
                    ? "W"
                    : request.location_type}
              </td>
            </tr>
            <tr>
              <td className="py-3 px-4 font-medium text-gray-600">Zone</td>
              <td className="py-3 px-4 text-gray-800">
                {request.zone?.name || "-"}
              </td>
            </tr>
            <tr>
              <td className="py-3 px-4 font-medium text-gray-600">Row</td>
              <td className="py-3 px-4 text-gray-800">
                {request.row?.name || "-"}
              </td>
            </tr>
            <tr>
              <td className="py-3 px-4 font-medium text-gray-600">Bay</td>
              <td className="py-3 px-4 text-gray-800">
                {request.bay?.name || "-"}
              </td>
            </tr>
            <tr>
              <td className="py-3 px-4 font-medium text-gray-600">Size</td>
              <td className="py-3 px-4 text-gray-800">
                {request.level?.name || "-"}
              </td>
            </tr>
            <tr>
              <td className="py-3 px-4 font-medium text-gray-600">F/B</td>
              <td className="py-3 px-4 text-gray-800">{request.side || "-"}</td>
            </tr>
            <tr>
              <td className="py-3 px-4 font-medium text-gray-600">Status</td>
              <td className="py-3 px-4">
                <LocationRequestStatusBadge status={request.status} />
              </td>
            </tr>
            <tr>
              <td className="py-3 px-4 font-medium text-gray-600">
                Requested By
              </td>
              <td className="py-3 px-4 text-gray-800">
                {request.user?.name || request.user?.emp_id || "-"}
              </td>
            </tr>
            <tr>
              <td className="py-3 px-4 font-medium text-gray-600">Date</td>
              <td className="py-3 px-4 text-gray-800">
                {formatDate(request.created_at)}
              </td>
            </tr>
          </tbody>
        </table>

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
                Approve
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
                Reject
              </button>
            </>
          )}
          {request.status === "completed" && (
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
                Are you sure you want to approve this location request?
              </p>
              <p className="font-mono text-sm font-bold text-[#107a8b] break-all">
                {request.location_name}
              </p>
              <p className="text-xs text-gray-500">
                This will mark the request as completed and save it to locations.
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
                Are you sure you want to reject this location request?
              </p>
              <p className="font-mono text-sm font-bold text-[#107a8b] break-all">
                {request.location_name}
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
    </div>
  );
}
