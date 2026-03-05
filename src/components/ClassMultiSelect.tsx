import { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';

interface ClassMultiSelectProps {
  value: string[];
  onChange: (classes: string[]) => void;
  required?: boolean;
}

export function ClassMultiSelect({ value, onChange, required = false }: ClassMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const classOptions = Array.from({ length: 10 }, (_, i) => `Class ${i + 1}`);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleClass = (className: string) => {
    if (value.includes(className)) {
      onChange(value.filter((c) => c !== className));
    } else {
      onChange([...value, className]);
    }
  };

  const removeClass = (className: string) => {
    onChange(value.filter((c) => c !== className));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-gray-700 mb-2">
        Classes *
      </label>
      
      {/* Selected Classes Display */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full min-h-[42px] px-4 py-2 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-transparent cursor-pointer bg-white"
      >
        {value.length === 0 ? (
          <span className="text-gray-400">Select classes...</span>
        ) : (
          <div className="flex flex-wrap gap-2">
            {value.map((className) => (
              <span
                key={className}
                className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-md text-sm"
              >
                {className}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeClass(className);
                  }}
                  className="hover:bg-purple-200 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        <ChevronDown
          className={`absolute right-3 top-10 w-5 h-5 text-gray-400 transition-transform ${
            isOpen ? 'transform rotate-180' : ''
          }`}
        />
      </div>

      {/* Dropdown Options */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {classOptions.map((className) => (
            <div
              key={className}
              onClick={() => toggleClass(className)}
              className="flex items-center gap-3 px-4 py-2 hover:bg-purple-50 cursor-pointer transition-colors"
            >
              <div
                className={`w-5 h-5 border-2 rounded flex items-center justify-center ${
                  value.includes(className)
                    ? 'bg-purple-600 border-purple-600'
                    : 'border-gray-300'
                }`}
              >
                {value.includes(className) && <Check className="w-3 h-3 text-white" />}
              </div>
              <span className={value.includes(className) ? 'text-purple-700 font-medium' : 'text-gray-700'}>
                {className}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Hidden input for form validation */}
      <input
        type="text"
        required={required}
        value={value.join(', ')}
        onChange={() => {}}
        className="sr-only"
        tabIndex={-1}
      />
    </div>
  );
}
