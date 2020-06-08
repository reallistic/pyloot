import React, { useMemo } from "react";
import { PaginationLabel } from "./PaginationLabel";

export function Pagination({ page, totalPages, onPageUpdate }) {
  const pagePrevDisabled = page <= 0;
  const pageNextDisabled = page >= totalPages - 1;
  const labels = useMemo(() => {
    if (totalPages <= 0) {
      return null;
    }

    const lastPage = totalPages - 1;
    const halfWayPoint = Math.round(totalPages / 2);
    let pageLinks = [0];

    if (totalPages > 2 && totalPages <= 5) {
      for (let i = 0; i < totalPages - 2; i++) {
        pageLinks.push(i + 1);
      }
    } else if (totalPages > 5) {
      const newLinks = [halfWayPoint - 1, halfWayPoint, halfWayPoint + 1];
      if (page > 0 && page < newLinks[0]) {
        pageLinks.push(page);
      }
      pageLinks = pageLinks.concat(newLinks);
      if (page > newLinks[2] && page < lastPage) {
        pageLinks.push(page);
      }
    }

    if (lastPage > 0) {
      pageLinks.push(lastPage);
    }

    return pageLinks.map((idx) => (
      <PaginationLabel
        key={idx}
        page={idx}
        goToPage={() => onPageUpdate(idx)}
        isCurrent={page === idx}
      />
    ));
  }, [page, totalPages]);

  const onPageNext = useMemo(() => {
    if (pageNextDisabled) {
      return null;
    }
    return () => onPageUpdate(page + 1);
  }, [page, pageNextDisabled, onPageUpdate])

  const onPagePrev = useMemo(() => {
    if (pagePrevDisabled) {
      return null;
    }
    return () => onPageUpdate(page - 1);
  }, [page, pagePrevDisabled, onPageUpdate])

  return (
    <nav className="pagination" role="navigation" aria-label="pagination">
      <a
        className="pagination-previous"
        onClick={onPagePrev}
        aria-disabled={pagePrevDisabled}
        disabled={pagePrevDisabled}
      >
        {"<"}
      </a>
      <a
        className="pagination-next"
        onClick={onPageNext}
        aria-disabled={pageNextDisabled}
        disabled={pageNextDisabled}
      >
        {">"}
      </a>
      <ul className="pagination-list">{labels}</ul>
    </nav>
  );
}
