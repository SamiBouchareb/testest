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
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [mapTitle, setMapTitle] = useState('')
  const { user, loading: authLoading } = useAuth()
  const { 
    generateMindMap, 
    currentMindMap, 
    isLoading,
    error,
    clearError,
    saveMindMap
  } = useMindMap()
  
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  useEffect(() => {
    if (currentMindMap) {
      setNodes(currentMindMap.nodes)
      setEdges(currentMindMap.edges)
    }
  }, [currentMindMap, setNodes, setEdges])

  const handleGenerateMindMap = async () => {
    if (!prompt.trim()) return
    clearError()
    await generateMindMap(prompt)
  }

  const handleSave = async () => {
    if (!mapTitle.trim()) return
    try {
      const result = await saveMindMap(mapTitle)
      setShowSaveModal(false)
      setMapTitle('')
      // You can use the result (map ID) here if needed
    } catch (err) {
      console.error('Failed to save mind map:', err)
    }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col relative bg-gray-50">
      {/* Floating Prompt Section */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 w-[500px]">
        <div className="bg-white/80 backdrop-blur-md rounded-xl shadow-lg border border-blue-100 p-3 
                      animate-float transition-all duration-300 hover:shadow-blue-200/50
                      hover:border-blue-200 group">
          <div className="flex gap-2">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleGenerateMindMap();
                }
              }}
              placeholder="Enter your topic or idea..."
              className="flex-1 bg-transparent border-none outline-none placeholder-gray-400
                        text-gray-700 text-sm focus:ring-0"
            />
            <div className="flex gap-2">
              <button
                onClick={handleGenerateMindMap}
                disabled={isLoading || !prompt.trim()}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-300
                          ${isLoading 
                            ? 'bg-blue-100 text-blue-400 cursor-not-allowed'
                            : 'bg-blue-500 text-white hover:bg-blue-600 hover:shadow-md hover:shadow-blue-200'
                          }
                          disabled:opacity-50 disabled:cursor-not-allowed
                          group-hover:translate-y-[-1px]`}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
                    <span>Generating...</span>
                  </div>
                ) : (
                  'Generate'
                )}
              </button>
              {currentMindMap && (
                <button
                  onClick={() => setShowSaveModal(true)}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium bg-green-500 text-white
                            hover:bg-green-600 transition-all duration-300 hover:shadow-md 
                            hover:shadow-green-200 group-hover:translate-y-[-1px]"
                >
                  Save
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Error Message */}
        {error && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 
                        animate-slideDown">
            {error}
            <button
              onClick={clearError}
              className="ml-2 text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Mind Map Area */}
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

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Save Mind Map</h2>
            <input
              type="text"
              placeholder="Enter a title for your mind map"
              className="w-full p-2 border border-gray-300 rounded mb-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              value={mapTitle}
              onChange={(e) => setMapTitle(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium"
                onClick={() => {
                  setShowSaveModal(false)
                  setMapTitle('')
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                onClick={handleSave}
                disabled={!mapTitle.trim()}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
