import { TaskList } from "@/components/tasks/task-list";
import { TaskModal } from "@/components/tasks/task-modal";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTaskManager } from "@/hooks/use-task-manager";
import { LinearGradient } from 'expo-linear-gradient';
import {
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

export default function TaskManagerApp() {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  
  const {
    tasks,
    loading,
    modalVisible,
    editingTask,
    saving,
    title,
    description,
    expectedDate,
    status,
    pendingReason,
    pendingReasonType,
    relatedTaskId,
    openAddModal,
    openEditModal,
    closeModal,
    handleSaveTask,
    handleDeleteTask,
    setTitle,
    setDescription,
    setExpectedDate,
    setStatus,
    setPendingReason,
    setPendingReasonType,
    setRelatedTaskId,
  } = useTaskManager();

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2', '#f093fb']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar 
          barStyle="light-content" 
          backgroundColor="#667eea"
        />
      
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>{t('appTitle')}</Text>
            <Text style={styles.headerSubtitle}>
              {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
            </Text>
          </View>
          <LanguageSwitcher />
        </View>

        {/* Task List */}
        <View style={styles.listContainer}>
          <TaskList
            tasks={tasks}
            loading={loading}
            onEditTask={openEditModal}
            onDeleteTask={handleDeleteTask}
          />
        </View>

        {/* Floating Add Button */}
        <TouchableOpacity 
          style={[styles.floatingButton, { bottom: Math.max(20, insets.bottom + 20) }]}
          onPress={openAddModal}
          activeOpacity={0.8}
        >
          <Text style={styles.floatingButtonText}>+</Text>
        </TouchableOpacity>

        {/* Add/Edit Task Modal */}
        <TaskModal
          visible={modalVisible}
          editingTask={editingTask}
          title={title}
          description={description}
          expectedDate={expectedDate}
          status={status}
          pendingReason={pendingReason}
          pendingReasonType={pendingReasonType}
          relatedTaskId={relatedTaskId}
          saving={saving}
          tasks={tasks}
          onClose={closeModal}
          onSave={handleSaveTask}
          onTitleChange={setTitle}
          onDescriptionChange={setDescription}
          onExpectedDateChange={setExpectedDate}
          onStatusChange={setStatus}
          onPendingReasonChange={setPendingReason}
          onPendingReasonTypeChange={setPendingReasonType}
          onRelatedTaskIdChange={setRelatedTaskId}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  headerLeft: {
    flex: 1,
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
    backgroundColor: 'transparent',
  },
  floatingButton: {
    position: 'absolute',
    right: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  floatingButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 28,
  },
});