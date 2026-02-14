import React, { useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function ExerciseScoreForm({ 
  exercises = [], 
  scores = {}, 
  penalties = 0,
  onScoreChange,
  onPenaltiesChange,
  showCalculation = true 
}) {
  const calculation = useMemo(() => {
    if (!exercises || exercises.length === 0) return null;

    let total = 0;
    const details = [];

    exercises.forEach(ex => {
      const score = scores[ex.number] || 0;
      if (score > 0) {
        const exerciseValue = score * (ex.coefficient || 1);
        total += exerciseValue;
        details.push(`Ex${ex.number}: ${score}×${ex.coefficient || 1} = ${exerciseValue}`);
      }
    });

    const withPenalties = Math.max(0, total - (penalties || 0));
    
    return {
      subtotal: total,
      penalties: penalties || 0,
      final: withPenalties,
      details: details.join(' | '),
      percentage: total > 0 ? Math.round((withPenalties / (total || 1)) * 100) : 0
    };
  }, [exercises, scores, penalties]);

  return (
    <div className="space-y-4">
      {/* Exercícios */}
      {exercises && exercises.length > 0 ? (
        <div>
          <Label className="mb-3 block font-bold">Exercícios (0-10 cada)</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exercises.map(ex => (
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
                  max="10"
                  placeholder="0"
                  value={scores[ex.number] || ''}
                  onChange={(e) => {
                    const value = e.target.value ? parseFloat(e.target.value) : 0;
                    if (value >= 0 && value <= 10) {
                      onScoreChange(ex.number, value);
                    }
                  }}
                  className="font-medium text-center"
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-4 bg-stone-50 rounded-lg text-center text-stone-500 text-sm">
          Nenhum exercício configurado para esta modalidade
        </div>
      )}

      {/* Penalizações */}
      <div>
        <Label className="mb-2 block">Penalizações</Label>
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
                
                {calculation.penalties > 0 && (
                  <div className="flex justify-between text-sm text-red-600">
                    <span>Penalizações:</span>
                    <span className="font-bold">-{calculation.penalties.toFixed(2)}</span>
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
                    <span>{calculation.percentage}%</span>
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