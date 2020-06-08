import React from "react";

import { Link, useParams } from "react-router-dom";

import { ellipsisText, objectGroupName, timeAgo, useApi } from "./utils";
import { ObjectItem } from "./ObjectItem";

export function ObjectPage() {
  const { objectId } = useParams();
  const [objectItem, objectItemFetchError, isObjectItemLoading] = useApi(
    `api/objects/${objectId}`,
    null
  );
  const [parents, parentsFetchError, isParentsLoading] = useApi(
    `api/objects/${objectId}/parents`,
    []
  );
  const [children, childrenFetchError, isChildrenLoading] = useApi(
    `api/objects/${objectId}/children`,
    []
  );

  const showLoading =
    isObjectItemLoading && objectItem == null && objectItemFetchError == null;
  const showNotFound =
    !isObjectItemLoading && objectItem == null && objectItemFetchError == null;
  const showError =
    !isObjectItemLoading && objectItem == null && objectItemFetchError != null;
  console.log({
    objectId,
    objectItem,
    parents,
    children,
    objectItemFetchError,
    parentsFetchError,
    childrenFetchError,
    showLoading,
    showNotFound,
    showError,
  });

  if (showLoading) {
    return (
      <section className="object">
        <div className="level">
          <div className="level-left">
            <div className="level-item">
              <p className="subtitle is-4">
                <strong>Loading {objectId}</strong>
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (showNotFound) {
    return (
      <section className="object">
        <div className="level">
          <div className="level-left">
            <div className="level-item">
              <p className="subtitle is-4">
                <strong>
                  Object with id `{objectId}` is no longer available
                </strong>
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (showError) {
    return (
      <section className="object">
        <div className="level">
          <div className="level-left">
            <div className="level-item">
              <p className="subtitle is-4">
                <strong>Error loading Object with id `{objectId}`</strong>
              </p>
            </div>
          </div>
        </div>
        <code>{objectItemFetchError.text}</code>
      </section>
    );
  }

  const title = `<${objectItem["id"]}> ${objectItem["type_name"]}`;
  const groupName = objectGroupName(objectItem);
  return (
    <section className="object">
      <div className="container">
        <p className="title is-2">{objectItem["obj_name"]}</p>
        <p>
          <Link to={`/objects/${groupName}`}>{groupName}</Link> | first seen:{" "}
          {timeAgo(objectItem["seen"])} | parents:{" "}
          {objectItem["parent_ids"].length} | children:{" "}
          {objectItem["child_ids"].length}
        </p>
      </div>
      <div className="container">
        <p className="title is-3">Attributes</p>
        <div className="content">
          <ul>
            {Object.keys(objectItem["attrs"]).map((key) => {
              return (
                <li key={key}>
                  <code>
                    {key}: {objectItem["attrs"][key]}
                  </code>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      <div className={"container"}>
        <p className="title is-3">__repr__</p>
        <code>{objectItem["repr"]}</code>
      </div>
      <div className="tile is-ancestor">
        <div className="tile is-vertical is-parent is-6">
          <div className="tile is-child box">
            <p className={"title"}>Parents</p>
            {isParentsLoading ? (
              <span className="loading">Loading parents....</span>
            ) : null}
            {!isParentsLoading && parents.length === 0 ? (
              <span className="loading">No Parents</span>
            ) : null}
            <div className="media-items">
              {parents.map((objectItem) => (
                <ObjectItem objectItem={objectItem} key={objectItem["id"]} />
              ))}
            </div>
          </div>
        </div>

        <div className="tile is-vertical is-parent is-6">
          <div className="tile is-child box">
            <p className="title">Children</p>
            {isChildrenLoading ? (
              <span className="loading">Loading children....</span>
            ) : null}
            {!isChildrenLoading && children.length === 0 ? (
              <span className="loading">No Children</span>
            ) : null}
            <div className="media-items">
              {children.map((objectItem) => (
                <ObjectItem objectItem={objectItem} key={objectItem["id"]} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
