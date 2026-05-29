'use client';

import React, { useState, useEffect } from 'react';
import { Download, RefreshCw, ChevronLeft } from 'lucide-react';
import { IAssignment } from '../store/useAssessmentStore';

interface QuestionPaperViewProps {
  assignment: IAssignment;
  onBack: () => void;
  onRegenerate: () => void;
  settingsSchoolName?: string;
}

const MermaidRenderer = ({ chart }: { chart: string }) => {
  const [svgHtml, setSvgHtml] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchSvg() {
      try {
        const response = await fetch('https://kroki.io/mermaid/svg', {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain',
          },
          body: chart.trim()
        });
        if (response.ok) {
          const svg = await response.text();
          setSvgHtml(svg);
        } else {
          setSvgHtml(`<p style="color:#DC2626; font-weight:600;">Failed to render diagram.</p>`);
        }
      } catch (err) {
        setSvgHtml(`<p style="color:#DC2626; font-weight:600;">Error contacting diagram rendering server.</p>`);
      } finally {
        setLoading(false);
      }
    }
    fetchSvg();
  }, [chart]);

  if (loading) {
    return (
      <div className="diagram-loader" style={{ padding: '16px', textAlign: 'center', fontSize: '13px', fontStyle: 'italic', color: '#71717A' }}>
        Rendering premium visual diagram...
      </div>
    );
  }

  return (
    <div 
      className="rendered-svg-diagram" 
      dangerouslySetInnerHTML={{ __html: svgHtml }} 
    />
  );
};

const EYE_SVG = `
<svg width="100%" height="260" viewBox="0 0 450 260" class="interactive-bio-svg">
  <defs>
    <linearGradient id="lensGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#E0F2FE" />
      <stop offset="100%" stop-color="#7DD3FC" />
    </linearGradient>
    <marker id="bioArrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 6 5 L 0 8.5 z" fill="#334155"/>
    </marker>
  </defs>
  <style>
    .interactive-group { cursor: pointer; }
    .interactive-group:hover .anatomical-part {
      fill-opacity: 0.95;
      stroke: #2563EB !important;
      stroke-width: 3px !important;
      filter: drop-shadow(0 0 8px rgba(37, 99, 235, 0.5));
    }
    .interactive-group:hover .leader-line {
      stroke: #2563EB !important;
      stroke-width: 2px !important;
    }
    .interactive-group:hover .label-text {
      fill: #2563EB !important;
      font-weight: 800 !important;
    }
    .interactive-group:hover .anchor-dot {
      fill: #2563EB !important;
    }
    .anatomical-part, .leader-line, .label-text, .anchor-dot {
      transition: all 0.25s ease;
    }
  </style>
  <rect width="100%" height="100%" fill="#F8FAFC" rx="16" stroke="#E2E8F0" stroke-width="1.5"/>
  
  <!-- Non-interactive Sclera sphere -->
  <path d="M 100 55 A 70 70 0 1 1 100 195 A 70 70 0 0 1 100 55 Z" fill="#FFFFFF" stroke="#64748B" stroke-width="2"/>
  
  <!-- Interactive Groups -->
  <g class="interactive-group">
    <!-- Cornea -->
    <path class="anatomical-part" d="M 100 55 A 75 75 0 0 1 100 195" fill="rgba(147, 197, 253, 0.15)" stroke="#3B82F6" stroke-width="2.5"/>
    <circle class="anchor-dot" cx="242" cy="42" r="3" fill="#475569"/>
    <line class="leader-line" x1="242" y1="42" x2="102" y2="75" stroke="#475569" stroke-width="1.2" marker-end="url(#bioArrow)"/>
    <text class="label-text" x="252" y="46" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#0F172A" font-weight="bold" text-anchor="start">Cornea (Protective Shield)</text>
  </g>
  
  <g class="interactive-group">
    <!-- Iris -->
    <path class="anatomical-part" d="M 100 55 L 108 90 M 100 195 L 108 160" stroke="#1E3A8A" stroke-width="5" stroke-linecap="round"/>
    <circle class="anchor-dot" cx="242" cy="87" r="3" fill="#475569"/>
    <line class="leader-line" x1="242" y1="87" x2="104" y2="70" stroke="#475569" stroke-width="1.2" marker-end="url(#bioArrow)"/>
    <text class="label-text" x="252" y="91" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#0F172A" font-weight="bold" text-anchor="start">Iris (Controls Pupil size)</text>
  </g>
  
  <g class="interactive-group">
    <!-- Lens -->
    <ellipse class="anatomical-part" cx="115" cy="125" rx="12" ry="28" fill="url(#lensGrad)" stroke="#0284C7" stroke-width="2"/>
    <line x1="115" y1="97" x2="105" y2="90" stroke="#64748B" stroke-width="1.5" />
    <line x1="115" y1="153" x2="105" y2="160" stroke="#64748B" stroke-width="1.5" />
    <circle class="anchor-dot" cx="242" cy="132" r="3" fill="#475569"/>
    <line class="leader-line" x1="242" y1="132" x2="118" y2="125" stroke="#475569" stroke-width="1.2" marker-end="url(#bioArrow)"/>
    <text class="label-text" x="252" y="136" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#0F172A" font-weight="bold" text-anchor="start">Crystalline Lens (Focusing)</text>
  </g>
  
  <g class="interactive-group">
    <!-- Retina -->
    <path class="anatomical-part" d="M 155 62 A 60 60 0 0 1 155 188" fill="none" stroke="#EF4444" stroke-width="3.5" stroke-linecap="round"/>
    <circle class="anchor-dot" cx="242" cy="177" r="3" fill="#475569"/>
    <line class="leader-line" x1="242" y1="177" x2="157" y2="140" stroke="#475569" stroke-width="1.2" marker-end="url(#bioArrow)"/>
    <text class="label-text" x="252" y="181" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#0F172A" font-weight="bold" text-anchor="start">Retina (Light Screen)</text>
  </g>
  
  <g class="interactive-group">
    <!-- Optic Nerve -->
    <path class="anatomical-part" d="M 165 115 L 205 100 M 165 135 L 205 150" stroke="#475569" stroke-width="2.5" fill="none"/>
    <circle class="anchor-dot" cx="242" cy="222" r="3" fill="#475569"/>
    <line class="leader-line" x1="242" y1="222" x2="185" y2="130" stroke="#475569" stroke-width="1.2" marker-end="url(#bioArrow)"/>
    <text class="label-text" x="252" y="226" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#0F172A" font-weight="bold" text-anchor="start">Optic Nerve (Signals to Brain)</text>
  </g>
</svg>`;

