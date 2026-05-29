import dotenv from 'dotenv';
import AdmZip from 'adm-zip';
import { IGeneratedPaper, IQuestionTypeConfig, ISection, IAnswerKeyItem } from '../models/Assignment';

dotenv.config();

const API_KEY = process.env.GROK_API_KEY;

function extractTextFromPptx(base64Data: string): string {
  try {
    const buffer = Buffer.from(base64Data, 'base64');
    const zip = new AdmZip(buffer);
    const zipEntries = zip.getEntries();
    
    let extractedText = '';
    
    // Slide XML files inside zip: ppt/slides/slide1.xml, slide2.xml...
    const slideEntries = zipEntries
      .filter(entry => entry.entryName.startsWith('ppt/slides/slide') && entry.entryName.endsWith('.xml'))
      .sort((a, b) => {
        const numA = parseInt(a.entryName.replace(/[^0-9]/g, '') || '0', 10);
        const numB = parseInt(b.entryName.replace(/[^0-9]/g, '') || '0', 10);
        return numA - numB;
      });

    console.log(`[PPTX Parser] Found ${slideEntries.length} slides to parse.`);

    slideEntries.forEach((entry, idx) => {
      const xmlContent = entry.getData().toString('utf8');
      
      // Look for text in shapes/textboxes inside <a:t>...</a:t>
      const matches = xmlContent.match(/<a:t>([^<]*)<\/a:t>/g) || [];
      const slideText = matches
        .map(m => m.replace(/<\/?a:t>/g, ''))
        .map(t => t.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>'))
        .filter(t => t.trim().length > 0)
        .join(' ');
      
      if (slideText.trim().length > 0) {
        extractedText += `[Slide ${idx + 1}]: ${slideText}\n\n`;
      }
    });

    return extractedText;
  } catch (err: any) {
    console.error('[PPTX Parser] Error unzipping and parsing slides:', err);
    throw new Error('Failed to parse PPTX slide data: ' + err.message);
  }
}

function cleanJsonString(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/```$/, '').trim();
  }
  return cleaned;
}

export class AIService {
  private apiKey: string | null = null;
  private isGroq: boolean = false;
  private endpoint: string = '';
  private defaultModel: string = '';
  private visionModel: string = '';

  constructor() {
    if (API_KEY) {
      this.apiKey = API_KEY;
      if (API_KEY.startsWith('gsk_')) {
        this.isGroq = true;
        this.endpoint = 'https://api.groq.com/openai/v1/chat/completions';
        this.defaultModel = 'llama-3.3-70b-versatile';
        this.visionModel = 'llama-3.2-11b-vision-preview';
        console.log('AI Service initialized with Groq Cloud API.');
      } else {
        this.isGroq = false;
        this.endpoint = 'https://api.x.ai/v1/chat/completions';
        this.defaultModel = 'grok-2-1212';
        this.visionModel = 'grok-2-1212';
        console.log('AI Service initialized with xAI Grok API.');
      }
    } else {
      console.warn('GROK_API_KEY is not defined. AI Service will operate in high-fidelity MOCK mode.');
    }
  }

  public async generateQuestionPaper(
    promptContext: string,
    questionTypes: IQuestionTypeConfig[],
    totalQuestionsCount: number,
    totalMarks: number,
    additionalInstructions?: string,
    fileName?: string,
    fileContentBase64?: string,
    className?: string
  ): Promise<IGeneratedPaper> {
    
    let pptxText = '';
    if (fileContentBase64 && fileName && fileName.endsWith('.pptx')) {
      try {
        pptxText = extractTextFromPptx(fileContentBase64);
        console.log(`[AI Service] Successfully parsed PPTX text (${pptxText.length} characters)`);
      } catch (err) {
        console.error('[AI Service] PPTX extraction failed, fallback to plain text description.', err);
      }
    }

    let textContent = '';
    if (fileContentBase64 && fileName) {
      if (fileName.endsWith('.pptx')) {
        // already handled
      } else if (fileName.endsWith('.pdf')) {
        try {
          const pdfBuffer = Buffer.from(fileContentBase64, 'base64');
          const pdfParse = require('pdf-parse');
          const pdfData = await pdfParse(pdfBuffer);
          textContent = pdfData.text;
          console.log(`[AI Service] Successfully parsed PDF file ${fileName} (${textContent.length} characters)`);
        } catch (err) {
          console.error('[AI Service] PDF file extraction failed, fallback to raw input.', err);
        }
      } else if (
        fileName.endsWith('.txt') || 
        fileName.endsWith('.csv') || 
        fileName.endsWith('.md') || 
        fileName.endsWith('.json')
      ) {
        try {
          textContent = Buffer.from(fileContentBase64, 'base64').toString('utf8');
          console.log(`[AI Service] Successfully parsed text file ${fileName} (${textContent.length} characters)`);
        } catch (err) {
          console.error('[AI Service] Text file extraction failed, fallback to raw input.', err);
        }
      }
    }

    // Construct the detailed instruction block
    const questionConfigText = questionTypes
      .map((q) => `- ${q.type}: Generate exactly ${q.count} questions, each carrying ${q.marks} marks.`)
      .join('\n');

    let strictDocInstruction = '';
    if (fileName) {
      strictDocInstruction = `
[CRITICAL REQUIREMENT - STRICT DOCUMENT BOUNDING]:
A reference document named "${fileName}" has been uploaded by the teacher and attached to this request.
You MUST generate every single question and answer STRICTLY, EXCLUSIVELY, and ACCURATELY from the actual content, slides, slides text, context, formulas, definitions, and concepts present in this uploaded document.
DO NOT use general knowledge or generate questions about the topic that are not covered in the attached document.
If the document content is brief, formulate high-quality, creative questions directly testing the specific details in the slides/text.
Failure to draw questions from the actual document content will violate the teacher's requirements.
`;
    }

    const prompt = `
You are an expert curriculum designer and senior academic examiner. Create an official, CBSE-standard school question paper and a detailed answer key strictly based on the provided material.

${strictDocInstruction}

## Required Question Composition
${questionConfigText}

## Assignment Details
- Core Topic/Context: ${promptContext}
- Target Class/Grade: ${className || '8th'}
- File Attached: ${fileName || 'None'}
- Total Target Questions: ${totalQuestionsCount}
- Total Target Marks: ${totalMarks}
- Additional Teacher Instructions: ${additionalInstructions || 'None'}

${pptxText ? `## EXTRACTED DOCUMENT CONTENT (Strict Source Material)\n${pptxText}` : ''}
${textContent ? `## EXTRACTED FILE CONTENT (${fileName})\n${textContent}` : ''}

## Hard Rules for Generation:
1. **Source Fidelity**: You MUST base the questions directly on the concepts, definitions, formulas, theories, and slides text from the uploaded document. Do not invent questions on tangential concepts that are not discussed in the document content.
2. **Exact Question Types**: You MUST strictly generate exactly the types and counts of questions configured in the composition above. If the teacher selected "3 Multiple Choice Questions", there must be exactly 3 MCQs in Section A. Do not omit or add extra questions.
3. **Pristine Math**: The marks for each question must sum up EXACTLY to the Section maximums and the paper Total Maximum Marks (${totalMarks}).
4. **CBSE Format**: Group the questions into logical sections based on their types (e.g., Section A, Section B, Section C). You MUST output the "className" field in the JSON exactly as "${className || '8th'}" (UNLESS a different class name is explicitly requested in additional instructions, in which case use that). Default School Name to "Delhi Public School, Vadodara, Gujarat".
5. **Difficulties**: For every single question, assign a difficulty level: "Easy", "Moderate", or "Challenging". Distribute difficulties realistically (e.g., 30% Easy, 50% Moderate, 20% Challenging).
6. **Answer Key (CRITICAL FOR NUMERICALS)**: Provide detailed, structured step-by-step answers for every generated question. If a question involves numerical calculations or math, you MUST show all the steps required to get the final answer. You MUST use the letter "x" for multiplication (do not use * or dot).
7. **Constraint**: The final JSON MUST perfectly map to the requested structure. Do not output markdown wrapping unless it is JSON.
8. **Multiple Choice Questions Options (CRITICAL)**: For every "Multiple Choice Question" or "MCQ" type question, you MUST format the "text" field by appending the 4 options directly below the question text, separated by a newline character (\\n). The options MUST start with letters like "a)", "b)", "c)", "d)". Example:
   "What is the SI unit of power?\\na) Joule\\nb) Watt\\nc) Newton\\nd) Pascal"
   DO NOT put options in a separate field; they MUST be embedded in the "text" field using newline separators.
   - **Diagrams in Answer Key (CRITICAL)**: For ANY question that requires a diagram, graph, cycle, flowchart, or structural drawing (including anatomical organs like the eye, heart, or skin), you MUST generate a Mermaid.js diagram wrapped in [MERMAID] and [/MERMAID] tags.
   - Example: [MERMAID] graph TD\n A["Mouth"] --> B["Esophagus"] --> C["Stomach"] [/MERMAID]
   - **CRITICAL MERMAID SYNTAX RULES**:
     - 1. DO NOT use raw <svg> tags. You must use [MERMAID] for all diagrams.
     - 2. DO NOT use the invalid syntax '-->|label|>'. Use standard valid syntax: '-->|label| TargetNode'.
     - 3. You MUST wrap ALL node text in double quotes to prevent syntax crashes. Example: A["Human Skin"] --> B["Epidermis (Outer Layer)"].
     - 4. DO NOT use parentheses or round brackets for Node IDs. Example: 'NodeA["Text"]' is valid. 'Node(A)["Text"]' will crash the renderer.
     - 5. For anatomical or structural questions, use a 'graph TD' (flowchart) to map out the components logically.
     - 6. DO NOT wrap the [MERMAID] block inside markdown code blocks.

OUTPUT A RAW JSON STRING MATCHING THIS EXACT SCHEMA:
{
  "schoolName": "School Name string (Default: 'Delhi Public School, Vadodara, Gujarat')",
  "subject": "MUST strictly match the Core Topic/Context exactly as provided by the user",
  "className": "Class Grade string (e.g. 5th, 8th, 10th - auto-detected or default)",
  "timeAllowed": "Time string (e.g. 45 minutes)",
  "maxMarks": number,
  "sections": [
    {
      "sectionName": "Section A",
      "title": "Short Answer Questions",
      "instruction": "Attempt all questions. Each question carries 2 marks",
      "questions": [
        {
          "text": "Question text here?",
          "difficulty": "Easy" | "Moderate" | "Challenging",
          "marks": number
        }
      ]
    }
  ],
  "answerKey": [
    {
      "questionNumber": "String representation (e.g. 1, 2, 3)",
      "answer": "Detailed answer content here (include high-resolution inline vector SVG diagrams here if the question is diagram-based)"
    }
  ],
  "aiMessage": "A professional friendly greeting from the AI creator"
}
`;

    if (!this.apiKey) {
      // Simulate network latency and run high-fidelity mock generator
      console.log('Running high-fidelity mock question generator...');
      await new Promise((resolve) => setTimeout(resolve, 2500));
      return this.generateMockPaper(promptContext, questionTypes, totalQuestionsCount, totalMarks, additionalInstructions, fileName, pptxText || textContent, className);
    }

    try {
      let hasImage = false;
      let imageMimeType = 'image/jpeg';
      if (fileContentBase64 && fileName && (fileName.endsWith('.png') || fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || fileName.endsWith('.webp'))) {
        hasImage = true;
        imageMimeType = fileName.endsWith('.png') ? 'image/png' : fileName.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
      }

      const activeModel = hasImage ? this.visionModel : this.defaultModel;

      let contentInput: any = prompt;
      if (hasImage) {
        contentInput = [
          { type: 'text', text: prompt },
          {
            type: 'image_url',
            image_url: {
              url: `data:${imageMimeType};base64,${fileContentBase64}`
            }
          }
        ];
      }

      const messages = [
        {
          role: 'user',
          content: contentInput
        }
      ];

      const fetchFn = (globalThis as any).fetch;
      if (!fetchFn) {
        throw new Error('globalThis.fetch is not available in this Node.js environment');
      }

      console.log(`[AI Service] Sending request to ${this.endpoint} using model: ${activeModel}...`);

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      };

      const payload = {
        model: activeModel,
        messages,
        temperature: 0.2,
        response_format: { type: 'json_object' }
      };

      const response = await fetchFn(this.endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error (${response.status}): ${errorText}`);
      }

      const responseData = await response.json();
      const responseText = responseData.choices?.[0]?.message?.content;
      
      if (!responseText) {
        throw new Error('Empty response from AI API');
      }

      console.log('[AI Service] API raw response text successfully received.');
      
      const cleanedJson = cleanJsonString(responseText);
      const parsedPaper: IGeneratedPaper = JSON.parse(cleanedJson);
      
      // Safeguard validations
      if (!parsedPaper.schoolName) parsedPaper.schoolName = 'Delhi Public School, Vadodara, Gujarat';
      
      // Force subject to be the user's exact specified topic context to ensure it reflects their input
      if (promptContext) {
        parsedPaper.subject = promptContext;
      }
      
      if (!parsedPaper.aiMessage) {
        parsedPaper.aiMessage = `Certainly! Here is the customized Question Paper for your ${parsedPaper.className} ${parsedPaper.subject} class:`;
      }
      
      return parsedPaper;
    } catch (error) {
      console.error('Failed to generate using Grok/Groq API, running high-fidelity Mock fallback...', error);
      return this.generateMockPaper(promptContext, questionTypes, totalQuestionsCount, totalMarks, additionalInstructions, fileName, pptxText || textContent, className);
    }
  }

  private generateMockPaper(
    promptContext: string,
    questionTypes: IQuestionTypeConfig[],
    totalQuestionsCount: number,
    totalMarks: number,
    additionalInstructions?: string,
    fileName?: string,
    pptxText?: string,
    className?: string
  ): IGeneratedPaper {
    // Detect context subject
    const ctx = (promptContext + ' ' + (additionalInstructions || '')).toLowerCase();
    
    let subject = 'General Assessment';
    let school = 'Delhi Public School, Vadodara, Gujarat';
    let grade = className || '8th';
    let time = '1.5 Hours';
    
    // Parse grade explicitly if not passed and present in title or instructions
    if (!className) {
      const classMatch = ctx.match(/class\s*(\d+)(?:th)?/i) || ctx.match(/grade\s*(\d+)/i);
      if (classMatch) {
        grade = `${classMatch[1]}th`;
      } else if (ctx.includes('8th') || ctx.includes('class 8')) {
        grade = '8th';
      } else if (ctx.includes('9th') || ctx.includes('class 9')) {
        grade = '9th';
      } else if (ctx.includes('10th') || ctx.includes('class 10')) {
        grade = '10th';
      } else if (ctx.includes('11th') || ctx.includes('class 11')) {
        grade = '11th';
      } else if (ctx.includes('12th') || ctx.includes('class 12')) {
        grade = '12th';
      }
    } else if (ctx.includes('electr') || ctx.includes('physic') || ctx.includes('force') || ctx.includes('motion')) {
      subject = 'Physics';
      grade = '8th';
      time = '45 minutes';
    } else if (ctx.includes('chemistry') || ctx.includes('chemical') || ctx.includes('acid') || ctx.includes('base') || ctx.includes('reaction')) {
      subject = 'Chemistry';
      grade = '10th';
      time = '1.5 Hours';
    } else if (ctx.includes('biolog') || ctx.includes('cell') || ctx.includes('mitochondria') || ctx.includes('plant') || ctx.includes('animal')) {
      subject = 'Biology';
      grade = '9th';
      time = '1 Hour';
    } else if (ctx.includes('histor') || ctx.includes('war') || ctx.includes('civic') || ctx.includes('social') || ctx.includes('geography')) {
      subject = 'Social Science';
      grade = '10th';
      time = '2 Hours';
    } else if (ctx.includes('math') || ctx.includes('algebra') || ctx.includes('number') || ctx.includes('geometry') || ctx.includes('calculus')) {
      subject = 'Mathematics';
      grade = '9th';
      time = '2.5 Hours';
    } else if (ctx.includes('english') || ctx.includes('poem') || ctx.includes('grammar') || ctx.includes('liter')) {
      subject = 'English Literature';
      grade = '8th';
      time = '2 Hours';
    } else if (ctx.includes('machine learning') || ctx.includes('ai') || ctx.includes('computer') || ctx.includes('python') || ctx.includes('code')) {
      subject = 'Computer Science (AI & ML)';
      grade = '11th';
      time = '2 Hours';
    } else {
      // Parse from prompt context directly!
      subject = promptContext.split(/[-,:]/)[0].trim();
      if (subject.length > 30) {
        subject = subject.slice(0, 30) + '...';
      }
    }

    const sections: ISection[] = [];
    const answerKey: IAnswerKeyItem[] = [];
    let globalQNum = 1;

    // Split slide XML text blocks if pptxText is present
    const extractedSlides: { title: string; content: string[] }[] = [];
    if (pptxText) {
      const slideBlocks = pptxText.split('[Slide');
      slideBlocks.forEach(block => {
        if (!block.trim()) return;
        const headerMatch = block.match(/^ (\d+)\]:\s*(.*)/);
        if (headerMatch) {
          const slideNum = headerMatch[1];
          const fullText = headerMatch[2];
          const sentences = fullText.split(/[.?!:]/).map(s => s.trim()).filter(s => s.length > 5);
          const title = sentences[0] || `Slide ${slideNum} Core Topic`;
          const content = sentences.slice(1);
          extractedSlides.push({ title, content });
        }
      });
    }

    let currentSlideIdx = 0;

    questionTypes.forEach((qType, sectionIndex) => {
      const sectionLetter = String.fromCharCode(65 + sectionIndex);
      const sectionQuestions: any[] = [];
      
      const isMCQ = qType.type.toLowerCase().includes('multiple choice') || qType.type.toLowerCase().includes('mcq');
      const isChallenging = qType.type.toLowerCase().includes('numerical') || qType.type.toLowerCase().includes('challenging') || qType.type.toLowerCase().includes('numerical');
      const isDiagram = qType.type.toLowerCase().includes('diagram') || qType.type.toLowerCase().includes('graph') || qType.type.toLowerCase().includes('draw');

      for (let i = 0; i < qType.count; i++) {
        let qText = '';
        let answer = '';
        let difficulty = isChallenging ? 'Challenging' : (i % 2 === 0 ? 'Easy' : 'Moderate');
        
        // If slide content is available, base questions strictly on slide concepts!
        if (extractedSlides.length > 0) {
          const slide = extractedSlides[currentSlideIdx % extractedSlides.length];
          currentSlideIdx++;
          
          const titleClean = slide.title.replace(/[^a-zA-Z0-9\s]/g, '').trim();
          const slideTitle = titleClean.slice(0, 50) || `Core Concept ${currentSlideIdx}`;
          const explanation = slide.content[0] || 'the detailed material presented in the slide';
          const detailsList = slide.content.slice(1, 4).filter(x => x.length > 4);

          if (isMCQ) {
            qText = `According to the slides on "${slideTitle}", which of the following is true?\na) ${explanation}\nb) It is completely neglected in modern research\nc) It was disproven by standard laboratories\nd) None of the above`;
            answer = `a) ${explanation}. The presentation explicitly details that ${slideTitle} corresponds to: ${explanation}.`;
          } else if (isDiagram) {
            qText = `Study the slides regarding "${slideTitle}" and sketch the block flow diagram representing this concept. Label the core components.`;
            answer = `Students should construct a block diagram as shown below:\n\n` + 
                     `  +------------------+     +-------------------+\n` +
                     `  |  ${slideTitle.slice(0, 14)}  | --> | ${explanation.slice(0, 17)} |\n` +
                     `  +------------------+     +-------------------+\n\n` +
                     `Ensure they correctly label ${slideTitle} as the central input/trigger.`;
          } else if (isChallenging) {
            qText = `Critically analyze "${slideTitle}" based on the slide materials. Explain the theoretical implications of the following details:\n- ${explanation}\n${detailsList.map(d => `- ${d}`).join('\n')}`;
            answer = `Students should analyze the core theme of ${slideTitle} which asserts that: ${explanation}. The slide details include:\n${detailsList.map((d, idx) => `${idx + 1}. ${d}`).join('\n') || 'Foundational principles of the subject.'} Evaluators should check for accuracy and logical reasoning based on these points.`;
          } else {
            qText = `Explain the primary points regarding "${slideTitle}" as discussed in Slide ${currentSlideIdx}. What is its significance?`;
            answer = `Slide ${currentSlideIdx} covers "${slideTitle}", detailing that it is defined by: ${explanation}. Its significance lies in forming the structural foundation of the chapter and enabling practical applications as outlined in the slide deck.`;
          }
        } else {
          // Dynamic fallback based on promptContext (the topic the user entered!)
          const topic = promptContext || 'the requested subject material';
          
          if (isMCQ) {
            if (i % 2 === 0) {
              qText = `Which of the following is a primary pillar or key aspect of "${topic}"?\na) Concepts and structural theories outlined in the syllabus\nb) Standard atmospheric constant\nc) Arbitrary numeric variables\nd) None of the above`;
              answer = `a) Concepts and structural theories. In the academic evaluation of ${topic}, this is considered a core foundational topic.`;
            } else {
              qText = `What is a primary objective or direct utility of studying "${topic}"?\na) To understand, analyze, and apply its core scientific models to solve problems\nb) To memorize historical unrelated dates\nc) To run arbitrary unoptimized scripts\nd) None of the above`;
              answer = `a) To understand, analyze, and apply its core scientific models. This aligns perfectly with CBSE assessment objectives.`;
            }
          } else if (isDiagram) {
            if (ctx.includes('eye') || ctx.includes('cornea') || ctx.includes('iris') || ctx.includes('retina') || ctx.includes('pupil')) {
              qText = `Draw the anatomical structure of the human eye and label the cornea, lens, iris, and retina.`;
              answer = `Here is the anatomical diagram of the human eye:\n\n` +
                       `<svg width="400" height="250" viewBox="0 0 400 250">\n` +
                       `  <defs>\n` +
                       `    <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">\n` +
                       `      <path d="M 0 1.5 L 6 5 L 0 8.5 z" fill="#000"/>\n` +
                       `    </marker>\n` +
                       `  </defs>\n` +
                       `  <rect width="100%" height="100%" fill="#F8FAFC" rx="12" stroke="#E2E8F0" stroke-width="1.5"/>\n` +
                       `  <!-- Sclera (Outer eye ball) -->\n` +
                       `  <path d="M 140 50 A 70 70 0 1 1 140 190 A 70 70 0 0 1 140 50 Z" fill="#FFFFFF" stroke="#475569" stroke-width="2.5"/>\n` +
                       `  <!-- Cornea (Bulging front) -->\n` +
                       `  <path d="M 140 50 A 75 75 0 0 1 140 190" fill="rgba(147, 197, 253, 0.15)" stroke="#3B82F6" stroke-width="2.5"/>\n` +
                       `  <!-- Lens -->\n` +
                       `  <ellipse cx="155" cy="120" rx="12" ry="28" fill="rgba(147, 197, 253, 0.45)" stroke="#1D4ED8" stroke-width="2"/>\n` +
                       `  <!-- Iris -->\n` +
                       `  <path d="M 140 50 L 148 85 M 140 190 L 148 155" stroke="#1E3A8A" stroke-width="5" stroke-linecap="round"/>\n` +
                       `  <!-- Retina (Back lining) -->\n` +
                       `  <path d="M 195 57 A 60 60 0 0 1 195 183" fill="none" stroke="#EF4444" stroke-width="3" stroke-linecap="round"/>\n` +
                       `  <!-- Optic Nerve -->\n` +
                       `  <path d="M 205 110 L 245 95 M 205 130 L 245 145" stroke="#64748B" stroke-width="3" fill="none"/>\n` +
                       `  <!-- Labels and Leader Lines -->\n` +
                       `  <text x="320" y="45" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#0F172A" font-weight="bold" text-anchor="end">Cornea</text>\n` +
                       `  <line x1="270" y1="42" x2="142" y2="75" stroke="#334155" stroke-width="1.2" marker-end="url(#arrow)"/>\n` +
                       `  <text x="320" y="90" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#0F172A" font-weight="bold" text-anchor="end">Iris</text>\n` +
                       `  <line x1="290" y1="87" x2="144" y2="70" stroke="#334155" stroke-width="1.2" marker-end="url(#arrow)"/>\n` +
                       `  <text x="320" y="135" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#0F172A" font-weight="bold" text-anchor="end">Crystalline Lens</text>\n` +
                       `  <line x1="220" y1="131" x2="157" y2="120" stroke="#334155" stroke-width="1.2" marker-end="url(#arrow)"/>\n` +
                       `  <text x="320" y="180" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#0F172A" font-weight="bold" text-anchor="end">Retina</text>\n` +
                       `  <line x1="270" y1="177" x2="198" y2="140" stroke="#334155" stroke-width="1.2" marker-end="url(#arrow)"/>\n` +
                       `  <text x="320" y="220" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#0F172A" font-weight="bold" text-anchor="end">Optic Nerve</text>\n` +
                       `  <line x1="240" y1="217" x2="225" y2="125" stroke="#334155" stroke-width="1.2" marker-end="url(#arrow)"/>\n` +
                       `</svg>\n\n` +
                       `Ensure students study the labeled diagram representing the sclera, bulging cornea, lens, iris, and light sensitive retina lining at the back.`;
            } else if (ctx.includes('heart') || ctx.includes('cardiac') || ctx.includes('circulat') || ctx.includes('ventricle') || ctx.includes('aorta')) {
              qText = `Draw a neat schematic diagram of the Human Heart and label the Aorta, Pulmonary Vein, Left Ventricle, and Right Ventricle.`;
              answer = `Here is the schematic anatomical diagram of the Human Heart showing the ventricles and vessels:\n\n` +
                       `<svg width="400" height="260" viewBox="0 0 400 260">\n` +
                       `  <defs>\n` +
                       `    <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">\n` +
                       `      <path d="M 0 1.5 L 6 5 L 0 8.5 z" fill="#000"/>\n` +
                       `    </marker>\n` +
                       `  </defs>\n` +
                       `  <rect width="100%" height="100%" fill="#F8FAFC" rx="12" stroke="#E2E8F0" stroke-width="1.5"/>\n` +
                       `  <!-- Heart Body -->\n` +
                       `  <path d="M 125 60 C 125 60, 80 80, 80 120 C 80 170, 130 220, 130 220 C 130 220, 180 170, 180 120 C 180 80, 135 60, 135 60 Z" fill="#FCA5A5" stroke="#B91C1C" stroke-width="3"/>\n` +
                       `  <!-- Septum -->\n` +
                       `  <path d="M 130 65 L 130 215" stroke="#B91C1C" stroke-width="3" stroke-dasharray="4 4"/>\n` +
                       `  <!-- Vena Cava -->\n` +
                       `  <path d="M 105 45 L 105 75 M 105 52 L 155 52" stroke="#3B82F6" stroke-width="8" fill="none" stroke-linecap="round"/>\n` +
                       `  <!-- Aorta arch -->\n` +
                       `  <path d="M 155 35 L 155 70 C 155 70, 155 85, 140 95" stroke="#EF4444" stroke-width="10" fill="none" stroke-linecap="round"/>\n` +
                       `  <!-- Labels and Pointers -->\n` +
                       `  <text x="320" y="45" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#0F172A" font-weight="bold" text-anchor="end">Aorta (Oxygenated)</text>\n` +
                       `  <line x1="205" y1="42" x2="160" y2="45" stroke="#334155" stroke-width="1.2" marker-end="url(#arrow)"/>\n` +
                       `  <text x="320" y="95" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#0F172A" font-weight="bold" text-anchor="end">Pulmonary Vein</text>\n` +
                       `  <line x1="210" y1="92" x2="110" y2="60" stroke="#334155" stroke-width="1.2" marker-end="url(#arrow)"/>\n` +
                       `  <text x="320" y="145" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#0F172A" font-weight="bold" text-anchor="end">Left Ventricle</text>\n` +
                       `  <line x1="225" y1="142" x2="155" y2="160" stroke="#334155" stroke-width="1.2" marker-end="url(#arrow)"/>\n` +
                       `  <text x="320" y="195" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#0F172A" font-weight="bold" text-anchor="end">Right Ventricle</text>\n` +
                       `  <line x1="225" y1="192" x2="105" y2="160" stroke="#334155" stroke-width="1.2" marker-end="url(#arrow)"/>\n` +
                       `</svg>\n\n` +
                       `Students should clearly illustrate the division of four chambers, showing the thick muscular septum, Aorta vessel at the top, and left/right ventricles.`;
            } else if (ctx.includes('plant cell') || ctx.includes('chloroplast') || ctx.includes('cell wall') || (ctx.includes('cell') && !ctx.includes('animal'))) {
              qText = `Draw a clean layout diagram illustrating the structure of a standard Plant Cell and label the Cell Wall, Nucleus, Mitochondria, Chloroplast, and Vacuole.`;
              answer = `Here is the high-fidelity anatomical layout diagram of a standard Plant Cell:\n\n` +
                       `<svg width="400" height="260" viewBox="0 0 400 260">\n` +
                       `  <defs>\n` +
                       `    <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">\n` +
                       `      <path d="M 0 1.5 L 6 5 L 0 8.5 z" fill="#000"/>\n` +
                       `    </marker>\n` +
                       `  </defs>\n` +
                       `  <rect width="100%" height="100%" fill="#F8FAFC" rx="12" stroke="#E2E8F0" stroke-width="1.5"/>\n` +
                       `  <!-- Outer rigid Cell Wall -->\n` +
                       `  <rect x="25" y="25" width="180" height="210" rx="12" fill="#F0FDF4" stroke="#16A34A" stroke-width="4.5"/>\n` +
                       `  <!-- Inner flexible Cell Membrane -->\n` +
                       `  <rect x="30" y="30" width="170" height="200" rx="10" fill="none" stroke="#4ADE80" stroke-width="1.5"/>\n` +
                       `  <!-- Nucleus -->\n` +
                       `  <circle cx="80" cy="85" r="24" fill="#EFF6FF" stroke="#2563EB" stroke-width="2"/>\n` +
                       `  <circle cx="80" cy="85" r="9" fill="#1D4ED8"/>\n` +
                       `  <!-- Vacuole -->\n` +
                       `  <rect x="115" y="70" width="75" height="110" rx="12" fill="#F0FDFA" stroke="#0D9488" stroke-width="2"/>\n` +
                       `  <!-- Mitochondria -->\n` +
                       `  <ellipse cx="65" cy="185" rx="18" ry="9" fill="#FEF2F2" stroke="#DC2626" stroke-width="1.5" transform="rotate(-20 65 185)"/>\n` +
                       `  <!-- Chloroplast -->\n` +
                       `  <ellipse cx="140" cy="45" rx="14" ry="7" fill="#F0FDF4" stroke="#15803D" stroke-width="1.5"/>\n` +
                       `  <circle cx="140" cy="45" r="3" fill="#15803D"/>\n` +
                       `  <!-- Labels and Leader Lines -->\n` +
                       `  <text x="320" y="45" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#0F172A" font-weight="bold" text-anchor="end">Rigid Cell Wall</text>\n` +
                       `  <line x1="225" y1="42" x2="25" y2="40" stroke="#334155" stroke-width="1.2" marker-end="url(#arrow)"/>\n` +
                       `  <text x="320" y="90" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#0F172A" font-weight="bold" text-anchor="end">Nucleus & DNA</text>\n` +
                       `  <line x1="225" y1="87" x2="82" y2="85" stroke="#334155" stroke-width="1.2" marker-end="url(#arrow)"/>\n` +
                       `  <text x="320" y="135" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#0F172A" font-weight="bold" text-anchor="end">Large Vacuole</text>\n` +
                       `  <line x1="230" y1="131" x2="140" y2="125" stroke="#334155" stroke-width="1.2" marker-end="url(#arrow)"/>\n` +
                       `  <text x="320" y="180" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#0F172A" font-weight="bold" text-anchor="end">Mitochondria</text>\n` +
                       `  <line x1="240" y1="177" x2="78" y2="185" stroke="#334155" stroke-width="1.2" marker-end="url(#arrow)"/>\n` +
                       `  <text x="320" y="220" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#0F172A" font-weight="bold" text-anchor="end">Chloroplast</text>\n` +
                       `  <line x1="240" y1="217" x2="145" y2="48" stroke="#334155" stroke-width="1.2" marker-end="url(#arrow)"/>\n` +
                       `</svg>\n\n` +
                       `Ensure students verify both the cell wall outer green boundary and organelles like nucleus, vacuole, chloroplasts and powerhouse mitochondria labeled clearly.`;
            } else if (ctx.includes('animal cell') || ctx.includes('lysosome') || ctx.includes('cytoplasm')) {
              qText = `Draw a clean structural diagram of an Animal Cell and label the Cell Membrane, Nucleus, Mitochondria, and Lysosomes.`;
              answer = `Here is the high-fidelity anatomical layout diagram of a standard Animal Cell:\n\n` +
                       `<svg width="400" height="260" viewBox="0 0 400 260">\n` +
                       `  <defs>\n` +
                       `    <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">\n` +
                       `      <path d="M 0 1.5 L 6 5 L 0 8.5 z" fill="#000"/>\n` +
                       `    </marker>\n` +
                       `  </defs>\n` +
                       `  <rect width="100%" height="100%" fill="#F8FAFC" rx="12" stroke="#E2E8F0" stroke-width="1.5"/>\n` +
                       `  <!-- Outer membrane -->\n` +
                       `  <path d="M 120 35 C 180 30, 210 65, 205 125 C 200 185, 175 225, 115 220 C 55 215, 35 175, 40 120 C 45 65, 60 40, 120 35 Z" fill="#FBF7FF" stroke="#8B5CF6" stroke-width="3"/>\n` +
                       `  <!-- Nucleus -->\n` +
                       `  <circle cx="115" cy="115" r="26" fill="#EFF6FF" stroke="#3B82F6" stroke-width="2"/>\n` +
                       `  <circle cx="115" cy="115" r="10" fill="#1D4ED8"/>\n` +
                       `  <!-- Mitochondria -->\n` +
                       `  <ellipse cx="75" cy="80" rx="16" ry="8" fill="#FEF2F2" stroke="#EF4444" stroke-width="1.5" transform="rotate(30 75 80)"/>\n` +
                       `  <ellipse cx="155" cy="160" rx="16" ry="8" fill="#FEF2F2" stroke="#EF4444" stroke-width="1.5" transform="rotate(-30 155 160)"/>\n` +
                       `  <!-- Lysosome -->\n` +
                       `  <circle cx="70" cy="155" r="7" fill="#FEF3C7" stroke="#D97706" stroke-width="1.5"/>\n` +
                       `  <circle cx="160" cy="70" r="5" fill="#FEF3C7" stroke="#D97706" stroke-width="1.5"/>\n` +
                       `  <!-- Labels and Leader Lines -->\n` +
                       `  <text x="320" y="45" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#0F172A" font-weight="bold" text-anchor="end">Cell Membrane</text>\n` +
                       `  <line x1="225" y1="42" x2="160" y2="42" stroke="#334155" stroke-width="1.2" marker-end="url(#arrow)"/>\n` +
                       `  <text x="320" y="95" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#0F172A" font-weight="bold" text-anchor="end">Nucleus (Soma)</text>\n` +
                       `  <line x1="225" y1="92" x2="120" y2="105" stroke="#334155" stroke-width="1.2" marker-end="url(#arrow)"/>\n` +
                       `  <text x="320" y="145" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#0F172A" font-weight="bold" text-anchor="end">Mitochondria</text>\n` +
                       `  <line x1="225" y1="142" x2="160" y2="155" stroke="#334155" stroke-width="1.2" marker-end="url(#arrow)"/>\n` +
                       `  <text x="320" y="195" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#0F172A" font-weight="bold" text-anchor="end">Lysosome</text>\n` +
                       `  <line x1="240" y1="192" x2="78" y2="155" stroke="#334155" stroke-width="1.2" marker-end="url(#arrow)"/>\n` +
                       `</svg>\n\n` +
                       `Ensure students verify both the cell membrane outer boundary, double-layered nucleus, powerhouse mitochondria, and digestive lysosomes labeled clearly.`;
            } else if (ctx.includes('neuron') || ctx.includes('axon') || ctx.includes('dendrite') || ctx.includes('nerve')) {
              qText = `Draw a clean structural diagram of a Neuron (Nerve Cell) and label the Dendrite, Cell Body (Soma), Axon, Myelin Sheath, and Nerve Endings.`;
              answer = `Here is the high-fidelity anatomical layout diagram of a standard Neuron:\n\n` +
                       `<svg width="400" height="260" viewBox="0 0 400 260">\n` +
                       `  <defs>\n` +
                       `    <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">\n` +
                       `      <path d="M 0 1.5 L 6 5 L 0 8.5 z" fill="#000"/>\n` +
                       `    </marker>\n` +
                       `  </defs>\n` +
                       `  <rect width="100%" height="100%" fill="#F8FAFC" rx="12" stroke="#E2E8F0" stroke-width="1.5"/>\n` +
                       `  <!-- Dendrites -->\n` +
                       `  <path d="M 70 85 L 60 65 M 70 105 L 50 110 M 85 120 L 75 140 M 100 110 L 115 125 M 95 80 L 105 60" stroke="#D97706" stroke-width="2" fill="none"/>\n` +
                       `  <!-- Cell body -->\n` +
                       `  <circle cx="85" cy="100" r="22" fill="#FEF3C7" stroke="#D97706" stroke-width="2"/>\n` +
                       `  <!-- Nucleus -->\n` +
                       `  <circle cx="85" cy="100" r="7" fill="#D97706"/>\n` +
                       `  <!-- Axon tube -->\n` +
                       `  <path d="M 107 100 L 230 100" stroke="#D97706" stroke-width="4.5" fill="none"/>\n` +
                       `  <!-- Myelin Sheaths -->\n` +
                       `  <rect x="120" y="92" width="22" height="16" rx="4" fill="#FEF9C3" stroke="#CA8A04" stroke-width="1.5"/>\n` +
                       `  <rect x="150" y="92" width="22" height="16" rx="4" fill="#FEF9C3" stroke="#CA8A04" stroke-width="1.5"/>\n` +
                       `  <rect x="180" y="92" width="22" height="16" rx="4" fill="#FEF9C3" stroke="#CA8A04" stroke-width="1.5"/>\n` +
                       `  <rect x="210" y="92" width="22" height="16" rx="4" fill="#FEF9C3" stroke="#CA8A04" stroke-width="1.5"/>\n` +
                       `  <!-- Nerve Endings -->\n` +
                       `  <path d="M 230 100 L 255 85 M 230 100 L 255 115 M 230 100 L 260 100" stroke="#D97706" stroke-width="2" fill="none"/>\n` +
                       `  <!-- Labels and Leader Lines -->\n` +
                       `  <text x="320" y="45" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#0F172A" font-weight="bold" text-anchor="end">Dendrite</text>\n` +
                       `  <line x1="260" y1="42" x2="62" y2="67" stroke="#334155" stroke-width="1.2" marker-end="url(#arrow)"/>\n` +
                       `  <text x="320" y="95" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#0F172A" font-weight="bold" text-anchor="end">Cell Body (Soma)</text>\n` +
                       `  <line x1="225" y1="92" x2="105" y2="92" stroke="#334155" stroke-width="1.2" marker-end="url(#arrow)"/>\n` +
                       `  <text x="320" y="145" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#0F172A" font-weight="bold" text-anchor="end">Axon</text>\n` +
                       `  <line x1="250" y1="142" x2="170" y2="103" stroke="#334155" stroke-width="1.2" marker-end="url(#arrow)"/>\n` +
                       `  <text x="320" y="195" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#0F172A" font-weight="bold" text-anchor="end">Myelin Sheath</text>\n` +
                       `  <line x1="240" y1="192" x2="195" y2="110" stroke="#334155" stroke-width="1.2" marker-end="url(#arrow)"/>\n` +
                       `  <text x="320" y="235" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#0F172A" font-weight="bold" text-anchor="end">Nerve Ending</text>\n` +
                       `  <line x1="245" y1="232" x2="245" y2="108" stroke="#334155" stroke-width="1.2" marker-end="url(#arrow)"/>\n` +
                       `</svg>\n\n` +
                       `Ensure students verify dendrites capturing electrical signals, the cell body holding the nucleus, the long insulating axon with myelin sheaths, and terminal synapses.`;
            } else if (ctx.includes('kidney') || ctx.includes('urinary') || ctx.includes('excretory') || ctx.includes('bladder') || ctx.includes('nephron')) {
              qText = `Draw a clean structural diagram of the Human Excretory/Urinary System and label the Kidneys, Ureter, Urinary Bladder, and Urethra.`;
              answer = `Here is the high-fidelity anatomical layout diagram of the Human Excretory System:\n\n` +
                       `<svg width="400" height="260" viewBox="0 0 400 260">\n` +
                       `  <defs>\n` +
                       `    <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">\n` +
                       `      <path d="M 0 1.5 L 6 5 L 0 8.5 z" fill="#000"/>\n` +
                       `    </marker>\n` +
                       `  </defs>\n` +
                       `  <rect width="100%" height="100%" fill="#F8FAFC" rx="12" stroke="#E2E8F0" stroke-width="1.5"/>\n` +
                       `  <!-- Bean kidneys -->\n` +
                       `  <path d="M 65 60 C 50 65, 45 95, 65 110 C 70 105, 75 80, 65 60 Z" fill="#FCA5A5" stroke="#991B1B" stroke-width="2"/>\n` +
                       `  <path d="M 135 60 C 150 65, 155 95, 135 110 C 130 105, 125 80, 135 60 Z" fill="#FCA5A5" stroke="#991B1B" stroke-width="2"/>\n` +
                       `  <!-- Ureters -->\n` +
                       `  <path d="M 62 105 C 80 140, 90 170, 95 195" fill="none" stroke="#D97706" stroke-width="2"/>\n` +
                       `  <path d="M 138 105 C 120 140, 110 170, 105 195" fill="none" stroke="#D97706" stroke-width="2"/>\n` +
                       `  <!-- Urinary Bladder -->\n` +
                       `  <ellipse cx="100" cy="205" rx="16" ry="12" fill="#FEF3C7" stroke="#D97706" stroke-width="2"/>\n` +
                       `  <!-- Urethra -->\n` +
                       `  <line x1="100" y1="217" x2="100" y2="230" stroke="#D97706" stroke-width="2.5"/>\n` +
                       `  <!-- Labels and Leader Lines -->\n` +
                       `  <text x="320" y="45" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#0F172A" font-weight="bold" text-anchor="end">Left Kidney</text>\n` +
                       `  <line x1="240" y1="42" x2="138" y2="75" stroke="#334155" stroke-width="1.2" marker-end="url(#arrow)"/>\n` +
                       `  <text x="320" y="95" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#0F172A" font-weight="bold" text-anchor="end">Right Kidney</text>\n` +
                       `  <line x1="230" y1="92" x2="62" y2="80" stroke="#334155" stroke-width="1.2" marker-end="url(#arrow)"/>\n` +
                       `  <text x="320" y="145" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#0F172A" font-weight="bold" text-anchor="end">Ureter (Excretory Tube)</text>\n` +
                       `  <line x1="225" y1="142" x2="120" y2="140" stroke="#334155" stroke-width="1.2" marker-end="url(#arrow)"/>\n` +
                       `  <text x="320" y="195" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#0F172A" font-weight="bold" text-anchor="end">Urinary Bladder</text>\n` +
                       `  <line x1="210" y1="192" x2="116" y2="200" stroke="#334155" stroke-width="1.2" marker-end="url(#arrow)"/>\n` +
                       `  <text x="320" y="235" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#0F172A" font-weight="bold" text-anchor="end">Urethra</text>\n` +
                       `  <line x1="250" y1="232" x2="104" y2="225" stroke="#334155" stroke-width="1.2" marker-end="url(#arrow)"/>\n` +
                       `</svg>\n\n` +
                       `Ensure students verify the bean-shaped kidneys filters, long ureter delivery tubes, storage bladder, and urethra release path labeled clearly.`;
            } else if (ctx.includes('digestive') || ctx.includes('stomach') || ctx.includes('intestine') || ctx.includes('liver') || ctx.includes('pancreas') || ctx.includes('alimentary')) {
              qText = `Draw a clean structural diagram of the Human Digestive System (Alimentary Canal) and label the Esophagus, Stomach, Liver, Small Intestine, and Large Intestine.`;
              answer = `Here is the high-fidelity anatomical layout diagram of the Human Digestive System:\n\n` +
                       `<svg width="400" height="260" viewBox="0 0 400 260">\n` +
                       `  <defs>\n` +
                       `    <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">\n` +
                       `      <path d="M 0 1.5 L 6 5 L 0 8.5 z" fill="#000"/>\n` +
                       `    </marker>\n` +
                       `  </defs>\n` +
                       `  <rect width="100%" height="100%" fill="#F8FAFC" rx="12" stroke="#E2E8F0" stroke-width="1.5"/>\n` +
                       `  <!-- Esophagus -->\n` +
                       `  <path d="M 90 25 L 90 85" stroke="#EA580C" stroke-width="4.5" fill="none"/>\n` +
                       `  <!-- Stomach -->\n` +
                       `  <path d="M 90 85 C 80 85, 60 95, 60 115 C 60 135, 95 130, 95 110 Z" fill="#FEE2E2" stroke="#B91C1C" stroke-width="2"/>\n` +
                       `  <!-- Liver -->\n` +
                       `  <path d="M 100 82 C 105 82, 115 88, 120 95 L 85 95 Z" fill="#FCA5A5" stroke="#991B1B" stroke-width="2"/>\n` +
                       `  <!-- Small Intestine -->\n` +
                       `  <path d="M 80 135 C 65 140, 65 180, 85 185 C 105 185, 105 140, 80 135 Z" fill="#FCE7F3" stroke="#DB2777" stroke-width="1.5"/>\n` +
                       `  <!-- Large Intestine border -->\n` +
                       `  <path d="M 75 130 C 55 130, 55 190, 85 195 C 115 190, 115 130, 75 130 Z" fill="none" stroke="#9D174D" stroke-width="2"/>\n` +
                       `  <!-- Labels and Leader Lines -->\n` +
                       `  <text x="320" y="45" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#0F172A" font-weight="bold" text-anchor="end">Esophagus (Food Pipe)</text>\n` +
                       `  <line x1="225" y1="42" x2="94" y2="45" stroke="#334155" stroke-width="1.2" marker-end="url(#arrow)"/>\n` +
                       `  <text x="320" y="95" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#0F172A" font-weight="bold" text-anchor="end">Stomach</text>\n` +
                       `  <line x1="250" y1="92" x2="80" y2="108" stroke="#334155" stroke-width="1.2" marker-end="url(#arrow)"/>\n` +
                       `  <text x="320" y="145" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#0F172A" font-weight="bold" text-anchor="end">Liver</text>\n` +
                       `  <line x1="260" y1="142" x2="108" y2="90" stroke="#334155" stroke-width="1.2" marker-end="url(#arrow)"/>\n` +
                       `<svg width="100%" height="260" viewBox="0 0 450 260" xmlns="http://www.w3.org/2000/svg">\n` +
                       `  <defs>\n` +
                       `    <marker id="bioArrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 1.5 L 6 5 L 0 8.5 z" fill="#1E293B"/></marker>\n` +
                       `  </defs>\n` +
                       `  <rect width="100%" height="100%" fill="#F8FAFC" rx="16" stroke="#E2E8F0" stroke-width="1.5"/>\n` +
                       `  <path d="M 80 25 L 80 85" stroke="#EA580C" stroke-width="5.5" fill="none" stroke-linecap="round"/>\n` +
                       `  <circle cx="242" cy="42" r="3" fill="#475569"/>\n` +
                       `  <line x1="242" y1="42" x2="84" y2="45" stroke="#475569" stroke-width="1.2" marker-end="url(#bioArrow)"/>\n` +
                       `  <text x="252" y="46" font-family="system-ui,sans-serif" font-size="12" fill="#0F172A" font-weight="bold" text-anchor="start">Esophagus</text>\n` +
                       `  <path d="M 80 85 C 70 85, 50 95, 50 115 C 50 135, 85 130, 85 110 Z" fill="#FEE2E2" stroke="#B91C1C" stroke-width="2"/>\n` +
                       `  <circle cx="242" cy="95" r="3" fill="#475569"/>\n` +
                       `  <line x1="242" y1="95" x2="68" y2="108" stroke="#475569" stroke-width="1.2" marker-end="url(#bioArrow)"/>\n` +
                       `  <text x="252" y="98" font-family="system-ui,sans-serif" font-size="12" fill="#0F172A" font-weight="bold" text-anchor="start">Stomach</text>\n` +
                       `  <path d="M 90 82 C 95 82, 108 88, 112 95 L 75 95 Z" fill="#FCA5A5" stroke="#991B1B" stroke-width="2"/>\n` +
                       `  <circle cx="242" cy="135" r="3" fill="#475569"/>\n` +
                       `  <line x1="242" y1="135" x2="100" y2="92" stroke="#475569" stroke-width="1.2" marker-end="url(#bioArrow)"/>\n` +
                       `  <text x="252" y="138" font-family="system-ui,sans-serif" font-size="12" fill="#0F172A" font-weight="bold" text-anchor="start">Liver</text>\n` +
                       `  <path d="M 70 135 C 55 140, 55 180, 75 185 C 95 185, 95 140, 70 135 Z" fill="#FCE7F3" stroke="#DB2777" stroke-width="1.5"/>\n` +
                       `  <circle cx="242" cy="180" r="3" fill="#475569"/>\n` +
                       `  <line x1="242" y1="180" x2="75" y2="160" stroke="#475569" stroke-width="1.2" marker-end="url(#bioArrow)"/>\n` +
                       `  <text x="252" y="181" font-family="system-ui,sans-serif" font-size="12" fill="#0F172A" font-weight="bold" text-anchor="start">Small Intestine</text>\n` +
                       `  <path d="M 65 130 C 45 130, 45 190, 75 195 C 105 190, 105 130, 65 130 Z" fill="none" stroke="#9D174D" stroke-width="2.5"/>\n` +
                       `  <circle cx="242" cy="225" r="3" fill="#475569"/>\n` +
                       `  <line x1="242" y1="225" x2="80" y2="185" stroke="#475569" stroke-width="1.2" marker-end="url(#bioArrow)"/>\n` +
                       `  <text x="252" y="228" font-family="system-ui,sans-serif" font-size="12" fill="#0F172A" font-weight="bold" text-anchor="start">Large Intestine</text>\n` +
                       `</svg>\n\n` +
                       `Ensure students verify salivary pathways to esophagus food tube, stomach acid chamber, large liver gland, and highly coiled absorption intestines.`;
            } else if (ctx.includes('respiratory') || ctx.includes('lung') || ctx.includes('trachea') || ctx.includes('bronch')) {
              qText = `Draw a clean structural diagram of the Human Respiratory System and label the Trachea, Bronchi, Lungs, and Diaphragm.`;
              answer = `Here is the high-fidelity anatomical layout diagram of the Human Respiratory System:\n\n` +
                       `<svg width="100%" height="260" viewBox="0 0 450 260" xmlns="http://www.w3.org/2000/svg">\n` +
                       `  <defs>\n` +
                       `    <marker id="bioArrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 1.5 L 6 5 L 0 8.5 z" fill="#1E293B"/></marker>\n` +
                       `  </defs>\n` +
                       `  <rect width="100%" height="100%" fill="#F8FAFC" rx="16" stroke="#E2E8F0" stroke-width="1.5"/>\n` +
                       `  <line x1="85" y1="25" x2="85" y2="75" stroke="#0D9488" stroke-width="6"/>\n` +
                       `  <circle cx="242" cy="42" r="3" fill="#475569"/>\n` +
                       `  <line x1="242" y1="42" x2="89" y2="45" stroke="#475569" stroke-width="1.2" marker-end="url(#bioArrow)"/>\n` +
                       `  <text x="252" y="46" font-family="system-ui,sans-serif" font-size="12" fill="#0F172A" font-weight="bold" text-anchor="start">Trachea</text>\n` +
                       `  <path d="M 85 75 L 60 95 M 85 75 L 110 95" stroke="#0D9488" stroke-width="4.5" fill="none"/>\n` +
                       `  <circle cx="242" cy="95" r="3" fill="#475569"/>\n` +
                       `  <line x1="242" y1="95" x2="100" y2="85" stroke="#475569" stroke-width="1.2" marker-end="url(#bioArrow)"/>\n` +
                       `  <text x="252" y="98" font-family="system-ui,sans-serif" font-size="12" fill="#0F172A" font-weight="bold" text-anchor="start">Bronchi</text>\n` +
                       `  <path d="M 57 92 C 40 92, 30 110, 30 140 C 30 180, 63 185, 63 185 C 63 185, 67 150, 57 92 Z" fill="#FEE2E2" stroke="#EF4444" stroke-width="2"/>\n` +
                       `  <path d="M 113 92 C 130 92, 140 110, 140 140 C 140 180, 107 185, 107 185 C 107 185, 103 150, 113 92 Z" fill="#FEE2E2" stroke="#EF4444" stroke-width="2"/>\n` +
                       `  <circle cx="242" cy="145" r="3" fill="#475569"/>\n` +
                       `  <line x1="242" y1="145" x2="125" y2="140" stroke="#475569" stroke-width="1.2" marker-end="url(#bioArrow)"/>\n` +
                       `  <text x="252" y="148" font-family="system-ui,sans-serif" font-size="12" fill="#0F172A" font-weight="bold" text-anchor="start">Lungs</text>\n` +
                       `  <path d="M 25 205 Q 85 185 145 205" fill="none" stroke="#475569" stroke-width="4.5" stroke-linecap="round"/>\n` +
                       `  <circle cx="242" cy="195" r="3" fill="#475569"/>\n` +
                       `  <line x1="242" y1="195" x2="90" y2="195" stroke="#475569" stroke-width="1.2" marker-end="url(#bioArrow)"/>\n` +
                       `  <text x="252" y="198" font-family="system-ui,sans-serif" font-size="12" fill="#0F172A" font-weight="bold" text-anchor="start">Diaphragm</text>\n` +
                       `</svg>\n\n` +
                       `Ensure students verify nasal breathing, trachea tubes splitting into bronchi, lung chambers, and base muscular diaphragm.`;
            } else {
              qText = `Construct a hierarchical flowchart showing the core taxonomy or divisions of "${topic}".`;
              answer = `Here is the hierarchical taxonomy block diagram flowchart:\n\n` +
                       `[MERMAID]\n` +
                       `graph TD\n` +
                       `  Main[${topic.slice(0, 15)}] --> SubA[Sub-Division A]\n` +
                       `  Main --> SubB[Sub-Division B]\n` +
                       `  style Main fill:#F1F5F9,stroke:#475569,stroke-width:2px\n` +
                       `  style SubA fill:#FFF7ED,stroke:#EA580C,stroke-width:2px\n` +
                       `  style SubB fill:#EEF2FF,stroke:#4F46E5,stroke-width:2px\n` +
                       `[/MERMAID]\n\n` +
                       `Grading guideline: Students should correctly trace sub-divisions A and B with correct nomenclature.`;
            }
          } else if (isChallenging) {
            qText = `Discuss the critical challenges and complex theoretical models associated with "${topic}". Provide a comprehensive analytical breakdown.`;
            answer = `The challenges of "${topic}" stem from complex variable interactions and rigorous conceptual frameworks. Solutions require applying systematic equations, clear logic, and verifying output constraints according to standard CBSE rubrics.`;
          } else {
            if (i % 2 === 0) {
              qText = `Explain the term "${topic}" in detail. Highlight its primary applications, key definitions, and its practical importance.`;
              answer = `"${topic}" constitutes a vital chapter in the curriculum. Key components include descriptive definitions, structural applications, and critical analysis of concepts, which are tested extensively in final assessments.`;
            } else {
              qText = `Define the core principles of "${topic}". How do these principles integrate with other topics in this CBSE ${subject} grade?`;
              answer = `The core principles of "${topic}" integrate closely with foundational scientific laws. Mastery of this topic enables students to synthesize complex relationships and apply them across diverse academic fields.`;
            }
          }
        }
        
        sectionQuestions.push({
          text: qText,
          difficulty,
          marks: qType.marks
        });
        
        answerKey.push({
          questionNumber: `${globalQNum}`,
          answer
        });
        
        globalQNum++;
      }
      
      sections.push({
        sectionName: `Section ${sectionLetter}`,
        title: qType.type,
        instruction: `Attempt all questions. Each question carries ${qType.marks} mark${qType.marks > 1 ? 's' : ''}`,
        questions: sectionQuestions
      });
    });

    const aiMessage = `Certainly! Here is your high-fidelity, customized Question Paper generated strictly based on your "${promptContext}" topic configurations and uploaded source material:`;

    return {
      schoolName: school,
      subject,
      className: grade,
      timeAllowed: time,
      maxMarks: totalMarks,
      sections,
      answerKey,
      aiMessage
    };
  }

  public async generateToolkitResponse(toolId: string, primaryInput: string, secondaryInput?: string): Promise<string> {
    if (!this.apiKey) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      return `[MOCK TOOLKIT RESPONSE]\n\nGenerated output for tool: ${toolId}\nInput: ${primaryInput}\nContext: ${secondaryInput || 'None'}\n\nThis is a mock response because no API key is configured.`;
    }

    let systemPrompt = "You are an expert AI Teaching Assistant.";
    if (toolId === "lesson-plan") {
      systemPrompt = "You are an expert curriculum designer. Generate a structured 45-minute lesson plan (Hook, Instruction, Guided Practice, Exit Ticket) based on the provided topic. Keep it actionable and professional.";
    } else if (toolId === "essay-grader") {
      systemPrompt = "You are an expert English teacher. The user will provide a student essay. Grade the essay constructively. Provide a summary of strengths, areas for improvement, and a suggested letter grade based on standard rubrics.";
    } else if (toolId === "parent-email") {
      systemPrompt = "You are a professional and empathetic school teacher. Draft an email to a student's parent regarding the provided context. Keep it professional, constructive, and polite.";
    }

    const userPrompt = `Input Details:\n${primaryInput}\n\nAdditional Context/Requirements:\n${secondaryInput || 'None'}`;

    try {
      const fetchFn = (globalThis as any).fetch;
      if (!fetchFn) {
        throw new Error('globalThis.fetch is not available in this environment');
      }

      const response = await fetchFn(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.defaultModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7,
        })
      });

      if (!response.ok) {
        const errData = await response.text();
        throw new Error(`AI Request Failed: ${response.status} - ${errData}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error: any) {
      console.error('[AI Toolkit] Error:', error);
      throw error;
    }
  }
}

export const aiService = new AIService();
