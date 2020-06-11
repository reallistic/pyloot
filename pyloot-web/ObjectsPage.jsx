import React from "react";

import { useParams } from "react-router-dom";

import { objectGroupName, useQuery } from "./utils";
import { ObjectItem } from "./ObjectItem";
import { ListPage } from "./ListPage";

const DEFAULT_FETCH_LIMIT = 10000;

function ObjectsPageItem({ item }) {
  return <ObjectItem objectItem={item} key={item["id"]} />;
}

function objectItemKey(item) {
  return item["id"];
}

function objectsSearchFunction(search, item) {
  const searchContextList = [
    objectGroupName(item),
    item["repr"],
    item["obj_name"],
  ];
  const searchContext = searchContextList.join("").toLowerCase();
  return searchContext.toLowerCase().indexOf(search.toLowerCase()) !== -1;
}

export function ObjectsPage() {
  const queryParams = useQuery();

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

  return (
    <ListPage
      title={objectGroup ? objectGroup : "All objects"}
      emptyMessage="No objects to show. Maybe loosen the search?"
      listItemComponent={ObjectsPageItem}
      loadingMessage="Loading objects...."
      searchFilterFunc={objectsSearchFunction}
      url={url}
      keyFunc={objectItemKey}
      listContainerClassName="media-items"
    />
  );
}
