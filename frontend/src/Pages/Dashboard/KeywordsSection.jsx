import React, { useState, useEffect, useRef, useMemo } from "react";
import { Chart as ChartJS } from "chart.js";
import { WordCloudController, WordElement } from "chartjs-chart-wordcloud";

// Register Chart.js components required for word cloud visualization
ChartJS.register(WordCloudController, WordElement);

/**
 * KeywordsSection Component
 * 
 * Displays publication keywords in two formats:
 * 1. Tag-based list view with frequency counts (default top 10, expandable to all)
 * 2. Interactive word cloud visualization (toggled on demand)
 * 
 * @param {Object[]} publications - Array of publication objects containing data_details with keywords
 */
const KeywordsSection = ({ publications }) => {
  // Toggle between showing top 10 keywords vs all keywords
  const [showAllKeywords, setShowAllKeywords] = useState(false);
  
  // Control word cloud rendering to optimize performance (only render when requested)
  const [renderWordCloud, setRenderWordCloud] = useState(false);
  
  // Reference to the canvas element for word cloud rendering
  const wordCloudCanvasRef = useRef(null);
  const chartInstanceRef = useRef(null);

  /**
   * Extract and count keywords from all publications
   * 
   * 1. Extract keywords array and normalize (lowercase, trim)
   * 2. Count occurrences of each unique keyword
   * 3. Filter out keywords that appear only once
   * 4. Sort by frequency (descending)
   * 
   */
  const keywordData = useMemo(() => {
    const keywordCounts = {};
    
    publications.forEach((pub) => {
      try {
        const details = JSON.parse(pub.data_details);
        const keywords = details.keywords || [];
        
        if (Array.isArray(keywords) && keywords.length > 0) {
          keywords.forEach((kw) => {
            // Validate keyword is a non-empty string
            if (kw && typeof kw === "string" && kw.trim().length > 0) {
              const lower = kw.toLowerCase().trim();
              keywordCounts[lower] = (keywordCounts[lower] || 0) + 1;
            }
          });
        }
      } catch (e) {
        console.error("Error parsing publication data for keywords:", e, pub);
      }
    });

    // Convert to array format and filter out single occurrences
    const sorted = Object.entries(keywordCounts)
      .map(([text, value]) => ({ text, value }))
      .filter((item) => item.value > 1) // Only show keywords appearing 2+ times
      .sort((a, b) => b.value - a.value); // Sort by frequency descending
    
    return sorted;
  }, [publications]);

  /**
   * Render word cloud visualization when enabled
   * 
   * Creates a Chart.js word cloud with responsive sizing
   */
  useEffect(() => {
    // Cleanup existing chart if any
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
      chartInstanceRef.current = null;
    }

    // Only render if enabled and data is available
    if (!renderWordCloud || !wordCloudCanvasRef.current || keywordData.length === 0) return;

    const maxValue = Math.max(...keywordData.map((d) => d.value));

    // Create the word cloud chart
    chartInstanceRef.current = new ChartJS(wordCloudCanvasRef.current, {
      type: "wordCloud",
      data: {
        labels: keywordData.map((d) => d.text),
        datasets: [
          {
            label: "Count",
            data: keywordData.map((d) => d.value),
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          tooltip: { enabled: true },
          datalabels: { display: false },
          legend: { display: false }
        },
        elements: {
          word: {
            color: (ctx) => {
              const label = ctx.element?.text;
              const wordObj = keywordData.find((d) => d.text === label);
              const isMax = wordObj && wordObj.value === maxValue;
              return isMax ? "#facc15" : "#4a5568";
            },
            padding: 1,
            rotation: () => 0,
            family: "Arial, sans-serif",
            // Use logarithmic scaling for better size distribution
            size: (ctx) => {
              const value = ctx.raw;
              const minValue = Math.min(...keywordData.map((d) => d.value));
              // Logarithmic scaling with larger base sizes (12-60px range)
              const minSize = 12;
              const maxSize = 60;
              const logMin = Math.log(minValue);
              const logMax = Math.log(maxValue);
              const logValue = Math.log(value);
              const scale = (logValue - logMin) / (logMax - logMin);
              return minSize + scale * (maxSize - minSize);
            },
            weight: (ctx) => {
              const label = ctx.element?.text;
              const wordObj = keywordData.find((d) => d.text === label);
              const isMax = wordObj && wordObj.value === maxValue;
              return isMax ? "bold" : "normal";
            },
          },
        },
      },
    });

    // Cleanup: destroy chart instance when component unmounts or dependencies change
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [keywordData, renderWordCloud]);

  // Memoize displayed keywords to avoid recalculation on every render
  const displayedKeywords = useMemo(() => {
    return showAllKeywords ? keywordData : keywordData.slice(0, 10);
  }, [keywordData, showAllKeywords]);

  // Get max value once for highlighting (keywordData is already sorted, so first item has max)
  const maxKeywordValue = keywordData.length > 0 ? keywordData[0].value : 0;

  return (
    <div className="mt-2">
      <div className="flex flex-col gap-2 p-2 rounded-lg shadow-md bg-zinc-50">
        <h2 className="text-lg font-semibold p-4">Keywords From Your Publications</h2>
        
        {/* Keyword Tags List - Shows top 10 by default, expandable to all */}
        {keywordData.length > 0 ? (
          <div className="flex-1 min-w-0 px-4 pb-2">
            <div className="flex flex-wrap gap-2">
              {displayedKeywords.map((item, index) => {
                const isMax = item.value === maxKeywordValue;
                return (
                  <span
                    key={`${item.text}-${index}`}
                    className={`py-2 px-3 text-sm rounded-full ${
                      isMax ? "bg-yellow-400 text-black font-bold" : "bg-gray-200 text-gray-800"
                    }`}
                  >
                    {item.text.toUpperCase()} ({item.value})
                  </span>
                );
              })}
              
              {/* Add "Show All" / "Show Top 10" toggle button if more than 10 keywords */}
              {keywordData.length > 10 && (
                <button
                  onClick={() => setShowAllKeywords(!showAllKeywords)}
                  className="px-3 py-2 text-sm rounded-full bg-blue-100 text-blue-700 font-semibold hover:bg-blue-200 transition"
                >
                  {showAllKeywords ? "Show Top 10" : "Show All"}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="px-4 pb-4">
            <p className="text-gray-500 text-center py-4">
              No keywords found in your publications. Keywords will appear here when publications with keyword data are added.
            </p>
          </div>
        )}

        {/* Word Cloud Visualization - Toggle button and canvas container */}
        {keywordData.length > 0 && (
          <div className="flex flex-col items-start gap-2 px-4 py-2">
            <button
              className="px-4 py-2 rounded bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition"
              onClick={() => setRenderWordCloud((v) => !v)}
            >
              {renderWordCloud ? "Hide Word Cloud" : "Show Word Cloud"}
            </button>
            {renderWordCloud && (
              <div
                className="w-full border border-gray-300 rounded-lg overflow-hidden"
                style={{ height: "500px", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <canvas 
                  ref={wordCloudCanvasRef}
                  style={{ maxWidth: "100%", maxHeight: "100%" }}
                ></canvas>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default KeywordsSection;
