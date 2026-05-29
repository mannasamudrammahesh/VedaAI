import { aiService } from './services/ai';

async function testGeneration() {
  console.log('Starting advanced class & diagram generation test...');
  try {
    const paper = await aiService.generateQuestionPaper(
      'Electricity Quiz for Class 10th',
      [
        { type: 'Multiple Choice Questions', count: 2, marks: 1 },
        { type: 'Diagram-Based Questions', count: 1, marks: 3 }
      ],
      3,
      5,
      'Ensure a detailed ammeter circuit diagram is included in the answer key for the diagram question.'
    );

    console.log('\n--- SUCCESS! Generated Paper ---');
    console.log('School:', paper.schoolName);
    console.log('Subject:', paper.subject);
    console.log('Class:', paper.className);
    console.log('Max Marks:', paper.maxMarks);
    console.log('Sections count:', paper.sections.length);
    paper.sections.forEach((s) => {
      console.log(`\nSection: ${s.sectionName} - ${s.title}`);
      s.questions.forEach((q, idx) => {
        console.log(`  Q${idx + 1}:`);
        console.log(q.text);
        console.log(`  (marks: ${q.marks}, difficulty: ${q.difficulty})`);
      });
    });
    console.log('\n--- ANSWER KEY ---');
    paper.answerKey.forEach((ans) => {
      console.log(`\nQuestion ${ans.questionNumber}:`);
      console.log(ans.answer);
    });
    console.log('--------------------------------\n');
  } catch (error) {
    console.error('Test generation failed:', error);
  }
}

testGeneration();
