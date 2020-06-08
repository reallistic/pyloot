import "bulma/css/bulma.css";

import React from "react";
import ReactDOM from "react-dom";

import { HashRouter, Route, Switch } from "react-router-dom";

import { HistoryPage } from "./HistoryPage";
import { ObjectsPage } from "./ObjectsPage";
import { Tabs } from "./Tabs";
import { ObjectPage } from "./ObjectPage";

export function App() {
  return (
    <HashRouter>
      <Tabs />
      <section className="section app" style={{ paddingTop: 0 }}>
        <Switch>
          <Route path={"/objects/:objectGroup/:objectId"} component={ObjectPage} />
          <Route path={"/objects/:objectGroup"} component={ObjectsPage} />
          <Route path={"/objects"} component={ObjectsPage} />
          <Route exact={true} path={"/"} component={HistoryPage} />
        </Switch>
      </section>
    </HashRouter>
  );
}

document.addEventListener("DOMContentLoaded", function () {
  const wrapper = document.getElementById("app");
  ReactDOM.render(<App />, wrapper);
});
