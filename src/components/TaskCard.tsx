import React, { useRef } from 'react';
import type { Task } from '../data/tasks';
import { Calendar, Clock, Trash } from 'lucide-react';
import { useDrag } from 'react-dnd';

interface TaskCardProps {
  task: Task;
  onEditTask: (task: Task) => void;
  onDeleteTask: (e: React.MouseEvent) => void;
  index: number;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onEditTask, onDeleteTask, index }) => {
  // Create a ref that will be used for the drag handle
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Setup drag source
  const [{ isDragging }, drag] = useDrag({
    type: 'task',
    item: { 
      id: task.id,
      index,
      status: task.status 
    },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  });
  
  // Connect the drag to our ref
  drag(cardRef);

  // Check if a date is in the past
  const isOverdue = (dateString: string) => {
    const taskDate = new Date(dateString);
    const today = new Date();
    // Reset time part for accurate date comparison
    today.setHours(0, 0, 0, 0);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate < today;
  };

  // Format date to more readable format
  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return 'No date';
      
      // Log the raw date string for debugging
      console.log('Raw date string:', dateString);
      
      // Check if it's already a formatted date string
      if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        // ISO format YYYY-MM-DD, parse and format
        const [year, month, day] = dateString.split('-').map(num => parseInt(num, 10));
        const date = new Date(year, month - 1, day); // month is 0-indexed in JS Date
        
        if (!isNaN(date.getTime())) {
          return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric'
          }).format(date);
        }
      }
      
      // Try parsing as a regular date string
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return new Intl.DateTimeFormat('en-US', {
          month: 'short',
          day: 'numeric'
        }).format(date);
      }
      
      // If we get here, the date is invalid
      console.error('Invalid date format:', dateString);
      return 'Invalid date';
    } catch (error) {
      console.error('Error formatting date:', error, dateString);
      return 'Date error';
    }
  };

  // Get due date status
  const getDueDateStatus = (deadline: string, status: string) => {
    // If task is already done, return 'done'
    if (status === 'Done') {
      return 'done';
    }
  
    // Handle missing date
    if (!deadline) {
      return 'no-date';
    }
  
    // Get current date (reset time to midnight for accurate day comparison)
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    // Parse the date carefully based on format
    let dueDate: Date;
    
    try {
      // Try to detect ISO format first (YYYY-MM-DD)
      if (typeof deadline === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(deadline)) {
        const [year, month, day] = deadline.split('-').map(num => parseInt(num, 10));
        dueDate = new Date(year, month - 1, day); // month is 0-indexed in JS Date
      } else {
        // Fallback to standard Date parsing
        dueDate = new Date(deadline);
      }
      
      // Check if date is valid
      if (isNaN(dueDate.getTime())) {
        console.error('Invalid due date in getDueDateStatus:', deadline);
        return 'invalid';
      }
      
      // Reset time portion for accurate day comparison
      dueDate.setHours(0, 0, 0, 0);
      
      // Calculate days until due
      const timeDiff = dueDate.getTime() - currentDate.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
  
      // If past due date
      if (daysDiff < 0) {
        return 'late';
      }
  
      // If due within 3 days
      if (daysDiff <= 3) {
        return 'soon';
      }
  
      // If due date is more than 3 days away
      return 'early';
    } catch (error) {
      console.error('Error processing due date:', error, deadline);
      return 'invalid';
    }
  };

  // Get deadline border color class
  const getDeadlineBorderClass = (status: string) => {
    switch (status) {
      case 'early':
        return 'border-l-4 border-green-500'; // green
      case 'soon':
        return 'border-l-4 border-yellow-500'; // yellow/amber
      case 'late':
        return 'border-l-4 border-red-500'; // red
      case 'done':
        return 'border-l-4 border-gray-400'; // gray
      case 'no-date':
      case 'invalid':
        return 'border-l-4 border-blue-400'; // blue
      default:
        return 'border-l-4 border-gray-300'; // light gray
    }
  };

  const dueDateStatus = getDueDateStatus(task.deadline, task.status);
  const borderClass = getDeadlineBorderClass(dueDateStatus);
  const formattedDate = formatDate(task.deadline);
  
  return (
    <div 
      ref={cardRef}
      className={`task-card priority-${task.priority.toLowerCase()} ${isDragging ? 'task-dragging' : ''} ${borderClass}`}
    >
      <div 
        className="task-content"
        onClick={() => onEditTask(task)}
      >
        <h4 className="task-title">{task.title}</h4>
        <p className="task-description">{task.description}</p>
        
        <div className="task-meta">
          <div className="task-priority">
            {task.priority}
          </div>
          <div className={`task-date ${isOverdue(task.deadline) && task.status !== 'Done' ? 'overdue' : ''}`}>
            {formattedDate}
            {isOverdue(task.deadline) && task.status !== 'Done' && (
              <span className="overdue-text"> • Overdue</span>
            )}
          </div>
        </div>
      </div>
      <button 
        className="delete-button" 
        onClick={onDeleteTask}
      >
        <Trash size={16} />
      </button>
    </div>
  );
};

export default TaskCard; 