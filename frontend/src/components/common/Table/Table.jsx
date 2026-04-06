import React, { useState, useMemo, useEffect } from 'react';
import Pagination from '../Pagination/Pagination';
import Icons from '../Icons';
import './Table.css';

const Table = ({ 
    columns, 
    data = [], 
    className = '', 
    searchable = true, 
    columnSearchable = false, 
    initialItemsPerPage = 10,
    itemName = 'Items',
    initialSort = null,
    enableDefaultSort = true
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [columnSearch, setColumnSearch] = useState({});
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);
    
    // Sort configuration: { key, direction }.
    const [sortConfig, setSortConfig] = useState(() => {
        if (initialSort) return initialSort;
        
        if (enableDefaultSort) {
            // Default to first non-action/index column
            const firstSortableColumn = columns.find(col => 
                col.key !== 'actions' && col.key !== 'index' && col.title !== 'No'
            );
            return firstSortableColumn ? { key: firstSortableColumn.key, direction: 'asc' } : { key: '', direction: 'asc' };
        }
        
        return { key: '', direction: 'asc' };
    });

    const handleSort = (key, column) => {
        if (key === 'actions' || key === 'index' || column.title === 'No') return;
        
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // Filter and Sort data
    const sortedFilteredData = useMemo(() => {
        let result = [...data];

        // 1. Search Filter
        if (searchTerm) {
            const lowerCaseTerm = searchTerm.toLowerCase();
            result = result.filter(row => {
                return columns.some(col => {
                    const value = row[col.key];
                    if (value === null || value === undefined) return false;
                    if (col.key === 'actions' || col.key === 'index' || col.title === 'No') return false;
                    return String(value).toLowerCase().includes(lowerCaseTerm);
                });
            });
        }

        // 2. Column Search Filter
        if (columnSearchable && Object.keys(columnSearch).length > 0) {
            result = result.filter(row => {
                return Object.entries(columnSearch).every(([key, term]) => {
                    if (!term) return true;
                    const column = columns.find(c => c.key === key);
                    if (key === 'actions' || key === 'index' || (column && column.title === 'No')) return true;
                    
                    const value = row[key];
                    if (value === null || value === undefined) return false;
                    return String(value).toLowerCase().includes(term.toLowerCase());
                });
            });
        }

        // 3. Sorting
        if (sortConfig.key) {
            result.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];

                if (aValue === bValue) return 0;
                
                // Handle null/undefined
                if (aValue === null || aValue === undefined) return 1;
                if (bValue === null || bValue === undefined) return -1;

                // Handle numbers
                if (typeof aValue === 'number' && typeof bValue === 'number') {
                    return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
                }

                // Handle strings (case-insensitive)
                const aStr = String(aValue).toLowerCase();
                const bStr = String(bValue).toLowerCase();
                
                if (sortConfig.direction === 'asc') {
                    return aStr.localeCompare(bStr);
                } else {
                    return bStr.localeCompare(aStr);
                }
            });
        }

        return result;
    }, [data, searchTerm, columnSearch, columns, columnSearchable, sortConfig]);

    // Pagination logic
    const totalPages = Math.ceil(sortedFilteredData.length / itemsPerPage);
    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return sortedFilteredData.slice(startIndex, startIndex + itemsPerPage);
    }, [sortedFilteredData, currentPage, itemsPerPage]);

    // Reset page to 1 when filters or data changes (but not just sorting)
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, columnSearch, data]);

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const renderSortIcon = (column) => {
        if (column.key === 'actions' || column.key === 'index' || column.title === 'No') return null;
        
        if (sortConfig.key !== column.key) {
            return <Icons.Sort size={14} className="sort-icon-neutral" />;
        }
        
        return sortConfig.direction === 'asc' 
            ? <Icons.SortUp size={14} className="sort-icon-active" />
            : <Icons.SortDown size={14} className="sort-icon-active" />;
    };

    return (
        <div className={`table-container ${className}`}>
            {searchable && (
                <div className="table-header-controls">
                    <input
                        type="text"
                        className="table-search-input"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            )}
            <div className="table-responsive">
                <table className="table">
                    <thead>
                    <tr>
                        {columns.map((column, index) => {
                            const isSortable = column.key !== 'actions' && column.key !== 'index' && column.title !== 'No';
                            return (
                                <th 
                                    key={`header-title-${index}`}
                                    onClick={() => handleSort(column.key, column)}
                                    className={isSortable ? 'table-sortable-th' : ''}
                                >
                                    <div className="table-header-content">
                                        <span>{column.title}</span>
                                        {isSortable && (
                                            <span className="sort-icon-container">
                                                {renderSortIcon(column)}
                                            </span>
                                        )}
                                    </div>
                                </th>
                            );
                        })}
                    </tr>
                    {columnSearchable && (
                        <tr className="table-column-search-row">
                            {columns.map((column, index) => (
                                <th key={`header-search-${index}`} className="table-column-search-th">
                                    {column.key !== 'actions' && column.key !== 'index' && column.title !== 'No' && (
                                        <input
                                            type="text"
                                            className="table-column-search-input"
                                            placeholder={`Search ${column.title}...`}
                                            value={columnSearch[column.key] || ''}
                                            onChange={(e) => setColumnSearch({...columnSearch, [column.key]: e.target.value})}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    )}
                                </th>
                            ))}
                        </tr>
                    )}
                    </thead>
                    <tbody>
                    {paginatedData.length > 0 ? (
                        paginatedData.map((row, rowIndex) => (
                            <tr key={rowIndex}>
                                {columns.map((column, colIndex) => (
                                    <td key={colIndex}>
                                        {column.render 
                                            ? column.render(row[column.key], row, (currentPage - 1) * itemsPerPage + rowIndex) 
                                            : row[column.key]}
                                    </td>
                                ))}
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={columns.length} className="table-empty-message">
                                No data found
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>
            
            <div className="table-pagination-footer">
                <Pagination 
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    totalItems={sortedFilteredData.length}
                    itemName={itemName}
                    itemsPerPage={itemsPerPage}
                    onItemsPerPageChange={(val) => {
                        setItemsPerPage(val);
                        setCurrentPage(1);
                    }}
                />
            </div>
        </div>
    );
};

export default Table;