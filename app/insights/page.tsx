'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, supabaseAdmin } from '@/lib/supabaseClient';
import InsightCard from '@/components/InsightCard';
import Charts from '@/components/Charts';
import Link from 'next/link';

export default function InsightsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [insights, setInsights] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
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
    await loadInsights(user.id);
    setLoading(false);
  };

  const loadInsights = async (userId: string) => {
    // Load daily insights
    const { data: insightsData } = await supabase
      .from('daily_insights')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(7);

    setInsights(insightsData || []);

    // Load chart data for last 7 days
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    const chartDataPromises = last7Days.map(async (date) => {
      // Get meals for the day
      const { data: meals } = await supabase
        .from('meal_logs')
        .select('estimated_calories')
        .eq('user_id', userId)
        .gte('timestamp', `${date}T00:00:00`)
        .lte('timestamp', `${date}T23:59:59`);

      // Get habits for the day
      const { data: habits } = await supabase
        .from('habit_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('date', date);

      const totalCalories = meals?.reduce((sum, m) => sum + m.estimated_calories, 0) || 0;
      const workout = habits?.find(h => h.habit_name === 'workout')?.duration_minutes || 0;
      const reading = habits?.find(h => h.habit_name === 'reading')?.duration_minutes || 0;
      const meditation = habits?.find(h => h.habit_name === 'meditation')?.duration_minutes || 0;

      return {
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        calories: totalCalories,
        target: 2000, // You can fetch this from goals
        workout,
        reading,
        meditation,
      };
    });

    const chartData = await Promise.all(chartDataPromises);
    setChartData(chartData);
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
              <Link href="/goals" className="text-black-900 hover:text-black font-medium">
                Goals
              </Link>
              <Link href="/insights" className="font-medium text-blue-500">
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
        <h2 className="mb-6 text-3xl font-bold text-black-900">Your Insights</h2>

        {/* Charts */}
        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Charts data={chartData} type="calories" />
          <Charts data={chartData} type="habits" />
        </div>

        {/* Daily Insights */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-black-900">Daily Summaries</h3>
          {insights.length === 0 ? (
            <div className="rounded-lg border-2 border-gray-200 bg-white p-8 text-center">
              <p className="text-black-900 font-medium">
                No insights yet. Daily summaries are generated automatically at 9 PM.
              </p>
            </div>
          ) : (
            insights.map((insight) => (
              <InsightCard
                key={insight.id}
                date={insight.date}
                summary={insight.summary_json}
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
}
