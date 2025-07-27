import { useState, useCallback } from 'react';
import { Task } from './types';

interface HistoryState {
  past: Task[][];
  present: Task[];
  future: Task[][];
}

export function useTaskHistory(initialTasks: Task[] = []) {
  const [history, setHistory] = useState<HistoryState>({
    past: [],
    present: initialTasks,
    future: []
  });

  const setState = useCallback((newTasks: Task[] | ((prev: Task[]) => Task[])) => {
    setHistory(prev => {
      const newPresent = typeof newTasks === 'function' ? newTasks(prev.present) : newTasks;
      return {
        past: [...prev.past, prev.present],
        present: newPresent,
        future: []
      };
    });
  }, []);

  const undo = useCallback(() => {
    setHistory(prev => {
      if (prev.past.length === 0) return prev;
      const previous = prev.past[prev.past.length - 1];
      const newPast = prev.past.slice(0, prev.past.length - 1);
      return {
        past: newPast,
        present: previous,
        future: [prev.present, ...prev.future]
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory(prev => {
      if (prev.future.length === 0) return prev;
      const next = prev.future[0];
      const newFuture = prev.future.slice(1);
      return {
        past: [...prev.past, prev.present],
        present: next,
        future: newFuture
      };
    });
  }, []);

  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  return {
    tasks: history.present,
    setState,
    undo,
    redo,
    canUndo,
    canRedo
  };
}