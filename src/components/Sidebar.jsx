import React, { useEffect, useRef, useState } from "react";
import { Drawer } from "flowbite";
import { Link, useLocation } from "react-router-dom";
export default function Sidebar() {
  const [activeItem, setActiveItem] = useState("home");
  const sidebarRef = useRef(null);
  const drawerInstanceRef = useRef(null);
  const location = useLocation();

  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      console.log("User accepted the install prompt");
    } else {
      console.log("User dismissed the install prompt");
    }
    setDeferredPrompt(null); 
  };

   useEffect(() => {
    const sidebarElement = document.getElementById("default-sidebar");
    if (sidebarElement && !drawerInstanceRef.current) {
      drawerInstanceRef.current = new Drawer(sidebarElement, {
        backdrop: true,
      });
    }
  }, []);

  useEffect(() => {
    const path = location.pathname;
    const type = location.state?.type;

    if (type) {
      setActiveItem(type);
    } else if (path.includes("stock_in_lists") || path.includes("create_stockin")) setActiveItem("stock-in");
    else if (path.includes("stock_out_lists") || path.includes("create_stockout")) setActiveItem("stock-out");
    else if (path.includes("transfer_lists") || path.includes("create_transfer")) setActiveItem("transfer");
    else if (path.includes("location_requests") || path.includes("location_request")) setActiveItem("location-request");
    else if (path.includes("locations") || path.includes("create_location") || path.includes("add_location")) setActiveItem("location");
    else if (path.includes("stock_balance_lists"))
      setActiveItem("stock-balance");
    else setActiveItem("home");
  }, [location.pathname, location.state]);
  const handleOpenSidebar = () => {
    if (drawerInstanceRef.current) {
      drawerInstanceRef.current.show();
    }
  };

  const handleCloseSidebar = () => {
    if (drawerInstanceRef.current) {
      drawerInstanceRef.current.hide();
    }
    const backdrop = document.querySelector("[drawer-backdrop]");
    if (backdrop) backdrop.remove();
  };
  return (
    <>
      <button
        onClick={handleOpenSidebar}
        aria-controls="default-sidebar"
        type="button"
        className="inline-flex items-center p-2 mt-2 ms-3 text-sm text-gray-500 rounded-lg sm:hidden focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
      >
        <span className="sr-only">Open sidebar</span>
        <svg
          className="w-6 h-6"
          aria-hidden="true"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            clipRule="evenodd"
            fillRule="evenodd"
            d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z"
          ></path>
        </svg>
      </button>

      <aside
        id="default-sidebar"
        ref={sidebarRef}
        className="fixed top-0 left-0 z-40 w-64 h-screen transition-transform -translate-x-full sm:translate-x-0"
        aria-label="Sidebar"
      >
        <div className="h-full px-3 py-4 overflow-y-auto bg-white dark:bg-gray-800 font-poppin">
          <button
            onClick={handleCloseSidebar}
            type="button"
            className="absolute right-0 top-2 px-2 text-primary md:hidden"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
          <ul className="space-y-2 font-medium mt-5">
            <li>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="size-8 text-primary"
              >
                <path
                  fillRule="evenodd"
                  d="M8.161 2.58a1.875 1.875 0 0 1 1.678 0l4.993 2.498c.106.052.23.052.336 0l3.869-1.935A1.875 1.875 0 0 1 21.75 4.82v12.485c0 .71-.401 1.36-1.037 1.677l-4.875 2.437a1.875 1.875 0 0 1-1.676 0l-4.994-2.497a.375.375 0 0 0-.336 0l-3.868 1.935A1.875 1.875 0 0 1 2.25 19.18V6.695c0-.71.401-1.36 1.036-1.677l4.875-2.437ZM9 6a.75.75 0 0 1 .75.75V15a.75.75 0 0 1-1.5 0V6.75A.75.75 0 0 1 9 6Zm6.75 3a.75.75 0 0 0-1.5 0v8.25a.75.75 0 0 0 1.5 0V9Z"
                  clipRule="evenodd"
                />
              </svg>
            </li>
            <li
              className={`rounded-xl mt-7 ${
                activeItem === "home" ? "bg-primary" : ""
              }`}
            >
              <Link
                to="/"
                onClick={() => {
                  setActiveItem("home");
                  handleCloseSidebar();
                }}
                className="flex items-center p-2 text-gray-900 rounded-lg dark:text-white dark:hover:bg-gray-700 group"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className={`size-6 ${
                    activeItem === "home" ? "text-white" : "text-primary"
                  }`}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
                  />
                </svg>

                <span
                  className={`ms-3 font-bold ${
                    activeItem === "home" ? "text-white" : "text-primary"
                  }`}
                >
                  Movement Transition
                </span>
              </Link>
            </li>
            <li
              className={`rounded-xl ${
                activeItem === "stock-balance" ? "bg-primary" : ""
              }`}
            >
              <Link
                to="/stock_balance_lists"
                onClick={() => {
                  setActiveItem("stock-balance");
                  handleCloseSidebar();
                }}
                className="flex items-center p-2 text-gray-900 rounded-lg dark:text-white dark:hover:bg-gray-700 group"
              >
                {/* <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className={`size-6 ${activeItem === 'stock-balance' ? 'text-white'  : 'text-primary'}`}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
                  />
                </svg> */}

                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className={`size-6 ${
                    activeItem === "stock-balance"
                      ? "text-white"
                      : "text-primary"
                  }`}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0 0 12 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 0 1-2.031.352 5.988 5.988 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971Zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 0 1-2.031.352 5.989 5.989 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971Z"
                  />
                </svg>

                <span
                  className={`ms-3 font-bold ${
                    activeItem === "stock-balance"
                      ? "text-white"
                      : "text-primary"
                  }`}
                >
                  Stock Balance
                </span>
              </Link>
            </li>
            <li
              className={`rounded-xl ${
                activeItem === "stock-in" ? "bg-primary" : ""
              }`}
            >
              <Link
                to="stock_in_lists"
                onClick={() => {
                  setActiveItem("stock-in");
                  handleCloseSidebar();
                }}
                className="flex items-center p-2 text-gray-900 rounded-lg dark:text-white dark:hover:bg-gray-700 group"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className={`size-6 ${
                    activeItem === "stock-in" ? "text-white" : "text-primary"
                  }`}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                  />
                </svg>
                <span
                  className={`ms-3  font-bold ${
                    activeItem === "stock-in" ? "text-white" : "text-primary"
                  }`}
                >
                  Stock In Lists
                </span>
              </Link>
            </li>
            <li
              className={`rounded-xl ${
                activeItem === "stock-out" ? "bg-primary" : ""
              }`}
            >
              <Link
                to="/stock_out_lists"
                onClick={() => {
                  setActiveItem("stock-out");
                  handleCloseSidebar();
                }}
                className="flex items-center p-2 text-gray-900 rounded-lg dark:text-white  dark:hover:bg-gray-700 group"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className={`size-6 ${
                    activeItem === "stock-out" ? "text-white" : "text-primary"
                  }`}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z"
                  />
                </svg>

                <span
                  className={`ms-3 font-bold ${
                    activeItem === "stock-out" ? "text-white" : "text-primary"
                  }`}
                >
                  Stock Out Lists
                </span>
              </Link>
            </li>
            <li
              className={`rounded-xl ${
                activeItem === "transfer" ? "bg-primary" : ""
              }`}
            >
              <Link
                to="transfer_lists"
                onClick={() => {
                  setActiveItem("transfer");
                  handleCloseSidebar();
                }}
                className="flex items-center p-2 text-gray-900 rounded-lg dark:text-white dark:hover:bg-gray-700 group"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className={`size-6 ${
                    activeItem === "transfer" ? "text-white" : "text-primary"
                  }`}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z"
                  />
                </svg>
                <span
                  className={`ms-3 font-bold ${
                    activeItem === "transfer" ? "text-white" : "text-primary"
                  }`}
                >
                  Transfer Lists
                </span>
              </Link>
            </li>
            <li
              className={`rounded-xl ${
                activeItem === "location" ? "bg-primary" : ""
              }`}
            >
              <Link
                onClick={() => {
                  setActiveItem("location");
                  handleCloseSidebar();
                }}
                to="locations"
                className="flex items-center p-2 text-gray-900 rounded-lg dark:text-white dark:hover:bg-gray-700 group"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className={`size-6 ${
                    activeItem === "location" ? "text-white" : "text-primary"
                  }`}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
                  />
                </svg>

                <span
                  className={`ms-3 font-bold ${
                    activeItem === "location" ? "text-white" : "text-primary"
                  }`}
                >
                  Location
                </span>
              </Link>
            </li>
            <li
              className={`rounded-xl ${
                activeItem === "location-request" ? "bg-primary" : ""
              }`}
            >
              <Link
                onClick={() => {
                  setActiveItem("location-request");
                  handleCloseSidebar();
                }}
                to="location_requests"
                className="flex items-center p-2 text-gray-900 rounded-lg dark:text-white dark:hover:bg-gray-700 group"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className={`size-6 ${
                    activeItem === "location-request" ? "text-white" : "text-primary"
                  }`}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  />
                </svg>

                <span
                  className={`ms-3 font-bold ${
                    activeItem === "location-request" ? "text-white" : "text-primary"
                  }`}
                >
                  Request Location
                </span>
              </Link>
            </li>
            
            <li onClick={handleInstall} className="cursor-pointer">
            <div className="flex items-center p-2 text-gray-900 rounded-lg dark:text-white dark:hover:bg-gray-700 group shadow">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6 text-primary">
                <path strokeLinecap="round" strokeLinejoin="round" d="m9 12.75 3 3m0 0 3-3m-3 3v-7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              <span className="ms-3 font-bold text-primary">Install WMS</span>
            </div>
          </li>
          </ul>
        </div>
      </aside>
    </>
  );
}
