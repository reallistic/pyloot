import React from "react";

export function PaginationLabel({ page, goToPage, isCurrent }) {
  let className = "pagination-link";
  if (isCurrent) {
    className += " is-current";
  }
  return (
    <li tabIndex={page + 1}>
      <a
        className={className}
        aria-label={"Goto page " + (page + 1)}
        onClick={() => goToPage(page)}
      >
        {page + 1}
      </a>
    </li>
  );
}
