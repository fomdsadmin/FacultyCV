import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

const InfoCard = ({ 
  title, 
  children, 
  helpText, 
  className = "",
  showHelpIcon = true 
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const helpIconRef = useRef(null);

  const updateTooltipPosition = () => {
    if (helpIconRef.current) {
      const rect = helpIconRef.current.getBoundingClientRect();
      const tooltipWidth = 288; // 18rem = 288px
      const viewportWidth = window.innerWidth;
      
      let left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
      
      // Ensure tooltip doesn't go off-screen
      if (left < 10) {
        left = 10;
      } else if (left + tooltipWidth > viewportWidth - 10) {
        left = viewportWidth - tooltipWidth - 10;
      }
      
      setTooltipPosition({
        top: rect.bottom + 8,
        left: left
      });
    }
  };

  const handleMouseEnter = () => {
    setShowTooltip(true);
    updateTooltipPosition();
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  useEffect(() => {
    if (showTooltip) {
      updateTooltipPosition();
      window.addEventListener('scroll', updateTooltipPosition);
      window.addEventListener('resize', updateTooltipPosition);
      
      return () => {
        window.removeEventListener('scroll', updateTooltipPosition);
        window.removeEventListener('resize', updateTooltipPosition);
      };
    }
  }, [showTooltip]);

  return (
    <div className={`${className}`}>
      <div className="flex items-center justify-start py-2">
        <h2 className="text-md font-semibold text-zinc-800 mr-2">{title}</h2>
        {showHelpIcon && helpText && (
          <div className="relative">
            <div
              ref={helpIconRef}
              className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center cursor-help hover:bg-blue-200 transition-colors"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <svg 
                className="w-3 h-3 text-blue-600" 
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path 
                  fillRule="evenodd" 
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" 
                  clipRule="evenodd" 
                />
              </svg>
            </div>
            
            {showTooltip && createPortal(
              <div 
                className="fixed z-[9999] w-72 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-lg pointer-events-none"
                style={{
                  top: `${tooltipPosition.top}px`,
                  left: `${tooltipPosition.left}px`
                }}
              >
                <div className="relative">
                  {helpText}
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900"></div>
                </div>
              </div>,
              document.body
            )}
          </div>
        )}
      </div>
      <div className="space-y-3">
        {children}
      </div>
    </div>
  );
};

export default InfoCard;
