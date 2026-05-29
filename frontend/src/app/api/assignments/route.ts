import { NextRequest, NextResponse } from 'next/server';
import Assignment from '@/lib/models/Assignment';
import { connectDB } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import { aiService } from '@/lib/services/ai';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const userId = verifyAuth(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const assignments = await Assignment.find({ createdBy: userId })
      .select('-fileContentBase64')
      .sort({ createdAt: -1 });

    return NextResponse.json(assignments);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const userId = verifyAuth(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, dueDate, questionTypes, additionalInfo, fileBase64, fileName, className } = body;

    if (!title || !dueDate || !questionTypes) {
      return NextResponse.json({ error: 'Missing required fields (title, dueDate, questionTypes)' }, { status: 400 });
    }

    const parsedQuestionTypes = typeof questionTypes === 'string' ? JSON.parse(questionTypes) : questionTypes;

    if (!Array.isArray(parsedQuestionTypes) || parsedQuestionTypes.length === 0) {
      return NextResponse.json({ error: 'questionTypes must be a non-empty array' }, { status: 400 });
    }

    let totalQuestions = 0;
    let totalMarks = 0;

    for (const q of parsedQuestionTypes) {
      if (q.count <= 0 || q.marks <= 0) {
        return NextResponse.json({ error: 'Questions count and marks must be greater than 0' }, { status: 400 });
      }
      totalQuestions += q.count;
      totalMarks += q.count * q.marks;
    }

    // Create DB entry (status: generating initially)
    const newAssignment = new Assignment({
      title,
      dueDate: new Date(dueDate),
      questionTypes: parsedQuestionTypes,
      totalQuestions,
      totalMarks,
      additionalInfo: additionalInfo || '',
      fileName: fileName || undefined,
      fileContentBase64: fileBase64 || undefined,
      className: className || '8th',
      status: 'generating',
      createdBy: userId
    });

    await newAssignment.save();

    // Since we are Serverless and don't have BullMQ/Redis, we generate synchronously!
    try {
      const generatedPaper = await aiService.generateQuestionPaper(
        title,
        parsedQuestionTypes,
        totalQuestions,
        totalMarks,
        additionalInfo || '',
        fileName || undefined,
        fileBase64 || undefined,
        className || '8th'
      );

      newAssignment.generatedPaper = generatedPaper;
      newAssignment.status = 'completed';
      await newAssignment.save();
    } catch (genError: any) {
      console.error('[Next.js API] Sync generation failed:', genError);
      newAssignment.status = 'failed';
      newAssignment.error = genError.message || 'Unknown error occurred during generation';
      await newAssignment.save();
    }

    return NextResponse.json(newAssignment, { status: 201 });
  } catch (error: any) {
    console.error('[Next.js API] Error creating assignment:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
