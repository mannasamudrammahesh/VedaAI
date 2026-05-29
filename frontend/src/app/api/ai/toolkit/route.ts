import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { aiService } from '@/lib/services/ai';

export async function POST(req: NextRequest) {
  try {
    const userId = verifyAuth(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { toolId, input, secondaryInput } = body;
    
    if (!toolId || !input) {
      return NextResponse.json({ error: 'toolId and input are required' }, { status: 400 });
    }

    const result = await aiService.generateToolkitResponse(toolId, input, secondaryInput);
    return NextResponse.json({ result });
  } catch (error: any) {
    console.error('[Toolkit Route] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
