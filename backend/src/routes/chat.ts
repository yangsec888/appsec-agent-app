/**
 * Chat Interface Routes for AppSec Agent Dashboard
 * 
 * Author: Sam Li
 */

import { Router, Request, Response } from 'express';
import { AgentActions, AgentArgs, loadYaml } from 'appsec-agent';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import * as path from 'path';
import * as fs from 'fs';

const router = Router();

// Store chat sessions per user (userId -> AgentActions instance)
// Each AgentActions instance maintains its own conversation history
const chatSessions = new Map<number, AgentActions>();

// Load configuration
function loadConfig() {
  // Try multiple possible paths
  const possiblePaths = [
    path.join(__dirname, '..', '..', '..', '..', 'appsec-agent', 'conf', 'appsec_agent.yaml'),
    path.join(__dirname, '..', '..', '..', '..', '..', 'appsec-agent', 'conf', 'appsec_agent.yaml'),
    path.join(process.cwd(), '..', 'appsec-agent', 'conf', 'appsec_agent.yaml'),
  ];

  for (const configPath of possiblePaths) {
    if (fs.existsSync(configPath)) {
      return loadYaml(configPath);
    }
  }

  throw new Error(`Configuration file not found. Tried paths: ${possiblePaths.join(', ')}`);
}

// POST /api/chat
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { message, role = 'simple_query_agent', history } = req.body;
    const userId = req.userId!;
    
    // Check for required environment variables
    if (!process.env.ANTHROPIC_API_KEY) {
      const errorMsg = 'ANTHROPIC_API_KEY not found in environment variables. Please set it in your .env file.';
      console.error('❌', errorMsg);
      return res.status(500).json({ 
        error: 'Configuration error', 
        message: errorMsg 
      });
    }
    
    if (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.trim().length === 0) {
      const errorMsg = 'ANTHROPIC_API_KEY is set but empty. Please provide a valid API key.';
      console.error('❌', errorMsg);
      return res.status(500).json({ 
        error: 'Configuration error', 
        message: errorMsg 
      });
    }
    
    const confDict = loadConfig();
    
    if (!confDict) {
      return res.status(500).json({ error: 'Failed to load configuration', message: 'Configuration file could not be loaded' });
    }

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Check for /end marker to end the chat session
    if (message.trim().toLowerCase() === '/end') {
      // Clear the chat session for this user
      chatSessions.delete(userId);
      return res.json({
        status: 'success',
        response: 'Chat session ended. Starting a new conversation.',
        role,
        sessionEnded: true
      });
    }

    const args: AgentArgs = {
      role: role,
      environment: 'development',
      verbose: true  // Enable verbose mode for debugging
    };

    console.log(`Processing chat for user ${userId} with role: ${role}, environment: ${args.environment}`);
    console.log(`API Key present: ${!!process.env.ANTHROPIC_API_KEY}`);
    
    // Get or create AgentActions instance for this user's chat session
    // Each instance maintains its own conversation history
    let agentActions = chatSessions.get(userId);
    
    if (!agentActions) {
      // Create new session for this user
      console.log(`Creating new chat session for user ${userId}`);
      agentActions = new AgentActions(confDict, args.environment, args);
      chatSessions.set(userId, agentActions);
    } else {
      console.log(`Using existing chat session for user ${userId}`);
    }
    
    // Use the appropriate method based on role
    let response: string;
    console.log(`Processing chat request with role: ${role}, message: ${message.substring(0, 100)}...`);
    
    // Capture stdout to get the response that's being printed
    const originalStdoutWrite = process.stdout.write.bind(process.stdout);
    let capturedOutput = '';
    
    try {
      // Intercept stdout to capture the response
      process.stdout.write = function(chunk: any, encoding?: any, cb?: any): boolean {
        if (typeof chunk === 'string') {
          capturedOutput += chunk;
        }
        return originalStdoutWrite(chunk, encoding, cb);
      };
      
      if (role === 'simple_query_agent') {
        console.log('Calling simpleQueryClaudeWithOptions...');
        response = await agentActions.simpleQueryClaudeWithOptions(message);
        console.log('simpleQueryClaudeWithOptions completed');
      } else if (role === 'code_reviewer') {
        await agentActions.codeReviewerWithOptions(message);
        response = 'Code review query processed. Check the report file.';
      } else {
        console.log('Calling simpleQueryClaudeWithOptions (default)...');
        response = await agentActions.simpleQueryClaudeWithOptions(message);
        console.log('simpleQueryClaudeWithOptions completed (default)');
      }
      
      // Restore original stdout
      process.stdout.write = originalStdoutWrite;
      
      // Extract the response from captured output
      // Look for content after "Claude:" marker
      const claudeMarker = '\nClaude:\n';
      const claudeIndex = capturedOutput.indexOf(claudeMarker);
      
      if (claudeIndex !== -1) {
        // Extract everything after "Claude:"
        let extractedResponse = capturedOutput.substring(claudeIndex + claudeMarker.length);
        
        // Find where the response ends (before [DEBUG] Result or Cost:)
        const resultMarker = extractedResponse.indexOf('[DEBUG] Result:');
        const costMarker = extractedResponse.indexOf('\n\nCost:');
        const endMarker = resultMarker !== -1 ? resultMarker : (costMarker !== -1 ? costMarker : -1);
        
        if (endMarker !== -1) {
          extractedResponse = extractedResponse.substring(0, endMarker);
        }
        
        // Clean up the response
        extractedResponse = extractedResponse
          .replace(/\[DEBUG\].*$/gm, '') // Remove any remaining debug lines
          .trim();
        
        // If we found content in captured output and the method returned empty, use captured content
        if (extractedResponse.length > 0 && (!response || response.length === 0)) {
          console.log('Using captured response from stdout');
          response = extractedResponse;
        }
      } else {
        // Try alternative marker format
        const altMarker = 'Claude:\n';
        const altIndex = capturedOutput.indexOf(altMarker);
        if (altIndex !== -1) {
          let extractedResponse = capturedOutput.substring(altIndex + altMarker.length);
          const endMarker = extractedResponse.indexOf('[DEBUG] Result:');
          if (endMarker !== -1) {
            extractedResponse = extractedResponse.substring(0, endMarker);
          }
          extractedResponse = extractedResponse.trim();
          if (extractedResponse.length > 0 && (!response || response.length === 0)) {
            console.log('Using captured response from stdout (alternative format)');
            response = extractedResponse;
          }
        }
      }
      
      console.log(`Agent response type: ${typeof response}, length: ${response?.length || 0}`);
      if (response && response.length > 0) {
        console.log(`Agent response preview: ${response.substring(0, 200)}...`);
      } else {
        console.warn('⚠️  Agent returned empty response');
        console.log('Captured output length:', capturedOutput.length);
      }
    } catch (agentError: any) {
      // Restore original stdout on error
      process.stdout.write = originalStdoutWrite;
      console.error('Agent method error:', agentError);
      console.error('Agent error details:', {
        message: agentError.message,
        stack: agentError.stack,
        name: agentError.name
      });
      throw new Error(`Agent execution failed: ${agentError.message || 'Unknown error'}`);
    }

    // Ensure we have a valid response
    if (response === null || response === undefined) {
      throw new Error('Agent returned null or undefined');
    }
    
    if (typeof response !== 'string') {
      throw new Error(`Agent returned invalid type: ${typeof response}, expected string`);
    }
    
    if (response.trim().length === 0) {
      const errorMsg = 'Agent returned an empty string. This could indicate:\n' +
        '1. API key is missing or invalid\n' +
        '2. API request succeeded but returned no content\n' +
        '3. Network or API service issue\n' +
        'Please check your ANTHROPIC_API_KEY environment variable and API service status.';
      console.error(errorMsg);
      throw new Error(errorMsg);
    }

    res.json({
      status: 'success',
      response,
      role,
      sessionActive: true
    });
  } catch (error: any) {
    console.error('Chat error:', error);
    console.error('Error stack:', error.stack);
    const errorMessage = error.message || 'Unknown error occurred';
    res.status(500).json({ error: 'Failed to process chat message', message: errorMessage });
  }
});

// POST /api/chat/end - Explicitly end chat session
router.post('/end', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    chatSessions.delete(userId);
    res.json({
      status: 'success',
      message: 'Chat session ended successfully',
      sessionEnded: true
    });
  } catch (error: any) {
    console.error('End chat session error:', error);
    res.status(500).json({ error: 'Failed to end chat session', message: error.message });
  }
});

// GET /api/chat/session - Get current session status
router.get('/session', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const hasSession = chatSessions.has(userId);
    res.json({
      hasSession,
      message: hasSession ? 'Active chat session exists' : 'No active chat session'
    });
  } catch (error: any) {
    console.error('Get session status error:', error);
    res.status(500).json({ error: 'Failed to get session status', message: error.message });
  }
});

export { router as chatRoutes };

