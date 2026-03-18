import { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';

interface SubjectMultiSelectProps {
  value: string[];
  onChange: (subjects: string[]) => void;
  required?: boolean;
}

export function SubjectMultiSelect({ value, onChange, required = false }: SubjectMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const subjectOptions = [
    'English',
    'Mathematics',
    'Science',
    'Social Studies',
    'Environmental Science',
    'Hindi',
    'Physics',
    'Chemistry',
    'Biology',
    'Computer Science',
    'Art & Craft',
    'Music',
    'Physical Education',
    'Dance',
    'Yoga',
    'French',
    'Sanskrit',
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleSubject = (subject: string) => {
    if (value.includes(subject)) {
      onChange(value.filter((s) => s !== subject));
    } else {
      onChange([...value, subject]);
    }
  };

  const removeSubject = (subject: string) => {
    onChange(value.filter((s) => s !== subject));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-gray-700 mb-2">
        Subject Specialization *
      </label>
      
      {/* Selected Subjects Display */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full min-h-[42px] px-4 py-2 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-transparent cursor-pointer bg-white transition-all hover:border-purple-300"
      >
        {(!value || value.length === 0) ? (
          <span className="text-gray-400">Select subjects...</span>
        ) : (
          <div className="flex flex-wrap gap-2">
            {value.map((subject) => (
              <span
                key={subject}
                className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-md text-sm font-medium animate-in fade-in zoom-in duration-200"
              >
                {subject}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSubject(subject);
                  }}
                  className="hover:bg-purple-200 rounded-full p-0.5 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        <ChevronDown
          className={`absolute right-3 top-10 w-5 h-5 text-gray-400 transition-transform duration-300 ${
            isOpen ? 'transform rotate-180' : ''
          }`}
        />
      </div>

      {/* Dropdown Options */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-60 overflow-y-auto animate-in slide-in-from-top-2 duration-200">
          <div className="p-2 border-b border-gray-100 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Available Subjects
          </div>
          {subjectOptions.map((subject) => (
            <div
              key={subject}
              onClick={() => toggleSubject(subject)}
              className="flex items-center justify-between px-4 py-2.5 hover:bg-purple-50 cursor-pointer transition-colors group"
            >
              <span className={`transition-colors ${(value || []).includes(subject) ? 'text-purple-700 font-semibold' : 'text-gray-700 group-hover:text-purple-600'}`}>
                {subject}
              </span>
              <div
                className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-all ${(value || []).includes(subject)
                    ? 'bg-purple-600 border-purple-600 scale-110 shadow-sm'
                    : 'border-gray-300 group-hover:border-purple-300'
                }`}
              >
                {(value || []).includes(subject) && <Check className="w-3 h-3 text-white" />}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Hidden input for form validation */}
      <input
        type="text"
        required={required}
        value={(value || []).join(', ')}
        onChange={() => {}}
        className="sr-only"
        tabIndex={-1}
      />
    </div>
  );
}
