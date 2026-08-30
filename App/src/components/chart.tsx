import { PieChart } from "@mui/x-charts/PieChart";
import React from "react";
import { FolderScan, formatSize } from "../lib/files";

const settings = {
  margin: { right: 5 },
  width: 300,
  height: 300,
  hideLegend: true,
};

// const data = [
//   { label: "Group A", value: 400, color: "#0088FE" },
//   { label: "Group B", value: 300, color: "#00C49F" },
//   { label: "Group C", value: 300, color: "#FFBB28" },
//   { label: "Group D", value: 200, color: "#FF8042" },
// ];

// const total = data.reduce((sum, item) => sum + item.value, 0);

export type PieChartData = {
  label: string;
  value: number;
  color?: string;
};

export function folderScanToPieData(
  folder: FolderScan | undefined,
  limit = 4
): PieChartData[] {
  if (!folder) return []
  const items: PieChartData[] = folder.contents
    .map((entry) => ({
      label: entry.isDir
        ? entry.path.split("/").pop() || entry.path
        : entry.name,
      value: entry.size,
    }))
    .sort((a, b) => b.value - a.value);

  const topItems = items.slice(0, limit);

  const otherValue = items
    .slice(limit)
    .reduce((sum, item) => sum + item.value, 0);

  if (otherValue > 0) {
    topItems.push({
      label: "Other",
      value: otherValue,
      color: "#9e9e9e",
    });
  }

  return topItems;
}

export default function DonutChart({ files }: { files: FolderScan | undefined }) {

  const data = folderScanToPieData(files)

  return (
    <PieChart
      series={[
        {
          // innerRadius: 60,
          // outerRadius: 120,
          innerRadius: 80,
          outerRadius: 150,
          paddingAngle: 2,
          cornerRadius: 5,
          data,
          arcLabel: (item) => {
            const total = data.reduce((sum, item) => sum + item.value, 0);
            const percentage = item.value / total;

            return percentage >= 0.05
              ? formatSize(item.value)
              : "";
          },
          valueFormatter: (item) => formatSize(item.value),
        },
      ]}
      slotProps={{
        pieArc: {
          strokeWidth: 0,
        },
      }}
      {...settings}
    />
  );
}

