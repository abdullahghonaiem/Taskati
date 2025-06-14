import { useState, useEffect, useRef, useCallback } from 'react'
import { LayoutDashboard, Menu, X, ChevronRight, LogOut, Settings, Plus, Trash2, Edit2 } from 'lucide-react'
import './styles.css'
import type { Task } from './data/tasks'
import KanbanColumn from './components/KanbanColumn'
import ImprovedTaskFormModal from './components/ImprovedTaskFormModal'
import AddTaskButton from './components/AddTaskButton'
import AITaskInput from './components/AITaskInput'
import { Button } from './components/ui/button'
import SupabaseStatus from './components/SupabaseStatus'
import LoginPage from './components/auth/LoginPage'
import { supabase } from './lib/supabase'
import type { User } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'
import { getTasksByStatus, getTasksByStatusAndBoard, createTask, updateTask, deleteTask, updateTaskStatus, hasReachedTaskLimit, getUserTaskLimit } from './lib/services/taskService'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import TaskFilter from './components/TaskFilter'
import type { FilterOption } from './components/TaskFilter'
import CompletedTasksList from './components/CompletedTasksList'
import TaskColorLegend from './components/TaskColorLegend'
import SettingsPage from './components/settings/SettingsPage'
import { getUserSubscription } from './lib/services/subscriptionService'
import { SUBSCRIPTION_PLAN_LIMITS, FREE_PLAN_TASK_LIMIT } from './lib/config'
import OnboardingFlow from './components/onboarding/OnboardingFlow'
import { hasCompletedOnboarding, markOnboardingCompleted } from './lib/services/onboardingService'
import { getBoards, createBoard, deleteBoard, updateBoard, type Board } from './lib/services/boardService'

