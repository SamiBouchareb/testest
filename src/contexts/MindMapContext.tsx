'use client'

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { MindMapData, MindMapNode, MindMapEdge, MindMapProject } from '@/types/mindmap';
import { generateMindMapContent } from '@/lib/deepseek';
import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, doc, getDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';

interface MindMapContextType {
  currentMindMap: MindMapData | null;
  currentProject: MindMapProject | null;
  isLoading: boolean;
  error: string | null;
  generateMindMap: (prompt: string) => Promise<void>;
  createProject: (title: string, description: string) => Promise<void>;
  saveMindMap: () => Promise<void>;
  clearError: () => void;
}

const MindMapContext = createContext<MindMapContextType | null>(null);

export function MindMapProvider({ children }: { children: ReactNode }) {
  const [currentMindMap, setCurrentMindMap] = useState<MindMapData | null>(null);
  const [currentProject, setCurrentProject] = useState<MindMapProject | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!user) {
      setCurrentMindMap(null);
      setCurrentProject(null);
      setError(null);
    }
  }, [user]);

  const clearError = () => {
    setError(null);
  };

  const generateNodePosition = (level: number, index: number, total: number, parentX: number, parentY: number) => {
    // Core spacing configuration
    const BASE_RADIUS = 200;  // Base unit for radius calculations
    const SPACING_MULTIPLIER = 1.2; // Controls how quickly radius grows with levels
    
    // Calculate radius and spacing for each level
    const levelConfig = {
      0: { // Root node (center)
        radius: 0,
        yOffset: 0,
        spreadAngle: 2 * Math.PI,  // Full circle
        nodeSpacing: 0
      },
      1: { // Main topics (closest to center)
        radius: BASE_RADIUS,
        yOffset: 0,
        spreadAngle: 2 * Math.PI,  // Full circle
        nodeSpacing: 1.2  // More space between main topics
      },
      2: { // Subtopics
        radius: BASE_RADIUS * SPACING_MULTIPLIER * 1.4,
        yOffset: BASE_RADIUS * 0.4,
        spreadAngle: Math.PI / 2,  // 90 degrees
        nodeSpacing: 1.0
      },
      3: { // Points
        radius: BASE_RADIUS * SPACING_MULTIPLIER * 1.8,
        yOffset: BASE_RADIUS * 0.8,
        spreadAngle: Math.PI / 3,  // 60 degrees
        nodeSpacing: 0.8
      },
      4: { // Subpoints (furthest from center)
        radius: BASE_RADIUS * SPACING_MULTIPLIER * 2.2,
        yOffset: BASE_RADIUS * 1.2,
        spreadAngle: Math.PI / 4,  // 45 degrees
        nodeSpacing: 0.6
      }
    };

    const config = levelConfig[level as keyof typeof levelConfig] || levelConfig[4];
    
    // Root node is always at center
    if (level === 0) {
      return { x: 0, y: 0 };
    }
    
    // Main topics - distribute in a full circle around root
    if (level === 1) {
      const angleStep = (2 * Math.PI) / total;
      const angle = -Math.PI / 2 + angleStep * index; // Start from top
      
      // Add slight radius variation for main topics
      const radiusVariation = Math.sin(index * 2.5) * (BASE_RADIUS * 0.05);
      
      return {
        x: (config.radius + radiusVariation) * Math.cos(angle),
        y: (config.radius + radiusVariation) * Math.sin(angle)
      };
    }
    
    // For subtopics and beyond (levels 2+)
    // Calculate parent's angle relative to center
    const parentAngleToCenter = Math.atan2(parentY, parentX);
    
    // Calculate the base angle for this group of nodes
    const totalSpread = config.spreadAngle;
    const nodesPerGroup = Math.min(total, 5); // Limit nodes per group
    const groupCount = Math.ceil(total / nodesPerGroup);
    const currentGroup = Math.floor(index / nodesPerGroup);
    const indexInGroup = index % nodesPerGroup;
    
    // Calculate the spread for this specific group
    const groupSpread = totalSpread / groupCount;
    const angleInGroup = (indexInGroup - (nodesPerGroup - 1) / 2) * (groupSpread / nodesPerGroup);
    
    // Calculate final angle relative to parent
    const baseAngle = parentAngleToCenter + angleInGroup * config.nodeSpacing;
    
    // Add variation based on level and index
    const angleVariation = (Math.sin(index * 1.5) * 0.1) / level;
    const finalAngle = baseAngle + angleVariation;
    
    // Calculate radius with slight variation
    const radiusVariation = Math.cos(index * 2) * (config.radius * 0.05);
    const finalRadius = config.radius + radiusVariation;
    
    // Calculate base position
    const baseX = finalRadius * Math.cos(finalAngle);
    const baseY = finalRadius * Math.sin(finalAngle);
    
    // Add level-specific vertical offset
    const verticalOffset = config.yOffset * Math.sign(baseY);
    
    // Add slight horizontal offset to break symmetry
    const horizontalOffset = (level - 1) * 10 * (index % 2 ? 1 : -1);
    
    // Calculate final position relative to parent
    const x = parentX + baseX + horizontalOffset;
    const y = parentY + baseY + verticalOffset;
    
    // Add collision avoidance offset
    const collisionOffset = Math.sin(index * 3.14) * (10 * level);
    
    return {
      x: x + collisionOffset,
      y: y
    };
  };

  const generateMindMap = async (prompt: string) => {
    if (!user) {
      setError('Please sign in to generate mind maps');
      return;
    }

    if (authLoading) {
      setError('Please wait while we authenticate you');
      return;
    }

    setIsLoading(true);
    setError(null);
    setCurrentMindMap(null);

    try {
      const content = await generateMindMapContent(prompt);
      
      if (!content.topics || content.topics.length === 0) {
        throw new Error('No topics generated for the mind map');
      }

      const nodes: MindMapNode[] = [];
      const edges: MindMapEdge[] = [];
      
      // Add root node
      const rootId = 'root';
      const rootPosition = { x: 400, y: 200 };
      nodes.push({
        id: rootId,
        type: 'root',
        data: { 
          label: prompt,
          level: 0
        },
        position: rootPosition,
      });

      // Add topic nodes
      content.topics.forEach((topic, topicIndex) => {
        const topicId = `topic-${topicIndex}`;
        const topicPosition = generateNodePosition(1, topicIndex, content.topics.length, rootPosition.x, rootPosition.y);
        
        nodes.push({
          id: topicId,
          type: 'topic',
          data: { 
            label: topic.title,
            description: topic.description,
            level: 1
          },
          position: topicPosition,
        });

        edges.push({
          id: `edge-root-${topicId}`,
          source: rootId,
          target: topicId,
          type: 'default',
          animated: true,
          style: { stroke: '#818CF8' }
        });

        // Add subtopic nodes
        topic.subtopics.forEach((subtopic, subtopicIndex) => {
          const subtopicId = `subtopic-${topicIndex}-${subtopicIndex}`;
          const subtopicPosition = generateNodePosition(
            2,
            subtopicIndex,
            topic.subtopics.length,
            topicPosition.x,
            topicPosition.y
          );

          nodes.push({
            id: subtopicId,
            type: 'subtopic',
            data: {
              label: subtopic.title,
              description: subtopic.description,
              level: 2
            },
            position: subtopicPosition,
          });

          edges.push({
            id: `edge-${topicId}-${subtopicId}`,
            source: topicId,
            target: subtopicId,
            type: 'default',
            style: { stroke: '#34D399' }
          });

          // Add point nodes
          subtopic.points.forEach((point, pointIndex) => {
            const pointId = `point-${topicIndex}-${subtopicIndex}-${pointIndex}`;
            const pointPosition = generateNodePosition(
              3,
              pointIndex,
              subtopic.points.length,
              subtopicPosition.x,
              subtopicPosition.y
            );

            nodes.push({
              id: pointId,
              type: 'point',
              data: {
                label: point.title,
                description: point.description,
                level: 3
              },
              position: pointPosition,
            });

            edges.push({
              id: `edge-${subtopicId}-${pointId}`,
              source: subtopicId,
              target: pointId,
              type: 'default',
              style: { stroke: '#FBBF24' }
            });

            // Add subpoint nodes
            if (point.subpoints) {
              point.subpoints.forEach((subpoint, subpointIndex) => {
                const subpointId = `subpoint-${topicIndex}-${subtopicIndex}-${pointIndex}-${subpointIndex}`;
                const subpointPosition = generateNodePosition(
                  4,
                  subpointIndex,
                  point.subpoints?.length || 0,
                  pointPosition.x,
                  pointPosition.y
                );

                nodes.push({
                  id: subpointId,
                  type: 'subpoint',
                  data: {
                    label: subpoint,
                    level: 4
                  },
                  position: subpointPosition,
                });

                edges.push({
                  id: `edge-${pointId}-${subpointId}`,
                  source: pointId,
                  target: subpointId,
                  type: 'default',
                  style: { stroke: '#FB923C' }
                });
              });
            }
          });
        });
      });

      const mindMap: MindMapData = {
        id: Date.now().toString(),
        title: prompt,
        nodes,
        edges,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: user.uid,
        prompt,
      };

      setCurrentMindMap(mindMap);
    } catch (error) {
      console.error('Error generating mind map:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate mind map');
    } finally {
      setIsLoading(false);
    }
  };

  const createProject = async (title: string, description: string) => {
    if (!user || !currentMindMap) {
      setError('Cannot create project: user not logged in or no mind map generated');
      return;
    }

    try {
      // Save mind map first
      const mindMapRef = await addDoc(collection(db, 'mindmaps'), {
        ...currentMindMap,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Create project with reference to mind map
      const project: MindMapProject = {
        id: '',
        title,
        description,
        mindMapId: mindMapRef.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: user.uid,
      };

      const projectRef = await addDoc(collection(db, 'projects'), project);
      await updateDoc(doc(db, 'projects', projectRef.id), { id: projectRef.id });

      setCurrentProject({
        ...project,
        id: projectRef.id,
      });
    } catch (error) {
      console.error('Error creating project:', error);
      setError('Failed to create project');
    }
  };

  const saveMindMap = async () => {
    if (!user || !currentMindMap) {
      setError('Cannot save: user not logged in or no mind map to save');
      return;
    }

    try {
      await addDoc(collection(db, 'mindmaps'), {
        ...currentMindMap,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error saving mind map:', error);
      setError('Failed to save mind map');
    }
  };

  return (
    <MindMapContext.Provider
      value={{
        currentMindMap,
        currentProject,
        isLoading,
        error,
        generateMindMap,
        createProject,
        saveMindMap,
        clearError,
      }}
    >
      {children}
    </MindMapContext.Provider>
  );
}

export function useMindMap() {
  const context = useContext(MindMapContext);
  if (!context) {
    throw new Error('useMindMap must be used within a MindMapProvider');
  }
  return context;
}
