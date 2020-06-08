import { useEffect, useState } from "react";

import { fetchJson } from "./utils";

export function useDataLoader(url, initialData, initialLoading) {
  if (initialData === undefined) {
    initialData = null;
  }
  if (initialLoading === undefined) {
    initialLoading = false;
  }

  const [loading, setLoading] = useState(initialLoading);
  const [data, setData] = useState(initialData);
  useEffect(() => {
    setLoading(initialLoading);
    setData(initialData);
    const dataLoader = new DataLoader(
      url,
      (data) => {
        setData(data);
        setLoading(false);
      },
      () => setLoading(false),
      () => setLoading(true)
    );
    dataLoader.start();

    return () => {
      dataLoader.stop();
    };
  }, [url]);

  return [data, loading];
}

export class DataLoader {
  constructor(url, onData, onError, onLoading) {
    this.url = url;
    this.active = false;
    this.loading = false;
    this.onData = onData;
    this.onError = onError;
    this.onLoading = onLoading;
    this.timer = null;
    this.data = null;
  }

  log(...messages) {
    console.log(`<DataLoader url=${this.url}>`, ...messages);
  }

  fetchData() {
    if (this.loading) {
      this.log("Already loading data");
      return Promise.reject();
    }

    this.log("Loading data");
    this.loading = true;
    this.onLoading && this.onLoading();
    return fetchJson(this.url).then((data) => {
      this.loading = false;
      this.data = data;
      return data;
    });
  }

  start() {
    this.active = true;
    this.update();
  }

  stop() {
    this.active = false;
    if (this.timer != null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.data = null;
  }

  update() {
    if (!this.active) {
      return;
    }
    this.fetchData().then(
      (data) => {
        if (this.active) {
          this.log("Received data, calling onSuccess");
          this.onData && this.onData(data);
          this.timer = setTimeout(this.update.bind(this), 30 * 1000);
        }
      },
      (error) => {
        if (this.active) {
          this.log("retrying data fetch later");
          this.onError && this.onError(error);
          this.timer = setTimeout(this.update.bind(this), 30 * 1000);
        }
      }
    );
  }
}
