import React from 'react';
import { renderToString } from 'react-dom/server';
import { BarChart, Bar, XAxis } from 'recharts';

const data = [{ name: 'A', value: -100 }];

const CustomLabel = (props) => {
  console.log("props for negative bar:", props);
  return React.createElement('text', null, 'Label');
};

const App = () => React.createElement(BarChart, { width: 400, height: 300, data },
  React.createElement(XAxis, { dataKey: 'name' }),
  React.createElement(Bar, { dataKey: 'value', label: React.createElement(CustomLabel, null) })
);

console.log(renderToString(React.createElement(App, null)));
