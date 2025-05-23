import { useState } from 'react';

export function AccordionItem({ title, children }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border rounded shadow-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 text-left bg-gray-100 hover:bg-gray-200 font-medium flex justify-between items-center"
      >
        {title}
        <span>{isOpen ? '-' : '+'}</span>
      </button>

      <div
        className={`transition-all overflow-hidden px-4 ${
          isOpen ? 'max-h-screen py-2' : 'max-h-0'
        }`}
      >
        {isOpen && <div className="pt-1">{children}</div>}
      </div>
    </div>
  );
}
