'use client';

interface InsightCardProps {
  date: string;
  summary: any;
}

export default function InsightCard({ date, summary }: InsightCardProps) {
  const { day_summary, goal_gap_analysis, tomorrow_plan, motivation_snippet } = summary;

  return (
    <div className="rounded-lg border-2 border-gray-200 bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold text-black-900">
          {new Date(date).toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </h3>
        <span className="text-2xl">📊</span>
      </div>

      <div className="space-y-4">
        {/* Day Summary */}
        <div className="rounded-lg bg-blue-50 p-4">
          <h4 className="mb-2 font-semibold text-blue-900">Today's Highlights</h4>
          <div className="space-y-1 text-sm text-blue-800">
            <p>🔥 Total Calories: <span className="font-bold">{day_summary.total_calories} kcal</span></p>
            {day_summary.habits_done?.length > 0 && (
              <p>✅ Completed: {day_summary.habits_done.join(', ')}</p>
            )}
            {day_summary.habits_missed?.length > 0 && (
              <p>⏭️ Missed: {day_summary.habits_missed.join(', ')}</p>
            )}
            <p className="mt-2 italic">{day_summary.highlights}</p>
          </div>
        </div>

        {/* Goal Progress */}
        <div className="rounded-lg bg-purple-50 p-4">
          <h4 className="mb-2 font-semibold text-purple-900">Goal Progress</h4>
          <div className="text-sm text-purple-800">
            <p className="mb-1">
              <span className={goal_gap_analysis.calorie_delta > 0 ? 'text-red-600' : 'text-green-600'}>
                {goal_gap_analysis.calorie_delta > 0 ? '+' : ''}{goal_gap_analysis.calorie_delta} kcal
              </span> from target
            </p>
            <p>{goal_gap_analysis.notes}</p>
          </div>
        </div>

        {/* Tomorrow's Plan */}
        <div className="rounded-lg bg-green-50 p-4">
          <h4 className="mb-2 font-semibold text-green-900">Tomorrow's Plan</h4>
          <div className="space-y-2 text-sm text-green-800">
            <div>
              <p className="font-medium">Meals:</p>
              <ul className="ml-4 list-disc">
                {tomorrow_plan.meals?.map((meal: string, i: number) => (
                  <li key={i}>{meal}</li>
                ))}
              </ul>
            </div>
            {tomorrow_plan.habits && (
              <div>
                <p className="font-medium">Habits:</p>
                <ul className="ml-4 list-disc">
                  {tomorrow_plan.habits.map((habit: string, i: number) => (
                    <li key={i}>{habit}</li>
                  ))}
                </ul>
              </div>
            )}
            <p className="mt-2 font-medium">Focus: {tomorrow_plan.focus}</p>
          </div>
        </div>

        {/* Motivation */}
        <div className="rounded-lg bg-orange-50 p-4">
          <p className="text-sm italic text-orange-900">💪 {motivation_snippet}</p>
        </div>
      </div>
    </div>
  );
}
