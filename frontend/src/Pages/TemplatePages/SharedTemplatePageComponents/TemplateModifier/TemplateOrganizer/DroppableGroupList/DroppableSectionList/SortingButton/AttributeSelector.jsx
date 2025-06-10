const AttributeSelector = ({ availableAttributes, selectedAttribute, onAttributeChange }) => {
    return (
        <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
                Sort by Attribute:
            </label>
            <select
                value={selectedAttribute}
                onChange={(e) => onAttributeChange(e.target.value)}
                className="w-full text-sm border rounded px-3 py-2"
            >
                <option value="">Select attribute</option>
                {availableAttributes.map(attr => (
                    <option key={attr} value={attr}>{attr}</option>
                ))}
            </select>
        </div>
    );
};

export default AttributeSelector;