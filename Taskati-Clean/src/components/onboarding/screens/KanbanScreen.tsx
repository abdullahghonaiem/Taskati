import React, { useState } from 'react';
import { MoveHorizontal, ArrowRight, CheckCircle } from 'lucide-react';

export default function KanbanScreen() {
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [columns, setColumns] = useState([
    {
      id: 'todo',
      title: 'To Do',
      tasks: [
        { id: 1, title: 'Research competitors', color: 'blue' },
        { id: 2, title: 'Create wireframes', color: 'purple' },
        { id: 3, title: 'Set up project board', color: 'green' },
      ],
    },
    {
      id: 'in-progress',
      title: 'In Progress',
      tasks: [
        { id: 4, title: 'Design homepage', color: 'yellow' },
        { id: 5, title: 'Develop API endpoints', color: 'indigo' },
      ],
    },
    {
      id: 'done',
      title: 'Done',
      tasks: [
        { id: 6, title: 'Project setup', color: 'green' },
        { id: 7, title: 'Team onboarding', color: 'pink' },
      ],
    },
  ]);

  const handleDragStart = (e: React.DragEvent, taskId: number) => {
    setDraggedItem(taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();
    if (draggedItem === null) return;
    
    setColumns(prevColumns => {
      // Find the task being dragged and its current column
      let taskToMove: any = null;
      const newColumns = prevColumns.map(column => {
        const taskIndex = column.tasks.findIndex(t => t.id === draggedItem);
        if (taskIndex !== -1) {
          // Remove task from its current column
          taskToMove = column.tasks[taskIndex];
          return {
            ...column,
            tasks: column.tasks.filter(t => t.id !== draggedItem)
          };
        }
        return column;
      });

      // Add task to the target column if found
      if (taskToMove) {
        return newColumns.map(column => {
          if (column.id === targetColumnId) {
            return {
              ...column,
              tasks: [...column.tasks, taskToMove]
            };
          }
          return column;
        });
      }
      return newColumns;
    });
    
    setDraggedItem(null);
  };

  const getColorClass = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'border-l-blue-500',
      purple: 'border-l-purple-500',
      green: 'border-l-green-500',
      yellow: 'border-l-yellow-500',
      indigo: 'border-l-indigo-500',
      pink: 'border-l-pink-500',
    };
    return colors[color] || 'border-l-gray-300';
  };

  return (
    <div className="onboarding-screen">
      <div className="onboarding-content">
        <div className="onboarding-header">
          <div className="onboarding-step">Step 2 of 4</div>
          <h2>Task Organization</h2>
        </div>
        
        <div className="onboarding-body">
          <p className="onboarding-description">
            Taskati uses a Kanban board system to help you visualize and manage your workflow. 
            Move tasks between columns as you make progress on your projects.
          </p>
          
          <div className="onboarding-visual">
            <div className="board-visual">
              {columns.map((column) => (
                <div 
                  key={column.id}
                  className="board-column"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, column.id)}
                >
                  <div className="column-header">
                    {column.title}
                    <span className="ml-2 text-xs font-normal text-gray-500">
                      ({column.tasks.length})
                    </span>
                  </div>
                  {column.tasks.map((task) => (
                    <div 
                      key={task.id}
                      className={`task-card ${getColorClass(task.color)}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                    >
                      <div className="flex items-start">
                        <div className="flex-1">{task.title}</div>
                        {column.id === 'done' ? (
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 ml-2" />
                        ) : (
                          <MoveHorizontal className="w-4 h-4 text-gray-400 mt-0.5 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </div>
                    </div>
                  ))}
                  {column.tasks.length === 0 && (
                    <div className="text-center text-sm text-gray-400 py-4">
                      {column.id === 'todo' && 'Add a new task to get started'}
                      {column.id === 'in-progress' && 'Drag tasks here when you\'re working on them'}
                      {column.id === 'done' && 'Completed tasks will appear here'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div className="onboarding-tip">
            <ArrowRight className="inline-block mr-2 w-4 h-4" />
            <strong>Try it out:</strong> Drag tasks between columns to see how easy it is to update their status.
          </div>
        </div>
      </div>
    </div>
  );
}