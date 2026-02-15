import React, { useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function ExerciseScoreForm({ 
  exercises = [], 
  scores = {}, 
  penalties = 0,
  bonus = 0,
  onScoreChange,
  onPenaltiesChange,
  onBonusChange,
  showCalculation = true 
}) {
  const getExerciseCategory = (exercise) => {
    const raw = String(
      exercise?.category ||
      exercise?.type ||
      exercise?.evaluation_type ||
      exercise?.group ||
      exercise?.area ||
      ''
    ).toLowerCase();

    if (raw.includes('qualit') || raw.includes('art') || raw.includes('subjet')) {
      return 'qualitative';
    }
    if (raw.includes('tecn') || raw.includes('technic') || raw.includes('obj')) {
      return 'technical';
    }
    return 'general';
  };

  const groupedExercises = useMemo(() => {
    const groups = {
      technical: [],
      qualitative: [],
      general: []
    };

    exercises.forEach((ex) => {
      groups[getExerciseCategory(ex)].push(ex);
    });

    return groups;
  }, [exercises]);

  const calculation = useMemo(() => {
    if (!exercises || exercises.length === 0) return null;

    let total = 0;
    let maxTotal = 0;
    const details = [];

    exercises.forEach(ex => {
      const exMax = typeof ex.max_points === 'number' && ex.max_points > 0 ? ex.max_points : 10;
      maxTotal += exMax * (ex.coefficient || 1);
      const score = scores[ex.number] || 0;
      if (score > 0) {
        const exerciseValue = score * (ex.coefficient || 1);
        total += exerciseValue;
        details.push(`Ex${ex.number}: ${score}×${ex.coefficient || 1} = ${exerciseValue}`);
      }
    });

    // Penalizações são em %, aplicadas à percentagem, não aos pontos
    const percentageBase = maxTotal > 0 ? (total / maxTotal) * 100 : 0;
    const percentageFinal = Math.max(0, percentageBase - (penalties || 0) + (bonus || 0));
    
    return {
      subtotal: total,
      max_total: maxTotal,
      penalties: penalties || 0,
      bonus: bonus || 0,
      final: total, // Pontuação final = total de pontos (sem subtrair penalizações)
      details: details.join(' | '),
      percentage: percentageFinal
    };
  }, [exercises, scores, penalties, bonus]);

  return (
    <div className="space-y-4">
      {/* Exercícios */}
      {exercises && exercises.length > 0 ? (
        <div>
          <Label className="mb-3 block font-bold">Exercícios</Label>
          <div className="space-y-4">
            {groupedExercises.technical.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-stone-600 mb-2 uppercase tracking-wide">Nota Técnica</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {groupedExercises.technical.map(ex => (
                    <div 
                      key={ex.number} 
                      className="p-3 border rounded-lg bg-white hover:border-[#B8956A] transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <Label className="text-sm font-bold">
                            Exercício {ex.number}
                          </Label>
                          {ex.name && (
                            <p className="text-xs text-stone-600 mt-1">{ex.name}</p>
                          )}
                        </div>
                        {ex.coefficient > 1 && (
                          <Badge variant="outline" className="text-xs">
                            ×{ex.coefficient}
                          </Badge>
                        )}
                      </div>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max={ex.max_points || 10}
                        placeholder="0"
                        value={scores[ex.number] || ''}
                        onChange={(e) => {
                          const value = e.target.value ? parseFloat(e.target.value) : 0;
                          const maxValue = ex.max_points || 10;
                          if (value >= 0 && value <= maxValue) {
                            onScoreChange(ex.number, value);
                          }
                        }}
                        className="font-medium text-center"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {groupedExercises.qualitative.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-stone-600 mb-2 uppercase tracking-wide">Nota Qualitativa</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {groupedExercises.qualitative.map(ex => (
                    <div 
                      key={ex.number} 
                      className="p-3 border rounded-lg bg-white hover:border-[#B8956A] transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <Label className="text-sm font-bold">
                            Exercício {ex.number}
                          </Label>
                          {ex.name && (
                            <p className="text-xs text-stone-600 mt-1">{ex.name}</p>
                          )}
                        </div>
                        {ex.coefficient > 1 && (
                          <Badge variant="outline" className="text-xs">
                            ×{ex.coefficient}
                          </Badge>
                        )}
                      </div>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max={ex.max_points || 10}
                        placeholder="0"
                        value={scores[ex.number] || ''}
                        onChange={(e) => {
                          const value = e.target.value ? parseFloat(e.target.value) : 0;
                          const maxValue = ex.max_points || 10;
                          if (value >= 0 && value <= maxValue) {
                            onScoreChange(ex.number, value);
                          }
                        }}
                        className="font-medium text-center"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {groupedExercises.general.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-stone-600 mb-2 uppercase tracking-wide">Outros Exercícios</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {groupedExercises.general.map(ex => (
                    <div 
                      key={ex.number} 
                      className="p-3 border rounded-lg bg-white hover:border-[#B8956A] transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <Label className="text-sm font-bold">
                            Exercício {ex.number}
                          </Label>
                          {ex.name && (
                            <p className="text-xs text-stone-600 mt-1">{ex.name}</p>
                          )}
                        </div>
                        {ex.coefficient > 1 && (
                          <Badge variant="outline" className="text-xs">
                            ×{ex.coefficient}
                          </Badge>
                        )}
                      </div>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max={ex.max_points || 10}
                        placeholder="0"
                        value={scores[ex.number] || ''}
                        onChange={(e) => {
                          const value = e.target.value ? parseFloat(e.target.value) : 0;
                          const maxValue = ex.max_points || 10;
                          if (value >= 0 && value <= maxValue) {
                            onScoreChange(ex.number, value);
                          }
                        }}
                        className="font-medium text-center"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-4 bg-stone-50 rounded-lg text-center text-stone-500 text-sm">
          Nenhum exercício configurado para esta modalidade
        </div>
      )}

      {/* Penalizações */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <Label className="mb-2 block">Penalizações (%)</Label>
          <Input
            type="number"
            step="0.1"
            min="0"
            placeholder="0"
            value={penalties || ''}
            onChange={(e) => onPenaltiesChange(parseFloat(e.target.value) || 0)}
            className="font-medium"
          />
        </div>
        <div>
          <Label className="mb-2 block">Bonificação (%)</Label>
          <Input
            type="number"
            step="0.1"
            min="0"
            placeholder="0"
            value={bonus || ''}
            onChange={(e) => onBonusChange?.(parseFloat(e.target.value) || 0)}
            className="font-medium"
          />
        </div>
      </div>

      {/* Cálculo */}
      {showCalculation && calculation && exercises.length > 0 && (
        <Card className="border-[#B8956A] bg-gradient-to-r from-[#B8956A] via-[#C9A961] to-[#B8956A] bg-opacity-5 border-2">
          <CardContent className="pt-4">
            <div className="space-y-3">
              {/* Exercícios com valores */}
              {calculation.details && (
                <div className="text-xs text-stone-600 p-2 bg-white bg-opacity-50 rounded">
                  {calculation.details}
                </div>
              )}

              {/* Resumo */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-stone-700">Subtotal:</span>
                  <span className="font-bold">{calculation.subtotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-stone-700">Máximo:</span>
                  <span className="font-bold">{calculation.max_total.toFixed(2)}</span>
                </div>
                
                {calculation.penalties > 0 && (
                  <div className="flex justify-between text-sm text-red-600">
                    <span>Penalizações:</span>
                    <span className="font-bold">-{calculation.penalties.toFixed(2)}%</span>
                  </div>
                )}

                {calculation.bonus > 0 && (
                  <div className="flex justify-between text-sm text-green-700">
                    <span>Bonificação:</span>
                    <span className="font-bold">+{calculation.bonus.toFixed(2)}%</span>
                  </div>
                )}

                <div className="border-t border-[#B8956A] border-opacity-20 pt-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-lg text-[#2D2D2D]">Pontuação Final:</span>
                    <span className="font-bold text-3xl text-[#B8956A]">
                      {calculation.final.toFixed(2)}
                    </span>
                  </div>
                </div>

                {calculation.percentage > 0 && (
                  <div className="flex justify-between text-xs text-stone-600 mt-1 italic">
                    <span>Percentagem:</span>
                    <span>{calculation.percentage.toFixed(2)}%</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}