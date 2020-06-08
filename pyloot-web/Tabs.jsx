import React from "react";

import { Link, useLocation} from "react-router-dom";

export function Tabs() {
  const location = useLocation()
  return (
    <div className="tabs is-boxed">
      <ul>
        <li className={location.pathname === "/" ? "is-active" : ""}>
          <Link to={"/"}>History</Link>
        </li>
        <li className={location.pathname.startsWith("/objects") ? "is-active": ""}>
          <Link to={"/objects?fetchLimit=10000&pageLimit=100"}>Objects</Link>
        </li>
      </ul>
    </div>
  )

}