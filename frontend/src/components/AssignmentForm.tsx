'use client';

import React, { useState, useEffect } from 'react';
import { UploadCloud, Plus, X, Calendar, ArrowLeft, ArrowRight, Mic } from 'lucide-react';
import { IQuestionTypeConfig } from '../store/useAssessmentStore';

interface AssignmentFormProps {
  onBack: () => void;
  onSubmit: (data: {
    title: string;
    dueDate: string;
    className: string;
    questionTypes: IQuestionTypeConfig[];
    additionalInfo: string;
    fileBase64?: string;
    fileName?: string;
  }) => void;
}

export default function AssignmentForm({ onBack, onSubmit }: AssignmentFormProps) {
  // Form States
  const [title, setTitle] = useState('Quiz on Electricity');
  const [dueDate, setDueDate] = useState('');
  const [classNameState, setClassNameState] = useState('8th');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string | undefined>(undefined);
  const [isRecording, setIsRecording] = useState(false);

  // Dynamic Question Types State (preset exactly as shown in Figma!)
  const [questionTypes, setQuestionTypes] = useState<IQuestionTypeConfig[]>([
    { type: 'Multiple Choice Questions', count: 4, marks: 1 },
    { type: 'Short Questions', count: 3, marks: 2 },
    { type: 'Diagram/Graph-Based Questions', count: 5, marks: 5 },
    { type: 'Numerical Problems', count: 5, marks: 5 }
  ]);

  // Dynamic validation messages
  const [validationError, setValidationError] = useState<string | null>(null);

  // Available options in the dropdown
  const typeOptions = [
    'Multiple Choice Questions',
    'Short Questions',
    'Long Questions',
    'Diagram/Graph-Based Questions',
    'Numerical Problems',
    'Fill in the Blanks',
    'True or False'
  ];

  // Helper to convert file to base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        setValidationError('File size exceeds the 10MB limit.');
        return;
      }
      setSelectedFile(file);
      setValidationError(null);

      const reader = new FileReader();
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        setFileBase64(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.size > 10 * 1024 * 1024) {
        setValidationError('File size exceeds 10MB limit.');
        return;
      }
      setSelectedFile(file);
      setValidationError(null);

      const reader = new FileReader();
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        setFileBase64(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  // Row Manipulation
  const handleAddRow = () => {
    setQuestionTypes([
      ...questionTypes,
      { type: 'Short Questions', count: 1, marks: 2 }
    ]);
  };

  const handleRemoveRow = (index: number) => {
    const updated = [...questionTypes];
    updated.splice(index, 1);
    setQuestionTypes(updated);
  };

  const handleRowChange = (index: number, field: 'type' | 'count' | 'marks', value: any) => {
    const updated = [...questionTypes];
    if (field === 'count' || field === 'marks') {
      const val = parseInt(value, 10);
      updated[index][field] = isNaN(val) ? 0 : val;
    } else {
      updated[index].type = value;
    }
    setQuestionTypes(updated);
  };

  // Math totals
  const totalQuestions = questionTypes.reduce((sum, q) => sum + q.count, 0);
  const totalMarks = questionTypes.reduce((sum, q) => sum + (q.count * q.marks), 0);



  const handleSpeechInput = () => {
    if (!('webkitSpeechRecognition' in window)) {
      setValidationError('Speech recognition not supported in this browser.');
      return;
    }

    const windowWithSpeech = window as any;
    const SpeechRecognition = windowWithSpeech.SpeechRecognition || windowWithSpeech.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setAdditionalInfo((prev) => prev ? `${prev} ${text}` : text);
      setIsRecording(false);
    };

    recognition.onerror = () => {
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    if (isRecording) {
      recognition.stop();
    } else {
      recognition.start();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Validations
    if (!title.trim()) {
      setValidationError('Please specify an assignment topic/title.');
      return;
    }
    if (!dueDate) {
      setValidationError('Please select a due date.');
      return;
    }
    if (questionTypes.length === 0) {
      setValidationError('Please add at least one question type row.');
      return;
    }

    for (const q of questionTypes) {
      if (q.count <= 0 || q.marks <= 0) {
        setValidationError('Number of questions and marks per question must be positive values.');
        return;
      }
    }

    onSubmit({
      title,
      dueDate,
      className: classNameState,
      questionTypes,
      additionalInfo,
      fileBase64,
      fileName: selectedFile?.name
    });
  };

  return (
    <form className="assignment-form" onSubmit={handleSubmit}>
      {/* 2-Step Progress Indicator */}
      <div className="progress-bar-container no-print">
        <div className="step-bar active" style={{ width: '50%' }}></div>
        <div className="step-bar inactive" style={{ width: '50%' }}></div>
      </div>

      <div className="form-card">
        <div className="form-header">
          <h2>Assignment Details</h2>
          <p>Basic information about your assignment</p>
        </div>

        {/* Dynamic Topic Title Input */}
        <div className="input-group title-input-group">
          <label htmlFor="topic-title">Assignment Topic / Title</label>
          <input
            id="topic-title"
            type="text"
            placeholder="e.g. Quiz on Electricity"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="form-input"
            required
          />
        </div>

        {/* Upload dashed area */}
        <div 
          className="upload-area"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="file-upload-input"
            style={{ display: 'none' }}
            onChange={handleFileChange}
            accept=".png,.jpg,.jpeg,.pdf,.txt"
          />
          <UploadCloud size={32} className="upload-icon" />
          <p className="upload-text">Choose a file or drag & drop it here</p>
          <p className="upload-subtext">JPEG, PNG, PDF, TXT upto 10MB</p>
          
          <label htmlFor="file-upload-input" className="browse-btn">
            Browse Files
          </label>

          {selectedFile && (
            <div className="selected-file-chip">
              <span>{selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
              <button type="button" onClick={() => { setSelectedFile(null); setFileBase64(undefined); }}>
                <X size={14} />
              </button>
            </div>
          )}
        </div>
        <span className="upload-hint">Upload images/documents of your preferred syllabus or reference material</span>

        {/* Due Date & Class Selection row */}
        <div className="form-grid-row">
          <div className="input-group">
            <label htmlFor="due-date">Due Date</label>
            <div className="date-input-wrapper">
              <input
                type="date"
                id="due-date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
                className="form-input date-input"
              />
              <Calendar size={18} className="calendar-icon-indicator" />
            </div>
          </div>

          <div className="input-group select-wrapper">
            <label htmlFor="class-grade">Class / Grade</label>
            <select
              id="class-grade"
              value={classNameState}
              onChange={(e) => setClassNameState(e.target.value)}
              className="select-input form-input-select"
              style={{ padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-app)', fontSize: '14px', fontWeight: '600', width: '100%', cursor: 'pointer' }}
            >
              <option value="5th">Class 5th</option>
              <option value="6th">Class 6th</option>
              <option value="7th">Class 7th</option>
              <option value="8th">Class 8th</option>
              <option value="9th">Class 9th</option>
              <option value="10th">Class 10th</option>
              <option value="11th">Class 11th</option>
              <option value="12th">Class 12th</option>
            </select>
          </div>
        </div>

        {/* Question Types table - Desktop View */}
        <div className="question-types-section desktop-only">
          <div className="table-header-row">
            <span className="col-type">Question Type</span>
            <span className="col-count text-center">No. of Questions</span>
            <span className="col-marks text-center">Marks</span>
            <span className="col-action"></span>
          </div>

          <div className="table-body">
            {questionTypes.map((row, idx) => (
              <div className="table-row" key={idx}>
                <div className="col-type select-wrapper">
                  <select
                    value={row.type}
                    onChange={(e) => handleRowChange(idx, 'type', e.target.value)}
                    className="select-input"
                  >
                    {typeOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                
                {/* Counter widgets in custom styled grey pills */}
                <div className="col-count counter-wrapper">
                  <div className="counter-pill">
                    <button
                      type="button"
                      onClick={() => handleRowChange(idx, 'count', Math.max(0, row.count - 1))}
                    >
                      —
                    </button>
                    <span>{row.count}</span>
                    <button
                      type="button"
                      onClick={() => handleRowChange(idx, 'count', row.count + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="col-marks counter-wrapper">
                  <div className="counter-pill">
                    <button
                      type="button"
                      onClick={() => handleRowChange(idx, 'marks', Math.max(0, row.marks - 1))}
                    >
                      —
                    </button>
                    <span>{row.marks}</span>
                    <button
                      type="button"
                      onClick={() => handleRowChange(idx, 'marks', row.marks + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="col-action">
                  <button type="button" className="delete-row-btn" onClick={() => handleRemoveRow(idx)}>
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Question Types Stack - Mobile View */}
        <div className="question-types-section mobile-only">
          <label className="section-label">Question Types</label>
          <div className="stack-container">
            {questionTypes.map((row, idx) => (
              <div className="mobile-question-card" key={idx}>
                <div className="mobile-card-header">
                  <select
                    value={row.type}
                    onChange={(e) => handleRowChange(idx, 'type', e.target.value)}
                    className="select-input"
                  >
                    {typeOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  <button type="button" className="delete-row-btn" onClick={() => handleRemoveRow(idx)}>
                    <X size={16} />
                  </button>
                </div>

                <div className="mobile-card-body">
                  <div className="mobile-body-pill-container">
                    <div className="control-col">
                      <span className="control-label">No. of Questions</span>
                      <div className="counter-pill">
                        <button
                          type="button"
                          onClick={() => handleRowChange(idx, 'count', Math.max(0, row.count - 1))}
                        >
                          —
                        </button>
                        <span>{row.count}</span>
                        <button
                          type="button"
                          onClick={() => handleRowChange(idx, 'count', row.count + 1)}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="divider-vertical"></div>

                    <div className="control-col">
                      <span className="control-label">Marks</span>
                      <div className="counter-pill">
                        <button
                          type="button"
                          onClick={() => handleRowChange(idx, 'marks', Math.max(0, row.marks - 1))}
                        >
                          —
                        </button>
                        <span>{row.marks}</span>
                        <button
                          type="button"
                          onClick={() => handleRowChange(idx, 'marks', row.marks + 1)}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add Question Row CTA */}
        <button type="button" className="add-row-cta" onClick={handleAddRow}>
          <div className="add-icon-circle">
            <Plus size={14} color="white" />
          </div>
          <span>Add Question Type</span>
        </button>

        {/* Dynamic Totals */}
        <div className="totals-display">
          <p>Total Questions : <span className="total-val">{totalQuestions}</span></p>
          <p>Total Marks : <span className="total-val">{totalMarks}</span></p>
        </div>

        {/* Additional information */}
        <div className="input-group info-textarea-group">
          <label htmlFor="additional-instructions">Additional Information (For better output)</label>
          <div className="textarea-wrapper">
            <textarea
              id="additional-instructions"
              placeholder="e.g. Generate a question paper for 3 hour exam duration..."
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              className="form-textarea"
            />
            <button 
              type="button" 
              className={`mic-icon-btn ${isRecording ? 'recording' : ''}`}
              onClick={handleSpeechInput}
              title="Voice Input"
            >
              <Mic size={16} />
            </button>
          </div>
        </div>

        {validationError && (
          <div className="error-alert">
            <span>{validationError}</span>
          </div>
        )}
      </div>

      {/* Form Navigation Actions */}
      <div className="form-actions-bar no-print">
        <button type="button" className="prev-action-btn" onClick={onBack}>
          <ArrowLeft size={16} />
          <span>Previous</span>
        </button>
        <button type="submit" className="next-action-btn">
          <span>Next</span>
          <ArrowRight size={16} />
        </button>
      </div>

      <style jsx>{`
        .assignment-form {
          width: 100%;
          max-width: 800px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 20px;
          padding-bottom: 80px;
        }

        .progress-bar-container {
          display: flex;
          height: 6px;
          width: 100%;
          border-radius: var(--radius-full);
          overflow: hidden;
          background: var(--border-color);
          margin-bottom: 8px;
        }

        .step-bar {
          height: 100%;
        }

        .step-bar.active {
          background: #71717A;
        }

        .step-bar.inactive {
          background: var(--border-color);
        }

        .form-card {
          background: #FFFFFF;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 32px;
          box-shadow: var(--shadow-md);
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .form-header h2 {
          font-size: 20px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 4px;
        }

        .form-header p {
          font-size: 13px;
          color: var(--text-secondary);
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-grid-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        @media (max-width: 768px) {
          .form-grid-row {
            grid-template-columns: 1fr;
            gap: 16px;
          }
        }

        .input-group label {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .form-input {
          width: 100%;
          padding: 12px 16px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-color);
          background: var(--bg-app);
          font-size: 14px;
          transition: var(--transition-smooth);
        }

        .form-input:focus {
          border-color: var(--border-focus);
          outline: none;
          background: #FFFFFF;
        }

        .title-input-group .form-input {
          font-weight: 600;
          font-size: 15px;
        }

        /* Upload Area */
        .upload-area {
          border: 2px dashed #D4D4D8;
          border-radius: var(--radius-md);
          padding: 32px 16px;
          text-align: center;
          background: var(--bg-card-hover);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          transition: var(--transition-smooth);
        }

        .upload-area:hover {
          border-color: #71717A;
          background: #FFFFFF;
        }

        .upload-icon {
          color: var(--text-secondary);
          margin-bottom: 12px;
        }

        .upload-text {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 4px;
        }

        .upload-subtext {
          font-size: 11px;
          color: var(--text-tertiary);
          margin-bottom: 16px;
        }

        .browse-btn {
          background: #F4F4F5;
          color: var(--text-primary);
          font-size: 13px;
          font-weight: 600;
          padding: 8px 18px;
          border-radius: var(--radius-full);
          border: 1px solid var(--border-color);
          cursor: pointer;
          transition: var(--transition-smooth);
        }

        .browse-btn:hover {
          background: #E4E4E7;
        }

        .selected-file-chip {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 14px;
          background: var(--border-color);
          padding: 6px 12px;
          border-radius: var(--radius-full);
          font-size: 12px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .selected-file-chip button {
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-secondary);
        }

        .selected-file-chip button:hover {
          color: var(--color-error);
        }

        .upload-hint {
          font-size: 12px;
          color: var(--text-secondary);
          text-align: center;
          margin-top: -12px;
        }

        /* Due Date Input */
        .date-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .date-input {
          padding-right: 46px;
        }

        .calendar-icon-indicator {
          position: absolute;
          right: 16px;
          color: var(--text-secondary);
          pointer-events: none;
        }

        /* Question Types Desktop Table styling */
        .question-types-section {
          width: 100%;
        }

        .table-header-row {
          display: flex;
          padding: 8px 0;
          border-bottom: 1.5px solid var(--border-color);
          font-size: 12px;
          font-weight: 700;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .col-type {
          flex: 2;
        }

        .col-count {
          flex: 1.2;
        }

        .col-marks {
          flex: 1;
        }

        .col-action {
          width: 40px;
          display: flex;
          justify-content: flex-end;
        }

        .text-center {
          text-align: center;
        }

        .table-body {
          display: flex;
          flex-direction: column;
        }

        .table-row {
          display: flex;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid var(--border-color);
        }

        .select-wrapper {
          position: relative;
        }

        .select-input {
          width: 95%;
          padding: 10px 14px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-color);
          background: var(--bg-app);
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
          transition: var(--transition-smooth);
          cursor: pointer;
        }

        .select-input:focus {
          border-color: var(--border-focus);
          background: #FFFFFF;
          outline: none;
        }

        .counter-wrapper {
          display: flex;
          justify-content: center;
        }

        /* Figma counter pill styling */
        .counter-pill {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: var(--bg-app);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-full);
          padding: 6px 14px;
          width: 100px;
        }

        .counter-pill button {
          font-size: 14px;
          font-weight: 700;
          color: var(--text-secondary);
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: var(--transition-smooth);
        }

        .counter-pill button:hover {
          color: var(--text-primary);
        }

        .counter-pill span {
          font-size: 14px;
          font-weight: 700;
          color: var(--text-primary);
          user-select: none;
        }

        .delete-row-btn {
          color: var(--text-tertiary);
          transition: var(--transition-smooth);
          padding: 4px;
        }

        .delete-row-btn:hover {
          color: var(--color-error);
        }

        /* Add row CTA */
        .add-row-cta {
          display: flex;
          align-items: center;
          gap: 10px;
          align-self: flex-start;
          color: var(--text-primary);
          font-size: 14px;
          font-weight: 700;
          margin-top: 4px;
          transition: var(--transition-smooth);
        }

        .add-row-cta:hover {
          color: var(--orange-primary);
        }

        .add-icon-circle {
          background: #18181B;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Totals block */
        .totals-display {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
          align-self: flex-end;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .total-val {
          font-size: 15px;
          font-weight: 800;
          color: var(--text-primary);
        }

        /* Info Textarea */
        .textarea-wrapper {
          position: relative;
          display: flex;
        }

        .form-textarea {
          width: 100%;
          height: 100px;
          padding: 12px 46px 12px 16px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-color);
          background: var(--bg-app);
          font-size: 13px;
          resize: none;
          transition: var(--transition-smooth);
        }

        .form-textarea:focus {
          border-color: var(--border-focus);
          background: #FFFFFF;
          outline: none;
        }

        .mic-icon-btn {
          position: absolute;
          right: 16px;
          bottom: 12px;
          color: var(--text-secondary);
          padding: 6px;
          border-radius: 50%;
          background: var(--border-color);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: var(--transition-smooth);
        }

        .mic-icon-btn.recording {
          background: var(--color-error);
          color: white;
          animation: pulse 1.5s infinite;
        }

        .mic-icon-btn:hover {
          color: var(--text-primary);
        }

        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }

        .error-alert {
          background: #FEF2F2;
          border: 1px solid #FCA5A5;
          color: #DC2626;
          border-radius: var(--radius-md);
          padding: 12px 16px;
          font-size: 13px;
          font-weight: 600;
        }

        /* Form Actions Navigation Bar */
        .form-actions-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 10px;
          width: 100%;
        }

        .prev-action-btn {
          background: #FFFFFF;
          color: var(--text-primary);
          border: 1px solid var(--border-color);
          padding: 12px 24px;
          border-radius: var(--radius-full);
          font-weight: 600;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: var(--shadow-sm);
          transition: var(--transition-smooth);
        }

        .prev-action-btn:hover {
          background: var(--bg-app);
          transform: translateX(-2px);
        }

        .next-action-btn {
          background: #18181B;
          color: #FFFFFF;
          padding: 12px 24px;
          border-radius: var(--radius-full);
          font-weight: 600;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: var(--shadow-sm);
          transition: var(--transition-smooth);
        }

        .next-action-btn:hover {
          background: #27272A;
          transform: translateX(2px);
        }

        /* Mobile specific layouts */
        .mobile-only {
          display: none;
        }

        @media (max-width: 768px) {
          .desktop-only {
            display: none !important;
          }
          .mobile-only {
            display: block !important;
          }
          .stack-container {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }
          .form-card {
            padding: 20px;
          }
          .totals-display {
            align-self: flex-start;
            align-items: flex-start;
          }

          /* Mobile custom card style */
          .mobile-question-card {
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-md);
            padding: 16px;
            margin-bottom: 12px;
            box-shadow: var(--shadow-sm);
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .mobile-card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 8px;
          }

          .mobile-card-header .select-input {
            width: 85%;
          }

          .mobile-card-body {
            background: var(--bg-app);
            border-radius: var(--radius-md);
            padding: 10px;
          }

          .mobile-body-pill-container {
            display: flex;
            justify-content: space-around;
            align-items: center;
          }

          .control-col {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
          }

          .control-label {
            font-size: 10px;
            font-weight: 700;
            color: var(--text-secondary);
            text-transform: uppercase;
          }

          .divider-vertical {
            width: 1px;
            background: var(--border-color);
            height: 40px;
          }

          .mobile-question-card .counter-pill {
            width: 90px;
            padding: 4px 10px;
          }
        }
      `}</style>
    </form>
  );
}
