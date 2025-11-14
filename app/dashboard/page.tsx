'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import DashboardCard from '@/components/DashboardCard';
import HabitToggle from '@/components/HabitToggle';
import ChatInput from '@/components/ChatInput';
import Link from 'next/link';
import ProgressBars from '@/components/ProgressBars';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [meals, setMeals] = useState<any[]>([]);
  const [habits, setHabits] = useState<any>({});
  const [goal, setGoal] = useState<any>(null);
  const [progress, setProgress] = useState<any>({ workoutMinutes: 0, readingMinutes: 0, sleepMinutes: 0, caloriesBurned: 0 });
  const [burnInput, setBurnInput] = useState<string>('');
  const [processing, setProcessing] = useState(false);

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
    await loadData(user.id);
    setLoading(false);
  };

  const loadData = async (userId: string) => {
    const today = new Date().toISOString().split('T')[0];

    // Load meals
    const mealsRes = await fetch(`/api/log?userId=${userId}&type=meals&date=${today}`);
    const mealsData = await mealsRes.json();
    setMeals(mealsData.meals || []);

    // Load habits
    const habitsRes = await fetch(`/api/log?userId=${userId}&type=habits&date=${today}`);
    const habitsData = await habitsRes.json();
    const habitsMap: any = {};
    habitsData.habits?.forEach((h: any) => {
      habitsMap[h.habit_name] = h;
    });
    setHabits(habitsMap);

    // Load goal
    const goalRes = await fetch(`/api/goal?userId=${userId}`);
    const goalData = await goalRes.json();
    setGoal(goalData.goals?.[0] || null);

    // Load summary/progress
    try {
      const sumRes = await fetch(`/api/whatsapp/checkin/summary?userId=${userId}`);
      const sumJson = await sumRes.json();
      if (sumJson?.success) {
        const s = sumJson.summary;
        setProgress({
          workoutMinutes: s.workoutMinutes || 0,
          readingMinutes: s.readingMinutes || 0,
          sleepMinutes: s.sleepMinutes || 0,
          caloriesBurned: s.caloriesBurned || 0,
          totalCalories: s.totalCalories || 0,
        });
      }
    } catch (e) {
      console.error('Failed to load summary:', e);
    }
  };

  const handleMessage = async (message: string) => {
    if (!user) return;
    setProcessing(true);

    try {
      const res = await fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, message }),
      });

      if (res.ok) {
        await loadData(user.id);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleHabitToggle = async (habitName: string, completed: boolean, duration?: number) => {
    if (!user) return;

    try {
      await fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          type: 'habit',
          data: { habitName, completed, duration },
        }),
      });

      await loadData(user.id);
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

  const totalCalories = meals.reduce((sum, m) => sum + m.estimated_calories, 0);
  const calorieTarget = goal?.daily_calorie_target || 2000;
  const calorieProgress = (totalCalories / calorieTarget) * 100;

  const habitsCompleted = Object.values(habits).filter((h: any) => h.completed).length;
  const totalHabits = 4;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b-2 border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-black-900">🏃‍♀️ AI Habit Tracker</h1>
            <nav className="flex items-center gap-4">
              <Link href="/dashboard" className="font-medium text-blue-500">
                Dashboard
              </Link>
              <Link href="/goals" className="text-black-900 hover:text-black font-medium">
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

      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Stats Cards */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <DashboardCard
            title="Calories Today"
            value={totalCalories}
            subtitle={`Target: ${calorieTarget} kcal`}
            icon="🔥"
            progress={calorieProgress}
            color="orange"
          />
          <DashboardCard
            title="Habits Completed"
            value={`${habitsCompleted}/${totalHabits}`}
            subtitle="Keep it up!"
            icon="✅"
            progress={(habitsCompleted / totalHabits) * 100}
            color="green"
          />
          <DashboardCard
            title="Meals Logged"
            value={meals.length}
            subtitle="Today"
            icon="🍽️"
            color="blue"
          />
          <DashboardCard
            title="Goal Progress"
            value={goal ? `${goal.goal_type}` : 'No goal'}
            subtitle={goal ? `${goal.target_change_kg || 0}kg target` : 'Set a goal'}
            icon="🎯"
            color="purple"
          />
        </div>

        {/* Quick Log */}
        <div className="mb-8 rounded-lg border-2 border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-xl font-bold text-black-900">Quick Log</h2>
          <ChatInput
            onSend={handleMessage}
            placeholder="e.g., Had dosa and chai, worked out 30 mins..."
            disabled={processing}
          />
          <p className="mt-2 text-sm text-black-900 font-medium">
            Type naturally and AI will log your meals and habits automatically
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Progress Bars */}
          <div className="rounded-lg border-2 border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-xl font-bold text-black-900">Daily Progress</h2>
            <ProgressBars
              workoutMinutes={progress.workoutMinutes}
              readingMinutes={progress.readingMinutes}
              sleepMinutes={progress.sleepMinutes}
              caloriesBurned={progress.caloriesBurned}
            />

            {/* Weight Loss Status */}
            <div className="mt-6 rounded-lg bg-blue-50 p-4">
              <div className="font-medium text-black-900">Today's Calorie Deficit</div>
              <div className="mt-2 text-2xl font-bold">
                {progress.caloriesBurned - (progress.totalCalories || 0) >= 0 ? (
                  <span className="text-green-600">-{progress.caloriesBurned - (progress.totalCalories || 0)} kcal 📉</span>
                ) : (
                  <span className="text-orange-600">+{(progress.totalCalories || 0) - progress.caloriesBurned} kcal 📈</span>
                )}
              </div>
              <div className="mt-1 text-sm text-black-900">
                {progress.caloriesBurned - (progress.totalCalories || 0) >= 0
                  ? '✅ Deficit achieved! Keep it up for weight loss.'
                  : '⚠️ Surplus today. Increase burn or reduce intake for weight loss.'}
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-black-900">Log today's calories burned (Apple Watch)</label>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="number"
                  className="w-32 rounded-md border px-3 py-2 text-black-900"
                  value={burnInput}
                  onChange={(e) => setBurnInput(e.target.value)}
                  placeholder="kcal"
                />
                <button
                  onClick={async () => {
                    if (!user) return;
                    const val = Number(burnInput);
                    if (!val || val <= 0) return;
                    try {
                      await fetch('/api/log/daily-burn', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId: user.id, caloriesBurned: val }),
                      });
                      setBurnInput('');
                      await loadData(user.id);
                    } catch (e) {
                      console.error('Failed to log burn:', e);
                    }
                  }}
                  className="rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-white font-medium transition"
                >
                  Save
                </button>
                {progress.caloriesBurned > 0 && (
                  <button
                    onClick={async () => {
                      try {
                        const today = new Date().toISOString().split('T')[0];
                        const sumRes = await fetch(`/api/whatsapp/checkin/summary?userId=${user.id}`);
                        const sumJson = await sumRes.json();
                        const burns = sumJson.summary?.habits || [];
                        const burnRecord = burns.find((b: any) => b.user_id === user.id && b.date === today);
                        if (burnRecord) {
                          await fetch('/api/log/delete', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ type: 'burn', id: burnRecord.id }),
                          });
                          await loadData(user.id);
                        }
                      } catch (e) {
                        console.error('Failed to delete burn:', e);
                      }
                    }}
                    className="rounded-lg bg-red-600 hover:bg-red-700 px-3 py-2 text-white font-bold transition"
                  >
                    ✕
                  </button>
                )}
              </div>
              {progress.caloriesBurned > 0 && (
                <p className="mt-2 text-sm text-black-900">Today's burned: {progress.caloriesBurned} kcal</p>
              )}
            </div>
          </div>
          {/* Today's Meals */}
          <div className="rounded-lg border-2 border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-xl font-bold text-black-900">Today's Meals</h2>
            {meals.length === 0 ? (
              <p className="font-medium text-black-900">No meals logged yet. Try the Quick Log above!</p>
            ) : (
              <div className="space-y-3">
                {meals.map((meal) => (
                  <div
                    key={meal.id}
                    className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
                  >
                    <div className="flex-1">
                      <p className="font-bold text-black-900">{meal.description}</p>
                      <p className="text-sm font-medium text-black-900">
                        {new Date(meal.timestamp).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-bold text-orange-600">{meal.estimated_calories}</p>
                        <p className="text-xs font-medium text-black-900">kcal</p>
                      </div>
                      <button
                        onClick={async () => {
                          try {
                            await fetch('/api/log/delete', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ type: 'meal', id: meal.id }),
                            });
                            await loadData(user.id);
                          } catch (e) {
                            console.error('Failed to delete meal:', e);
                          }
                        }}
                        className="rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold px-2.5 py-1.5 text-xs transition"
                        title="Delete this meal"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Habits */}
          <div className="rounded-lg border-2 border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-xl font-bold text-black-900">Today's Habits</h2>
            <div className="space-y-3">
              {['workout', 'reading', 'sleep', 'study', 'meditation'].map((habitName) => (
                <div key={habitName} className="flex items-center justify-between">
                  <div className="flex-1">
                    <HabitToggle
                      habitName={habitName}
                      icon={
                        habitName === 'workout'
                          ? '💪'
                          : habitName === 'reading'
                          ? '📚'
                          : habitName === 'sleep'
                          ? '😴'
                          : habitName === 'study'
                          ? '📖'
                          : '🧘‍♀️'
                      }
                      completed={habits[habitName]?.completed || false}
                      duration={habits[habitName]?.duration_minutes}
                      onToggle={(completed, duration) =>
                        handleHabitToggle(habitName, completed, duration)
                      }
                    />
                  </div>
                  {habits[habitName] && (
                    <button
                      onClick={async () => {
                        try {
                          await fetch('/api/log/delete', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ type: 'habit', id: habits[habitName].id }),
                          });
                          await loadData(user.id);
                        } catch (e) {
                          console.error('Failed to delete habit:', e);
                        }
                      }}
                      className="ml-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold px-2.5 py-1.5 text-xs transition"
                      title="Delete this habit entry"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
