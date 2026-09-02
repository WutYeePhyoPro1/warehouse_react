import { createBrowserRouter } from "react-router-dom";
import App from "../pages/layout/App.jsx";

const lazyPage = (importPage) => async () => {
  const module = await importPage();
  return { Component: module.default };
};

const router = createBrowserRouter([
  {
    path: "/",
    Component: App,
    children: [
      {
        index: true,
        lazy: lazyPage(() => import("../pages/movement_transition/Home.jsx")),
      },
      {
        path: "profile",
        lazy: lazyPage(() => import("../pages/auth/ProfilePage.jsx")),
      },
      {
        path: "create_stockin",
        lazy: lazyPage(() => import("../pages/stock-in/Create_StockIn.jsx")),
      },
      {
        path: "create_stockout",
        lazy: lazyPage(() => import("../pages/stock-out/CreateStockOut.jsx")),
      },
      {
        path: "create_transfer",
        lazy: lazyPage(() => import("../pages/transfer/CreateTransfer.jsx")),
      },
      {
        path: "create_location",
        lazy: lazyPage(() => import("../pages/locations/Create_Location.jsx")),
      },
      {
        path: "add_location",
        lazy: lazyPage(() => import("../pages/locations/Add_Location.jsx")),
      },
      {
        path: "stock_out_lists",
        lazy: lazyPage(() => import("../pages/stock-out/StockOut_List.jsx")),
      },
      {
        path: "stock_in_lists",
        lazy: lazyPage(() => import("../pages/stock-in/StockIn_List.jsx")),
      },
      {
        path: "transfer_lists",
        lazy: lazyPage(() => import("../pages/transfer/Transfer_List.jsx")),
      },
      {
        path: "locations",
        lazy: lazyPage(() => import("../pages/locations/Location_List.jsx")),
      },
      {
        path: "location_types",
        lazy: lazyPage(() => import("../pages/locations/Location_Type_List.jsx")),
      },
      {
        path: "location_requests",
        lazy: lazyPage(() => import("../pages/locations/Request_Location_List.jsx")),
      },
      {
        path: "location_request/:id",
        lazy: lazyPage(() => import("../pages/locations/Request_Location_Detail.jsx")),
      },
      {
        path: "stock_balance_lists",
        lazy: lazyPage(() => import("../pages/stock_balance/Stock_Balance.jsx")),
      },
      {
        path: "scan/:target",
        lazy: lazyPage(() => import("../pages/scan/ScanPage.jsx")),
      },
      {
        path: "stock_balance_scan/:target",
        lazy: lazyPage(() => import("../pages/scan/Stock_Balance_Scan.jsx")),
      },
      {
        path: "detail/:id",
        lazy: lazyPage(() => import("../pages/detail/Detail.jsx")),
      },
      {
        path: "stock_detail/:id",
        lazy: lazyPage(() => import("../pages/stock_balance/Stock_Detail.jsx")),
      },
    ],
  },
  {
    path: "/login",
    lazy: lazyPage(() => import("../pages/auth/Login.jsx")),
  },
]);

export default router;
