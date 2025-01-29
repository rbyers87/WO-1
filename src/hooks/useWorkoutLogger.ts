import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Workout } from '../types/workout';

interface LoggedSet {
  weight: number;
  reps: number;
}

interface ExerciseLog {
  exercise_id: string;
  sets: LoggedSet[];
}

export function useWorkoutLogger() {
  const { user } = useAuth();
  const [logging, setLogging] = useState(false);

  const startWorkoutLogging = async (workout: Workout) => {
    if (!user) {
      throw new Error('User must be logged in to start a workout');
    }

    setLogging(true);

    // Initialize exercise logs based on workout exercises
    const initialLogs: ExerciseLog[] = workout.workout_exercises?.map((exercise) => ({
      exercise_id: exercise.exercise_id,
      sets: Array(exercise.sets).fill({
        weight: exercise.weight || 0,
        reps: exercise.reps,
      }),
    })) || [];

    return initialLogs;
  };

  const logWorkout = async (
    workout: Workout,
    logs: ExerciseLog[],
    notes: string = ''
  ) => {
    if (!user) {
      throw new Error('User must be logged in to log a workout');
    }

    try {
      // Calculate total score based on weight * reps for each set
      const totalScore = logs.reduce((total, log) => {
        return total + log.sets.reduce((setTotal, set) => {
          return setTotal + (set.weight * set.reps);
        }, 0);
      }, 0);

      // Create workout log
      const { data: workoutLog, error: workoutError } = await supabase
        .from('workout_logs')
        .insert({
          user_id: user.id,
          workout_id: workout.id,
          notes,
          score: totalScore,
        })
        .select()
        .single();

      if (workoutError) throw workoutError;

      // Create exercise scores
      const exerciseScores = logs.flatMap((log) =>
        log.sets.map((set) => ({
          user_id: user.id,
          workout_log_id: workoutLog.id,
          exercise_id: log.exercise_id,
          weight: set.weight,
          reps: set.reps,
        }))
      );

      const { error: scoresError } = await supabase
        .from('exercise_scores')
        .insert(exerciseScores);

      if (scoresError) throw scoresError;

      return workoutLog;
    } catch (error) {
      console.error('Error logging workout:', error);
      throw error;
    } finally {
      setLogging(false);
    }
  };

  return {
    logging,
    startWorkoutLogging,
    logWorkout,
  };
}
