import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import Pagination from "../../components/Pagination";
import RequireRole from "../../components/RequireRole";

const PER_PAGE = 15;

const EMPTY_FORM = {
  code: "",
  name: "",
  category: "sale",
  is_active: true,
};

const categoryLabel = (value) =>
  value === "warehouse" ? "Warehouse" : "Sale";

const CATEGORY_FILTER_OPTIONS = [
  { value: "", label: "All Categories" },
  { value: "sale", label: "Sale" },
  { value: "warehouse", label: "Warehouse" },
];

const STATUS_FILTER_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

export default function LocationTypeList() {
  const [types, setTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchTypes = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/location-types", {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setTypes(json.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load location types.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTypes();
  }, [fetchTypes]);

  const filtered = useMemo(
    () =>
      types.filter((t) => {
        if (categoryFilter && t.category !== categoryFilter) return false;

        if (statusFilter === "active" && !t.is_active) return false;
        if (statusFilter === "inactive" && t.is_active) return false;

        const q = search.trim().toLowerCase();
        if (!q) return true;
        return (
          t.code.toLowerCase().includes(q) ||
          t.name.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q)
        );
      }),
    [types, categoryFilter, statusFilter, search]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, categoryFilter, statusFilter]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * PER_PAGE;
    return filtered.slice(start, start + PER_PAGE);
  }, [filtered, currentPage]);

  const rowOffset = (currentPage - 1) * PER_PAGE;

  const hasActiveFilters = Boolean(search || categoryFilter || statusFilter);

  const handleClearFilters = () => {
    setSearch("");
    setCategoryFilter("");
    setStatusFilter("");
    setCurrentPage(1);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (type) => {
    setEditing(type);
    setForm({
      code: type.code,
      name: type.name,
      category: type.category,
      is_active: Boolean(type.is_active),
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditing(null);
    setForm(EMPTY_FORM);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    const code = form.code.trim();
    const name = form.name.trim();
    if (!code || !name) {
      toast.error("Code and name are required.");
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const url = editing
        ? `/api/location-types/${editing.id}`
        : "/api/location-types";
      const method = editing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          name,
          category: form.category,
          is_active: form.is_active,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        const msg =
          typeof json.message === "string"
            ? json.message
            : json.message?.code?.[0] ||
              json.message?.name?.[0] ||
              "Save failed.";
        throw new Error(msg);
      }

      toast.success(editing ? "Location type updated." : "Location type created.");
      closeModal();
      fetchTypes();
    } catch (err) {
      toast.error(err.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget?.id) return;
    setDeleting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/location-types/${deleteTarget.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || "Delete failed.");
      }
      toast.success("Location type deleted.");
      setDeleteTarget(null);
      fetchTypes();
    } catch (err) {
      toast.error(err.message || "Delete failed.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <RequireRole role="Operation Analystis">
    <>
      <div className="mx-4 mt-2 flex items-center justify-between p-4 shadow me-2 md:me-5">
        <div>
          <h2 className="font-semibold text-gray-800">Location Types</h2>
          <p className="text-sm text-gray-500">
            {filtered.length} type{filtered.length === 1 ? "" : "s"}
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-lg bg-[#107a8b] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0d6e7b]"
        >
          + Create Location Type
        </button>
      </div>

      <div className="mx-4 mt-4 rounded-xl bg-white p-4 shadow me-2 md:me-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <label className="block text-sm font-medium text-gray-700">
              Search
            </label>
            <input
              type="text"
              placeholder="Code or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mt-2 w-full rounded-lg border border-primary px-4 py-2 text-sm shadow-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="mt-2 w-full rounded-lg border border-primary bg-white px-4 py-2 text-sm shadow-sm"
            >
              {CATEGORY_FILTER_OPTIONS.map((option) => (
                <option key={option.value || "all"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="mt-2 w-full rounded-lg border border-primary bg-white px-4 py-2 text-sm shadow-sm"
            >
              {STATUS_FILTER_OPTIONS.map((option) => (
                <option key={option.value || "all"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
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

        <div className="mt-4 overflow-x-auto rounded-xl border border-gray-200">
          <table className="min-w-full text-sm">
            <thead className="bg-primary text-left text-white">
              <tr>
                <th className="px-4 py-3 font-semibold">#</th>
                <th className="px-4 py-3 font-semibold">Code</th>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={`sk-${i}`} className="animate-pulse border-t">
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 rounded bg-gray-200" />
                      </td>
                    ))}
                  </tr>
                ))}

              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    No location types found.
                  </td>
                </tr>
              )}

              {!isLoading &&
                paginated.map((type, index) => (
                  <tr key={type.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600">{rowOffset + index + 1}</td>
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-800">
                      {type.code}
                    </td>
                    <td className="px-4 py-3 text-gray-800">{type.name}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          type.category === "warehouse"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-teal-100 text-teal-700"
                        }`}
                      >
                        {categoryLabel(type.category)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          type.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {type.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(type)}
                          title="Edit"
                          className="rounded-md bg-primary p-1 text-white hover:opacity-90"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="size-5"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                            />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(type)}
                          title="Delete"
                          className="rounded-md bg-red-500 p-1 text-white hover:bg-red-600"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="size-5"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.074-.965L18.641 2.91a1.125 1.125 0 0 0-1.091-.852H6.45a1.125 1.125 0 0 0-1.091.852L4.341 5.75m14.658 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {!isLoading && filtered.length > PER_PAGE && (
          <Pagination
            currentPage={currentPage}
            total={filtered.length}
            perPage={PER_PAGE}
            onPageChange={setCurrentPage}
            isLoading={isLoading}
          />
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-bold text-gray-800">
              {editing ? "Edit Location Type" : "Create Location Type"}
            </h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-gray-600">Code</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))
                  }
                  placeholder="e.g. RG_WAREHOUSE"
                  className="w-full rounded-lg border border-primary px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-600">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="Display name"
                  className="w-full rounded-lg border border-primary px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-600">
                  Category
                </label>
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, category: e.target.value }))
                  }
                  className="w-full rounded-lg border border-primary px-3 py-2 text-sm"
                >
                  <option value="sale">Sale</option>
                  <option value="warehouse">Warehouse</option>
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, is_active: e.target.checked }))
                  }
                  className="rounded border-primary text-primary focus:ring-primary"
                />
                Active
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
                >
                  {saving ? "Saving..." : editing ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-bold text-gray-800">
              Delete Location Type
            </h3>
            <p className="mb-4 text-sm text-gray-600">
              Delete <strong>{deleteTarget.name}</strong> ({deleteTarget.code})?
              This cannot be undone if the type is used in location requests.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => !deleting && setDeleteTarget(null)}
                disabled={deleting}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
    </RequireRole>
  );
}