// Define view types
type AppView = 'dashboard' | 'settings';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [tasks, setTasks] = useState<Task[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [tasksLoading, setTasksLoading] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isEmpty, setIsEmpty] = useState(true)
  const [activeFilter, setActiveFilter] = useState<FilterOption>('all')
  const [viewTransitioning, setViewTransitioning] = useState(false)
  const [currentView, setCurrentView] = useState<AppView>('dashboard')
  const [taskLimitNotification, setTaskLimitNotification] = useState<string | null>(null)
  const [taskCount, setTaskCount] = useState<number>(0)
  const [taskLimit, setTaskLimit] = useState<number>(FREE_PLAN_TASK_LIMIT) // Default to free plan
  const [userSubscription, setUserSubscription] = useState<{
    planId: string;
    status: string;
  } | null>(null)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [onboardingChecked, setOnboardingChecked] = useState(false)
  const [boards, setBoards] = useState<Board[]>([])
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null)
  const [isCreatingBoard, setIsCreatingBoard] = useState(false)
  const [newBoardName, setNewBoardName] = useState('')
  const [editingBoardId, setEditingBoardId] = useState<string | null>(null)
  const [editingBoardName, setEditingBoardName] = useState('')
  
  // Check for authentication on load
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
          setUser(null);
          setLoading(false);
          return;
        }

        console.log('Session check:', session ? 'User logged in' : 'No active session');
        if (session?.user) {
          console.log('Session user:', session.user.email, 'User ID:', session.user.id);
          console.log('User metadata:', session.user.user_metadata);
          // Skip onboarding for users that sign up without email confirmation
          if (session.user?.user_metadata?.completed_onboarding === true) {
            console.log('User has already completed onboarding based on metadata');
            setOnboardingChecked(true);
            setShowOnboarding(false);
          }
        }
        setUser(session?.user || null);
        
        // Subscribe to auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('Auth state changed:', event, session ? 'User present' : 'No user');
            if (session?.user) {
              console.log('Auth event user:', session.user.email, 'Event:', event);
              console.log('User metadata:', session.user.user_metadata);
            }
            
            if (event === 'SIGNED_IN' && session) {
              console.log('Setting user from SIGNED_IN event');
              setUser(session.user);
              
              // Check if this is a newly signed up user with completed_onboarding flag
              if (session.user?.user_metadata?.completed_onboarding === true) {
                console.log('User has already completed onboarding based on metadata');
                setOnboardingChecked(true);
                setShowOnboarding(false);
              } else {
                setOnboardingChecked(false);
              }
              
              // Create initial settings for new users that don't have the flag set yet
              if (session.user?.user_metadata?.completed_onboarding === undefined) {
                // This is likely a new user, set up initial settings
                try {
                  console.log('Creating initial user settings for new user');
                  await markOnboardingCompleted(session.user.id);
                  console.log('Created initial user settings, skipping onboarding');
                  setOnboardingChecked(true);
                  setShowOnboarding(false);
                } catch (err) {
                  console.error('Error creating initial user settings:', err);
                }
              }
            } else if (event === 'SIGNED_OUT') {
              console.log('Setting user to null from SIGNED_OUT event');
              setUser(null);
            } else if (event === 'USER_UPDATED' && session) {
              console.log('User updated, refreshing user state');
              setUser(session.user);
            } else if (event === 'TOKEN_REFRESHED' && session) {
              console.log('Token refreshed, refreshing user state');
              setUser(session.user);
            }
          }
        );

        return () => {
          subscription.unsubscribe();
        };
      } catch (err) {
        console.error('Auth error:', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, []);

  // Debug effect for user state
  useEffect(() => {
    if (user) {
      console.log('User state updated: User logged in', user.email);
    } else if (!loading) {
      console.log('User state updated: No user logged in');
    }
  }, [user, loading]);
  
  // Check if user has completed onboarding
  useEffect(() => {
    const checkOnboarding = async () => {
      if (user && !onboardingChecked) {
        try {
          const completed = await hasCompletedOnboarding(user.id);
          setShowOnboarding(!completed);
          setOnboardingChecked(true);
        } catch (err) {
          console.error('Error checking onboarding status:', err);
          setShowOnboarding(false);
          setOnboardingChecked(true);
        }
      }
    };
    
    checkOnboarding();
  }, [user, onboardingChecked]);
  
  // Handle completing the onboarding
  const handleOnboardingComplete = async () => {
    if (user) {
      await markOnboardingCompleted(user.id);
    }
    setShowOnboarding(false);
  };
  
  // Fetch tasks when user is authenticated
  useEffect(() => {
    if (user && onboardingChecked && !showOnboarding) {
      fetchBoards();
    }
  }, [user, onboardingChecked, showOnboarding]);
  
  // Fetch tasks when active board changes
  useEffect(() => {
    if (user && activeBoardId) {
      // Only fetch if we don't have tasks for this board yet
      const hasTasksForBoard = tasks.some(task => task.board_id === activeBoardId);
      if (!hasTasksForBoard) {
        fetchTasksFromServer();
      }
    }
  }, [user, activeBoardId]);
  
  // Debug effect for modal state
  useEffect(() => {
    console.log("Tasks updated:", tasks.length);
  }, [tasks]);

  // Fetch boards when user changes
  const fetchBoards = async () => {
    if (!user) return;
    
    try {
      const fetchedBoards = await getBoards();
      console.log('Fetched boards:', fetchedBoards);
      setBoards(fetchedBoards);
      
      // If no boards exist, create a default board
      if (fetchedBoards.length === 0) {
        console.log('No boards found, creating default board');
        const defaultBoard = await createBoard('My First Board', 'Welcome to your first board!');
        if (defaultBoard) {
          setBoards([defaultBoard]);
          setActiveBoardId(defaultBoard.id);
        }
      } else if (!activeBoardId) {
        // Set the first board as active if no board is currently selected
        setActiveBoardId(fetchedBoards[0].id);
      }
    } catch (error) {
      console.error('Error fetching boards:', error);
    }
  };
  
  // Create a new board
  const handleCreateBoard = async () => {
    if (!user || !newBoardName.trim()) return;
    
    try {
      const newBoard = await createBoard(newBoardName.trim());
      if (newBoard) {
        setBoards(prev => [...prev, newBoard]);
        setActiveBoardId(newBoard.id);
        setNewBoardName('');
        setIsCreatingBoard(false);
      }
    } catch (error) {
      console.error('Error creating board:', error);
    }
  };
  
  // Delete a board
  const handleDeleteBoard = async (boardId: string) => {
    if (!user || !boardId) return;
    
    // Don't delete if it's the only board
    if (boards.length <= 1) {
      alert("You can't delete your only board. Please create another board first.");
      return;
    }
    
    try {
      const success = await deleteBoard(boardId);
      if (success) {
        // Update boards list
        setBoards(prev => prev.filter(b => b.id !== boardId));
        
        // If the deleted board was active, set another board as active
        if (activeBoardId === boardId) {
          const firstRemainingBoard = boards.find(b => b.id !== boardId);
          if (firstRemainingBoard) {
            setActiveBoardId(firstRemainingBoard.id);
          }
        }
      }
    } catch (error) {
      console.error('Error deleting board:', error);
    }
  };
  
  // Start editing a board
  const startEditingBoard = (boardId: string) => {
    const board = boards.find(b => b.id === boardId);
    if (board) {
      setEditingBoardId(boardId);
      setEditingBoardName(board.name);
    }
  };
  
  // Save board edit
  const handleEditBoard = async () => {
    if (!user || !editingBoardId || !editingBoardName.trim()) return;
    
    try {
      const updatedBoard = await updateBoard(editingBoardId, { name: editingBoardName.trim() });
      if (updatedBoard) {
        // Update boards list
        setBoards(prev => prev.map(b => 
          b.id === editingBoardId ? updatedBoard : b
        ));
        
        // Reset editing state
        setEditingBoardId(null);
        setEditingBoardName('');
      }
    } catch (error) {
      console.error('Error updating board:', error);
    }
  };
  
  // Set active board and fetch its tasks
  const handleBoardSelect = (boardId: string) => {
    setActiveBoardId(boardId);
    fetchTasksFromServer();
  };

  // Handle task drop to change its status
  const handleMoveTask = async (taskId: string, newStatus: Task['status']) => {
    console.log('Moving task:', taskId, 'to status:', newStatus);
    
    // Find the task being moved
    const task = tasks.find(t => t.id === taskId);
    if (!task) {
      console.error('Task not found:', taskId);
      return;
    }
    
    // Skip if status is the same
    if (task.status === newStatus) {
      return;
    }
    
    // Create updated task with new status
    const updatedTask = { ...task, status: newStatus };
    
    // Optimistically update the UI first
    setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
    
    // Save to database
    try {
      const success = await updateTaskStatus(taskId, newStatus);
      if (!success) {
        console.error('Failed to update task status in database');
        // Revert to original state if the update failed
        fetchTasksFromServer();
      }
    } catch (error) {
      console.error('Error updating task status:', error);
      // Revert to original state on error
      fetchTasksFromServer();
    }
  };

  // Handle filter change with transition effect
  const handleFilterChange = (filter: FilterOption) => {
    if (filter !== activeFilter) {
      setViewTransitioning(true);
      setTimeout(() => {
        setActiveFilter(filter);
        setViewTransitioning(false);
      }, 150);
    }
  };

  // Group tasks by status and apply filtering
  const getFilteredTasks = (tasks: Task[], status: Task['status']) => {
    // For 'completed' filter, we only want Done tasks
    if (activeFilter === 'completed') {
      return status === 'Done' ? tasks.filter(task => task.status === 'Done') : [];
    }
    
    // For 'pending' filter, we only want Todo and In Progress tasks
    if (activeFilter === 'pending') {
      return (status === 'Todo' || status === 'In Progress') 
        ? tasks.filter(task => task.status === status)
        : [];
    }
    
    // For 'all' filter, return tasks of the specified status
    return tasks.filter(task => task.status === status);
  };

  const todoTasks = getFilteredTasks(tasks, 'Todo');
  const inProgressTasks = getFilteredTasks(tasks, 'In Progress');
  const doneTasks = getFilteredTasks(tasks, 'Done');

  // Add debugging for task counts
  useEffect(() => {
    console.log('Filter:', activeFilter);
    console.log('Todo tasks:', todoTasks.length);
    console.log('In Progress tasks:', inProgressTasks.length);
    console.log('Done tasks:', doneTasks.length);
  }, [activeFilter, todoTasks.length, inProgressTasks.length, doneTasks.length]);

  // Check if there are any tasks to display based on the current filter
  const isEmptyFiltered = 
    todoTasks.length === 0 && 
    inProgressTasks.length === 0 && 
    doneTasks.length === 0;

  // Add a function to update task limits
  const updateTaskLimits = async () => {
    if (!user) return;
    
    try {
      const userTaskLimit = await getUserTaskLimit(user.id);
      setTaskLimit(userTaskLimit);
      
      // Count active tasks (Todo and In Progress)
      const activeTaskCount = tasks.filter(task => 
        task.status === 'Todo' || task.status === 'In Progress'
      ).length;
      
      setTaskCount(activeTaskCount);
      console.log(`Task limits updated: ${activeTaskCount}/${userTaskLimit}`);
    } catch (err) {
      console.error('Error updating task limits:', err);
    }
  };

  // Add this useEffect to update task limits when tasks change
  useEffect(() => {
    if (user) {
      updateTaskLimits();
    }
  }, [user, tasks]);

  // Add a function to load user's subscription
  const loadUserSubscription = async () => {
    if (!user) return;
    
    try {
      const subscription = await getUserSubscription(user.id);
      if (subscription && subscription.status === 'active') {
        setUserSubscription({
          planId: subscription.planId,
          status: subscription.status
        });
      } else {
        setUserSubscription(null);
      }
    } catch (err) {
      console.error('Error loading user subscription:', err);
      setUserSubscription(null);
    }
  };

  // Load subscription when user changes
  useEffect(() => {
    if (user) {
      loadUserSubscription();
    }
  }, [user]);

  // Add a function to get the plan name
  const getPlanName = () => {
    if (!userSubscription || userSubscription.status !== 'active') {
      return 'Free Plan';
    }
    
    // Find plan by ID in the SUBSCRIPTION_PLAN_LIMITS
    const planIds = Object.keys(SUBSCRIPTION_PLAN_LIMITS);
    switch (userSubscription.planId) {
      case 'P-90N57053P66221623NBETAGI':
        return 'Basic Plan';
      case 'P-4U238456CC281673FNBETEFI':
        return 'Pro Plan';
      case 'P-18M969130R0964230NBETENQ':
        return 'Premium Plan';
      default:
        return 'Custom Plan';
    }
  };

  // Update the handleSubmitTask function to include more detailed task limit information
  const handleSubmitTask = async (taskData: Omit<Task, 'id'> & { id?: string }) => {
    try {
      console.log("handleSubmitTask called with:", taskData);
      
      if (taskData.id) {
        // Edit existing task
        console.log("Updating existing task:", taskData.id);
        const updatedTask = await updateTask({
          ...taskData,
          id: taskData.id
        } as Task);
        
        console.log("Task updated result:", updatedTask);
        if (updatedTask) {
          setTasks(prev => prev.map(t => t.id === taskData.id ? updatedTask : t));
        }
      } else {
        // Check if the user has reached their task limit before creating a new task
        const limitReached = await hasReachedTaskLimit();
        if (limitReached) {
          console.warn("Task limit reached for user's subscription plan");
          setTaskLimitNotification(`You've reached your task limit (${taskCount}/${taskLimit} tasks) for your current plan. Please upgrade your subscription to create more tasks.`);
          return;
        }
        
        // Add new task
        console.log("Creating new task...");
        // Generate a new UUID for the task
        const taskId = uuidv4();
        
        console.log("Creating task with data:", {
          ...taskData,
          id: taskId,
          board_id: activeBoardId || null
        });
        
        // Create the task with the generated ID and active board ID
        const newTask = await createTask({
          ...taskData,
          id: taskId,
          board_id: activeBoardId || null
        } as Task & { id: string });
        
        console.log("Task creation result:", newTask);
        if (newTask) {
          // Check if there was an error returned (task limit reached)
          if ('error' in newTask) {
            console.warn("Task limit reached:", newTask.error);
            setTaskLimitNotification(`You've reached your task limit (${taskCount}/${taskLimit} tasks) for your current plan. Please upgrade your subscription to create more tasks.`);
            return;
          }
          
          console.log("Adding new task to state");
          // Add the new task to the beginning of the tasks array
          setTasks(prev => [newTask, ...prev]);
          setIsEmpty(false);
          
          // Refresh only the current board's tasks in the background to ensure consistency
          // but don't show loading state or wait for it
          if (activeBoardId) {
            fetchTasksFromServer(true).catch(console.error);
          }
        } else {
          console.error("Failed to create task - createTask returned null");
        }

      }
    } catch (err) {
      console.error('Error saving task:', err);
    }
  };
  
  // Function to fetch all tasks from the server
  const fetchTasksFromServer = async (forceRefresh = false) => {
    if (!user) return;
    
    // Only show loading if we don't have any tasks yet
    if (tasks.length === 0 || forceRefresh) {
      setTasksLoading(true);
    }
    
    try {
      let result;
      
      if (activeBoardId) {
        // Check if we already have tasks for this board
        const hasTasksForBoard = tasks.some(task => task.board_id === activeBoardId);
        
        // Only fetch if we don't have tasks for this board or if force refresh
        if (forceRefresh || !hasTasksForBoard) {
          result = await getTasksByStatusAndBoard(activeBoardId);
          
          // Update the tasks state, keeping tasks from other boards
          if (result) {
            const newTasks = [...result.todo, ...result.inProgress, ...result.done];
            setTasks(prev => {
              // Remove tasks from this board and add the new ones
              const filtered = prev.filter(task => task.board_id !== activeBoardId);
              return [...filtered, ...newTasks];
            });
            setIsEmpty(result.isEmpty);
          }
        }
      } else {
        // If no board is selected, fetch all tasks
        result = await getTasksByStatus();
        if (result) {
          const allTasks = [...result.todo, ...result.inProgress, ...result.done];
          setTasks(allTasks);
          setIsEmpty(result.isEmpty);
        }
      }
      
      console.log('Tasks updated for board:', activeBoardId);
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      setTasksLoading(false);
    }
  };

  // Open modal to edit an existing task
  const handleEditTask = (task: Task) => {
    console.log("Opening modal to edit task:", task.id);
    setEditingTask(task);
    setIsEditModalOpen(true);
  };
  
  // Close the edit modal
  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingTask(undefined);
  };

  const handleEditSubmit = async (taskData: Omit<Task, 'id'> & { id?: string }) => {
    await handleSubmitTask(taskData);
    handleCloseEditModal();
  };

  const handleDeleteTask = async (taskId: string) => {
    console.log('Deleting task:', taskId);
    
    // Optimistically remove from UI
    setTasks(prev => prev.filter(t => t.id !== taskId));
    
    try {
      const success = await deleteTask(taskId);
      if (!success) {
        console.error('Failed to delete task');
        // If delete fails, refresh tasks
        fetchTasksFromServer();
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      fetchTasksFromServer();
    }
  };

  // Handle reordering tasks within the same column
  const handleReorderTask = (dragIndex: number, hoverIndex: number, status: Task['status']) => {
    // Get the tasks for the specific status
    const columnTasks = tasks.filter(task => task.status === status);
    
    // Get the task being dragged
    const draggedTask = columnTasks[dragIndex];
    
    if (!draggedTask) return;
    
    // Create a new array with tasks reordered
    const newColumnTasks = [...columnTasks];
    newColumnTasks.splice(dragIndex, 1); // Remove the dragged task
    newColumnTasks.splice(hoverIndex, 0, draggedTask); // Insert at the new position
    
    // Create a new array with all tasks, replacing the ones from the affected column
    const newTasks = tasks.filter(task => task.status !== status).concat(newColumnTasks);
    
    // Update the state
    setTasks(newTasks);
    
    // Note: In a real application, you might want to persist this order to the database
    // This could be done by adding a 'position' field to tasks and updating it on the server
  };

  // Handle navigation between views
  const handleNavigation = (view: AppView) => {
    setCurrentView(view);
  };

  // Show Kanban board layout for 'all' or 'pending' filters
  const renderTasksView = () => {
    // Filter tasks by active board first
    const boardTasks = activeBoardId 
      ? tasks.filter(task => task.board_id === activeBoardId)
      : [];

    // Show loading state only if we don't have any tasks yet
    if (tasksLoading && boardTasks.length === 0) {
      return (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading tasks...</p>
        </div>
      );
    }

    if (activeFilter === 'completed') {
      return (
        <CompletedTasksList 
          tasks={boardTasks.filter(task => task.status === 'Done')} 
          onEditTask={handleEditTask} 
          onDeleteTask={handleDeleteTask}
          onReorderTask={handleReorderTask}
        />
      );
    }
    
    // Filter tasks based on status and active board
    const todoTasks = boardTasks.filter(task => task.status === 'Todo');
    const inProgressTasks = boardTasks.filter(task => task.status === 'In Progress');
    const doneTasks = boardTasks.filter(task => task.status === 'Done');
    
    return (
      <div className="taskati-container">
        <KanbanColumn
          title="Todo"
          tasks={todoTasks} 
          onEditTask={handleEditTask}
          onDeleteTask={handleDeleteTask}
          status="Todo"
          onDropTask={handleMoveTask}
          onReorderTask={handleReorderTask}
        />
        <KanbanColumn
          title="In Progress"
          tasks={inProgressTasks} 
          onEditTask={handleEditTask}
          onDeleteTask={handleDeleteTask}
          status="In Progress"
          onDropTask={handleMoveTask}
          onReorderTask={handleReorderTask}
        />
        <KanbanColumn
          title="Done"
          tasks={doneTasks} 
          onEditTask={handleEditTask}
          onDeleteTask={handleDeleteTask}
          status="Done"
          onDropTask={handleMoveTask}
          onReorderTask={handleReorderTask}
        />
      </div>
    );
  };

  // Render the appropriate content based on the current view
  const renderContent = () => {
    const content = (
      <div className={`view-transition ${viewTransitioning ? 'transitioning' : ''}`}>
        {currentView === 'settings' ? (
          <div className="settings-container">
            <SettingsPage user={user} />
          </div>
        ) : (
          <>
            <div className="kanban-header">
              <h1 className="page-title">
                {boards.find(board => board.id === activeBoardId)?.name || 'My Tasks'}
              </h1>
              <div className="kanban-actions">
                <AddTaskButton onAddTask={handleSubmitTask} />
              </div>
            </div>
            
            <AITaskInput onTaskGenerated={handleSubmitTask} />
            
            <div className="mt-8 filter-container">
              <div className="filter-wrapper">
                <TaskFilter 
                  activeFilter={activeFilter}
                  onFilterChange={handleFilterChange}
                />
              </div>
              
              <TaskColorLegend />
            </div>
            
            {renderTasksView()}
          </>
        )}
      </div>
    );

    return content;
  };

  // Show login page if user is not logged in
  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
    </div>;
  }
  
  if (!user) {
    return <LoginPage />;
  }
  
  // Show onboarding for new users
  if (showOnboarding && onboardingChecked) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} userEmail={user.email} />;
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex h-screen bg-slate-50">
        {/* Sidebar */}
        <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
          <div className="sidebar-header">
            <h1 className="app-title">Taskati</h1>
            <button className="toggle-sidebar" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
          
          <nav className="sidebar-nav">
            {/* Boards section */}
            <div className="nav-section boards-section">
              <div className="boards-header">
                <h3>Boards</h3>
                <button
                  className="add-board-button"
                  onClick={() => setIsCreatingBoard(true)}
                >
                  <Plus size={16} />
                </button>
              </div>
              
              <div className="boards-list">
                {boards.map(board => (
                  <div key={board.id} className="board-item-container">
                    {editingBoardId === board.id ? (
                      <div className="edit-board-form">
                        <input
                          type="text"
                          value={editingBoardName}
                          onChange={(e) => setEditingBoardName(e.target.value)}
                          className="board-name-input"
                          autoFocus
                        />
                        <div className="board-form-actions">
                          <button
                            onClick={handleEditBoard}
                            disabled={!editingBoardName.trim()}
                            className="create-board-submit"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditingBoardId(null);
                              setEditingBoardName('');
                            }}
                            className="create-board-cancel"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <a
                          href="#"
                          className={`board-item ${activeBoardId === board.id ? 'active' : ''}`}
                          onClick={(e) => {
                            e.preventDefault();
                            handleBoardSelect(board.id);
                            handleNavigation('dashboard');
                          }}
                        >
                          <span className="board-name">{board.name}</span>
                        </a>
                        <div className="board-actions">
                          <button 
                            className="edit-board-button"
                            onClick={() => startEditingBoard(board.id)}
                            title="Edit board"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button 
                            className="delete-board-button"
                            onClick={() => handleDeleteBoard(board.id)}
                            title="Delete board"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
              
              {isCreatingBoard && (
                <div className="create-board-form">
                  <input
                    type="text"
                    value={newBoardName}
                    onChange={(e) => setNewBoardName(e.target.value)}
                    placeholder="Enter board name"
                    className="board-name-input"
                  />
                  <div className="board-form-actions">
                    <button
                      onClick={handleCreateBoard}
                      disabled={!newBoardName.trim()}
                      className="create-board-submit"
                    >
                      Create
                    </button>
                    <button
                      onClick={() => {
                        setIsCreatingBoard(false);
                        setNewBoardName('');
                      }}
                      className="create-board-cancel"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Settings */}
            <div className="nav-section">
              <a 
                href="#" 
                className={`nav-item ${currentView === 'settings' ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavigation('settings');
                }}
              >
                <Settings size={20} />
                <span className="nav-text">Settings</span>
              </a>
            </div>
            
            {/* Logout */}
            <div className="nav-section">
              <a 
                href="#" 
                className="nav-item logout-button"
                onClick={async (e) => {
                  e.preventDefault();
                  try {
                    await supabase.auth.signOut();
                    console.log('Signed out successfully');
                  } catch (error) {
                    console.error('Error signing out:', error);
                  }
                }}
              >
                <LogOut size={20} />
                <span className="nav-text">Logout</span>
              </a>
            </div>
          </nav>
          
          <div className="sidebar-footer">
            <div className="user-info">
              <div className="user-avatar">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="user-details">
                <div className="user-name">{user?.email?.split('@')[0] || 'User'}</div>
                <div className="user-role">{getPlanName()}</div>
              </div>
            </div>
          </div>
        </aside>
        
        {/* Main content */}
        <main className={`main-content ${sidebarOpen ? 'sidebar-open' : ''}`}>
          <header className="content-header">
            <div className="breadcrumb">
              <span>Taskati</span>
              <ChevronRight size={16} />
              <span>
                {currentView === 'dashboard' 
                  ? (boards.find(b => b.id === activeBoardId)?.name || 'Dashboard') 
                  : currentView.charAt(0).toUpperCase() + currentView.slice(1)
                }
              </span>
            </div>
            
            <div className="header-actions">
              <SupabaseStatus />
            </div>
          </header>
          
          {renderContent()}
        </main>
        
        {/* Edit Task Modal */}
        {isEditModalOpen && (
          <ImprovedTaskFormModal
            isOpen={isEditModalOpen}
            onClose={handleCloseEditModal}
            onSubmit={handleEditSubmit}
            task={editingTask}
          />
        )}

        {taskLimitNotification && (
          <div className="task-limit-notification">
            <div className="task-limit-content">
              <div className="task-limit-header">
                <h3>Subscription Limit Reached</h3>
                <button 
                  onClick={() => setTaskLimitNotification(null)}
                  className="close-btn"
                >
                  ×
                </button>
              </div>
              <p>{taskLimitNotification}</p>
              <div className="task-limit-actions">
                <button 
                  onClick={() => {
                    setTaskLimitNotification(null);
                    setCurrentView('settings');
                  }}
                  className="upgrade-btn"
                >
                  Upgrade Now
                </button>
                <button 
                  onClick={() => setTaskLimitNotification(null)}
                  className="dismiss-btn"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DndProvider>
  );
}

export default App