const PLANT_CELL_SVG = `
<svg width="100%" height="260" viewBox="0 0 450 260" class="interactive-bio-svg">
  <defs>
    <linearGradient id="vacGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ECFDF5" />
      <stop offset="100%" stop-color="#A7F3D0" />
    </linearGradient>
    <linearGradient id="nucGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#EFF6FF" />
      <stop offset="100%" stop-color="#BFDBFE" />
    </linearGradient>
    <marker id="bioArrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 6 5 L 0 8.5 z" fill="#1E293B"/>
    </marker>
  </defs>
  <style>
    .interactive-group { cursor: pointer; }
    .interactive-group:hover .anatomical-part {
      fill-opacity: 0.95;
      stroke: #16A34A !important;
      stroke-width: 3.5px !important;
      filter: drop-shadow(0 0 8px rgba(22, 163, 74, 0.5));
    }
    .interactive-group:hover .leader-line {
      stroke: #16A34A !important;
      stroke-width: 2px !important;
    }
    .interactive-group:hover .label-text {
      fill: #16A34A !important;
      font-weight: 800 !important;
    }
    .interactive-group:hover .anchor-dot {
      fill: #16A34A !important;
    }
    .anatomical-part, .leader-line, .label-text, .anchor-dot {
      transition: all 0.25s ease;
    }
  </style>
  <rect width="100%" height="100%" fill="#F8FAFC" rx="16" stroke="#E2E8F0" stroke-width="1.5"/>
  <g class="interactive-group">
    <rect class="anatomical-part" x="25" y="25" width="165" height="210" rx="12" fill="#F0FDF4" stroke="#15803D" stroke-width="4.5"/>
    <rect x="31" y="31" width="153" height="198" rx="10" fill="none" stroke="#86EFAC" stroke-width="1.5"/>
    <circle class="anchor-dot" cx="242" cy="42" r="3" fill="#475569"/>
    <line class="leader-line" x1="242" y1="42" x2="25" y2="40" stroke="#475569" stroke-width="1.2" marker-end="url(#bioArrow)"/>
    <text class="label-text" x="252" y="46" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#0F172A" font-weight="bold" text-anchor="start">Rigid Cell Wall (Support)</text>
  </g>
  <g class="interactive-group">
    <circle class="anatomical-part" cx="70" cy="80" r="22" fill="url(#nucGrad)" stroke="#1D4ED8" stroke-width="2"/>
    <circle cx="70" cy="80" r="7" fill="#1E40AF"/>
    <circle class="anchor-dot" cx="242" cy="87" r="3" fill="#475569"/>
    <line class="leader-line" x1="242" y1="87" x2="72" y2="80" stroke="#475569" stroke-width="1.2" marker-end="url(#bioArrow)"/>
    <text class="label-text" x="252" y="91" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#0F172A" font-weight="bold" text-anchor="start">Nucleus (Genetic Command)</text>
  </g>
  <g class="interactive-group">
    <rect class="anatomical-part" x="105" y="65" width="70" height="115" rx="12" fill="url(#vacGrad)" stroke="#0D9488" stroke-width="2.5"/>
    <circle class="anchor-dot" cx="242" cy="132" r="3" fill="#475569"/>
    <line class="leader-line" x1="242" y1="132" x2="125" y2="120" stroke="#475569" stroke-width="1.2" marker-end="url(#bioArrow)"/>
    <text class="label-text" x="252" y="136" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#0F172A" font-weight="bold" text-anchor="start">Large Vacuole (Turgidity)</text>
  </g>
  <g class="interactive-group">
    <ellipse class="anatomical-part" cx="65" cy="180" rx="18" ry="9" fill="#FEF2F2" stroke="#DC2626" stroke-width="1.5" transform="rotate(-20 65 180)"/>
    <path d="M 52 182 Q 57 175 62 182 Q 67 187 72 180 Q 77 175 80 181" stroke="#EF4444" stroke-width="1.2" fill="none"/>
    <circle class="anchor-dot" cx="242" cy="177" r="3" fill="#475569"/>
    <line class="leader-line" x1="242" y1="177" x2="68" y2="180" stroke="#475569" stroke-width="1.2" marker-end="url(#bioArrow)"/>
    <text class="label-text" x="252" y="181" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#0F172A" font-weight="bold" text-anchor="start">Mitochondria (Powerhouse)</text>
  </g>
  <g class="interactive-group">
    <ellipse class="anatomical-part" cx="130" cy="45" rx="15" ry="8" fill="#F0FDF4" stroke="#16A34A" stroke-width="1.5"/>
    <circle cx="122" cy="45" r="2" fill="#15803D"/>
    <circle cx="130" cy="45" r="2" fill="#15803D"/>
    <circle cx="138" cy="45" r="2" fill="#15803D"/>
    <circle class="anchor-dot" cx="242" cy="222" r="3" fill="#475569"/>
    <line class="leader-line" x1="242" y1="222" x2="132" y2="48" stroke="#475569" stroke-width="1.2" marker-end="url(#bioArrow)"/>
    <text class="label-text" x="252" y="226" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#0F172A" font-weight="bold" text-anchor="start">Chloroplast (Photosynthesis)</text>
  </g>
</svg>`;

const ANIMAL_CELL_SVG = `
<svg width="100%" height="260" viewBox="0 0 450 260" class="interactive-bio-svg">
  <defs>
    <linearGradient id="nucGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#EFF6FF" />
      <stop offset="100%" stop-color="#BFDBFE" />
    </linearGradient>
    <marker id="bioArrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 6 5 L 0 8.5 z" fill="#1E293B"/>
    </marker>
  </defs>
  <style>
    .interactive-group { cursor: pointer; }
    .interactive-group:hover .anatomical-part {
      fill-opacity: 0.95;
      stroke: #8B5CF6 !important;
      stroke-width: 3.5px !important;
      filter: drop-shadow(0 0 8px rgba(139, 92, 246, 0.5));
    }
    .interactive-group:hover .leader-line {
      stroke: #8B5CF6 !important;
      stroke-width: 2px !important;
    }
    .interactive-group:hover .label-text {
      fill: #8B5CF6 !important;
      font-weight: 800 !important;
    }
    .interactive-group:hover .anchor-dot {
      fill: #8B5CF6 !important;
    }
    .anatomical-part, .leader-line, .label-text, .anchor-dot {
      transition: all 0.25s ease;
    }
  </style>
  <rect width="100%" height="100%" fill="#F8FAFC" rx="16" stroke="#E2E8F0" stroke-width="1.5"/>
  <g class="interactive-group">
    <!-- Cell Membrane -->
    <path class="anatomical-part" d="M 110 35 C 160 30, 190 60, 185 125 C 180 185, 160 220, 105 215 C 55 210, 35 170, 40 120 C 45 65, 55 40, 110 35 Z" fill="#FBF7FF" stroke="#7C3AED" stroke-width="3"/>
    <circle class="anchor-dot" cx="242" cy="42" r="3" fill="#475569"/>
    <line class="leader-line" x1="242" y1="42" x2="145" y2="42" stroke="#475569" stroke-width="1.2" marker-end="url(#bioArrow)"/>
    <text class="label-text" x="252" y="46" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#0F172A" font-weight="bold" text-anchor="start">Cell Membrane (Flexible)</text>
  </g>
  <g class="interactive-group">
    <!-- Nucleus -->
    <circle class="anatomical-part" cx="105" cy="115" r="24" fill="url(#nucGrad)" stroke="#3B82F6" stroke-width="2"/>
    <circle cx="105" cy="115" r="9" fill="#1D4ED8"/>
    <circle class="anchor-dot" cx="242" cy="95" r="3" fill="#475569"/>
    <line class="leader-line" x1="242" y1="95" x2="110" y2="105" stroke="#475569" stroke-width="1.2" marker-end="url(#bioArrow)"/>
    <text class="label-text" x="252" y="98" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#0F172A" font-weight="bold" text-anchor="start">Nucleus (Brain of Cell)</text>
  </g>
  <g class="interactive-group">
    <!-- Mitochondria -->
    <ellipse class="anatomical-part" cx="145" cy="160" rx="16" ry="8" fill="#FEF2F2" stroke="#EF4444" stroke-width="1.5" transform="rotate(-30 145 160)"/>
    <path d="M 133 162 Q 138 158 143 163 Q 148 167 153 161" stroke="#F87171" stroke-width="1" fill="none"/>
    <circle class="anchor-dot" cx="242" cy="145" r="3" fill="#475569"/>
    <line class="leader-line" x1="242" y1="145" x2="147" y2="158" stroke="#475569" stroke-width="1.2" marker-end="url(#bioArrow)"/>
    <text class="label-text" x="252" y="148" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#0F172A" font-weight="bold" text-anchor="start">Mitochondria (Respiration)</text>
  </g>
  <g class="interactive-group">
    <!-- Lysosome -->
    <circle class="anatomical-part" cx="70" cy="155" r="8" fill="#FEF3C7" stroke="#D97706" stroke-width="1.5"/>
    <circle class="anchor-dot" cx="242" cy="195" r="3" fill="#475569"/>
    <line class="leader-line" x1="242" y1="195" x2="76" y2="155" stroke="#475569" stroke-width="1.2" marker-end="url(#bioArrow)"/>
    <text class="label-text" x="252" y="198" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#0F172A" font-weight="bold" text-anchor="start">Lysosome (Cell Digestion)</text>
  </g>
</svg>`;

