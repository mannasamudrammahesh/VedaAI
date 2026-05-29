import { create } from 'zustand';

export interface IQuestion {
  text: string;
  difficulty: 'Easy' | 'Moderate' | 'Challenging';
  marks: number;
}

export interface ISection {
  sectionName: string;
  title: string;
  instruction: string;
  questions: IQuestion[];
}

export interface IAnswerKeyItem {
  questionNumber: string;
  answer: string;
}

export interface IGeneratedPaper {
  schoolName: string;
  subject: string;
  className: string;
  timeAllowed: string;
  maxMarks: number;
  sections: ISection[];
  answerKey: IAnswerKeyItem[];
  aiMessage?: string;
}

export interface IQuestionTypeConfig {
  type: string;
  count: number;
  marks: number;
}

export interface IAssignment {
  _id: string;
  title: string;
  dueDate: string;
  assignedDate: string;
  questionTypes: IQuestionTypeConfig[];
  totalQuestions: number;
  totalMarks: number;
  additionalInfo?: string;
  fileName?: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  error?: string;
  generatedPaper?: IGeneratedPaper;
  createdAt: string;
}

interface JobProgress {
  assignmentId: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  progress: number;
  message: string;
  paper?: IGeneratedPaper;
  error?: string;
}

export interface IUser {
  id: string;
  name: string;
  email: string;
}

interface AssessmentState {
  assignments: IAssignment[];
  loading: boolean;
  activeJob: JobProgress | null;
  selectedAssignment: IAssignment | null;
  websocketConnected: boolean;
  
  // Auth state
  user: IUser | null;
  token: string | null;
  isAuthenticated: boolean;
  authLoading: boolean;

  fetchAssignments: () => Promise<void>;
  fetchAssignmentDetails: (id: string) => Promise<IAssignment | null>;
  createAssignment: (payload: {
    title: string;
    dueDate: string;
    questionTypes: IQuestionTypeConfig[];
    additionalInfo: string;
    fileBase64?: string;
    fileName?: string;
    className?: string;
  }) => Promise<IAssignment | null>;
  deleteAssignment: (id: string) => Promise<void>;
  regenerateAssignment: (id: string) => Promise<void>;
  subscribeToJob: (assignmentId: string) => void;
  unsubscribeFromJob: () => void;
  resetActiveJob: () => void;
  setSelectedAssignment: (assignment: IAssignment | null) => void;

  // Auth actions
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loadAuthFromStorage: () => void;
}

let defaultApiUrl = 'http://localhost:5000';
let defaultWsUrl = 'ws://localhost:5000/ws';

if (typeof window !== 'undefined') {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  const wsProtocol = protocol === 'https:' ? 'wss:' : 'ws:';
  
  if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
    defaultApiUrl = `${protocol}//${hostname}:5000`;
    defaultWsUrl = `${wsProtocol}//${hostname}:5000/ws`;
  }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || defaultApiUrl;
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || defaultWsUrl;

async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  try {
    const response = await fetch(input, init);
    return response;
  } catch (err: any) {
    if (err instanceof TypeError && (err.message.toLowerCase().includes('fetch') || err.message.toLowerCase().includes('networkerror'))) {
      const targetUrl = typeof input === 'string' ? input : (input as any).url || 'the backend';
      throw new Error(
        `Failed to connect to backend. Please ensure the backend server is running and your ` +
        `NEXT_PUBLIC_API_URL environment variable is set correctly in your Netlify or Vercel UI (settings -> environment variables). ` +
        `Target: ${targetUrl}. Fallback URL: ${API_URL}`
      );
    }
    throw err;
  }
}

let socket: WebSocket | null = null;

