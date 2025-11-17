import React, { useState} from "react";
import BarChartComponent from "./BarChart.jsx";

const GraphCarousel = ({ graphs }) => {
  const [currentGraphIndex, setCurrentGraphIndex] = useState(0);

  const goToGraph = (index) => {
    setCurrentGraphIndex(index);
  };

  const goToPrevious = () => {
    setCurrentGraphIndex((prevIndex) => 
      prevIndex === 0 ? graphs.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentGraphIndex((prevIndex) => 
      prevIndex === graphs.length - 1 ? 0 : prevIndex + 1
    );
  };

  if (!graphs || graphs.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8 w-full h-full flex flex-col">
        <div className="flex items-center justify-center h-20 text-gray-500">
          No graph data available
        </div>
      </div>
    );
  }

  const currentGraph = graphs[currentGraphIndex];

  return (
    <div className="bg-white rounded-lg shadow-sm py-4 px-4 mb-8 w-full h-full flex flex-col">
      {/* Graph Header with Title and Navigation */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-zinc-700">{currentGraph.title}</h2>
        
        {/* Navigation Controls */}
        <div className="flex items-center gap-3">
          {/* Previous Button */}
          <button
            onClick={goToPrevious}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Previous graph"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Dot Indicators */}
          <div className="flex gap-2">
            {graphs.map((_, index) => (
              <button
                key={index}
                onClick={() => goToGraph(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentGraphIndex 
                    ? 'bg-blue-600' 
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Go to graph ${index + 1}`}
              />
            ))}
          </div>

          {/* Next Button */}
          <button
            onClick={goToNext}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Next graph"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Graph Content */}
      <div className="w-full flex-1 min-h-[450px] relative">
        <div className="absolute inset-0 mt-4 mr-4">
          <BarChartComponent
            data={currentGraph.data}
            dataKey={currentGraph.dataKey}
            dataKeys={currentGraph.dataKeys}
            barColors={currentGraph.barColors}
            xAxisKey={currentGraph.xAxisKey}
            barColor={currentGraph.barColor}
            margin={{ top: 10, right: 10, left: 20, bottom: 10 }}
            minHeight={400}
            formatTooltip={currentGraph.formatTooltip}
            formatYAxis={currentGraph.formatYAxis}
            formatXAxis={currentGraph.formatXAxis}
            yAxisLabel={currentGraph.yAxisLabel}
            xAxisLabel={currentGraph.xAxisLabel}
            showLegend={currentGraph.showLegend}
          />
        </div>
      </div>

      {/* Graph Counter */}
      <div className="flex justify-end mt-4">
        <span className="text-sm text-gray-500">
          {currentGraphIndex + 1} of {graphs.length}
        </span>
      </div>
    </div>
  );
};

export default GraphCarousel;
