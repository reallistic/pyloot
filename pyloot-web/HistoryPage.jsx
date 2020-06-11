import React from "react";

import { Link } from "react-router-dom";

import { SimpleLineChart } from "./LineChart";
import { objectGroupName } from "./utils";
import { ListPage } from "./ListPage";

function historySearchFunction(search, item) {
  const groupName = objectGroupName(item);
  return groupName.toLowerCase().indexOf(search.toLowerCase()) !== -1;
}

function historyItemKey(item) {
  return objectGroupName(item);
}

function HistoryPageItem({ item }) {
  const groupName = objectGroupName(item);
  return (
    <div className={"column is-one-quarter"} title={groupName} key={groupName}>
      <h5 className={"title is-5"}>
        <Link to={`/objects/${groupName}`}>{groupName}</Link>
      </h5>
      <SimpleLineChart data={item["counts"]} />
    </div>
  );
}

export function HistoryPage() {
  return (
    <ListPage
      title="Object counts by type"
      emptyMessage="No history to show. Maybe loosen the search?"
      listItemComponent={HistoryPageItem}
      loadingMessage="Loading history...."
      searchFilterFunc={historySearchFunction}
      url="api/history"
      keyFunc={historyItemKey}
      listContainerClassName="columns is-mobile is-multiline"
    />
  );
}
