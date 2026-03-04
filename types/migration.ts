export type AgentStatus = 'queued' | 'running' | 'done' | 'error';

export interface SourceTrace {
  source: string;
  startLine: number;
  endLine: number;
  note: string;
}

export interface ParsedStructure {
  sections: string[];
  procedures: string[];
  fileOps: Array<{ op: string; target: string; line: number }>;
  fields: string[];
  screenReferences: string[];
  sourceTrace: SourceTrace[];
  ragEvidence: string[];
}

export interface MigrationIR {
  entities: string[];
  operations: string[];
  endpointCandidates: string[];
  validations: string[];
  transactionHints: string[];
  sourceTrace: SourceTrace[];
  ragEvidence: string[];
}

export interface DataDictionary {
  fields: Array<{
    name: string;
    type: string;
    precision?: string;
    constraints: string[];
    validationSuggestions: string[];
  }>;
  ragEvidence: string[];
}

export interface MappingReport {
  mappings: Array<{
    rpgSegment: string;
    springArtifact: string;
    targetLayer: 'api' | 'application' | 'domain' | 'infrastructure';
  }>;
  ragEvidence: string[];
}

export interface ProjectModel {
  folders: string[];
  files: Array<{ path: string; content: string }>;
  ragEvidence: string[];
}

export interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileTreeNode[];
}

export interface AgentStep<TInput = unknown, TOutput = unknown> {
  id: number;
  name: string;
  purpose: string;
  status: AgentStatus;
  input: TInput;
  output?: TOutput;
  error?: string;
}

export interface MigrationResult {
  steps: AgentStep[];
  filesMap: Record<string, string>;
  tree: FileTreeNode[];
}
