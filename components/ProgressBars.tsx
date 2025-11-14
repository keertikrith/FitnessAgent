import React from 'react';

type Props = {
  workoutMinutes: number;
  readingMinutes: number;
  sleepMinutes: number;
  caloriesBurned: number;
  targets?: {
    workout?: number; // minutes
    reading?: number; // minutes
    sleep?: number; // minutes
    caloriesBurn?: number;
  };
};

const ProgressBar: React.FC<{ label: string; value: number; target: number; color?: string }> = ({ label, value, target, color = 'bg-blue-600' }) => {
  const pct = Math.min(100, target > 0 ? Math.round((value / target) * 100) : 0);
  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="font-medium text-black-900">{label}</div>
        <div className="text-sm font-medium text-black-900">{value}/{target} {label === 'Sleep' ? 'min' : label === 'Calories Burned' ? 'kcal' : 'min'}</div>
      </div>
      <div className="mt-2 h-3 w-full rounded-full bg-gray-200">
        <div className={`h-3 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

const ProgressBars: React.FC<Props> = ({ workoutMinutes, readingMinutes, sleepMinutes, caloriesBurned, targets }) => {
  const t = {
    workout: targets?.workout ?? 60,
    reading: targets?.reading ?? 30,
    sleep: targets?.sleep ?? 480,
    caloriesBurn: targets?.caloriesBurn ?? 3000,
  };

  return (
    <div className="space-y-4">
      <ProgressBar label="Workout" value={workoutMinutes} target={t.workout} color="bg-green-500" />
      <ProgressBar label="Reading" value={readingMinutes} target={t.reading} color="bg-indigo-500" />
      <ProgressBar label="Sleep" value={sleepMinutes} target={t.sleep} color="bg-teal-500" />
      <ProgressBar label="Calories Burned" value={caloriesBurned} target={t.caloriesBurn} color="bg-orange-500" />
    </div>
  );
};

export default ProgressBars;
