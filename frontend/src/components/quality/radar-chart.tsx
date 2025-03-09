import { ParentSize } from "@visx/responsive"
import { Group } from "@visx/group"
import { scaleLinear } from "@visx/scale"
import { LineRadial } from "@visx/shape"
import { Text } from "@visx/text"
import { useTooltip, Tooltip, defaultStyles } from "@visx/tooltip"

interface DataPoint {
  category: string;
  value: number;
}

interface PlagiarismRadarChartProps {
  data: DataPoint[];
}

export const PlagiarismRadarChart = ({ data }: PlagiarismRadarChartProps) => {
  const { showTooltip, hideTooltip, tooltipData, tooltipLeft, tooltipTop } = useTooltip();
  
  return (
    <ParentSize>
      {({ width, height }) => {
        // Main variables
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 2 - 40;
        
        // Angle for each point
        const angleStep = (Math.PI * 2) / data.length;
        
        // Scale for values
        const yScale = scaleLinear({
          domain: [0, Math.max(...data.map(d => d.value), 10)],
          range: [0, radius],
        });
        
        return (
          <>
            <svg width={width} height={height}>
              <Group top={centerY} left={centerX}>
                {/* Render circular grid lines */}
                {[0.2, 0.4, 0.6, 0.8, 1].map((value, i) => {
                  const r = radius * value;
                  return (
                    <circle
                      key={`radar-grid-${i}`}
                      r={r}
                      fill="none"
                      stroke="currentColor"
                      strokeOpacity={0.1}
                      strokeWidth={1}
                    />
                  );
                })}
                
                {/* Render spokes */}
                {data.map((point, i) => {
                  const angle = i * angleStep - Math.PI / 2;
                  const x = radius * Math.cos(angle);
                  const y = radius * Math.sin(angle);
                  return (
                    <line
                      key={`radar-spoke-${i}`}
                      x1={0}
                      y1={0}
                      x2={x}
                      y2={y}
                      stroke="currentColor"
                      strokeOpacity={0.1}
                      strokeWidth={1}
                    />
                  );
                })}
                
                {/* Render labels */}
                {data.map((point, i) => {
                  const angle = i * angleStep - Math.PI / 2;
                  const x = (radius + 20) * Math.cos(angle);
                  const y = (radius + 20) * Math.sin(angle);
                  return (
                    <Text
                      key={`radar-label-${i}`}
                      x={x}
                      y={y}
                      textAnchor="middle"
                      verticalAnchor="middle"
                      fontSize={12}
                      dy={3}
                      fill="currentColor"
                    >
                      {point.category}
                    </Text>
                  );
                })}
                
                {/* Render the line */}
                <LineRadial
                  data={data}
                  angle={(d) => data.findIndex(p => p.category === d.category) * angleStep}
                  radius={(d) => yScale(d.value)}
                  fill="none"
                  stroke="#4ECDC4"
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeOpacity={0.8}
                />
                
                {/* Render points */}
                {data.map((point, i) => {
                  const angle = i * angleStep - Math.PI / 2;
                  const r = yScale(point.value);
                  const x = r * Math.cos(angle);
                  const y = r * Math.sin(angle);
                  return (
                    <circle
                      key={`radar-point-${i}`}
                      cx={x}
                      cy={y}
                      r={4}
                      fill="#4ECDC4"
                      stroke="white"
                      strokeWidth={1}
                      onMouseEnter={() => {
                        showTooltip({
                          tooltipData: `${point.category}: ${point.value}%`,
                          tooltipLeft: x + centerX,
                          tooltipTop: y + centerY,
                        });
                      }}
                      onMouseLeave={hideTooltip}
                    />
                  );
                })}
              </Group>
            </svg>
            
            {tooltipData && (
              <Tooltip
                left={tooltipLeft}
                top={tooltipTop}
                style={{
                  ...defaultStyles,
                  background: 'rgba(0, 0, 0, 0.8)',
                  color: 'white',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  fontSize: '12px',
                }}
              >
                {tooltipData as string}
              </Tooltip>
            )}
          </>
        );
      }}
    </ParentSize>
  );
}; 