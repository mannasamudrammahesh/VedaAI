import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Assignment from '../models/Assignment';
import User from '../models/User';
import bcrypt from 'bcryptjs';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/veda-assessment';

export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Successfully connected to MongoDB.');

    // Seed mock user if no users exist
    let demoUser = await User.findOne({ email: 'teacher@veda.ai' });
    if (!demoUser) {
      console.log('No demo user found. Seeding teacher@veda.ai...');
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('password123', salt);
      
      demoUser = new User({
        name: 'Demo Teacher',
        email: 'teacher@veda.ai',
        passwordHash
      });
      await demoUser.save();
      console.log('Successfully seeded "teacher@veda.ai" with password "password123".');
    }

    // Seed mock assignments if database is empty or no assignments exist for the demo user
    const count = await Assignment.countDocuments({ createdBy: demoUser!._id });
    if (count === 0 && demoUser) {
      console.log('Demo user has no assignments. Seeding 6 mock "Quiz on Electricity" assignments matching Figma mockup...');
      
      const mockAssignments = Array.from({ length: 6 }).map((_, i) => ({
        title: 'Quiz on Electricity',
        assignedDate: new Date('2025-06-20'),
        dueDate: new Date('2025-06-21'),
        totalQuestions: 5,
        totalMarks: 20,
        status: 'completed',
        createdBy: demoUser!._id,
        questionTypes: [
          { type: 'MCQs', count: 3, marks: 2 },
          { type: 'Short Answers', count: 2, marks: 5 }
        ],
        generatedPaper: {
          schoolName: 'Delhi Public School, Vadodara, Gujarat',
          subject: 'Science (Physics)',
          className: 'Grade 8',
          timeAllowed: '45 mins',
          maxMarks: 20,
          sections: [
            {
              sectionName: 'Section A',
              title: 'Multiple Choice Questions (MCQs)',
              instruction: 'Select the single most correct alternative',
              questions: [
                { text: 'Which of the following is a good conductor of electricity?', difficulty: 'Easy', marks: 2 },
                { text: 'The process of electroplating is used for:', difficulty: 'Moderate', marks: 2 },
                { text: 'Pure distilled water is a non-conductor of electricity because:', difficulty: 'Moderate', marks: 2 }
              ]
            },
            {
              sectionName: 'Section B',
              title: 'Short Answer Questions',
              instruction: 'Provide brief conceptual justifications',
              questions: [
                { text: 'Why does tap water conduct electricity while distilled water does not?', difficulty: 'Easy', marks: 5 },
                { text: 'Explain how a copper coin can be electroplated with silver.', difficulty: 'Challenging', marks: 5 }
              ]
            }
          ],
          answerKey: [
            { questionNumber: '1', answer: 'a) Copper. Copper has free electrons that allow current flow.' },
            { questionNumber: '2', answer: 'b) Electroplating. Electroplating uses electrical current to coat metals.' },
            { questionNumber: '3', answer: 'd) Distilled water. It lacks dissolved salts and ions.' },
            { questionNumber: '4', answer: 'Tap water contains dissolved salts/minerals acting as charge carrying ions, while distilled water lacks ions.' },
            { questionNumber: '5', answer: 'Connect copper coin to cathode (negative) and silver plate to anode (positive) in a silver nitrate solution.' }
          ],
          aiMessage: 'Here is your customized Question Paper for CBSE Grade 8 Science on Electricity NCERT.'
        }
      }));

      await Assignment.insertMany(mockAssignments);
      console.log('Successfully seeded 6 "Quiz on Electricity" assignments.');
    }
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};
