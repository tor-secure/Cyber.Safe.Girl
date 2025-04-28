"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts"

export function ProgressChart({ completed, total }: { completed: number; total: number }) {
  const pending = total - completed

  const data = [
    { name: "Completed", value: completed, color: "#3b82f6" },
    { name: "Pending", value: pending, color: "#ef4444" },
  ]

  return (
    <div className="w-full h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={70}
            paddingAngle={5}
            dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            labelLine={false}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
