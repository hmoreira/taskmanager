import * as SQLite from 'expo-sqlite';

export type Task = {
  id: number;
  title: string;
  description: string;
  status: number; // 0 = pending, 1 = completed
  due_date?: string;
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
        status INTEGER DEFAULT 0,
        due_date TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
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

  async addTask(title: string, description: string = ''): Promise<Task> {
    try {
      const result = this.db.runSync(
        'INSERT INTO tasks (title, description, status) VALUES (?, ?, 0)',
        [title, description]
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
}

// Export a singleton instance
export const databaseService = new DatabaseService();