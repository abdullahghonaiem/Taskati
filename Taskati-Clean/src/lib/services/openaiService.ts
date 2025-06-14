import { supabase } from '../supabase';
import OpenAI from 'openai';

export interface OpenAIResponse {
  title: string;
  description: string;
  deadline: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Todo' | 'In Progress' | 'Done';
}

// Get the API key directly from the environment
const apiKey = import.meta.env.VITE_OPENAI_API_KEY as string;

// Function to generate dynamic dates for examples
function getDynamicExampleDates() {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  
  // Helper to format date as YYYY-MM-DD
  const formatDate = (date: Date) => date.toISOString().split('T')[0];
  
  // End of current month
  const endOfMonth = new Date(currentYear, currentMonth + 1, 0);
  
  // Next Thursday
  const nextThursday = new Date(today);
  nextThursday.setDate(today.getDate() + ((11 - today.getDay()) % 7));
  
  // Recent past date (for completed tasks)
  const recentPast = new Date(today);
  recentPast.setDate(today.getDate() - 7);
  
  // End of week
  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + (5 - today.getDay()));
  
  // Mid-month date
  const midMonth = new Date(currentYear, currentMonth, 15);
  if (midMonth < today) {
    midMonth.setMonth(midMonth.getMonth() + 1);
  }
  
  // Last quarter end date
  const lastQuarter = new Date(currentYear, Math.floor(currentMonth / 3) * 3 - 1, 0);
  
  return {
    endOfMonth: formatDate(endOfMonth),
    nextThursday: formatDate(nextThursday),
    recentPast: formatDate(recentPast),
    endOfWeek: formatDate(endOfWeek),
    midMonth: formatDate(midMonth),
    lastQuarter: formatDate(lastQuarter)
  };
}

// Initialize the OpenAI client with environment variable
const openai = new OpenAI({
  apiKey: apiKey,
  dangerouslyAllowBrowser: true, // This is needed for client-side usage
});

// Log the configuration status
console.log('OpenAI Service Configuration:', { 
  apiKeyConfigured: !!apiKey,
  apiKeyValid: apiKey !== 'your_openai_api_key_here',
  apiKeyLength: apiKey ? apiKey.length : 0,
  apiKeyStart: apiKey && apiKey.length > 5 ? apiKey.substring(0, 5) : 'none'
});

// Simulate task generation when OpenAI API is not available
export async function generateTaskDetails(taskDescription: string): Promise<OpenAIResponse> {
  try {
    console.log('Using fallback simulation for task generation');
    // In a production app, you would call the actual OpenAI API
    // For this demo, we'll simulate a response with a 1-second delay
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate analyzing the task description
        const priority = taskDescription.toLowerCase().includes('urgent') || taskDescription.toLowerCase().includes('high priority')
          ? 'High' as const
          : taskDescription.toLowerCase().includes('sometime') || taskDescription.toLowerCase().includes('low priority')
            ? 'Low' as const
            : 'Medium' as const;
        
        // Calculate a reasonable deadline based on priority
        const currentDate = new Date();
        let daysToAdd = priority === 'High' ? 2 : priority === 'Medium' ? 5 : 10;
        
        // Handle specific time frames
        if (taskDescription.toLowerCase().includes('next week')) {
          daysToAdd = 7;
        } else if (taskDescription.toLowerCase().includes('next month') || taskDescription.toLowerCase().includes('end of month')) {
          daysToAdd = 30;
        } else if (taskDescription.toLowerCase().includes('tomorrow')) {
          daysToAdd = 1;
        } else if (taskDescription.toLowerCase().includes('two weeks')) {
          daysToAdd = 14;
        }
        
        currentDate.setDate(currentDate.getDate() + daysToAdd);
        const deadline = currentDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
        
        // Generate a title based on the description
        let title = '';
        if (taskDescription.length < 30) {
          title = taskDescription;
        } else {
          // Extract a concise title from longer descriptions
          const firstSentence = taskDescription.split(/[.!?]/, 1)[0];
          title = firstSentence.length > 50 
            ? firstSentence.substring(0, 47) + '...' 
            : firstSentence;
        }
        
        // Generate an elaborated description
        let description = taskDescription;
        if (description.length < 20) {
          description += "\n\nThis task requires attention and should be completed by the deadline.";
        }
        
        // Determine status (default to 'Todo')
        // Make sure explicit "completed" indicators are present before marking as Done
        const isInProgress = taskDescription.toLowerCase().includes('in progress') || 
                            taskDescription.toLowerCase().includes("i'm working on") || 
                            taskDescription.toLowerCase().includes("currently working") ||
                            taskDescription.toLowerCase().includes("started working");
        
        const isDone = taskDescription.toLowerCase().includes('done') || 
                      taskDescription.toLowerCase().includes('completed') || 
                      taskDescription.toLowerCase().includes('finished') ||
                      taskDescription.toLowerCase().includes('already done') ||
                      taskDescription.toLowerCase().includes('already completed') ||
                      (taskDescription.toLowerCase().includes('yesterday') && taskDescription.toLowerCase().includes('finished'));
        
        let status: 'Todo' | 'In Progress' | 'Done' = 'Todo';
        if (isDone) {
          status = 'Done';
        } else if (isInProgress) {
          status = 'In Progress';
        }
        
        const simulatedResponse: OpenAIResponse = {
          title,
          description,
          deadline,
          priority,
          status
        };
        
        console.log('Simulated task response:', simulatedResponse);
        resolve(simulatedResponse);
      }, 1000);
    });
  } catch (error) {
    console.error('Error generating task details:', error);
    throw new Error('Failed to generate task details');
  }
}

