const getPageItems = (currentPage, lastPage) => {
  // Show ~5 pages: current +/- 2, plus first/last when needed.
  // Keep ellipsis when there are big gaps.
  if (lastPage <= 7) {
    return Array.from({ length: lastPage }, (_, index) => index + 1);
  }

  const visibleWindow = 5;
  const half = Math.floor(visibleWindow / 2); // 2 for window=5

  let start = currentPage - half;
  let end = currentPage + half;

  // Keep space for first(1) and last(lastPage)
  start = Math.max(2, start);
  end = Math.min(lastPage - 1, end);

  // If we trimmed one side, try to rebalance to keep ~5 pages in the middle.
  const windowSize = end - start + 1;
  if (windowSize < visibleWindow) {
    const missing = visibleWindow - windowSize;
    start = Math.max(2, start - missing);
    end = Math.min(lastPage - 1, end + missing);
  }

  const middlePages = [];
  for (let p = start; p <= end; p += 1) middlePages.push(p);

  const basePages = [
    1,
    ...middlePages.filter((p) => p !== 1 && p !== lastPage),
    lastPage,
  ];

  const pages = [...new Set(basePages)].filter(
    (p) => p >= 1 && p <= lastPage,
  );
  pages.sort((a, b) => a - b);

  const withEllipsis = [];
  pages.forEach((page, index) => {
    if (index > 0 && page - pages[index - 1] > 1) {
      withEllipsis.push("...");
    }
    withEllipsis.push(page);
  });

  return withEllipsis;
};

export default function Pagination({
  currentPage,
  total,
  perPage,
  onPageChange,
  isLoading = false,
}) {
  const lastPage = Math.max(1, Math.ceil((total || 0) / (perPage || 1)));
  const pageItems = getPageItems(currentPage, lastPage);
  const isFirstPage = currentPage <= 1;
  const isLastPage = currentPage >= lastPage;

  const buttonClass =
    "min-w-10 px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-200 disabled:hover:text-gray-500";

  return (
    <div className="mt-6 flex flex-wrap justify-center items-center gap-2 pb-6">
      <button
        type="button"
        disabled={isLoading || isFirstPage}
        onClick={() => onPageChange(currentPage - 1)}
        className={`${buttonClass} bg-gray-200 text-gray-700 hover:bg-[#107a8b] hover:text-white`}
      >
        Previous
      </button>

      {pageItems.map((item, index) =>
        item === "..." ? (
          <span
            key={`ellipsis-${index}`}
            className="px-2 py-2 text-sm text-gray-500"
          >
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            disabled={isLoading}
            onClick={() => onPageChange(item)}
            className={`${buttonClass} ${
              item === currentPage
                ? "bg-[#107a8b] text-white"
                : "bg-gray-200 text-gray-700 hover:bg-[#107a8b] hover:text-white"
            }`}
          >
            {item}
          </button>
        )
      )}

      <button
        type="button"
        disabled={isLoading || isLastPage}
        onClick={() => onPageChange(currentPage + 1)}
        className={`${buttonClass} bg-gray-200 text-gray-700 hover:bg-[#107a8b] hover:text-white`}
      >
        Next
      </button>
    </div>
  );
}
