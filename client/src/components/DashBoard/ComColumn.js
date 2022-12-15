import React, { useState, useEffect } from 'react';
import { Column } from '@ant-design/plots';

var data = []
const ComColumn = (datas) => {

    useEffect(() => {
        data = datas.data1
    }, [datas]);

  const config = {
    data,
    xField: 'name',
    yField: 'value',
    seriesField: 'type',
    isGroup: true,
    columnStyle: {
      radius: [20, 20, 0, 0],
    },
  };

  return <Column {...config} />;
};

export default ComColumn