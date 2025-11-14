'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import GoalForm from '@/components/GoalForm';
import Link from 'next/link';

export default function GoalsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }
    setUser(user);
    await loadGoals(user.id);
    setLoading(false);
  };

  const loadGoals = async (userId: string) => {
    const res = await fetch(`/api/goal?userId=${userId}`);
    const data = await res.json();
    setGoals(data.goals || []);
  };

  const handleManualSubmit = async (goalData: any) => {
    if (!user) return;

    try {
      const res = await fetch('/api/goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, goalData }),
      });

      if (res.ok) {
        await loadGoals(user.id);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleAISubmit = async (message: string) => {
    if (!user) return;

    try {
      const res = await fetch('/api/goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, message }),
      });

      if (res.ok) {
        await loadGoals(user.id);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b-2 border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-black-900">🏃‍♀️ AI Habit Tracker</h1>
            <nav className="flex items-center gap-4">
              <Link href="/dashboard" className="text-black-900 hover:text-black font-medium">
                Dashboard
              </Link>
              <Link href="/goals" className="font-medium text-blue-500">
                Goals
              </Link>
              <Link href="/insights" className="text-black-900 hover:text-black font-medium">
                Insights
              </Link>
              <Link href="/chat" className="text-black-900 hover:text-black font-medium">
                Chat
              </Link>
              <button
                onClick={handleLogout}
                className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-300"
              >
                Logout
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <h2 className="mb-6 text-3xl font-bold text-black-900">Your Goals</h2>

        {/* Goal Form */}
        <div className="mb-8">
          <GoalForm onSubmit={handleManualSubmit} onAISubmit={handleAISubmit} />
        </div>

        {/* Goals List */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-black-900">Previous Goals</h3>
          {goals.length === 0 ? (
            <div className="rounded-lg border-2 border-gray-200 bg-white p-8 text-center">
              <p className="text-black-900 font-medium">No goals set yet. Create your first goal above!</p>
            </div>
          ) : (
            goals.map((goal) => (
              <div
                key={goal.id}
                className="rounded-lg border-2 border-gray-200 bg-white p-6"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h4 className="text-lg font-bold capitalize text-black-900">
                      {goal.goal_type.replace('_', ' ')}
                    </h4>
                    <p className="text-sm text-black-900 font-medium">
                      Started: {new Date(goal.start_date).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-600">
                    Active
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  {goal.target_change_kg && (
                    <div>
                      <p className="text-sm text-black-900 font-medium">Target Change</p>
                      <p className="font-bold text-black">{goal.target_change_kg} kg</p>
                    </div>
                  )}
                  {goal.target_weeks && (
                    <div>
                      <p className="text-sm text-black-900 font-medium">Duration</p>
                      <p className="font-bold text-black">{goal.target_weeks} weeks</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-black-900 font-medium">Daily Calories</p>
                    <p className="font-bold text-black">{goal.daily_calorie_target} kcal</p>
                  </div>
                  {goal.protein_target_g && (
                    <div>
                      <p className="text-sm text-black-900 font-medium">Protein</p>
                      <p className="font-bold text-black">{goal.protein_target_g}g</p>
                    </div>
                  )}
                  {goal.workout_minutes && (
                    <div>
                      <p className="text-sm text-black-900 font-medium">Workout</p>
                      <p className="font-bold text-black">{goal.workout_minutes} min/day</p>
                    </div>
                  )}
                  {goal.steps_target && (
                    <div>
                      <p className="text-sm text-black-900 font-medium">Steps</p>
                      <p className="font-bold text-black">{goal.steps_target}</p>
                    </div>
                  )}
                </div>

                {goal.notes && (
                  <div className="mt-4 rounded-lg bg-gray-50 p-3">
                    <p className="text-sm text-black-900">{goal.notes}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