const HEART_SVG = `
<svg width="100%" height="260" viewBox="0 0 450 260" class="interactive-bio-svg">
  <defs>
    <marker id="bioArrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 6 5 L 0 8.5 z" fill="#1E293B"/>
    </marker>
  </defs>
  <style>
    .interactive-group { cursor: pointer; }
    .interactive-group:hover .anatomical-part {
      fill-opacity: 0.95;
      stroke: #EF4444 !important;
      stroke-width: 4px !important;
      filter: drop-shadow(0 0 8px rgba(239, 68, 68, 0.5));
    }
    .interactive-group:hover .leader-line {
      stroke: #EF4444 !important;
      stroke-width: 2px !important;
    }
    .interactive-group:hover .label-text {
      fill: #EF4444 !important;
      font-weight: 800 !important;
    }
    .interactive-group:hover .anchor-dot {
      fill: #EF4444 !important;
    }
    .anatomical-part, .leader-line, .label-text, .anchor-dot {
      transition: all 0.25s ease;
    }
  </style>
  <rect width="100%" height="100%" fill="#F8FAFC" rx="16" stroke="#E2E8F0" stroke-width="1.5"/>
  <g class="interactive-group">
    <!-- Aorta -->
    <path class="anatomical-part" d="M 128 35 L 128 70 C 128 70, 128 85, 112 95" stroke="#EF4444" stroke-width="12" fill="none" stroke-linecap="round"/>
    <path d="M 128 55 Q 140 55 140 35" stroke="#EF4444" stroke-width="8" fill="none" stroke-linecap="round"/>
    <circle class="anchor-dot" cx="242" cy="42" r="3" fill="#475569"/>
    <line class="leader-line" x1="242" y1="42" x2="132" y2="45" stroke="#475569" stroke-width="1.2" marker-end="url(#bioArrow)"/>
    <text class="label-text" x="252" y="46" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#0F172A" font-weight="bold" text-anchor="start">Aorta (Oxygenated Output)</text>
  </g>
  <g class="interactive-group">
    <!-- Pulmonary Tubes -->
    <path class="anatomical-part" d="M 105 45 L 105 75 M 105 52 L 138 52" stroke="#3B82F6" stroke-width="9" fill="none" stroke-linecap="round"/>
    <circle class="anchor-dot" cx="242" cy="95" r="3" fill="#475569"/>
    <line class="leader-line" x1="242" y1="95" x2="90" y2="60" stroke="#475569" stroke-width="1.2" marker-end="url(#bioArrow)"/>
    <text class="label-text" x="252" y="98" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#0F172A" font-weight="bold" text-anchor="start">Pulmonary Artery (Deoxygenated)</text>
  </g>
  <path d="M 100 70 C 100 70, 55 90, 55 130 C 55 180, 105 220, 105 220 C 105 220, 155 180, 155 130 C 155 90, 110 70, 110 70 Z" fill="#FCA5A5" stroke="#991B1B" stroke-width="2.5"/>
  <path d="M 105 75 L 105 215" stroke="#991B1B" stroke-width="3" stroke-dasharray="4 4"/>
  <g class="interactive-group">
    <!-- Left Ventricle -->
    <path class="anatomical-part" d="M 105 135 C 115 135, 148 150, 142 195 C 138 200, 105 215, 105 215" fill="none" stroke="#DC2626" stroke-width="1" />
    <circle class="anchor-dot" cx="242" cy="145" r="3" fill="#475569"/>
    <line class="leader-line" x1="242" y1="145" x2="130" y2="160" stroke="#475569" stroke-width="1.2" marker-end="url(#bioArrow)"/>
    <text class="label-text" x="252" y="148" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#0F172A" font-weight="bold" text-anchor="start">Left Ventricle (Pumps to Body)</text>
  </g>
  <g class="interactive-group">
    <!-- Right Ventricle -->
    <path class="anatomical-part" d="M 105 135 C 95 135, 62 150, 68 195 C 72 200, 105 215, 105 215" fill="none" stroke="#2563EB" stroke-width="1" />
    <circle class="anchor-dot" cx="242" cy="195" r="3" fill="#475569"/>
    <line class="leader-line" x1="242" y1="195" x2="80" y2="165" stroke="#475569" stroke-width="1.2" marker-end="url(#bioArrow)"/>
    <text class="label-text" x="252" y="198" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#0F172A" font-weight="bold" text-anchor="start">Right Ventricle (Pumps to Lungs)</text>
  </g>
</svg>`;

const NEURON_SVG = `
<svg width="100%" height="260" viewBox="0 0 450 260" class="interactive-bio-svg">
  <defs>
    <marker id="bioArrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 6 5 L 0 8.5 z" fill="#1E293B"/>
    </marker>
  </defs>
  <style>
    .interactive-group { cursor: pointer; }
    .interactive-group:hover .anatomical-part {
      fill-opacity: 0.95;
      stroke: #EA580C !important;
      stroke-width: 3px !important;
      filter: drop-shadow(0 0 8px rgba(234, 88, 12, 0.5));
    }
    .interactive-group:hover .leader-line {
      stroke: #EA580C !important;
      stroke-width: 2px !important;
    }
    .interactive-group:hover .label-text {
      fill: #EA580C !important;
      font-weight: 800 !important;
    }
    .interactive-group:hover .anchor-dot {
      fill: #EA580C !important;
    }
    .anatomical-part, .leader-line, .label-text, .anchor-dot {
      transition: all 0.25s ease;
    }
  </style>
  <rect width="100%" height="100%" fill="#F8FAFC" rx="16" stroke="#E2E8F0" stroke-width="1.5"/>
  <path d="M 65 75 L 45 55 M 65 95 L 35 105 M 80 115 L 70 140 M 100 105 L 115 125 M 90 70 L 100 50" stroke="#D97706" stroke-width="2.5" fill="none"/>
  <g class="interactive-group">
    <!-- Dendrites -->
    <path class="anatomical-part" d="M 45 55 L 30 40 M 45 55 L 55 35 M 35 105 L 15 110 M 70 140 L 65 160" stroke="#D97706" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <circle class="anchor-dot" cx="242" cy="42" r="3" fill="#475569"/>
    <line class="leader-line" x1="242" y1="42" x2="38" y2="48" stroke="#475569" stroke-width="1.2" marker-end="url(#bioArrow)"/>
    <text class="label-text" x="252" y="46" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#0F172A" font-weight="bold" text-anchor="start">Dendrite (Receives Signals)</text>
  </g>
  <g class="interactive-group">
    <!-- Nucleus -->
    <circle class="anatomical-part" cx="75" cy="95" r="20" fill="#FEF3C7" stroke="#D97706" stroke-width="2"/>
    <circle cx="75" cy="95" r="6" fill="#B45309"/>
    <circle class="anchor-dot" cx="242" cy="90" r="3" fill="#475569"/>
    <line class="leader-line" x1="242" y1="90" x2="77" y2="92" stroke="#475569" stroke-width="1.2" marker-end="url(#bioArrow)"/>
    <text class="label-text" x="252" y="93" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#0F172A" font-weight="bold" text-anchor="start">Cell Body (Soma & Nucleus)</text>
  </g>
  <g class="interactive-group">
    <!-- Axon long cable -->
    <path class="anatomical-part" d="M 95 95 L 230 95" stroke="#D97706" stroke-width="5" fill="none" stroke-linecap="round"/>
    <circle class="anchor-dot" cx="242" cy="132" r="3" fill="#475569"/>
    <line class="leader-line" x1="242" y1="132" x2="155" y2="96" stroke="#475569" stroke-width="1.2" marker-end="url(#bioArrow)"/>
    <text class="label-text" x="252" y="136" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#0F172A" font-weight="bold" text-anchor="start">Axon (Transmission Shaft)</text>
  </g>
  <g class="interactive-group">
    <!-- Myelin Sheath -->
    <g class="anatomical-part">
      <rect x="105" y="86" width="24" height="18" rx="4" fill="#FEF9C3" stroke="#CA8A04" stroke-width="1.5"/>
      <rect x="135" y="86" width="24" height="18" rx="4" fill="#FEF9C3" stroke="#CA8A04" stroke-width="1.5"/>
      <rect x="165" y="86" width="24" height="18" rx="4" fill="#FEF9C3" stroke="#CA8A04" stroke-width="1.5"/>
      <rect x="195" y="86" width="24" height="18" rx="4" fill="#FEF9C3" stroke="#CA8A04" stroke-width="1.5"/>
    </g>
    <circle class="anchor-dot" cx="242" cy="177" r="3" fill="#475569"/>
    <line class="leader-line" x1="242" y1="177" x2="178" y2="105" stroke="#475569" stroke-width="1.2" marker-end="url(#bioArrow)"/>
    <text class="label-text" x="252" y="181" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#0F172A" font-weight="bold" text-anchor="start">Myelin Sheath (Insulation)</text>
  </g>
  <g class="interactive-group">
    <!-- Nerve Endings -->
    <path class="anatomical-part" d="M 230 95 L 255 80 M 230 95 L 255 110 M 230 95 L 260 95" stroke="#D97706" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <circle cx="255" cy="80" r="3" fill="#D97706"/>
    <circle cx="255" cy="110" r="3" fill="#D97706"/>
    <circle cx="260" cy="95" r="3" fill="#D97706"/>
    <circle class="anchor-dot" cx="242" cy="222" r="3" fill="#475569"/>
    <line class="leader-line" x1="242" y1="222" x2="248" y2="105" stroke="#475569" stroke-width="1.2" marker-end="url(#bioArrow)"/>
    <text class="label-text" x="252" y="226" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#0F172A" font-weight="bold" text-anchor="start">Nerve Ending (Synapse Knobs)</text>
  </g>
</svg>`;

