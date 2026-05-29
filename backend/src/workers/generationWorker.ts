import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import dotenv from 'dotenv';
import Assignment from '../models/Assignment';
import { aiService } from '../services/ai';
import { socketManager } from '../sockets/socketManager';

dotenv.config();

const REDIS_HOST = process.env.REDIS_HOST || '127.0.0.1';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);

// Unified direct standalone processor (runs in-memory if Redis is unavailable)
export const processGenerationDirectly = async (data: {
  assignmentId: string;
  promptContext: string;
  questionTypes: any[];
  totalQuestions: number;
  totalMarks: number;
  additionalInstructions: string;
  fileName?: string;
  fileContentBase64?: string;
  className?: string;
}) => {
  const { 
    assignmentId, 
    promptContext, 
    questionTypes, 
    totalQuestions, 
    totalMarks, 
    additionalInstructions, 
    fileName, 
    fileContentBase64,
    className
  } = data;
  
  console.log(`[Direct Processor] Started in-memory processing for assignment: ${assignmentId}`);

  const updateProgress = async (percent: number, msg: string) => {
    socketManager.sendToAssignmentSubscribers(assignmentId, 'JOB_PROGRESS', {
      assignmentId,
      status: 'generating',
      progress: percent,
      message: msg
    });
  };

  try {
    // Step 1: Initializing
    await updateProgress(10, 'Initializing standalone generation pipeline...');
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      throw new Error('Assignment not found in database');
    }

    assignment.status = 'generating';
    await assignment.save();

    // Step 2: Preparing inputs
    await updateProgress(30, 'Parsing questions configurations & upload streams...');
    await new Promise((resolve) => setTimeout(resolve, 800)); // Smooth transition pause for visual feedback

    // Step 3: Call AI Service
    await updateProgress(60, 'Generating assessment sections and custom answer key using Grok AI...');
    const generatedPaper = await aiService.generateQuestionPaper(
      promptContext,
      questionTypes,
      totalQuestions,
      totalMarks,
      additionalInstructions,
      fileName,
      fileContentBase64,
      className || assignment.className
    );

    // Step 4: Validating and saving
    await updateProgress(85, 'Polishing structure, tags, and formatting layouts...');
    await new Promise((resolve) => setTimeout(resolve, 600)); // Smooth visual pause

    assignment.generatedPaper = generatedPaper;
    assignment.status = 'completed';
    await assignment.save();

    // Step 5: Finished
    console.log(`[Direct Processor] Completed assignment generation successfully: ${assignmentId}`);
    socketManager.sendToAssignmentSubscribers(assignmentId, 'JOB_PROGRESS', {
      assignmentId,
      status: 'completed',
      progress: 100,
      message: 'Question paper generated successfully!',
      paper: generatedPaper
    });

  } catch (error: any) {
    console.error(`[Direct Processor] Standalone generation failed for assignment ${assignmentId}:`, error);
    
    // Update DB status
    try {
      await Assignment.findByIdAndUpdate(assignmentId, {
        status: 'failed',
        error: error.message || 'Unknown generation error'
      });
    } catch (dbErr) {
      console.error('[Direct Processor] Failed to save error state to DB:', dbErr);
    }

    // Broadcast failure
    socketManager.sendToAssignmentSubscribers(assignmentId, 'JOB_PROGRESS', {
      assignmentId,
      status: 'failed',
      progress: 100,
      message: `Generation failed: ${error.message || 'Internal AI Error'}`,
      error: error.message || 'Generation failed'
    });
  }
};

export const startWorker = (): void => {
  try {
    const workerRedis = new IORedis({
      host: REDIS_HOST,
      port: REDIS_PORT,
      maxRetriesPerRequest: null,
      enableOfflineQueue: false,
      connectTimeout: 2000 // Fast fail
    });

    workerRedis.on('error', (err) => {
      // Suppress unhandled crash loops, fail silently to keep Express running
      console.warn('[BullMQ] Redis unavailable for background worker. Switched to standalone generator.');
    });

    const worker = new Worker(
      'assessment-generation',
      async (job: Job) => {
        const { assignmentId, promptContext, questionTypes, totalQuestions, totalMarks, additionalInstructions, fileName, fileContentBase64, className } = job.data;
        console.log(`[Worker] Started processing assignment job: ${assignmentId}`);

        const updateProgress = async (percent: number, msg: string) => {
          await job.updateProgress(percent);
          socketManager.sendToAssignmentSubscribers(assignmentId, 'JOB_PROGRESS', {
            assignmentId,
            status: 'generating',
            progress: percent,
            message: msg
          });
        };

        try {
          // Step 1: Initializing
          await updateProgress(10, 'Initializing generation pipeline...');
          const assignment = await Assignment.findById(assignmentId);
          if (!assignment) {
            throw new Error('Assignment not found in database');
          }

          assignment.status = 'generating';
          await assignment.save();

          // Step 2: Preparing inputs
          await updateProgress(30, 'Parsing questions configurations & upload streams...');
          
          // Step 3: Call AI Service
          await updateProgress(60, 'Generating assessment sections and custom answer key using Grok AI...');
          const generatedPaper = await aiService.generateQuestionPaper(
            promptContext,
            questionTypes,
            totalQuestions,
            totalMarks,
            additionalInstructions,
            fileName,
            fileContentBase64,
            className || assignment.className
          );

          // Step 4: Validating and saving
          await updateProgress(85, 'Polishing structure, tags, and formatting layouts...');
          
          assignment.generatedPaper = generatedPaper;
          assignment.status = 'completed';
          await assignment.save();

          // Step 5: Finished
          console.log(`[Worker] Completed assignment generation successfully: ${assignmentId}`);
          socketManager.sendToAssignmentSubscribers(assignmentId, 'JOB_PROGRESS', {
            assignmentId,
            status: 'completed',
            progress: 100,
            message: 'Question paper generated successfully!',
            paper: generatedPaper
          });

        } catch (error: any) {
          console.error(`[Worker] Error generating assignment ${assignmentId}:`, error);
          
          // Update DB
          try {
            await Assignment.findByIdAndUpdate(assignmentId, {
              status: 'failed',
              error: error.message || 'Unknown generation error'
            });
          } catch (dbErr) {
            console.error('[Worker] Failed to write error state to DB:', dbErr);
          }

          socketManager.sendToAssignmentSubscribers(assignmentId, 'JOB_PROGRESS', {
            assignmentId,
            status: 'failed',
            progress: 100,
            message: `Generation failed: ${error.message || 'Internal AI Error'}`,
            error: error.message || 'Generation failed'
          });

          throw error;
        }
      },
      {
        connection: workerRedis as any,
        concurrency: 2
      }
    );

    worker.on('active', (job) => {
      console.log(`[Worker] Job active: ${job.id}`);
    });

    worker.on('completed', (job) => {
      console.log(`[Worker] Job completed: ${job.id}`);
    });

    worker.on('failed', (job, err) => {
      console.error(`[Worker] Job failed: ${job?.id}. Error:`, err);
    });
    
    console.log('[Worker] BullMQ Worker successfully registered and connected to Redis.');
  } catch (err) {
    console.warn('[Worker] Redis is not active. BullMQ background worker disabled. Standalone generator active.');
  }
};
