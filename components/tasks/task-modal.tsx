import { DatePicker } from "@/components/tasks/date-picker";
import { useLanguage } from "@/contexts/LanguageContext";
import { Task } from "@/services/database";
import React from "react";
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface TaskModalProps {
  visible: boolean;
  editingTask: Task | null;
  title: string;
  description: string;
  expectedDate: string;
  status: number;
  pendingReason: string;
  pendingReasonType: 'task' | 'other';
  relatedTaskId: number | undefined;
  saving: boolean;
  tasks: Task[];
  onClose: () => void;
  onSave: () => void;
  onTitleChange: (text: string) => void;
  onDescriptionChange: (text: string) => void;
  onExpectedDateChange: (date: string) => void;
  onStatusChange: (status: number) => void;
  onPendingReasonChange: (reason: string) => void;
  onPendingReasonTypeChange: (type: 'task' | 'other') => void;
  onRelatedTaskIdChange: (id: number | undefined) => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  visible,
  editingTask,
  title,
  description,
  expectedDate,
  status,
  pendingReason,
  pendingReasonType,
  relatedTaskId,
  saving,
  tasks,
  onClose,
  onSave,
  onTitleChange,
  onDescriptionChange,
  onExpectedDateChange,
  onStatusChange,
  onPendingReasonChange,
  onPendingReasonTypeChange,
  onRelatedTaskIdChange,
}) => {
  const { t } = useLanguage();

  const handleStatusChange = (newStatus: number) => {
    onStatusChange(newStatus);
    if (newStatus !== 0) {
      // Clear pending-related fields when not pending
      onPendingReasonChange("");
      onPendingReasonTypeChange('other');
      onRelatedTaskIdChange(undefined);
    }
  };

  const handlePendingReasonTypeChange = (type: 'task' | 'other') => {
    onPendingReasonTypeChange(type);
    if (type === 'task') {
      onPendingReasonChange(""); // Clear text reason when switching to task
    } else {
      onRelatedTaskIdChange(undefined); // Clear task selection when switching to text
    }
  };

  const handleRelatedTaskSelection = () => {
    Alert.alert(
      t('selectRelatedTaskTitle'),
      t('selectRelatedTaskMessage'),
      [
        { text: t('cancel'), style: 'cancel' },
        ...tasks
          .filter(t => t.id !== editingTask?.id) // Don't include self
          .map(task => ({
            text: task.title,
            onPress: () => onRelatedTaskIdChange(task.id)
          }))
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalCancelText}>{t('cancel')}</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>
            {editingTask ? t('editTask') : t('addTask')}
          </Text>
          <TouchableOpacity 
            onPress={onSave}
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
            onChangeText={onTitleChange}
            maxLength={100}
            autoFocus
          />

          <Text style={styles.inputLabel}>{t('description')}</Text>
          <TextInput
            style={[styles.modalInput, styles.modalDescriptionInput]}
            placeholder={t('enterDescription')}
            value={description}
            onChangeText={onDescriptionChange}
            multiline
            numberOfLines={4}
            maxLength={500}
            textAlignVertical="top"
          />

          <Text style={styles.inputLabel}>{t('expectedDateRequired')}</Text>
          <DatePicker
            value={expectedDate}
            onDateChange={onExpectedDateChange}
            placeholder={t('selectDate')}
          />

          <Text style={styles.inputLabel}>{t('status')}</Text>
          <View style={styles.statusContainer}>
            <TouchableOpacity
              style={[
                styles.statusButton,
                status === -1 && styles.statusButtonActive
              ]}
              onPress={() => handleStatusChange(-1)}
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
              onPress={() => handleStatusChange(0)}
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
              onPress={() => handleStatusChange(1)}
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
                  onPress={() => handlePendingReasonTypeChange('task')}
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
                  onPress={() => handlePendingReasonTypeChange('other')}
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
                      onPress={handleRelatedTaskSelection}
                    >
                      <Text style={[
                        styles.taskSelectorText,
                        !relatedTaskId && styles.taskSelectorPlaceholder
                      ]}>
                        {relatedTaskId 
                          ? tasks.find(t => t.id === relatedTaskId)?.title || t('unknownTask')
                          : t('selectTask')
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
                    onChangeText={onPendingReasonChange}
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
  );
};

const styles = StyleSheet.create({
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