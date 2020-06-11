import React, { useEffect, useMemo, useState } from "react";

import { useQuery } from "./utils";
import { useDataLoader } from "./dataLoader";
import { Pagination } from "./Pagination";

const DEFAULT_PAGE_LIMIT = 100;

export function ListPage({
  url,
  listItemComponent,
  title,
  searchFilterFunc,
  loadingMessage,
  emptyMessage,
  keyFunc,
  listContainerClassName
}) {
  const queryParams = useQuery();

  let pageLimit = parseInt(queryParams.get("pageLimit"));
  if (isNaN(pageLimit)) {
    pageLimit = DEFAULT_PAGE_LIMIT;
  }
  const [apiData, loading] = useDataLoader(url, [], true);
  const [page, setPage] = useState(0);
  const onPageUpdate = useMemo(() => {
    return (nextPage) => {
      setPage(nextPage);
    };
  }, []);

  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const onSearchHistory = useMemo(() => {
    return (event) => {
      const value = event.target.value;
      console.log("calling setSearchInput", value);
      setSearchInput(value);
    };
  }, []);

  useEffect(() => {
    let searchDebounceTimeout = null;
    if (search !== searchInput) {
      console.log("searchInput/search mismatch", searchInput, search);
      searchDebounceTimeout = setTimeout(() => {
        console.log("calling setSearch", searchInput);
        setSearch(searchInput);
        searchDebounceTimeout = null;
      }, 1000);
    }
    return () => {
      if (searchDebounceTimeout != null) {
        console.log("clearing searchDebounceTimeout");
        clearTimeout(searchDebounceTimeout);
      }
    };
  }, [search, searchInput]);

  const data = apiData.filter((item, index) => {
    if (search == null || search.trim() === "") {
      return true;
    }
    return searchFilterFunc(search, item, index);
  });

  const totalPages = Math.ceil(data.length / pageLimit);
  const start = page * pageLimit;
  const end = Math.min(start + pageLimit, data.length);
  const dataSlice = data.slice(start, end);

  let showLoading = loading && data.length === 0;
  let showEmpty = !loading && dataSlice.length === 0;
  return (
    <section className="list-page">
        <progress
          className="progress is-small is-info"
          style={{ visibility: loading ? "visible" : "hidden", marginBottom: "0.25rem" }}
          max="100"
        >
          Loading
        </progress>
      <div className="level">
        <div className="level-left">
          <div className="level-item">
            <p className="subtitle is-4">{title}</p>
          </div>
          <div className="level-item">
            <input
              className="input"
              type="text"
              placeholder="Search"
              onChange={onSearchHistory}
              onKeyUp={onSearchHistory}
              value={searchInput}
            />
          </div>
        </div>
        <div className="level-right">
          <div className="level-item">
            <small>
              {Math.min(start + 1, data.length)}-{start + dataSlice.length} of{" "}
              {data.length}
            </small>
            &nbsp;
            <Pagination
              totalPages={totalPages}
              page={page}
              onPageUpdate={onPageUpdate}
            />
          </div>
        </div>
      </div>
      {showLoading ? (
        <span className="loading">
          {loadingMessage || "Loading history...."}
        </span>
      ) : null}
      {showEmpty ? (
        <span className="loading">{emptyMessage || "Empty history"}</span>
      ) : null}
      <div className={listContainerClassName}>
        {dataSlice.map((item, index) =>
          React.createElement(listItemComponent, {
            item,
            index,
            key: (keyFunc && keyFunc(item)) || index,
          })
        )}
      </div>
      <div className="level" style={{ flexDirection: "column" }}>
        <div className="level-right" style={{ alignSelf: "flex-end" }}>
          <div className="level-item">
            <Pagination
              totalPages={totalPages}
              page={page}
              onPageUpdate={onPageUpdate}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
