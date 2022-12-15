import React, { useState, useEffect } from 'react';
import { Line } from '@ant-design/plots';
var data = []
const SigComC = (datas) => {
    useEffect(() => {
        data = datas.data1
    }, [datas]);

  const config = {
    data,
    xField: 'day',
    yField: 'number',
    seriesField: 'name',
    legend: {
      position: 'top',
    },
    smooth: true,
    connectNulls: false,
    // @TODO 后续会换一种动画方式
    animation: {
      appear: {
        animation: 'path-in',
        duration: 5000,
      },
    },
  };

  return <Line {...config} />;
};


export default SigComC