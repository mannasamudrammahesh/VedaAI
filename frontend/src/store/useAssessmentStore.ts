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

// ─── DEMO DATA ──────────────────────────────────────────────────────────────
// When the demo account (teacher@veda.ai) has no assignments in the DB,
// we inject these rich mock assignments directly in the frontend so the UI
// always has content to demonstrate the product — no backend restart needed.

const DEMO_EMAIL = 'teacher@veda.ai';

const DEMO_ASSIGNMENTS: IAssignment[] = [
  {
    _id: 'demo-1',
    title: 'Quiz on Electricity & Circuits',
    dueDate: '2025-07-15T00:00:00.000Z',
    assignedDate: '2025-07-01T00:00:00.000Z',
    questionTypes: [{ type: 'MCQs', count: 3, marks: 2 }, { type: 'Short Answers', count: 2, marks: 5 }],
    totalQuestions: 5,
    totalMarks: 16,
    status: 'completed',
    createdAt: '2025-07-01T08:00:00.000Z',
    generatedPaper: {
      schoolName: 'Delhi Public School, Vadodara, Gujarat',
      subject: 'Science (Physics)',
      className: 'Grade 8',
      timeAllowed: '45 mins',
      maxMarks: 16,
      sections: [
        {
          sectionName: 'Section A',
          title: 'Multiple Choice Questions (MCQs)',
          instruction: 'Select the single most correct alternative.',
          questions: [
            { text: 'Which of the following is a good conductor of electricity?', difficulty: 'Easy', marks: 2 },
            { text: 'The process of electroplating is used for:', difficulty: 'Moderate', marks: 2 },
            { text: 'Pure distilled water is a non-conductor of electricity because:', difficulty: 'Moderate', marks: 2 }
          ]
        },
        {
          sectionName: 'Section B',
          title: 'Short Answer Questions',
          instruction: 'Provide brief conceptual justifications.',
          questions: [
            { text: 'Why does tap water conduct electricity while distilled water does not?', difficulty: 'Easy', marks: 5 },
            { text: 'Explain how a copper coin can be electroplated with silver.', difficulty: 'Challenging', marks: 5 }
          ]
        }
      ],
      answerKey: [
        { questionNumber: '1', answer: 'a) Copper — has free electrons that allow current flow.' },
        { questionNumber: '2', answer: 'b) Coating metals with a protective or decorative layer using electrolysis.' },
        { questionNumber: '3', answer: 'd) Distilled water lacks dissolved salts and ions.' },
        { questionNumber: '4', answer: 'Tap water contains dissolved mineral salts that act as charge-carrying ions.' },
        { questionNumber: '5', answer: 'Connect the copper coin (cathode) and silver plate (anode) in a silver nitrate solution and pass DC current.' }
      ],
      aiMessage: 'Here is your customised Question Paper for CBSE Grade 8 Science — Electricity chapter.'
    }
  },
  {
    _id: 'demo-2',
    title: 'Chapter Test: Light – Reflection & Refraction',
    dueDate: '2025-07-20T00:00:00.000Z',
    assignedDate: '2025-07-10T00:00:00.000Z',
    questionTypes: [{ type: 'MCQs', count: 5, marks: 1 }, { type: 'Short Answers', count: 3, marks: 4 }, { type: 'Long Answers', count: 1, marks: 7 }],
    totalQuestions: 9,
    totalMarks: 24,
    status: 'completed',
    createdAt: '2025-07-10T09:00:00.000Z',
    generatedPaper: {
      schoolName: 'Delhi Public School, Vadodara, Gujarat',
      subject: 'Science (Physics)',
      className: 'Grade 10',
      timeAllowed: '60 mins',
      maxMarks: 24,
      sections: [
        {
          sectionName: 'Section A',
          title: 'Multiple Choice Questions',
          instruction: 'Choose the best option.',
          questions: [
            { text: 'The angle of incidence equals the angle of reflection. This is the law of:', difficulty: 'Easy', marks: 1 },
            { text: 'A concave mirror with focal length 10 cm forms a real image when the object is placed at:', difficulty: 'Moderate', marks: 1 },
            { text: 'Which phenomenon causes a pencil to appear bent when placed in water?', difficulty: 'Easy', marks: 1 },
            { text: 'The refractive index of glass with respect to air is 1.5. The speed of light in glass is:', difficulty: 'Moderate', marks: 1 },
            { text: 'A convex lens is also called a _____ lens.', difficulty: 'Easy', marks: 1 }
          ]
        },
        {
          sectionName: 'Section B',
          title: 'Short Answer Questions',
          instruction: 'Answer in 3–4 sentences.',
          questions: [
            { text: 'State and explain the two laws of reflection.', difficulty: 'Easy', marks: 4 },
            { text: 'Differentiate between real and virtual images with one example each.', difficulty: 'Moderate', marks: 4 },
            { text: 'Define refractive index and state its formula.', difficulty: 'Moderate', marks: 4 }
          ]
        },
        {
          sectionName: 'Section C',
          title: 'Long Answer Question',
          instruction: 'Answer in detail with a labelled diagram where required.',
          questions: [
            { text: 'Draw a ray diagram showing image formation by a concave mirror when an object is placed beyond the centre of curvature. State the nature, position and size of the image.', difficulty: 'Challenging', marks: 7 }
          ]
        }
      ],
      answerKey: [
        { questionNumber: '1', answer: 'Reflection' },
        { questionNumber: '2', answer: 'Beyond the focal point (beyond F)' },
        { questionNumber: '3', answer: 'Refraction' },
        { questionNumber: '4', answer: '2 × 10⁸ m/s  (v = c/n = 3×10⁸/1.5)' },
        { questionNumber: '5', answer: 'Converging' },
        { questionNumber: '6', answer: 'Laws of reflection: (1) angle of incidence = angle of reflection; (2) incident ray, reflected ray and normal lie in the same plane.' },
        { questionNumber: '7', answer: 'Real image: formed by actual convergence of rays, can be caught on screen. Virtual image: appears to diverge from a point, cannot be caught on screen.' },
        { questionNumber: '8', answer: 'Refractive index (n) = speed of light in vacuum / speed of light in medium = c/v.' },
        { questionNumber: '9', answer: 'Image formed beyond C, real, inverted and diminished. [Diagram required]' }
      ],
      aiMessage: 'CBSE Grade 10 Physics test on Light — Reflection and Refraction generated successfully.'
    }
  },
  {
    _id: 'demo-3',
    title: 'Unit Test: The French Revolution',
    dueDate: '2025-08-05T00:00:00.000Z',
    assignedDate: '2025-07-25T00:00:00.000Z',
    questionTypes: [{ type: 'MCQs', count: 4, marks: 1 }, { type: 'Short Answers', count: 4, marks: 3 }, { type: 'Long Answers', count: 2, marks: 6 }],
    totalQuestions: 10,
    totalMarks: 28,
    status: 'completed',
    createdAt: '2025-07-25T10:00:00.000Z',
    generatedPaper: {
      schoolName: 'Delhi Public School, Vadodara, Gujarat',
      subject: 'Social Studies (History)',
      className: 'Grade 9',
      timeAllowed: '60 mins',
      maxMarks: 28,
      sections: [
        {
          sectionName: 'Section A',
          title: 'Multiple Choice Questions',
          instruction: 'Select the correct answer.',
          questions: [
            { text: 'The French Revolution began in the year:', difficulty: 'Easy', marks: 1 },
            { text: 'The document "Declaration of the Rights of Man" was inspired by:', difficulty: 'Moderate', marks: 1 },
            { text: 'The Reign of Terror was led by:', difficulty: 'Moderate', marks: 1 },
            { text: 'The social group that bore the heaviest tax burden in pre-revolutionary France was:', difficulty: 'Easy', marks: 1 }
          ]
        },
        {
          sectionName: 'Section B',
          title: 'Short Answer Questions',
          instruction: 'Answer in 3–4 sentences each.',
          questions: [
            { text: 'What were the main causes of the French Revolution?', difficulty: 'Moderate', marks: 3 },
            { text: 'Describe the significance of the storming of the Bastille.', difficulty: 'Easy', marks: 3 },
            { text: 'Who were the Jacobins and what role did they play?', difficulty: 'Moderate', marks: 3 },
            { text: 'What was the Directory and why did it fail?', difficulty: 'Challenging', marks: 3 }
          ]
        },
        {
          sectionName: 'Section C',
          title: 'Long Answer Questions',
          instruction: 'Answer in detail.',
          questions: [
            { text: 'Analyse the socio-economic conditions in France that led to the Revolution of 1789.', difficulty: 'Challenging', marks: 6 },
            { text: 'Trace the rise of Napoleon Bonaparte and explain how the French Revolution shaped his career.', difficulty: 'Challenging', marks: 6 }
          ]
        }
      ],
      answerKey: [
        { questionNumber: '1', answer: '1789' },
        { questionNumber: '2', answer: 'American Declaration of Independence and Enlightenment ideas' },
        { questionNumber: '3', answer: 'Maximilien Robespierre' },
        { questionNumber: '4', answer: 'The Third Estate (commoners)' },
        { questionNumber: '5', answer: 'Financial crisis, social inequality (Three Estates), Enlightenment ideas, and weak leadership of Louis XVI.' },
        { questionNumber: '6', answer: 'The Bastille was a symbol of royal tyranny; its storming on 14 July 1789 marked the start of the Revolution and inspired nationwide uprising.' },
        { questionNumber: '7', answer: 'The Jacobins were a radical political club led by Robespierre; they dominated the National Convention and implemented the Reign of Terror.' },
        { questionNumber: '8', answer: 'The Directory was a five-member executive body (1795–99) that was corrupt and inefficient, leading to Napoleon\'s coup in 1799.' },
        { questionNumber: '9', answer: 'Detailed essay on fiscal bankruptcy, Estate system inequalities, food shortages, and philosophe influence.' },
        { questionNumber: '10', answer: 'Detailed account of Napoleon\'s military genius, the Revolution\'s ideals shaping his policies, and his eventual coronation.' }
      ],
      aiMessage: 'CBSE Grade 9 History unit test on The French Revolution generated successfully.'
    }
  },
  {
    _id: 'demo-4',
    title: 'Mid-Term: Algebra – Polynomials',
    dueDate: '2025-08-12T00:00:00.000Z',
    assignedDate: '2025-08-01T00:00:00.000Z',
    questionTypes: [{ type: 'MCQs', count: 5, marks: 1 }, { type: 'Short Answers', count: 4, marks: 3 }, { type: 'Long Answers', count: 1, marks: 5 }],
    totalQuestions: 10,
    totalMarks: 22,
    status: 'completed',
    createdAt: '2025-08-01T11:00:00.000Z',
    generatedPaper: {
      schoolName: 'Delhi Public School, Vadodara, Gujarat',
      subject: 'Mathematics',
      className: 'Grade 9',
      timeAllowed: '60 mins',
      maxMarks: 22,
      sections: [
        {
          sectionName: 'Section A',
          title: 'Multiple Choice Questions',
          instruction: 'Choose the correct option.',
          questions: [
            { text: 'The degree of polynomial 3x³ + 2x² − x + 5 is:', difficulty: 'Easy', marks: 1 },
            { text: 'The zeroes of polynomial p(x) = x² − 5x + 6 are:', difficulty: 'Moderate', marks: 1 },
            { text: 'Which of the following is a cubic polynomial?', difficulty: 'Easy', marks: 1 },
            { text: 'If p(x) = x² − 4, then p(2) + p(−2) =', difficulty: 'Moderate', marks: 1 },
            { text: 'The number of zeroes of a quadratic polynomial is at most:', difficulty: 'Easy', marks: 1 }
          ]
        },
        {
          sectionName: 'Section B',
          title: 'Short Answer Questions',
          instruction: 'Show all working.',
          questions: [
            { text: 'Find the zeroes of p(x) = x² − 3x − 10 and verify using the relationship between zeroes and coefficients.', difficulty: 'Moderate', marks: 3 },
            { text: 'Divide 2x³ − 3x² + 3x − 5 by x − 1 using the division algorithm.', difficulty: 'Moderate', marks: 3 },
            { text: 'If one zero of 3x² + kx − 15 is 3, find k.', difficulty: 'Challenging', marks: 3 },
            { text: 'Write the polynomial whose zeroes are 2 and −3 with leading coefficient 1.', difficulty: 'Easy', marks: 3 }
          ]
        },
        {
          sectionName: 'Section C',
          title: 'Long Answer Question',
          instruction: 'Solve completely with full justification.',
          questions: [
            { text: 'State and prove the Factor Theorem. Use it to factorise x³ − 2x² − x + 2.', difficulty: 'Challenging', marks: 5 }
          ]
        }
      ],
      answerKey: [
        { questionNumber: '1', answer: '3' },
        { questionNumber: '2', answer: '2 and 3' },
        { questionNumber: '3', answer: 'x³ + x + 1 (any degree-3 example)' },
        { questionNumber: '4', answer: '0' },
        { questionNumber: '5', answer: '2' },
        { questionNumber: '6', answer: 'Zeroes: 5 and −2. Sum = 3 = 3/1 ✓; Product = −10 = −10/1 ✓' },
        { questionNumber: '7', answer: 'Quotient: 2x² − x + 2, Remainder: −3' },
        { questionNumber: '8', answer: 'k = −6' },
        { questionNumber: '9', answer: 'x² + x − 6' },
        { questionNumber: '10', answer: 'Factor Theorem proof + factorisation: (x−1)(x+1)(x−2)' }
      ],
      aiMessage: 'CBSE Grade 9 Mathematics mid-term on Polynomials generated successfully.'
    }
  },
  {
    _id: 'demo-5',
    title: 'Science Quiz: Atoms & Molecules',
    dueDate: '2025-08-18T00:00:00.000Z',
    assignedDate: '2025-08-08T00:00:00.000Z',
    questionTypes: [{ type: 'MCQs', count: 4, marks: 1 }, { type: 'Short Answers', count: 3, marks: 4 }],
    totalQuestions: 7,
    totalMarks: 16,
    status: 'completed',
    createdAt: '2025-08-08T08:00:00.000Z',
    generatedPaper: {
      schoolName: 'Delhi Public School, Vadodara, Gujarat',
      subject: 'Science (Chemistry)',
      className: 'Grade 9',
      timeAllowed: '40 mins',
      maxMarks: 16,
      sections: [
        {
          sectionName: 'Section A',
          title: 'Multiple Choice Questions',
          instruction: 'Tick the correct answer.',
          questions: [
            { text: 'The atomic mass of Carbon is:', difficulty: 'Easy', marks: 1 },
            { text: 'The formula of water is:', difficulty: 'Easy', marks: 1 },
            { text: "Avogadro's number is approximately:", difficulty: 'Moderate', marks: 1 },
            { text: 'The valency of Oxygen is:', difficulty: 'Easy', marks: 1 }
          ]
        },
        {
          sectionName: 'Section B',
          title: 'Short Answer Questions',
          instruction: 'Answer briefly.',
          questions: [
            { text: 'Define atomic mass unit (amu) and state the atomic mass of Oxygen and Hydrogen.', difficulty: 'Easy', marks: 4 },
            { text: 'What is a molecule? Distinguish between atoms and molecules with examples.', difficulty: 'Moderate', marks: 4 },
            { text: 'Calculate the molar mass of H₂SO₄.', difficulty: 'Moderate', marks: 4 }
          ]
        }
      ],
      answerKey: [
        { questionNumber: '1', answer: '12 u' },
        { questionNumber: '2', answer: 'H₂O' },
        { questionNumber: '3', answer: '6.022 × 10²³' },
        { questionNumber: '4', answer: '2' },
        { questionNumber: '5', answer: '1 amu = 1/12th mass of a C-12 atom. O = 16 u, H = 1 u.' },
        { questionNumber: '6', answer: 'Atom: smallest unit of an element (e.g., H, O). Molecule: two or more atoms bonded together (e.g., H₂O, O₂).' },
        { questionNumber: '7', answer: '2(1) + 32 + 4(16) = 98 g/mol' }
      ],
      aiMessage: 'CBSE Grade 9 Chemistry quiz on Atoms and Molecules generated successfully.'
    }
  },
  {
    _id: 'demo-6',
    title: 'English Grammar Test: Tenses & Voice',
    dueDate: '2025-09-01T00:00:00.000Z',
    assignedDate: '2025-08-20T00:00:00.000Z',
    questionTypes: [{ type: 'MCQs', count: 5, marks: 1 }, { type: 'Short Answers', count: 2, marks: 5 }],
    totalQuestions: 7,
    totalMarks: 15,
    status: 'completed',
    createdAt: '2025-08-20T09:00:00.000Z',
    generatedPaper: {
      schoolName: 'Delhi Public School, Vadodara, Gujarat',
      subject: 'English Language',
      className: 'Grade 8',
      timeAllowed: '35 mins',
      maxMarks: 15,
      sections: [
        {
          sectionName: 'Section A',
          title: 'Multiple Choice Questions',
          instruction: 'Choose the correct answer.',
          questions: [
            { text: 'She ___ to school every day. (go / goes / going)', difficulty: 'Easy', marks: 1 },
            { text: 'They ___ a movie last night. (watch / watched / are watching)', difficulty: 'Easy', marks: 1 },
            { text: 'The cake was eaten by ___. (they / them / their)', difficulty: 'Moderate', marks: 1 },
            { text: 'He has been ___ here since 2020. (live / lived / living)', difficulty: 'Moderate', marks: 1 },
            { text: 'Which sentence is in passive voice? (A) She sings a song. (B) A song is sung by her. (C) She sang. (D) She will sing.', difficulty: 'Easy', marks: 1 }
          ]
        },
        {
          sectionName: 'Section B',
          title: 'Short Answer Questions',
          instruction: 'Rewrite as directed.',
          questions: [
            { text: 'Change the following sentences into passive voice: (a) The teacher explains the lesson. (b) My mother bakes a cake every Sunday.', difficulty: 'Moderate', marks: 5 },
            { text: 'Fill in the blanks with the correct tense form of the verb given in brackets: (a) He ___ (finish) his homework before dinner. (b) By next year, she ___ (complete) her degree. (c) Look! The birds ___ (fly) south.', difficulty: 'Moderate', marks: 5 }
          ]
        }
      ],
      answerKey: [
        { questionNumber: '1', answer: 'goes' },
        { questionNumber: '2', answer: 'watched' },
        { questionNumber: '3', answer: 'them' },
        { questionNumber: '4', answer: 'living' },
        { questionNumber: '5', answer: '(B) A song is sung by her.' },
        { questionNumber: '6', answer: '(a) The lesson is explained by the teacher. (b) A cake is baked by my mother every Sunday.' },
        { questionNumber: '7', answer: '(a) had finished (b) will have completed (c) are flying' }
      ],
      aiMessage: 'CBSE Grade 8 English Grammar test on Tenses and Voice generated successfully.'
    }
  }
];

