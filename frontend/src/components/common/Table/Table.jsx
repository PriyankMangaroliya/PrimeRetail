import React, { useState, useMemo, useEffect } from 'react';
import Pagination from '../Pagination/Pagination';
import './Table.css';

const Table = ({ columns, data = [], className = '', searchable = true, columnSearchable = false, itemsPerPage = 10 }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [columnSearch, setColumnSearch] = useState({});
    const [currentPage, setCurrentPage] = useState(1);

    // Filter data based on search term and column search
    const filteredData = useMemo(() => {
        let result = data;

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

        return result;
    }, [data, searchTerm, columnSearch, columns, columnSearchable]);

    // Pagination logic
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredData.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredData, currentPage, itemsPerPage]);

    // Reset page to 1 when search terms or data changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, columnSearch, data]);

    const handlePageChange = (page) => {
        setCurrentPage(page);
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
                        {columns.map((column, index) => (
                            <th key={`header-title-${index}`}>{column.title}</th>
                        ))}
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
                <div className="pagination-info">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} entries
                </div>
                <Pagination 
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                />
            </div>
        </div>
    );
};

export default Table;