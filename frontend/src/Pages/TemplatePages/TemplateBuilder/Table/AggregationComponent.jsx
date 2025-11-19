import React from "react";
import GroupByComponent from "./GroupByComponent";
import AggregateComponent from "./AggregateComponent";

const AggregationComponent = ({ dataSource, aggregationSettings, setAggregationSettings }) => {
    // Update groupBy settings
    const handleSetGroupBy = (groupBy) => {
        setAggregationSettings({
            ...aggregationSettings,
            groupBy,
        });
    };

    // Update grouping mode
    const handleSetGroupingMode = (groupingMode) => {
        setAggregationSettings({
            ...aggregationSettings,
            groupingMode,
        });
    };

    // Update aggregateFields settings
    const handleSetAggregateFields = (aggregateFields) => {
        setAggregationSettings({
            ...aggregationSettings,
            aggregateFields,
        });
    };

    return (
        <div style={{ marginTop: 16 }}>
            <GroupByComponent
                dataSource={dataSource}
                groupBySettings={aggregationSettings?.groupBy || []}
                setGroupBySettings={handleSetGroupBy}
                groupingMode={aggregationSettings?.groupingMode || "hierarchical"}
                setGroupingMode={handleSetGroupingMode}
            />
            <AggregateComponent
                dataSource={dataSource}
                aggregateSettings={aggregationSettings?.aggregateFields || []}
                setAggregateSettings={handleSetAggregateFields}
            />
        </div>
    );
};

export default AggregationComponent;
