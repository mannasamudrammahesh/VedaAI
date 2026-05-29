'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bell, Menu, Settings, LogOut } from 'lucide-react';
import Logo from './Logo';

interface MobileHeaderProps {
  user?: any;
  onLogout?: () => void;
  onSettingsClick?: () => void;
}

export default function MobileHeader({ user, onLogout, onSettingsClick }: MobileHeaderProps) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="mobile-header no-print">
      <div className="mobile-header-inner">
        {/* Brand */}
        <div className="mobile-brand">
          <Logo size="small" />
        </div>

        {/* Right side actions */}
        <div className="mobile-actions">
          {/* Notification bell with orange active badge */}
          <div style={{ position: 'relative' }} ref={notificationsRef}>
            <button className="icon-btn-bell" onClick={() => setNotificationsOpen(!notificationsOpen)}>
              <Bell size={20} />
              <span className="orange-dot"></span>
            </button>
            {notificationsOpen && (
              <div className="floating-context-menu" style={{ position: 'absolute', top: '42px', right: '-10px', minWidth: '220px', maxWidth: '85vw', padding: '16px', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', background: '#FFFFFF', borderRadius: '12px', zIndex: 100, border: '1px solid var(--border-color)' }}>
                <Bell size={24} color="#A1A1AA" style={{ margin: '0 auto 8px' }} />
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '500' }}>No notifications</p>
                <p style={{ color: '#A1A1AA', fontSize: '11px', marginTop: '4px', marginBottom: 0 }}>You're all caught up!</p>
              </div>
            )}
          </div>

          {/* User profile picture */}
          <div className="user-profile-avatar" onClick={() => setUserMenuOpen(!userMenuOpen)}>
            <div style={{ background: 'var(--gradient-glow)', width: '100%', height: '100%', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '11px', textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
              {user?.name ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : 'JD'}
            </div>
          </div>

          {/* Hamburger menu */}
          <div style={{ position: 'relative' }} ref={userMenuRef}>
            <button className="icon-btn" onClick={() => setUserMenuOpen(!userMenuOpen)}>
              <Menu size={20} />
            </button>
            {userMenuOpen && (
              <div className="floating-context-menu" style={{ position: 'absolute', top: '42px', right: '-10px', minWidth: '180px', padding: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', background: '#FFFFFF', borderRadius: '12px', zIndex: 100, border: '1px solid var(--border-color)' }}>
                <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-color)', fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.4', marginBottom: '4px' }}>
                  Signed in as <br /><strong style={{ color: 'var(--text-primary)', wordBreak: 'break-all' }}>{user?.email || 'user@example.com'}</strong>
                </div>
                <button style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', width: '100%', borderRadius: '4px', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }} onClick={() => { setUserMenuOpen(false); if(onSettingsClick) onSettingsClick(); }}>
                  <Settings size={14} />
                  <span>Settings</span>
                </button>
                <button className="delete-btn" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', width: '100%', borderRadius: '4px' }} onClick={() => { setUserMenuOpen(false); if(onLogout) onLogout(); }}>
                  <LogOut size={14} />
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .mobile-header {
          display: none;
          width: 100%;
          padding: 12px 16px;
          background: transparent;
          z-index: 99;
          position: sticky;
          top: 0;
        }

        .mobile-header-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #FFFFFF;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-xl);
          padding: 8px 18px;
          width: 100%;
          box-shadow: var(--shadow-md);
        }

        .mobile-brand {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }

        .logo-text {
          font-size: 16px;
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: -0.5px;
        }

        .mobile-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .icon-btn-bell {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: var(--bg-app);
          color: var(--text-primary);
        }

        .orange-dot {
          position: absolute;
          top: 4px;
          right: 4px;
          width: 8px;
          height: 8px;
          background: #F97316;
          border-radius: 50%;
          border: 1.5px solid #FFFFFF;
        }

        .user-profile-avatar {
          border-radius: 50%;
          overflow: hidden;
          border: 1.5px solid var(--border-color);
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .icon-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
          color: var(--text-primary);
        }

        @media (max-width: 768px) {
          .mobile-header {
            display: block;
          }
        }
      `}</style>
    </div>
  );
}
