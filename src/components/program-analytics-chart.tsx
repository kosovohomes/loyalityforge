"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

type ChartData = { name: string; [key: string]: string | number };

export function ProgramAnalyticsChart({
  data,
  bars = [{ key: "Earns", color: "#C4922C" }, { key: "Redemptions", color: "#33513F" }],
}: {
  data: ChartData[];
  bars?: { key: string; color: string }[];
}) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2B1D1415" />
          <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#2B1D14" }} />
          <YAxis tick={{ fontSize: 12, fill: "#2B1D14" }} allowDecimals={false} />
          <Tooltip contentStyle={{ borderRadius: 12, borderColor: "#2B1D1420" }} />
          <Legend />
          {bars.map((bar) => (
            <Bar key={bar.key} dataKey={bar.key} fill={bar.color} radius={[6, 6, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