// ─── END DEMO DATA ──────────────────────────────────────────────────────────

// Next.js API routes are on the same domain, so we use relative paths!
const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
// WS_URL is no longer needed since we removed WebSockets.

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

// Socket removed.

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
      const list: IAssignment[] = Array.isArray(data) ? data : [];

      // If demo account has no assignments in DB, inject mock data so the UI
      // always shows content — no backend restart or redeployment needed.
      const currentUser = get().user;
      if (list.length === 0 && currentUser?.email === DEMO_EMAIL) {
        set({ assignments: DEMO_ASSIGNMENTS, loading: false });
      } else {
        set({ assignments: list, loading: false });
      }
    } catch (err) {
      console.error('Error fetching assignments:', err);
      // On network error, still show demo data for the demo account
      const currentUser = get().user;
      if (currentUser?.email === DEMO_EMAIL) {
        set({ assignments: DEMO_ASSIGNMENTS, loading: false });
      } else {
        set({ loading: false });
      }
    }
  },

  fetchAssignmentDetails: async (id: string) => {
    // For demo assignments (client-only), resolve immediately from in-memory list
    if (id.startsWith('demo-')) {
      const found = DEMO_ASSIGNMENTS.find(a => a._id === id) || null;
      set({ selectedAssignment: found });
      return found;
    }
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
      set((state) => ({
        activeJob: {
          assignmentId: 'temp',
          status: 'generating',
          progress: 50,
          message: 'AI is generating the paper (this may take 20-30 seconds)...'
        }
      }));

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
      
      // Update UI state with completed assignment
      set((state) => ({
        assignments: [newAssignment, ...state.assignments],
        activeJob: null // Done!
      }));

      // No websocket anymore!
      
      return newAssignment;
    } catch (err) {
      console.error('Error in createAssignment:', err);
      throw err;
    }
  },

  deleteAssignment: async (id: string) => {
    // Demo assignments are client-only; just remove from local state
    if (id.startsWith('demo-')) {
      set((state) => ({
        assignments: state.assignments.filter((a) => a._id !== id),
        selectedAssignment: state.selectedAssignment?._id === id ? null : state.selectedAssignment
      }));
      return;
    }
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
          status: 'generating',
          progress: 50,
          message: 'AI is regenerating the paper (this may take 20-30 seconds)...'
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

      const updatedAssignment = await res.json();

      set((state) => ({
        activeJob: null, // Done!
        assignments: state.assignments.map(a => a._id === id ? updatedAssignment : a),
        selectedAssignment: state.selectedAssignment?._id === id ? updatedAssignment : state.selectedAssignment
      }));

    } catch (err) {
      console.error('Error regenerating assignment:', err);
      set({ activeJob: null });
    }
  },

  subscribeToJob: (assignmentId: string) => {
    // Deprecated for Next.js API Routes
  },

  unsubscribeFromJob: () => {
    // Deprecated for Next.js API Routes
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

      // Load assignments (will be empty for brand new users)
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
