export interface PlanStepItem {
  stepNumber: number;
  title: string;
  description: string;
  filesToModify?: string[];
  commandToRun?: string;
}

export interface GeneratedPlan {
  summary: string;
  steps: PlanStepItem[];
  riskAssessment: 'low' | 'medium' | 'high';
  estimatedFilesCount: number;
}

export interface GeneratedFileChange {
  filePath: string;
  changeType: 'modified' | 'added' | 'deleted';
  diff: string;
  originalContent?: string;
  modifiedContent?: string;
  additions: number;
  deletions: number;
}

export interface AttachedImageContext {
  dataUrl?: string;
  mimeType?: string;
  base64?: string;
  name?: string;
}

export interface AIProviderContext {
  prompt: string;
  systemInstructions: string;
  projectKnowledge?: string;
  technologyStack?: string;
  businessRules?: string;
  codingStandards?: string;
  architectureRules?: string;
  doNotModifyRules?: string;
  repositoryContext?: {
    owner: string;
    name: string;
    branch: string;
    status?: string;
    provider?: string;
    files?: string[];
  };
  mcpContext?: {
    name?: string;
    serverType?: string;
    authMethod?: string;
    status?: string;
    scopes?: string;
    hasDiscoveredTools?: boolean;
    toolCount?: number;
    lastConnectedAt?: Date | null;
  };
  deploymentContext?: {
    strategy?: string;
    status?: string;
    healthCheckUrl?: string | null;
    lastDeployedAt?: Date | null;
  };
  image?: AttachedImageContext;
}

export interface AIProvider {
  name: string;
  generatePlan(context: AIProviderContext): Promise<GeneratedPlan>;
  generateCodeChanges(context: AIProviderContext, plan: GeneratedPlan): Promise<GeneratedFileChange[]>;
  chat(message: string, history: Array<{ sender: string; content: string }>, context: AIProviderContext): Promise<string>;
  chatStream?(message: string, history: Array<{ sender: string; content: string }>, context: AIProviderContext, onChunk: (token: string) => void): Promise<string>;
}

