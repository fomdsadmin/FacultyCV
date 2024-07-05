import React from "react";
import '../CustomStyles/filters.css';
import FilterButton from './FilterButton';

const filters = ['Accolades', 'Education', 'Teaching'];

const Filters = ({ activeFilters, onFilterChange }) => {
  const handleFilterClick = (filter) => {
    const newFilters = activeFilters.includes(filter)
      ? activeFilters.filter(f => f !== filter)
      : [...activeFilters, filter];
    onFilterChange(newFilters);
  };

  return (
    <div className='ml-4 mr-2 max-w-lg filters-container'>
      {filters.map((filter) => (
        <FilterButton
          key={filter}
          filter={filter}
          onClick={() => handleFilterClick(filter)}
          isActive={activeFilters.includes(filter)}
        />
      ))}
    </div>
  );
};

export default Filters;
