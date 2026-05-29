'use client';

import React from 'react';
import { LayoutGrid, Users, FileText, Smartphone, Clock, Settings, Sparkles } from 'lucide-react';
import Logo from './Logo';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onCreateClick: () => void;
  assignmentsCount: number;
  schoolName?: string;
  schoolLocation?: string;
}

export default function Sidebar({ activeTab, onTabChange, onCreateClick, assignmentsCount, schoolName, schoolLocation }: SidebarProps) {
  return (
    <div className="sidebar-container no-print">
      <div className="sidebar-inner">
        {/* Logo Section */}
        <div className="sidebar-logo" style={{ cursor: 'pointer' }} onClick={() => onTabChange('home')}>
          <Logo size="medium" />
        </div>

        {/* Create Assignment Glowing CTA */}
        <button className="create-cta-btn active-glow" onClick={onCreateClick}>
          <Sparkles size={16} fill="white" className="sparkle-icon" />
          <span>Create Assignment</span>
        </button>

        {/* Navigation Menu */}
        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => onTabChange('home')}
          >
            <LayoutGrid size={18} />
            <span>Home</span>
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'groups' ? 'active' : ''}`}
            onClick={() => onTabChange('groups')}
          >
            <Users size={18} />
            <span>My Groups</span>
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'assignments' ? 'active' : ''}`}
            onClick={() => onTabChange('assignments')}
          >
            <FileText size={18} />
            <span>Assignments</span>
            {assignmentsCount > 0 && (
              <span className="badge-count">{assignmentsCount}</span>
            )}
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'toolkit' ? 'active' : ''}`}
            onClick={() => onTabChange('toolkit')}
          >
            <Smartphone size={18} />
            <span>AI Teacher's Toolkit</span>
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'library' ? 'active' : ''}`}
            onClick={() => onTabChange('library')}
          >
            <Clock size={18} />
            <span>My Library</span>
            <span className="badge-count secondary">32</span>
          </button>
        </nav>

        {/* Footer Area */}
        <div className="sidebar-footer">
          <button 
            className={`nav-item settings-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => onTabChange('settings')}
          >
            <Settings size={18} />
            <span>Settings</span>
          </button>

          <div className="profile-card">
            <div className="profile-avatar" style={{ background: '#FFF7ED', border: '1px solid #FFEDD5', color: '#F97316', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/>
              </svg>
            </div>
            <div className="profile-info">
              <p className="profile-name">{schoolName || 'Delhi Public School'}</p>
              <p className="profile-location">{schoolLocation || 'Vadodara, Gujarat'}</p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .sidebar-container {
          width: 260px;
          height: 100vh;
          background: var(--bg-sidebar);
          border-right: 1px solid var(--border-color);
          position: sticky;
          top: 0;
          flex-shrink: 0;
          z-index: 100;
        }

        .sidebar-inner {
          display: flex;
          flex-direction: column;
          height: 100%;
          padding: 24px 16px;
        }

        .sidebar-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 28px;
          padding-left: 8px;
        }

        .logo-icon-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .logo-text {
          font-size: 20px;
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: -0.5px;
        }

        .create-cta-btn {
          width: 100%;
          background: #18181B;
          color: #FFFFFF;
          border-radius: var(--radius-full);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          font-weight: 600;
          font-size: 14px;
          padding: 14px 20px;
          margin-bottom: 24px;
          transition: var(--transition-smooth);
          border: 2px solid transparent;
        }

        .create-cta-btn:hover {
          background: #27272A;
          transform: translateY(-1px);
        }

        .create-cta-btn.active-glow {
          border-color: #F97316;
          box-shadow: 0 0 14px rgba(249, 115, 22, 0.3);
        }

        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 6px;
          flex: 1;
        }

        .nav-item {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          gap: 12px;
          padding: 12px 14px;
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          font-weight: 500;
          font-size: 14px;
          transition: var(--transition-smooth);
          width: 100%;
        }

        .nav-item:hover {
          background: var(--bg-app);
          color: var(--text-primary);
        }

        .nav-item.active {
          background: var(--bg-app);
          color: var(--text-primary);
          font-weight: 600;
        }

        .nav-item :global(svg) {
          flex-shrink: 0;
        }

        .badge-count {
          background: #F97316;
          color: #FFFFFF;
          font-size: 11px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: var(--radius-full);
          line-height: 14px;
          margin-left: auto; /* Push badge all the way to the far right */
        }

        .badge-count.secondary {
          background: #E4E4E7;
          color: #71717A;
        }

        .sidebar-footer {
          margin-top: auto;
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding-top: 16px;
          border-top: 1px solid var(--border-color);
        }

        .settings-item {
          margin-bottom: 4px;
        }

        .profile-card {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px;
          background: var(--bg-app);
          border-radius: var(--radius-md);
        }

        .profile-avatar {
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          overflow: hidden;
          background: #FFFFFF;
          border: 1px solid var(--border-color);
          width: 32px;
          height: 32px;
        }

        .avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .profile-info {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .profile-name {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .profile-location {
          font-size: 11px;
          color: var(--text-secondary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        @media (max-width: 768px) {
          .sidebar-container {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

