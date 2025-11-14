/**
 * Chat Routes Tests for AppSec Agent Dashboard
 * 
 * Author: Sam Li
 */

import request from 'supertest';
import express from 'express';
import { chatRoutes } from '../../routes/chat';
import { authRoutes } from '../../routes/auth';
import { UserModel } from '../../models/user';
import db from '../../db/database';

// Mock appsec-agent package
jest.mock('appsec-agent', () => {
  const mockAgentActions = {
    simpleQueryClaudeWithOptions: jest.fn(),
    codeReviewerWithOptions: jest.fn(),
  };

  return {
    AgentActions: jest.fn().mockImplementation(() => mockAgentActions),
    AgentArgs: {},
    loadYaml: jest.fn().mockReturnValue({
      anthropic: {
        api_key: 'test-api-key',
        base_url: 'https://api.anthropic.com',
      },
    }),
  };
});

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);

describe('Chat Routes', () => {
  let testUserId: number;
  let authToken: string;
  let testUserId2: number;
  let authToken2: string;

  beforeAll(async () => {
    // Create test users
    const user1 = await UserModel.create('testchat', 'testchat@example.com', 'testpass123');
    testUserId = user1.id;
    
    const user2 = await UserModel.create('testchat2', 'testchat2@example.com', 'testpass123');
    testUserId2 = user2.id;

    // Get auth tokens
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'testchat',
        password: 'testpass123',
      });
    authToken = loginResponse.body.token;

    const loginResponse2 = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'testchat2',
        password: 'testpass123',
      });
    authToken2 = loginResponse2.body.token;
  });

  afterAll(async () => {
    // Clean up test users
    try {
      const stmt = db.prepare('DELETE FROM users WHERE id = ?');
      stmt.run(testUserId);
      stmt.run(testUserId2);
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  beforeEach(() => {
    // Set required environment variable
    process.env.ANTHROPIC_API_KEY = 'test-api-key';
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Suppress console output for this test suite
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock the simpleQueryClaudeWithOptions method for all instances
    const { AgentActions } = require('appsec-agent');
    // Reset the mock implementation
    AgentActions.mockImplementation(() => {
      const mockInstance = {
        simpleQueryClaudeWithOptions: jest.fn().mockResolvedValue('Test response from agent'),
        codeReviewerWithOptions: jest.fn().mockResolvedValue('Code review completed'),
      };
      return mockInstance;
    });
  });

  afterEach(() => {
    // Restore console methods
    jest.restoreAllMocks();
  });

  describe('POST /api/chat', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({
          message: 'Hello',
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('Access token required');
    });

    it('should reject request without message', async () => {
      const response = await request(app)
        .post('/api/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('required');
    });

    it('should handle /end command', async () => {
      const response = await request(app)
        .post('/api/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: '/end',
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.sessionEnded).toBe(true);
      expect(response.body.response).toContain('ended');
    });

    it('should create new chat session on first message', async () => {
      const { AgentActions } = require('appsec-agent');
      const mockInstance = new AgentActions();
      mockInstance.simpleQueryClaudeWithOptions = jest.fn().mockResolvedValue('First response');

      const response = await request(app)
        .post('/api/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'Hello, this is my first message',
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.sessionActive).toBe(true);
      expect(AgentActions).toHaveBeenCalled();
    });

    it('should reuse existing chat session for subsequent messages', async () => {
      const { AgentActions } = require('appsec-agent');
      
      // First message
      const response1 = await request(app)
        .post('/api/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'First message',
        });

      expect(response1.status).toBe(200);
      const firstCallCount = AgentActions.mock.calls.length;

      // Second message - should reuse session
      const response2 = await request(app)
        .post('/api/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'Second message',
        });

      expect(response2.status).toBe(200);
      // Should not create a new AgentActions instance
      expect(AgentActions.mock.calls.length).toBe(firstCallCount);
    });

    it('should maintain separate sessions for different users', async () => {
      // User 1 sends message
      const response1 = await request(app)
        .post('/api/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'Message from user 1',
        });

      expect(response1.status).toBe(200);
      expect(response1.body.sessionActive).toBe(true);

      // User 2 sends message
      const response2 = await request(app)
        .post('/api/chat')
        .set('Authorization', `Bearer ${authToken2}`)
        .send({
          message: 'Message from user 2',
        });

      expect(response2.status).toBe(200);
      expect(response2.body.sessionActive).toBe(true);
      
      // Both users should have their own sessions
      // Verify by checking session status for each user
      const session1 = await request(app)
        .get('/api/chat/session')
        .set('Authorization', `Bearer ${authToken}`);
      
      const session2 = await request(app)
        .get('/api/chat/session')
        .set('Authorization', `Bearer ${authToken2}`);
      
      expect(session1.body.hasSession).toBe(true);
      expect(session2.body.hasSession).toBe(true);
    });

    it('should handle code_reviewer role', async () => {
      const { AgentActions } = require('appsec-agent');
      const mockInstance = new AgentActions();
      mockInstance.codeReviewerWithOptions = jest.fn().mockResolvedValue('Code review completed');

      const response = await request(app)
        .post('/api/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'Review this code',
          role: 'code_reviewer',
        });

      expect(response.status).toBe(200);
      expect(response.body.role).toBe('code_reviewer');
    });

    it('should handle missing ANTHROPIC_API_KEY', async () => {
      delete process.env.ANTHROPIC_API_KEY;

      const response = await request(app)
        .post('/api/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'Hello',
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toContain('Configuration error');
      expect(response.body.message).toContain('ANTHROPIC_API_KEY');

      // Restore for other tests
      process.env.ANTHROPIC_API_KEY = 'test-api-key';
    });

    it('should accept history parameter (for future use)', async () => {
      const { AgentActions } = require('appsec-agent');
      const mockInstance = new AgentActions();
      mockInstance.simpleQueryClaudeWithOptions = jest.fn().mockResolvedValue('Response with history');

      const response = await request(app)
        .post('/api/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'Follow-up question',
          history: [
            { role: 'user', content: 'First question' },
            { role: 'assistant', content: 'First answer' },
          ],
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
    });
  });

  describe('POST /api/chat/end', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/chat/end');

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('Access token required');
    });

    it('should end chat session', async () => {
      // First, create a session
      await request(app)
        .post('/api/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'Create a session',
        });

      // Then end it
      const response = await request(app)
        .post('/api/chat/end')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.sessionEnded).toBe(true);
      expect(response.body.message).toContain('ended');
    }, 10000); // Increase timeout for API calls

    it('should handle ending non-existent session gracefully', async () => {
      const response = await request(app)
        .post('/api/chat/end')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.sessionEnded).toBe(true);
    });
  });

  describe('GET /api/chat/session', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/chat/session')
        .timeout(3000);

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('Access token required');
    }, 5000);

    it('should return false when no session exists', async () => {
      const response = await request(app)
        .get('/api/chat/session')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.hasSession).toBe(false);
      expect(response.body.message).toContain('No active chat session');
    });

    it('should return true when session exists', async () => {
      // Create a session first
      await request(app)
        .post('/api/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'Create session',
        });

      // Check session status
      const response = await request(app)
        .get('/api/chat/session')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.hasSession).toBe(true);
      expect(response.body.message).toContain('Active chat session');
    }, 10000); // Increase timeout for API calls

    it('should return false after ending session', async () => {
      // Create a session
      const createResponse = await request(app)
        .post('/api/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'Create session',
        });
      
      expect(createResponse.status).toBe(200);

      // End the session
      const endResponse = await request(app)
        .post('/api/chat/end')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(endResponse.status).toBe(200);

      // Check session status
      const response = await request(app)
        .get('/api/chat/session')
        .set('Authorization', `Bearer ${authToken}`)
        .timeout(3000);

      expect(response.status).toBe(200);
      expect(response.body.hasSession).toBe(false);
    }, 10000);
  });

  describe('Session isolation', () => {
    it('should maintain separate sessions for different users', async () => {
      // User 1 creates a session
      await request(app)
        .post('/api/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'User 1 message',
        });

      // User 2 creates a session
      await request(app)
        .post('/api/chat')
        .set('Authorization', `Bearer ${authToken2}`)
        .send({
          message: 'User 2 message',
        });

      // User 1 ends their session
      await request(app)
        .post('/api/chat/end')
        .set('Authorization', `Bearer ${authToken}`);

      // User 2's session should still be active
      const response = await request(app)
        .get('/api/chat/session')
        .set('Authorization', `Bearer ${authToken2}`);

      expect(response.status).toBe(200);
      expect(response.body.hasSession).toBe(true);
    }, 15000); // Increase timeout to 15 seconds for multiple API calls
  });
});

