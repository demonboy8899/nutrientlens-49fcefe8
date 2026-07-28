import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface SetData {
  setNumber: number;
  weight: string;
  reps: string;
  completed: boolean;
}

interface Exercise {
  id: string;
  name: string;
  sets: SetData[];
  previousBest?: { weight: string; reps: string };
}

export function WorkoutComponent() {
  const navigate = useNavigate();
  const [exercises, setExercises] = useState<Exercise[]>([
    {
      id: '1',
      name: 'Barbell Bench Press',
      sets: [
        { setNumber: 1, weight: '', reps: '', completed: false },
        { setNumber: 2, weight: '', reps: '', completed: false },
        { setNumber: 3, weight: '', reps: '', completed: false },
      ],
      previousBest: { weight: '80kg', reps: '8' }
    }
  ]);
  
  const [restTimeLeft, setRestTimeLeft] = useState<number>(0);
  const [isResting, setIsResting] = useState<boolean>(false);

  // Rest Timer countdown logic
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isResting && restTimeLeft > 0) {
      timer = setInterval(() => {
        setRestTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (restTimeLeft === 0) {
      setIsResting(false);
    }
    return () => clearInterval(timer);
  }, [isResting, restTimeLeft]);

  const startRestTimer = (seconds: number) => {
    setRestTimeLeft(seconds);
    setIsResting(true);
  };

  const toggleSetComplete = (exerciseId: string, setIndex: number) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        const updatedSets = [...ex.sets];
        updatedSets[setIndex] = {
          ...updatedSets[setIndex],
          completed: !updatedSets[setIndex].completed,
        };
        return { ...ex, sets: updatedSets };
      })
    );
    // Trigger standard 90s rest timer on set completion
    startRestTimer(90);
  };

  const updateSetValue = (exerciseId: string, setIndex: number, field: 'weight' | 'reps', value: string) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        const updatedSets = [...ex.sets];
        updatedSets[setIndex] = {
          ...updatedSets[setIndex],
          [field]: value,
        };
        return { ...ex, sets: updatedSets };
      })
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24 pt-4 px-4 max-w-md mx-auto relative">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Active Workout</h1>
          <p className="text-xs text-slate-400">Push Day - Chest & Triceps</p>
        </div>
        <button 
          onClick={() => navigate(-1)}
          className="px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-semibold rounded-lg"
        >
          Finish Workout
        </button>
      </div>

      {/* Rest Timer Banner */}
      {isResting && (
        <div className="mb-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium text-emerald-300">Rest Timer Active</span>
          </div>
          <span className="text-sm font-bold text-emerald-400 font-mono">
            {Math.floor(restTimeLeft / 60)}:{String(restTimeLeft % 60).padStart(2, '0')}
          </span>
        </div>
      )}

      {/* Exercise Cards */}
      <div className="space-y-4">
        {exercises.map((exercise) => (
          <div key={exercise.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-sm text-slate-200">{exercise.name}</h3>
                {exercise.previousBest && (
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Last: {exercise.previousBest.weight} × {exercise.previousBest.reps} reps
                  </p>
                )}
              </div>
            </div>

            {/* Form Guide Arc Animation Container */}
            <div className="mb-3 p-2 bg-slate-950/50 rounded-xl border border-slate-800/60 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold text-xs">
                AI
              </div>
              <div className="flex-1">
                <p className="text-[11px] text-slate-300 font-medium">Form Tracking Active</p>
                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                  <div className="bg-indigo-500 h-full w-3/4 rounded-full form-guide-arc animate-pulse" />
                </div>
              </div>
            </div>

            {/* Sets Header */}
            <div className="grid grid-cols-12 gap-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1">
              <span className="col-span-2 text-center">Set</span>
              <span className="col-span-4 text-center">Weight (kg)</span>
              <span className="col-span-4 text-center">Reps</span>
              <span className="col-span-2 text-center">Done</span>
            </div>

            {/* Sets Rows */}
            <div className="space-y-2">
              {exercise.sets.map((set, sIdx) => (
                <div 
                  key={set.setNumber} 
                  className={`grid grid-cols-12 gap-2 items-center p-1.5 rounded-xl transition-colors ${
                    set.completed ? 'bg-emerald-950/20 border border-emerald-500/20' : 'bg-slate-950/40'
                  }`}
                >
                  <span className="col-span-2 text-center text-xs font-bold text-slate-400">
                    {set.setNumber}
                  </span>
                  <div className="col-span-4">
                    <input
                      type="number"
                      placeholder="0"
                      value={set.weight}
                      onChange={(e) => updateSetValue(exercise.id, sIdx, 'weight', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-center py-1.5 rounded-lg text-xs font-medium text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="col-span-4">
                    <input
                      type="number"
                      placeholder="0"
                      value={set.reps}
                      onChange={(e) => updateSetValue(exercise.id, sIdx, 'reps', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-center py-1.5 rounded-lg text-xs font-medium text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="col-span-2 flex justify-center">
                    <button
                      onClick={() => toggleSetComplete(exercise.id, sIdx)}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                        set.completed
                          ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      ✓
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
