import React, { useState, useEffect } from 'react';
    import { supabase } from '../../lib/supabase';
    import { Trophy, Medal } from 'lucide-react';
    import { LoadingSpinner } from '../common/LoadingSpinner';
    import { format, startOfDay, endOfDay, subDays, addDays } from 'date-fns';

    interface UserRanking {
      id: string;
      first_name: string;
      last_name: string;
      profile_name: string;
      total_workouts: number;
      total_score: number;
      daily_score: number;
    }

    export function UserRankings() {
      const [rankings, setRankings] = useState<UserRanking[]>([]);
      const [loading, setLoading] = useState(true);
      const [selectedDate, setSelectedDate] = useState(new Date());

      useEffect(() => {
        async function fetchRankings() {
          try {
            setLoading(true);
            const todayStart = startOfDay(selectedDate).toISOString();
            const todayEnd = endOfDay(selectedDate).toISOString();

            const { data, error } = await supabase
              .from('workout_logs')
              .select(`
                user_id,
                score,
                profiles (
                  id,
                  first_name,
                  last_name,
                  profile_name
                ),
                workout:workouts (
                  id,
                  workout_exercises (
                    exercise_id,
                    exercise:exercises (
                      name
                    )
                  )
                )
              `)
              .gte('completed_at', todayStart)
              .lte('completed_at', todayEnd)
              .then(async ({ data }) => {
                if (!data) return [];

                const wodLogs = data.filter(log => log.workout?.workout_exercises?.some(ex => ex.exercise.name !== 'Run'));
                const runLogs = data.filter(log => log.workout?.workout_exercises?.some(ex => ex.exercise.name === 'Run'));

                const userStats = wodLogs.reduce((acc: Record<string, UserRanking>, log) => {
                  const profile = log.profiles;
                  if (!profile) return acc;

                  if (!acc[profile.id]) {
                    acc[profile.id] = {
                      id: profile.id,
                      first_name: profile.first_name || '',
                      last_name: profile.last_name || '',
                      profile_name: profile.profile_name || '',
                      total_workouts: 0,
                      total_score: 0,
                      daily_score: 0,
                    };
                  }

                  acc[profile.id].total_workouts++;
                  acc[profile.id].total_score += log.score;
                  acc[profile.id].daily_score += log.score;
                  return acc;
                }, {});

                const runUserStats = runLogs.reduce((acc: Record<string, UserRanking>, log) => {
                  const profile = log.profiles;
                  if (!profile) return acc;

                  if (!acc[profile.id]) {
                    acc[profile.id] = {
                      id: profile.id,
                      first_name: profile.first_name || '',
                      last_name: profile.last_name || '',
                      profile_name: profile.profile_name || '',
                      total_workouts: 0,
                      total_score: 0,
                      daily_score: 0,
                    };
                  }

                  acc[profile.id].total_workouts++;
                  acc[profile.id].total_score += log.score;
                  acc[profile.id].daily_score += log.score;
                  return acc;
                }, {});

                const combinedStats = { ...userStats, ...runUserStats };

                return Object.values(combinedStats).sort((a, b) => b.daily_score - a.daily_score).slice(0, 10);
              });

            setRankings(data || []);
          } catch (error) {
            console.error('Error fetching rankings:', error);
          } finally {
            setLoading(false);
          }
        }

        fetchRankings();
      }, [selectedDate]);

      const handlePrevDay = () => {
        setSelectedDate(prevDate => subDays(prevDate, 1));
      };

      const handleNextDay = () => {
        setSelectedDate(prevDate => addDays(prevDate, 1));
      };

      if (loading) return <LoadingSpinner />;

      return (
        <div className="bg-white dark:bg-darkBackground dark:text-gray-100 dark:text-gray-200 rounded-lg shadow-md p-6 transition-all duration-300">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-bold dark:text-gray-100 mb-2">User Rankings</h2>
              <p className="text-sm text-gray-500">Results for {format(selectedDate, 'PPP')}</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handlePrevDay}
                className="dark:bg-gray-700 hover:bg-gray-200 px-3 py-1 rounded"
              >
                Previous
              </button>
              <button
                onClick={handleNextDay}
                className="dark:bg-gray-700 hover:bg-gray-200 px-3 py-1 rounded"
              >
                Next
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {rankings.map((user, index) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 dark:bg-gray-800 rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {index === 0 ? (
                      <Trophy className="h-6 w-6 text-yellow-500" />
                    ) : index === 1 ? (
                      <Medal className="h-6 w-6 text-gray-400" />
                    ) : index === 2 ? (
                      <Medal className="h-6 w-6 text-amber-600" />
                    ) : (
                      <span className="w-6 text-center font-medium text-gray-500">
                        {index + 1}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-medium dark:text-gray-100">
                      {user.profile_name || `${user.first_name} ${user.last_name}`}
                    </p>
                    <p className="text-sm text-gray-500">
                      {user.total_workouts} workouts completed
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-indigo-600 font-medium">
                    {user.daily_score} points
                  </span>
                </div>
              </div>
            ))}

            {rankings.length === 0 && (
              <p className="text-center text-gray-500 py-4">
                No rankings available for {format(selectedDate, 'PPP')}
              </p>
            )}
          </div>
        </div>
      );
    }