const KIDNEY_SVG = `
<svg width="100%" height="260" viewBox="0 0 450 260" class="interactive-bio-svg">
  <defs>
    <marker id="bioArrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 6 5 L 0 8.5 z" fill="#1E293B"/>
    </marker>
  </defs>
  <style>
    .interactive-group { cursor: pointer; }
    .interactive-group:hover .anatomical-part {
      fill-opacity: 0.95;
      stroke: #EA580C !important;
      stroke-width: 3px !important;
      filter: drop-shadow(0 0 8px rgba(234, 88, 12, 0.5));
    }
    .interactive-group:hover .leader-line {
      stroke: #EA580C !important;
      stroke-width: 2px !important;
    }
    .interactive-group:hover .label-text {
      fill: #EA580C !important;
      font-weight: 800 !important;
    }
    .interactive-group:hover .anchor-dot {
      fill: #EA580C !important;
    }
    .anatomical-part, .leader-line, .label-text, .anchor-dot {
      transition: all 0.25s ease;
    }
  </style>
  <rect width="100%" height="100%" fill="#F8FAFC" rx="16" stroke="#E2E8F0" stroke-width="1.5"/>
  <line x1="85" y1="25" x2="85" y2="190" stroke="#EF4444" stroke-width="4.5" stroke-linecap="round"/>
  <line x1="95" y1="25" x2="95" y2="190" stroke="#3B82F6" stroke-width="4.5" stroke-linecap="round"/>
  <g class="interactive-group">
    <!-- Kidneys -->
    <g class="anatomical-part">
      <path d="M 50 60 C 35 65, 30 95, 50 110 C 55 105, 60 80, 50 60 Z" fill="#FCA5A5" stroke="#991B1B" stroke-width="2"/>
      <path d="M 130 60 C 145 65, 155 95, 130 110 C 125 105, 120 80, 130 60 Z" fill="#FCA5A5" stroke="#991B1B" stroke-width="2"/>
    </g>
    <line x1="48" y1="85" x2="85" y2="85" stroke="#EF4444" stroke-width="2"/>
    <line x1="132" y1="85" x2="95" y2="85" stroke="#EF4444" stroke-width="2"/>
    <circle class="anchor-dot" cx="242" cy="42" r="3" fill="#475569"/>
    <line class="leader-line" x1="242" y1="42" x2="137" y2="80" stroke="#475569" stroke-width="1.2" marker-end="url(#bioArrow)"/>
    <text class="label-text" x="252" y="46" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#0F172A" font-weight="bold" text-anchor="start">Kidney (Blood Filtration)</text>
  </g>
  <g class="interactive-group">
    <!-- Ureter tubes -->
    <g class="anatomical-part">
      <path d="M 47 105 C 65 140, 75 170, 80 195" fill="none" stroke="#D97706" stroke-width="2"/>
      <path d="M 133 105 C 115 140, 105 170, 100 195" fill="none" stroke="#D97706" stroke-width="2"/>
    </g>
    <circle class="anchor-dot" cx="242" cy="125" r="3" fill="#475569"/>
    <line class="leader-line" x1="242" y1="125" x2="113" y2="135" stroke="#475569" stroke-width="1.2" marker-end="url(#bioArrow)"/>
    <text class="label-text" x="252" y="128" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#0F172A" font-weight="bold" text-anchor="start">Ureter (Excretory Tubes)</text>
  </g>
  <g class="interactive-group">
    <!-- Urinary Bladder -->
    <ellipse class="anatomical-part" cx="90" cy="205" rx="18" ry="14" fill="#FEF3C7" stroke="#D97706" stroke-width="2"/>
    <circle class="anchor-dot" cx="242" cy="185" r="3" fill="#475569"/>
    <line class="leader-line" x1="242" y1="185" x2="107" y2="200" stroke="#475569" stroke-width="1.2" marker-end="url(#bioArrow)"/>
    <text class="label-text" x="252" y="188" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#0F172A" font-weight="bold" text-anchor="start">Urinary Bladder (Urine Storage)</text>
  </g>
  <g class="interactive-group">
    <!-- Urethra -->
    <line class="anatomical-part" x1="90" y1="219" x2="90" y2="234" stroke="#D97706" stroke-width="3" stroke-linecap="round"/>
    <circle class="anchor-dot" cx="242" cy="222" r="3" fill="#475569"/>
    <line class="leader-line" x1="242" y1="222" x2="92" y2="225" stroke="#475569" stroke-width="1.2" marker-end="url(#bioArrow)"/>
    <text class="label-text" x="252" y="226" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#0F172A" font-weight="bold" text-anchor="start">Urethra (Urine Release)</text>
  </g>
</svg>`;