// Use the actual OpenAI API to generate task details
export async function generateTaskWithOpenAI(taskDescription: string): Promise<OpenAIResponse> {
  console.log('generateTaskWithOpenAI called with description:', taskDescription);
  
  try {
    // Add more logging
    console.log('OpenAI API key is configured:', apiKey.substring(0, 12) + '...');
    console.log('Making API call to OpenAI');
    
    // Get dynamic dates for examples
    const dates = getDynamicExampleDates();
    
    // Create the prompt for OpenAI with few-shot learning examples from our training data
    const prompt = `
You are a task management assistant helping to create a task from a natural language description.

I'll provide you with examples of how to interpret task descriptions, followed by a new task for you to analyze.

## EXAMPLES:

Example 1:
Request: "Finish coding the user authentication module by end of this month. It's a high priority task we're actively working on."
Response:
{
  "title": "Implement Authentication Module",
  "description": "Complete development of the user authentication module, including login, signup, and password reset features.",
  "deadline": "${dates.endOfMonth}",
  "priority": "High",
  "status": "In Progress"
}

Example 2:
Request: "Review the Q2 marketing budget proposal. Need your feedback before next Thursday."
Response:
{
  "title": "Review Q2 Marketing Budget",
  "description": "Analyze and provide feedback on the proposed Q2 marketing budget document.",
  "deadline": "${dates.nextThursday}",
  "priority": "Medium",
  "status": "Todo"
}

Example 3:
Request: "We've already updated the company logo and delivered the new design assets to the web team."
Response:
{
  "title": "Update Company Logo",
  "description": "Designed and delivered the updated company logo along with brand assets to the web team.",
  "deadline": "${dates.recentPast}",
  "priority": "Medium",
  "status": "Done"
}

Example 4:
Request: "Need to finalize product mockups for design. It's a low priority task and should be finished by the end of this month."
Response:
{
  "title": "Finalize product mockups",
  "description": "Complete all mockups for the mobile app product screens.",
  "deadline": "${dates.endOfMonth}",
  "priority": "Low",
  "status": "Todo"
}

Example 5:
Request: "Currently working on fix dashboard bug for software. It's a high priority task and should be finished later this week."
Response:
{
  "title": "Fix dashboard bug",
  "description": "Identify and resolve the rendering issue on the analytics dashboard.",
  "deadline": "${dates.endOfWeek}",
  "priority": "High",
  "status": "In Progress"
}

Example 6:
Request: "Create a landing page for the new product launch. This is high priority and needs to be done by June 15th."
Response:
{
  "title": "Create Product Landing Page",
  "description": "Design and develop a landing page for the upcoming product launch with key features and benefits.",
  "deadline": "${dates.midMonth}",
  "priority": "High", 
  "status": "Todo"
}

Example 7:
Request: "We completed and delivered the financial reports for Q1 last week."
Response:
{
  "title": "Prepare Q1 Financial Reports",
  "description": "Compiled and delivered the complete financial reports for the first quarter.",
  "deadline": "${dates.lastQuarter}",
  "priority": "Medium",
  "status": "Done"
}

## RULES FOR INTERPRETATION:

1. TITLE: A concise title (max 50 chars) that captures the essence of the task

2. DESCRIPTION: A detailed description with actionable steps and any requirements mentioned

3. DEADLINE: A specific date in YYYY-MM-DD format, based on the description:
   - If "end of month" or "next month" is mentioned → use the last day of the current/next month
   - If "next week" is mentioned → use 7 days from now
   - If "two weeks" is mentioned → use 14 days from now
   - If a specific date is mentioned → use that exact date
   - Otherwise, use a reasonable date based on the task's priority and complexity

4. PRIORITY: Exactly one of these values: "Low", "Medium", or "High"
   - If terms like "urgent", "critical", "high priority", "important" appear → use "High"
   - If terms like "whenever", "sometime", "low priority", "not urgent" appear → use "Low"
   - If no priority is explicitly stated → use "Medium"
   - If multiple priorities are mentioned, prioritize the highest one

5. STATUS: Exactly one of these values: "Todo", "In Progress", or "Done"
   - DEFAULT TO "Todo" for any new tasks, future tasks, or when status is unclear
   - ONLY use "In Progress" if explicitly stated with phrases like "currently working on", "in progress", "already started", "working on"
   - ONLY use "Done" if ALL of these conditions are met:
     a) The task is described entirely in past tense (e.g., "completed", "finished", "done", "delivered")
     b) There are clear indicators that the work is fully completed (e.g., "already completed", "finished yesterday")
     c) There is NO language suggesting future work or deadlines
   - ANY task that starts with action verbs like "Create", "Build", "Fix", "Update", etc. should NEVER be "Done"
   - ANY task with a future deadline should NEVER be "Done"

## NEW TASK TO ANALYZE:

"${taskDescription}"

Respond ONLY with a valid JSON object with this exact structure:
{
  "title": "Task title here",
  "description": "Detailed description here",
  "deadline": "YYYY-MM-DD",
  "priority": "Low|Medium|High",
  "status": "Todo|In Progress|Done"
}
    `;

    // Create properly typed messages for OpenAI
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: "You are a helpful task management assistant that carefully analyzes user requests to extract task details. You default tasks to 'Todo' status unless explicitly told the task is in progress or already completed. IMPORTANT: Only mark a task as 'Done' if it explicitly uses past tense verbs like 'completed', 'finished', or 'done' AND does not contain any language indicating future work. If there is any ambiguity, always default to 'Todo'."
      },
      {
        role: "user",
        content: prompt
      }
    ];
    
    console.log('Sending OpenAI request...');

    // Call the OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: messages,
      temperature: 0.2, // Lower temperature for more predictable results
      max_tokens: 500,
    });

    console.log('OpenAI API response received');

    // Extract and parse the JSON response
    const content = response.choices[0]?.message?.content || '{}';
    console.log('Raw response content:', content);
    
    let parsedResponse: OpenAIResponse;
    
    try {
      parsedResponse = JSON.parse(content);
      console.log('Successfully parsed JSON response:', parsedResponse);
      
      // Validate required fields
      if (!parsedResponse.title || !parsedResponse.description || !parsedResponse.priority || !parsedResponse.status) {
        console.warn('Missing required fields in the response');
        
        // Fill in any missing fields
        parsedResponse = {
          title: parsedResponse.title || analyzeTaskTitle(taskDescription),
          description: parsedResponse.description || taskDescription,
          deadline: parsedResponse.deadline || calculateDeadline(taskDescription),
          priority: parsedResponse.priority as 'Low' | 'Medium' | 'High' || analyzePriority(taskDescription),
          status: parsedResponse.status as 'Todo' | 'In Progress' | 'Done' || analyzeTaskStatus(taskDescription)
        };
      }
      
      // Additional strong validation - if a deadline is in the future and status is "Done", set to "Todo"
      // This is a failsafe for cases where the model misunderstands
      if (parsedResponse.status === 'Done') {
        // If the description starts with action words like "Create", "Schedule", etc. it's likely a new task
        const actionWords = ['create', 'update', 'fix', 'schedule', 'implement', 'prepare', 'develop', 
                            'design', 'build', 'setup', 'configure', 'organize', 'write', 'start'];
        
        const firstWord = taskDescription.trim().toLowerCase().split(' ')[0];
        if (actionWords.includes(firstWord)) {
          console.log('Overriding incorrectly detected "Done" status to "Todo" for task starting with action word:', firstWord);
          parsedResponse.status = 'Todo';
        }
        
        // Check if deadline is in the future
        const deadlineDate = new Date(parsedResponse.deadline);
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0); // Reset time part for accurate date comparison
        
        if (deadlineDate > currentDate) {
          console.log('Overriding incorrectly detected "Done" status to "Todo" for task with future deadline');
          parsedResponse.status = 'Todo';
        }
      }
      
      // Set the current date as deadline if none was provided
      if (!parsedResponse.deadline) {
        const today = new Date();
        parsedResponse.deadline = today.toISOString().split('T')[0];
      }
      
      console.log('Final validated response:', parsedResponse);
      return parsedResponse;
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      console.warn('OpenAI returned invalid JSON, using fallback simulation');
      return generateTaskDetails(taskDescription);
    }
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    // Add more detailed error logging
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
    }
    console.warn('OpenAI API call failed, using fallback simulation');
    return generateTaskDetails(taskDescription);
  }
}

