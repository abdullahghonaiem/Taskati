import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

interface BoardFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (board: { id: string; name: string; description: string }) => void;
  board?: { id: string; name: string; description: string };
}

export default function BoardForm({ isOpen, onClose, onSubmit, board }: BoardFormProps) {
  const [formData, setFormData] = useState({
    name: board?.name || '',
    description: board?.description || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Get current user
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      
      if (!userId) {
        throw new Error('You must be logged in to create a board');
      }
      
      // Prepare board data
      const boardId = board?.id || uuidv4();
      
      if (board?.id) {
        // Update existing board
        const { error: updateError } = await supabase
          .from('boards')
          .update({
            name: formData.name,
            description: formData.description,
            updated_at: new Date().toISOString()
          })
          .eq('id', boardId);
        
        if (updateError) {
          throw new Error(`Error updating board: ${updateError.message}`);
        }
      } else {
        // Insert new board
        const { error: insertError } = await supabase
          .from('boards')
          .insert([{
            id: boardId,
            name: formData.name,
            description: formData.description,
            user_id: userId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);
        
        if (insertError) {
          throw new Error(`Error creating board: ${insertError.message}`);
        }
      }
      
      // Call the onSubmit prop with the form data
      onSubmit({
        id: boardId,
        name: formData.name,
        description: formData.description
      });
      
      onClose();
    } catch (err) {
      console.error('Error saving board:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while saving the board');
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
        background: rgba(0, 0, 0, 0.1);
        backdrop-filter: blur(8px);
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
        border-radius: 16px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        width: 92%;
        max-width: 460px;
        overflow: hidden;
        position: relative;
        animation: slideUp 0.3s ease-out;
        margin: auto;
    }

    @keyframes slideUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .form-header {
        background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
        padding: 20px 24px;
        color: white;
        position: relative;
    }

    .close-btn {
        position: absolute;
        top: 12px;
        right: 12px;
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        transition: all 0.2s ease;
    }

    .close-btn:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: scale(1.05);
    }

    .form-title {
        font-size: 22px;
        font-weight: 700;
        margin-bottom: 4px;
    }

    .form-subtitle {
        font-size: 14px;
        opacity: 0.9;
        font-weight: 400;
    }

    .form-content {
        padding: 24px;
    }

    .form-group {
        margin-bottom: 20px;
    }

    .form-label {
        display: block;
        font-weight: 600;
        color: #374151;
        margin-bottom: 6px;
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .form-input, .form-textarea {
        width: 100%;
        padding: 12px 16px;
        border: 2px solid #e5e7eb;
        border-radius: 8px;
        font-size: 14px;
        font-family: inherit;
        transition: all 0.2s ease;
        background: #fafafa;
    }

    .form-input:focus, .form-textarea:focus {
        outline: none;
        border-color: #3b82f6;
        background: white;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .form-textarea {
        min-height: 120px;
        resize: vertical;
    }

    .form-actions {
        padding: 0 24px 24px;
        display: flex;
        gap: 12px;
        justify-content: flex-end;
    }

    .btn {
        padding: 10px 20px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        border: none;
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .btn-secondary {
        background: #f3f4f6;
        color: #6b7280;
    }

    .btn-secondary:hover {
        background: #e5e7eb;
        transform: translateY(-1px);
    }

    .btn-primary {
        background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
        color: white;
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }

    .btn-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(59, 130, 246, 0.4);
    }

    @media (max-width: 640px) {
        .form-container {
            width: 95%;
            max-height: 90vh;
            border-radius: 12px;
        }
        
        .form-header {
            padding: 16px 20px;
        }
        
        .form-title {
            font-size: 18px;
        }
        
        .form-subtitle {
            font-size: 12px;
        }
        
        .form-content {
            padding: 16px;
            max-height: calc(80vh - 120px);
            overflow-y: auto;
        }
        
        .form-group {
            margin-bottom: 16px;
        }
        
        .form-actions {
            padding: 0 16px 16px;
            flex-direction: row;
            gap: 8px;
        }
        
        .btn {
            padding: 8px 16px;
            font-size: 13px;
            flex: 1;
            justify-content: center;
        }
    }
  `;

  return (
    <>
      <style>{modalStyles}</style>
      <div className="modal-overlay" onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}>
        <div className="form-container">
          <div className="form-header">
            <button className="close-btn" onClick={onClose}>×</button>
            <h2 className="form-title">{board ? 'Edit Board' : 'Create New Board'}</h2>
            <p className="form-subtitle">
              {board ? 'Update existing board details' : 'Create a new board for organizing your tasks'}
            </p>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="form-content">
              {error && (
                <div style={{ 
                  padding: '10px', 
                  marginBottom: '15px', 
                  backgroundColor: '#fee2e2', 
                  color: '#b91c1c',
                  borderRadius: '8px' 
                }}>
                  {error}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Board Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Enter board name..." 
                  value={formData.name}
                  name="name"
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea 
                  className="form-textarea" 
                  placeholder="Describe the purpose of this board..."
                  value={formData.description}
                  name="description"
                  onChange={handleChange}
                ></textarea>
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={isSubmitting}
              >
                <span>{isSubmitting ? 'Saving...' : (board ? 'Save Changes' : 'Create Board')}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
} 