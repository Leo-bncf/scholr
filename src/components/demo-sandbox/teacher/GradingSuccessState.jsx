import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, ArrowRight, TrendingUp, Sparkles } from 'lucide-react';

/**
 * Inline success state shown after publishing a grade.
 * No modal — it replaces the rubric panel to preserve momentum.
 */
export default function GradingSuccessState({
  result,          // { totalScored, totalMax, ibGrade }
  studentName,
  classRemaining,  // number of submissions still pending in this class assignment
  classTotal,      // total submissions for this assignment
  nextSubmissionId, // id of the next submission to grade, or null
  onGradeAnother,  // optional: reset in place
}) {
  const graded = classTotal - classRemaining;
  const percent = classTotal > 0 ? Math.round((graded / classTotal) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Published grade pill */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.05, duration: 0.3 }}
        className="rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200 p-5"
      >
        <div className="flex items-center gap-2 text-emerald-700">
          <CheckCircle2 className="w-4 h-4" />
          <p className="text-xs font-bold uppercase tracking-wide">Grade published</p>
        </div>
        <div className="mt-3 flex items-end justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Total</p>
            <p className="text-3xl font-bold text-slate-900">
              {result.totalScored}<span className="text-base text-slate-400">/{result.totalMax}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">IB grade</p>
            <p className="text-3xl font-bold text-emerald-600">{result.ibGrade}</p>
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-600">
          Feedback returned to <span className="font-semibold text-slate-900">{studentName}</span>.
        </p>
      </motion.div>

      {/* Momentum message */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        className="mt-5 flex items-start gap-2"
      >
        <Sparkles className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
        <p className="text-sm font-semibold text-slate-900 leading-snug">
          You just streamlined another IB submission review.
        </p>
      </motion.div>

      {/* Updated class metric */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.3 }}
        className="mt-4 rounded-xl bg-white border border-slate-200 p-4"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
            <TrendingUp className="w-3 h-3" /> Class progress
          </div>
          <span className="text-xs font-bold text-slate-900">
            {graded} of {classTotal} graded
          </span>
        </div>
        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
          <motion.div
            className="h-full bg-emerald-500"
            initial={{ width: `${classTotal > 0 ? ((graded - 1) / classTotal) * 100 : 0}%` }}
            animate={{ width: `${percent}%` }}
            transition={{ delay: 0.35, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
        <p className="mt-2 text-xs text-slate-500">
          {classRemaining === 0
            ? 'Every student in this assignment has been graded.'
            : `${classRemaining} submission${classRemaining === 1 ? '' : 's'} left in this queue.`}
        </p>
      </motion.div>

      {/* Next action */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.3 }}
        className="mt-5 space-y-2"
      >
        {nextSubmissionId ? (
          <Link
            to={`/demo/teacher/review/${nextSubmissionId}`}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 text-white px-4 py-3 text-sm font-semibold hover:bg-slate-800 transition"
          >
            Grade next submission <ArrowRight className="w-4 h-4" />
          </Link>
        ) : (
          <Link
            to="/demo/teacher"
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 text-white px-4 py-3 text-sm font-semibold hover:bg-slate-800 transition"
          >
            Back to dashboard <ArrowRight className="w-4 h-4" />
          </Link>
        )}
        {onGradeAnother && (
          <button
            onClick={onGradeAnother}
            className="w-full text-xs font-medium text-slate-500 hover:text-slate-900 py-1"
          >
            Re-open this submission
          </button>
        )}
      </motion.div>
    </motion.div>
  );
}