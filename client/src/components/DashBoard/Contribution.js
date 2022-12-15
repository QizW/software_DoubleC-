import { merge } from "lodash";
import ReactApexChart from "react-apexcharts";
import { fNumber } from "../../utils/formatNumber";
import { Card, CardHeader, Box } from "@mui/material";
//
import BaseOptionChart from "./BaseOptionChart";

// ----------------------------------------------------------------------

const Contribute = ({ name, contributions, followers }) => {
  // contributions表的数据来源
  const CHART_DATA_CONTRIBUTIONS = [
    {
      data: contributions
    },
  ];
  // contributions表的格式
  const chartOptionsContributions = merge(BaseOptionChart(), {
    tooltip: {
      marker: { show: false },
      y: {
        formatter: (seriesName) => fNumber(seriesName),
        title: {
          formatter: () => `#commit times`,
        },
      },
    },
    plotOptions: {
      bar: { horizontal: true, barHeight: "28%", borderRadius: 2 },
    },
    xaxis: {
      categories: name,
    },
  });

  const CHART_DATA_FOLLOWERS = [
    {
      data: followers
    },
  ];

  const chartOptionsFollowers = merge(BaseOptionChart(), {
    tooltip: {
      marker: { show: false },
      y: {
        formatter: (seriesName) => fNumber(seriesName),
        title: {
          formatter: () => `#followers number`,
        },
      },
    },
    plotOptions: {
      bar: { horizontal: true, barHeight: "28%", borderRadius: 2 },
    },
    xaxis: {
      categories: name,
    },
    colors: '#FF0000'
  });

  return (
    <Card>
      <CardHeader title="Contribution Rank" />
      <Box sx={{ mx: 3 }} dir="ltr">
        <ReactApexChart
          type="bar"
          series={CHART_DATA_CONTRIBUTIONS}
          options={chartOptionsContributions}
          height={364}
        />
      </Box>
      <CardHeader title="Followers Rank ( followers of contributors )" />
      <Box sx={{ mx: 3 }} dir="ltr">
        <ReactApexChart
          type="bar"
          series={CHART_DATA_FOLLOWERS}
          options={chartOptionsFollowers}
          height={364}
        />
      </Box>
    </Card>
  );
};

export default Contribute;
