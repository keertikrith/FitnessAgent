'use client';

import { useState } from 'react';

interface GoalFormProps {
  onSubmit: (goalData: any) => void;
  onAISubmit: (message: string) => void;
}

export default function GoalForm({ onSubmit, onAISubmit }: GoalFormProps) {
  const [mode, setMode] = useState<'manual' | 'ai'>('ai');
  const [aiMessage, setAiMessage] = useState('');
  const [formData, setFormData] = useState({
    goal_type: 'weight_loss',
    target_change_kg: '',
    target_weeks: '',
    daily_calorie_target: '',
    protein_target_g: '',
    workout_minutes: '',
    steps_target: '',
    notes: '',
  });

  const handleAISubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (aiMessage.trim()) {
      onAISubmit(aiMessage);
      setAiMessage('');
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      target_change_kg: formData.target_change_kg ? parseFloat(formData.target_change_kg) : null,
      target_weeks: formData.target_weeks ? parseInt(formData.target_weeks) : null,
      daily_calorie_target: parseInt(formData.daily_calorie_target),
      protein_target_g: formData.protein_target_g ? parseInt(formData.protein_target_g) : null,
      workout_minutes: formData.workout_minutes ? parseInt(formData.workout_minutes) : null,
      steps_target: formData.steps_target ? parseInt(formData.steps_target) : null,
    });
  };

  return (
    <div className="rounded-lg border-2 border-gray-200 bg-white p-6">
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setMode('ai')}
          className={`flex-1 rounded-lg px-4 py-2 font-medium ${
            mode === 'ai' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-100 text-black-900 font-medium hover:bg-gray-200'
          }`}
        >
          🤖 AI Goal Setting
        </button>
        <button
          onClick={() => setMode('manual')}
          className={`flex-1 rounded-lg px-4 py-2 font-medium ${
            mode === 'manual' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-100 text-black-900 font-medium hover:bg-gray-200'
          }`}
        >
          ✏️ Manual Entry
        </button>
      </div>

      {mode === 'ai' ? (
        <form onSubmit={handleAISubmit}>
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-black-900">
              Describe your goal in natural language
            </label>
            <textarea
              value={aiMessage}
              onChange={(e) => setAiMessage(e.target.value)}
              placeholder="e.g., I want to lose 3 kg in 4 weeks by eating 1600 calories per day and working out 30 minutes daily"
              className="w-full rounded-lg border-2 border-gray-300 p-3 focus:border-blue-500 focus:outline-none"
              rows={4}
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-blue-500 py-3 font-medium text-white hover:bg-blue-600"
          >
            Generate Goal with AI
          </button>
        </form>
      ) : (
        <form onSubmit={handleManualSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-black-900">Goal Type</label>
            <select
              value={formData.goal_type}
              onChange={(e) => setFormData({ ...formData, goal_type: e.target.value })}
              className="w-full rounded-lg border-2 border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
            >
              <option value="weight_loss">Weight Loss</option>
              <option value="weight_gain">Weight Gain</option>
              <option value="maintenance">Maintenance</option>
              <option value="fitness">Fitness</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-black-900">Target Change (kg)</label>
              <input
                type="number"
                step="0.1"
                value={formData.target_change_kg}
                onChange={(e) => setFormData({ ...formData, target_change_kg: e.target.value })}
                className="w-full rounded-lg border-2 border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-black-900">Target Weeks</label>
              <input
                type="number"
                value={formData.target_weeks}
                onChange={(e) => setFormData({ ...formData, target_weeks: e.target.value })}
                className="w-full rounded-lg border-2 border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-black-900">Daily Calorie Target *</label>
            <input
              type="number"
              required
              value={formData.daily_calorie_target}
              onChange={(e) => setFormData({ ...formData, daily_calorie_target: e.target.value })}
              className="w-full rounded-lg border-2 border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-black-900">Protein Target (g)</label>
              <input
                type="number"
                value={formData.protein_target_g}
                onChange={(e) => setFormData({ ...formData, protein_target_g: e.target.value })}
                className="w-full rounded-lg border-2 border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-black-900">Workout (min/day)</label>
              <input
                type="number"
                value={formData.workout_minutes}
                onChange={(e) => setFormData({ ...formData, workout_minutes: e.target.value })}
                className="w-full rounded-lg border-2 border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-black-900">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full rounded-lg border-2 border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
              rows={3}
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-blue-500 py-3 font-medium text-white hover:bg-blue-600"
          >
            Create Goal
          </button>
        </form>
      )}
    </div>
  );
}
