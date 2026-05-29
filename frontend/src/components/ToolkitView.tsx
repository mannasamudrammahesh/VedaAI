import React, { useState } from 'react';
import { BookOpen, Edit3, Mail, Sparkles, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';

interface ToolkitViewProps {
  showToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, message?: string) => void;
}

export default function ToolkitView({ showToast }: ToolkitViewProps) {
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [secondaryInput, setSecondaryInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const tools = [
    {
      id: 'lesson-plan',
      title: 'Lesson Plan Generator',
      description: 'Generate a structured 45-minute lesson plan based on a topic.',
      icon: <BookOpen size={24} color="#F97316" />,
      inputLabel: 'What topic are you teaching?',
      inputPlaceholder: 'e.g., The Water Cycle for 8th Grade',
      secondaryLabel: 'Any specific focus?',
      secondaryPlaceholder: 'e.g., Focus on evaporation and condensation'
    },
    {
      id: 'essay-grader',
      title: 'Automated Essay Grader',
      description: 'Paste a student essay to get instant rubric-based feedback and grading.',
      icon: <Edit3 size={24} color="#8B5CF6" />,
      inputLabel: 'Paste the student essay here:',
      inputPlaceholder: 'Student essay content...',
      secondaryLabel: 'Grading Rubric / Grade Level:',
      secondaryPlaceholder: 'e.g., 10th Grade English, focus on grammar and thesis'
    },
    {
      id: 'parent-email',
      title: 'Parent Email Drafter',
      description: 'Instantly draft a professional email to parents regarding a student.',
      icon: <Mail size={24} color="#10B981" />,
      inputLabel: 'What is the email about?',
      inputPlaceholder: 'e.g., John has been doing excellent in math, but missing homework.',
      secondaryLabel: 'Tone of the email:',
      secondaryPlaceholder: 'e.g., Encouraging but firm'
    }
  ];

  const handleToolClick = (toolId: string) => {
    setActiveTool(toolId);
    setResult(null);
    setInputText('');
    setSecondaryInput('');
  };

  const handleGenerate = async () => {
    if (!inputText.trim()) {
      showToast('warning', 'Missing Input', 'Please provide the primary input.');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/ai/toolkit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('veda_token')}`
        },
        body: JSON.stringify({
          toolId: activeTool,
          input: inputText,
          secondaryInput: secondaryInput
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate content');
      }

      const data = await response.json();
      setResult(data.result);
      showToast('success', 'Generated successfully!');
    } catch (error) {
      console.error('Toolkit generation error:', error);
      showToast('error', 'Generation Failed', 'There was an error generating the content.');
    } finally {
      setLoading(false);
    }
  };

  const activeToolData = tools.find(t => t.id === activeTool);

  return (
    <div className="toolkit-container" style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      
      {!activeTool ? (
        <>
          <div className="toolkit-header" style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <Sparkles size={28} color="#F97316" />
              <h1 style={{ fontSize: '28px', color: '#18181B', margin: 0 }}>AI Teacher's Toolkit</h1>
            </div>
            <p style={{ color: '#71717A', fontSize: '16px', margin: 0 }}>
              A suite of advanced AI micro-tools to automate your daily workflows.
            </p>
          </div>

          <div className="tools-grid" style={{ gap: '20px' }}>
            {tools.map((tool) => (
              <div 
                key={tool.id} 
                className="tool-card glass-panel" 
                onClick={() => handleToolClick(tool.id)}
                style={{ 
                  padding: '24px', 
                  borderRadius: '16px', 
                  background: '#FFFFFF', 
                  border: '1px solid #E4E4E7',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#F97316';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E4E4E7';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div className="tool-icon-wrapper" style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {tool.icon}
                </div>
                <div>
                  <h3 style={{ margin: '0 0 8px 0', color: '#18181B', fontSize: '18px' }}>{tool.title}</h3>
                  <p style={{ margin: 0, color: '#71717A', fontSize: '14px', lineHeight: 1.5 }}>
                    {tool.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="tool-workspace">
          <button 
            onClick={() => setActiveTool(null)}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', 
              background: 'none', border: 'none', color: '#71717A', 
              cursor: 'pointer', marginBottom: '24px', padding: 0,
              fontSize: '14px', fontWeight: 500
            }}
          >
            <ArrowLeft size={16} />
            Back to Toolkit
          </button>

          <div className="tool-workspace-card" style={{ background: '#FFFFFF', border: '1px solid #E4E4E7', borderRadius: '16px', padding: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {activeToolData?.icon}
              </div>
              <div>
                <h2 style={{ margin: '0 0 4px 0', color: '#18181B', fontSize: '24px' }}>{activeToolData?.title}</h2>
                <p style={{ margin: 0, color: '#71717A' }}>{activeToolData?.description}</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#18181B' }}>
                  {activeToolData?.inputLabel}
                </label>
                <textarea 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={activeToolData?.inputPlaceholder}
                  style={{ 
                    width: '100%', minHeight: '120px', padding: '16px', 
                    borderRadius: '12px', border: '1px solid #E4E4E7',
                    fontFamily: 'inherit', resize: 'vertical',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#F97316'}
                  onBlur={(e) => e.target.style.borderColor = '#E4E4E7'}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#18181B' }}>
                  {activeToolData?.secondaryLabel}
                </label>
                <input 
                  type="text"
                  value={secondaryInput}
                  onChange={(e) => setSecondaryInput(e.target.value)}
                  placeholder={activeToolData?.secondaryPlaceholder}
                  style={{ 
                    width: '100%', padding: '16px', 
                    borderRadius: '12px', border: '1px solid #E4E4E7',
                    fontFamily: 'inherit',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#F97316'}
                  onBlur={(e) => e.target.style.borderColor = '#E4E4E7'}
                />
              </div>

              <button 
                onClick={handleGenerate}
                disabled={loading}
                style={{ 
                  background: loading ? '#FDBA74' : '#F97316', 
                  color: 'white', 
                  border: 'none', 
                  padding: '16px 24px', 
                  borderRadius: '12px',
                  fontWeight: 600,
                  fontSize: '16px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginTop: '8px',
                  transition: 'background 0.2s ease'
                }}
              >
                {loading ? <Loader2 size={20} className="spin" /> : <Sparkles size={20} />}
                {loading ? 'Generating...' : 'Generate with AI'}
              </button>
            </div>

            {result && (
              <div style={{ marginTop: '40px', paddingTop: '32px', borderTop: '1px solid #E4E4E7' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <CheckCircle size={20} color="#10B981" />
                  <h3 style={{ margin: 0, color: '#18181B' }}>Result</h3>
                </div>
                <div 
                  style={{ 
                    background: '#FAFAFA', 
                    padding: '24px', 
                    borderRadius: '12px',
                    border: '1px solid #E4E4E7',
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.6,
                    color: '#27272A'
                  }}
                  dangerouslySetInnerHTML={{ __html: result.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}
                />
              </div>
            )}
          </div>
        </div>
      )}
      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        
        .tools-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        }

        @media (max-width: 768px) {
          .toolkit-container {
            padding: 16px !important;
            padding-bottom: 120px !important; /* Space for MobileNav */
          }
          .tools-grid {
            grid-template-columns: 1fr !important;
          }
          .tool-workspace-card {
            padding: 16px !important;
          }
        }
      `}</style>
    </div>
  );
}
