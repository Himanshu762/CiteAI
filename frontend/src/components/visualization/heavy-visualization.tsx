import React from 'react';

interface VisualizationProps {
  data?: any[];
}

const HeavyVisualization = ({ data = [] }: VisualizationProps) => {
  return (
    <div className="p-4 border rounded-lg bg-white dark:bg-gray-800">
      <h3 className="text-lg font-medium mb-4">Data Visualization</h3>
      <div className="h-64 w-full bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
        {data.length ? (
          <div>Visualization content would render here</div>
        ) : (
          <div className="text-gray-500">No data available for visualization</div>
        )}
      </div>
    </div>
  );
};

export default HeavyVisualization; 