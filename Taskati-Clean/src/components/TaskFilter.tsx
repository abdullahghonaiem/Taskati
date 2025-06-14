import { useState } from 'react';

export type FilterOption = 'all' | 'pending' | 'completed';

interface TaskFilterProps {
  onFilterChange: (filter: FilterOption) => void;
  activeFilter: FilterOption;
}

export default function TaskFilter({ onFilterChange, activeFilter }: TaskFilterProps) {
  const filters: { value: FilterOption; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'completed', label: 'Completed' },
  ];

  return (
    <div className="task-filter">
      <div className="filter-options">
        {filters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => onFilterChange(filter.value)}
            className={`filter-option ${activeFilter === filter.value ? 'active' : ''}`}
          >
            {filter.label}
          </button>
        ))}
      </div>
    </div>
  );
} 