const DIGESTIVE_SVG = `
<svg width="100%" height="260" viewBox="0 0 450 260" class="interactive-bio-svg">
  <defs>
    <marker id="bioArrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 6 5 L 0 8.5 z" fill="#1E293B"/>
    </marker>
  </defs>
  <style>
    .interactive-group { cursor: pointer; }
    .interactive-group:hover .anatomical-part {
      fill-opacity: 0.95;
      stroke: #EA580C !important;
      stroke-width: 3px !important;
      filter: drop-shadow(0 0 8px rgba(234, 88, 12, 0.5));
    }
    .interactive-group:hover .leader-line {
      stroke: #EA580C !important;
      stroke-width: 2px !important;
    }
    .interactive-group:hover .label-text {
      fill: #EA580C !important;
      font-weight: 800 !important;
    }
    .interactive-group:hover .anchor-dot {
      fill: #EA580C !important;
    }
    .anatomical-part, .leader-line, .label-text, .anchor-dot {
      transition: all 0.25s ease;
    }
  </style>
  <rect width="100%" height="100%" fill="#F8FAFC" rx="16" stroke="#E2E8F0" stroke-width="1.5"/>
  <g class="interactive-group">
    <!-- Esophagus -->
    <path class="anatomical-part" d="M 80 25 L 80 85" stroke="#EA580C" stroke-width="5.5" fill="none" stroke-linecap="round"/>
    <circle class="anchor-dot" cx="242" cy="42" r="3" fill="#475569"/>
    <line class="leader-line" x1="242" y1="42" x2="84" y2="45" stroke="#475569" stroke-width="1.2" marker-end="url(#bioArrow)"/>
    <text class="label-text" x="252" y="46" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#0F172A" font-weight="bold" text-anchor="start">Esophagus (Food Pipe)</text>
  </g>
  <g class="interactive-group">
    <!-- Stomach -->
    <path class="anatomical-part" d="M 80 85 C 70 85, 50 95, 50 115 C 50 135, 85 130, 85 110 Z" fill="#FEE2E2" stroke="#B91C1C" stroke-width="2"/>
    <circle class="anchor-dot" cx="242" cy="95" r="3" fill="#475569"/>
    <line class="leader-line" x1="242" y1="95" x2="68" y2="108" stroke="#475569" stroke-width="1.2" marker-end="url(#bioArrow)"/>
    <text class="label-text" x="252" y="98" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#0F172A" font-weight="bold" text-anchor="start">Stomach (Digestive Pouch)</text>
  </g>
  <g class="interactive-group">
    <!-- Liver -->
    <path class="anatomical-part" d="M 90 82 C 95 82, 108 88, 112 95 L 75 95 Z" fill="#FCA5A5" stroke="#991B1B" stroke-width="2"/>
    <circle class="anchor-dot" cx="242" cy="135" r="3" fill="#475569"/>
    <line class="leader-line" x1="242" y1="135" x2="100" y2="92" stroke="#475569" stroke-width="1.2" marker-end="url(#bioArrow)"/>
    <text class="label-text" x="252" y="138" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#0F172A" font-weight="bold" text-anchor="start">Liver (Bile Secretion)</text>
  </g>
  <g class="interactive-group">
    <!-- Small Intestine -->
    <path class="anatomical-part" d="M 70 135 C 55 140, 55 180, 75 185 C 95 185, 95 140, 70 135 Z" fill="#FCE7F3" stroke="#DB2777" stroke-width="1.5"/>
    <circle class="anchor-dot" cx="242" cy="180" r="3" fill="#475569"/>
    <line class="leader-line" x1="242" y1="180" x2="75" y2="160" stroke="#475569" stroke-width="1.2" marker-end="url(#bioArrow)"/>
    <text class="label-text" x="252" y="181" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#0F172A" font-weight="bold" text-anchor="start">Small Intestine (Nutrients)</text>
  </g>
  <g class="interactive-group">
    <!-- Large Intestine -->
    <path class="anatomical-part" d="M 65 130 C 45 130, 45 190, 75 195 C 105 190, 105 130, 65 130 Z" fill="none" stroke="#9D174D" stroke-width="2.5"/>
    <circle class="anchor-dot" cx="242" cy="225" r="3" fill="#475569"/>
    <line class="leader-line" x1="242" y1="225" x2="80" y2="185" stroke="#475569" stroke-width="1.2" marker-end="url(#bioArrow)"/>
    <text class="label-text" x="252" y="228" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#0F172A" font-weight="bold" text-anchor="start">Large Intestine (Water)</text>
  </g>
</svg>`;

const RESPIRATORY_SVG = `
<svg width="100%" height="260" viewBox="0 0 450 260" class="interactive-bio-svg">
  <defs>
    <marker id="bioArrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 6 5 L 0 8.5 z" fill="#1E293B"/>
    </marker>
  </defs>
  <style>
    .interactive-group { cursor: pointer; }
    .interactive-group:hover .anatomical-part {
      fill-opacity: 0.95;
      stroke: #0D9488 !important;
      stroke-width: 3px !important;
      filter: drop-shadow(0 0 8px rgba(13, 148, 136, 0.5));
    }
    .interactive-group:hover .leader-line {
      stroke: #0D9488 !important;
      stroke-width: 2px !important;
    }
    .interactive-group:hover .label-text {
      fill: #0D9488 !important;
      font-weight: 800 !important;
    }
    .interactive-group:hover .anchor-dot {
      fill: #0D9488 !important;
    }
    .anatomical-part, .leader-line, .label-text, .anchor-dot {
      transition: all 0.25s ease;
    }
  </style>
  <rect width="100%" height="100%" fill="#F8FAFC" rx="16" stroke="#E2E8F0" stroke-width="1.5"/>
  <g class="interactive-group">
    <!-- Trachea -->
    <g class="anatomical-part">
      <line x1="85" y1="25" x2="85" y2="75" stroke="#0D9488" stroke-width="6"/>
      <line x1="82" y1="35" x2="88" y2="35" stroke="#CCFBF1" stroke-width="1.5"/>
      <line x1="82" y1="45" x2="88" y2="45" stroke="#CCFBF1" stroke-width="1.5"/>
      <line x1="82" y1="55" x2="88" y2="55" stroke="#CCFBF1" stroke-width="1.5"/>
      <line x1="82" y1="65" x2="88" y2="65" stroke="#CCFBF1" stroke-width="1.5"/>
    </g>
    <circle class="anchor-dot" cx="242" cy="42" r="3" fill="#475569"/>
    <line class="leader-line" x1="242" y1="42" x2="89" y2="45" stroke="#475569" stroke-width="1.2" marker-end="url(#bioArrow)"/>
    <text class="label-text" x="252" y="46" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#0F172A" font-weight="bold" text-anchor="start">Trachea (Wind Pipe)</text>
  </g>
  <g class="interactive-group">
    <!-- Bronchi -->
    <path class="anatomical-part" d="M 85 75 L 60 95 M 85 75 L 110 95" stroke="#0D9488" stroke-width="4.5" fill="none"/>
    <circle class="anchor-dot" cx="242" cy="95" r="3" fill="#475569"/>
    <line class="leader-line" x1="242" y1="95" x2="100" y2="85" stroke="#475569" stroke-width="1.2" marker-end="url(#bioArrow)"/>
    <text class="label-text" x="252" y="98" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#0F172A" font-weight="bold" text-anchor="start">Bronchi (Airways)</text>
  </g>
  <g class="interactive-group">
    <!-- Lungs -->
    <g class="anatomical-part">
      <path d="M 57 92 C 40 92, 30 110, 30 140 C 30 180, 63 185, 63 185 C 63 185, 67 150, 57 92 Z" fill="#FEE2E2" stroke="#EF4444" stroke-width="2"/>
      <path d="M 113 92 C 130 92, 140 110, 140 140 C 140 180, 107 185, 107 185 C 107 185, 103 150, 113 92 Z" fill="#FEE2E2" stroke="#EF4444" stroke-width="2"/>
    </g>
    <circle class="anchor-dot" cx="242" cy="145" r="3" fill="#475569"/>
    <line class="leader-line" x1="242" y1="145" x2="125" y2="140" stroke="#475569" stroke-width="1.2" marker-end="url(#bioArrow)"/>
    <text class="label-text" x="252" y="148" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#0F172A" font-weight="bold" text-anchor="start">Lungs (Respiration)</text>
  </g>
  <g class="interactive-group">
    <!-- Diaphragm -->
    <path class="anatomical-part" d="M 25 205 Q 85 185 145 205" fill="none" stroke="#475569" stroke-width="4.5" stroke-linecap="round"/>
    <circle class="anchor-dot" cx="242" cy="195" r="3" fill="#475569"/>
    <line class="leader-line" x1="242" y1="195" x2="90" y2="195" stroke="#475569" stroke-width="1.2" marker-end="url(#bioArrow)"/>
    <text class="label-text" x="252" y="198" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#0F172A" font-weight="bold" text-anchor="start">Diaphragm (Breathing Muscle)</text>
  </g>
</svg>`;

