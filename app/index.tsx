import { databaseService, Task } from "@/services/database";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

export default function Page() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const data = await databaseService.getAllTasks();
      setTasks(data);
    } catch (err) {
      Alert.alert("Error", "Failed to fetch tasks from local database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const openAddModal = () => {
    setEditingTask(null);
    setTitle("");
    setDescription("");
    setModalVisible(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description || "");
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingTask(null);
    setTitle("");
    setDescription("");
  };

  const handleSaveTask = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      if (editingTask) {
        // Update existing task
        await databaseService.updateTask(editingTask.id, { title, description });
      } else {
        // Add new task
        await databaseService.addTask(title, description);
      }
      await fetchTasks();
      closeModal();
    } catch (err) {
      Alert.alert('Error', 'Failed to save task.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTask = async (id: number) => {
    try {
      await databaseService.deleteTask(id);
      await fetchTasks();
    } catch (err) {
      Alert.alert('Error', 'Failed to delete task.');
    }
  };

  const renderTaskItem = ({ item }: { item: Task }) => (
    <TouchableOpacity 
      style={styles.taskCard}
      onPress={() => openEditModal(item)}
      activeOpacity={0.7}
    >
      <View style={styles.taskContent}>
        <Text style={styles.taskTitle}>{item.title}</Text>
        {item.description ? (
          <Text style={styles.taskDescription}>{item.description}</Text>
        ) : null}
        <Text style={styles.taskDate}>
          {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>
      <TouchableOpacity 
        style={styles.deleteButton}
        onPress={() => handleDeleteTask(item.id)}
      >
        <Text style={styles.deleteText}>×</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>No tasks yet</Text>
      <Text style={styles.emptySubtitle}>Tap the + button to add your first task!</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Tasks</Text>
        <Text style={styles.headerSubtitle}>
          {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
        </Text>
      </View>

      {/* Task List */}
      <View style={styles.listContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading tasks...</Text>
          </View>
        ) : (
          <FlatList
            data={tasks}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderTaskItem}
            ListEmptyComponent={renderEmptyState}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={tasks.length === 0 ? styles.emptyListContent : styles.listContent}
          />
        )}
      </View>

      {/* Floating Add Button */}
      <TouchableOpacity 
        style={styles.floatingButton}
        onPress={openAddModal}
        activeOpacity={0.8}
      >
        <Text style={styles.floatingButtonText}>+</Text>
      </TouchableOpacity>

      {/* Add/Edit Task Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeModal}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingTask ? 'Edit Task' : 'New Task'}
            </Text>
            <TouchableOpacity 
              onPress={handleSaveTask}
              disabled={!title.trim() || saving}
            >
              <Text style={[
                styles.modalSaveText,
                (!title.trim() || saving) && styles.modalSaveTextDisabled
              ]}>
                {saving ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.inputLabel}>Title</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter task title"
              value={title}
              onChangeText={setTitle}
              maxLength={100}
              autoFocus
            />

            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.modalInput, styles.modalDescriptionInput]}
              placeholder="Enter description (optional)"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              maxLength={500}
              textAlignVertical="top"
            />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6c757d',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  listContent: {
    paddingTop: 16,
    paddingBottom: 80, // Space for floating button
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6c757d',
  },
  taskCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  taskDescription: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 20,
    marginBottom: 8,
  },
  taskDate: {
    fontSize: 12,
    color: '#adb5bd',
    fontWeight: '500',
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#dc3545',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  deleteText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 22,
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#495057',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 24,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  floatingButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 28,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#007AFF',
  },
  modalSaveText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  modalSaveTextDisabled: {
    color: '#adb5bd',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 8,
    marginTop: 16,
  },
  modalInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#212529',
  },
  modalDescriptionInput: {
    height: 100,
    textAlignVertical: 'top',
  },
});

