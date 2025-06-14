import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  taskTitle: string;
}

export default function DeleteConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm,
  taskTitle 
}: DeleteConfirmationModalProps) {
  if (!isOpen) return null;

  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  const handleConfirmClick = () => {
    onConfirm();
    onClose();
  };

  // Prevent closing when clicking inside the modal
  const handleModalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Handle escape key press
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [onClose]);

  const modalContent = (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        backdropFilter: 'blur(4px)',
        width: '100vw',
        height: '100vh',
        margin: 0,
        padding: 0,
        inset: 0
      }} 
      onClick={onClose}
    >
      <div 
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          width: '90%',
          maxWidth: '420px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          position: 'relative',
          animation: 'fadeIn 0.2s ease-out'
        }} 
        onClick={handleModalClick}
      >
        <style>
          {`
            @keyframes fadeIn {
              from { opacity: 0; transform: scale(0.95); }
              to { opacity: 1; transform: scale(1); }
            }
          `}
        </style>
        
        <div 
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px'
          }}
        >
          <h2 
            style={{
              fontSize: '1.25rem',
              fontWeight: 600,
              color: '#ef4444',
              margin: 0
            }}
          >
            Delete Task
          </h2>
          <button 
            style={{
              background: 'none',
              border: 'none',
              color: '#9ca3af',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }} 
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>
        
        <div style={{ marginBottom: '24px' }}>
          <p 
            style={{
              color: '#4b5563',
              fontSize: '0.95rem',
              lineHeight: 1.5,
              marginBottom: '8px'
            }}
          >
            Are you sure you want to delete "<span style={{ fontWeight: 600, color: '#111827' }}>{taskTitle}</span>"?
          </p>
          <p style={{ color: '#ef4444', fontSize: '0.9rem' }}>
            This action cannot be undone.
          </p>
        </div>
        
        <div 
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px'
          }}
        >
          <button 
            style={{
              padding: '10px 16px',
              backgroundColor: '#f3f4f6',
              color: '#4b5563',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }} 
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            style={{
              padding: '10px 16px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }} 
            onClick={handleConfirmClick}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );

  // Use a portal to render the modal at the root level of the DOM
  return createPortal(modalContent, document.body);
} 