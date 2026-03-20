import React from 'react';
import Icons from '../Icons';
import './Pagination.css';

const Pagination = ({
    currentPage,
    totalPages,
    onPageChange,
    siblingCount = 1
}) => {
    const getPageNumbers = () => {
        const pages = [];
        const totalNumbers = siblingCount * 2 + 3; // siblingCount * 2 + currentPage + ellipsis + lastPage

        if (totalPages <= totalNumbers) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
            return pages;
        }

        const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
        const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

        const shouldShowLeftDots = leftSiblingIndex > 2;
        const shouldShowRightDots = rightSiblingIndex < totalPages - 2;

        if (!shouldShowLeftDots && shouldShowRightDots) {
            let leftItemCount = 3 + 2 * siblingCount;
            let leftRange = [];
            for (let i = 1; i <= leftItemCount; i++) {
                leftRange.push(i);
            }
            return [...leftRange, '...', totalPages];
        }

        if (shouldShowLeftDots && !shouldShowRightDots) {
            let rightItemCount = 3 + 2 * siblingCount;
            let rightRange = [];
            for (let i = totalPages - rightItemCount + 1; i <= totalPages; i++) {
                rightRange.push(i);
            }
            return [1, '...', ...rightRange];
        }

        if (shouldShowLeftDots && shouldShowRightDots) {
            let middleRange = [];
            for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
                middleRange.push(i);
            }
            return [1, '...', ...middleRange, '...', totalPages];
        }
    };

    if (totalPages <= 1) return null;

    const pages = getPageNumbers();

    return (
        <div className="pagination-wrapper">
            <div className="pagination-container">
                <button
                    className="pagination-btn nav-btn"
                    onClick={() => onPageChange(1)}
                    disabled={currentPage === 1}
                    title="First Page"
                >
                    <Icons.ChevronsLeft size={18} />
                </button>
                <button
                    className="pagination-btn nav-btn"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    title="Previous Page"
                >
                    <Icons.ChevronLeft size={18} />
                </button>

                <div className="pagination-numbers">
                    {pages.map((page, index) => (
                        <button
                            key={index}
                            className={`pagination-btn number-btn ${currentPage === page ? 'active' : ''} ${page === '...' ? 'dots' : ''}`}
                            onClick={() => typeof page === 'number' && onPageChange(page)}
                            disabled={page === '...'}
                        >
                            {page}
                        </button>
                    ))}
                </div>

                <button
                    className="pagination-btn nav-btn"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    title="Next Page"
                >
                    <Icons.ChevronRight size={18} />
                </button>
                <button
                    className="pagination-btn nav-btn"
                    onClick={() => onPageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    title="Last Page"
                >
                    <Icons.ChevronsRight size={18} />
                </button>
            </div>
            <div className="pagination-info-text">
                Page {currentPage} of {totalPages}
            </div>
        </div>
    );
};

export default Pagination;