export const useAssessmentStore = create<AssessmentState>((set, get) => ({
  assignments: [],
  loading: false,
  activeJob: null,
  selectedAssignment: null,
  websocketConnected: false,

  // Auth state defaults
  user: null,
  token: null,
  isAuthenticated: false,
  authLoading: false,

  fetchAssignments: async () => {
    set({ loading: true });
    try {
      const res = await apiFetch(`${API_URL}/api/assignments`, {
        headers: {
          'Authorization': `Bearer ${get().token}`
        }
      });
      const data = await res.json();
      set({ assignments: Array.isArray(data) ? data : [], loading: false });
    } catch (err) {
      console.error('Error fetching assignments:', err);
      set({ loading: false });
    }
  },

  fetchAssignmentDetails: async (id: string) => {
    try {
      const res = await apiFetch(`${API_URL}/api/assignments/${id}`, {
        headers: {
          'Authorization': `Bearer ${get().token}`
        }
      });
      if (!res.ok) return null;
      const data = await res.json();
      set({ selectedAssignment: data });
      return data;
    } catch (err) {
      console.error('Error fetching assignment details:', err);
      return null;
    }
  },

  createAssignment: async (payload) => {
    try {
      const res = await apiFetch(`${API_URL}/api/assignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${get().token}`
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to submit assignment form');
      }

      const newAssignment = await res.json();
      
      // Update UI state
      set((state) => ({
        assignments: [newAssignment, ...state.assignments],
        activeJob: {
          assignmentId: newAssignment._id,
          status: 'pending',
          progress: 5,
          message: 'Assignment submitted to queue...'
        }
      }));

      // Immediately connect WebSocket and subscribe
      get().subscribeToJob(newAssignment._id);

      return newAssignment;
    } catch (err) {
      console.error('Error in createAssignment:', err);
      throw err;
    }
  },

  deleteAssignment: async (id: string) => {
    try {
      const res = await apiFetch(`${API_URL}/api/assignments/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${get().token}`
        }
      });
      if (res.ok) {
        set((state) => ({
          assignments: state.assignments.filter((a) => a._id !== id),
          selectedAssignment: state.selectedAssignment?._id === id ? null : state.selectedAssignment
        }));
      }
    } catch (err) {
      console.error('Error deleting assignment:', err);
    }
  },

  regenerateAssignment: async (id: string) => {
    try {
      set({
        activeJob: {
          assignmentId: id,
          status: 'pending',
          progress: 5,
          message: 'Requesting new paper parameters...'
        }
      });

      const res = await apiFetch(`${API_URL}/api/assignments/${id}/regenerate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${get().token}`
        }
      });
      
      if (!res.ok) {
        throw new Error('Failed to trigger paper regeneration');
      }

      const updated = await res.json();
      
      // Subscribe to real-time job progress
      get().subscribeToJob(id);

    } catch (err) {
      console.error('Error regenerating assignment:', err);
      set({ activeJob: null });
    }
  },

  subscribeToJob: (assignmentId: string) => {
    // If socket is already open, close it
    if (socket) {
      socket.close();
    }

    console.log(`Connecting to WebSocket: ${WS_URL}`);
    socket = new WebSocket(WS_URL);

    socket.onopen = () => {
      console.log('WebSocket connected.');
      set({ websocketConnected: true });
      
      // Subscribe to assignment events
      socket?.send(JSON.stringify({
        type: 'SUBSCRIBE_JOB',
        data: { assignmentId }
      }));
    };

    socket.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        console.log('WS Message received:', parsed);

        if (parsed.type === 'JOB_PROGRESS') {
          const progressData: JobProgress = parsed.data;
          set({ activeJob: progressData });

          if (progressData.status === 'completed' || progressData.status === 'failed') {
            console.log(`Job complete: ${progressData.status}. Refreshing listings.`);
            get().fetchAssignments();
            if (progressData.status === 'completed' && progressData.paper) {
              // Update selected assessment details
              get().fetchAssignmentDetails(assignmentId);
            }
            get().unsubscribeFromJob();
          }
        }
      } catch (err) {
        console.error('Error parsing WS message:', err);
      }
    };

    socket.onclose = () => {
      console.log('WebSocket connection closed.');
      set({ websocketConnected: false });
    };

    socket.onerror = (err) => {
      console.error('WebSocket encountered an error:', err);
    };
  },

  unsubscribeFromJob: () => {
    if (socket) {
      socket.close();
      socket = null;
    }
    set({ websocketConnected: false });
  },

  resetActiveJob: () => {
    set({ activeJob: null });
  },

  setSelectedAssignment: (assignment) => {
    set({ selectedAssignment: assignment });
  },

  // ─── AUTH ACTIONS ──────────────────────────────────────────────

  login: async (email, password) => {
    set({ authLoading: true });
    try {
      const res = await apiFetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Persist to local storage
      if (typeof window !== 'undefined') {
        localStorage.setItem('veda_token', data.token);
        localStorage.setItem('veda_user', JSON.stringify(data.user));
      }

      set({
        token: data.token,
        user: data.user,
        isAuthenticated: true,
        authLoading: false
      });

      // Instantly load user's assignments
      get().fetchAssignments();
    } catch (err) {
      set({ authLoading: false });
      throw err;
    }
  },

  register: async (name, email, password) => {
    set({ authLoading: true });
    try {
      const res = await apiFetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Persist to local storage
      if (typeof window !== 'undefined') {
        localStorage.setItem('veda_token', data.token);
        localStorage.setItem('veda_user', JSON.stringify(data.user));
      }

      set({
        token: data.token,
        user: data.user,
        isAuthenticated: true,
        authLoading: false
      });

      // Load assignments (will be empty except for newly created seeded user, if seeded)
      get().fetchAssignments();
    } catch (err) {
      set({ authLoading: false });
      throw err;
    }
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('veda_token');
      localStorage.removeItem('veda_user');
    }
    set({
      token: null,
      user: null,
      isAuthenticated: false,
      assignments: [],
      selectedAssignment: null,
      activeJob: null
    });
  },

  loadAuthFromStorage: () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('veda_token');
    const userJson = localStorage.getItem('veda_user');
    if (token && userJson) {
      set({
        token,
        user: JSON.parse(userJson),
        isAuthenticated: true
      });
      // Load assignments since we are already authenticated
      get().fetchAssignments();
    }
  }
}));
