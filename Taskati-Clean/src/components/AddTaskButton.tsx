import { useState } from 'react';
import { Plus } from 'lucide-react';
import ImprovedTaskFormModal from './ImprovedTaskFormModal';
import type { Task } from '../data/tasks';

interface AddTaskButtonProps {
  onAddTask: (task: Omit<Task, 'id'> & { id?: string }) => Promise<void>;
}

export const AddTaskButton = ({ onAddTask }: AddTaskButtonProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleOpenModal = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("AddTaskButton: Opening modal");
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    console.log("AddTaskButton: Closing modal");
    setIsModalOpen(false);
  };
  
  const handleSubmit = async (taskData: Omit<Task, 'id'> & { id?: string }) => {
    setIsSubmitting(true);
    try {
      console.log("AddTaskButton: Submitting task data");
      await onAddTask(taskData);
      console.log("AddTaskButton: Task added successfully");
      setIsModalOpen(false);
    } catch (error) {
      console.error("AddTaskButton: Error adding task", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <>
      <button
        onClick={handleOpenModal}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: '#3b82f6',
          color: 'white',
          padding: '10px 16px',
          borderRadius: '8px',
          border: 'none',
          fontWeight: 'bold',
          cursor: 'pointer',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.2s ease'
        }}
      >
        <Plus size={16} />
        Add Task
      </button>
      
      <ImprovedTaskFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        task={undefined}
      />
    </>
  );
};

export default AddTaskButton; 