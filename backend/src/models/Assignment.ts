import mongoose, { Schema, Document } from 'mongoose';

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

export interface IAssignment extends Document {
  title: string;
  dueDate: Date;
  assignedDate: Date;
  questionTypes: IQuestionTypeConfig[];
  totalQuestions: number;
  totalMarks: number;
  additionalInfo?: string;
  filePath?: string;
  fileName?: string;
  fileContentBase64?: string;
  className?: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  error?: string;
  generatedPaper?: IGeneratedPaper;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema = new Schema<IQuestion>({
  text: { type: String, required: true },
  difficulty: { type: String, enum: ['Easy', 'Moderate', 'Challenging'], required: true },
  marks: { type: Number, required: true }
});

const SectionSchema = new Schema<ISection>({
  sectionName: { type: String, required: true },
  title: { type: String, required: true },
  instruction: { type: String, required: true },
  questions: [QuestionSchema]
});

const AnswerKeyItemSchema = new Schema<IAnswerKeyItem>({
  questionNumber: { type: String, required: true },
  answer: { type: String, required: true }
});

const GeneratedPaperSchema = new Schema<IGeneratedPaper>({
  schoolName: { type: String, default: 'Delhi Public School, Vadodara, Gujarat' },
  subject: { type: String, default: 'Science' },
  className: { type: String, default: '8th' },
  timeAllowed: { type: String, default: '45 minutes' },
  maxMarks: { type: Number, default: 20 },
  sections: [SectionSchema],
  answerKey: [AnswerKeyItemSchema],
  aiMessage: { type: String }
});

const QuestionTypeConfigSchema = new Schema<IQuestionTypeConfig>({
  type: { type: String, required: true },
  count: { type: Number, required: true },
  marks: { type: Number, required: true }
});

const AssignmentSchema = new Schema<IAssignment>(
  {
    title: { type: String, required: true },
    dueDate: { type: Date, required: true },
    assignedDate: { type: Date, default: Date.now },
    questionTypes: [QuestionTypeConfigSchema],
    totalQuestions: { type: Number, required: true },
    totalMarks: { type: Number, required: true },
    additionalInfo: { type: String },
    filePath: { type: String },
    fileName: { type: String },
    fileContentBase64: { type: String },
    className: { type: String, default: '8th' },
    status: {
      type: String,
      enum: ['pending', 'generating', 'completed', 'failed'],
      default: 'pending'
    },
    error: { type: String },
    generatedPaper: GeneratedPaperSchema,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', index: true }
  },
  { timestamps: true }
);

export default mongoose.model<IAssignment>('Assignment', AssignmentSchema);