const SKIN_SVG = `
<svg width="100%" height="260" viewBox="0 0 450 260" class="interactive-bio-svg">
  <defs>
    <linearGradient id="epiGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FCD34D" />
      <stop offset="100%" stop-color="#FBBF24" />
    </linearGradient>
    <linearGradient id="dermGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FCA5A5" />
      <stop offset="100%" stop-color="#F87171" />
    </linearGradient>
    <linearGradient id="subGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FEF08A" />
      <stop offset="100%" stop-color="#FDE047" />
    </linearGradient>
    <marker id="bioArrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 6 5 L 0 8.5 z" fill="#1E293B"/>
    </marker>
  </defs>
  <style>
    .interactive-group { cursor: pointer; }
    .interactive-group:hover .anatomical-part {
      fill-opacity: 0.95;
      stroke: #0284C7 !important;
      stroke-width: 3.5px !important;
      filter: drop-shadow(0 0 8px rgba(2, 132, 199, 0.5));
    }
    .interactive-group:hover .leader-line {
      stroke: #0284C7 !important;
      stroke-width: 2px !important;
    }
    .interactive-group:hover .label-text {
      fill: #0284C7 !important;
      font-weight: 800 !important;
    }
    .interactive-group:hover .anchor-dot {
      fill: #0284C7 !important;
    }
    .anatomical-part, .leader-line, .label-text, .anchor-dot {
      transition: all 0.25s ease;
    }
  </style>
  <rect width="100%" height="100%" fill="#F8FAFC" rx="16" stroke="#E2E8F0" stroke-width="1.5"/>
  
  <g class="interactive-group">
    <rect class="anatomical-part" x="40" y="40" width="120" height="30" rx="4" fill="url(#epiGrad)" stroke="#D97706" stroke-width="2"/>
    <circle class="anchor-dot" cx="242" cy="55" r="3" fill="#475569"/>
    <line class="leader-line" x1="242" y1="55" x2="162" y2="55" stroke="#475569" stroke-width="1.2" marker-end="url(#bioArrow)"/>
    <text class="label-text" x="252" y="59" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#0F172A" font-weight="bold" text-anchor="start">Epidermis (Outer Layer)</text>
  </g>
  
  <g class="interactive-group">
    <rect class="anatomical-part" x="40" y="70" width="120" height="80" rx="4" fill="url(#dermGrad)" stroke="#B91C1C" stroke-width="2"/>
    <circle class="anchor-dot" cx="242" cy="110" r="3" fill="#475569"/>
    <line class="leader-line" x1="242" y1="110" x2="162" y2="110" stroke="#475569" stroke-width="1.2" marker-end="url(#bioArrow)"/>
    <text class="label-text" x="252" y="114" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#0F172A" font-weight="bold" text-anchor="start">Dermis (Contains Nerves/Vessels)</text>
  </g>
  
  <g class="interactive-group">
    <rect class="anatomical-part" x="40" y="150" width="120" height="40" rx="4" fill="url(#subGrad)" stroke="#CA8A04" stroke-width="2"/>
    <circle class="anchor-dot" cx="242" cy="170" r="3" fill="#475569"/>
    <line class="leader-line" x1="242" y1="170" x2="162" y2="170" stroke="#475569" stroke-width="1.2" marker-end="url(#bioArrow)"/>
    <text class="label-text" x="252" y="174" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#0F172A" font-weight="bold" text-anchor="start">Hypodermis (Subcutaneous Fat)</text>
  </g>

  <g class="interactive-group">
    <path class="anatomical-part" d="M 100 30 L 100 130 C 100 140, 110 140, 110 130 L 110 30 Z" fill="#475569" stroke="#1E293B" stroke-width="1.5"/>
    <circle class="anchor-dot" cx="242" cy="215" r="3" fill="#475569"/>
    <line class="leader-line" x1="242" y1="215" x2="105" y2="135" stroke="#475569" stroke-width="1.2" marker-end="url(#bioArrow)"/>
    <text class="label-text" x="252" y="219" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#0F172A" font-weight="bold" text-anchor="start">Hair Follicle &amp; Sebaceous Gland</text>
  </g>
</svg>`;

const getHighFidelityBiologySVG = (rawSvg: string, fullAnswerText: string): string => {
  const textToAnalyze = (rawSvg + " " + fullAnswerText).toLowerCase();
  
  if (textToAnalyze.includes('eye') || textToAnalyze.includes('cornea') || textToAnalyze.includes('iris') || textToAnalyze.includes('retina') || textToAnalyze.includes('pupil') || textToAnalyze.includes('sclera')) {
    return EYE_SVG;
  }
  if (textToAnalyze.includes('plant cell') || textToAnalyze.includes('cell wall') || textToAnalyze.includes('chloroplast') || textToAnalyze.includes('vacuole')) {
    return PLANT_CELL_SVG;
  }
  if (textToAnalyze.includes('animal cell') || textToAnalyze.includes('lysosome') || textToAnalyze.includes('centriole') || textToAnalyze.includes('cytoplasm')) {
    return ANIMAL_CELL_SVG;
  }
  if (textToAnalyze.includes('heart') || textToAnalyze.includes('cardiac') || textToAnalyze.includes('aorta') || textToAnalyze.includes('ventricle') || textToAnalyze.includes('atrium') || textToAnalyze.includes('septum')) {
    return HEART_SVG;
  }
  if (textToAnalyze.includes('neuron') || textToAnalyze.includes('axon') || textToAnalyze.includes('dendrite') || textToAnalyze.includes('myelin') || textToAnalyze.includes('nerve cell') || textToAnalyze.includes('synapse')) {
    return NEURON_SVG;
  }
  if (textToAnalyze.includes('kidney') || textToAnalyze.includes('excretory') || textToAnalyze.includes('urinary') || textToAnalyze.includes('ureter') || textToAnalyze.includes('bladder') || textToAnalyze.includes('nephron')) {
    return KIDNEY_SVG;
  }
  if (textToAnalyze.includes('digestive') || textToAnalyze.includes('stomach') || textToAnalyze.includes('esophagus') || textToAnalyze.includes('intestine') || textToAnalyze.includes('liver') || textToAnalyze.includes('pancreas') || textToAnalyze.includes('alimentary')) {
    return DIGESTIVE_SVG;
  }
  if (textToAnalyze.includes('respiratory') || textToAnalyze.includes('lung') || textToAnalyze.includes('trachea') || textToAnalyze.includes('bronch') || textToAnalyze.includes('diaphragm')) {
    return RESPIRATORY_SVG;
  }
  if (textToAnalyze.includes('skin') || textToAnalyze.includes('epidermis') || textToAnalyze.includes('dermis') || textToAnalyze.includes('melanin') || textToAnalyze.includes('sebaceous')) {
    return SKIN_SVG;
  }
  
  return rawSvg;
};

