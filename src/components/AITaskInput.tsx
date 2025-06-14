import { useState, useEffect } from 'react';
import { generateTaskWithOpenAI } from '../lib/services/openaiService';
import type { Task } from '../data/tasks';

interface AITaskInputProps {
  onTaskGenerated: (task: Omit<Task, 'id'> & { id?: string }) => Promise<void>;
}

// Type declaration for SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function AITaskInput({ onTaskGenerated }: AITaskInputProps) {
  const [taskDescription, setTaskDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  // Initialize speech recognition
  useEffect(() => {
    // Check if browser supports speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.warn('Speech recognition not supported in this browser');
      return;
    }
    
    // Create speech recognition instance
    const recognitionInstance = new SpeechRecognition();
    recognitionInstance.continuous = true;
    recognitionInstance.interimResults = true;
    recognitionInstance.lang = 'en-US';
    
    // Track the current transcript to avoid repetition
    let finalTranscript = '';
    
    // Handle results
    recognitionInstance.onresult = (event: any) => {
      let interimTranscript = '';
      
      // Process the results
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }
      
      // Update the task description with both final and interim results
      setTaskDescription(prevDescription => {
        const baseText = prevDescription || '';
        return baseText + ' ' + interimTranscript;
      });
    };
    
    // Handle errors
    recognitionInstance.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      setError(`Speech recognition error: ${event.error}`);
      setIsRecording(false);
    };
    
    // Handle end of speech
    recognitionInstance.onend = () => {
      if (isRecording) {
        // If still in recording state when onend fires, restart
        recognitionInstance.start();
      }
    };
    
    setRecognition(recognitionInstance);
    
    // Cleanup
    return () => {
      if (recognitionInstance) {
        recognitionInstance.stop();
      }
    };
  }, []);

  // Toggle voice recording
  const toggleVoiceInput = () => {
    if (!recognition) {
      setError('Speech recognition is not supported in your browser');
      return;
    }
    
    if (isRecording) {
      // Stop recording
      recognition.stop();
      setIsRecording(false);
      setError('✅ Voice input captured');
      setTimeout(() => setError(null), 3000);
    } else {
      // Start recording
      try {
        // Create a new instance to avoid issues with previous results
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const newRecognition = new SpeechRecognition();
        newRecognition.continuous = true;
        newRecognition.interimResults = true;
        newRecognition.lang = 'en-US';
        
        // Store the starting text and track interim results
        const startingText = taskDescription;
        let finalTranscript = '';
        
        newRecognition.onresult = (event: any) => {
          finalTranscript = '';
          let interimTranscript = '';
          
          // Process all results
          for (let i = 0; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' ';
            } else {
              interimTranscript += transcript;
            }
          }
          
          // Combine starting text with final and interim transcripts
          const combinedText = startingText + 
                              (startingText && (finalTranscript || interimTranscript) ? ' ' : '') + 
                              finalTranscript + interimTranscript;
          
          setTaskDescription(combinedText);
        };
        
        newRecognition.onerror = (event: any) => {
          console.error('Speech recognition error', event.error);
          setError(`Speech recognition error: ${event.error}`);
          setIsRecording(false);
        };
        
        newRecognition.onend = () => {
          // Only set recording to false if we're not restarting
          if (isRecording) {
            setIsRecording(false);
          }
        };
        
        setRecognition(newRecognition);
        newRecognition.start();
        setIsRecording(true);
        setError('🎤 Listening... Speak now');
      } catch (err) {
        console.error('Error starting speech recognition:', err);
        setError('Failed to start voice input. Please try again.');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Stop recording if active when submitting
    if (isRecording && recognition) {
      recognition.stop();
      setIsRecording(false);
    }
    
    if (!taskDescription.trim()) {
      setError('Please enter a task description');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const generatedTask = await generateTaskWithOpenAI(taskDescription);
      const completeTask = {
        ...generatedTask,
        status: generatedTask.status || 'Todo'
      };
      await onTaskGenerated(completeTask);
      setTaskDescription('');
      setIsExpanded(false);
      // Show success message that disappears after 3 seconds
      setError('✅ Task created successfully!');
      setTimeout(() => setError(null), 3000);
    } catch (err) {
      console.error('Error generating task:', err);
      setError('Failed to generate task. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Add Material Icons CSS
  const materialIconsStyle = `
    @font-face {
      font-family: 'Material Symbols Outlined';
      font-style: normal;
      font-weight: 400;
      src: url(https://fonts.gstatic.com/s/materialsymbolsoutlined/v156/kJEhBvYX7BgnkSrUwT8OhrdQw4oELdPIeeII9v6oFsI.woff2) format('woff2');
    }
    
    .material-symbols-outlined {
      font-family: 'Material Symbols Outlined';
      font-weight: normal;
      font-style: normal;
      font-size: 24px;
      line-height: 1;
      letter-spacing: normal;
      text-transform: none;
      display: inline-block;
      white-space: nowrap;
      word-wrap: normal;
      direction: ltr;
      -webkit-font-feature-settings: 'liga';
      -webkit-font-smoothing: antialiased;
    }
    
    .material-symbols-outlined.text-sm {
      font-size: 18px;
    }
    
    @keyframes pulse {
      0% {
        box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.7);
      }
      70% {
        box-shadow: 0 0 0 10px rgba(220, 38, 38, 0);
      }
      100% {
        box-shadow: 0 0 0 0 rgba(220, 38, 38, 0);
      }
    }
    
    @keyframes recording-pulse {
      0% {
        opacity: 1;
      }
      50% {
        opacity: 0.6;
      }
      100% {
        opacity: 1;
      }
    }
    
    @keyframes spin {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }
  `;

  return (
    <div style={{ padding: '0 24px', width: '97%' }}>
      <style>{materialIconsStyle}</style>
      
      {error && (
        <div style={{
          padding: '8px 16px',
          marginBottom: '10px',
          borderRadius: '8px',
          fontSize: '14px',
          background: error.includes('✅') 
            ? 'rgba(16, 185, 129, 0.1)' 
            : 'rgba(239, 68, 68, 0.1)',
          color: error.includes('✅') ? '#047857' : '#b91c1c',
          border: `1px solid ${error.includes('✅') ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {error}
        </div>
      )}
      
      <div className="mt-4 p-4 bg-indigo-50 border border-indigo-100 rounded-lg flex flex-col sm:flex-row items-start sm:items-center gap-4" style={{
        marginTop: '16px',
        padding: '16px',
        backgroundColor: 'rgb(238, 242, 255)',
        borderWidth: '1px',
        borderColor: 'rgb(224, 231, 255)',
        borderRadius: '0.5rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '16px'
      }}>
        <div style={{
          display: 'flex',
          width: '100%',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div className="flex-shrink-0 w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center" style={{
            flexShrink: 0,
            width: '40px',
            height: '40px',
            backgroundColor: 'rgb(79, 70, 229)',
            borderRadius: '9999px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <span className="material-symbols-outlined text-white" style={{ color: 'white' }}>smart_toy</span>
          </div>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            flexGrow: 1
          }}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2" style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
              marginBottom: '8px'
            }}>
              <h3 className="font-medium text-slate-800" style={{
                fontWeight: 500,
                color: 'rgb(30, 41, 59)',
                margin: 0
              }}>AI Task Assistant</h3>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors duration-200 flex items-center gap-1"
                  style={{
                    padding: '4px 12px',
                    backgroundColor: 'rgb(79, 70, 229)',
                    color: 'white',
                    fontSize: '14px',
                    borderRadius: '0.5rem',
                    transition: 'background-color 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <span className="material-symbols-outlined text-sm">
                    {isExpanded ? 'unfold_less' : 'unfold_more'}
                  </span>
                  {isExpanded ? 'Collapse' : 'Expand'}
                </button>
                
                <button
                  type="button"
                  onClick={toggleVoiceInput}
                  className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors duration-200 flex items-center gap-1"
                  style={{
                    padding: '4px 12px',
                    backgroundColor: isRecording ? 'rgb(220, 38, 38)' : 'rgb(79, 70, 229)',
                    color: 'white',
                    fontSize: '14px',
                    borderRadius: '0.5rem',
                    transition: 'background-color 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    border: 'none',
                    cursor: 'pointer',
                    animation: isRecording ? 'pulse 1.5s infinite' : 'none'
                  }}
                >
                  <span className="material-symbols-outlined text-sm">
                    {isRecording ? 'mic_off' : 'mic'}
                  </span>
                  {isRecording ? 'Stop Recording' : 'Voice Input'}
                </button>
              </div>
            </div>
            
            <form onSubmit={handleSubmit}>
              {!isExpanded ? (
                <div className="flex gap-2" style={{
                  display: 'flex',
                  gap: '8px'
                }}>
                  <input
                    type="text"
                    placeholder={isRecording ? "Listening... speak now" : "Ask AI to create a task..."}
                    className="flex-grow px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    style={{
                      flexGrow: 1,
                      padding: '8px 12px',
                      border: isRecording ? '1px solid rgb(239, 68, 68)' : '1px solid rgb(226, 232, 240)',
                      borderRadius: '0.5rem',
                      outline: 'none',
                      animation: isRecording ? 'recording-pulse 1.5s infinite' : 'none'
                    }}
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    disabled={isLoading}
                  />
                  
                  <button 
                    type="submit"
                    className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200"
                    style={{
                      padding: '8px 12px',
                      backgroundColor: 'rgb(79, 70, 229)',
                      color: 'white',
                      borderRadius: '0.5rem',
                      transition: 'background-color 0.2s ease',
                      border: 'none',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      opacity: isLoading ? 0.7 : 1
                    }}
                    disabled={isLoading}
                  >
                    <span className="material-symbols-outlined" style={{
                      animation: isLoading ? 'spin 1s linear infinite' : 'none',
                      display: 'inline-block'
                    }}>
                      {isLoading ? 'sync' : 'send'}
                    </span>
                  </button>
                </div>
              ) : (
                <div style={{ width: '100%' }}>
                  <textarea
                    placeholder={`Describe your task in detail. Include information about:

• PRIORITY: Mention if it's 'high priority', 'medium priority', or 'low priority'
• DEADLINE: Be specific about when it should be completed (e.g., 'by next Friday', 'end of month', 'June 15th')
• STATUS: Clearly state if you're 'currently working on it', if it's 'already completed', or if it's a new task

Examples:
✓ "Need to update the authentication module by end of this month. It's a high priority task we're actively working on."
✓ "Create a marketing plan for Q3. This is medium priority and should be done by July 1st."
✓ "We've already completed the website redesign and deployed it yesterday."`}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    style={{
                      width: '100%',
                      minHeight: '120px',
                      padding: '8px 12px',
                      border: isRecording ? '1px solid rgb(239, 68, 68)' : '1px solid rgb(226, 232, 240)',
                      borderRadius: '0.5rem',
                      outline: 'none',
                      marginBottom: '8px',
                      resize: 'vertical',
                      animation: isRecording ? 'recording-pulse 1.5s infinite' : 'none'
                    }}
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    disabled={isLoading}
                  />
                  
                  <div style={{ 
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '12px'
                  }}>
                    <div style={{ 
                      fontSize: '13px', 
                      color: 'rgb(100, 116, 139)',
                      maxWidth: '70%'
                    }}>
                      <strong>Tip:</strong> The more details you provide about priority, deadline, and status, the better the AI can understand your task
                      {isRecording && <div style={{ color: 'rgb(220, 38, 38)', marginTop: '4px' }}>🎤 Recording in progress...</div>}
                    </div>
                    
                    <button 
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 flex items-center gap-2"
                      style={{
                        padding: '8px 16px',
                        backgroundColor: 'rgb(79, 70, 229)',
                        color: 'white',
                        borderRadius: '0.5rem',
                        transition: 'background-color 0.2s ease',
                        border: 'none',
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        opacity: isLoading ? 0.7 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                      disabled={isLoading}
                    >
                      <span className="material-symbols-outlined" style={{
                        animation: isLoading ? 'spin 1s linear infinite' : 'none',
                        display: 'inline-block'
                      }}>
                        {isLoading ? 'sync' : 'auto_fix_high'}
                      </span>
                      {isLoading ? 'Processing...' : 'Create Task with AI'}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 