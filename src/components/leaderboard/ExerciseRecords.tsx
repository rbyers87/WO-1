import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Dumbbell } from 'lucide-react';
import { LoadingSpinner } from '../common/LoadingSpinner';
import type { ExerciseScore } from '../../types/workout';

export function ExerciseRecords() {
  const [records, setRecords] = useState<ExerciseScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchExerciseRecords() {
      try {
        setLoading(true);
        setError(null);
        
        // First fetch exercise scores
        const { data: scores, error: scoresError } = await supabase
          .from('exercise_scores')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);

        if (scoresError) throw scoresError;
        if (!scores) throw new Error('No scores found');

        // Get unique exercise IDs
        const exerciseIds = [...new Set(scores.map(score => score.exercise_id))];

        // Then fetch the corresponding exercises
        const { data: exercises, error: exercisesError } = await supabase
          .from('exercises')
          .select('*')
          .in('id', exerciseIds);

        if (exercisesError) throw exercisesError;

        // Combine the data
        const combinedRecords = scores.map(score => ({
          ...score,
          exercise: exercises?.find(ex => ex.id === score.exercise_id)
        }));

        setRecords(combinedRecords);
      } catch (error) {
        console.error('Error fetching exercise records:', error);
        setError('Failed to load exercise records. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchExerciseRecords();
  }, []);

  if (loading) return <LoadingSpinner />;
  
  if (error) {
    return (
      <div className="bg-white dark:bg-darkBackground dark:text-gray-100 dark:text-gray-200 rounded-lg shadow-md p-6 transition-all duration-300">
        <p className="text-red-500 text-center">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-darkBackground dark:text-gray-100 dark:text-gray-200 rounded-lg shadow-md p-6 transition-all duration-300">
      <h2 className="text-xl font-bold dark:text-gray-100 mb-4">Exercise Records</h2>
      <div className="space-y-4">
        {records.map((record) => (
          <div
            key={record.id}
            className="flex items-center justify-between p-3 dark:bg-gray-800 rounded-lg"
          >
            <div className="flex items-center space-x-3">
              <Dumbbell className="h-5 w-5 text-indigo-600" />
              <div>
                <p className="font-medium dark:text-gray-100">{record.exercise?.name || 'Unknown Exercise'}</p>
                <div className="text-sm text-gray-500">
                  {record.weight > 0 && `${record.weight}lbs`}
                  {record.reps > 0 && ` × ${record.reps} reps`}
                  {record.distance > 0 && ` • ${record.distance} meters`}
                  {record.time > 0 && ` • ${record.time} seconds`}
                  {record.calories > 0 && ` • ${record.calories} calories`}
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {record.date ? new Date(record.date).toLocaleDateString() : 
               new Date(record.created_at).toLocaleDateString()}
            </div>
          </div>
        ))}
        {records.length === 0 && (
          <p className="text-center text-gray-500 py-4">
            No exercise records yet
          </p>
        )}
      </div>
    </div>
  );
}
