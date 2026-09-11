import React from 'react';
import { renderToString } from 'react-dom/server';
import { BarChart, Bar, XAxis } from 'recharts';

const data = [{ name: 'LongName', value: -100 }];

const App = () => React.createElement(BarChart, { width: 400, height: 300, data },
  React.createElement(XAxis, { dataKey: 'name', orientation: 'top', angle: -25, textAnchor: 'start' }),
  React.createElement(Bar, { dataKey: 'value' })
);

console.log(renderToString(React.createElement(App, null)));
