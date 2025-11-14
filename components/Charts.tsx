'use client';

import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ChartsProps {
  data: Array<{
    date: string;
    calories: number;
    target: number;
    workout?: number;
    reading?: number;
    meditation?: number;
  }>;
  type?: 'calories' | 'habits';
}

export default function Charts({ data, type = 'calories' }: ChartsProps) {
  if (type === 'calories') {
    return (
      <div className="rounded-lg border-2 border-gray-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-bold text-black-900">Calorie Tracking</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="calories" stroke="#3b82f6" strokeWidth={2} name="Actual" />
            <Line type="monotone" dataKey="target" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" name="Target" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="rounded-lg border-2 border-gray-200 bg-white p-6">
      <h3 className="mb-4 text-lg font-bold text-black-900">Habit Tracking (Minutes)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="workout" fill="#3b82f6" name="Workout" />
          <Bar dataKey="reading" fill="#10b981" name="Reading" />
          <Bar dataKey="meditation" fill="#8b5cf6" name="Meditation" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
