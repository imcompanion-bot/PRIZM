import React from 'react';
import { renderToString } from 'react-dom/server';
import { BarChart, Bar, XAxis } from 'recharts';

const data = [
  { name: 'Base', value: [0, 100] },
  { name: 'New', value: [100, 150] },
  { name: 'Churned', value: [150, 120] } // visually negative
];

const CustomLabel = (props) => {
  console.log("props for stacked bar:", props.name, props);
  return React.createElement('text', null, 'Label');
};

const App = () => React.createElement(BarChart, { width: 400, height: 300, data },
  React.createElement(XAxis, { dataKey: 'name' }),
  React.createElement(Bar, { dataKey: 'value', label: React.createElement(CustomLabel, null) })
);

renderToString(React.createElement(App, null));
