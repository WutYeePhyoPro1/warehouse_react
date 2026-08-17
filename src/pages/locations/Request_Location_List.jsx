import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useStateContext } from "../../contexts/stateContext";
import LocationRequestStatusBadge from "../../components/LocationRequestStatusBadge";

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

const formatDate = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleString();
};

export default function RequestLocationList() {
  const { user } = useStateContext();
  const branchId = user?.user?.branch_id;

  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current_page: 1,
    total: 0,
    per_page: 20,
  });

  const fetchDocuments = async (page = 1) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({ page: page.toString() });
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
  };

  useEffect(() => {
    fetchDocuments();
  }, [branchId]);

  return (
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

      <div className="p-4 space-y-4 me-2 md:me-5">
        {isLoading && <p className="p-4 text-center text-gray-500">Loading…</p>}
        {!isLoading && documents.length === 0 && (
          <p className="p-4 text-center text-gray-500">No documents found.</p>
        )}

        {!isLoading && documents.length > 0 && (
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

      <div className="mt-6 flex justify-center gap-4 pb-6">
        <button
          disabled={isLoading || pagination.current_page === 1}
          onClick={() => fetchDocuments(pagination.current_page - 1)}
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
        >
          Previous
        </button>
        <button
          disabled={
            isLoading ||
            pagination.current_page * pagination.per_page >= pagination.total
          }
          onClick={() => fetchDocuments(pagination.current_page + 1)}
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </>
  );
}
