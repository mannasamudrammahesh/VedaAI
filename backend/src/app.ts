import express from 'express';
import cors from 'cors';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Assignment from './models/Assignment';
import User from './models/User';
import { authMiddleware } from './middleware/auth';
import { assessmentQueue, redisConnection } from './services/queue';
import { processGenerationDirectly } from './workers/generationWorker';
import { aiService } from './services/ai';
const app = express();

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

const JWT_SECRET = process.env.JWT_SECRET || 'veda_secret_key';

// Setup multer in-memory file storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// ─── AUTHENTICATION ENDPOINTS ───────────────────────────────────

// POST /api/auth/register - Sign up a new teacher
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Please provide all required fields (name, email, password).' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      email: email.toLowerCase(),
      passwordHash
    });

    await newUser.save();

    const token = jwt.sign({ userId: newUser._id }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email
      }
    });
  } catch (error: any) {
    console.error('[Auth Register] Error registering user:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/auth/login - Login a teacher
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide email and password.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error: any) {
    console.error('[Auth Login] Error logging in user:', error);
    res.status(500).json({ error: error.message });
  }
});

// ─── ASSIGNMENT ENDPOINTS (SECURED) ─────────────────────────────

// GET /api/assignments - Fetch assignments list for logged-in user
app.get('/api/assignments', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const assignments = await Assignment.find({ createdBy: userId }).select('-fileContentBase64').sort({ createdAt: -1 });
    res.json(assignments);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/assignments/:id - Fetch individual assignment details
app.get('/api/assignments/:id', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const assignment = await Assignment.findOne({ _id: req.params.id, createdBy: userId });
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    res.json(assignment);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/assignments/:id - Delete an assignment
app.delete('/api/assignments/:id', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const assignment = await Assignment.findOneAndDelete({ _id: req.params.id, createdBy: userId });
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found or unauthorized' });
    }
    res.json({ success: true, message: 'Assignment successfully deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/assignments - Create a new assignment and trigger AI Generation Queue
app.post('/api/assignments', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { title, dueDate, questionTypes, additionalInfo, fileBase64, fileName, className } = req.body;

    if (!title || !dueDate || !questionTypes) {
      return res.status(400).json({ error: 'Missing required fields (title, dueDate, questionTypes)' });
    }

    const parsedQuestionTypes = typeof questionTypes === 'string' ? JSON.parse(questionTypes) : questionTypes;

    // Server-side validation
    if (!Array.isArray(parsedQuestionTypes) || parsedQuestionTypes.length === 0) {
      return res.status(400).json({ error: 'questionTypes must be a non-empty array' });
    }

    let totalQuestions = 0;
    let totalMarks = 0;

    for (const q of parsedQuestionTypes) {
      if (q.count <= 0 || q.marks <= 0) {
        return res.status(400).json({ error: 'Questions count and marks must be greater than 0' });
      }
      totalQuestions += q.count;
      totalMarks += q.count * q.marks;
    }

    // Process file if present (either as multer req.file or as custom base64 string in body)
    let processedFileName = '';
    let processedFileBase64 = '';

    if (req.file) {
      processedFileName = req.file.originalname;
      processedFileBase64 = req.file.buffer.toString('base64');
    } else if (fileBase64 && fileName) {
      processedFileName = fileName;
      processedFileBase64 = fileBase64;
    }

    // Create DB entry
    const newAssignment = new Assignment({
      title,
      dueDate: new Date(dueDate),
      questionTypes: parsedQuestionTypes,
      totalQuestions,
      totalMarks,
      additionalInfo: additionalInfo || '',
      fileName: processedFileName || undefined,
      fileContentBase64: processedFileBase64 || undefined,
      className: className || '8th',
      status: 'pending',
      createdBy: userId
    });

    await newAssignment.save();

    // Push into BullMQ assessmentQueue (with standalone fallback)
    try {
      if (assessmentQueue && redisConnection && redisConnection.status === 'ready') {
        const job = await assessmentQueue.add(`gen-${newAssignment._id}`, {
          assignmentId: newAssignment._id.toString(),
          promptContext: title,
          questionTypes: parsedQuestionTypes,
          totalQuestions,
          totalMarks,
          additionalInstructions: additionalInfo || '',
          fileName: processedFileName || undefined,
          fileContentBase64: processedFileBase64 || undefined,
          className: className || '8th'
        });
        console.log(`[Express] Successfully added assignment ${newAssignment._id} to BullMQ queue. Job ID: ${job.id}`);
      } else {
        throw new Error('Redis not connected');
      }
    } catch (queueErr) {
      console.warn(`[Express] Redis/BullMQ queue is offline. Triggering standalone in-memory generation fallback...`);
      setImmediate(() => {
        processGenerationDirectly({
          assignmentId: newAssignment._id.toString(),
          promptContext: title,
          questionTypes: parsedQuestionTypes,
          totalQuestions,
          totalMarks,
          additionalInstructions: additionalInfo || '',
          fileName: processedFileName || undefined,
          fileContentBase64: processedFileBase64 || undefined,
          className: className || '8th'
        });
      });
    }

    res.status(201).json(newAssignment);
  } catch (error: any) {
    console.error('[Express] Error creating assignment:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/assignments/:id/regenerate - Re-trigger AI generation queue for a paper
app.post('/api/assignments/:id/regenerate', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const assignment = await Assignment.findOne({ _id: req.params.id, createdBy: userId });
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    assignment.status = 'pending';
    assignment.error = undefined;
    await assignment.save();

    // Add back to BullMQ (with standalone fallback)
    try {
      if (assessmentQueue && redisConnection && redisConnection.status === 'ready') {
        const job = await assessmentQueue.add(`regen-${assignment._id}`, {
          assignmentId: assignment._id.toString(),
          promptContext: assignment.title,
          questionTypes: assignment.questionTypes,
          totalQuestions: assignment.totalQuestions,
          totalMarks: assignment.totalMarks,
          additionalInstructions: assignment.additionalInfo || '',
          fileName: assignment.fileName || undefined,
          fileContentBase64: assignment.fileContentBase64 || undefined,
          className: assignment.className || '8th'
        });
        console.log(`[Express] Re-added assignment ${assignment._id} to BullMQ. Job ID: ${job.id}`);
      } else {
        throw new Error('Redis not connected');
      }
    } catch (queueErr) {
      console.warn(`[Express] Redis/BullMQ queue offline for regeneration. Triggering standalone in-memory fallback...`);
      setImmediate(() => {
        processGenerationDirectly({
          assignmentId: assignment._id.toString(),
          promptContext: assignment.title,
          questionTypes: assignment.questionTypes,
          totalQuestions: assignment.totalQuestions,
          totalMarks: assignment.totalMarks,
          additionalInstructions: assignment.additionalInfo || '',
          fileName: assignment.fileName || undefined,
          fileContentBase64: assignment.fileContentBase64 || undefined,
          className: assignment.className || '8th'
        });
      });
    }

    res.json(assignment);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
// POST /api/ai/toolkit - Generate toolkit content
app.post('/api/ai/toolkit', authMiddleware, async (req, res) => {
  try {
    const { toolId, input, secondaryInput } = req.body;
    
    if (!toolId || !input) {
      return res.status(400).json({ error: 'toolId and input are required' });
    }

    const result = await aiService.generateToolkitResponse(toolId, input, secondaryInput);
    res.json({ result });
  } catch (error: any) {
    console.error('[Toolkit Route] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default app;
