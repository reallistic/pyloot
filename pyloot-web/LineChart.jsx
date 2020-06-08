import React, { useMemo } from "react";

import HighchartsReact from "highcharts-react-official";
import Highcharts from "highcharts";

export function SimpleLineChart({ data }) {
  const chartOptions = useMemo(
    () => ({
      chart: {
        height: "200px",
      },
      title: {
        text: null,
      },
      series: [
        {
          data: data,
          showInLegend: false,
        },
      ],
      xAxis: {
        visible: false,
      },
      yAxis: {
        title: null,
      },
    }),
    [data]
  );
  return <HighchartsReact highcharts={Highcharts} options={chartOptions} />;
}
