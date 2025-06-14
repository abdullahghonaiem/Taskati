import React, { useState, useRef } from 'react';
import type { Task } from '../data/tasks';
import { Trash } from 'lucide-react';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import { useDrop } from 'react-dnd';
import TaskCard from './TaskCard';
import TaskItem from './TaskItem';

export interface KanbanColumnProps {
  title: string;
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  status: Task['status'];
  onDropTask: (taskId: string, newStatus: Task['status']) => void;
  onReorderTask?: (dragIndex: number, hoverIndex: number, status: Task['status']) => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ 
  title, 
  tasks, 
  onEditTask, 
  onDeleteTask,
  status,
  onDropTask,
  onReorderTask
}) => {
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  // Create a ref for the drop target
  const columnRef = useRef<HTMLDivElement>(null);
  
  // Define colors based on column title
  const getColumnColor = () => {
    switch (title) {
      case 'Todo':
        return '#3b82f6'; // blue
      case 'In Progress':
        return '#f59e0b'; // amber
      case 'Done':
        return '#10b981'; // green
      default:
        return '#6b7280'; // gray
    }
  };

  const color = getColumnColor();
  
  // Setup drop target for this column
  const [{ isOver }, drop] = useDrop({
    accept: 'task',
    drop: (item: { id: string; index: number; status: string }) => {
      // If the task is from a different column, update its status
      if (item.status !== status) {
        onDropTask(item.id, status);
        return;
      }
      
      // If we're in the same column and have a reorder handler, do nothing here
      // The reordering is handled by the individual task card hover handlers
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  });
  
  // Connect the drop to our ref
  drop(columnRef);
  
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
  
  // Render task items based on whether we can reorder them
  const renderTasks = () => {
    if (tasks.length === 0) {
      return (
        <div className="empty-column">
          <p>No tasks in {title}</p>
        </div>
      );
    }
    
    // If we have a reorder function, use TaskItem components
    if (onReorderTask) {
      return tasks.map((task, index) => (
        <TaskItem
          key={task.id}
          task={task}
          index={index}
          onEditTask={onEditTask}
          onDeleteTask={(e) => handleDeleteClick(e, task)}
          onReorderTask={onReorderTask}
        />
      ));
    }
    
    // Otherwise use regular TaskCard components
    return tasks.map((task, index) => (
      <TaskCard
        key={task.id}
        task={task}
        index={index}
        onEditTask={onEditTask}
        onDeleteTask={(e) => handleDeleteClick(e, task)}
      />
    ));
  };
  
  return (
    <div className="board-column">
      <h2 className="column-header" style={{ backgroundColor: '#EEF2FF' }}>
        <span className="column-indicator" style={{ backgroundColor: color }}></span>
        {title} <span className="task-count">({tasks.length})</span>
      </h2>
      
      <div 
        ref={columnRef} 
        className={`task-list ${isOver ? 'task-list-drop-active' : ''}`}
      >
        {renderTasks()}
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

export default KanbanColumn; 