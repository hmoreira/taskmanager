import { useLanguage } from "@/contexts/LanguageContext";
import { databaseService, Task } from "@/services/database";
import { formatDateForDisplay, parseDateFromInput } from "@/utils/date-utils";
import { useEffect, useState } from "react";
import { Alert } from "react-native";

interface UseTaskManagerReturn {
  // Task data
  tasks: Task[];
  loading: boolean;
  
  // Modal state
  modalVisible: boolean;
  editingTask: Task | null;
  saving: boolean;
  
  // Form state
  title: string;
  description: string;
  expectedDate: string;
  status: number;
  pendingReason: string;
  pendingReasonType: 'task' | 'other';
  relatedTaskId: number | undefined;
  
  // Task operations
  fetchTasks: () => Promise<void>;
  handleSaveTask: () => Promise<void>;
  handleDeleteTask: (id: number) => void;
  
  // Modal operations
  openAddModal: () => void;
  openEditModal: (task: Task) => void;
  closeModal: () => void;
  
  // Form setters
  setTitle: (title: string) => void;
  setDescription: (description: string) => void;
  setExpectedDate: (date: string) => void;
  setStatus: (status: number) => void;
  setPendingReason: (reason: string) => void;
  setPendingReasonType: (type: 'task' | 'other') => void;
  setRelatedTaskId: (id: number | undefined) => void;
}

export const useTaskManager = (): UseTaskManagerReturn => {
  const { t } = useLanguage();
  
  // Task data state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [status, setStatus] = useState(-1); // -1 = not set, 0 = pending, 1 = completed
  const [pendingReason, setPendingReason] = useState("");
  const [pendingReasonType, setPendingReasonType] = useState<'task' | 'other'>('other');
  const [relatedTaskId, setRelatedTaskId] = useState<number | undefined>();

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
              Alert.alert(t('error'), 'Failed to delete task.');
            }
          },
        },
      ]
    );
  };

  return {
    // Task data
    tasks,
    loading,
    
    // Modal state
    modalVisible,
    editingTask,
    saving,
    
    // Form state
    title,
    description,
    expectedDate,
    status,
    pendingReason,
    pendingReasonType,
    relatedTaskId,
    
    // Task operations
    fetchTasks,
    handleSaveTask,
    handleDeleteTask,
    
    // Modal operations
    openAddModal,
    openEditModal,
    closeModal,
    
    // Form setters
    setTitle,
    setDescription,
    setExpectedDate,
    setStatus,
    setPendingReason,
    setPendingReasonType,
    setRelatedTaskId,
  };
};