'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';

interface ProjectFiltersProps {
  categories: string[];
  technologies: string[];
  onSearchChange: (search: string) => void;
  onCategoryChange: (category: string) => void;
  onTechnologiesChange: (techs: string[]) => void;
  onBudgetChange: (min: number, max: number) => void;
  selectedCategory: string;
  selectedTechnologies: string[];
  selectedBudgetMin: number;
  selectedBudgetMax: number;
}

const BUDGET_PRESETS = [
  { label: 'Toate', min: 0, max: 999999 },
  { label: '500 - 2,000 lei', min: 500, max: 2000 },
  { label: '2,000 - 5,000 lei', min: 2000, max: 5000 },
  { label: '5,000 - 10,000 lei', min: 5000, max: 10000 },
  { label: '10,000+ lei', min: 10000, max: 999999 },
];

export function ProjectFilters({
  categories,
  technologies,
  onSearchChange,
  onCategoryChange,
  onTechnologiesChange,
  onBudgetChange,
  selectedCategory,
  selectedTechnologies,
  selectedBudgetMin,
  selectedBudgetMax,
}: ProjectFiltersProps) {
  const [search, setSearch] = useState('');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [categorySearch, setCategorySearch] = useState('');
  const [techSearch, setTechSearch] = useState('');

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    onSearchChange(value);
  };

  const filteredCategories = categories.filter((cat) =>
    cat.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const filteredTechs = technologies.filter((tech) =>
    tech.toLowerCase().includes(techSearch.toLowerCase())
  );

  const handleTechToggle = (tech: string) => {
    const updated = selectedTechnologies.includes(tech)
      ? selectedTechnologies.filter((t) => t !== tech)
      : [...selectedTechnologies, tech];
    onTechnologiesChange(updated);
  };

  return (
    <div className="bg-white/90 border-b border-slate-200 sticky top-16 z-40 shadow-sm backdrop-blur dark:bg-[#0B1220]/90 dark:border-[#1E2A3D]">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex flex-col lg:flex-row gap-4 mb-4">
          <div className="flex-1 relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-[#7C8799]"
              size={18}
            />
            <input
              type="text"
              placeholder="Caută proiecte..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-green focus:ring-2 focus:ring-emerald-green/20 text-slate-700 bg-white dark:bg-[#0F172A] dark:text-[#E6EDF3] dark:border-[#1E2A3D]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative" ref={openDropdown === 'category' ? dropdownRef : undefined}>
            <button
              onClick={() => setOpenDropdown(openDropdown === 'category' ? null : 'category')}
              className="w-full flex items-center justify-between px-4 py-2.5 border border-slate-200 rounded-lg bg-white text-left text-slate-700 hover:border-emerald-green transition-colors dark:bg-[#0F172A] dark:text-[#E6EDF3] dark:border-[#1E2A3D]"
            >
              <span className="text-sm font-medium">
                {selectedCategory === 'Toate' ? 'Categorie' : selectedCategory}
              </span>
              <ChevronDown
                size={18}
                className={`text-slate-400 transition-transform dark:text-[#7C8799] ${
                  openDropdown === 'category' ? 'rotate-180' : ''
                }`}
              />
            </button>

            {openDropdown === 'category' && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-lg z-50 dark:bg-[#0B1220] dark:border-[#1E2A3D]">
                <input
                  type="text"
                  placeholder="Caută..."
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  className="w-full px-4 py-2 border-b border-slate-200 text-sm focus:outline-none bg-white text-slate-700 dark:bg-[#0F172A] dark:text-[#E6EDF3] dark:border-[#1E2A3D]"
                />
                <div className="max-h-60 overflow-y-auto">
                  {filteredCategories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => {
                        onCategoryChange(cat);
                        setOpenDropdown(null);
                        setCategorySearch('');
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors dark:hover:bg-[#111B2D] ${
                        selectedCategory === cat
                          ? 'bg-emerald-50 text-emerald-700 font-medium dark:bg-[#0F2E25] dark:text-[#7BF1B8]'
                          : 'text-slate-700 dark:text-[#E6EDF3]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="relative" ref={openDropdown === 'tech' ? dropdownRef : undefined}>
            <button
              onClick={() => setOpenDropdown(openDropdown === 'tech' ? null : 'tech')}
              className="w-full flex items-center justify-between px-4 py-2.5 border border-slate-200 rounded-lg bg-white text-left text-slate-700 hover:border-emerald-green transition-colors dark:bg-[#0F172A] dark:text-[#E6EDF3] dark:border-[#1E2A3D]"
            >
              <span className="text-sm font-medium">
                {selectedTechnologies.length === 0
                  ? 'Tehnologii'
                  : `${selectedTechnologies.length} selectate`}
              </span>
              <ChevronDown
                size={18}
                className={`text-slate-400 transition-transform dark:text-[#7C8799] ${
                  openDropdown === 'tech' ? 'rotate-180' : ''
                }`}
              />
            </button>

            {openDropdown === 'tech' && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-lg z-50 dark:bg-[#0B1220] dark:border-[#1E2A3D]">
                <input
                  type="text"
                  placeholder="Caută..."
                  value={techSearch}
                  onChange={(e) => setTechSearch(e.target.value)}
                  className="w-full px-4 py-2 border-b border-slate-200 text-sm focus:outline-none bg-white text-slate-700 dark:bg-[#0F172A] dark:text-[#E6EDF3] dark:border-[#1E2A3D]"
                />
                <div className="max-h-60 overflow-y-auto">
                  {filteredTechs.map((tech) => (
                    <label
                      key={tech}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-[#111B2D] cursor-pointer text-sm text-slate-700 dark:text-[#E6EDF3]"
                    >
                      <input
                        type="checkbox"
                        checked={selectedTechnologies.includes(tech)}
                        onChange={() => handleTechToggle(tech)}
                        className="w-4 h-4 rounded border-slate-300 text-emerald-green cursor-pointer"
                      />
                      {tech}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="relative" ref={openDropdown === 'budget' ? dropdownRef : undefined}>
            <button
              onClick={() => setOpenDropdown(openDropdown === 'budget' ? null : 'budget')}
              className="w-full flex items-center justify-between px-4 py-2.5 border border-slate-200 rounded-lg bg-white text-left text-slate-700 hover:border-emerald-green transition-colors dark:bg-[#0F172A] dark:text-[#E6EDF3] dark:border-[#1E2A3D]"
            >
              <span className="text-sm font-medium">Buget</span>
              <ChevronDown
                size={18}
                className={`text-slate-400 transition-transform dark:text-[#7C8799] ${
                  openDropdown === 'budget' ? 'rotate-180' : ''
                }`}
              />
            </button>

            {openDropdown === 'budget' && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-lg z-50 dark:bg-[#0B1220] dark:border-[#1E2A3D]">
                {BUDGET_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => {
                      onBudgetChange(preset.min, preset.max);
                      setOpenDropdown(null);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors dark:hover:bg-[#111B2D] ${
                      selectedBudgetMin === preset.min && selectedBudgetMax === preset.max
                        ? 'bg-emerald-50 text-emerald-700 font-medium dark:bg-[#0F2E25] dark:text-[#7BF1B8]'
                        : 'text-slate-700 dark:text-[#E6EDF3]'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedTechnologies.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-lg border border-emerald-200 dark:bg-[#0F2E25] dark:border-[#1E4A3A]">
              <span className="text-sm font-medium text-emerald-700 flex-1 dark:text-[#7BF1B8]">
                {selectedTechnologies.length} filtre active
              </span>
              <button
                onClick={() => onTechnologiesChange([])}
                className="text-emerald-600 hover:text-emerald-700 dark:text-[#7BF1B8]"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
