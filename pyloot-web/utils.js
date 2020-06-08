import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

export function sorted(arr, compare) {
  return Array.prototype.slice.call(arr).sort(compare);
}

export function fetchJson(url) {
  return fetch(url)
    .then((response) => {
      return response.text().then((responseText) => {
        try {
          const data = JSON.parse(responseText);
          return { response, data, text: responseText };
        } catch (e) {
          return { response, text: responseText, data: null };
        }
      });
    })
    .then(({response, data, text}) => {
      if (!response.ok) {
        throw {statusText: response.statusText, data, text};
      }
      return data || text;
    });
}

export function ellipsisText(text, limit) {
  if (text.length <= limit) {
    return text;
  }
  return text.substring(0, limit - 3) + "...";
}

export function timeAgo(time) {
  switch (typeof time) {
    case "number":
      time *= 1000;
      break;
    case "string":
      time = +new Date(time);
      break;
    case "object":
      if (time.constructor === Date) time = time.getTime();
      break;
    default:
      time = +new Date();
  }
  const time_formats = [
    [60, "seconds", 1], // 60
    [120, "1 minute ago", "1 minute from now"], // 60*2
    [3600, "minutes", 60], // 60*60, 60
    [7200, "1 hour ago", "1 hour from now"], // 60*60*2
    [86400, "hours", 3600], // 60*60*24, 60*60
    [172800, "Yesterday", "Tomorrow"], // 60*60*24*2
    [604800, "days", 86400], // 60*60*24*7, 60*60*24
    [1209600, "Last week", "Next week"], // 60*60*24*7*4*2
    [2419200, "weeks", 604800], // 60*60*24*7*4, 60*60*24*7
    [4838400, "Last month", "Next month"], // 60*60*24*7*4*2
    [29030400, "months", 2419200], // 60*60*24*7*4*12, 60*60*24*7*4
    [58060800, "Last year", "Next year"], // 60*60*24*7*4*12*2
    [2903040000, "years", 29030400], // 60*60*24*7*4*12*100, 60*60*24*7*4*12
    [5806080000, "Last century", "Next century"], // 60*60*24*7*4*12*100*2
    [58060800000, "centuries", 2903040000], // 60*60*24*7*4*12*100*20, 60*60*24*7*4*12*100
  ];
  let seconds = (+new Date() - time) / 1000,
    token = "ago",
    list_choice = 1;

  if (seconds === 0) {
    return "Just now";
  }
  if (seconds < 0) {
    seconds = Math.abs(seconds);
    token = "from now";
    list_choice = 2;
  }
  let i = 0;
  let format;
  while ((format = time_formats[i++]))
    if (seconds < format[0]) {
      if (typeof format[2] == "string") return format[list_choice];
      else
        return Math.floor(seconds / format[2]) + " " + format[1] + " " + token;
    }
  return time;
}

export function objectGroupName(item) {
  return `${item["type_module"]}.${item["type_name"]}`;
}

export function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export function useApi(url, initialData) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(initialData);
  const [error, setError] = useState(null);
  useEffect(() => {
    setData(initialData);
    setLoading(true);
    fetchJson(url).then(
      (data) => {
        setLoading(false);
        setData(data);
      },
      (error) => {
        setLoading(false);
        setError(error);
      }
    );
  }, [url]);
  return [data, error, loading];
}
