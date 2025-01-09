'use client'

import { FC, useState, useEffect, useCallback } from 'react'
import ReactFlow, { 
  Background, 
  Controls,
  MiniMap,
  Node,
  Edge,
  ConnectionMode,
  Panel,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  MarkerType
} from 'reactflow'
import 'reactflow/dist/style.css'
import { useMindMap } from '@/contexts/MindMapContext'
import { useAuth } from '@/contexts/AuthContext'
import CustomNode from './nodes/CustomNode'

const nodeTypes = {
  root: CustomNode,
  topic: CustomNode,
  subtopic: CustomNode,
  point: CustomNode,
  subpoint: CustomNode,
};

const edgeOptions = {
  style: { strokeWidth: 1.5 },
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 20,
    height: 20,
    color: '#94A3B8',
  },
};

const connectionLineStyle = {
  strokeWidth: 1.5,
  stroke: '#94A3B8',
};

export const MindMapWorkspace: FC = () => {
  const [prompt, setPrompt] = useState('')
  const { user, loading: authLoading } = useAuth()
  const { 
    generateMindMap, 
    currentMindMap, 
    isLoading,
    error,
    clearError,
    createProject 
  } = useMindMap()
  
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [projectTitle, setProjectTitle] = useState('')
  const [projectDescription, setProjectDescription] = useState('')

  useEffect(() => {
    if (currentMindMap) {
      setNodes(currentMindMap.nodes)
      setEdges(currentMindMap.edges)
    }
  }, [currentMindMap, setNodes, setEdges])

  useEffect(() => {
    // Show project modal only when mind map is generated successfully
    if (currentMindMap && !error && !isLoading) {
      setShowProjectModal(true)
    }
  }, [currentMindMap, error, isLoading])

  const handleGenerateMindMap = async () => {
    if (!prompt.trim()) return
    clearError()
    await generateMindMap(prompt)
  }

  const handleCreateProject = async () => {
    if (!projectTitle.trim()) return
    try {
      await createProject(projectTitle, projectDescription)
      setShowProjectModal(false)
      setProjectTitle('')
      setProjectDescription('')
    } catch (err) {
      console.error('Failed to create project:', err)
    }
  }

  const handleCloseModal = () => {
    setShowProjectModal(false)
    setProjectTitle('')
    setProjectDescription('')
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      <div className="p-4 border-b border-gray-200 bg-white shadow-sm">
        <div className="max-w-3xl mx-auto">
          <textarea
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="Enter your prompt here..."
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <div className="mt-2 flex items-center gap-4">
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              onClick={handleGenerateMindMap}
              disabled={isLoading || !prompt.trim()}
            >
              {isLoading ? 'Generating...' : 'Generate Mind Map'}
            </button>
            {error && (
              <p className="text-red-500 text-sm flex items-center gap-2">
                {error}
                <button
                  onClick={clearError}
                  className="text-red-700 hover:text-red-900"
                >
                  ✕
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex-1 relative">
        {currentMindMap ? (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            defaultEdgeOptions={edgeOptions}
            connectionLineStyle={connectionLineStyle}
            connectionMode={ConnectionMode.Loose}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.1}
            maxZoom={1.5}
            className="bg-gray-50"
          >
            <Background 
              variant={BackgroundVariant.Dots} 
              gap={12} 
              size={1} 
              color="#E2E8F0"
            />
            <Controls 
              className="bg-white shadow-lg border border-gray-200 rounded-lg" 
              showInteractive={false}
            />
            <MiniMap 
              className="bg-white shadow-lg border border-gray-200 rounded-lg !w-48 !h-48"
              maskColor="rgba(241, 245, 249, 0.7)"
              nodeColor={(node) => {
                switch (node.type) {
                  case 'root': return '#3B82F6'
                  case 'topic': return '#A855F7'
                  case 'subtopic': return '#22C55E'
                  case 'point': return '#EAB308'
                  case 'subpoint': return '#F97316'
                  default: return '#94A3B8'
                }
              }}
            />
            <Panel position="top-right" className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
              <div className="text-sm text-gray-600">
                <p className="font-medium text-gray-800">{currentMindMap.title}</p>
                <p className="text-xs mt-1">Created: {currentMindMap.createdAt.toLocaleString()}</p>
              </div>
            </Panel>
          </ReactFlow>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            {isLoading ? (
              <div className="flex flex-col items-center gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <p>Generating your mind map...</p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-lg font-medium text-gray-600">Welcome to Mind Map AI</p>
                <p className="mt-2 text-gray-500">Enter a prompt and generate a mind map to get started</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Project Creation Modal */}
      {showProjectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Create Project</h2>
            <input
              type="text"
              placeholder="Project Title"
              className="w-full p-2 border border-gray-300 rounded mb-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
            />
            <textarea
              placeholder="Project Description"
              className="w-full p-2 border border-gray-300 rounded mb-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                onClick={handleCloseModal}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                onClick={handleCreateProject}
                disabled={!projectTitle.trim()}
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
