import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const data = [
  { name: 'Base', value: [0, 100], fill: '#8b5cf6' },
  { name: 'New', value: [100, 150], fill: '#10b981' },
  { name: 'Retained', value: [150, 120], fill: '#3b82f6' },
  { name: 'Churned', value: [120, 90], fill: '#f43f5e' },
  { name: 'End', value: [0, 90], fill: '#8b5cf6' },
];

export default function TestWaterfall() {
  return (
    <BarChart width={500} height={300} data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip />
      <Bar dataKey="value" />
    </BarChart>
  );
}
