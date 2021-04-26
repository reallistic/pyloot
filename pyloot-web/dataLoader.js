import { useEffect, useState } from "react";

import { fetchJson, getErrorMessage } from "./utils";

export function useDataLoader(url, initialData, initialLoading) {
  if (initialData === undefined) {
    initialData = null;
  }
  if (initialLoading === undefined) {
    initialLoading = false;
  }

  const [loading, setLoading] = useState(initialLoading);
  const [data, setData] = useState(initialData);
  const [error, setError] = useState(null);
  useEffect(() => {
    setLoading(initialLoading);
    setData(initialData);
    const dataLoader = new DataLoader(
      url,
      (data) => {
        setError(null);
        setData(data);
        setLoading(false);
      },
      (error) => {
          setLoading(false);
          setError(error);
      },
      () => setLoading(true)
    );
    dataLoader.start();

    return () => {
      dataLoader.stop();
    };
  }, [url]);

  return [data, error, loading];
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

  error(...messages) {
    console.error(`<DataLoader url=${this.url}>`, ...messages);
  }

  fetchData() {
    if (this.loading) {
      this.log("Already loading data");
      return Promise.reject();
    }

    this.log("Loading data");
    this.loading = true;
    this.onLoading && this.onLoading();
    return fetchJson(this.url).then(
      (data) => {
        this.loading = false;
        this.data = data;
        return data;
      },
      (error) => {
        this.loading = false;
        throw error;
      }
    );
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
          const errorMessage = getErrorMessage(error);
          this.error("retrying data fetch later", errorMessage);
          this.onError && this.onError(errorMessage);
          this.timer = setTimeout(this.update.bind(this), 30 * 1000);
        }
      }
    );
  }
}
