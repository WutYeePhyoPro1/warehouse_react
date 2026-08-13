import React, { useRef, useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import QRCode from "react-qr-code";
import { useReactToPrint } from "react-to-print";
import { useStateContext } from "../../contexts/stateContext";

export default function LocationList() {
  const { user } = useStateContext();
  const isSale = user?.roles?.includes("Sale");
  const branchId = user?.user?.branch_id;
  const componentRef = useRef(null);
  const [zone, setZone] = useState("");
  const [row, setRow] = useState("");
  const [bay, setBay] = useState("");
  const [size, setSize] = useState("");
  const [locations, setLocations] = useState([]);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  // const isOperationAnalystis = user?.roles?.includes("Operation Analystis");
  const [pagination, setPagination] = useState({
    current_page: 1,
    total: 0,
    per_page: 10,
  });

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: "Selected_Locations",
    removeAfterPrint: true,
  });

  const isSelected = useCallback(
    (id) => selectedLocations.some((l) => l.id === id),
    [selectedLocations]
  );

  const handleSelect = useCallback(
    (location) => {
      setSelectedLocations((prev) =>
        isSelected(location.id)
          ? prev.filter((l) => l.id !== location.id)
          : [...prev, location]
      );
    },
    [isSelected]
  );

  const handleSelectAll = () => {
    setSelectedLocations((prev) =>
      prev.length === locations.length ? [] : [...locations]
    );
  };

  const fetchLocationData = async (page = 1) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({
        page: page.toString(),
        ...(zone ? { zone } : {}),
        ...(row ? { row } : {}),
        ...(bay ? { bay } : {}),
        ...(size ? { level: size } : {}),
      });

      const res = await fetch(`/api/locations?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        credentials: "include",
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      const locationArray = json.data.data ?? [];

      // Deduplicate by `location_name` so same location code doesn't render multiple times
      // (backend doesn't enforce uniqueness on location_name).
      const seenLocationNames = new Set();
      const uniqueLocations = [];
      for (const loc of locationArray) {
        if (!loc?.location_name) continue;
        if (seenLocationNames.has(loc.location_name)) continue;
        seenLocationNames.add(loc.location_name);
        uniqueLocations.push(loc);
      }

      setLocations(uniqueLocations);
      setPagination({
        current_page: json.data.current_page ?? 1,
        total: json.data.total ?? uniqueLocations.length,
        per_page: json.data.per_page ?? uniqueLocations.length,
      });

      setSelectedLocations([]);
    } catch (err) {
      console.error("Failed to load location data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLocationData();
  }, [zone, row, bay, size, branchId]);
  
  const printUser =
  user?.user?.emp_id === "003-001055" ||
  user?.user?.emp_id === "001-000371" ||
  user?.user?.emp_id === "113-999999" ||
  user?.user?.emp_id === "007-000011"||
  user?.user?.emp_id === "001-000491"
  
  const smallSizePrintUser =
  user?.user?.emp_id === "000-000167" ||
  user?.user?.emp_id === "001-000898"


  const handlePageChange = (newPage) => {
    fetchLocationData(newPage);
  };
  return (
    <>
      <div className="flex justify-between items-center me-2 md:me-5 shadow p-4">
        <div className="md:flex gap-8 w-full">
          <div className="w-full">
            <label className="font-medium block">Zone</label>
            <input
              type="text"
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              className="py-2 rounded-lg mt-2 border border-primary text-sm shadow-sm w-full px-4"
              placeholder="Enter Zone"
            />
          </div>
          <div className="w-full">
            <label className="font-medium block">Row</label>
            <input
              type="text"
              value={row}
              onChange={(e) => setRow(e.target.value)}
              className="py-2 rounded-lg mt-2 border border-primary text-sm shadow-sm w-full px-4"
              placeholder="Enter Row"
            />
          </div>
          <div className="w-full">
            <label className="font-medium block">Bay</label>
            <input
              type="text"
              value={bay}
              onChange={(e) => setBay(e.target.value)}
              className="py-2 rounded-lg mt-2 border border-primary text-sm shadow-sm w-full px-4"
              placeholder="Enter Bay"
            />
          </div>
          <div className="w-full">
            <label className="font-medium block">Size</label>
            <input
              type="text"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              className="py-2 rounded-lg mt-2 border border-primary text-sm shadow-sm w-full px-4"
              placeholder="Enter Size"
            />
          </div>
          <div className="w-full flex items-end">
            <button
              onClick={handleSelectAll}
              disabled={isLoading || locations.length === 0}
              className="w-full mt-2 bg-[#107a8b] text-white py-2 rounded-lg hover:bg-[#0d6e7b] disabled:opacity-50"
            >
              {selectedLocations.length === locations.length &&
              locations.length > 0
                ? "Unselect All"
                : "Select All"}
            </button>
          </div>
        </div>
{/*      
      {isOperationAnalystis && (
          <Link
                to="/create_location"
                className="bg-primary py-2 px-3 text-white rounded ml-4"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  className="w-6 h-6"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 3.75a.75.75 0 0 1 .75.75v6.75h6.75a.75.75 0 0 1 0 1.5h-6.75v6.75a.75.75 0 0 1-1.5 0v-6.75H4.5a.75.75 0 0 1 0-1.5h6.75V4.5a.75.75 0 0 1 .75-.75Z"
                    clipRule="evenodd"
                  />
                </svg>
            </Link>
            )} */}
      </div>

      <div className="p-4 space-y-6">
        {isLoading && (
          <p className="p-4 text-center text-gray-500">Loading…</p>
        )}

        {!isLoading && locations.length === 0 && (
          <p className="p-4 text-center text-gray-500">No locations found.</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {!isLoading && locations.map((location) => (
            <div
              key={location.id}
              className="border p-4 rounded-xl shadow bg-white"
            >
    
              <div className="flex justify-between items-center sm:hidden">
                <div className="space-y-2">
                  <p className="font-bold">{location.location_name}</p>
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      className="accent-[#107a8b] w-4 h-4"
                      checked={isSelected(location.id)}
                      onChange={() => handleSelect(location)}
                    />
                    Select
                  </label>
                </div>
                <QRCode value={location.location_name} size={64} />
              </div>

            
              <div className="hidden sm:flex justify-between items-center">
                <div className="space-x-2 flex items-center">
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      className="accent-[#107a8b] w-4 h-4"
                      checked={isSelected(location.id)}
                      onChange={() => handleSelect(location)}
                    />
                  </label>
                  <p className="font-bold">{location.location_name}</p>
                </div>
               
              </div>
            </div>
          ))}
        </div>

        {/* Print Button */}

        {selectedLocations.length > 0 && (
          <div className="fixed bottom-10 right-10">
            <button
              className="bg-[#128080] text-white px-8 py-3 rounded-lg text-lg font-medium shadow hover:bg-[#0d6e7b]"
              onClick={handlePrint}
            >
              Print Selected
            </button>
          </div>
        )}
      </div>
      {/* <div className="hidden">
        <div ref={componentRef}>
          <div className="p-4 w-[800px]">
            <h2 className="text-xl font-bold mb-4 text-black">
              Selected Locations
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {selectedLocations.map((location) => (
                <div
                  key={location.id}
                  className="border p-4 rounded-md shadow bg-white flex flex-col items-center gap-2"
                >
                  <QRCode value={location.location_name} size={224} />
                  <div className="font-bold text-xl text-black">
                    {location.location_name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div> */}

        {isSale && (
        <div className="hidden">
          <div ref={componentRef} className="print-root">
            {Array.from({
              length: Math.ceil(selectedLocations.length / 2),
            }).map((_, i) => {
              const a = selectedLocations[i * 2];
              const b = selectedLocations[i * 2 + 1];

              return (
                <div key={a.id} className="page">
                  <div className="pair-grid">
                    {/* Card A */}
                    <div className="card">
                      <QRCode value={a.location_name} size={224} />
                      <div className="label">{a.location_name}</div>
                    </div>

                    {/* Card B (if exists) */}
                    {b ? (
                      <div className="card">
                        <QRCode value={b.location_name} size={224} />
                        <div className="label">{b.location_name}</div>
                      </div>
                    ) : (
                      <div className="card placeholder" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {printUser && (
        <div className="hidden">
          <div ref={componentRef} className="print-root">
            {Array.from({
              length: Math.ceil(selectedLocations.length / 2),
            }).map((_, i) => {
              const a = selectedLocations[i * 2];
              const b = selectedLocations[i * 2 + 1];

              return (
                <div key={a.id} className="page">
                  <div className="pair-grid">
                    {/* Card A */}
                    <div className="card">
                      <QRCode value={a.location_name} size={224} />
                      <div className="label">{a.location_name}</div>
                    </div>

                    {/* Card B (if exists) */}
                    {b ? (
                      <div className="card">
                        <QRCode value={b.location_name} size={224} />
                        <div className="label">{b.location_name}</div>
                      </div>
                    ) : (
                      <div className="card placeholder" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!isSale && (

      <div className="hidden">
        <div ref={componentRef}>
          <div className="p-4 ">
             <div className="grid grid-cols-3 gap-5">
              {selectedLocations.map((location) => (
                <div
                  key={location.id}
                  className={`border p-4 rounded-md shadow bg-white flex flex-col items-center gap-2 ${smallSizePrintUser ? "border-none" : ""}`}
                >
                  <QRCode value={location.location_name} size={224} />
                  <div className="font-bold text-xl text-black">
                    {location.location_name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Pagination */}
      <div className="mt-6 flex justify-center gap-4">
        <button
          disabled={isLoading || pagination.current_page === 1}
          onClick={() => handlePageChange(pagination.current_page - 1)}
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
        >
          Previous
        </button>
        <button
          disabled={
            isLoading ||
            pagination.current_page * pagination.per_page >= pagination.total
          }
          onClick={() => handlePageChange(pagination.current_page + 1)}
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </>
  );
}
