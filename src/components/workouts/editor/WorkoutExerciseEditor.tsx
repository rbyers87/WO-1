import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useExercises } from '../../../hooks/useExercises';
import type { WorkoutExerciseFormData } from '../../../hooks/useWorkoutEditor';

interface WorkoutExerciseEditorProps {
  exercises: WorkoutExerciseFormData[];
  onChange: (index: number, field: keyof WorkoutExerciseFormData, value: any) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}

export function WorkoutExerciseEditor({ 
  exercises, 
  onChange, 
  onAdd, 
  onRemove 
}: WorkoutExerciseEditorProps) {
  const { exercises: availableExercises, loading } = useExercises();

  if (loading) return null;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium dark:text-gray-100">Exercises</h3>
        <button
          type="button"
          onClick={onAdd}
          className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
        >
          <Plus className="h-4 w-4" />
          <span>Add Exercise</span>
        </button>
      </div>

      {exercises.map((exercise, index) => (
        <div key={index} className="border rounded-md p-4 space-y-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex justify-between items-start">
            <h4 className="font-medium dark:text-gray-100">Exercise {index + 1}</h4>
            {index > 0 && (
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium dark:text-gray-300">
              Exercise
            </label>
            <select
              value={exercise.exercise_id}
              onChange={(e) => onChange(index, 'exercise_id', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:focus:ring-indigo-600 dark:focus:border-indigo-500"
            >
              <option value="">Select exercise</option>
              {availableExercises.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      ))}
    </div>
  );
}