'use client';

import { useState } from 'react';

interface HabitToggleProps {
  habitName: string;
  icon: string;
  completed: boolean;
  duration?: number;
  onToggle: (completed: boolean, duration?: number) => void;
}

export default function HabitToggle({ 
  habitName, 
  icon, 
  completed: initialCompleted, 
  duration: initialDuration,
  onToggle 
}: HabitToggleProps) {
  const [completed, setCompleted] = useState(initialCompleted);
  const [duration, setDuration] = useState(initialDuration?.toString() || '');
  const [showDuration, setShowDuration] = useState(false);

  const handleToggle = () => {
    const newCompleted = !completed;
    setCompleted(newCompleted);
    
    if (newCompleted && !showDuration) {
      setShowDuration(true);
    } else {
      onToggle(newCompleted, duration ? parseInt(duration) : undefined);
      if (!newCompleted) {
        setShowDuration(false);
        setDuration('');
      }
    }
  };

  const handleDurationSubmit = () => {
    onToggle(true, duration ? parseInt(duration) : undefined);
    setShowDuration(false);
  };

  return (
    <div className="flex items-center gap-3 rounded-lg border-2 border-gray-200 bg-white p-4">
      <button
        onClick={handleToggle}
        className={`flex h-12 w-12 items-center justify-center rounded-full text-2xl transition-all ${
          completed 
            ? 'bg-green-500 text-white shadow-lg' 
            : 'bg-gray-100 text-black-900 hover:bg-gray-200'
        }`}
      >
        {completed ? '✓' : icon}
      </button>
      
      <div className="flex-1">
        <p className="font-bold capitalize text-black-900">{habitName}</p>
        {completed && duration && (
          <p className="text-sm font-medium text-black-900">{duration} minutes</p>
        )}
      </div>

      {showDuration && (
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="Minutes"
            className="w-20 rounded border border-gray-300 px-2 py-1 text-sm"
            autoFocus
          />
          <button
            onClick={handleDurationSubmit}
            className="rounded bg-blue-500 px-3 py-1 text-sm text-white hover:bg-blue-600"
          >
            Save
          </button>
        </div>
      )}
    </div>
  );
}
