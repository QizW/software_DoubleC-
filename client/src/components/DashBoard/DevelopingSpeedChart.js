import { merge } from "lodash";
import ReactApexChart from "react-apexcharts";
import { fNumber } from "../../utils/formatNumber";
import { Card, CardHeader, Box } from "@mui/material";
//
import BaseOptionChart from "./BaseOptionChart";
const DevelopingSpeedChart = (data) => {
    const Data = data.data
    // 存放具体数值
    var ds = [];
    // 存放日期
    var date = [];

    // 将接受的map转化为两个数组
    for (var i in Data){
        date.push(i);
        ds.push(Data[i]);
    }

    // 由于传入的时间顺序是反的，这里需要reverse一下
    date = date.reverse();
    ds = ds.reverse();
    // 图的数据来源
    const CHART_DATA = [
        {
          data: ds,
          type: "area",
        },
      ];
      // 图的格式
      const chartOptions = merge(BaseOptionChart(), {
        fill: { type: ["gradient"] },
        tooltip: {
            shared: true,
            intersect: false,
            y: {
              formatter: (y) => {
                if (typeof y !== "undefined") {
                  return `${y.toFixed(0)}`;
                }
                return y;
              },
            },
          },
        plotOptions: {
          bar: { horizontal: false, barHeight: "28%", borderRadius: 2 },
        },
        xaxis: {
          categories: date,
        },
      });
    if(ds.length!=0){
        return (
            <Card>
                <CardHeader title="Community Developing speed" />
                <Box sx={{ mx: 3 }} dir="ltr">
                    <ReactApexChart
                    type="bar"
                    series={CHART_DATA}
                    options={chartOptions}
                    height={364}
                    />
                </Box>
            </Card>
          )
    }else{
        return (
            <Card>
                <CardHeader title="Community Developing speed" />
                <Box sx={{ mx: 3 }} dir="ltr">
                    <h2>时间范围内无数据</h2>
                </Box>
            </Card>
        )
    }
      
}

export default DevelopingSpeedChart;