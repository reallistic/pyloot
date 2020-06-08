import React, { useMemo, useState } from "react";

import { useParams } from "react-router-dom";

import { useQuery } from "./utils";
import { useDataLoader } from "./dataLoader";
import { Pagination } from "./Pagination";
import { ObjectItem } from "./ObjectItem";

const DEFAULT_PAGE_LIMIT = 100;
const DEFAULT_FETCH_LIMIT = 10000;

export function ObjectsPage() {
  const queryParams = useQuery();

  let pageLimit = parseInt(queryParams.get("pageLimit"));
  if (isNaN(pageLimit)) {
    pageLimit = DEFAULT_PAGE_LIMIT;
  }

  let fetchLimit = parseInt(queryParams.get("fetchLimit"));
  if (isNaN(fetchLimit)) {
    fetchLimit = DEFAULT_FETCH_LIMIT;
  } else if (fetchLimit <= 0) {
    fetchLimit = null; // disable limit only if explicitly disabled
  }

  const { objectGroup } = useParams();
  let url = "api/objects";
  let sep = "?";
  if (objectGroup) {
    url += `?group=${objectGroup}`;
    sep = "&";
  }
  if (fetchLimit != null) {
    url += `${sep}limit=${fetchLimit}`;
  }
  const [data, loading] = useDataLoader(url, [], true);
  const [page, setPage] = useState(0);
  const onPageUpdate = useMemo(() => {
    return (nextPage) => {
      setPage(nextPage);
    };
  }, []);

  const totalPages = Math.ceil(data.length / pageLimit);
  const start = page * pageLimit;
  const end = Math.min(start + pageLimit, data.length);
  const showLoading = loading && data.length === 0;
  const showEmpty = !loading && data.length === 0;

  return (
    <section className="objects">
      <div className="level">
        <div className="level-left">
          <div className="level-item">
            <p className="subtitle is-4">
              {pageLimit} <span className="sort">oldest</span>
              {objectGroup ? (
                <span className="group-name">{" "}{objectGroup}</span>
              ) : null}
              {" "}objects
            </p>
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
        <span className="loading">Loading objects....</span>
      ) : null}
      {showEmpty ? <span className="loading">Empty objects</span> : null}
      <div className="media-items">
        {data.slice(start, end).map((objectItem) => (
          <ObjectItem objectItem={objectItem} key={objectItem["id"]} />
        ))}
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
