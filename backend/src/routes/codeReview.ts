/**
 * Code Review Routes for AppSec Agent Dashboard
 * 
 * Author: Sam Li
 */

import { Router, Request, Response } from 'express';
import { AgentActions, AgentArgs, loadYaml } from 'appsec-agent';
import * as path from 'path';
import * as fs from 'fs';
import multer from 'multer';

const router = Router();

// Configure multer for file uploads
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

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

// POST /api/code-review
router.post('/', upload.single('repository'), async (req: Request, res: Response) => {
  try {
    const { repoPath, query } = req.body;
    const confDict = loadConfig();

    if (!confDict) {
      return res.status(500).json({ error: 'Failed to load configuration' });
    }

    if (!repoPath && !req.file) {
      return res.status(400).json({ error: 'Repository path or file upload required' });
    }

    const sourcePath = repoPath || req.file?.path;

    const args: AgentArgs = {
      role: 'code_reviewer',
      environment: 'development',
      src_dir: sourcePath,
      output_file: 'review_report.md',
      verbose: false
    };

    const agentActions = new AgentActions(confDict, args.environment, args);
    const reviewQuery = query || 'Review this codebase for security vulnerabilities';
    
    await agentActions.codeReviewerWithOptions(reviewQuery);

    // Read the generated report
    const reportPath = path.join(process.cwd(), args.output_file || 'review_report.md');
    let reportContent = '';
    if (fs.existsSync(reportPath)) {
      reportContent = fs.readFileSync(reportPath, 'utf-8');
    }

    res.json({
      status: 'success',
      message: 'Code review completed',
      reportPath: args.output_file,
      reportContent
    });
  } catch (error: unknown) {
    console.error('Code review error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({ error: 'Failed to perform code review', message });
  }
});

// GET /api/code-review/reports
router.get('/reports', (req: Request, res: Response) => {
  try {
    const reportsDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(reportsDir)) {
      return res.json({ reports: [] });
    }

    const files = fs.readdirSync(reportsDir)
      .filter(file => file.endsWith('.md'))
      .map(file => ({
        name: file,
        path: path.join(reportsDir, file),
        createdAt: fs.statSync(path.join(reportsDir, file)).birthtime
      }));

    res.json({ reports: files });
  } catch (error: unknown) {
    console.error('List reports error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({ error: 'Failed to list reports', message });
  }
});

export { router as codeReviewRoutes };

