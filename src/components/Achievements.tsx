import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Award, Trophy, Zap, CheckCircle2, Lock, Flame, Sparkles, BookOpen, Clock, RefreshCw, X } from 'lucide-react';
import { User, Quiz, QuizAttempt, Assignment, Submission } from '../types';

interface AchievementsProps {
  currentUser: User;
  attempts: QuizAttempt[];
  quizzes: Quiz[];
  assignments: Assignment[];
  submissions: Submission[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  criteria: string;
  category: 'quiz' | 'xp' | 'completion' | 'behavior';
  icon: React.ReactNode;
  color: string;
  unlocked: boolean;
  progress: {
    current: number;
    target: number;
    label: string;
  };
}

export default function Achievements({ currentUser, attempts, quizzes, assignments, submissions }: AchievementsProps) {
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

  // Filter student-specific data
  const studentId = currentUser.id;
  const studentAttempts = attempts.filter(a => a.studentId === studentId);
  const studentSubmissions = submissions.filter(s => s.studentId === studentId);
  const xp = currentUser.academicDetails?.xp || 0;
  const streak = currentUser.academicDetails?.streak || 0;
  const level = currentUser.academicDetails?.level || 1;

  // Calculators
  const avgQuizScore = studentAttempts.length > 0 
    ? studentAttempts.reduce((acc, a) => acc + (a.score / a.totalPoints) * 100, 0) / studentAttempts.length 
    : 0;

  const quizCompletionRate = quizzes.length > 0 
    ? (studentAttempts.length / quizzes.length) * 100 
    : 0;

  const assignmentCompletionRate = assignments.length > 0 
    ? (studentSubmissions.length / assignments.length) * 100 
    : 0;

  // Check badges conditions
  const badges: Badge[] = [
    {
      id: 'quiz-master',
      name: 'Quiz Master',
      description: 'Maintained an exceptional score of 85% or above across multiple completed assessments.',
      criteria: 'Complete at least 2 quizzes with an average score of 85% or higher.',
      category: 'quiz',
      icon: <Trophy className="h-6 w-6" />,
      color: 'from-amber-400 to-amber-600',
      unlocked: studentAttempts.length >= 2 && avgQuizScore >= 85,
      progress: {
        current: Math.min(2, studentAttempts.filter(a => (a.score / a.totalPoints) >= 0.85).length),
        target: 2,
        label: `${studentAttempts.filter(a => (a.score / a.totalPoints) >= 0.85).length}/2 high-score quizzes`,
      },
    },
    {
      id: 'early-bird',
      name: 'Early Bird',
      description: 'Submitted assignments well before deadlines or maintained a solid high consistency streak.',
      criteria: 'Maintain a 3+ day streak or submit at least 1 assignment early.',
      category: 'completion',
      icon: <Flame className="h-6 w-6" />,
      color: 'from-orange-500 to-rose-500',
      unlocked: streak >= 3 || studentSubmissions.length > 0,
      progress: {
        current: Math.max(streak, studentSubmissions.length > 0 ? 3 : 0),
        target: 3,
        label: streak >= 3 ? `${streak} day streak active` : `${studentSubmissions.length}/1 submitted assignments`,
      },
    },
    {
      id: 'top-performer',
      name: 'Top Performer',
      description: 'Accumulated massive amounts of course experience points showing persistent progress.',
      criteria: 'Reach a level of 5 or accumulate over 1000 Course XP.',
      category: 'xp',
      icon: <Zap className="h-6 w-6" />,
      color: 'from-indigo-500 to-violet-600',
      unlocked: xp >= 1000 || level >= 5,
      progress: {
        current: Math.min(1000, xp),
        target: 1000,
        label: `${xp}/1000 Course XP`,
      },
    },
    {
      id: 'honest-scholar',
      name: 'Honest Scholar',
      description: 'Completed automated assessments in a single continuous session with complete academic integrity.',
      criteria: 'Complete a quiz with zero tab switches or fullscreen violations.',
      category: 'behavior',
      icon: <BookOpen className="h-6 w-6" />,
      color: 'from-emerald-400 to-teal-600',
      unlocked: studentAttempts.some(a => a.tabSwitches === 0),
      progress: {
        current: studentAttempts.some(a => a.tabSwitches === 0) ? 1 : 0,
        target: 1,
        label: studentAttempts.some(a => a.tabSwitches === 0) ? 'Clean run completed' : '0/1 perfect focus attempts',
      },
    },
    {
      id: 'perfect-score',
      name: 'Perfect 100',
      description: 'Achieved complete accuracy on a student assessment, securing every single point.',
      criteria: 'Score 100% on any quiz attempt.',
      category: 'quiz',
      icon: <CheckCircle2 className="h-6 w-6" />,
      color: 'from-cyan-400 to-blue-600',
      unlocked: studentAttempts.some(a => a.score === a.totalPoints && a.totalPoints > 0),
      progress: {
        current: studentAttempts.some(a => a.score === a.totalPoints && a.totalPoints > 0) ? 1 : 0,
        target: 1,
        label: studentAttempts.some(a => a.score === a.totalPoints && a.totalPoints > 0) ? '100% score secured' : '0/1 max-grade quiz',
      },
    },
    {
      id: 'completion-champion',
      name: 'Completion Champ',
      description: 'Cleared more than half of the assigned curriculum requirements and quiz papers.',
      criteria: 'Complete at least 50% of all published quizzes.',
      category: 'completion',
      icon: <Clock className="h-6 w-6" />,
      color: 'from-pink-500 to-purple-600',
      unlocked: quizCompletionRate >= 50,
      progress: {
        current: Math.round(quizCompletionRate),
        target: 50,
        label: `${Math.round(quizCompletionRate)}% quizzes completed`,
      },
    },
  ];

  const unlockedCount = badges.filter(b => b.unlocked).length;
  const overallProgressPercent = (unlockedCount / badges.length) * 100;

  // Animation variants
  const listVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 110,
        damping: 14,
      }
    },
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs relative overflow-hidden">
      {/* Sparkle subtle decoration */}
      <div className="absolute top-2 right-2 opacity-10">
        <Sparkles className="h-24 w-24 text-indigo-500 animate-pulse" />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-5">
        <div>
          <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-1.5">
            <Award className="h-4.5 w-4.5 text-indigo-600" />
            My Achievements & Badges
          </h4>
          <p className="text-[11px] text-slate-500 mt-1">Unlock gamified credentials through quizzes, assignments, and XP milestones.</p>
        </div>
        <div className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full self-start">
          <Trophy className="h-4 w-4" />
          <span className="text-xs font-bold font-mono">{unlockedCount} / {badges.length} Badges</span>
        </div>
      </div>

      {/* Progress Stats Tracker */}
      <div className="mb-6 p-4 rounded-xl bg-slate-50 border border-slate-100">
        <div className="flex justify-between items-center text-xs text-slate-600 font-semibold mb-2">
          <span>Overall Badge Completion</span>
          <span className="font-mono text-indigo-600">{Math.round(overallProgressPercent)}% Completed</span>
        </div>
        <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${overallProgressPercent}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-indigo-500 to-violet-600 rounded-full"
          />
        </div>
        <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-slate-200/60 text-center">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Current XP</span>
            <span className="text-sm font-bold text-slate-800 font-mono">{xp} XP</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Avg Quiz Rating</span>
            <span className="text-sm font-bold text-slate-800 font-mono">{Math.round(avgQuizScore)}%</span>
          </div>
        </div>
      </div>

      {/* Badges Grid list */}
      <motion.div 
        variants={listVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
      >
        {badges.map((badge) => (
          <motion.div
            key={badge.id}
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            onClick={() => setSelectedBadge(badge)}
            className={`cursor-pointer group relative p-4 rounded-xl border transition-all duration-300 ${
              badge.unlocked 
                ? 'bg-white hover:bg-slate-50 border-slate-200 shadow-xs hover:shadow-md' 
                : 'bg-slate-50/70 border-slate-100 opacity-75 hover:opacity-100'
            }`}
          >
            <div className="flex items-start gap-3.5">
              {/* Badge Icon container */}
              <div className={`relative flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-xs shrink-0 bg-gradient-to-br ${
                badge.unlocked ? badge.color : 'from-slate-300 to-slate-400 grayscale'
              }`}>
                {badge.icon}
                {!badge.unlocked && (
                  <div className="absolute -bottom-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-slate-600 border border-white">
                    <Lock className="h-2.5 w-2.5 text-white" />
                  </div>
                )}
                {badge.unlocked && (
                  <div className="absolute -bottom-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-emerald-500 border border-white">
                    <CheckCircle2 className="h-2.5 w-2.5 text-white" />
                  </div>
                )}
              </div>

              {/* Name and progress preview */}
              <div className="flex-1 min-w-0">
                <h5 className={`text-xs font-bold leading-none ${badge.unlocked ? 'text-slate-800' : 'text-slate-500'}`}>
                  {badge.name}
                </h5>
                <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {badge.description}
                </p>
                <div className="mt-2">
                  <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono">
                    <span>{badge.progress.label}</span>
                    <span>{badge.unlocked ? '100%' : `${Math.round((badge.progress.current / badge.progress.target) * 100)}%`}</span>
                  </div>
                  <div className="h-1 w-full bg-slate-200 rounded-full mt-1 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${badge.unlocked ? 'bg-indigo-600' : 'bg-slate-300'}`}
                      style={{ width: `${badge.unlocked ? 100 : (badge.progress.current / badge.progress.target) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Badge Detail Modal Dialog */}
      <AnimatePresence>
        {selectedBadge && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl relative overflow-hidden"
            >
              <button 
                onClick={() => setSelectedBadge(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors rounded-full p-1 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex flex-col items-center text-center mt-2">
                {/* Glowing Badge Circle */}
                <div className={`relative flex h-20 w-20 items-center justify-center rounded-2xl text-white shadow-lg bg-gradient-to-br ${
                  selectedBadge.unlocked 
                    ? `${selectedBadge.color} ring-4 ring-indigo-100 animate-pulse` 
                    : 'from-slate-300 to-slate-400 grayscale'
                }`}>
                  {React.cloneElement(selectedBadge.icon as React.ReactElement, { className: 'h-10 w-10' })}
                  {selectedBadge.unlocked ? (
                    <span className="absolute -bottom-1.5 -right-1.5 rounded-full bg-emerald-500 p-1 text-white ring-2 ring-white">
                      <CheckCircle2 className="h-4 w-4" />
                    </span>
                  ) : (
                    <span className="absolute -bottom-1.5 -right-1.5 rounded-full bg-slate-600 p-1 text-white ring-2 ring-white">
                      <Lock className="h-4 w-4" />
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-900 mt-4">{selectedBadge.name}</h3>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full mt-1.5 border uppercase tracking-wider ${
                  selectedBadge.unlocked 
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                    : 'bg-slate-100 text-slate-500 border-slate-200'
                }`}>
                  {selectedBadge.unlocked ? 'Unlocked Badge' : 'Locked Badge'}
                </span>

                <p className="text-xs text-slate-600 mt-4 leading-relaxed px-2">
                  {selectedBadge.description}
                </p>

                {/* Criteria statement card */}
                <div className="mt-5 w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-left">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Unlock Criteria</span>
                  <p className="text-xs text-slate-700 font-medium mt-1 leading-snug">
                    {selectedBadge.criteria}
                  </p>
                </div>

                {/* Progress Details bar */}
                <div className="mt-4 w-full text-left">
                  <div className="flex justify-between items-center text-xs text-slate-500 font-mono">
                    <span>Current progress status:</span>
                    <strong className="text-slate-700">{selectedBadge.progress.label}</strong>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${selectedBadge.unlocked ? 'bg-gradient-to-r from-indigo-500 to-violet-600' : 'bg-slate-300'}`}
                      style={{ width: `${selectedBadge.unlocked ? 100 : (selectedBadge.progress.current / selectedBadge.progress.target) * 100}%` }}
                    />
                  </div>
                </div>

                <button
                  onClick={() => setSelectedBadge(null)}
                  className="mt-6 w-full rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 text-xs transition-colors"
                >
                  Close Details
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
