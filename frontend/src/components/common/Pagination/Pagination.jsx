import Icons from '../Icons';
import Select from '../Select/Select';
import './Pagination.css';

const Pagination = ({
    currentPage,
    totalPages,
    onPageChange,
    totalItems = 0,
    itemName = 'Items',
    itemsPerPage = 10,
    onItemsPerPageChange,
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

    // if (totalPages <= 1) return null;

    const pages = getPageNumbers();

    return (
        <div className="pagination-wrapper">
            <div className="pagination-left">
                Total {itemName}: <span className="total-count">{totalItems}</span>
            </div>

            <div className="pagination-center">
                <button
                    className="pagination-btn nav-btn"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                >
                    <Icons.ChevronLeft size={16} />
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
                >
                    <Icons.ChevronRight size={16} />
                </button>
            </div>

            <div className="pagination-right">
                <span className="show-per-page-label">Show per Page:</span>
                <Select
                    className="per-page-select"
                    value={itemsPerPage}
                    style={{ marginTop: '20px' }}
                    onChange={(e) => onItemsPerPageChange && onItemsPerPageChange(Number(e.target.value))}
                    options={[
                        { value: 5, label: '5' },
                        { value: 10, label: '10' },
                        { value: 20, label: '20' },
                        { value: 50, label: '50' },
                        { value: 100, label: '100' }
                    ]}
                />
            </div>
        </div>
    );
};

export default Pagination;