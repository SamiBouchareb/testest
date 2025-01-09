export interface MindMapNode {
  id: string;
  type: 'root' | 'topic' | 'subtopic' | 'point' | 'subpoint';
  data: {
    label: string;
    description?: string;
    level?: number;
  };
  position: { x: number; y: number };
}

export interface MindMapEdge {
  id: string;
  source: string;
  target: string;
  type?: 'default' | 'custom';
  animated?: boolean;
  style?: {
    stroke?: string;
  };
}

export interface Point {
  title: string;
  description?: string;
  subpoints?: string[];
}

export interface Subtopic {
  title: string;
  description?: string;
  points: Point[];
}

export interface Topic {
  title: string;
  description?: string;
  subtopics: Subtopic[];
}

export interface DeepseekResponse {
  topics: Topic[];
}

export interface MindMapData {
  id: string;
  title: string;
  nodes: MindMapNode[];
  edges: MindMapEdge[];
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  prompt: string;
}

export interface MindMapProject {
  id: string;
  title: string;
  description: string;
  mindMapId: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  collaborators?: string[];
  tags?: string[];
}
