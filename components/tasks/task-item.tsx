import { useLanguage } from '@/contexts/LanguageContext';
import { Task } from '@/services/database';
import { safeFormatDate } from '@/utils/date-utils';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface TaskItemProps {
  item: Task;
  tasks: Task[]; // For finding related task titles
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({ item, tasks, onEdit, onDelete }) => {
  const { t } = useLanguage();
  
  const getStatusDisplay = (status: number) => {
    switch (status) {
      case 1:
        return { text: t('completed'), style: 'completed' as const };
      case 0:
        return { text: t('pending'), style: 'pending' as const };
      default:
        return { text: t('notSet'), style: 'notset' as const };
    }
  };

  const statusInfo = getStatusDisplay(item.status);

  return (
    <TouchableOpacity 
      style={styles.taskCard}
      onPress={() => onEdit(item)}
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
        onPress={() => onDelete(item.id)}
      >
        <Text style={styles.deleteText}>×</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
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
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
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
});