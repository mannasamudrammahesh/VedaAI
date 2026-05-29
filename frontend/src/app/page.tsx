'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Filter, MoreVertical, Plus, HelpCircle, FileText, ArrowLeft, Bell, ChevronDown, LayoutGrid, Sparkles, CheckCircle, XCircle, Info, X, AlertTriangle, User as UserIcon, Lock, Mail, Eye, EyeOff, LogOut, ArrowRight, UserPlus, Settings } from 'lucide-react';
import { useAssessmentStore, IAssignment } from '../store/useAssessmentStore';
import Sidebar from '../components/Sidebar';
import MobileHeader from '../components/MobileHeader';
import MobileNav from '../components/MobileNav';
import AssignmentForm from '../components/AssignmentForm';
import QuestionPaperView from '../components/QuestionPaperView';
import JobProgressOverlay from '../components/JobProgressOverlay';
import ToolkitView from '../components/ToolkitView';
import Logo from '../components/Logo';

// ─── Toast System ───────────────────────────────────────────────
type ToastType = 'success' | 'error' | 'info' | 'warning';
interface Toast {
  id: number;
  type: ToastType;
  title: string;
  message?: string;
}

export default function MainPage() {
  const {
    assignments,
    loading,
    activeJob,
    selectedAssignment,
    fetchAssignments,
    createAssignment,
    deleteAssignment,
    regenerateAssignment,
    setSelectedAssignment,
    resetActiveJob,
    // Authentication
    user,
    isAuthenticated,
    authLoading,
    login,
    register,
    logout,
    loadAuthFromStorage
  } = useAssessmentStore();

  // Auth Local Form States
  const [authTab, setAuthTab] = useState<'login' | 'signup'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  
  // Notifications Dropdown
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  
  // Navigation and active views
  const [activeTab, setActiveTab] = useState('assignments');
  const [view, setView] = useState<'list' | 'create' | 'paper' | 'settings' | 'toolkit'>('list');

  // Settings Local States
  const [settingsName, setSettingsName] = useState('');
  const [settingsEmail, setSettingsEmail] = useState('');
  const [settingsSchoolName, setSettingsSchoolName] = useState('Delhi Public School');
  const [settingsSchoolLocation, setSettingsSchoolLocation] = useState('Vadodara, Gujarat');
  const [settingsModel, setSettingsModel] = useState('gemini-1.5-flash');
  const [settingsTime, setSettingsTime] = useState('45 minutes');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterActive, setFilterActive] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Context Menu Dropdown state
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const filterMenuRef = useRef<HTMLDivElement>(null);

  // ─── Toast Notifications ───────────────────────────────────────
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastCounter = useRef(0);

  const showToast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = ++toastCounter.current;
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const dismissToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // ─── Delete Confirmation Modal ─────────────────────────────────
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteTargetTitle, setDeleteTargetTitle] = useState<string>('');

  // Restore auth state on mount with premium loading effect timeout to eliminate FOUC
  useEffect(() => {
    loadAuthFromStorage();
    const timer = setTimeout(() => {
      setMounted(true);
    }, 1200);
    return () => clearTimeout(timer);
  }, [loadAuthFromStorage]);

  // Fetch on mount when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchAssignments();
    }
  }, [fetchAssignments, isAuthenticated]);

  // Close context menu and user menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target as Node)) {
        setFilterActive(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  // Sync view state based on selected assignment or active creation job
  useEffect(() => {
    if (activeJob) {
      setView('list'); // Show progress overlays on top of list
    }
  }, [activeJob]);

  // Sync settings inputs when user changes or loads
  useEffect(() => {
    if (user) {
      setSettingsName(user.name);
      setSettingsEmail(user.email);
    }
    if (typeof window !== 'undefined') {
      const storedSchool = localStorage.getItem('veda_school_name');
      const storedLoc = localStorage.getItem('veda_school_location');
      const storedModel = localStorage.getItem('veda_default_model');
      const storedTime = localStorage.getItem('veda_default_time');
      if (storedSchool) setSettingsSchoolName(storedSchool);
      if (storedLoc) setSettingsSchoolLocation(storedLoc);
      if (storedModel) setSettingsModel(storedModel);
      if (storedTime) setSettingsTime(storedTime);
    }
  }, [user]);

  const handleSaveSettings = () => {
    try {
      if (!settingsName || !settingsEmail) {
        showToast('error', 'Validation Error', 'Name and Email are required.');
        return;
      }

      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('veda_school_name', settingsSchoolName);
        localStorage.setItem('veda_school_location', settingsSchoolLocation);
        localStorage.setItem('veda_default_model', settingsModel);
        localStorage.setItem('veda_default_time', settingsTime);
      }

      // Update Zustand User state to reflect immediately in the header profile
      if (user) {
        const updatedUser = { ...user, name: settingsName, email: settingsEmail };
        useAssessmentStore.setState({ user: updatedUser });
        if (typeof window !== 'undefined') {
          localStorage.setItem('veda_user', JSON.stringify(updatedUser));
        }
      }

      showToast('success', 'Settings Saved', 'Your configuration changes have been applied successfully.');
    } catch (err) {
      showToast('error', 'Save Failed', 'An error occurred while saving your settings.');
    }
  };

  const handleCreateSubmit = async (data: any) => {
    try {
      await createAssignment(data);
      setView('list');
    } catch (err: any) {
      showToast('error', 'Creation Failed', err?.message || 'Could not create assignment. Please try again.');
    }
  };

  const handleViewPaper = (assignment: IAssignment) => {
    setSelectedAssignment(assignment);
    setView('paper');
    setActiveMenuId(null);
  };

  const handleDeletePaper = (id: string) => {
    const assignment = assignments.find((a) => a._id === id);
    setDeleteTargetId(id);
    setDeleteTargetTitle(assignment?.title || 'this assignment');
    setActiveMenuId(null);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await deleteAssignment(deleteTargetId);
      showToast('success', 'Assignment Deleted', `"${deleteTargetTitle}" has been permanently removed.`);
    } catch (err) {
      showToast('error', 'Delete Failed', 'Something went wrong. Please try again.');
    } finally {
      setDeleteTargetId(null);
      setDeleteTargetTitle('');
    }
  };

  const handleRegenerate = async (id: string) => {
    try {
      await regenerateAssignment(id);
      setActiveMenuId(null);
    } catch (err) {
      showToast('error', 'Regeneration Failed', 'Could not trigger regeneration. Try again.');
    }
  };

  // Filtered lists
  const filteredAssignments = assignments.filter((a) => {
    const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || a.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    try {
      if (authTab === 'login') {
        await login(authEmail, authPassword);
        showToast('success', 'Logged in successfully', `Welcome back, ${useAssessmentStore.getState().user?.name}!`);
      } else {
        if (authPassword.length < 6) {
          setAuthError('Password must be at least 6 characters long.');
          return;
        }
        await register(authName, authEmail, authPassword);
        showToast('success', 'Account created!', `Welcome to VedaAI, ${authName}!`);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed. Please check your credentials.');
      showToast('error', 'Authentication Failed', err.message || 'Could not verify your credentials.');
    }
  };

  const handleUseDemoAccount = async () => {
    setAuthError(null);
    try {
      await login('teacher@veda.ai', 'password123');
      showToast('success', 'Logged in as Demo Teacher', 'Enjoy editing pre-seeded CBSE questions!');
    } catch (err: any) {
      setAuthError(err.message || 'Demo access failed.');
    }
  };

  return (
    <>
      {!mounted ? (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'linear-gradient(135deg, #09090b 0%, #18181b 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{
            position: 'relative',
            width: '80px',
            height: '80px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: '3px solid transparent',
              borderTopColor: '#F59223',
              borderRightColor: '#7E1515',
              animation: 'spin 1s linear infinite'
            }}></div>
            <div style={{
              position: 'absolute',
              inset: '8px',
              borderRadius: '50%',
              border: '3px solid transparent',
              borderBottomColor: '#FFFFFF',
              borderLeftColor: '#C2C2C2',
              animation: 'spin 1.5s linear infinite reverse'
            }}></div>
            <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ animation: 'pulse 2s ease-in-out infinite' }}>
              <path d="M 22 34 L 42 34 L 54 74 L 34 74 Z" fill="#C2C2C2" />
              <path d="M 58 34 L 78 34 L 66 74 L 46 74 Z" fill="#FFFFFF" />
            </svg>
          </div>
          <h2 style={{
            color: '#FFFFFF',
            fontSize: '24px',
            fontWeight: 700,
            letterSpacing: '-0.5px',
            margin: '0 0 8px 0',
            background: 'linear-gradient(to right, #ffffff, #a1a1aa)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            animation: 'pulse 2s ease-in-out infinite'
          }}>VedaAI</h2>
          <p style={{
            color: '#A1A1AA',
            fontSize: '14px',
            margin: 0,
            fontWeight: 500,
            letterSpacing: '0.5px',
            animation: 'pulse 2s ease-in-out infinite'
          }}>INITIALIZING WORKSPACE</p>
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
          `}} />
        </div>
      ) : !isAuthenticated ? (
        <div className="auth-fullscreen-container">
          <div className="auth-card glass-panel animate-reveal">
            <div className="auth-logo-row">
              <Logo size="large" />
            </div>
            
            <div className="auth-tabs">
              <button 
                className={`auth-tab-btn ${authTab === 'login' ? 'active' : ''}`}
                onClick={() => { setAuthTab('login'); setAuthError(null); }}
                type="button"
              >
                Sign In
              </button>
              <button 
                className={`auth-tab-btn ${authTab === 'signup' ? 'active' : ''}`}
                onClick={() => { setAuthTab('signup'); setAuthError(null); }}
                type="button"
              >
                Register
              </button>
            </div>

            <p className="auth-subtitle">
              {authTab === 'login' 
                ? 'Access your AI-powered CBSE lesson papers generator.' 
                : 'Create an account to start generating CBSE assessments.'}
            </p>

            {authError && (
              <div className="auth-error-banner">
                <AlertTriangle size={16} />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="auth-form">
              {authTab === 'signup' && (
                <div className="auth-input-group">
                  <label>Full Name</label>
                  <div className="auth-input-wrapper">
                    <span className="auth-input-icon">
                      <UserIcon size={18} />
                    </span>
                    <input 
                      type="text" 
                      placeholder="Enter your name" 
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              <div className="auth-input-group">
                <label>Email Address</label>
                <div className="auth-input-wrapper">
                  <span className="auth-input-icon">
                    <Mail size={18} />
                  </span>
                  <input 
                    type="email" 
                    placeholder="name@school.edu" 
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="auth-input-group">
                <label>Password</label>
                <div className="auth-input-wrapper">
                  <span className="auth-input-icon">
                    <Lock size={18} />
                  </span>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    required
                  />
                  <button 
                    type="button" 
                    className="auth-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="auth-submit-btn" disabled={authLoading}>
                {authLoading ? (
                  <div className="loader-ring" style={{ width: '18px', height: '18px' }}></div>
                ) : (
                  <>
                    <span>{authTab === 'login' ? 'Sign In' : 'Create Account'}</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            {authTab === 'login' && (
              <div className="auth-demo-section">
                <div className="demo-divider">
                  <span>OR TRY THE DEMO</span>
                </div>
                <button 
                  type="button" 
                  className="auth-demo-btn"
                  onClick={handleUseDemoAccount}
                  disabled={authLoading}
                >
                  <Sparkles size={16} color="#F97316" />
                  <span>Use Demo Teacher Account</span>
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="app-container">
      {/* 1. Desktop Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab === 'settings') {
            setView('settings');
          } else if (tab === 'toolkit') {
            setView('toolkit');
          } else {
            setView('list');
          }
        }}
        onCreateClick={() => setView('create')}
        assignmentsCount={assignments.length}
        schoolName={settingsSchoolName}
        schoolLocation={settingsSchoolLocation}
      />

      {/* 2. Mobile Top Capsule Header */}
      <MobileHeader 
        user={user}
        onLogout={() => { logout(); showToast('info', 'Logged Out', 'You have been signed out.'); }}
        onSettingsClick={() => { setView('settings'); setActiveTab('settings'); }}
      />

      {/* Main Panel Content */}
      <main className="main-layout">
        {/* Horizontal Desktop Header Bar matching Figma perfectly */}
        <div className="desktop-header no-print">
          <div className="header-left">
            <button 
              className="header-back-btn" 
              onClick={() => {
                if (view === 'paper') setView('list');
                else if (view === 'create') setView('list');
                else if (view === 'settings' || view === 'toolkit') {
                  setView('list');
                  setActiveTab('assignments');
                }
              }} 
              disabled={view === 'list'}
              type="button"
            >
              <ArrowLeft size={16} />
            </button>
            <div className="breadcrumb">
              {view === 'list' ? (
                <>
                  <LayoutGrid size={16} className="breadcrumb-icon" />
                  <span>Assignment</span>
                </>
              ) : view === 'settings' ? (
                <>
                  <Settings size={16} className="breadcrumb-icon" />
                  <span>Settings</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} className="breadcrumb-icon" />
                  <span>Create New</span>
                </>
              )}
            </div>
          </div>
          <div className="header-right">
            <div style={{ position: 'relative' }} ref={notificationsRef}>
              <button className="header-bell-btn" type="button" onClick={() => setNotificationsOpen(!notificationsOpen)}>
                <Bell size={18} />
                <span className="orange-dot"></span>
              </button>
              
              {notificationsOpen && (
                <div className="floating-context-menu" style={{ top: '42px', right: '0', minWidth: '220px', padding: '16px', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                  <Bell size={24} color="#A1A1AA" style={{ margin: '0 auto 8px' }} />
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '500' }}>No notifications</p>
                  <p style={{ color: '#A1A1AA', fontSize: '11px', marginTop: '4px' }}>You're all caught up!</p>
                </div>
              )}
            </div>
            
            <div className="header-user-dropdown" ref={userMenuRef} onClick={() => setUserMenuOpen(!userMenuOpen)} style={{ position: 'relative' }}>
              <div className="user-avatar-circle" style={{ background: 'var(--gradient-glow)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '11px', textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                {user?.name ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : 'JD'}
              </div>
              <span className="user-name">{user?.name ? user.name.split(' ')[0] : 'Teacher'}</span>
              <ChevronDown size={14} className="dropdown-arrow" />
              
              {userMenuOpen && (
                <div className="floating-context-menu" style={{ top: '48px', right: '0', minWidth: '180px', padding: '6px' }} onClick={(e) => e.stopPropagation()}>
                  <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-color)', fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.4', marginBottom: '4px' }}>
                    Signed in as <br /><strong style={{ color: 'var(--text-primary)', wordBreak: 'break-all' }}>{user?.email}</strong>
                  </div>
                  <button className="delete-btn" onClick={() => { logout(); showToast('info', 'Logged Out', 'You have been signed out.'); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', width: '100%', borderRadius: '4px' }}>
                    <LogOut size={14} />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Dynamic Views */}
        {view === 'create' ? (
          /* SCREEN 2: Assignment Details Form Setup */
          <AssignmentForm
            onBack={() => setView('list')}
            onSubmit={handleCreateSubmit}
          />
        ) : view === 'paper' && selectedAssignment ? (
          /* SCREEN 3: Generated Structured Question Paper Sheet */
          <QuestionPaperView
            assignment={selectedAssignment}
            onBack={() => {
              setView('list');
              setSelectedAssignment(null);
            }}
            onRegenerate={() => handleRegenerate(selectedAssignment._id)}
          />
        ) : view === 'settings' ? (
          /* NEW SCREEN: Settings Configuration Panel */
          <div className="settings-panel animate-reveal">
            <div className="settings-header">
              <h1>Settings</h1>
              <p className="subtitle-text" style={{ paddingLeft: 0 }}>Configure your personal teacher details, school attributes, and AI preferences.</p>
            </div>

            <div className="settings-grid">
              {/* Card 1: Profile Information */}
              <div className="settings-card glass-panel">
                <div className="settings-card-header">
                  <UserIcon size={18} color="#F97316" />
                  <h3>Profile Information</h3>
                </div>
                <div className="settings-card-body">
                  <div className="settings-input-group">
                    <label>Teacher Name</label>
                    <input 
                      type="text" 
                      value={settingsName}
                      onChange={(e) => setSettingsName(e.target.value)}
                      placeholder="Your Full Name"
                    />
                  </div>
                  <div className="settings-input-group">
                    <label>Email Address</label>
                    <input 
                      type="email" 
                      value={settingsEmail}
                      onChange={(e) => setSettingsEmail(e.target.value)}
                      placeholder="your.email@school.edu"
                    />
                  </div>
                </div>
              </div>

              {/* Card 2: School Preferences */}
              <div className="settings-card glass-panel">
                <div className="settings-card-header">
                  <FileText size={18} color="#F97316" />
                  <h3>School Information</h3>
                </div>
                <div className="settings-card-body">
                  <div className="settings-input-group">
                    <label>School Name</label>
                    <input 
                      type="text" 
                      value={settingsSchoolName}
                      onChange={(e) => setSettingsSchoolName(e.target.value)}
                      placeholder="E.g. Delhi Public School"
                    />
                  </div>
                  <div className="settings-input-group">
                    <label>Location / Branch</label>
                    <input 
                      type="text" 
                      value={settingsSchoolLocation}
                      onChange={(e) => setSettingsSchoolLocation(e.target.value)}
                      placeholder="E.g. Vadodara, Gujarat"
                    />
                  </div>
                </div>
              </div>

              {/* Card 3: AI Model Preferences */}
              <div className="settings-card glass-panel">
                <div className="settings-card-header">
                  <Sparkles size={18} color="#F97316" />
                  <h3>AI Engine Configuration</h3>
                </div>
                <div className="settings-card-body">
                  <div className="settings-input-group">
                    <label>Gemini Generative Model</label>
                    <select 
                      value={settingsModel}
                      onChange={(e) => setSettingsModel(e.target.value)}
                      style={{ padding: '10px 14px', border: '1px solid var(--border-color)', borderRadius: '8px', background: '#FFFFFF', fontSize: '13px', fontWeight: '500', width: '100%' }}
                    >
                      <option value="gemini-1.5-flash">Gemini 1.5 Flash (Recommended - Ultra Fast)</option>
                      <option value="gemini-1.5-pro">Gemini 1.5 Pro (Deep Reasoning)</option>
                    </select>
                  </div>
                  <div className="settings-input-group">
                    <label>Default Test Time Allowed</label>
                    <input 
                      type="text" 
                      value={settingsTime}
                      onChange={(e) => setSettingsTime(e.target.value)}
                      placeholder="E.g. 45 minutes"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="settings-actions">
              <button className="primary-pill-btn" onClick={handleSaveSettings}>
                <span>Save Configurations</span>
              </button>
            </div>

          </div>
        ) : view === 'toolkit' ? (
          <ToolkitView showToast={showToast} />
        ) : (
          /* SCREEN 1: Assignments Lists Dashboard */
          <div className="listings-view">
            {/* Desktop breadcrumb & Title */}
            <div className="listings-header no-print">
              <div className="title-row">
                <span className="green-pulse-dot"></span>
                <h1>Assignments</h1>
              </div>
              <p className="subtitle-text">Manage and create assignments for your classes.</p>
            </div>

            {/* Combined Search & Filter Bar */}
            {assignments.length > 0 && (
              <div className="search-filter-bar no-print">
                <div style={{ position: 'relative' }} ref={filterMenuRef}>
                  <button 
                    className={`filter-btn ${filterActive ? 'active' : ''}`}
                    onClick={() => setFilterActive(!filterActive)}
                  >
                    <Filter size={16} />
                    <span>{filterStatus === 'all' ? 'Filter By Status' : `Status: ${filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)}`}</span>
                  </button>
                  {filterActive && (
                    <div className="floating-context-menu" style={{ top: '100%', left: 0, marginTop: '8px', zIndex: 10, width: '160px' }}>
                      <button onClick={() => { setFilterStatus('all'); setFilterActive(false); }}>All</button>
                      <button onClick={() => { setFilterStatus('completed'); setFilterActive(false); }}>Completed</button>
                      <button onClick={() => { setFilterStatus('pending'); setFilterActive(false); }}>Pending</button>
                      <button onClick={() => { setFilterStatus('generating'); setFilterActive(false); }}>Generating</button>
                    </div>
                  )}
                </div>

                <div className="search-input-wrapper">
                  <span className="search-icon">
                    <Search size={18} />
                  </span>
                  <input
                    type="text"
                    placeholder="Search Assignment..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                  />
                </div>
              </div>
            )}

            {/* List/Grid of Assignment cards */}
            {loading && assignments.length === 0 ? (
              <div className="listings-loader">
                <div className="loader-ring"></div>
                <p>Loading assignments...</p>
              </div>
            ) : filteredAssignments.length === 0 ? (
              /* Empty State Layout */
              <div className="empty-state-card">
                <div className="empty-illustration">
                  <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="60" cy="60" r="50" fill="#E4E4E7" fillOpacity="0.4"/>
                    <path d="M40 35H75C77.7614 35 80 37.2386 80 40V85C80 87.7614 77.7614 90 75 90H45C42.2386 90 40 87.7614 40 85V35Z" fill="white" stroke="#71717A" strokeWidth="2.5"/>
                    <path d="M48 45H72" stroke="#A1A1AA" strokeWidth="2.5" strokeLinecap="round"/>
                    <path d="M48 55H72" stroke="#A1A1AA" strokeWidth="2.5" strokeLinecap="round"/>
                    <path d="M48 65H60" stroke="#A1A1AA" strokeWidth="2.5" strokeLinecap="round"/>
                    
                    {/* Magnifying Glass with Red X */}
                    <circle cx="70" cy="70" r="22" fill="white" stroke="#71717A" strokeWidth="2.5"/>
                    <path d="M63 63L77 77" stroke="#EF4444" strokeWidth="4" strokeLinecap="round"/>
                    <path d="M77 63L63 77" stroke="#EF4444" strokeWidth="4" strokeLinecap="round"/>
                    <path d="M85 85L100 100" stroke="#71717A" strokeWidth="4.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <h3>No assignments yet</h3>
                <p>
                  Create your first assignment to start collecting and grading student submissions. 
                  You can set up rubrics, define marking criteria, and let AI assist with grading.
                </p>
                <button className="primary-pill-btn" onClick={() => setView('create')}>
                  <Plus size={16} />
                  <span>Create Your First Assignment</span>
                </button>
              </div>
            ) : (
              /* Grid Layout of populated cards */
              <div className="cards-grid">
                {filteredAssignments.map((item) => (
                  <div className="assignment-card glass-panel" key={item._id}>
                    <div className="card-header">
                      <h3 className="card-title" onClick={() => handleViewPaper(item)}>
                        {item.title}
                      </h3>
                      
                      {/* Context vertical dots */}
                      <div className="dots-menu-wrapper">
                        <button className="dots-btn" onClick={() => setActiveMenuId(item._id)}>
                          <MoreVertical size={18} />
                        </button>

                        {activeMenuId === item._id && (
                          <div className="floating-context-menu" ref={menuRef}>
                            <button onClick={() => handleViewPaper(item)}>
                              View Assignment
                            </button>
                            {item.status === 'completed' && (
                              <button onClick={() => handleRegenerate(item._id)}>
                                Regenerate
                              </button>
                            )}
                            <button className="delete-btn" onClick={() => handleDeletePaper(item._id)}>
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="card-body" onClick={() => handleViewPaper(item)}>
                      <div className="date-badge assigned">
                        Assigned on : <span>{new Date(item.assignedDate || item.createdAt).toLocaleDateString('en-GB')}</span>
                      </div>
                      
                      <div className="date-badge due">
                        Due : <span>{new Date(item.dueDate).toLocaleDateString('en-GB')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Bottom centered sticky CTA (Desktop) */}
            {assignments.length > 0 && (
              <div className="bottom-sticky-bar desktop-only no-print">
                <button className="sticky-pill-btn" onClick={() => setView('create')}>
                  <Plus size={16} />
                  <span>Create Assignment</span>
                </button>
              </div>
            )}

            {/* Mobile white Floating Action Button (FAB) */}
            {view === 'list' && (
              <button className="mobile-fab-btn mobile-only no-print" onClick={() => setView('create')}>
                <Plus size={24} color="#F97316" />
              </button>
            )}
          </div>
        )}
      </main>

      {/* 3. Mobile Floating Bottom Navigation Capsule */}
      <MobileNav activeTab={activeTab} onTabChange={(tab) => {
        setActiveTab(tab);
        if (tab === 'settings') {
          setView('settings');
        } else if (tab === 'toolkit') {
          setView('toolkit');
        } else {
          setView('list');
        }
      }} />

      {/* 4. Real-time WebSocket Background Queue Progress Loader */}
      {activeJob && (
        <JobProgressOverlay
          status={activeJob.status}
          progress={activeJob.progress}
          message={activeJob.message}
          error={activeJob.error}
          title={
            assignments.find((a) => a._id === activeJob.assignmentId)?.title ||
            "Custom Assignment Paper"
          }
          onClose={() => {
            if (activeJob.status === 'completed') {
              const generated = assignments.find((a) => a._id === activeJob.assignmentId);
              if (generated) {
                setSelectedAssignment(generated);
                setView('paper');
              } else {
                fetchAssignments().then(() => {
                  const fresh = useAssessmentStore.getState().assignments.find((a) => a._id === activeJob.assignmentId);
                  if (fresh) {
                    setSelectedAssignment(fresh);
                    setView('paper');
                  }
                });
              }
              showToast('success', 'Paper Ready!', 'Your question paper has been generated successfully.');
            }
            resetActiveJob();
          }}
        />
      )}

      {/* 5. Delete Confirmation Modal */}
      {deleteTargetId && (
        <div className="modal-backdrop" onClick={() => setDeleteTargetId(null)}>
          <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="delete-modal-icon">
              <AlertTriangle size={28} color="#EF4444" />
            </div>
            <h3 className="delete-modal-title">Delete Assignment?</h3>
            <p className="delete-modal-desc">
              Are you sure you want to permanently delete <strong>&ldquo;{deleteTargetTitle}&rdquo;</strong>? This action cannot be undone.
            </p>
            <div className="delete-modal-actions">
              <button className="modal-cancel-btn" onClick={() => setDeleteTargetId(null)}>Cancel</button>
              <button className="modal-delete-btn" onClick={confirmDelete}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Toast Notifications Container */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <span className="toast-icon">
              {toast.type === 'success' && <CheckCircle size={15} />}
              {toast.type === 'error' && <XCircle size={15} />}
              {toast.type === 'info' && <Info size={15} />}
              {toast.type === 'warning' && <AlertTriangle size={15} />}
            </span>
            <div className="toast-body">
              <p className="toast-title">{toast.title}</p>
              {toast.message && <p className="toast-message">{toast.message}</p>}
            </div>
            <button className="toast-close" onClick={() => dismissToast(toast.id)}>
              <X size={14} />
            </button>
            <div className="toast-progress-bar" />
          </div>
        ))}
      </div>
    </div>
  )}

  {/* CSS Modules-like specific Styles */}
  <style jsx>{`
        .listings-view {
          display: flex;
          flex-direction: column;
          gap: 24px;
          position: relative;
          min-height: 70vh;
        }

        .listings-header {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .title-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .green-pulse-dot {
          width: 10px;
          height: 10px;
          background: var(--color-success);
          border-radius: 50%;
          animation: pulseGreen 2s infinite;
        }

        @keyframes pulseGreen {
          0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
          70% { box-shadow: 0 0 0 6px rgba(34, 197, 94, 0); }
          100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
        }

        .listings-header h1 {
          font-size: 24px;
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: -0.5px;
        }

        .subtitle-text {
          font-size: 13px;
          color: var(--text-secondary);
          padding-left: 22px;
        }

        /* Combined Search row */
        .search-filter-bar {
          display: flex;
          align-items: center;
          justify-content: space-between; /* Pushes Filter By and Search pill to opposite ends */
          gap: 12px;
          width: 100%;
        }

        .filter-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #FFFFFF;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-full);
          padding: 10px 20px;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
          box-shadow: var(--shadow-sm);
          transition: var(--transition-smooth);
        }

        .filter-btn:hover, .filter-btn.active {
          background: var(--bg-app);
        }

        .search-input-wrapper {
          position: relative;
          width: 250px; /* Highly elegant, decreased compact width */
          display: flex;
          align-items: center;
        }

        .search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-secondary);
          pointer-events: none;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
        }

        .search-input {
          width: 100%;
          padding: 10px 16px 10px 38px;
          border-radius: var(--radius-full);
          border: 1px solid var(--border-color);
          background: #FFFFFF;
          font-size: 13px;
          font-weight: 500;
          box-shadow: var(--shadow-sm);
          transition: var(--transition-smooth);
        }

        .search-input:focus {
          border-color: var(--border-focus);
          outline: none;
          box-shadow: var(--shadow-md);
        }

        /* Empty State */
        .empty-state-card {
          background: #FFFFFF;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 56px 24px;
          text-align: center;
          box-shadow: var(--shadow-md);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          max-width: 580px;
          margin: 40px auto;
        }

        .empty-illustration {
          margin-bottom: 24px;
        }

        .empty-state-card h3 {
          font-size: 18px;
          font-weight: 800;
          color: var(--text-primary);
          margin-bottom: 8px;
        }

        .empty-state-card p {
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.6;
          margin-bottom: 24px;
          max-width: 440px;
        }

        .primary-pill-btn {
          background: #18181B;
          color: #FFFFFF;
          padding: 12px 24px;
          border-radius: var(--radius-full);
          font-size: 13px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: var(--shadow-sm);
          transition: var(--transition-smooth);
        }

        .primary-pill-btn:hover {
          background: #27272A;
          transform: translateY(-1px);
        }

        /* Populated grid */
        .cards-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr); /* Exactly 2 columns matching the Figma desktop layout */
          gap: 20px;
          margin-top: 10px;
        }

        .assignment-card {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          cursor: pointer;
        }

        .assignment-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-lg);
          border-color: #A1A1AA;
        }

        .card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
        }

        .card-title {
          font-size: 16px;
          font-weight: 800;
          color: var(--text-primary);
          line-height: 1.4;
          letter-spacing: -0.2px;
          flex: 1;
          text-decoration: underline; /* Underline styled clickable title matching the mockup */
        }

        .dots-menu-wrapper {
          position: relative;
        }

        .dots-btn {
          color: var(--text-tertiary);
          padding: 2px;
          border-radius: 4px;
          transition: var(--transition-smooth);
        }

        .dots-btn:hover {
          color: var(--text-primary);
          background: var(--bg-app);
        }

        /* Context Popup Menu */
        .floating-context-menu {
          position: absolute;
          top: 24px;
          right: 0;
          background: #FFFFFF;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-lg);
          padding: 4px;
          z-index: 50;
          min-width: 140px;
          display: flex;
          flex-direction: column;
          animation: scaleIn 0.15s ease-out;
        }

        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        .floating-context-menu button {
          text-align: left;
          padding: 10px 14px;
          font-size: 12px;
          font-weight: 600;
          color: var(--text-primary);
          border-radius: 4px;
          transition: var(--transition-smooth);
          width: 100%;
        }

        .floating-context-menu button:hover {
          background: var(--bg-app);
        }

        .floating-context-menu button.delete-btn {
          color: var(--color-error);
        }

        .floating-context-menu button.delete-btn:hover {
          background: #FEF2F2;
        }

        .card-body {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 12px;
          font-weight: 600;
        }

        .date-badge {
          color: var(--text-secondary);
        }

        .date-badge span {
          color: var(--text-primary);
          font-weight: 700;
        }

        /* Sticky Bottom CTA */
        .bottom-sticky-bar {
          position: fixed;
          bottom: 32px;
          left: 260px; /* Sidebar spacing */
          right: 0;
          display: flex;
          justify-content: center;
          pointer-events: none;
          z-index: 80;
        }

        .sticky-pill-btn {
          background: #18181B;
          color: #FFFFFF;
          padding: 12px 24px;
          border-radius: var(--radius-full);
          font-size: 14px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
          transition: var(--transition-smooth);
          pointer-events: auto;
        }

        .sticky-pill-btn:hover {
          background: #27272A;
          transform: translateY(-2px);
          box-shadow: 0 12px 28px -5px rgba(0, 0, 0, 0.4);
        }

        /* Mobile FAB Button */
        .mobile-fab-btn {
          position: fixed;
          bottom: 96px; /* Above Bottom nav capsule */
          right: 20px;
          background: #FFFFFF;
          border: 1px solid var(--border-color);
          width: 52px;
          height: 52px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: var(--shadow-lg);
          z-index: 90;
          transition: var(--transition-smooth);
        }

        .mobile-fab-btn:active {
          transform: scale(0.9);
        }

        .listings-loader {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin: 60px auto;
        }

        .loader-ring {
          border: 3px solid var(--border-color);
          border-top: 3px solid #F97316;
          border-radius: 50%;
          width: 28px;
          height: 28px;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .search-filter-bar {
            background: #FFFFFF;
            border: 1px solid var(--border-color);
            border-radius: var(--radius-xl);
            padding: 8px 12px;
            box-shadow: var(--shadow-sm);
            flex-direction: column-reverse;
            align-items: stretch;
            gap: 16px;
          }
          .filter-btn {
            border: none;
            box-shadow: none;
            padding: 4px 8px;
          }
          .search-input-wrapper {
            width: 100% !important; /* Dynamically expand search bar on mobile */
          }
          .search-input {
            border: none;
            box-shadow: none;
            background: var(--bg-app);
            padding: 8px 12px 8px 36px;
          }
          .search-icon {
            left: 12px;
          }
          .cards-grid {
            grid-template-columns: 1fr;
            margin-bottom: 120px;
          }
          .card-body {
            flex-direction: column;
            align-items: flex-start;
            gap: 6px;
          }
          .empty-state-card {
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            padding: 32px 16px !important;
            margin: 20px auto !important;
          }
          .desktop-header {
            display: none !important;
          }
          .listings-header {
            display: none !important;
          }
        }

        /* Horizontal Desktop Header Styling */
        .desktop-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #FFFFFF;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-xl);
          padding: 8px 16px;
          width: 100%;
          margin-bottom: 24px;
          box-shadow: var(--shadow-sm);
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .header-back-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #F4F4F5;
          color: var(--text-primary);
          transition: var(--transition-smooth);
          border: none;
          box-shadow: none;
        }

        .header-back-btn:hover:not(:disabled) {
          background: #E4E4E7;
        }

        .header-back-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 700;
          color: #71717A;
        }

        .breadcrumb-icon {
          color: #71717A;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .header-bell-btn {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #F4F4F5;
          color: var(--text-primary);
          border: none;
          box-shadow: none;
          transition: var(--transition-smooth);
        }

        .header-bell-btn:hover {
          background: #E4E4E7;
        }

        .header-bell-btn .orange-dot {
          position: absolute;
          top: 4px;
          right: 4px;
          width: 8px;
          height: 8px;
          background: #F97316;
          border-radius: 50%;
          border: 1.5px solid #FFFFFF;
        }

        .header-user-dropdown {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          padding: 4px 8px;
          background: transparent;
          border: none;
          box-shadow: none;
          transition: var(--transition-smooth);
        }

        .header-user-dropdown:hover {
          opacity: 0.8;
        }

        .user-avatar-circle {
          border-radius: 50%;
          overflow: hidden;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--border-color);
        }

        .avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .user-name {
          font-size: 14px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .dropdown-arrow {
          color: var(--text-secondary);
        }

        /* Delete Confirmation Modal Styling */
        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.40);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 16px;
        }

        .delete-modal {
          background: #FFFFFF;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 32px 24px;
          max-width: 420px;
          width: 100%;
          text-align: center;
          box-shadow: var(--shadow-xl), 0 20px 40px -15px rgba(0, 0, 0, 0.1);
          animation: modalReveal 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes modalReveal {
          from {
            transform: scale(0.92) translateY(10px);
            opacity: 0;
          }
          to {
            transform: scale(1) translateY(0);
            opacity: 1;
          }
        }

        .delete-modal-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: #FEF2F2;
          border: 1px solid #FEE2E2;
          margin-bottom: 20px;
        }

        .delete-modal-title {
          font-size: 20px;
          font-weight: 800;
          color: var(--text-primary);
          margin-bottom: 12px;
          letter-spacing: -0.3px;
        }

        .delete-modal-desc {
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.6;
          margin-bottom: 28px;
        }

        .delete-modal-desc strong {
          color: var(--text-primary);
          font-weight: 700;
        }

        .delete-modal-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
        }

        .modal-cancel-btn {
          flex: 1;
          padding: 12px 20px;
          border-radius: var(--radius-full);
          font-size: 13px;
          font-weight: 700;
          color: var(--text-secondary);
          background: #F4F4F5;
          border: 1px solid var(--border-color);
          transition: var(--transition-smooth);
          cursor: pointer;
        }

        .modal-cancel-btn:hover {
          background: #E4E4E7;
          color: var(--text-primary);
        }

        .modal-delete-btn {
          flex: 1;
          padding: 12px 20px;
          border-radius: var(--radius-full);
          font-size: 13px;
          font-weight: 700;
          color: #FFFFFF;
          background: var(--color-error);
          transition: var(--transition-smooth);
          cursor: pointer;
        }

        .modal-delete-btn:hover {
          background: #DC2626;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25);
        }

        .modal-delete-btn:active {
          transform: translateY(0);
        }

        /* Toast Notifications Container styled at the top-center */
        .toast-container {
          position: fixed;
          top: 24px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          gap: 10px;
          z-index: 9999;
          pointer-events: none;
          align-items: center;
          width: 90%;
          max-width: 400px;
        }

        .toast {
          position: relative;
          pointer-events: auto;
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(14px) saturate(200%);
          -webkit-backdrop-filter: blur(14px) saturate(200%);
          border: 1px solid rgba(228, 228, 231, 0.6);
          border-radius: 14px;
          padding: 14px 18px 16px 18px;
          display: flex;
          align-items: flex-start;
          gap: 12px;
          box-shadow: 
            0 10px 30px -10px rgba(0, 0, 0, 0.08), 
            0 1px 3px rgba(0, 0, 0, 0.02),
            inset 0 1px 0 rgba(255, 255, 255, 0.8);
          width: 100%;
          overflow: hidden;
          animation: toastSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          transition: transform 0.25s ease, opacity 0.25s ease;
        }

        @keyframes toastSlideIn {
          from {
            transform: translateY(-24px) scale(0.96);
            opacity: 0;
          }
          to {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }

        .toast-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 2px;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .toast-success .toast-icon {
          color: #10B981;
          background: rgba(16, 185, 129, 0.08);
          border: 1px solid rgba(16, 185, 129, 0.15);
          box-shadow: 0 0 10px rgba(16, 185, 129, 0.05);
        }

        .toast-error .toast-icon {
          color: #EF4444;
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.15);
          box-shadow: 0 0 10px rgba(239, 68, 68, 0.05);
        }

        .toast-info .toast-icon {
          color: #3B82F6;
          background: rgba(59, 130, 246, 0.08);
          border: 1px solid rgba(59, 130, 246, 0.15);
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.05);
        }

        .toast-warning .toast-icon {
          color: #F59E0B;
          background: rgba(245, 158, 11, 0.08);
          border: 1px solid rgba(245, 158, 11, 0.15);
          box-shadow: 0 0 10px rgba(245, 158, 11, 0.05);
        }

        /* Dynamic subtle borders/outlines per toast type */
        .toast-success {
          border-left: 3px solid #10B981;
        }

        .toast-error {
          border-left: 3px solid #EF4444;
        }

        .toast-info {
          border-left: 3px solid #3B82F6;
        }

        .toast-warning {
          border-left: 3px solid #F59E0B;
        }

        .toast-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .toast-title {
          font-size: 13.5px;
          font-weight: 700;
          color: #18181B;
          letter-spacing: -0.1px;
          line-height: 1.4;
        }

        .toast-message {
          font-size: 11.5px;
          color: #71717A;
          line-height: 1.45;
        }

        .toast-close {
          color: #A1A1AA;
          padding: 4px;
          border-radius: 6px;
          transition: all 0.2s ease;
          margin-top: -2px;
          margin-right: -4px;
          background: transparent;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .toast-close:hover {
          color: #18181B;
          background: rgba(244, 244, 245, 0.8);
        }

        /* Toast progress countdown bar */
        .toast-progress-bar {
          position: absolute;
          bottom: 0;
          left: 0;
          height: 3px;
          width: 100%;
          transform-origin: left;
          animation: toastProgressBarShrink 3.5s linear forwards;
        }

        .toast-success .toast-progress-bar {
          background: linear-gradient(to right, #34D399, #10B981);
        }

        .toast-error .toast-progress-bar {
          background: linear-gradient(to right, #F87171, #EF4444);
        }

        .toast-info .toast-progress-bar {
          background: linear-gradient(to right, #60A5FA, #3B82F6);
        }

        .toast-warning .toast-progress-bar {
          background: linear-gradient(to right, #FBBF24, #F59E0B);
        }

        @keyframes toastProgressBarShrink {
          from {
            transform: scaleX(1);
          }
          to {
            transform: scaleX(0);
          }
        }

        /* Settings Configuration Styling */
        .settings-panel {
          display: flex;
          flex-direction: column;
          gap: 28px;
          padding-bottom: 60px;
        }

        .settings-header h1 {
          font-size: 24px;
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: -0.5px;
          margin-bottom: 4px;
        }

        .settings-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }

        @media (max-width: 768px) {
          .settings-grid {
            grid-template-columns: 1fr;
          }
        }

        .settings-card {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .settings-card-header {
          display: flex;
          align-items: center;
          gap: 10px;
          border-bottom: 1px dashed var(--border-color);
          padding-bottom: 12px;
        }

        .settings-card-header h3 {
          font-size: 15px;
          font-weight: 800;
          color: var(--text-primary);
        }

        .settings-card-body {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .settings-input-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .settings-input-group label {
          font-size: 12px;
          font-weight: 700;
          color: var(--text-secondary);
        }

        .settings-input-group input {
          padding: 10px 14px;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          background: #FFFFFF;
          font-size: 13px;
          font-weight: 500;
          transition: var(--transition-smooth);
        }

        .settings-input-group input:focus {
          border-color: var(--border-focus);
          outline: none;
        }

        .settings-actions {
          display: flex;
          justify-content: flex-start;
          margin-top: 10px;
        }

        /* ─── AUTHENTICATION STYLES ─── */
        .auth-fullscreen-container {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          width: 100vw;
          background: radial-gradient(circle at 10% 20%, #F4F4F6 0%, #E2E8F0 100%);
          padding: 24px;
          position: fixed;
          top: 0;
          left: 0;
          z-index: 1500;
        }

        .auth-card {
          background: #FFFFFF;
          width: 100%;
          max-width: 400px;
          padding: 40px 32px;
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-xl), 0 20px 40px -15px rgba(0,0,0,0.1);
          border: 1px solid var(--border-color);
        }

        .auth-logo-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-bottom: 24px;
        }

        .auth-logo-dot {
          width: 12px;
          height: 12px;
          background: var(--orange-primary);
          border-radius: 50%;
          box-shadow: var(--shadow-glow);
        }

        .auth-logo-row h2 {
          font-size: 22px;
          font-weight: 800;
          letter-spacing: -0.5px;
          color: var(--text-primary);
        }

        .auth-tabs {
          display: flex;
          background: #F4F4F5;
          padding: 4px;
          border-radius: var(--radius-full);
          margin-bottom: 24px;
          border: 1px solid var(--border-color);
        }

        .auth-tab-btn {
          flex: 1;
          padding: 8px 16px;
          font-size: 13px;
          font-weight: 700;
          border-radius: var(--radius-full);
          color: var(--text-secondary);
          transition: var(--transition-smooth);
          text-align: center;
        }

        .auth-tab-btn.active {
          background: #FFFFFF;
          color: var(--text-primary);
          box-shadow: var(--shadow-sm);
        }

        .auth-subtitle {
          font-size: 13px;
          color: var(--text-secondary);
          text-align: center;
          margin-bottom: 28px;
          line-height: 1.5;
        }

        .auth-error-banner {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #FEF2F2;
          border: 1px solid #FEE2E2;
          color: var(--color-error);
          padding: 12px 16px;
          border-radius: var(--radius-md);
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 24px;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .auth-input-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .auth-input-group label {
          font-size: 12px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .auth-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .auth-input-icon {
          position: absolute;
          left: 14px;
          color: var(--text-secondary);
          pointer-events: none;
          display: flex;
        }

        .auth-input-wrapper input {
          width: 100%;
          padding: 12px 16px 12px 42px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-color);
          background: #FFFFFF;
          font-size: 13px;
          font-weight: 500;
          transition: var(--transition-smooth);
        }

        .auth-input-wrapper input:focus {
          border-color: var(--border-focus);
          outline: none;
          box-shadow: 0 0 0 2px rgba(24, 24, 27, 0.05);
        }

        .auth-password-toggle {
          position: absolute;
          right: 14px;
          color: var(--text-secondary);
          cursor: pointer;
          display: flex;
          padding: 2px;
          border-radius: 4px;
        }

        .auth-password-toggle:hover {
          color: var(--text-primary);
          background: #F4F4F5;
        }

        .auth-submit-btn {
          background: #18181B;
          color: #FFFFFF;
          padding: 12px 20px;
          border-radius: var(--radius-md);
          font-size: 13px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: var(--transition-smooth);
          margin-top: 10px;
          cursor: pointer;
        }

        .auth-submit-btn:hover {
          background: #27272A;
          transform: translateY(-1px);
        }

        .auth-submit-btn:disabled {
          background: #A1A1AA;
          cursor: not-allowed;
          transform: none;
        }

        .auth-demo-section {
          margin-top: 32px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .demo-divider {
          display: flex;
          align-items: center;
          text-align: center;
          font-size: 10px;
          font-weight: 800;
          color: var(--text-tertiary);
          letter-spacing: 1px;
        }

        .demo-divider::before, .demo-divider::after {
          content: '';
          flex: 1;
          border-bottom: 1px dashed var(--border-color);
        }

        .demo-divider:not(:empty)::before {
          margin-right: .5em;
        }

        .demo-divider:not(:empty)::after {
          margin-left: .5em;
        }

        .auth-demo-btn {
          background: #FFF7ED;
          border: 1px dashed #FDBA74;
          color: #C2410C;
          padding: 12px 20px;
          border-radius: var(--radius-md);
          font-size: 12px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: var(--transition-smooth);
          cursor: pointer;
        }

        .auth-demo-btn:hover {
          background: #FFEDD5;
          border-style: solid;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(249, 115, 22, 0.08);
        }

        .animate-reveal {
          animation: authReveal 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes authReveal {
          from {
            transform: translateY(15px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}
