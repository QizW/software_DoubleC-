import { merge } from "lodash";
import ReactApexChart from "react-apexcharts";
import { fNumber } from "../../utils/formatNumber";
import { Card, CardHeader, Box } from "@mui/material";
import BaseOptionChart from "./BaseOptionChart";

const IssueAnalyzeChart = (data) => {
    console.log(data)
    const Data = data.data
    var date = [];
    var value = [];
    for (var it in Data) {
        date.push(it);
        value.push(Data[it])
    }

  // 图的数据来源
  const CHART_DATA_CONTRIBUTIONS = [
    {
      data: value
    },
  ];
  // 图的格式
  const chartOptionsContributions = merge(BaseOptionChart(), {
    tooltip: {
      marker: { show: false },
      y: {
        formatter: (seriesName) => fNumber(seriesName),
        title: {
          formatter: () => `#Issue Times`,
        },
      },
    },
    plotOptions: {
      bar: { horizontal: true, barHeight: "28%", borderRadius: 2 },
    },
    xaxis: {
      categories: date,
    },
  });
  if(value.length!=0){
    return (
      <Card>
        <CardHeader title="Issue Analyze Result" />
        <Box sx={{ mx: 3 }} dir="ltr">
          <ReactApexChart
            type="bar"
            series={CHART_DATA_CONTRIBUTIONS}
            options={chartOptionsContributions}
            height={364}
          />
        </Box>
      </Card>
    );
  }else{
    return (
      <Card>
        <CardHeader title="Issue Analyze Result" />
        <Box sx={{ mx: 3 }} dir="ltr">
          <h2>时间范围内无数据</h2>
        </Box>
      </Card>
    )
  }
 
};

export default IssueAnalyzeChart;