import React from "react";

const DetailViewTemplate = () => {
    return (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h4 className="text-sm font-semibold text-blue-900 mb-3">Detail View Template</h4>
            <p className="text-xs text-blue-800 leading-relaxed">
                The Detail View Template is designed to display a single record from a dataset in a key-value format, making it easy to read each column as a label with its corresponding value. This is ideal for showing the first row of data in a table while keeping the interface clean.
            </p>
        </div>
    );
};

export default DetailViewTemplate;
