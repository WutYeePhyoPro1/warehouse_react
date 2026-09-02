import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useStateContext } from "../contexts/stateContext";
import { toast } from "react-hot-toast";
import { canViewRequestLocation } from "../utils/permissions";

export default function Nav() {
  const { user, setUser, setToken } = useStateContext();
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef();
  const notificationRef = useRef();
  const [open, setOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [branchDropdown, setBranchDropdown] = useState(false);
  const [branches, setBranches] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const isLocationApprover = user?.user?.emp_id === "000-000167";
  const showRequestLocation = canViewRequestLocation(user);

  // Fetch branches
  useEffect(() => {
    const fetchBranches = async () => {
      const token = localStorage.getItem("token");
      try {
        const res = await fetch("/api/user-branch", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const json = await res.json();
        const formatted = json.data.map((branch) => ({
          id: branch.id,
          name: branch.name,
        }));
        setBranches(formatted);
      } catch (error) {
        console.error("Failed to fetch branches", error);
      }
    };
    fetchBranches();
  }, []);

  useEffect(() => {
    if (!isLocationApprover) return;

    const fetchNotifications = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const res = await fetch("/api/notifications", {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });
        if (!res.ok) return;
        const json = await res.json();
        setNotifications(json.data ?? []);
        setUnreadCount(json.unread_count ?? 0);
      } catch (error) {
        console.error("Failed to fetch notifications", error);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    const handleRefresh = () => fetchNotifications();
    window.addEventListener("location-notifications-refresh", handleRefresh);
    return () => {
      clearInterval(interval);
      window.removeEventListener("location-notifications-refresh", handleRefresh);
    };
  }, [isLocationApprover, location.pathname]);

  const handleNotificationClick = (notification) => {
    setNotificationOpen(false);
    if (notification.document_id) {
      navigate(`/location_request/${notification.document_id}`);
      return;
    }
    if (notification.location_request?.document_id) {
      navigate(`/location_request/${notification.location_request.document_id}`);
      return;
    }
    if (notification.location_request_id) {
      navigate(`/location_request/${notification.location_request_id}`);
    }
  };

  const formatRelativeTime = (value) => {
    if (!value) return "";
    const date = new Date(value);
    const diffMs = Date.now() - date.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const selectedBranch = branches.find(
    (b) => String(b.id) === String(user?.user?.branch_id)
  );

  const handleSelectBranch = async (branch) => {
    setBranchDropdown(false);
    setOpen(false);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/user/branch", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ branch_id: branch.id }),
      });
      if (res.ok) {
        setUser((prev) => ({
          ...prev,
          user: {
            ...prev.user,
            branch_id: branch.id,
          },
        }));
      }
    } catch {
      toast.error("Failed to update branch.");
    }
  };

  const isBranchSelected = (branch) => branch.id === user?.branch_id;

  const getTitleByPath = () => {
    switch (location.pathname) {
      case "/":
        return "Movement Transition";
      case "/stock_balance_lists":
        return "Stock Balance Lists";
      case "/stock_in_lists":
        return "Stock In Lists";
      case "/stock_out_lists":
        return "Stock Out Lists";
      case "/transfer_lists":
        return "Transfer Lists";
      case "/locations":
        return "Location Lists";
      case "/location_types":
        return "Location Types";
      case "/location_requests":
        return "Request Location";
      case "/create_location":
        return "Create Location";
      case "/add_location":
        return "Add Location";
      default:
        if (location.pathname.startsWith("/location_request/")) {
          return "Request Location Detail";
        }
        return "Warehouse System";
    }
  };

  async function handleLogout(e) {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      if (token) {
        await fetch("/api/logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      setUser(null);
      setToken(null);
      localStorage.removeItem("token");
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setOpen(false);
    }
  }

  // Close all dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
        setBranchDropdown(false);
      }
      if (
        notificationRef.current &&
        !notificationRef.current.contains(e.target)
      ) {
        setNotificationOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex justify-between p-4 mb-2 shadow-sm bg-gray-50">
      <h1 className="text-primary text-xl font-bold font-poppin">
        {getTitleByPath()}
      </h1>
      <div className="flex items-center gap-3">
        {isLocationApprover && (
          <div className="relative" ref={notificationRef}>
            <button
              type="button"
              onClick={() => {
                setNotificationOpen((v) => !v);
                setOpen(false);
              }}
              className="relative w-10 h-10 border-2 border-[#107a8b] rounded-full flex items-center justify-center text-[#107a8b] hover:bg-[#107a8b]/10 transition-colors"
              title="Notifications"
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
                  d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
                />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 px-1 rounded-full bg-rose-500 text-white text-[11px] font-bold flex items-center justify-center shadow-sm ring-2 ring-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            {notificationOpen && (
              <div className="absolute right-0 mt-2 w-[22rem] max-h-[28rem] overflow-hidden bg-white rounded-2xl shadow-xl border border-slate-200 z-50">
                <div className="px-4 py-3 bg-[#107a8b] text-white">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold tracking-wide text-white">
                        Notifications
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.85)" }}>
                        Pending location requests
                      </p>
                    </div>
                    {unreadCount > 0 && (
                      <span
                        className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold text-white"
                        style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
                      >
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-6 py-10 text-center">
                      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="size-6"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
                          />
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-slate-700">
                        All caught up
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        No pending location requests
                      </p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {notifications.map((notification) => {
                        const locationCode =
                          notification.document?.document_number ||
                          notification.location_request?.location_name ||
                          notification.message?.replace(
                            /^New location request:\s*/i,
                            ""
                          );
                        const requester =
                          notification.document?.user?.name ||
                          notification.location_request?.user?.name ||
                          notification.location_request?.user?.emp_id ||
                          "Unknown";

                        return (
                          <li key={notification.id}>
                            <button
                              type="button"
                              onClick={() =>
                                handleNotificationClick(notification)
                              }
                              className="w-full text-left px-4 py-3.5 hover:bg-[#f0f9fa] transition-colors"
                            >
                              <div className="flex gap-3">
                                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-100">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={1.75}
                                    stroke="currentColor"
                                    className="size-4"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                                    />
                                  </svg>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-start justify-between gap-2">
                                    <p className="text-sm font-semibold text-slate-800">
                                      {notification.document_id
                                        ? "New location document"
                                        : "New location request"}
                                    </p>
                                    <span className="shrink-0 text-[11px] text-slate-400">
                                      {formatRelativeTime(
                                        notification.created_at
                                      )}
                                    </span>
                                  </div>
                                  <p className="mt-1 font-mono text-sm font-bold text-[#107a8b] break-all">
                                    {locationCode}
                                  </p>
                                  <p className="mt-1 text-xs text-slate-500">
                                    From {requester}
                                  </p>
                                </div>
                              </div>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                {showRequestLocation && (
                <div className="border-t border-slate-100 bg-slate-50 px-4 py-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setNotificationOpen(false);
                      navigate("/location_requests");
                    }}
                    className="w-full rounded-lg px-3 py-2 text-center text-sm font-semibold text-[#107a8b] hover:bg-white transition-colors"
                  >
                    View all requests
                  </button>
                </div>
                )}
              </div>
            )}
          </div>
        )}
        <div className="relative inline-block text-left" ref={dropdownRef}>
          <button
            onClick={() => setOpen((v) => !v)}
            className="w-10 h-10 border-2 border-primary rounded-full flex items-center justify-center text-primary hover:bg-gray-100"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="size-6"
            >
              <path
                fillRule="evenodd"
                d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          {open && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg border border-gray-200 z-50">
              <div className="border-b border-gray-100 px-4 py-3 space-y-2">
                <div className="flex items-center gap-2">
                  <i className="bi bi-person-fill text-[#107a8b] text-base shrink-0" />
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {user?.user?.name || "Unknown user"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <i className="bi bi-shield-check text-gray-400 text-sm shrink-0" />
                  <p className="text-xs text-gray-500 truncate">
                    {(Array.isArray(user?.roles) ? user.roles.join(", ") : user?.roles) ||
                      "No role"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <i className="bi bi-person-badge text-[#107a8b] text-sm shrink-0" />
                  <p className="font-mono text-xs text-[#107a8b] truncate">
                    {user?.user?.emp_id || "-"}
                  </p>
                </div>
              </div>
              <ul className="py-1 text-sm text-gray-700">
                {/* Selected Branch with dropdown */}
                <li className="relative">
                  <button
                    onClick={() => setBranchDropdown((v) => !v)}
                    className="flex items-center justify-between w-full px-4 py-2 hover:bg-gray-100"
                  >
                    <span>
                      <i className="bi bi-diagram-3 me-2" />
                      {selectedBranch?.name || "No branch selected"}
                    </span>
                    <svg
                      className={`w-4 h-4 transform transition-transform ${
                        branchDropdown ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
             
                  {branchDropdown && (
                    <ul className="ml-2 w-48 bg-primary text-white rounded-md shadow-lg border border-gray-200 z-50">
                      {branches.map((branch) => (
                        <li key={branch.id}>
                          <button
                            onClick={() => handleSelectBranch(branch)}
                            className={`flex w-full items-center px-4 py-2 hover:bg-[#0d6371] shadow-sm ${
                              isBranchSelected(branch)
                                ? "bg-primary text-white font-bold"
                                : ""
                            }`}
                          >
                            <i className="bi bi-bezier me-2" />
                            {branch.name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
                {/* View Profile */}
                <li>
                  <Link
                    to="/profile"
                    className="block px-4 py-2 hover:bg-gray-100"
                    onClick={() => setOpen(false)}
                  >
                    <i className="bi bi-person-lines-fill me-2" />
                    View Profile
                  </Link>
                </li>
                {/* Logout */}
                <li>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                  >
                    <i className="bi bi-box-arrow-right me-2" />
                    Log Out
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
