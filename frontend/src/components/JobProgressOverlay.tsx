'use client';

import React from 'react';
import { Sparkles, AlertCircle, X } from 'lucide-react';

interface JobProgressOverlayProps {
  status: 'pending' | 'generating' | 'completed' | 'failed';
  progress: number;
  message: string;
  error?: string;
  onClose: () => void;
  title: string;
}

export default function JobProgressOverlay({ status, progress, message, error, onClose, title }: JobProgressOverlayProps) {
  return (
    <div className="progress-overlay-backdrop no-print">
      <div className="progress-dialog-card">
        {/* Header */}
        <div className="dialog-header">
          <div className="dialog-title-row">
            <Sparkles className="sparkle-icon animate-pulse" size={20} color="#F97316" />
            <h3>AI Question Generation</h3>
          </div>
          {status === 'failed' && (
            <button className="close-dialog-btn" onClick={onClose}>
              <X size={18} />
            </button>
          )}
        </div>

        {/* Body Content */}
        <div className="dialog-body">
          <p className="generating-target-title">
            Topic: <span>{title}</span>
          </p>

          {/* Loader/Progress circle */}
          <div className="loader-visual-container">
            {status === 'failed' ? (
              <div className="status-icon-circle error">
                <AlertCircle size={40} />
              </div>
            ) : (
              <div className={`spinner-progress-wrapper ${status}`}>
                <svg className="progress-ring-svg" width="96" height="96">
                  {/* Outer track circle */}
                  <circle
                    className="progress-ring-track"
                    stroke="#F1F5F9"
                    strokeWidth="6"
                    fill="transparent"
                    r="40"
                    cx="48"
                    cy="48"
                  />
                  {/* Filled progress circle */}
                  <circle
                    className="progress-ring-fill"
                    stroke={status === 'completed' ? 'url(#successGradient)' : 'url(#progressGradient)'}
                    strokeWidth="6"
                    strokeDasharray={251.2}
                    strokeDashoffset={251.2 - (progress / 100) * 251.2}
                    strokeLinecap="round"
                    fill="transparent"
                    r="40"
                    cx="48"
                    cy="48"
                    transform="rotate(-90 48 48)"
                  />
                  <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#FB923C" />
                      <stop offset="100%" stopColor="#EA580C" />
                    </linearGradient>
                    <linearGradient id="successGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#4ADE80" />
                      <stop offset="100%" stopColor="#22C55E" />
                    </linearGradient>
                  </defs>
                </svg>
                {status === 'completed' ? (
                  <div className="success-checkmark-wrapper animate-scale-up">
                    <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                      <circle className="checkmark__circle" cx="26" cy="26" r="25" fill="none" />
                      <path className="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
                    </svg>
                  </div>
                ) : (
                  <span className="percentage-text">{progress}%</span>
                )}
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="bar-track">
            <div 
              className={`bar-fill ${status === 'failed' ? 'failed' : ''}`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          {/* Action Log Message */}
          <div className="log-message-card">
            <span className="pulse-dot-indicator"></span>
            <p className="log-text">{message}</p>
          </div>

          {status === 'failed' && error && (
            <div className="error-log-details">
              <p className="error-title">Failure Diagnostic:</p>
              <p className="error-desc">{error}</p>
            </div>
          )}
        </div>

        {/* Footer actions for failure or completion */}
        {status === 'failed' && (
          <div className="dialog-footer">
            <button className="dismiss-btn-pill" onClick={onClose}>
              Close & Modify Parameters
            </button>
          </div>
        )}

        {status === 'completed' && (
          <div className="dialog-footer">
            <button className="success-btn-pill" onClick={onClose}>
              View Generated Paper
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .progress-overlay-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(24, 24, 27, 0.4);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 16px;
        }

        .progress-dialog-card {
          background: #FFFFFF;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 32px;
          width: 100%;
          max-width: 440px;
          box-shadow: var(--shadow-xl);
          display: flex;
          flex-direction: column;
          gap: 20px;
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes slideUp {
          from { transform: translateY(12px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .dialog-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .dialog-title-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .dialog-header h3 {
          font-size: 16px;
          font-weight: 800;
          color: var(--text-primary);
        }

        .close-dialog-btn {
          color: var(--text-secondary);
          transition: var(--transition-smooth);
        }

        .close-dialog-btn:hover {
          color: var(--text-primary);
        }

        .dialog-body {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          text-align: center;
          width: 100%;
        }

        .generating-target-title {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .generating-target-title span {
          font-weight: 700;
          color: var(--text-primary);
        }

        .loader-visual-container {
          height: 100px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .status-icon-circle.error {
          color: var(--color-error);
          background: #FEF2F2;
          width: 72px;
          height: 72px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .spinner-progress-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .progress-ring-svg {
          filter: drop-shadow(0 0 8px rgba(249, 115, 22, 0.15));
          transition: filter 0.3s ease;
        }

        .spinner-progress-wrapper.completed .progress-ring-svg {
          filter: drop-shadow(0 0 12px rgba(34, 197, 94, 0.3));
        }

        .progress-ring-fill {
          transition: stroke-dashoffset 0.35s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .percentage-text {
          position: absolute;
          font-size: 16px;
          font-weight: 800;
          color: var(--text-primary);
          animation: pulseScale 2s infinite ease-in-out;
          font-variant-numeric: tabular-nums;
        }

        @keyframes pulseScale {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.06); }
        }

        /* Pure SVG Checkmark Animation styles */
        .success-checkmark-wrapper {
          position: absolute;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .checkmark {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: block;
          stroke-width: 3.5;
          stroke: #22C55E;
          stroke-miterlimit: 10;
          animation: fill .4s ease-in-out .4s forwards, scale .3s ease-in-out .9s forwards;
        }

        .checkmark__circle {
          stroke-dasharray: 166;
          stroke-dashoffset: 166;
          stroke-width: 3.5;
          stroke-miterlimit: 10;
          stroke: #22C55E;
          fill: none;
          animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
        }

        .checkmark__check {
          transform-origin: 50% 50%;
          stroke-dasharray: 48;
          stroke-dashoffset: 48;
          animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards;
        }

        @keyframes stroke {
          100% {
            stroke-dashoffset: 0;
          }
        }

        @keyframes fill {
          100% {
            box-shadow: inset 0px 0px 0px 30px rgba(34, 197, 94, 0.08);
          }
        }

        @keyframes scale {
          0%, 100% {
            transform: none;
          }
          50% {
            transform: scale3d(1.15, 1.15, 1);
          }
        }

        .bar-track {
          width: 100%;
          height: 6px;
          background: var(--bg-app);
          border-radius: var(--radius-full);
          overflow: hidden;
        }

        .bar-fill {
          height: 100%;
          background: #F97316;
          border-radius: var(--radius-full);
          transition: width 0.3s ease;
        }

        .bar-fill.failed {
          background: var(--color-error);
        }

        .log-message-card {
          background: var(--bg-app);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 12px 16px;
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .pulse-dot-indicator {
          width: 8px;
          height: 8px;
          background: #F97316;
          border-radius: 50%;
          flex-shrink: 0;
          animation: blink 1.2s infinite;
        }

        @keyframes blink {
          50% { opacity: 0.3; }
        }

        .log-text {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-primary);
          text-align: left;
          line-height: 1.4;
        }

        .error-log-details {
          width: 100%;
          background: #FEF2F2;
          border: 1px solid #FCA5A5;
          border-radius: var(--radius-md);
          padding: 12px;
          font-size: 11px;
          text-align: left;
        }

        .error-title {
          font-weight: 700;
          color: #DC2626;
          margin-bottom: 2px;
        }

        .error-desc {
          color: #B91C1C;
          word-break: break-all;
        }

        .dialog-footer {
          width: 100%;
        }

        .dismiss-btn-pill {
          width: 100%;
          background: #18181B;
          color: #FFFFFF;
          font-size: 13px;
          font-weight: 600;
          padding: 12px 0;
          border-radius: var(--radius-full);
          transition: var(--transition-smooth);
        }

        .dismiss-btn-pill:hover {
          background: #27272A;
        }

        .success-btn-pill {
          width: 100%;
          background: var(--color-success); /* Beautiful green color */
          color: #FFFFFF;
          font-size: 13px;
          font-weight: 700;
          padding: 12px 0;
          border-radius: var(--radius-full);
          transition: var(--transition-smooth);
          box-shadow: 0 4px 12px rgba(34, 197, 94, 0.2);
          border: none;
        }

        .success-btn-pill:hover {
          background: #16A34A;
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(34, 197, 94, 0.3);
        }
      `}</style>
    </div>
  );
}