// Helper functions for task analysis
function analyzeTaskTitle(taskDescription: string): string {
  // Extract a reasonable title from the task description
  if (taskDescription.length <= 50) {
    return taskDescription;
  }
  
  // Get the first sentence or up to 50 chars
  const firstSentence = taskDescription.split(/[.!?]/, 1)[0];
  return firstSentence.length > 50 
    ? firstSentence.substring(0, 47) + '...' 
    : firstSentence;
}

function calculateDeadline(taskDescription: string): string {
  const text = taskDescription.toLowerCase();
  const today = new Date();
  
  // Check for specific time frames
  if (text.includes('next week')) {
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    return nextWeek.toISOString().split('T')[0];
  }
  
  if (text.includes('next month') || text.includes('end of month')) {
    const nextMonth = new Date(today);
    nextMonth.setMonth(today.getMonth() + 1);
    return nextMonth.toISOString().split('T')[0];
  }
  
  if (text.includes('tomorrow')) {
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }
  
  if (text.includes('two weeks')) {
    const twoWeeks = new Date(today);
    twoWeeks.setDate(today.getDate() + 14);
    return twoWeeks.toISOString().split('T')[0];
  }
  
  // Default: set deadline based on priority
  const priority = analyzePriority(taskDescription);
  const daysToAdd = priority === 'High' ? 3 : priority === 'Medium' ? 7 : 14;
  
  const deadline = new Date(today);
  deadline.setDate(today.getDate() + daysToAdd);
  return deadline.toISOString().split('T')[0];
}

