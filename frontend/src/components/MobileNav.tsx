'use client';

import React from 'react';
import { LayoutGrid, FolderClosed, BookOpen, Sparkles } from 'lucide-react';

interface MobileNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function MobileNav({ activeTab, onTabChange }: MobileNavProps) {
  return (
    <div className="mobile-nav-container no-print">
      <div className="mobile-nav-inner">
        <button 
          className={`nav-btn ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => onTabChange('home')}
        >
          <LayoutGrid size={20} />
          <span>Home</span>
        </button>

        <button 
          className={`nav-btn ${activeTab === 'assignments' ? 'active' : ''}`}
          onClick={() => onTabChange('assignments')}
        >
          <FolderClosed size={20} />
          <span>Assignments</span>
        </button>

        <button 
          className={`nav-btn ${activeTab === 'library' ? 'active' : ''}`}
          onClick={() => onTabChange('library')}
        >
          <BookOpen size={20} />
          <span>Library</span>
        </button>

        <button 
          className={`nav-btn ${activeTab === 'toolkit' ? 'active' : ''}`}
          onClick={() => onTabChange('toolkit')}
        >
          <Sparkles size={20} />
          <span>AI Toolkit</span>
        </button>
      </div>

      <style jsx>{`
        .mobile-nav-container {
          display: none;
          position: fixed;
          bottom: 24px; /* Shifted up slightly for floating breathing room */
          left: 0;
          right: 0;
          padding: 0 16px;
          z-index: 99;
        }

        .mobile-nav-inner {
          display: flex;
          align-items: center;
          justify-content: space-around;
          background: #111112; /* Darker carbon black to match premium styling */
          border-radius: var(--radius-xl);
          padding: 14px 10px; /* Spacious, comfortable vertical breathing room */
          box-shadow: 0 12px 30px -5px rgba(0, 0, 0, 0.45);
          width: 100%;
          max-width: 480px;
          margin: 0 auto;
          border: 1px solid rgba(255, 255, 255, 0.05); /* Subtle dark border border */
        }

        .nav-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          color: #71717A;
          font-size: 10px;
          font-weight: 600;
          transition: var(--transition-smooth);
        }

        .nav-btn.active {
          color: #FFFFFF;
          font-weight: 700;
        }

        .nav-btn :global(svg) {
          margin-bottom: 2px;
          transition: var(--transition-smooth);
        }

        .nav-btn.active :global(svg) {
          transform: scale(1.05);
          color: #FFFFFF;
        }

        @media (max-width: 768px) {
          .mobile-nav-container {
            display: block;
          }
        }
      `}</style>
    </div>
  );
}
