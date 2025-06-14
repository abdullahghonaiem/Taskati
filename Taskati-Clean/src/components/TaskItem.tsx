import React, { useRef } from 'react';
import type { Task } from '../data/tasks';
import { useDrag, useDrop } from 'react-dnd';
import type { DropTargetMonitor } from 'react-dnd';
import TaskCard from './TaskCard';

interface TaskItemProps {
  task: Task;
  index: number;
  onEditTask: (task: Task) => void;
  onDeleteTask: (e: React.MouseEvent) => void;
  onReorderTask: (dragIndex: number, hoverIndex: number, status: Task['status']) => void;
}

interface DragItem {
  index: number;
  id: string;
  status: string;
  type: string;
}

const TaskItem: React.FC<TaskItemProps> = ({ 
  task, 
  index, 
  onEditTask, 
  onDeleteTask, 
  onReorderTask 
}) => {
  const ref = useRef<HTMLDivElement>(null);
  
  // Define the drop handling logic
  const [{ handlerId }, drop] = useDrop<DragItem, void, { handlerId: string | symbol | null }>({
    accept: 'task',
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(item: DragItem, monitor: DropTargetMonitor) {
      if (!ref.current) {
        return;
      }
      
      // Only handle items from the same status column
      if (item.status !== task.status) {
        return;
      }
      
      const dragIndex = item.index;
      const hoverIndex = index;
      
      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return;
      }
      
      // Determine rectangle on screen
      const hoverBoundingRect = ref.current.getBoundingClientRect();
      
      // Get vertical middle
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      
      // Determine mouse position
      const clientOffset = monitor.getClientOffset();
      
      // Get pixels to the top
      const hoverClientY = clientOffset!.y - hoverBoundingRect.top;
      
      // Only perform the move when the mouse has crossed half of the item's height
      // When dragging downwards, only move when the cursor is below 50%
      // When dragging upwards, only move when the cursor is above 50%
      
      // Dragging downwards
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }
      
      // Dragging upwards
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }
      
      // Time to actually perform the action
      onReorderTask(dragIndex, hoverIndex, task.status);
      
      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for performance reasons to avoid expensive index searches
      item.index = hoverIndex;
    },
  });
  
  // Define the drag source
  const [{ isDragging }, drag] = useDrag({
    type: 'task',
    item: () => {
      return { id: task.id, index, status: task.status };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });
  
  // Initialize drag and drop refs
  drag(drop(ref));
  
  // Apply opacity if dragging
  const opacity = isDragging ? 0.4 : 1;
  
  return (
    <div 
      ref={ref} 
      style={{ opacity }}
      data-handler-id={handlerId}
      className="task-item"
    >
      <TaskCard
        task={task}
        index={index}
        onEditTask={onEditTask}
        onDeleteTask={onDeleteTask}
      />
    </div>
  );
};

export default TaskItem; 