export default function QuestionPaperView({ assignment, onBack, onRegenerate, settingsSchoolName }: QuestionPaperViewProps) {
  const paper = assignment.generatedPaper;

  const renderAnswerContent = (answer: string, questionNumber: string) => {
    if (answer.includes('[MERMAID]')) {
      const possibleEnhancedSvg = getHighFidelityBiologySVG("", answer);
      if (possibleEnhancedSvg !== "") {
        return (
          <div className="rich-answer-container">
            <p className="answer-number-label">Question {questionNumber}:</p>
            <div dangerouslySetInnerHTML={{ __html: possibleEnhancedSvg }} />
          </div>
        );
      }

      const parts = [];
      let currentText = answer;
      
      while (currentText.includes('[MERMAID]')) {
        const startIndex = currentText.indexOf('[MERMAID]');
        const endIndex = currentText.indexOf('[/MERMAID]');
        let chartCode = '';
        
        // Add text before the Mermaid block
        if (startIndex > 0) {
          parts.push({
            type: 'text',
            content: currentText.substring(0, startIndex)
          });
        }
        
        // Extract the chart code and advance currentText
        if (endIndex !== -1) {
          chartCode = currentText.substring(startIndex + 9, endIndex).trim();
          currentText = currentText.substring(endIndex + 10);
        } else {
          // If no closing tag is found, assume the rest of the text is the chart
          chartCode = currentText.substring(startIndex + 9).trim();
          currentText = '';
        }
        
        // Strip markdown blocks if the LLM outputted them inside the tags
        chartCode = chartCode.replace(/^```(mermaid)?\s*/i, '').replace(/```$/, '').trim();
        
        // Fix common LLM mermaid syntax hallucination: |label|> instead of |label|
        chartCode = chartCode.replace(/\|>\s*/g, '| ');
        
        // Dynamically convert Left-to-Right graphs to Top-Down to prevent horizontal overflow and force vertical "wrapping"
        chartCode = chartCode.replace(/(graph|flowchart)\s+LR/i, '$1 TD');

        parts.push({
          type: 'mermaid',
          content: chartCode
        });
      }
      
      if (currentText.trim().length > 0) {
        parts.push({
          type: 'text',
          content: currentText
        });
      }
      
      return (
        <div className="rich-answer-container">
          <p className="answer-number-label">Question {questionNumber}:</p>
          {parts.map((part, index) => {
            if (part.type === 'mermaid') {
              return (
                <MermaidRenderer key={index} chart={part.content} />
              );
            } else {
              return (
                <p key={index} className="answer-content-text">
                  {part.content}
                </p>
              );
            }
          })}
        </div>
      );
    }

    if (answer.includes('<svg') && answer.includes('</svg>')) {
      const parts = [];
      let currentText = answer;
      
      while (currentText.includes('<svg') && currentText.includes('</svg>')) {
        const startIndex = currentText.indexOf('<svg');
        const endIndex = currentText.indexOf('</svg>') + 6;
        
        // Add text before the SVG
        if (startIndex > 0) {
          parts.push({
            type: 'text',
            content: currentText.substring(0, startIndex)
          });
        }
        
        // Add the SVG itself with dynamic high-fidelity biology diagram interception
        const rawSvgBlock = currentText.substring(startIndex, endIndex);
        const replacedSvg = getHighFidelityBiologySVG(rawSvgBlock, answer);
        parts.push({
          type: 'svg',
          content: replacedSvg
        });
        
        currentText = currentText.substring(endIndex);
      }
      
      if (currentText.length > 0) {
        parts.push({
          type: 'text',
          content: currentText
        });
      }
      
      return (
        <div className="rich-answer-container">
          <p className="answer-number-label">Question {questionNumber}:</p>
          {parts.map((part, index) => {
            if (part.type === 'svg') {
              return (
                <div 
                  key={index} 
                  className="rendered-svg-diagram" 
                  dangerouslySetInnerHTML={{ __html: part.content }} 
                />
              );
            } else {
              return (
                <p key={index} className="answer-content-text">
                  {part.content}
                </p>
              );
            }
          })}
        </div>
      );
    }
    
    return (
      <div className="rich-answer-container">
        <p className="answer-number-label">Question {questionNumber}:</p>
        <p className="answer-content-text">{answer}</p>
      </div>
    );
  };

  if (!paper) {
    return (
      <div className="error-paper no-print">
        <p>No generated paper found for this assignment. Please trigger generation.</p>
        <button className="primary-pill" onClick={onRegenerate}>Generate Now</button>
      </div>
    );
  }

  // Trigger automatic high-fidelity PDF download
  const handleDownloadPDF = async () => {
    const element = document.getElementById('printable-paper-content');
    if (!element) return;

    try {
      // Dynamically import html2pdf to avoid SSR issues in Next.js
      const html2pdf = (await import('html2pdf.js')).default;
      
      const opt: any = {
        margin:       10,
        filename:     `${assignment.title.replace(/\s+/g, '_')}_Paper.pdf`,
        image:        { type: 'jpeg' as const, quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
      };

      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error('PDF Generation failed:', err);
      // Fallback to print dialogue if html2pdf fails
      window.print();
    }
  };

  return (
    <div className="paper-view-container">
      {/* Back button header (breadcrumb) */}
      <div className="breadcrumb-nav no-print">
        <button onClick={onBack} className="back-breadcrumb-btn">
          <ChevronLeft size={16} />
          <span>Back to Assignments</span>
        </button>
      </div>

      {/* AI Assistant response card */}
      <div className="ai-header-card no-print">
        <div className="ai-header-content">
          <p className="ai-msg-text">
            {paper.aiMessage || `Certainly, Lakshya! Here is your customized Question Paper for your classes on the topic ${assignment.title}:`}
          </p>
          <div className="ai-actions-row">
            <button className="download-btn-pill" onClick={handleDownloadPDF}>
              <Download size={16} />
              <span>Download as PDF</span>
            </button>
            <button className="regenerate-btn-pill" onClick={onRegenerate} title="Regenerate Paper">
              <RefreshCw size={14} />
              <span>Regenerate</span>
            </button>
          </div>
        </div>
      </div>

      {/* Realistic Question Paper Sheet */}
      <div id="printable-paper-content" className="printable-paper">
        {/* Academic Header */}
        <div className="paper-academic-header">
          <h1 className="school-title">{paper.schoolName || settingsSchoolName || 'Delhi Public School, Sector-4, Bokaro'}</h1>
          <h2 className="subject-title">Subject: {paper.subject || 'Science'}</h2>
          <h3 className="class-title">Class: {paper.className || '8th'}</h3>
        </div>

        {/* Paper Constraints Metas */}
        <div className="paper-meta-row">
          <span className="meta-left">Time Allowed: {paper.timeAllowed || '45 minutes'}</span>
          <span className="meta-right">Maximum Marks: {paper.maxMarks || assignment.totalMarks || 20}</span>
        </div>

        <div className="compulsory-banner">
          All questions are compulsory unless stated otherwise.
        </div>

        {/* Student Blank lines */}
        <div className="student-info-lines">
          <div className="info-line">
            <span className="line-label">Name:</span>
            <div className="blank-line"></div>
          </div>
          <div className="info-line">
            <span className="line-label">Roll Number:</span>
            <div className="blank-line"></div>
          </div>
          <div className="info-line">
            <span className="line-label">Class:</span>
            <span className="val-inline">{paper.className || '8th'}</span>
            <span className="line-label padding-left">Section:</span>
            <div className="blank-line short"></div>
          </div>
        </div>

        {/* Structured Sections */}
        {paper.sections && paper.sections.map((sec, sIdx) => (
          <div className="paper-section-block" key={sIdx}>
            <h2 className="section-title-header">{sec.sectionName || `Section ${String.fromCharCode(65 + sIdx)}`}</h2>
            <div className="section-type-metadata">
              <p className="section-type-title">{sec.title}</p>
              <p className="section-type-instruction">{sec.instruction}</p>
            </div>

            {/* Questions List */}
            <ol className="questions-ordered-list">
              {sec.questions && sec.questions.map((q, qIdx) => {
                const parts = q.text.split('\n');
                const questionText = parts[0];
                const options = parts.slice(1);

                return (
                  <li className="question-list-item" key={qIdx}>
                    <div className="question-item-row">
                      <div className="question-text-content">
                        {/* Difficulty badge highlighted */}
                        <span className={`difficulty-badge ${q.difficulty?.toLowerCase()}`}>
                          [{q.difficulty || 'Moderate'}]
                        </span>
                        {" "}{questionText}
                      </div>
                      <span className="question-marks-badge">[{q.marks} Mark{q.marks > 1 ? 's' : ''}]</span>
                    </div>

                    {/* Renders MCQ Options if present */}
                    {options.length > 0 && (
                      <div className="mcq-options-container">
                        {options.map((opt, oIdx) => (
                          <div className="mcq-opt-item" key={oIdx}>
                            {opt}
                          </div>
                        ))}
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
        ))}

        <div className="end-paper-banner">
          End of Question Paper
        </div>

        {/* Dynamic Detailed Answer Key */}
        {paper.answerKey && paper.answerKey.length > 0 && (
          <div className="answer-key-section page-break">
            <h2 className="answer-key-header">Answer Key</h2>
            <ol className="answers-ordered-list">
              {paper.answerKey.map((ans, aIdx) => (
                <li className="answer-list-item" key={aIdx}>
                  {renderAnswerContent(ans.answer, ans.questionNumber)}
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>

      <style jsx>{`
        .paper-view-container {
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 20px;
          padding-bottom: 100px;
        }

        .breadcrumb-nav {
          display: flex;
          align-self: flex-start;
        }

        .back-breadcrumb-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--text-secondary);
          font-size: 13px;
          font-weight: 600;
          transition: var(--transition-smooth);
        }

        .back-breadcrumb-btn:hover {
          color: var(--text-primary);
        }

        /* AI Header Card */
        .ai-header-card {
          background: #27272A;
          color: #FFFFFF;
          border-radius: var(--radius-lg);
          padding: 24px;
          box-shadow: var(--shadow-md);
        }

        .ai-msg-text {
          font-size: 14px;
          font-weight: 600;
          line-height: 1.6;
          margin-bottom: 20px;
        }

        .ai-actions-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .download-btn-pill {
          background: #FFFFFF;
          color: #18181B;
          font-size: 13px;
          font-weight: 700;
          padding: 10px 22px;
          border-radius: var(--radius-full);
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: var(--shadow-sm);
          transition: var(--transition-smooth);
        }

        .download-btn-pill:hover {
          background: #F4F4F5;
          transform: translateY(-1px);
        }

        .regenerate-btn-pill {
          background: transparent;
          color: #FFFFFF;
          font-size: 13px;
          font-weight: 600;
          padding: 10px 20px;
          border-radius: var(--radius-full);
          border: 1px solid #71717A;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: var(--transition-smooth);
        }

        .regenerate-btn-pill:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: #FFFFFF;
        }

        /* Realistic Paper Card */
        .printable-paper {
          background: #FFFFFF;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 48px;
          box-shadow: var(--shadow-lg);
          color: #000000; /* Strict print style */
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .paper-academic-header {
          text-align: center;
          display: flex;
          flex-direction: column;
          gap: 6px;
          border-bottom: 2px solid #000000;
          padding-bottom: 16px;
        }

        .school-title {
          font-size: 22px;
          font-weight: 800;
          letter-spacing: -0.2px;
        }

        .subject-title, .class-title {
          font-size: 15px;
          font-weight: 700;
        }

        .paper-meta-row {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
          font-weight: 700;
          margin-top: -8px;
        }

        .compulsory-banner {
          font-size: 13px;
          font-weight: 600;
          text-align: left;
          border-bottom: 1px dashed var(--border-color);
          padding-bottom: 8px;
          margin-top: -12px;
        }

        /* Student Line inputs */
        .student-info-lines {
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin: 8px 0;
        }

        .info-line {
          display: flex;
          align-items: flex-end;
          width: 100%;
        }

        .line-label {
          font-size: 13px;
          font-weight: 700;
          margin-right: 10px;
          white-space: nowrap;
        }

        .val-inline {
          font-size: 13px;
          font-weight: 600;
          margin-right: 10px;
          white-space: nowrap;
        }

        .padding-left {
          padding-left: 20px;
        }

        .blank-line {
          flex: 1;
          border-bottom: 1.5px solid #181818;
          height: 16px;
          margin-bottom: 2px;
        }

        .blank-line.short {
          max-width: 150px;
        }

        /* Sections */
        .paper-section-block {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-top: 10px;
        }

        .section-title-header {
          text-align: center;
          font-size: 16px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }

        .section-type-metadata {
          border-left: 3px solid #18181B;
          padding-left: 12px;
        }

        .section-type-title {
          font-size: 14px;
          font-weight: 700;
          color: #000000;
        }

        .section-type-instruction {
          font-size: 12px;
          color: #52525B;
          font-style: italic;
          margin-top: 2px;
        }

        /* Questions Ordered List */
        .questions-ordered-list {
          padding-left: 20px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .question-list-item {
          padding-left: 12px;
          margin-bottom: 24px;
          page-break-inside: avoid;
          break-inside: avoid;
        }

        .question-item-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
        }

        .question-text-content {
          font-weight: 600;
        }

        .difficulty-badge {
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          margin-right: 4px;
        }

        /* Difficulty badge colors matching Figma specs */
        .difficulty-badge.easy {
          color: #16A34A; /* green */
        }

        .difficulty-badge.moderate {
          color: #D97706; /* orange */
        }

        .difficulty-badge.challenging {
          color: #DC2626; /* red */
        }

        .question-marks-badge {
          font-size: 12px;
          font-weight: 700;
          white-space: nowrap;
        }

        .mcq-options-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-top: 8px;
          padding-left: 12px;
        }

        .mcq-opt-item {
          font-size: 12px;
          color: #27272A;
          font-weight: 500;
        }

        .end-paper-banner {
          text-align: center;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          border-top: 1px dashed var(--border-color);
          border-bottom: 1px dashed var(--border-color);
          padding: 8px 0;
          margin: 12px 0;
        }

        /* Answer Key */
        .answer-key-section {
          border-top: 2px solid #000000;
          padding-top: 24px;
          margin-top: 12px;
        }

        .answer-key-header {
          font-size: 16px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 16px;
        }

        .answers-ordered-list {
          padding-left: 0;
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .answer-list-item {
          font-size: 13px;
          line-height: 1.6;
        }

        .answer-number-label {
          font-weight: 700;
          margin-bottom: 2px;
        }

        .answer-content-text {
          color: #27272A;
          white-space: pre-line;
          margin-bottom: 8px;
        }

        .rendered-svg-diagram {
          margin: 12px 0;
          background: #FAFAFA;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          overflow: hidden;
        }

        .rendered-svg-diagram svg {
          max-width: 100%;
          height: auto;
        }

        .error-paper {
          text-align: center;
          padding: 48px;
          background: #FFFFFF;
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-color);
        }

        .primary-pill {
          background: #18181B;
          color: #FFFFFF;
          border-radius: var(--radius-full);
          font-weight: 600;
          padding: 10px 20px;
          margin-top: 14px;
        }

        @media (max-width: 768px) {
          .printable-paper {
            padding: 24px 16px;
          }
          .school-title {
            font-size: 18px;
          }
          .paper-meta-row {
            flex-direction: column;
            gap: 6px;
            align-items: center;
            font-size: 12px;
          }
          .student-info-lines {
            gap: 10px;
          }
          .blank-line.short {
            max-width: 100px;
          }
          .mcq-options-container {
            grid-template-columns: 1fr;
          }
          .ai-header-card {
            padding: 16px;
          }
          .ai-actions-row {
            flex-direction: column;
            align-items: stretch;
            gap: 8px;
            width: 100%;
          }
          .download-btn-pill, .regenerate-btn-pill {
            width: 100%;
            justify-content: center;
            padding: 10px 0;
          }
        }
      `}</style>
    </div>
  );
}
