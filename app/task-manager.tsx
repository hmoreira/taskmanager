import { DatePicker } from "@/components/tasks/date-picker";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { useLanguage } from "@/contexts/LanguageContext";
import { databaseService, Task } from "@/services/database";
import { formatDateForDisplay, parseDateFromInput, safeFormatDate } from "@/utils/date-utils";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

export default function TaskManagerApp() {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [status, setStatus] = useState(-1); // -1 = not set, 0 = pending, 1 = completed
  const [pendingReason, setPendingReason] = useState("");
  const [pendingReasonType, setPendingReasonType] = useState<'task' | 'other'>('other');
  const [relatedTaskId, setRelatedTaskId] = useState<number | undefined>();
  const [saving, setSaving] = useState(false);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const data = await databaseService.getAllTasks();
      setTasks(data);
    } catch (err) {
      // Set tasks to empty array so empty state can show
      setTasks([]);
      Alert.alert(t('error'), t('failedToFetch'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Navigation bar is configured in app.json via expo-navigation-bar plugin

  const openAddModal = () => {
    setEditingTask(null);
    setTitle("");
    setDescription("");
    // Set expected date to current date by default
    const today = new Date();
    setExpectedDate(today.toLocaleDateString());
    setStatus(-1); // Default to not set
    setPendingReason("");
    setPendingReasonType('other');
    setRelatedTaskId(undefined);
    setModalVisible(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description || "");
    // Convert stored ISO date to display format, or use current date if missing
    if (task.expected_date) {
      setExpectedDate(formatDateForDisplay(task.expected_date));
    } else {
      const today = new Date();
      setExpectedDate(today.toLocaleDateString());
    }
    setStatus(task.status);
    setPendingReason(task.pending_reason || "");
    setPendingReasonType(task.pending_reason_type || 'other');
    setRelatedTaskId(task.related_task_id);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingTask(null);
    setTitle("");
    setDescription("");
    setExpectedDate("");
    setStatus(-1);
    setPendingReason("");
    setPendingReasonType('other');
    setRelatedTaskId(undefined);
  };

  const handleSaveTask = async () => {
    if (!title.trim()) return;
    
    // Validation for pending status
    if (status === 0) { // If pending
      if (pendingReasonType === 'other' && (!pendingReason || !pendingReason.trim())) {
        Alert.alert(t('validationError'), t('pleaseProvideReason'));
        return;
      }
      if (pendingReasonType === 'task' && !relatedTaskId) {
        Alert.alert(t('validationError'), t('pleaseSelectTask'));
        return;
      }
    }
    
    setSaving(true);
    try {
      // Ensure we always have an expected date (use current date if empty)
      let dateToUse = expectedDate;
      if (!dateToUse || !dateToUse.trim()) {
        const today = new Date();
        dateToUse = today.toLocaleDateString();
      }
      
      // Convert expected date to ISO format for storage
      const isoDate = parseDateFromInput(dateToUse);
      
      // Prepare pending reason data
      const pendingData = status === 0 ? {
        pending_reason: pendingReasonType === 'other' ? pendingReason : undefined,
        pending_reason_type: pendingReasonType,
        related_task_id: pendingReasonType === 'task' ? relatedTaskId : undefined
      } : {
        pending_reason: undefined,
        pending_reason_type: undefined,
        related_task_id: undefined
      };
      
      if (editingTask) {
        // Update existing task
        await databaseService.updateTask(editingTask.id, { 
          title, 
          description,
          expected_date: isoDate,
          status,
          ...pendingData
        });
      } else {
        // Add new task
        await databaseService.addTask(
          title, 
          description, 
          isoDate, 
          status, 
          pendingData.pending_reason,
          pendingData.pending_reason_type,
          pendingData.related_task_id
        );
      }
      await fetchTasks();
      closeModal();
    } catch (err) {
      Alert.alert(t('error'), t('failedToSave'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTask = async (id: number) => {
    Alert.alert(
      t('deleteConfirmTitle'),
      t('deleteConfirmMessage'),
      [
        {
          text: t('cancel'),
          style: 'cancel',
        },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await databaseService.deleteTask(id);
              await fetchTasks();
            } catch (err) {
              Alert.alert('Error', 'Failed to delete task.');
            }
          },
        },
      ]
    );
  };

  const getStatusDisplay = (status: number) => {
    switch (status) {
      case 1:
        return { text: t('completed'), style: 'completed' };
      case 0:
        return { text: t('pending'), style: 'pending' };
      default:
        return { text: t('notSet'), style: 'notset' };
    }
  };

  const renderTaskItem = ({ item }: { item: Task }) => {
    const statusInfo = getStatusDisplay(item.status);
    
    return (
      <TouchableOpacity 
        style={styles.taskCard}
        onPress={() => openEditModal(item)}
        activeOpacity={0.7}
      >
        <View style={styles.taskContent}>
        <View style={styles.taskHeader}>
          <Text style={styles.taskTitle}>{item.title}</Text>
          <View style={[
            styles.statusBadge,
            statusInfo.style === 'completed' ? styles.statusBadgeCompleted : 
            statusInfo.style === 'pending' ? styles.statusBadgePending : styles.statusBadgeNotSet
          ]}>
            <Text style={[
              styles.statusBadgeText,
              statusInfo.style === 'completed' ? styles.statusBadgeTextCompleted : 
              statusInfo.style === 'pending' ? styles.statusBadgeTextPending : styles.statusBadgeTextNotSet
            ]}>
              {statusInfo.text}
            </Text>
          </View>
        </View>
        {item.description ? (
          <Text style={styles.taskDescription}>{item.description}</Text>
        ) : null}
        {item.expected_date ? (
          <Text style={styles.taskExpectedDate}>
            {t('expected')}: {safeFormatDate(item.expected_date)}
          </Text>
        ) : null}
        {item.status === 0 && (item.pending_reason || item.related_task_id) ? (
          <View style={styles.pendingReason}>
            {item.pending_reason_type === 'task' && item.related_task_id ? (
              <Text style={styles.pendingReasonText}>
                {t('pending')}: {t('waitingForTask')} "
                {tasks.find(t => t.id === item.related_task_id)?.title || t('unknownTask')}"
              </Text>
            ) : item.pending_reason ? (
              <Text style={styles.pendingReasonText}>
                {t('pending')}: {item.pending_reason}
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>
      <TouchableOpacity 
        style={styles.deleteButton}
        onPress={() => handleDeleteTask(item.id)}
      >
        <Text style={styles.deleteText}>×</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>{t('noTasks')}</Text>
      <Text style={styles.emptySubtitle}>{t('noTasksDescription')}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor="#f5f6fa"
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
        style={[styles.floatingButton, { bottom: Math.max(20, insets.bottom + 20) }]}
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
              {editingTask ? t('editTask') : t('addTask')}
            </Text>
            <TouchableOpacity 
              onPress={handleSaveTask}
              disabled={!title.trim() || saving}
            >
              <Text style={[
                styles.modalSaveText,
                (!title.trim() || saving) && styles.modalSaveTextDisabled
              ]}>
                {saving ? t('saving') : t('save')}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.modalContent}
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.inputLabel}>{t('title')}</Text>
            <TextInput
              style={styles.modalInput}
              placeholder={t('enterTitle')}
              value={title}
              onChangeText={setTitle}
              maxLength={100}
              autoFocus
            />

            <Text style={styles.inputLabel}>{t('description')}</Text>
            <TextInput
              style={[styles.modalInput, styles.modalDescriptionInput]}
              placeholder={t('enterDescription')}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              maxLength={500}
              textAlignVertical="top"
            />

            <Text style={styles.inputLabel}>{t('expectedDateRequired')}</Text>
            <DatePicker
              value={expectedDate}
              onDateChange={setExpectedDate}
              placeholder={t('selectDate')}
            />

            <Text style={styles.inputLabel}>{t('status')}</Text>
            <View style={styles.statusContainer}>
              <TouchableOpacity
                style={[
                  styles.statusButton,
                  status === -1 && styles.statusButtonActive
                ]}
                onPress={() => {
                  setStatus(-1);
                  setPendingReason("");
                  setPendingReasonType('other');
                  setRelatedTaskId(undefined);
                }}
              >
                <Text style={[
                  styles.statusButtonText,
                  status === -1 && styles.statusButtonTextActive
                ]}>
                  {t('notSet')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.statusButton,
                  status === 0 && styles.statusButtonActive
                ]}
                onPress={() => setStatus(0)}
              >
                <Text style={[
                  styles.statusButtonText,
                  status === 0 && styles.statusButtonTextActive
                ]}>
                  {t('pending')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.statusButton,
                  { marginRight: 0 },
                  status === 1 && styles.statusButtonActive
                ]}
                onPress={() => {
                  setStatus(1);
                  setPendingReason(""); // Clear pending reason when marking as completed
                  setPendingReasonType('other');
                  setRelatedTaskId(undefined);
                }}
              >
                <Text style={[
                  styles.statusButtonText,
                  status === 1 && styles.statusButtonTextActive
                ]}>
                  {t('completed')}
                </Text>
              </TouchableOpacity>
            </View>

            {status === 0 && (
              <>
                <Text style={styles.inputLabel}>{t('whyPending')}</Text>
                
                {/* Pending Reason Type Selector */}
                <View style={styles.reasonTypeContainer}>
                  <TouchableOpacity
                    style={[
                      styles.reasonTypeButton,
                      pendingReasonType === 'task' && styles.reasonTypeButtonActive
                    ]}
                    onPress={() => {
                      setPendingReasonType('task');
                      setPendingReason(""); // Clear text reason when switching to task
                    }}
                  >
                    <Text style={[
                      styles.reasonTypeButtonText,
                      pendingReasonType === 'task' && styles.reasonTypeButtonTextActive
                    ]}>
                      {t('relatedTask')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.reasonTypeButton,
                      pendingReasonType === 'other' && styles.reasonTypeButtonActive
                    ]}
                    onPress={() => {
                      setPendingReasonType('other');
                      setRelatedTaskId(undefined); // Clear task selection when switching to text
                    }}
                  >
                    <Text style={[
                      styles.reasonTypeButtonText,
                      pendingReasonType === 'other' && styles.reasonTypeButtonTextActive
                    ]}>
                      {t('otherMotive')}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Related Task Selector */}
                {pendingReasonType === 'task' && (
                  <>
                    <Text style={styles.subLabel}>{t('selectRelatedTask')}</Text>
                    <View style={styles.taskSelectorContainer}>
                      <TouchableOpacity 
                        style={styles.taskSelector}
                        onPress={() => {
                          // Show task picker modal or dropdown
                          Alert.alert(
                            t('selectRelatedTaskTitle'),
                            t('selectRelatedTaskMessage'),
                            [
                              { text: t('cancel'), style: 'cancel' },
                              ...tasks
                                .filter(t => t.id !== editingTask?.id) // Don't include self
                                .map(task => ({
                                  text: task.title,
                                  onPress: () => setRelatedTaskId(task.id)
                                }))
                            ]
                          );
                        }}
                      >
                        <Text style={[
                          styles.taskSelectorText,
                          !relatedTaskId && styles.taskSelectorPlaceholder
                        ]}>
                          {relatedTaskId 
                            ? tasks.find(t => t.id === relatedTaskId)?.title || 'Unknown Task'
                            : 'Select a task...'
                          }
                        </Text>
                        <Text style={styles.taskSelectorArrow}>▼</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}

                {/* Other Motive Text Input */}
                {pendingReasonType === 'other' && (
                  <>
                    <Text style={styles.subLabel}>{t('pendingReason')} *</Text>
                    <TextInput
                      style={[styles.modalInput, styles.modalDescriptionInput]}
                      placeholder={t('enterPendingReason')}
                      value={pendingReason}
                      onChangeText={setPendingReason}
                      multiline
                      numberOfLines={3}
                      maxLength={300}
                      textAlignVertical="top"
                    />
                  </>
                )}
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e8eaed',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  },
  listContent: {
    paddingTop: 16,
    paddingBottom: 140, // Space for floating button (now higher up)
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
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
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
  taskExpectedDate: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 4,
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
    backgroundColor: '#f5f6fa',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e8eaed',
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
  },
  modalScrollContent: {
    padding: 20,
    paddingBottom: 60,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 8,
    marginTop: 16,
  },
  modalInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#212529',
  },
  modalDescriptionInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  statusContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  statusButton: {
    flex: 1,
    backgroundColor: '#f8f9fc',
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 8,
    padding: 10,
    marginRight: 6,
    alignItems: 'center',
  },
  statusButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  statusButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6c757d',
  },
  statusButtonTextActive: {
    color: '#fff',
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusBadgeCompleted: {
    backgroundColor: '#d1f2df',
  },
  statusBadgePending: {
    backgroundColor: '#fff4d6',
  },
  statusBadgeNotSet: {
    backgroundColor: '#f5f5f5',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusBadgeTextCompleted: {
    color: '#155724',
  },
  statusBadgeTextPending: {
    color: '#856404',
  },
  statusBadgeTextNotSet: {
    color: '#666666',
  },
  pendingReason: {
    marginTop: 4,
    backgroundColor: '#fff4d6',
    padding: 8,
    borderRadius: 6,
  },
  pendingReasonText: {
    fontSize: 12,
    color: '#856404',
    fontStyle: 'italic',
  },
  reasonTypeContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  reasonTypeButton: {
    flex: 1,
    backgroundColor: '#f8f9fc',
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 8,
    padding: 10,
    marginRight: 8,
    alignItems: 'center',
  },
  reasonTypeButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  reasonTypeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6c757d',
  },
  reasonTypeButtonTextActive: {
    color: '#fff',
  },
  subLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 6,
    marginTop: 8,
  },
  taskSelectorContainer: {
    marginBottom: 12,
  },
  taskSelector: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskSelectorText: {
    fontSize: 16,
    color: '#212529',
    flex: 1,
  },
  taskSelectorPlaceholder: {
    color: '#6c757d',
    fontStyle: 'italic',
  },
  taskSelectorArrow: {
    fontSize: 12,
    color: '#6c757d',
    marginLeft: 8,
  },
});