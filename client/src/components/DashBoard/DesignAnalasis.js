import React, { useState, useEffect } from 'react';
import { Line } from '@ant-design/plots';
var data = []

const DesignAna = (datas) => {

    data = datas.data
  const config = {
    data,
    xField: 'day',
    yField: 'value',
    seriesField: 'category',
    xAxis: {
      type: 'time',
    },
    // yAxis: {
    //   label: {
    //     // 数值格式化为千分位
    //     formatter: (v) => `${v}`.replace(/\d{1,3}(?=(\d{3})+$)/g, (s) => `${s},`),
    //   },
    // },
  };

//   return (
//     null
//   )
  return <Line {...config} />;
};

export default DesignAna 