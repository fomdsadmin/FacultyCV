import React, { useState, useRef, useEffect } from "react";

const DepartmentGenerateAllConfirmModal = ({
  open,
  onClose,
  onConfirm,
  department,
  members,
  template,
  startYear,
  endYear,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown if clicked outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  if (!open) return null;

  const visibleCount = 6;
  const hasMore = members.length > visibleCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl h-full max-h-[60vh] w-full relative">
        <h2 className="text-xl font-bold mb-4 text-zinc-700">Confirm Department-Wide CV Generation</h2>
        <div className="mb-2">
          <span className="font-semibold">Department:</span> {department}
        </div>
        <div className="mb-2" ref={dropdownRef}>
          <span className="font-semibold">Members:</span>
          <div className="relative inline-block w-full">
            <button
              className="w-full text-left px-3 py-2 border rounded bg-gray-50 mt-2 hover:bg-gray-100"
              onClick={() => setDropdownOpen((open) => !open)}
              type="button"
            >
              {members.length} member{members.length !== 1 ? "s" : ""}
              <span className="float-right">{dropdownOpen ? "▲" : "▼"}</span>
            </button>
            {dropdownOpen && (
              <div className="absolute left-0 right-0 mt-1 bg-white border rounded shadow-lg z-10 max-h-48 overflow-y-auto">
                <ul className="list-disc ml-6">
                  {members.map((user, idx) => (
                    <li key={user.user_id} className={idx >= visibleCount ? "hidden" : ""}>
                      {user.preferred_name || user.first_name} {user.last_name} ({user.email})
                    </li>
                  ))}
                  {hasMore && (
                    <div className="border-t mt-2 pt-2 max-h-24 overflow-y-auto">
                      {members.slice(visibleCount).map((user) => (
                        <li key={user.user_id}>
                          {user.preferred_name || user.first_name} {user.last_name} ({user.email})
                        </li>
                      ))}
                    </div>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
        <div className="mb-2">
          <span className="font-semibold">Template:</span> {template?.title}
        </div>
        <div className="mb-4">
          <span className="font-semibold">Year Range:</span> {startYear} to {endYear}
        </div>
        {/* Spacer to prevent content from being hidden behind buttons */}
        <div className="h-16" />
        <div className="absolute bottom-0 right-0 p-8 flex gap-4">
          <button className="btn btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={onConfirm}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default DepartmentGenerateAllConfirmModal;
