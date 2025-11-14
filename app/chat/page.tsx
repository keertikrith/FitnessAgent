'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import ChatInput from '@/components/ChatInput';
import Link from 'next/link';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function ChatPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
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
    setLoading(false);

    // Add welcome message
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: "Hi! I'm your AI health assistant powered by Gemini Pro! 🤖\n\nYou can:\n• Tell me what you ate: 'Had oats and banana'\n• Log workouts: 'Worked out for 30 minutes'\n• Ask questions: 'How many calories today?'\n• Set goals: 'I want to lose 3 kg in 4 weeks'\n• Get help: 'What can you do?'\n\nJust talk to me naturally!",
        timestamp: new Date(),
      },
    ]);
  };

  const handleSendMessage = async (content: string) => {
    if (!user) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setProcessing(true);

    try {
      const lowerContent = content.toLowerCase();
      
      // Check if it's a question or general conversation
      const isQuestion = lowerContent.includes('?') || 
                        lowerContent.startsWith('how') ||
                        lowerContent.startsWith('what') ||
                        lowerContent.startsWith('when') ||
                        lowerContent.startsWith('where') ||
                        lowerContent.startsWith('why') ||
                        lowerContent.startsWith('which') ||
                        lowerContent.startsWith('who') ||
                        lowerContent.includes('tell me') ||
                        lowerContent.includes('show me') ||
                        lowerContent.includes('help');

      // Check if it's a goal-setting message
      const isGoal = (lowerContent.includes('goal') || 
                     lowerContent.includes('lose') || 
                     lowerContent.includes('gain') ||
                     lowerContent.includes('kg')) &&
                     !isQuestion;

      if (isQuestion) {
        // Use Gemini AI with full context for questions
        const chatRes = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, message: content }),
        });

        const chatData = await chatRes.json();
        
        if (chatRes.ok) {
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: chatData.response,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, assistantMessage]);
        } else {
          throw new Error(chatData.error || 'Failed to get response');
        }
        
      } else if (isGoal) {
        const res = await fetch('/api/goal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, message: content }),
        });

        const data = await res.json();
        
        if (res.ok) {
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: `🎯 Goal set successfully!\n\nTarget: ${data.goal.target_change_kg ? `${data.goal.target_change_kg}kg in ${data.goal.target_weeks} weeks` : data.goal.goal_type}\nDaily Calories: ${data.goal.daily_calorie_target} kcal\n${data.goal.protein_target_g ? `Protein: ${data.goal.protein_target_g}g\n` : ''}${data.goal.workout_minutes ? `Workout: ${data.goal.workout_minutes} min/day\n` : ''}\nI'll help you track your progress! 💪`,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, assistantMessage]);
        }
      } else {
        // Log meal/habit
        const res = await fetch('/api/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, message: content }),
        });

        const data = await res.json();

        if (res.ok) {
          let responseText = '';

          if (data.parsed.meal) {
            // Get today's total
            const today = new Date().toISOString().split('T')[0];
            const mealsRes = await fetch(`/api/log?userId=${user.id}&type=meals&date=${today}`);
            const mealsData = await mealsRes.json();
            const totalCalories = mealsData.meals?.reduce((sum: number, m: any) => sum + m.estimated_calories, 0) || 0;

            responseText += `✅ Logged: ${data.parsed.meal.description} (${data.parsed.meal.estimated_calories} kcal)\n📊 Total today: ${totalCalories} kcal\n\n`;
          }

          const habitMap: any = {
            workout: '💪 Workout',
            reading: '📚 Reading',
            study: '📖 Study',
            meditation: '🧘‍♀️ Meditation',
          };

          for (const [habitName, habitData] of Object.entries(data.parsed)) {
            if (habitName !== 'meal' && habitData && (habitData as any).completed) {
              const duration = (habitData as any).duration_minutes ? ` (${(habitData as any).duration_minutes} min)` : '';
              responseText += `${habitMap[habitName]} logged${duration}! Great job! 🎉\n`;
            }
          }

          if (!responseText) {
            responseText = "Got it! Keep up the great work! 💪";
          }

          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: responseText.trim(),
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, assistantMessage]);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Sorry, I couldn't process that. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setProcessing(false);
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
    <div className="flex min-h-screen flex-col bg-gray-50">
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
              <Link href="/insights" className="text-black-900 hover:text-black font-medium">
                Insights
              </Link>
              <Link href="/chat" className="font-medium text-blue-500">
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

      {/* Chat Messages */}
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 py-8">
        <div className="mb-4 flex-1 space-y-4 overflow-y-auto">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-black border-2 border-gray-200'
                }`}
              >
                <p className="whitespace-pre-wrap font-medium">{message.content}</p>
                <p
                  className={`mt-2 text-xs ${
                    message.role === 'user' ? 'text-blue-100' : 'text-black-900'
                  }`}
                >
                  {message.timestamp.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          ))}
          {processing && (
            <div className="flex justify-start">
              <div className="rounded-lg border-2 border-gray-200 bg-white p-4">
                <div className="flex gap-2">
                  <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" />
                  <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '0.1s' }} />
                  <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chat Input */}
        <div className="border-t-2 border-gray-200 bg-white p-4">
          <ChatInput
            onSend={handleSendMessage}
            placeholder="Type your message..."
            disabled={processing}
          />
        </div>
      </main>
    </div>
  );
}
