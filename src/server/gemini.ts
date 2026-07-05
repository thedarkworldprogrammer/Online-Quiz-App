import { GoogleGenAI, Type } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      aiInstance = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    } else {
      console.warn('GEMINI_API_KEY is not configured. AI features will run in fallback/demo mode.');
    }
  }
  return aiInstance;
}

// 1. AI Quiz Generator
export async function generateAIQuiz(topic: string, subject: string, difficulty: 'easy' | 'medium' | 'hard', numQuestions: number) {
  const client = getGeminiClient();
  if (!client) {
    return getFallbackQuiz(topic, subject, difficulty, numQuestions);
  }

  try {
    const prompt = `Generate an academic quiz on the topic "${topic}" for the subject "${subject}" with ${difficulty} difficulty. 
Generate exactly ${numQuestions} questions. Mix MCQ questions and exactly 1 coding/practical problem if it fits the topic, otherwise subjective explanation questions.
Format the output as a valid JSON array matching the specified schema. Ensure all MCQ options are distinct and correctAnswer contains the string representation of the index (e.g., "0", "1", "2", "3").
For coding questions, provide a clear skeleton in "codingTemplate" and appropriate simple "testCases" with inputs and outputs.`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          description: "List of generated questions",
          items: {
            type: Type.OBJECT,
            properties: {
              type: {
                type: Type.STRING,
                description: "Type of question, must be 'mcq', 'subjective', or 'coding'"
              },
              text: {
                type: Type.STRING,
                description: "The question description or challenge statement."
              },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Required for 'mcq'. 4 plausible options."
              },
              correctAnswer: {
                type: Type.STRING,
                description: "For MCQ, the 0-indexed index (" + '"0", "1", "2" or "3"' + "). For coding or subjective, a sample short correct answer."
              },
              points: {
                type: Type.INTEGER,
                description: "Point weight for this question, e.g. 5, 10, or 15."
              },
              difficulty: {
                type: Type.STRING,
                description: "Difficulty tag: 'easy', 'medium', or 'hard'"
              },
              codingTemplate: {
                type: Type.STRING,
                description: "For coding questions, a starter function definition in JavaScript."
              },
              testCases: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    input: { type: Type.STRING },
                    output: { type: Type.STRING }
                  }
                },
                description: "List of test cases for coding evaluation"
              }
            },
            required: ["type", "text", "points", "difficulty"]
          }
        }
      }
    });

    const text = response.text;
    if (text) {
      return JSON.parse(text.trim());
    }
    throw new Error("Empty response from Gemini");
  } catch (error) {
    console.error("Gemini quiz generation error, using fallback:", error);
    return getFallbackQuiz(topic, subject, difficulty, numQuestions);
  }
}

// 2. AI Assignment Evaluation Assistance
export async function evaluateAssignmentSubmission(assignmentTitle: string, assignmentDesc: string, submissionFileName: string, textContent: string) {
  const client = getGeminiClient();
  if (!client) {
    return getFallbackEvaluation(assignmentTitle, textContent);
  }

  try {
    const prompt = `You are an expert grading assistant. Grade the student submission for the assignment: "${assignmentTitle}".
Assignment description: "${assignmentDesc}".
Submission file name: "${submissionFileName}".
Student submission content/text:
"""
${textContent}
"""

Please run a pedagogical assessment. Detect potential plagiarism or copy-pasted patterns, and compute a plagiarism score between 0 and 100 (where 0 is completely original, and 100 is fully copied).
Provide an recommended numerical score (out of 100 points), a summary feedback for the teacher, and a personalized, supportive AI learning tip for the student.
Respond only with a JSON object containing the fields: grade, feedback, plagiarismScore, and aiAssistedFeedback.`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            grade: {
              type: Type.INTEGER,
              description: "A numerical grade from 0 to 100 based on submission quality."
            },
            feedback: {
              type: Type.STRING,
              description: "High-quality academic critique and breakdown of weak points and strong points."
            },
            plagiarismScore: {
              type: Type.INTEGER,
              description: "Estimated percentage of similarity/plagiarism (0-100)."
            },
            aiAssistedFeedback: {
              type: Type.STRING,
              description: "Supportive AI revision tips, core concept explanations, or helpful learning suggestions addressed directly to the student."
            }
          },
          required: ["grade", "feedback", "plagiarismScore", "aiAssistedFeedback"]
        }
      }
    });

    const text = response.text;
    if (text) {
      return JSON.parse(text.trim());
    }
    throw new Error("Empty response from Gemini");
  } catch (error) {
    console.error("Gemini evaluation error, using fallback:", error);
    return getFallbackEvaluation(assignmentTitle, textContent);
  }
}

