import React, { useMemo, useState } from "react";

import { Link } from "react-router-dom";

import { useDataLoader } from "./dataLoader";
import { SimpleLineChart } from "./LineChart";
import { objectGroupName, useQuery } from "./utils";
import { Pagination } from "./Pagination";

const DEFAULT_PAGE_LIMIT = 100;

export function HistoryPage() {
  const queryParams = useQuery();

  let pageLimit = parseInt(queryParams.get("pageLimit"));
  if (isNaN(pageLimit)) {
    pageLimit = DEFAULT_PAGE_LIMIT;
  }
  const [apiData, loading] = useDataLoader("api/history", [], true);
  const [page, setPage] = useState(0);
  const onPageUpdate = useMemo(() => {
    return (nextPage) => {
      setPage(nextPage);
    };
  }, []);

  const [search, setSearch] = useState("");
  const onSearchHistory = useMemo(() => {
    return (event) => {
      setSearch(event.target.value);
    };
  }, []);

  const data = apiData.filter((historyItem) => {
    if (search == null || search.trim() === "") {
      return true;
    }
    const groupName = objectGroupName(historyItem);
    return groupName.toLowerCase().indexOf(search.toLowerCase()) !== -1;
  });

  const totalPages = Math.ceil(data.length / pageLimit);
  const start = page * pageLimit;
  const end = Math.min(start + pageLimit, data.length);
  let showLoading = loading && data.length === 0;
  let showEmpty = !loading && data.length === 0;
  return (
    <section className="history">
      <div className="level">
        <div className="level-left">
          <div className="level-item">
            <p className="subtitle is-4">Object counts by type</p>
          </div>
          <div className="level-item">
            <input
              className="input"
              type="text"
              placeholder="Search"
              onChange={onSearchHistory}
              onKeyUp={onSearchHistory}
              value={search}
            />
          </div>
        </div>
        <div className="level-right">
          <div className="level-item">
            <Pagination
              totalPages={totalPages}
              page={page}
              onPageUpdate={onPageUpdate}
            />
          </div>
        </div>
      </div>
      {showLoading ? (
        <span className="loading">Loading history....</span>
      ) : null}
      {showEmpty ? <span className="loading">Empty history</span> : null}
      <div className={"columns is-mobile is-multiline"}>
        {data.slice(start, end).map((historyItem) => {
          const groupName = objectGroupName(historyItem);
          return (
            <div
              className={"column is-one-quarter"}
              title={groupName}
              key={groupName}
            >
              <h5 className={"title is-5"}>
                <Link to={`/objects/${groupName}`}>{groupName}</Link>
              </h5>
              <SimpleLineChart data={historyItem["counts"]} />
            </div>
          );
        })}
      </div>
      <div className="level" style={{flexDirection: "column"}}>
        <div className="level-right" style={{alignSelf: "flex-end"}}>
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
