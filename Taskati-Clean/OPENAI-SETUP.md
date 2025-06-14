# OpenAI API Integration

This project uses the OpenAI API to power the AI Task Generation feature. Follow these steps to set up the OpenAI API integration:

## Setting Up Your OpenAI API Key

1. **Create an OpenAI Account**:
   - Go to [https://platform.openai.com/signup](https://platform.openai.com/signup) and create an account if you don't have one.

2. **Get Your API Key**:
   - Log in to your OpenAI account.
   - Navigate to [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys).
   - Click "Create new secret key" and save it securely.

3. **Configure Your API Key**:
   - Locate the `.env` file in the root directory.
   - Update the OpenAI API key with your actual API key:
     ```
     VITE_OPENAI_API_KEY=your_actual_api_key_here
     ```
   - Note: The API key should start with `sk-` and not with `sk-proj-`.

## Using the Enhanced AI Task Assistant

The AI Task Assistant now supports natural language task creation and automatic column placement:

1. **Expanded Input Mode**:
   - Click the "Expand" button in the AI Task Assistant to open a larger text area.
   - Enter detailed natural language descriptions of your tasks.

2. **Getting the Best Results**:
   - **Be Specific About Priority**: Explicitly mention "high priority", "medium priority", or "low priority"
   - **Include Clear Deadlines**: Use phrases like "by next Friday", "end of month", "within two weeks"
   - **Indicate Status**: For tasks already in progress, mention "currently working on" or "in progress"
   - **For Completed Tasks**: Include phrases like "already completed", "finished", or "done"

3. **Automatic Task Creation**:
   - The AI will analyze your input and generate a complete task with:
     - Title
     - Description
     - Deadline
     - Priority level (Low, Medium, High)
     - Status (Todo, In Progress, Done)

4. **Column Placement**:
   - Tasks are automatically placed in the appropriate column based on the AI's analysis of your description.
   - For example, if you describe a completed task, it will be placed in the "Done" column.

5. **Example Prompts**:
   - **Todo**: "Create a new marketing plan for Q3 that focuses on social media. This is high priority and needs to be completed by the end of next month."
   - **In Progress**: "I'm currently working on redesigning the website homepage. It should be done by the end of the month."
   - **Done**: "I finished the quarterly financial report yesterday. It was a high priority task."

## Usage Notes

- The application will automatically use the OpenAI API when an API key is configured.
- If no API key is provided, the application will fall back to a simulation mode.
- API usage may incur costs depending on your OpenAI account plan.
- The API key is used client-side with the `dangerouslyAllowBrowser: true` flag. In a production environment, consider moving API calls to a backend server.

## Security Considerations

- Using the API key directly in the `.env` file is convenient for development but not recommended for production.
- For production deployment, consider:
  1. Using environment variables on your hosting platform
  2. Creating a backend API that makes OpenAI calls server-side
  3. Using authentication to protect your API endpoints

## Troubleshooting

- If you see an error message about the OpenAI API key not being configured, check that your `.env` file contains the correct key.
- Make sure you're using a standard API key (starting with `sk-`) and not a shared projects API key (which starts with `sk-proj-`).
- If you're still having issues, check the browser console for more detailed error messages. 