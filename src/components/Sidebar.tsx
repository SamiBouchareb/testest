'use client'

import { FC, useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useMindMap } from '@/contexts/MindMapContext'
import {
  HomeIcon,
  PlusIcon,
  BookmarkIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon,
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { MindMapData } from '@/types/mindmap'

export const Sidebar: FC = () => {
  const { user, signInWithGoogle, logout } = useAuth()
  const { loadSavedMap } = useMindMap()
  const pathname = usePathname()
  const [savedMaps, setSavedMaps] = useState<MindMapData[]>([])
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    const fetchSavedMaps = async () => {
      if (!user) return
      try {
        const q = query(
          collection(db, 'mindmaps'),
          where('userId', '==', user.uid)
        )
        const querySnapshot = await getDocs(q)
        const maps = querySnapshot.docs
          .map(doc => ({ ...doc.data(), id: doc.id } as MindMapData))
          .sort((a, b) => {
            const dateA = a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : (a.createdAt as Date).getTime()
            const dateB = b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : (b.createdAt as Date).getTime()
            return dateB - dateA
          })
        setSavedMaps(maps)
      } catch (error) {
        console.error('Error fetching saved maps:', error)
      }
    }

    fetchSavedMaps()
  }, [user])

  return (
    <div 
      className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${
        isExpanded ? 'w-64' : 'w-16'
      }`}
    >
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className={`flex items-center gap-2 ${!isExpanded && 'hidden'}`}>
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="font-semibold text-gray-800">Mind Map AI</span>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 7a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 13a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          {user ? (
            <>
              <button
                onClick={() => loadSavedMap(null)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors w-full text-left ${
                  pathname === '/' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <HomeIcon className="h-5 w-5" />
                {isExpanded && <span>New Map</span>}
              </button>

              {/* Saved Maps Section */}
              <div className="mt-4">
                <div className={`px-3 py-2 text-xs font-medium text-gray-500 ${!isExpanded && 'sr-only'}`}>
                  Saved Maps
                </div>
                <div className="space-y-1">
                  {savedMaps.map((map) => (
                    <button
                      key={map.id}
                      onClick={() => loadSavedMap(map)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm w-full text-left text-gray-700 hover:bg-gray-100"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                      </svg>
                      {isExpanded && (
                        <span className="truncate">{map.title}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="p-3">
              <button
                onClick={() => signInWithGoogle()}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                  <path fill="none" d="M1 1h22v22H1z" />
                </svg>
                {isExpanded && <span>Sign in with Google</span>}
              </button>
            </div>
          )}
        </div>
      </div>

      {user && (
        <div className="p-2 border-t border-gray-200">
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeftOnRectangleIcon className="h-5 w-5" />
            {isExpanded && <span>Sign Out</span>}
          </button>
        </div>
      )}
    </div>
  )
}
