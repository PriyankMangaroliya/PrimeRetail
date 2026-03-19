import React from 'react';
import './Pagination.css';

const Pagination = ({
                        currentPage,
                        totalPages,
                        onPageChange,
                        siblingCount = 1
                    }) => {
    const getPageNumbers = () => {
        const pages = [];

        pages.push(1);

        for (let i = Math.max(2, currentPage - siblingCount);
             i <= Math.min(totalPages - 1, currentPage + siblingCount);
             i++) {
            if (i === 2 && pages[pages.length - 1] !== 1) {
                pages.push('...');
            }
            pages.push(i);
        }

        if (totalPages > 1) {
            if (pages[pages.length - 1] !== totalPages - 1 && totalPages > 2) {
                pages.push('...');
            }
            pages.push(totalPages);
        }

        return pages;
    };

    return (
        <div className="pagination">
            <button
                className="pagination-btn"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
            >
                Previous
            </button>

            {getPageNumbers().map((page, index) => (
                <button
                    key={index}
                    className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                    onClick={() => typeof page === 'number' && onPageChange(page)}
                    disabled={typeof page !== 'number'}
                >
                    {page}
                </button>
            ))}

            <button
                className="pagination-btn"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
            >
                Next
            </button>
        </div>
    );
};

export default Pagination;