function analyzePriority(taskDescription: string): 'Low' | 'Medium' | 'High' {
  const text = taskDescription.toLowerCase();
  
  if (text.includes('urgent') || text.includes('critical') || text.includes('high priority') || text.includes('important')) {
    return 'High';
  }
  
  if (text.includes('whenever') || text.includes('sometime') || text.includes('low priority') || text.includes('not urgent')) {
    return 'Low';
  }
  
  return 'Medium';
}

function analyzeTaskStatus(taskDescription: string): 'Todo' | 'In Progress' | 'Done' {
  const text = taskDescription.toLowerCase();
  
  // Check for "In Progress" indicators
  if (text.includes('in progress') || 
      text.includes('currently working') || 
      text.includes('already started') || 
      text.includes('working on')) {
    return 'In Progress';
  }
  
  // Check for "Done" indicators - must have clear past tense and completion indicators
  const pastTenseIndicators = ['completed', 'finished', 'done', 'delivered', 'submitted'];
  const completionIndicators = ['already', 'yesterday', 'last week', 'earlier'];
  
  let hasPastTense = false;
  let hasCompletion = false;
  
  for (const indicator of pastTenseIndicators) {
    if (text.includes(indicator)) {
      hasPastTense = true;
      break;
    }
  }
  
  for (const indicator of completionIndicators) {
    if (text.includes(indicator)) {
      hasCompletion = true;
      break;
    }
  }
  
  if (hasPastTense && hasCompletion) {
    return 'Done';
  }
  
  // Default to "Todo" for new tasks or when status is unclear
  return 'Todo';
} 