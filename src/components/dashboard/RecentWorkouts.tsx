import React, { useEffect, useState } from 'react';
    import { format } from 'date-fns';
    import { supabase } from '../../lib/supabase';
    import { useAuth } from '../../contexts/AuthContext';
    import type { WorkoutLog } from '../../types/workout';

    interface RecentWorkoutsProps {
      onWorkoutComplete?: () => void;
    }

    export function RecentWorkouts({ onWorkoutComplete }: RecentWorkoutsProps) {
      const { user } = useAuth();
      const [recentWorkouts, setRecentWorkouts] = useState<WorkoutLog[]>([]);
      const [loading, setLoading] = useState(true);

      const fetchRecentWorkouts = async () => {
        if (!user) return;
        setLoading(true);
        try {
          const { data, error } = await supabase
            .from('workout_logs')
            .select(`
              *,
              workout:workouts (*)
            `)
            .eq('user_id', user.id)
            .order('completed_at', { ascending: false })
            .limit(5);

          if (error) {
            console.error('Error fetching recent workouts:', error);
            return;
          }

          setRecentWorkouts(data);
        } finally {
          setLoading(false);
        }
      };

      useEffect(() => {
        fetchRecentWorkouts();
      }, [user, onWorkoutComplete]);

      return (
        <div className="bg-white dark:bg-darkBackground dark:text-gray-100 dark:text-gray-200 rounded-lg shadow-md p-6 transition-all duration-300">
          <h2 className="text-2xl font-bold dark:text-gray-100 mb-4">Recent Workouts</h2>
          
          <div className="space-y-4">
            {recentWorkouts.map((log) => (
              <div key={log.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium dark:text-gray-100">{log.workout.name}</p>
                  <p className="text-sm dark:text-gray-300">
                    {format(new Date(log.completed_at), 'PPP')}
                  </p>
                </div>
                <span className="text-indigo-600 font-medium">
                  Score: {log.total}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
