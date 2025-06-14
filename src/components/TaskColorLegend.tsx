import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle, X } from 'lucide-react';

const TaskColorLegend: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const legendRef = useRef<HTMLDivElement>(null);

  const toggleLegend = () => {
    setIsOpen(!isOpen);
  };

  // Close legend when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (legendRef.current && !legendRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="task-color-legend-container" ref={legendRef}>
      <button 
        className="legend-toggle-button" 
        onClick={toggleLegend}
        title="Color Guide"
      >
        <HelpCircle size={16} />
        <span>Color Guide</span>
      </button>

      {isOpen && (
        <div className="task-color-legend">
          <div className="legend-header">
            <h4>Task Color Guide</h4>
            <button className="close-button" onClick={toggleLegend}>
              <X size={16} />
            </button>
          </div>
          
          <div className="legend-items">
            <div className="legend-item">
              <div className="color-sample border-red-500"></div>
              <span>Overdue</span>
            </div>
            <div className="legend-item">
              <div className="color-sample border-yellow-500"></div>
              <span>Due Soon (≤ 3 days)</span>
            </div>
            <div className="legend-item">
              <div className="color-sample border-green-500"></div>
              <span>Upcoming</span>
            </div>
            <div className="legend-item">
              <div className="color-sample border-gray-400"></div>
              <span>Completed</span>
            </div>
            <div className="legend-item">
              <div className="color-sample border-blue-400"></div>
              <span>No Deadline</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskColorLegend; 