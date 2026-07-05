import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Search, 
  Clock, 
  Zap, 
  ChevronDown, 
  TrendingUp, 
  Award, 
  Star, 
  User as UserIcon, 
  BookOpen 
} from 'lucide-react';
import { User, Quiz, QuizAttempt } from '../types';

interface QuizLeaderboardProps {
  currentUser: User;
  quizzes: Quiz[];
  attempts: QuizAttempt[];
  usersList: User[];
}

export default function QuizLeaderboard({ currentUser, quizzes, attempts, usersList }: QuizLeaderboardProps) {
  // Find only published quizzes with at least one attempt to pre-select
  const activeQuizzes = quizzes.filter(q => q.isPublished);
  const [selectedQuizId, setSelectedQuizId] = useState<string>(() => {
    if (activeQuizzes.length > 0) {
      // Prefer quiz with attempts if possible, else the first quiz
      const withAttempts = activeQuizzes.find(q => attempts.some(a => a.quizId === q.id));
      return withAttempts?.id || activeQuizzes[0].id;
    }
    return '';
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Get selected quiz details
  const selectedQuiz = quizzes.find(q => q.id === selectedQuizId);

  // Helper to format duration beautifully
  const formatDuration = (started: string, completed: string) => {
    const ms = new Date(completed).getTime() - new Date(started).getTime();
    const totalSecs = Math.max(0, Math.floor(ms / 1000));
    if (totalSecs < 60) return `${totalSecs}s`;
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}m ${secs}s`;
  };

  // Helper to get raw duration in seconds for sorting
  const getRawDurationSecs = (started: string, completed: string) => {
    const ms = new Date(completed).getTime() - new Date(started).getTime();
    return Math.max(0, Math.floor(ms / 1000));
  };

  // Compute best attempt per student for the selected quiz
  const quizAttempts = attempts.filter(a => a.quizId === selectedQuizId);
  const bestAttemptsByStudent: Record<string, QuizAttempt> = {};

  quizAttempts.forEach(att => {
    const existing = bestAttemptsByStudent[att.studentId];
    if (!existing) {
      bestAttemptsByStudent[att.studentId] = att;
    } else {
      const currentPct = att.score / att.totalPoints;
      const existingPct = existing.score / existing.totalPoints;
      
      if (currentPct > existingPct) {
        bestAttemptsByStudent[att.studentId] = att;
      } else if (currentPct === existingPct) {
        // Tie breaker: faster completion speed
        const currentDur = getRawDurationSecs(att.startedAt, att.completedAt);
        const existingDur = getRawDurationSecs(existing.startedAt, existing.completedAt);
        if (currentDur < existingDur) {
          bestAttemptsByStudent[att.studentId] = att;
        }
      }
    }
  });

  // Map to rich student leaderboard structures & Sort
  // 1. Higher score percentage first
  // 2. Faster speed (lower raw duration seconds) as tie breaker
  // 3. Alphabetical / id as fallback
  const leaderboardEntries = Object.values(bestAttemptsByStudent)
    .map(att => {
      const student = usersList.find(u => u.id === att.studentId);
      const durationSecs = getRawDurationSecs(att.startedAt, att.completedAt);
      return {
        attempt: att,
        student,
        scorePercentage: (att.score / att.totalPoints) * 100,
        durationSecs,
        durationString: formatDuration(att.startedAt, att.completedAt)
      };
    })
    .sort((a, b) => {
      if (b.scorePercentage !== a.scorePercentage) {
        return b.scorePercentage - a.scorePercentage;
      }
      if (a.durationSecs !== b.durationSecs) {
        return a.durationSecs - b.durationSecs; // Lower duration is better/faster
      }
      return (a.student?.name || '').localeCompare(b.student?.name || '');
    })
    .map((entry, index) => ({
      ...entry,
      rank: index + 1
    }));

  // Filter leaderboard by search query (name or batch/roll number)
  const filteredEntries = leaderboardEntries.filter(entry => {
    const name = entry.student?.name || '';
    const email = entry.student?.email || '';
    const batch = entry.student?.academicDetails?.batch || '';
    const query = searchQuery.toLowerCase();
    return name.toLowerCase().includes(query) || 
           email.toLowerCase().includes(query) ||
           batch.toLowerCase().includes(query);
  });

  // Split top performers (1, 2, 3) and the rest
  const top3 = filteredEntries.filter(e => e.rank <= 3);
  const remaining = filteredEntries.filter(e => e.rank > 3);

  // Position the top 3 visually for podium (Order: 2nd, 1st, 3rd)
  const podiumEntries = (() => {
    const first = top3.find(e => e.rank === 1);
    const second = top3.find(e => e.rank === 2);
    const third = top3.find(e => e.rank === 3);
    
    const arr = [];
    if (second) arr.push(second);
    if (first) arr.push(first);
    if (third) arr.push(third);
    return arr;
  })();

  const currentUserEntry = leaderboardEntries.find(e => e.student?.id === currentUser.id);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-6" id="quiz-leaderboard-container">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-amber-50 rounded-lg text-amber-500">
              <Trophy className="h-5 w-5" />
            </span>
            <h4 className="font-bold text-slate-900 tracking-tight text-base font-display">
              Quiz Leaderboards
            </h4>
          </div>
          <p className="text-xs text-slate-500">
            Compete, track, and rank based on precision scoring and record-breaking completion times.
          </p>
        </div>

        {/* Dropdown Selector */}
        {activeQuizzes.length > 0 && (
          <div className="relative shrink-0">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors w-full sm:w-auto justify-between"
              id="leaderboard-quiz-selector-btn"
            >
              <span className="truncate max-w-[180px]">
                {selectedQuiz ? selectedQuiz.title : 'Select Quiz'}
              </span>
              <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                <div className="absolute right-0 mt-1.5 w-60 rounded-xl border border-slate-100 bg-white shadow-lg py-1 z-20 max-h-60 overflow-y-auto">
                  {activeQuizzes.map((quiz) => {
                    const count = attempts.filter(a => a.quizId === quiz.id).length;
                    return (
                      <button
                        key={quiz.id}
                        onClick={() => {
                          setSelectedQuizId(quiz.id);
                          setDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-xs hover:bg-slate-50 transition-colors flex flex-col gap-0.5 ${
                          selectedQuizId === quiz.id ? 'bg-indigo-50/50 text-indigo-700 font-semibold' : 'text-slate-600'
                        }`}
                      >
                        <span className="truncate">{quiz.title}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {quiz.subject} • {count} attempt{count !== 1 ? 's' : ''}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {leaderboardEntries.length === 0 ? (
        /* Empty State */
        <div className="py-12 text-center max-w-sm mx-auto space-y-3" id="leaderboard-empty-state">
          <div className="h-12 w-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto">
            <BookOpen className="h-6 w-6" />
          </div>
          <h5 className="text-sm font-bold text-slate-800">No attempts logged yet</h5>
          <p className="text-xs text-slate-500 leading-relaxed">
            There are no documented submissions or results for "{selectedQuiz?.title || 'this quiz'}" yet. Complete the quiz first to claim your rank!
          </p>
        </div>
      ) : (
        <>
          {/* Quick Stats Banner & Search Bar */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full md:max-w-xs">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </span>
              <input
                type="text"
                placeholder="Search students or batch..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/50"
              />
            </div>

            {/* Current user's rank status if completed */}
            {currentUserEntry ? (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-100/50 rounded-xl text-xs text-indigo-700 font-medium">
                <Award className="h-4 w-4 text-indigo-600" />
                <span>Your Standing: <strong>Rank #{currentUserEntry.rank}</strong> with <strong>{currentUserEntry.attempt.score}/{currentUserEntry.attempt.totalPoints} pts</strong> ({currentUserEntry.durationString})</span>
              </div>
            ) : (
              currentUser.role === 'student' && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-500">
                  <Star className="h-4 w-4 text-slate-400" />
                  <span>You haven't attempted this quiz yet. Take the test to enter the leaderboard!</span>
                </div>
              )
            )}
          </div>

          {/* Podium (Top 3) Display */}
          {top3.length > 0 && !searchQuery && (
            <div className="pt-4 pb-2" id="leaderboard-podium-section">
              <div className="grid grid-cols-3 max-w-xl mx-auto items-end gap-2 md:gap-4 px-2">
                {podiumEntries.map((entry) => {
                  const isFirst = entry.rank === 1;
                  const isSecond = entry.rank === 2;
                  const isThird = entry.rank === 3;

                  // Styling attributes based on ranks
                  let heightClass = "h-32 sm:h-36";
                  let podiumBg = "bg-slate-50 border-slate-200";
                  let crownColor = "text-amber-500";
                  let medalEmoji = "🥇";
                  let ringColor = "ring-amber-500";

                  if (isFirst) {
                    heightClass = "h-40 sm:h-44";
                    podiumBg = "bg-amber-50/30 border-amber-200/60";
                    ringColor = "ring-amber-400 ring-offset-2";
                  } else if (isSecond) {
                    heightClass = "h-32 sm:h-36";
                    podiumBg = "bg-slate-50/50 border-slate-100";
                    crownColor = "text-slate-400";
                    medalEmoji = "🥈";
                    ringColor = "ring-slate-300";
                  } else {
                    heightClass = "h-28 sm:h-32";
                    podiumBg = "bg-orange-50/10 border-orange-200/20";
                    crownColor = "text-amber-700";
                    medalEmoji = "🥉";
                    ringColor = "ring-amber-600";
                  }

                  return (
                    <div key={entry.attempt.id} className="flex flex-col items-center text-center">
                      {/* Avatar with floating crown or rank tag */}
                      <div className="relative mb-2">
                        {isFirst && (
                          <span className="absolute -top-4 left-1/2 -translate-x-1/2 z-10 animate-bounce">
                            👑
                          </span>
                        )}
                        {entry.student?.avatar ? (
                          <img
                            src={entry.student.avatar}
                            alt={entry.student.name}
                            referrerPolicy="no-referrer"
                            className={`h-11 w-11 sm:h-14 sm:w-14 rounded-full object-cover ring-2 ${ringColor} shadow-sm`}
                          />
                        ) : (
                          <div className={`h-11 w-11 sm:h-14 sm:w-14 rounded-full flex items-center justify-center ring-2 ${ringColor} bg-slate-100 text-slate-600 font-bold text-sm`}>
                            {entry.student?.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <span className="absolute -bottom-1 -right-1 h-5 w-5 bg-white rounded-full flex items-center justify-center text-xs shadow-xs border border-slate-100">
                          {medalEmoji}
                        </span>
                      </div>

                      {/* Name and Quick stats */}
                      <div className="max-w-full">
                        <p className="text-xs font-bold text-slate-800 truncate" title={entry.student?.name}>
                          {entry.student?.name}
                        </p>
                        <p className="text-[10px] text-indigo-600 font-bold font-mono mt-0.5">
                          {entry.attempt.score} pts
                        </p>
                      </div>

                      {/* Visual Podium Base */}
                      <div className={`w-full mt-3 rounded-t-xl border-t border-x ${podiumBg} ${heightClass} flex flex-col justify-end p-3 space-y-1 relative shadow-xs`}>
                        <span className="text-2xl font-black text-slate-400/30 font-display">
                          #{entry.rank}
                        </span>
                        
                        {/* Speed details */}
                        <div className="flex items-center justify-center gap-1 text-[9px] text-slate-500 font-mono bg-white/80 rounded-full py-0.5 px-1.5 border border-slate-100">
                          <Clock className="h-2.5 w-2.5 text-indigo-500 shrink-0" />
                          <span className="truncate">{entry.durationString}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* List representation */}
          <div className="border border-slate-100 rounded-xl overflow-hidden" id="leaderboard-list-table">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  <th className="py-3 px-4 w-12 text-center">Rank</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4 text-center">Score</th>
                  <th className="py-3 px-4 text-center">Completion Speed</th>
                  <th className="py-3 px-4 text-right hidden sm:table-cell">Academic Cohort</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-slate-50">
                {filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No matching student scores found on the board.
                    </td>
                  </tr>
                ) : (
                  filteredEntries.map((entry) => {
                    const isCurrentUser = entry.student?.id === currentUser.id;
                    const isTop3 = entry.rank <= 3;

                    return (
                      <tr 
                        key={entry.attempt.id}
                        className={`transition-colors hover:bg-slate-50/50 ${
                          isCurrentUser ? 'bg-indigo-50/40 hover:bg-indigo-50/60 font-medium border-l-2 border-l-indigo-500' : ''
                        }`}
                      >
                        {/* Rank */}
                        <td className="py-3 px-4 text-center">
                          {isTop3 ? (
                            <span className="text-sm font-bold">
                              {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}
                            </span>
                          ) : (
                            <span className="font-mono text-slate-500 font-bold">
                              #{entry.rank}
                            </span>
                          )}
                        </td>

                        {/* Student details */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            {entry.student?.avatar ? (
                              <img
                                src={entry.student.avatar}
                                alt={entry.student.name}
                                referrerPolicy="no-referrer"
                                className="h-8 w-8 rounded-full object-cover border border-slate-100 shrink-0"
                              />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px] flex items-center justify-center shrink-0">
                                {entry.student?.name.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-slate-800">{entry.student?.name}</span>
                                {isCurrentUser && (
                                  <span className="bg-indigo-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                                    You
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400 block">
                                {entry.student?.academicDetails?.rollNo || entry.student?.email}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Score */}
                        <td className="py-3 px-4 text-center">
                          <span className="font-bold text-slate-800 font-mono">
                            {entry.attempt.score}
                          </span>
                          <span className="text-slate-400 text-[10px] font-mono">
                            /{entry.attempt.totalPoints}
                          </span>
                        </td>

                        {/* Speed / Time taken */}
                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-full font-mono text-[10px] text-slate-600">
                            <Clock className="h-3 w-3 text-slate-400" />
                            <span>{entry.durationString}</span>
                          </div>
                        </td>

                        {/* Academic details */}
                        <td className="py-3 px-4 text-right hidden sm:table-cell">
                          <span className="text-slate-500">
                            Batch {entry.student?.academicDetails?.batch || 'A'} • {entry.student?.academicDetails?.semester || '4th Sem'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
