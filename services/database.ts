import * as SQLite from 'expo-sqlite';

export type Task = {
  id: number;
  title: string;
  description: string;
  status: number; // -1 = not set, 0 = pending, 1 = completed
  expected_date?: string;
  pending_reason?: string;
  pending_reason_type?: 'task' | 'other'; // Type of pending reason
  related_task_id?: number; // ID of related task if pending_reason_type is 'task'
  created_at: string;
};

class DatabaseService {
  private db: SQLite.SQLiteDatabase;

  constructor() {
    this.db = SQLite.openDatabaseSync('tasks.db');
    this.initializeDatabase();
  }

  private initializeDatabase() {
    // Create tasks table if it doesn't exist
    this.db.execSync(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        status INTEGER DEFAULT -1,
        expected_date TEXT,
        pending_reason TEXT,
        pending_reason_type TEXT,
        related_task_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Migration: Rename due_date to expected_date if it exists
    try {
      // Check if columns exist
      const tableInfo = this.db.getAllSync("PRAGMA table_info(tasks)") as Array<{name: string}>;
      const hasDueDate = tableInfo.some(col => col.name === 'due_date');
      const hasExpectedDate = tableInfo.some(col => col.name === 'expected_date');
      const hasPendingReason = tableInfo.some(col => col.name === 'pending_reason');
      const hasPendingReasonType = tableInfo.some(col => col.name === 'pending_reason_type');
      const hasRelatedTaskId = tableInfo.some(col => col.name === 'related_task_id');
      
      if (hasDueDate && !hasExpectedDate) {
        // Rename due_date to expected_date
        this.db.execSync('ALTER TABLE tasks RENAME COLUMN due_date TO expected_date');
      }

      // Add pending_reason column if it doesn't exist
      if (!hasPendingReason) {
        this.db.execSync('ALTER TABLE tasks ADD COLUMN pending_reason TEXT');
      }

      // Add new columns for enhanced pending reasons
      if (!hasPendingReasonType) {
        this.db.execSync('ALTER TABLE tasks ADD COLUMN pending_reason_type TEXT');
      }

      if (!hasRelatedTaskId) {
        this.db.execSync('ALTER TABLE tasks ADD COLUMN related_task_id INTEGER');
      }
    } catch (error) {
      // If migration fails, it's likely because the column doesn't exist or was already migrated
      console.log('Migration note:', error);
    }
  }

  async getAllTasks(): Promise<Task[]> {
    try {
      const result = this.db.getAllSync('SELECT * FROM tasks ORDER BY id DESC') as Task[];
      return result;
    } catch (error) {
      console.error('Error fetching tasks:', error);
      throw error;
    }
  }

  async addTask(
    title: string, 
    description: string = '', 
    expectedDate?: string, 
    status: number = -1, 
    pendingReason?: string,
    pendingReasonType?: 'task' | 'other',
    relatedTaskId?: number
  ): Promise<Task> {
    try {
      const result = this.db.runSync(
        'INSERT INTO tasks (title, description, status, expected_date, pending_reason, pending_reason_type, related_task_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [title, description, status, expectedDate || null, pendingReason || null, pendingReasonType || null, relatedTaskId || null]
      );
      
      // Get the newly created task
      const newTask = this.db.getFirstSync(
        'SELECT * FROM tasks WHERE id = ?',
        [result.lastInsertRowId]
      ) as Task;
      
      return newTask;
    } catch (error) {
      console.error('Error adding task:', error);
      throw error;
    }
  }

  async updateTask(id: number, updates: Partial<Omit<Task, 'id' | 'created_at'>>): Promise<Task> {
    try {
      const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
      const values = Object.values(updates);
      
      this.db.runSync(
        `UPDATE tasks SET ${setClause} WHERE id = ?`,
        [...values, id]
      );
      
      // Get the updated task
      const updatedTask = this.db.getFirstSync(
        'SELECT * FROM tasks WHERE id = ?',
        [id]
      ) as Task;
      
      return updatedTask;
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  }

  async deleteTask(id: number): Promise<void> {
    try {
      this.db.runSync('DELETE FROM tasks WHERE id = ?', [id]);
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  }

  async getTaskCount(): Promise<number> {
    try {
      const result = this.db.getFirstSync('SELECT COUNT(*) as count FROM tasks') as { count: number };
      return result.count;
    } catch (error) {
      console.error('Error getting task count:', error);
      throw error;
    }
  }

  async clearAllTasks(): Promise<void> {
    try {
      this.db.execSync('DELETE FROM tasks');
    } catch (error) {
      console.error('Error clearing all tasks:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export const databaseService = new DatabaseService();