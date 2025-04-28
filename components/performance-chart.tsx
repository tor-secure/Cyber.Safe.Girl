"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts"

export function PerformanceChart() {
  // Sample data - in a real app, this would come from an API
  const data = [
    { chapter: "Ch 1", score: 8 },
    { chapter: "Ch 2", score: 6 },
    // More chapters would be added here
  ]

  return (
    <div className="w-full h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="chapter" />
          <YAxis domain={[0, 10]} />
          <Tooltip />
          <Bar dataKey="score" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