// 3. AI Study Recommendations
export async function getPersonalizedStudyPlan(studentName: string, recentAttempts: any[], courseSubjects: string[]) {
  const client = getGeminiClient();
  if (!client) {
    return getFallbackStudyPlan(studentName);
  }

  try {
    const prompt = `The student "${studentName}" needs a personalized learning recommendation and smart revision plan.
Here is their recent performance history across academic quizzes:
${JSON.stringify(recentAttempts, null, 2)}
The general course subjects are: ${courseSubjects.join(', ')}.

Identify their weak topics, strong topics, average pass statistics, and generate a customized 3-step study plan containing specific actionable topics to revise, exercises to try, and an overall motivational booster advice.
Format your response strictly as a JSON object with:
weakTopics (string array), strongTopics (string array), studyPlanSteps (array of objects with 'title', 'duration', 'action' fields), and recommendationAdvice (string).`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            weakTopics: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Subtopics where the student got lower scores or needs study."
            },
            strongTopics: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Subtopics where student performed well."
            },
            studyPlanSteps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "Step title, e.g. 'Day 1-2: Master Balance Rotations'" },
                  duration: { type: Type.STRING, description: "Estimated active duration, e.g. '3 hours'" },
                  action: { type: Type.STRING, description: "Step-by-step revision guidance, specific links, or exercise." }
                },
                required: ["title", "duration", "action"]
              }
            },
            recommendationAdvice: {
              type: Type.STRING,
              description: "A friendly, encouraging motivational advice from the AI mentor."
            }
          },
          required: ["weakTopics", "strongTopics", "studyPlanSteps", "recommendationAdvice"]
        }
      }
    });

    const text = response.text;
    if (text) {
      return JSON.parse(text.trim());
    }
    throw new Error("Empty response from Gemini");
  } catch (error) {
    console.error("Gemini recommendation error, using fallback:", error);
    return getFallbackStudyPlan(studentName);
  }
}

// Fallback Generators for Safe execution when API Key is missing or quota is hit
function getFallbackQuiz(topic: string, subject: string, difficulty: string, numQuestions: number) {
  return [
    {
      type: 'mcq',
      text: `Practice Question 1 on ${topic}: Which of the following is most fundamental to this area of ${subject}?`,
      options: ['Option Alpha', 'Option Beta', 'Option Gamma', 'Option Delta'],
      correctAnswer: '1',
      points: 10,
      difficulty: difficulty
    },
    {
      type: 'mcq',
      text: `Practice Question 2 on ${topic}: What is the standard time complexity or structural overhead commonly associated with this?`,
      options: ['Linear Time O(n)', 'Logarithmic Time O(log n)', 'Exponential O(2^n)', 'Constant Time O(1)'],
      correctAnswer: '3',
      points: 10,
      difficulty: difficulty
    },
    {
      type: 'subjective',
      text: `Explain in your own words how ${topic} is utilized within the scope of ${subject}. Define its primary use-case.`,
      correctAnswer: 'A correct answer specifies the structural mechanics and dynamic scaling characteristics.',
      points: 15,
      difficulty: difficulty
    }
  ].slice(0, numQuestions);
}

function getFallbackEvaluation(assignmentTitle: string, submissionText: string) {
  const contentLen = submissionText.trim().length;
  const wordCount = submissionText.split(/\s+/).length;
  const score = Math.min(100, Math.max(40, Math.floor(65 + (contentLen / 50))));

  return {
    grade: score,
    feedback: `This submission for "${assignmentTitle}" displays a reasonable command of the concepts. It contains approximately ${wordCount} words. To reach a higher grade, expand on edge cases and provide full mathematical or structural assertions.`,
    plagiarismScore: Math.floor(Math.random() * 12),
    aiAssistedFeedback: "Smart Tip: Make sure to format your proofs in clear structural layouts. Review normal forms or core node structures to ensure that logical relationships are perfectly stated. Keep up the great work!"
  };
}

function getFallbackStudyPlan(studentName: string) {
  return {
    weakTopics: ['AVL Balance Rotations', 'SQL Complex Subqueries', 'Binary Search Tree Edge Cases'],
    strongTopics: ['Queue FIFO Operations', 'Stack LIFO logic', 'Simple SQL Filtering'],
    studyPlanSteps: [
      {
        title: 'Step 1: Visualizing Rotation Pivots',
        duration: '2 Hours',
        action: 'Review balance factors. Create a small manual AVL Tree on paper with elements [10, 20, 30]. Perform Left Rotation around 10 to understand node-reparenting.'
      },
      {
        title: 'Step 2: Subquery Decomposition',
        duration: '1.5 Hours',
        action: 'Practice writing subqueries inside WHERE clauses. Compare performance against standard SQL INNER JOINS using EXPLAIN ANALYZE.'
      },
      {
        title: 'Step 3: Self-Evaluation Challenge',
        duration: '1 Hour',
        action: 'Attempt the Data Structures Practice Test again. Focus on randomized question ordering and eliminate tab-switching to test true recall.'
      }
    ],
    recommendationAdvice: `Hi ${studentName}, you have shown robust fundamentals in linear collections like stacks and queues! By spending just a little focused energy on tree reparenting and relational joins, you will unlock full confidence across complex data architectures. We believe in you!`
  };
}
