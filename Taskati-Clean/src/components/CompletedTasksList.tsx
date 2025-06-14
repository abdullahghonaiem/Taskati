import React, { useEffect, useState } from 'react';
import type { Task } from '../data/tasks';
import TaskCard from './TaskCard';
import TaskItem from './TaskItem';
import DeleteConfirmationModal from './DeleteConfirmationModal';

interface CompletedTasksListProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onReorderTask?: (dragIndex: number, hoverIndex: number, status: Task['status']) => void;
}

const CompletedTasksList: React.FC<CompletedTasksListProps> = ({ 
  tasks, 
  onEditTask, 
  onDeleteTask,
  onReorderTask
}) => {
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Add debugging
  useEffect(() => {
    console.log('CompletedTasksList rendered with tasks:', tasks);
  }, [tasks]);

  // Open the delete confirmation modal
  const handleDeleteClick = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    setTaskToDelete(task);
    setIsDeleteModalOpen(true);
  };
  
  // Close the delete confirmation modal
  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setTaskToDelete(null);
  };
  
  // Confirm task deletion
  const handleConfirmDelete = () => {
    if (taskToDelete) {
      onDeleteTask(taskToDelete.id);
    }
  };

  if (tasks.length === 0) {
    console.log('CompletedTasksList: No tasks to display');
    return (
      <div className="completed-tasks-empty">
        <div className="empty-state">
          <div className="empty-icon">🎉</div>
          <h3>No Completed Tasks</h3>
          <p>Tasks you complete will appear here.</p>
        </div>
      </div>
    );
  }

  console.log('CompletedTasksList: Rendering', tasks.length, 'tasks');
  return (
    <div className="completed-tasks-list">
      <div className="completed-tasks-header">
        <h2>Completed Tasks</h2>
        <span className="task-count">({tasks.length})</span>
      </div>
      
      <div className="completed-tasks-grid">
        {tasks.map((task, index) => (
          onReorderTask ? (
            <TaskItem
              key={task.id}
              task={task}
              index={index}
              onEditTask={onEditTask}
              onDeleteTask={(e) => handleDeleteClick(e, task)}
              onReorderTask={onReorderTask}
            />
          ) : (
            <div key={task.id} className="completed-task-item">
              <TaskCard
                task={task}
                index={index}
                onEditTask={onEditTask}
                onDeleteTask={(e) => handleDeleteClick(e, task)}
              />
            </div>
          )
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      {taskToDelete && (
        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={handleCloseDeleteModal}
          onConfirm={handleConfirmDelete}
          taskTitle={taskToDelete.title}
        />
      )}
    </div>
  );
};

export default CompletedTasksList; 