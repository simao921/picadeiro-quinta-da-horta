import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Trophy, Clock, ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Página pública de exibição do ranking durante competições.
 * Parâmetros URL:
 *   ?competition_id=xxx   — mostra ranking de uma competição específica
 *   ?year=2026            — mostra ranking geral do ano
 *   ?grade=xxx            — filtra por escalão
 *   ?interval=8           — segundos por escalão (default 8)
 */
export default function RankingDisplay() {
  const urlParams = new URLSearchParams(window.location.search);
  const competitionId = urlParams.get('competition_id');
  const yearParam = urlParams.get('year') || new Date().getFullYear().toString();
  const gradeParam = urlParams.get('grade') || '';
  const intervalParam = parseInt(urlParams.get('interval') || '8', 10);

  const [currentGradeIndex, setCurrentGradeIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(intervalParam);
  const [manualGrade, setManualGrade] = useState(gradeParam || null);

  const { data: competitions = [] } = useQuery({
    queryKey: ['competitions'],
    queryFn: () => base44.entities.Competition.list('-date')
  });

  const { data: results = [] } = useQuery({
    queryKey: ['competition-results-display', competitionId],
    queryFn: () => competitionId
      ? base44.entities.CompetitionResult.filter({ competition_id: competitionId })
      : base44.entities.CompetitionResult.list(),
  });

  const { data: entries = [] } = useQuery({
    queryKey: ['competition-entries-display', competitionId],
    queryFn: () => competitionId
      ? base44.entities.CompetitionEntry.filter({ competition_id: competitionId, status: 'aprovada' })
      : base44.entities.CompetitionEntry.list(),
  });

  const competition = useMemo(() => {
    if (!competitionId) return null;
    return competitions.find(c => c.id === competitionId) || null;
  }, [competitions, competitionId]);

  // Associa escalão a cada resultado
  const resultsWithGrade = useMemo(() => {
    if (!results.length) return [];
    const entryMap = new Map(entries.map(e => [e.id, e]));
    return results.map(r => {
      const entryById = r.entry_id ? entryMap.get(r.entry_id) : null;
      const entryByName = !entryById
        ? entries.find(e => e.rider_name === r.rider_name && e.horse_name === r.horse_name)
        : null;
      const grade = entryById?.grade || entryByName?.grade || r.grade || 'Sem escalão';
      return { ...r, grade };
    });
  }, [results, entries]);

  // Escalões disponíveis
  const grades = useMemo(() => {
    const all = Array.from(new Set(resultsWithGrade.map(r => r.grade))).sort((a, b) => a.localeCompare(b, 'pt'));
    return gradeParam ? all.filter(g => g === gradeParam) : all;
  }, [resultsWithGrade, gradeParam]);

  const activeGrade = manualGrade && grades.includes(manualGrade) ? manualGrade : grades[currentGradeIndex] || null;

  const rankedResults = useMemo(() => {
    const filtered = activeGrade
      ? resultsWithGrade.filter(r => r.grade === activeGrade)
      : resultsWithGrade;

    return [...filtered].sort((a, b) => {
      const ap = parseFloat(a.percentage || 0);
      const bp = parseFloat(b.percentage || 0);
      if (ap !== bp) return bp - ap;
      const as_ = parseFloat(a.score || 0);
      const bs_ = parseFloat(b.score || 0);
      if (as_ !== bs_) return bs_ - as_;
      return (a.position || 999) - (b.position || 999);
    });
  }, [resultsWithGrade, activeGrade]);

  // Auto-rotate entre escalões
  useEffect(() => {
    if (manualGrade || grades.length <= 1 || isPaused) return;

    setSecondsLeft(intervalParam);
    const countdown = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          setCurrentGradeIndex(i => (i + 1) % grades.length);
          return intervalParam;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdown);
  }, [currentGradeIndex, grades.length, intervalParam, isPaused, manualGrade]);

  const handlePrev = () => {
    setManualGrade(null);
    setCurrentGradeIndex(i => (i - 1 + grades.length) % grades.length);
    setSecondsLeft(intervalParam);
  };

  const handleNext = () => {
    setManualGrade(null);
    setCurrentGradeIndex(i => (i + 1) % grades.length);
    setSecondsLeft(intervalParam);
  };

  const medalColor = (pos) => {
    if (pos === 1) return 'from-yellow-400 to-yellow-500 text-yellow-900';
    if (pos === 2) return 'from-gray-300 to-gray-400 text-gray-900';
    if (pos === 3) return 'from-amber-600 to-amber-700 text-white';
    return 'from-[#B8956A] to-[#8B7355] text-white';
  };

  return (
    <AdminLayout fullscreen>
    <div className="min-h-screen bg-gradient-to-br from-[#1A1A1A] via-[#2D2D2D] to-[#1A1A1A] text-white flex flex-col">
      {/* Header */}
      <div className="relative py-8 px-6 text-center border-b border-white/10">
        <div className="absolute top-4 left-4 w-16 h-16 opacity-20">
          <Trophy className="w-full h-full text-[#B8956A]" />
        </div>
        <div className="absolute top-4 right-4 w-16 h-16 opacity-20">
          <Trophy className="w-full h-full text-[#B8956A]" />
        </div>
        <h1 className="text-2xl md:text-4xl font-serif font-bold text-[#B8956A] tracking-widest uppercase">
          {competition ? competition.name : `Ranking ${yearParam}`}
        </h1>
        <p className="text-stone-400 mt-1 text-sm tracking-wider uppercase">
          Picadeiro Quinta da Horta
        </p>
      </div>

      {/* Grade navigation */}
      {grades.length > 0 && (
        <div className="flex items-center justify-center gap-4 py-4 px-6 border-b border-white/10">
          <button onClick={handlePrev} className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeGrade}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="text-center"
              >
                <span className="text-xl font-bold text-[#B8956A]">{activeGrade}</span>
              </motion.div>
            </AnimatePresence>
          </div>

          <button onClick={handleNext} className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Timer + pause */}
          {!manualGrade && grades.length > 1 && (
            <div className="flex items-center gap-2 ml-4">
              <button
                onClick={() => setIsPaused(p => !p)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              </button>
              <div className="flex items-center gap-1 text-stone-400 text-sm">
                <Clock className="w-4 h-4" />
                <span className="w-4 text-center">{secondsLeft}</span>
              </div>
              {/* Progress bar */}
              <div className="w-24 h-1 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-[#B8956A]"
                  style={{ width: `${(secondsLeft / intervalParam) * 100}%` }}
                  transition={{ duration: 0.9, ease: 'linear' }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Grade pills */}
      {grades.length > 1 && (
        <div className="flex flex-wrap justify-center gap-2 px-6 py-3">
          {grades.map((grade, i) => (
            <button
              key={grade}
              onClick={() => {
                setManualGrade(grade === manualGrade ? null : grade);
                setCurrentGradeIndex(i);
                setSecondsLeft(intervalParam);
              }}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                activeGrade === grade
                  ? 'bg-[#B8956A] text-white scale-110'
                  : 'bg-white/10 text-stone-300 hover:bg-white/20'
              }`}
            >
              {grade}
            </button>
          ))}
        </div>
      )}

      {/* Rankings */}
      <div className="flex-1 overflow-y-auto px-4 md:px-12 py-6">
        {rankedResults.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-stone-500 py-24">
            <Trophy className="w-20 h-20 opacity-20" />
            <p className="text-lg">Sem resultados disponíveis</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeGrade}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3 }}
              className="space-y-3 max-w-4xl mx-auto"
            >
              {rankedResults.map((result, index) => {
                const pos = index + 1;
                const pct = parseFloat(result.percentage || 0);
                const score = parseFloat(result.score || 0);
                return (
                  <motion.div
                    key={result.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className={`flex items-center gap-4 p-4 rounded-xl border ${
                      pos === 1 ? 'bg-yellow-400/10 border-yellow-400/30' :
                      pos === 2 ? 'bg-gray-300/10 border-gray-400/30' :
                      pos === 3 ? 'bg-amber-700/10 border-amber-600/30' :
                      'bg-white/5 border-white/10'
                    }`}
                  >
                    {/* Position badge */}
                    <div className={`w-14 h-14 rounded-full bg-gradient-to-br flex-shrink-0 flex items-center justify-center font-bold text-2xl ${medalColor(pos)}`}>
                      {pos === 1 ? '🥇' : pos === 2 ? '🥈' : pos === 3 ? '🥉' : pos}
                    </div>

                    {/* Rider info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-lg text-white truncate">{result.rider_name}</p>
                      <p className="text-stone-400 text-sm truncate">{result.horse_name}</p>
                      <p className="text-xs text-[#B8956A]">{result.grade}</p>
                    </div>

                    {/* Score */}
                    <div className="text-right flex-shrink-0">
                      {pct > 0 && (
                        <p className="text-3xl font-bold text-[#B8956A]">{pct.toFixed(2)}%</p>
                      )}
                      {score > 0 && (
                        <p className="text-sm text-stone-400">{score.toFixed(2)} pts</p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Footer */}
      <div className="py-4 text-center text-stone-600 text-xs border-t border-white/10">
        Picadeiro Quinta da Horta · {new Date().getFullYear()}
      </div>
    </div>
    </AdminLayout>
  );
}