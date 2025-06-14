import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import type { Task } from '../data/tasks';
import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (task: Omit<Task, 'id'> & { id?: string }) => Promise<void>;
  task?: Task;
  boardId?: string;
}

export default function ImprovedTaskFormModal({ isOpen, onClose, onSubmit, task, boardId }: TaskFormModalProps) {
  const [formData, setFormData] = useState<Omit<Task, 'id'> & { id?: string }>({
    title: '',
    description: '',
    deadline: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    status: 'Todo',
    priority: 'Medium'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when opened or task changes
  useEffect(() => {
    if (task) {
      // Format the date properly if it exists and is valid
      let formattedDeadline = task.deadline;
      try {
        // Check if the deadline is a valid date before formatting
        const deadlineDate = new Date(task.deadline);
        if (!isNaN(deadlineDate.getTime())) {
          // Only format if it's a valid date
          formattedDeadline = format(deadlineDate, 'yyyy-MM-dd');
        } else {
          console.warn('Invalid date detected in task:', task.deadline);
          // Default to tomorrow if invalid
          formattedDeadline = format(new Date(Date.now() + 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
        }
      } catch (err) {
        console.error('Error formatting task deadline:', err);
        // Default to tomorrow if error
        formattedDeadline = format(new Date(Date.now() + 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
      }
      
      setFormData({
        id: task.id,
        title: task.title,
        description: task.description,
        deadline: formattedDeadline,
        status: task.status,
        priority: task.priority
      });
    } else {
      setFormData({
        title: '',
        description: '',
        deadline: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
        status: 'Todo',
        priority: 'Medium'
      });
    }
    setError(null);
  }, [task, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePriorityChange = (priority: 'Low' | 'Medium' | 'High') => {
    setFormData(prev => ({ ...prev, priority }));
  };

  const handleStatusChange = (status: 'Todo' | 'In Progress' | 'Done') => {
    setFormData(prev => ({ ...prev, status }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Validate form
      if (!formData.title.trim()) {
        throw new Error('Task title is required');
      }
      
      // Validate deadline is a proper date
      let validatedDeadline = formData.deadline;
      try {
        // Check if the date is valid
        const deadlineDate = new Date(formData.deadline);
        if (isNaN(deadlineDate.getTime())) {
          console.warn('Invalid date in form submission, setting to tomorrow:', formData.deadline);
          // If invalid, set to tomorrow
          validatedDeadline = format(new Date(Date.now() + 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
        }
      } catch (err) {
        console.error('Error validating deadline:', err);
        // Default to tomorrow if error
        validatedDeadline = format(new Date(Date.now() + 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
      }
      
      // Call the onSubmit prop with the form data
      await onSubmit({
        ...formData,
        deadline: validatedDeadline,
        id: task?.id
      });
      
      onClose();
    } catch (err) {
      console.error('Error saving task:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while saving the task');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Define the CSS as a string
  const modalStyles = `
    * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
    }

    .modal-overlay {
        background: rgba(0, 0, 0, 0.3);
        backdrop-filter: blur(10px);
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 16px;
    }

    .form-container {
        background: white;
        border-radius: 20px;
        box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
        width: 92%;
        max-width: 480px;
        max-height: 90vh;
        overflow: hidden;
        position: relative;
        animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        margin: auto;
        display: flex;
        flex-direction: column;
        border: 1px solid rgba(229, 231, 235, 0.8);
    }

    @keyframes slideUp {
        from {
            opacity: 0;
            transform: translateY(40px) scale(0.96);
        }
        to {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
    }

    .form-header {
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
        padding: 28px 32px 24px;
        color: white;
        position: relative;
        flex-shrink: 0;
        border-bottom: 2px solid rgba(255, 255, 255, 0.1);
    }

    .form-header::after {
        content: '';
        position: absolute;
        bottom: -1px;
        left: 0;
        right: 0;
        height: 1px;
        background: linear-gradient(90deg, 
            rgba(99, 102, 241, 0), 
            rgba(139, 92, 246, 0.3), 
            rgba(99, 102, 241, 0));
    }

    .close-btn {
        position: absolute;
        top: 16px;
        right: 16px;
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        transition: all 0.2s ease;
        z-index: 10;
        backdrop-filter: blur(2px);
    }

    .close-btn:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: scale(1.05) rotate(90deg);
    }

    .form-title {
        font-size: 24px;
        font-weight: 700;
        margin-bottom: 6px;
        letter-spacing: -0.01em;
    }

    .form-subtitle {
        font-size: 15px;
        opacity: 0.85;
        font-weight: 400;
    }

    .form-content {
        padding: 32px;
        overflow-y: auto;
        max-height: calc(90vh - 110px);
        flex-grow: 1;
        background: linear-gradient(to bottom, 
            rgba(249, 250, 251, 0.8) 0%, 
            rgba(255, 255, 255, 1) 100%);
    }

    .form-group {
        margin-bottom: 24px;
        position: relative;
    }

    .form-label {
        display: block;
        font-weight: 600;
        color: #4b5563;
        margin-bottom: 8px;
        font-size: 14px;
        letter-spacing: 0.3px;
    }

    .form-input, .form-textarea, .form-select {
        width: 100%;
        padding: 14px 16px;
        border: 2px solid #e5e7eb;
        border-radius: 12px;
        font-size: 15px;
        font-family: inherit;
        transition: all 0.2s ease;
        background: #ffffff;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
    }

    .form-input:focus, .form-textarea:focus, .form-select:focus {
        outline: none;
        border-color: #a78bfa;
        box-shadow: 0 0 0 4px rgba(167, 139, 250, 0.15);
        background: white;
    }

    .form-textarea {
        resize: vertical;
        min-height: 110px;
    }
    
    .status-buttons {
        display: flex;
        gap: 10px;
        margin-top: 10px;
    }
    
    .status-btn {
        flex: 1;
        padding: 12px 8px;
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 10px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
    }
    
    .status-btn:hover {
        background: #f3f4f6;
        transform: translateY(-1px);
    }
    
    .status-btn.active {
        background: #6366f1;
        color: white;
        border-color: #6366f1;
        box-shadow: 0 4px 8px rgba(99, 102, 241, 0.2);
    }
    
    .status-btn.active:hover {
        background: #4f46e5;
    }
    
    .priority-buttons {
        display: flex;
        gap: 10px;
        margin-top: 10px;
    }
    
    .priority-btn {
        flex: 1;
        padding: 12px 8px;
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 10px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
    }
    
    .priority-btn:hover {
        background: #f3f4f6;
        transform: translateY(-1px);
    }
    
    .priority-btn.priority-low {
        color: #10b981;
        border-color: #d1fae5;
    }
    
    .priority-btn.priority-medium {
        color: #f59e0b;
        border-color: #fef3c7;
    }
    
    .priority-btn.priority-high {
        color: #ef4444;
        border-color: #fee2e2;
    }
    
    .priority-btn.priority-low.active {
        background: #10b981; /* Green for Low */
        color: white;
        border-color: #10b981;
        box-shadow: 0 4px 8px rgba(16, 185, 129, 0.2);
    }
    
    .priority-btn.priority-medium.active {
        background: #f59e0b; /* Amber for Medium */
        color: white;
        border-color: #f59e0b;
        box-shadow: 0 4px 8px rgba(245, 158, 11, 0.2);
    }
    
    .priority-btn.priority-high.active {
        background: #ef4444; /* Red for High */
        color: white;
        border-color: #ef4444;
        box-shadow: 0 4px 8px rgba(239, 68, 68, 0.2);
    }
    
    .priority-btn.priority-low.active:hover {
        background: #059669;
    }
    
    .priority-btn.priority-medium.active:hover {
        background: #d97706;
    }
    
    .priority-btn.priority-high.active:hover {
        background: #dc2626;
    }
    
    .form-actions {
        display: flex;
        gap: 16px;
        margin-top: 36px;
        background-color: white;
    }
    
    .cancel-btn, .submit-btn {
        padding: 14px 20px;
        border-radius: 12px;
        font-size: 15px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
    }
    
    .cancel-btn {
        background: #f3f4f6;
        color: #4b5563;
        border: 1px solid #e5e7eb;
    }
    
    .cancel-btn:hover {
        background: #e5e7eb;
        transform: translateY(-1px);
    }
    
    .submit-btn {
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
        color: white;
        border: none;
        flex: 1;
        box-shadow: 0 4px 10px rgba(99, 102, 241, 0.2);
    }
    
    .submit-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 15px rgba(99, 102, 241, 0.25);
    }
    
    .submit-btn:disabled, .cancel-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
    }
    
    .error-message {
        background: linear-gradient(to right, #fee2e2 0%, #fecaca 100%);
        color: #b91c1c;
        padding: 16px;
        border-radius: 12px;
        margin-bottom: 24px;
        font-size: 14px;
        position: relative;
        border-left: 4px solid #ef4444;
        box-shadow: 0 4px 6px rgba(239, 68, 68, 0.06);
    }
    
    .error-message-close {
        position: absolute;
        top: 10px;
        right: 10px;
        cursor: pointer;
        font-size: 18px;
        color: #b91c1c;
        background: rgba(254, 202, 202, 0.5);
        border: none;
        width: 26px;
        height: 26px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
    }
    
    .error-message-close:hover {
        background: rgba(254, 202, 202, 0.8);
        transform: scale(1.1);
    }
    
    .helper-text {
        font-size: 12px;
        color: #6b7280;
        margin-top: 6px;
        font-style: italic;
    }
  `;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="form-container" onClick={e => e.stopPropagation()}>
        <style>{modalStyles}</style>
        
        <div className="form-header">
          <h2 className="form-title">{task ? 'Edit Task' : 'Create New Task'}</h2>
          <p className="form-subtitle">{task ? 'Update task details' : 'Add a new task to your board'}</p>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="form-content">
          {error && (
            <div className="error-message">
              {error}
              <button 
                className="error-message-close" 
                onClick={() => setError(null)}
                aria-label="Close error message"
              >
                ×
              </button>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="title">Task Title</label>
              <input 
                type="text" 
                id="title"
                name="title"
                className="form-input"
                value={formData.title}
                onChange={handleChange}
                placeholder="What needs to be done?"
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label" htmlFor="description">Description</label>
              <textarea 
                id="description"
                name="description"
                className="form-textarea"
                value={formData.description}
                onChange={handleChange}
                placeholder="Add more details about this task..."
                rows={3}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label" htmlFor="deadline">Due Date</label>
              <input 
                type="date" 
                id="deadline"
                name="deadline"
                className="form-input"
                value={formData.deadline}
                onChange={handleChange}
              />
              <p className="helper-text">When should this task be completed?</p>
            </div>
            
            <div className="form-group">
              <label className="form-label">Status (Board)</label>
              <div className="status-buttons">
                {['Todo', 'In Progress', 'Done'].map((status) => (
                  <button
                    key={status}
                    type="button"
                    className={`status-btn ${formData.status === status ? 'active' : ''}`}
                    onClick={() => handleStatusChange(status as 'Todo' | 'In Progress' | 'Done')}
                  >
                    {status}
                  </button>
                ))}
              </div>
              <p className="helper-text">
                This will determine which column the task appears in
              </p>
            </div>
            
            <div className="form-group">
              <label className="form-label">Priority</label>
              <div className="priority-buttons">
                {['Low', 'Medium', 'High'].map((priority) => (
                  <button
                    key={priority}
                    type="button"
                    className={`priority-btn priority-${priority.toLowerCase()} ${formData.priority === priority ? 'active' : ''}`}
                    onClick={() => handlePriorityChange(priority as 'Low' | 'Medium' | 'High')}
                  >
                    {priority}
                  </button>
                ))}
              </div>
              <p className="helper-text">
                How important is this task compared to others?
              </p>
            </div>
            
            <div className="form-actions">
              <button 
                type="button" 
                className="cancel-btn" 
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 