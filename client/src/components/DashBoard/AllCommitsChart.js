import { merge } from "lodash";
import ReactApexChart from "react-apexcharts";
import { fNumber } from "../../utils/formatNumber";
import { Card, CardHeader, Box } from "@mui/material";
//
import BaseOptionChart from "./BaseOptionChart";

// ----------------------------------------------------------------------

const AllCommitsChart = (data) => {
    var name = [];
    var commitTimes = [];
    const Data = data.data
    var count = 0;
    for (var it in Data) {
      if(count==20){
        break;
      }
        name.push(it);
        commitTimes.push(Data[it])
        count++;
    }

  // 图的数据来源
  const CHART_DATA_CONTRIBUTIONS = [
    {
      data: commitTimes
    },
  ];
  // 图的格式
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
  if(commitTimes.length!=0){
    return (
      <Card>
        <CardHeader title="Commits Number" />
        <Box sx={{ mx: 3 }} dir="ltr">
          <ReactApexChart
            type="bar"
            series={CHART_DATA_CONTRIBUTIONS}
            options={chartOptionsContributions}
            height={40*commitTimes.length}
          />
        </Box>
      </Card>
    );
  }else{
    return (
      <Card>
        <CardHeader title="Commits Number" />
        <Box sx={{ mx: 3 }} dir="ltr">
          <h2>时间范围内无数据</h2>
        </Box>
      </Card>
    )
  }
 
};

export default AllCommitsChart;
