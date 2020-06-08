import React from "react";

import { Link } from "react-router-dom";

import { ellipsisText, objectGroupName, timeAgo } from "./utils";

export function ObjectItem({ objectItem }) {
  const title = `<${objectItem["id"]}> ${objectItem["type_name"]}`;
  const groupName = objectGroupName(objectItem);
  return (
    <article className="media" title={title}>
      <div className="content">
        <p>
          <strong>{objectItem["obj_name"]}</strong>{" "}
          <small>
            <Link to={`/objects/${groupName}/${objectItem["id"]}`}>{objectItem["id"]}</Link>
            {" "}|{" "}
            <Link to={`/objects/${groupName}`}>{groupName}</Link>
          </small>
          <br />
          <code>{ellipsisText(objectItem["repr"], 400)}</code>
          <br />
          first seen: {timeAgo(objectItem["seen"])} | parents:{" "}
          {objectItem["parent_ids"].length} | children:{" "}
          {objectItem["child_ids"].length}
        </p>
      </div>
    </article>
  );
}
