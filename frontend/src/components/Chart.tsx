import React from 'react';
import { Bar } from "@visx/shape"
import { scaleLinear, scaleBand } from "@visx/scale"

// Add type definition
interface ChartData {
  label: string;
  value: number;
}

const CustomBarChart = ({ data }: { data: ChartData[] }) => {
  const margin = { top: 20, right: 20, bottom: 20, left: 20 }
  const width = 500
  const height = 300

  const xScale = scaleBand({
    range: [0, width],
    domain: data.map(d => d.label),
    padding: 0.4,
  })

  const yScale = scaleLinear({
    range: [height, 0],
    domain: [0, Math.max(...data.map(d => d.value))],
  })

  return (
    <svg width={width} height={height}>
      {data.map((d) => (
        <Bar
          key={d.label}
          x={xScale(d.label)}
          y={yScale(d.value)}
          height={height - yScale(d.value)}
          width={xScale.bandwidth()}
          fill="#4f46e5"
        />
      ))}
    </svg>
  )
}

export default CustomBarChart 