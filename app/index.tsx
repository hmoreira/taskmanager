import { supabase } from "@/constants/supabase";
import { Task } from "@/hooks/use-tasks-api";
import { useEffect, useState } from "react";
import { Alert, Button, FlatList, StyleSheet, Text, TextInput, View } from "react-native";

export default function Page() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const fetchTasks = async () => {
    console.log("Starting to fetch tasks...");
    setLoading(true);
    try {
      // First, let's try a simple count to see if we can access the table
      const { count, error: countError } = await supabase
        .from("tasks")
        .select("*", { count: 'exact', head: true });
      
      console.log("Table count:", { count, countError });
      
      const { data, error } = await supabase
        .from("tasks")
        .select("id, title, description, status, dueDate")
        .order("id", { ascending: false });
      
      console.log("Supabase response:", { data, error });
      console.log("Data length:", data?.length);
      
      if (error) {
        console.error("Supabase error:", error);
        Alert.alert("Error", `Failed to fetch tasks: ${error.message}`);
        setLoading(false);
        return;
      }
      
      console.log("Tasks fetched successfully:", data);
      setTasks(data || []);
      setLoading(false);
    } catch (err) {
      console.error("Fetch tasks error:", err);
      Alert.alert("Error", "Failed to fetch tasks due to network or other error.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleAddTask = async () => {
      if (!title.trim()) return;
      console.log("Adding task:", { title, description });
      setAdding(true);
      try {
        const { data, error } = await supabase.from('tasks').insert([{ title, description, status: 0 }]).select();
        console.log("Add task response:", { data, error });
        
        if (error) {
          console.error("Add task error:", error);
          Alert.alert('Error', `Failed to add task: ${error.message}`);
        } else {
          console.log("Task added successfully:", data);
          setTitle('');
          setDescription('');
          await fetchTasks(); // Refresh the list
        }
      } catch (err) {
        console.error("Add task catch error:", err);
        Alert.alert('Error', 'Failed to add task due to network or other error.');
      }
      setAdding(false);
    };

  const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 24,
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
  },
  taskItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  taskDesc: {
    fontSize: 14,
    color: '#555',
  },
});

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Task Manager</Text>
      {loading ? (
        <Text>Loading...</Text>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.taskItem}>
              <Text style={styles.taskTitle}>{item.title}</Text>
              <Text style={styles.taskDesc}>{item.description}</Text>
            </View>
          )}
          ListEmptyComponent={<Text>No tasks yet.</Text>}
          style={{ flex: 1, marginBottom: 16 }}
        />
      )}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Title"
          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          style={styles.input}
          placeholder="Description"
          value={description}
          onChangeText={setDescription}
        />
        <Button title={adding ? 'Adding...' : 'Add Task'} onPress={handleAddTask} disabled={adding || !title.trim()} />
      </View>
    </View>
  );
}

