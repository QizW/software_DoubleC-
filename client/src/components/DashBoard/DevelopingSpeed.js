import { merge } from "lodash";
import moment from "moment";
import ReactApexChart from "react-apexcharts";
// material
import { Card, CardHeader, Box } from "@mui/material";
//
import BaseOptionChart from "./BaseOptionChart";

// ----------------------------------------------------------------------

const DevelopingSpeed = (data) => {
    
    // 用map存储
    let map = new Map()
    console.log(data.data1)
    console.log(data.data2)
    const data1 = data.data1
    const data2 = data.data2
    for (var date in data1) {
        console.log(date)
        console.log(data1[date])
        map.set(date,data1[date])
    }
    for (var date in data2) {
        //如果已经含有该日期，则在原基础上相加
        if(map.has(date)){
            map.set(date,data1[date]+data2[date])
        }else{
            map.set(date,data2[date])
        }
    }
    
    //将map重新排序
    var arrayObj=Array.from(map);
    arrayObj.sort(function(a,b){return a[0].localeCompare(b[0])});
    var i;
    var result = new Map(arrayObj);
    map = result

    console.log(map)
    // 将map转换为两个数组
    // 遍历所有日期
    var labels=[], number=[];
    for(let key of map.keys()){
        labels.push(key)
    }
    
    //遍历所有的值
    for(let val of map.values()){
        number.push(val)
    }

    console.log(labels)
    console.log(number)

  const CHART_DATA = [
    {
      name: "issue times",
      type: "area",
      data: number,
    },
  ];
  const chartOptions = merge(BaseOptionChart(), {
    stroke: { width: [3, 2] },
    plotOptions: { bar: { columnWidth: "11%", borderRadius: 4 } },
    fill: { type: ["gradient"] },
    labels: labels,
    xaxis: { type: "datetime" },
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
  });

  return (
    <Card>
      <CardHeader title="Community Develpping Speed" />
      <Box sx={{ p: 3, pb: 1 }} dir="ltr">
        <ReactApexChart
          type="line"
          series={CHART_DATA}
          options={chartOptions}
          height={364}
        />
      </Box>
    </Card>
  );
};

export default DevelopingSpeed;
