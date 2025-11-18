import { useState } from 'react';

export function AccordionItem({ title, children, hideIsOpenIcon=false, isCollapsed=false }) {
  const [isOpen, setIsOpen] = useState(false);
  const displayOpen = isCollapsed ? false : isOpen;

  return (
    <div className="border rounded shadow-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 text-left bg-gray-100 hover:bg-gray-200 font-medium flex justify-between items-center"
      >
        {title}
        {!hideIsOpenIcon && <span>{displayOpen ? '-' : '+'}</span>}
      </button>

      <div
        className={`transition-all duration-300 overflow-hidden px-4 ${displayOpen ? 'max-h-[9999px] py-2' : 'max-h-0 py-0'
          }`}
      >
        {displayOpen && <div className="pt-1">{children}</div>}
      </div>
    </div>
  );
}
