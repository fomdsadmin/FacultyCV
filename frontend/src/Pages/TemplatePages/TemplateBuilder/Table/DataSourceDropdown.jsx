import React, { useState } from "react";
import { useTemplateBuilder } from "../TemplateBuilderContext";

const DataSourceDropdown = ({ dataSource, setDataSettings }) => {
  const { sectionsMap } = useTemplateBuilder();
  const dataSources = Object.keys(sectionsMap);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const filteredSources = dataSources.filter((source) =>
    source.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="mb-4">
      <label className="block mb-1.5 text-xs font-semibold text-gray-800">
        Data Source
      </label>

      {!showSearch ? (
        <button
          onClick={() => setShowSearch(true)}
          className="w-full px-4 py-2.5 bg-blue-500 text-white rounded text-sm font-medium hover:bg-blue-600 transition-colors"
        >
          Search Data Source
        </button>
      ) : (
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search data sources..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-3 py-2.5 border-2 border-blue-500 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            autoFocus
          />
          <button
            onClick={() => {
              setShowSearch(false);
              setSearchTerm("");
            }}
            className="px-4 py-2.5 bg-gray-400 text-white rounded text-xs font-medium hover:bg-gray-500 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {showSearch && filteredSources.length > 0 && (
        <div className="mt-2 border border-gray-300 rounded bg-white max-h-48 overflow-y-auto">
          {filteredSources.map((source) => (
            <div
              key={source}
              onClick={() => {
                setDataSettings({ dataSource: source });
                setSearchTerm("");
                setShowSearch(false);
              }}
              className="px-3 py-2 text-xs text-gray-800 hover:bg-blue-100 cursor-pointer transition-colors"
            >
              {source}
            </div>
          ))}
        </div>
      )}

      {showSearch && filteredSources.length === 0 && (
        <div className="mt-2 px-3 py-2 text-xs text-gray-500 text-center">
          No data sources found
        </div>
      )}

      {dataSource && (
        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
          Selected: <strong>{dataSource}</strong>
        </div>
      )}
    </div>
  );
};

export default DataSourceDropdown;