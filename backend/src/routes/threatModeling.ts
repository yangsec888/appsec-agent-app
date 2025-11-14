/**
 * Threat Modeling Routes for AppSec Agent Dashboard
 * 
 * Author: Sam Li
 */

import { Router, Request, Response } from 'express';
import { AgentActions, AgentArgs, loadYaml } from 'appsec-agent';
import * as path from 'path';
import * as fs from 'fs';

const router = Router();

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

// POST /api/threat-modeling
router.post('/', async (req: Request, res: Response) => {
  try {
    const { repoPath, query } = req.body;
    const confDict = loadConfig();

    if (!confDict) {
      return res.status(500).json({ error: 'Failed to load configuration' });
    }

    if (!repoPath) {
      return res.status(400).json({ error: 'Repository path required' });
    }

    const args: AgentArgs = {
      role: 'threat_modeler',
      environment: 'development',
      src_dir: repoPath,
      output_file: 'threat_model_report.md',
      verbose: false
    };

    const agentActions = new AgentActions(confDict, args.environment, args);
    const modelingQuery = query || 'Perform threat modeling analysis';
    
    await agentActions.threatModelerAgentWithOptions(modelingQuery);

    // Read the generated report
    const reportPath = path.join(process.cwd(), args.output_file || 'threat_model_report.md');
    let reportContent = '';
    if (fs.existsSync(reportPath)) {
      reportContent = fs.readFileSync(reportPath, 'utf-8');
    }

    res.json({
      status: 'success',
      message: 'Threat modeling completed',
      reportPath: args.output_file,
      reportContent
    });
  } catch (error: any) {
    console.error('Threat modeling error:', error);
    res.status(500).json({ error: 'Failed to perform threat modeling', message: error.message });
  }
});

// GET /api/threat-modeling/reports
router.get('/reports', (req: Request, res: Response) => {
  try {
    const reportsDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(reportsDir)) {
      return res.json({ reports: [] });
    }

    const files = fs.readdirSync(reportsDir)
      .filter(file => file.includes('threat') && file.endsWith('.md'))
      .map(file => ({
        name: file,
        path: path.join(reportsDir, file),
        createdAt: fs.statSync(path.join(reportsDir, file)).birthtime
      }));

    res.json({ reports: files });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to list reports', message: error.message });
  }
});

export { router as threatModelingRoutes };

