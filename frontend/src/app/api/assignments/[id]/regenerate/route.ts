import { NextRequest, NextResponse } from 'next/server';
import Assignment from '@/lib/models/Assignment';
import { connectDB } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import { aiService } from '@/lib/services/ai';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const userId = verifyAuth(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const assignment = await Assignment.findOne({ _id: params.id, createdBy: userId });
    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    // Set status to generating
    assignment.status = 'generating';
    assignment.error = undefined;
    await assignment.save();

    // Generate synchronously
    try {
      const generatedPaper = await aiService.generateQuestionPaper(
        assignment.title,
        assignment.questionTypes,
        assignment.totalQuestions,
        assignment.totalMarks,
        assignment.additionalInfo || '',
        assignment.fileName || undefined,
        assignment.fileContentBase64 || undefined,
        assignment.className || '8th'
      );

      assignment.generatedPaper = generatedPaper;
      assignment.status = 'completed';
      await assignment.save();
    } catch (genError: any) {
      console.error('[Next.js API] Sync regeneration failed:', genError);
      assignment.status = 'failed';
      assignment.error = genError.message || 'Unknown error occurred during regeneration';
      await assignment.save();
    }

    return NextResponse.json(assignment);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
