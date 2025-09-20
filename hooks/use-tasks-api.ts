import { supabase } from '../constants/supabase';

export type Task = {
  id: number;
  title: string;
  description: string;
  status: number; // 0 = pending, 1 = completed
  due_date?: string;
};

export async function fetchTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('id', { ascending: false });
  if (error) throw error;
  return data as Task[];
}

export async function addTask(task: { title: string; description: string; due_date?: string }): Promise<Task> {
  // Always send status: 0 (pending) to satisfy NOT NULL constraint
  const insertObj = { ...task, status: 0 };
  const { data, error } = await supabase
    .from('tasks')
    .insert([insertObj])
    .select()
    .single();
  if (error) throw error;
  return data as Task;
}

export async function updateTask(id: number, updates: Partial<Task>): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Task;
}

export async function deleteTask(id: number): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id);
  if (error) throw error;
}
