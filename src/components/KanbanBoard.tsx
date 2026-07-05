import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ClipboardList, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  HelpCircle,
  FileText,
  Bookmark,
  ArrowRight,
  Sparkles,
  RefreshCw,
  MoreVertical,
  Check,
  Zap,
  Eye
} from 'lucide-react';
import { User, Quiz, QuizAttempt, Assignment, Submission } from '../types';

interface KanbanBoardProps {
  currentUser: User;
  quizzes: Quiz[];
  attempts: QuizAttempt[];
  assignments: Assignment[];
  submissions: Submission[];
  setActiveTab: (tab: string) => void;
  onReviewAttempt?: (attempt: QuizAttempt) => void;
}

interface KanbanTask {
  id: string; // prefixed unique id: e.g. "asg-123", "quiz-456"
  originalId: string;
  type: 'assignment' | 'quiz';
  title: string;
  subject: string;
  dueDate: string;
  points: number;
  description?: string;
  isSubmitted: boolean;
  score?: string;
  feedback?: string;
  plagiarismScore?: number;
  status: 'todo' | 'inprogress' | 'done';
}

type ColumnType = 'todo' | 'inprogress' | 'done';

export default function KanbanBoard({ 
  currentUser, 
  quizzes, 
  attempts, 
  assignments, 
  submissions,
  setActiveTab,
  onReviewAttempt
}: KanbanBoardProps) {
  const [tasks, setTasks] = useState<KanbanTask[]>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<ColumnType | null>(null);

  // Load and map tasks on component mount or prop update
  useEffect(() => {
    // 1. Load custom item positions from localStorage (to-do vs in-progress state)
    let savedPositions: Record<string, 'todo' | 'inprogress'> = {};
    try {
      const saved = localStorage.getItem(`eduassess-kanban-${currentUser.id}`);
      if (saved) {
        savedPositions = JSON.parse(saved);
      }
    } catch (e) {
      console.error("Failed to parse Kanban states:", e);
    }

    // 2. Map Quizzes
    const quizTasks: KanbanTask[] = quizzes
      .filter(q => q.isPublished)
      .map(quiz => {
        const attempt = attempts.find(a => a.quizId === quiz.id && a.studentId === currentUser.id);
        const isSubmitted = !!attempt;
        const score = attempt ? `${attempt.score} / ${attempt.totalPoints} pts` : undefined;

        // Determine correct initial column
        let status: 'todo' | 'inprogress' | 'done' = 'todo';
        if (isSubmitted) {
          status = 'done';
        } else if (savedPositions[`quiz-${quiz.id}`]) {
          status = savedPositions[`quiz-${quiz.id}`];
        }

        return {
          id: `quiz-${quiz.id}`,
          originalId: quiz.id,
          type: 'quiz',
          title: quiz.title,
          subject: quiz.subject,
          dueDate: quiz.scheduledAt || new Date().toISOString(), // Fallback
          points: quiz.questions.reduce((sum, q) => sum + (q.points || 0), 0) || 10,
          description: `Online Secure Assessment • ${quiz.questions.length} Questions • ${quiz.duration} Mins.`,
          isSubmitted,
          score,
          status
        };
      });

    // 3. Map Assignments
    const assignmentTasks: KanbanTask[] = assignments.map(asg => {
      const submission = submissions.find(s => s.assignmentId === asg.id && s.studentId === currentUser.id);
      const isSubmitted = !!submission;
      
      let score = undefined;
      if (submission) {
        score = submission.grade !== undefined 
          ? `${submission.grade} / ${asg.points} pts` 
          : "Pending Grading";
      }

      // Determine correct initial column
      let status: 'todo' | 'inprogress' | 'done' = 'todo';
      if (isSubmitted) {
        status = 'done';
      } else if (savedPositions[`asg-${asg.id}`]) {
        status = savedPositions[`asg-${asg.id}`];
      }

      return {
        id: `asg-${asg.id}`,
        originalId: asg.id,
        type: 'assignment',
        title: asg.title,
        subject: asg.subject,
        dueDate: asg.deadline,
        points: asg.points,
        description: asg.description,
        isSubmitted,
        score,
        feedback: submission?.feedback,
        plagiarismScore: submission?.plagiarismScore,
        status
      };
    });

    setTasks([...quizTasks, ...assignmentTasks]);
  }, [quizzes, attempts, assignments, submissions, currentUser.id]);

  // Handle Drag events
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    // Find task
    const task = tasks.find(t => t.id === taskId);
    // Dragging submitted/done tasks isn't needed, but let's allow moving to-do <-> in-progress freely
    if (task?.isSubmitted) {
      e.preventDefault();
      return;
    }
    setDraggingId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent, colType: ColumnType) => {
    e.preventDefault();
    if (dragOverColumn !== colType) {
      setDragOverColumn(colType);
    }
  };

  const handleDrop = (e: React.DragEvent, targetColumn: ColumnType) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggingId;
    if (!taskId) return;

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Prevent dragging a submitted/final task out of "done"
    if (task.isSubmitted && targetColumn !== 'done') {
      return;
    }

    // Move task state
    const updatedTasks = tasks.map(t => {
      if (t.id === taskId) {
        return { ...t, status: targetColumn };
      }
      return t;
    });
    setTasks(updatedTasks);

    // Save updated to-do / inprogress position to local storage
    if (targetColumn !== 'done') {
      try {
        const saved = localStorage.getItem(`eduassess-kanban-${currentUser.id}`);
        const savedPositions = saved ? JSON.parse(saved) : {};
        savedPositions[taskId] = targetColumn;
        localStorage.setItem(`eduassess-kanban-${currentUser.id}`, JSON.stringify(savedPositions));
      } catch (err) {
        console.error("Failed to save Kanban state:", err);
      }
    }

    setDraggingId(null);
    setDragOverColumn(null);
  };

  // Helper to format deadline nicely
  const getDaysRemaining = (dueDateStr: string) => {
    const due = new Date(dueDateStr);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: `Overdue by ${Math.abs(diffDays)}d`, isOverdue: true, isUrgent: true };
    }
    if (diffDays === 0) {
      return { text: "Due today!", isOverdue: false, isUrgent: true };
    }
    if (diffDays === 1) {
      return { text: "Due tomorrow", isOverdue: false, isUrgent: true };
    }
    return { text: `In ${diffDays} days`, isOverdue: false, isUrgent: diffDays <= 3 };
  };

  // Split tasks by status column
  const todoTasks = tasks.filter(t => t.status === 'todo');
  const inProgressTasks = tasks.filter(t => t.status === 'inprogress');
  const doneTasks = tasks.filter(t => t.status === 'done');

  // Interactive navigation callback
  const handleTaskAction = (task: KanbanTask) => {
    if (task.type === 'quiz') {
      setActiveTab('assessments');
    } else {
      setActiveTab('assignments');
    }
    
    // Quick focus scroll support
    setTimeout(() => {
      const element = document.getElementById(task.type === 'quiz' ? 'assessments-header' : 'assignments-header') || document.querySelector(`[id*="${task.originalId}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 200);
  };

  const handleReviewResults = (quizId: string) => {
    const attempt = attempts.find(a => a.quizId === quizId && a.studentId === currentUser.id);
    if (attempt && onReviewAttempt) {
      onReviewAttempt(attempt);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-6" id="kanban-task-view-container">
      {/* Upper header segment */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600">
              <ClipboardList className="h-5 w-5" />
            </span>
            <h4 className="font-bold text-slate-900 tracking-tight text-base font-display">
              Kanban Planner Board
            </h4>
            <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Student Workspace
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Organize upcoming tests and assignments. Drag and drop cards to organize your personalized study workflow.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[10px] font-semibold text-slate-500">
          <div className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded bg-amber-500/20 border border-amber-500/55" />
            <span>⚡ Quiz</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded bg-indigo-500/20 border border-indigo-500/55" />
            <span>📝 Assignment</span>
          </div>
        </div>
      </div>

      {/* Main Board Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* ================= COLUMN 1: TO-DO ================= */}
        <div 
          onDragOver={(e) => handleDragOver(e, 'todo')}
          onDrop={(e) => handleDrop(e, 'todo')}
          className={`rounded-xl border p-4 transition-all duration-200 min-h-[400px] flex flex-col gap-3 ${
            dragOverColumn === 'todo' 
              ? 'border-dashed border-indigo-400 bg-indigo-50/20 shadow-xs' 
              : 'border-slate-100 bg-slate-50/50'
          }`}
          id="kanban-column-todo"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-slate-400" />
              <h5 className="font-bold text-xs text-slate-700 uppercase tracking-wider">To-Do</h5>
              <span className="bg-slate-200 text-slate-600 text-[10px] font-mono font-bold h-5 w-5 flex items-center justify-center rounded-full">
                {todoTasks.length}
              </span>
            </div>
          </div>

          {/* Cards List */}
          <div className="flex-1 space-y-3 overflow-y-auto max-h-[500px] pr-1">
            <AnimatePresence initial={false}>
              {todoTasks.map((task) => (
                <KanbanCard 
                  key={task.id} 
                  task={task} 
                  getDaysRemaining={getDaysRemaining}
                  handleDragStart={handleDragStart}
                  handleDragEnd={handleDragEnd}
                  handleTaskAction={handleTaskAction}
                  onReviewResults={handleReviewResults}
                  isDragging={draggingId === task.id}
                />
              ))}
            </AnimatePresence>

            {todoTasks.length === 0 && (
              <div className="py-12 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl bg-white/50">
                No items pending. Nice work!
              </div>
            )}
          </div>
        </div>

        {/* ================= COLUMN 2: IN PROGRESS ================= */}
        <div 
          onDragOver={(e) => handleDragOver(e, 'inprogress')}
          onDrop={(e) => handleDrop(e, 'inprogress')}
          className={`rounded-xl border p-4 transition-all duration-200 min-h-[400px] flex flex-col gap-3 ${
            dragOverColumn === 'inprogress' 
              ? 'border-dashed border-amber-400 bg-amber-50/20 shadow-xs' 
              : 'border-slate-100 bg-slate-50/50'
          }`}
          id="kanban-column-inprogress"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              <h5 className="font-bold text-xs text-slate-700 uppercase tracking-wider">In Progress</h5>
              <span className="bg-amber-100 text-amber-700 text-[10px] font-mono font-bold h-5 w-5 flex items-center justify-center rounded-full">
                {inProgressTasks.length}
              </span>
            </div>
          </div>

          {/* Cards List */}
          <div className="flex-1 space-y-3 overflow-y-auto max-h-[500px] pr-1">
            <AnimatePresence initial={false}>
              {inProgressTasks.map((task) => (
                <KanbanCard 
                  key={task.id} 
                  task={task} 
                  getDaysRemaining={getDaysRemaining}
                  handleDragStart={handleDragStart}
                  handleDragEnd={handleDragEnd}
                  handleTaskAction={handleTaskAction}
                  onReviewResults={handleReviewResults}
                  isDragging={draggingId === task.id}
                />
              ))}
            </AnimatePresence>

            {inProgressTasks.length === 0 && (
              <div className="py-12 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl bg-white/50">
                Drag cards here to plan your immediate tasks.
              </div>
            )}
          </div>
        </div>

        {/* ================= COLUMN 3: SUBMITTED / GRADED ================= */}
        <div 
          onDragOver={(e) => handleDragOver(e, 'done')}
          onDrop={(e) => handleDrop(e, 'done')}
          className={`rounded-xl border p-4 transition-all duration-200 min-h-[400px] flex flex-col gap-3 ${
            dragOverColumn === 'done' 
              ? 'border-dashed border-emerald-400 bg-emerald-50/20 shadow-xs' 
              : 'border-slate-100 bg-slate-50/50'
          }`}
          id="kanban-column-done"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <h5 className="font-bold text-xs text-slate-700 uppercase tracking-wider">Submitted / Graded</h5>
              <span className="bg-emerald-100 text-emerald-700 text-[10px] font-mono font-bold h-5 w-5 flex items-center justify-center rounded-full">
                {doneTasks.length}
              </span>
            </div>
          </div>

          {/* Cards List */}
          <div className="flex-1 space-y-3 overflow-y-auto max-h-[500px] pr-1">
            <AnimatePresence initial={false}>
              {doneTasks.map((task) => (
                <KanbanCard 
                  key={task.id} 
                  task={task} 
                  getDaysRemaining={getDaysRemaining}
                  handleDragStart={handleDragStart}
                  handleDragEnd={handleDragEnd}
                  handleTaskAction={handleTaskAction}
                  onReviewResults={handleReviewResults}
                  isDragging={draggingId === task.id}
                />
              ))}
            </AnimatePresence>

            {doneTasks.length === 0 && (
              <div className="py-12 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl bg-white/50">
                Complete and submit tasks to populate this board automatically.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

interface KanbanCardProps {
  key?: string;
  task: KanbanTask;
  getDaysRemaining: (dateStr: string) => { text: string; isOverdue: boolean; isUrgent: boolean };
  handleDragStart: (e: React.DragEvent, id: string) => void;
  handleDragEnd: () => void;
  handleTaskAction: (task: KanbanTask) => void;
  onReviewResults?: (quizId: string) => void;
  isDragging: boolean;
}

function KanbanCard({ 
  task, 
  getDaysRemaining, 
  handleDragStart, 
  handleDragEnd, 
  handleTaskAction,
  onReviewResults,
  isDragging 
}: KanbanCardProps) {
  const { text: daysText, isOverdue, isUrgent } = getDaysRemaining(task.dueDate);
  const isQuiz = task.type === 'quiz';

  return (
    <motion.div
      layoutId={task.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: isDragging ? 0.3 : 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      draggable={!task.isSubmitted}
      onDragStart={(e) => handleDragStart(e, task.id)}
      onDragEnd={handleDragEnd}
      className={`group rounded-xl border bg-white p-4 shadow-2xs space-y-3 transition-all relative ${
        task.isSubmitted 
          ? 'border-slate-150 bg-slate-50/40 select-none' 
          : 'border-slate-200 cursor-grab active:cursor-grabbing hover:border-indigo-300 hover:shadow-xs'
      }`}
      id={`kanban-card-${task.id}`}
    >
      {/* Type badge, Subject and score */}
      <div className="flex items-center justify-between gap-2">
        <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
          isQuiz 
            ? 'bg-amber-50 text-amber-700 border border-amber-100' 
            : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
        }`}>
          {isQuiz ? '⚡ Quiz' : '📝 Homework'}
        </span>
        
        {/* Course Name */}
        <span className="text-[10px] text-slate-400 font-bold truncate max-w-[120px]">
          {task.subject}
        </span>
      </div>

      {/* Title & description text */}
      <div className="space-y-1">
        <h6 className="text-xs font-bold text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition-colors">
          {task.title}
        </h6>
        {task.description && (
          <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">
            {task.description}
          </p>
        )}
      </div>

      {/* Submission details or deadline footer */}
      <div className="flex items-center justify-between gap-2 border-t border-slate-50 pt-3">
        {task.isSubmitted ? (
          /* Graded or Submitted State */
          <div className="flex items-center gap-1.5">
            <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            <span className="text-[10px] font-bold text-emerald-700">
              {task.score || "Submitted"}
            </span>
          </div>
        ) : (
          /* Deadline timer */
          <div className="flex items-center gap-1">
            <Clock className={`h-3 w-3 shrink-0 ${isUrgent ? 'text-rose-500' : 'text-slate-400'}`} />
            <span className={`text-[10px] font-semibold font-mono ${
              isOverdue ? 'text-rose-600 font-bold' : isUrgent ? 'text-amber-600' : 'text-slate-500'
            }`}>
              {daysText}
            </span>
          </div>
        )}

        {/* Action link button */}
        {task.isSubmitted && isQuiz ? (
          <button
            onClick={() => {
              if (onReviewResults) {
                onReviewResults(task.originalId);
              }
            }}
            className="text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 transition-all bg-indigo-50 hover:bg-indigo-100 text-indigo-700 cursor-pointer"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Review Results</span>
          </button>
        ) : (
          <button
            onClick={() => handleTaskAction(task)}
            className={`text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 transition-all ${
              task.isSubmitted
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700'
            }`}
          >
            <span>{task.isSubmitted ? 'View Paper' : isQuiz ? 'Start Quiz' : 'Open Link'}</span>
            <ArrowRight className="h-2.5 w-2.5" />
          </button>
        )}
      </div>

      {/* Plagiarism indicator stamp if available in task context */}
      {task.plagiarismScore !== undefined && (
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded text-[8px] font-mono text-rose-600 font-bold">
          <span>{task.plagiarismScore}% Plag</span>
        </div>
      )}
    </motion.div>
  );
}
