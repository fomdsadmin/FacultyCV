import { useState } from 'react';

const InfoCard = ({ 
  title, 
  children, 
  helpText, 
  className = "",
  showHelpIcon = true 
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className={`${className}`}>
      <div className="flex items-center justify-between py-2">
        <h2 className="text-md font-semibold text-zinc-800">{title}</h2>
        {showHelpIcon && helpText && (
          <div className="relative">
            <div
              className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center cursor-help hover:bg-blue-200 transition-colors"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
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
            
            {showTooltip && (
              <div className="absolute top-7 right-0 z-10 w-64 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-lg">
                <div className="relative">
                  {helpText}
                  <div className="absolute -top-2 right-4 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900"></div>
                </div>
              </div>
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
