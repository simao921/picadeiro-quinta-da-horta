/**
 * Módulo de Cálculo de Pontuações para Competições Equestres
 * Suporta diferentes modalidades e fórmulas de pontuação
 */

/**
 * Calcula a pontuação final baseada na competição e dados extraídos
 * @param {Object} competitionData - Dados da competição (exercícios, base_percentage, etc)
 * @param {Object} modalityData - Dados da modalidade (fórmula, regras, etc)
 * @param {Object} scores - Pontuações extraídas (exercise_scores, penalties)
 * @returns {Object} - { final_score, percentage, calculation_details }
 */
export function calculateFinalScore(competitionData, modalityData, scores) {
  const toSafeNumber = (value, fallback = 0) => {
    if (typeof value === 'number') return Number.isFinite(value) ? value : fallback;
    if (typeof value === 'string') {
      const normalized = value.trim().replace(/\s/g, '').replace(',', '.');
      const parsed = Number(normalized);
      return Number.isFinite(parsed) ? parsed : fallback;
    }
    return fallback;
  };

  const {
    base_score = 0,
    technical_score = 0,
    artistic_score = 0,
    penalties = 0,
    bonus = 0,
    time = null,
    exercise_scores = null
  } = scores;
  const rawTechnicalScore = scores?.technical_score;
  const rawArtisticScore = scores?.artistic_score;

  const inferScaleMax = (...values) => {
    const numeric = values
      .map((v) => toSafeNumber(v, NaN))
      .filter((v) => Number.isFinite(v) && v > 0);
    const maxValue = numeric.length > 0 ? Math.max(...numeric) : 0;

    if (maxValue <= 10) return 10;
    if (maxValue <= 20) return 20;
    return 100;
  };
  const baseScoreNum = toSafeNumber(base_score, 0);
  const technicalScoreNum = toSafeNumber(technical_score, 0);
  const artisticScoreNum = toSafeNumber(artistic_score, 0);
  const hasProvidedScore = (value) => {
    if (value === null || value === undefined || value === '') return false;
    const parsed = toSafeNumber(value, NaN);
    return Number.isFinite(parsed);
  };
  const hasTechnicalProvided = hasProvidedScore(rawTechnicalScore);
  const hasQualitativeProvided = hasProvidedScore(rawArtisticScore);
  const techQualFinalScore = hasTechnicalProvided && hasQualitativeProvided
    ? (technicalScoreNum + artisticScoreNum) / 2
    : hasTechnicalProvided
      ? technicalScoreNum
      : hasQualitativeProvided
        ? artisticScoreNum
        : null;
  const penaltiesNum = toSafeNumber(penalties, 0);
  const bonusNum = toSafeNumber(bonus, 0);
  const modalityType = String(modalityData?.type || '').toLowerCase();
  const modalityName = String(modalityData?.name || '').toLowerCase();
  const scoringFormula = String(modalityData?.scoring_formula || '').toLowerCase();
  const coefficients = modalityData?.coefficients || {};
  const averageModeByConfig =
    coefficients.use_tech_qual_average === true ||
    coefficients.average_tech_qual === true;
  const averageModeByFormula =
    ((scoringFormula.includes('media') || scoringFormula.includes('média')) &&
      (scoringFormula.includes('tecn') || scoringFormula.includes('technical')) &&
      (scoringFormula.includes('qualit') || scoringFormula.includes('artistic'))) ||
    (scoringFormula.includes('/2') &&
      (scoringFormula.includes('tecn') || scoringFormula.includes('technical')) &&
      (scoringFormula.includes('qualit') || scoringFormula.includes('artistic')));
  const isInfantil1Or3 = /infantil\s*(1|i|3|iii)\b/.test(modalityName);
  const isInfantil1 = /infantil\s*(1|i)\b/.test(modalityName);
  const isJuniorsTeam = /juniors?\s*team\b/.test(modalityName);
  const isFixedTechQualScale = isInfantil1Or3 || isJuniorsTeam;
  const averageModeByModalityName = isFixedTechQualScale;
  const isInfantil3 = /infantil\s*(3|iii)\b/.test(modalityName);
  const shouldUseTechQualAverage = averageModeByConfig || averageModeByFormula || averageModeByModalityName;
  const isSaltos =
    modalityType === 'saltos' ||
    scoringFormula.includes('saltos') ||
    scoringFormula.includes('jumping');
  const isWorkingEquitation =
    modalityType === 'working_equitation' ||
    scoringFormula.includes('working') ||
    scoringFormula.includes('equitacao') ||
    scoringFormula.includes('equitação') ||
    /\bwe\b/.test(scoringFormula);
  const penaltyMode = isSaltos || isWorkingEquitation ? 'none' : 'percentage';
  const shouldAutoAdjustPercentage = !shouldUseTechQualAverage;
  const applyPercentageAdjustments = (basePercentage) => {
    if (!shouldAutoAdjustPercentage) {
      return Math.max(0, basePercentage);
    }
    if (penaltyMode === 'percentage') {
      return Math.max(0, basePercentage - penaltiesNum + bonusNum);
    }
    return Math.max(0, basePercentage + bonusNum);
  };
  const exerciseScoresNum = exercise_scores && typeof exercise_scores === 'object'
    ? Object.fromEntries(
      Object.entries(exercise_scores).map(([k, v]) => {
        if (v === null || v === undefined || v === '') return [k, null];
        return [k, toSafeNumber(v, 0)];
      })
    )
    : null;

  // Para modalidades com regra de média Técnica/Qualitativa (ex: Infantil 3),
  // quando as notas já existem no protocolo, elas têm prioridade sobre recomputação por exercícios.
  if (techQualFinalScore !== null && shouldUseTechQualAverage) {
    const technicalBase = isInfantil1Or3 ? 100 : inferScaleMax(technicalScoreNum);
    const qualitativeBase = isInfantil1Or3 ? 40 : inferScaleMax(artisticScoreNum);
    const technicalPercentage = hasTechnicalProvided
      ? (technicalBase > 0 ? (technicalScoreNum / technicalBase) * 100 : 0)
      : null;
    const qualitativePercentage = hasQualitativeProvided
      ? (qualitativeBase > 0 ? (artisticScoreNum / qualitativeBase) * 100 : 0)
      : null;
    const basePercentage = technicalPercentage !== null && qualitativePercentage !== null
      ? (technicalPercentage + qualitativePercentage) / 2
      : technicalPercentage !== null
        ? technicalPercentage
        : qualitativePercentage !== null
          ? qualitativePercentage
          : 0;
    const percentage = Math.max(0, basePercentage);
    const details = hasTechnicalProvided && hasQualitativeProvided
      ? isInfantil1Or3
        ? `((Téc ${technicalScoreNum}/100) + (Qual ${artisticScoreNum}/40)) / 2`
        : `(${technicalScoreNum} + ${artisticScoreNum}) / 2`
      : hasTechnicalProvided
        ? `Apenas nota técnica (${technicalScoreNum})`
        : `Apenas nota qualitativa (${artisticScoreNum})`;

    return {
      final_score: parseFloat(basePercentage.toFixed(2)),
      percentage: parseFloat(percentage.toFixed(2)),
      calculation_details: `${details} = ${basePercentage.toFixed(2)}% = ${percentage.toFixed(2)}%`
    };
  }

  const exercisesSource =
    competitionData?.exercises?.length > 0
      ? competitionData.exercises
      : modalityData?.exercises?.length > 0
        ? modalityData.exercises
        : modalityData?.coefficients?.__exercises?.length > 0
          ? modalityData.coefficients.__exercises
        : [];

  // Se tem exercícios e pontuações por exercício, calcular baseado nisso
  if (exercisesSource.length > 0 && exerciseScoresNum) {
    let totalPoints = 0;
    let scoredExercises = 0;
    let maxPoints = 0;
    let details = [];
    let technicalPoints = 0;
    let technicalMax = 0;
    let qualitativePoints = 0;
    let qualitativeMax = 0;
    let technicalScoredCount = 0;
    let qualitativeScoredCount = 0;
    let hasTechnicalExercises = false;
    let hasQualitativeExercises = false;

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

    exercisesSource.forEach(exercise => {
      const score = exerciseScoresNum[exercise.number];
      const coef = exercise.coefficient || 1;
      const exMaxRaw = toSafeNumber(exercise.max_points, 10);
      const exMax = exMaxRaw > 0 ? exMaxRaw : 10;
      const category = getExerciseCategory(exercise);
      const exerciseMaxWeighted = exMax * coef;
      maxPoints += exMax * coef;

      if (category === 'technical') {
        hasTechnicalExercises = true;
        technicalMax += exerciseMaxWeighted;
      } else if (category === 'qualitative') {
        hasQualitativeExercises = true;
        qualitativeMax += exerciseMaxWeighted;
      }

      if (score !== null && score !== undefined && !isNaN(score)) {
        const weighted = score * coef;
        totalPoints += weighted;
        scoredExercises++;
        if (category === 'technical') {
          technicalPoints += weighted;
          technicalScoredCount++;
        }
        if (category === 'qualitative') {
          qualitativePoints += weighted;
          qualitativeScoredCount++;
        }
        if (coef !== 1) {
          details.push(`Ex${exercise.number}: ${score}×${coef}=${weighted}`);
        } else {
          details.push(`Ex${exercise.number}: ${score}`);
        }
      }
    });

    if (scoredExercises > 0) {
      // Soma total com coeficientes (não média) - penalizações NÃO são subtraídas dos pontos
      const basePointsScore = totalPoints;
      const basePercentage = maxPoints > 0 ? (basePointsScore / maxPoints) * 100 : 0;
      let percentage = basePercentage;
      let finalScoreValue = basePointsScore;
      let weightedDetails = '';

      if (hasTechnicalExercises || hasQualitativeExercises) {
        const coefficients = modalityData?.coefficients || {};
        const technicalRaw = Number(
          coefficients.technical_percentage ??
          coefficients.technical_weight ??
          70
        );
        const qualitativeRaw = Number(
          coefficients.qualitative_percentage ??
          coefficients.qualitative_weight ??
          (100 - technicalRaw)
        );

        const technicalWeight = Number.isFinite(technicalRaw) ? technicalRaw : 70;
        const qualitativeWeight = Number.isFinite(qualitativeRaw) ? qualitativeRaw : 30;

        const technicalBaseForAverage = isFixedTechQualScale ? 100 : technicalMax;
        const qualitativeBaseForAverage = isFixedTechQualScale ? 40 : qualitativeMax;
        const technicalPercentage =
          technicalScoredCount > 0 && technicalBaseForAverage > 0
            ? (technicalPoints / technicalBaseForAverage) * 100
            : null;
        const qualitativePercentage =
          qualitativeScoredCount > 0 && qualitativeBaseForAverage > 0
            ? (qualitativePoints / qualitativeBaseForAverage) * 100
            : null;

        if (technicalPercentage !== null || qualitativePercentage !== null) {
          let weightedBase = basePercentage;

          if (shouldUseTechQualAverage) {
            if (technicalPercentage !== null && qualitativePercentage !== null) {
              weightedBase = (technicalPercentage + qualitativePercentage) / 2;
            } else if (technicalPercentage !== null) {
              weightedBase = technicalPercentage;
            } else if (qualitativePercentage !== null) {
              weightedBase = qualitativePercentage;
            }
          } else {
            if (technicalPercentage !== null && qualitativePercentage !== null) {
              const weightedTechnical = (technicalPercentage * technicalWeight) / 100;
              const weightedQualitative = (qualitativePercentage * qualitativeWeight) / 100;
              weightedBase = weightedTechnical + weightedQualitative;
            } else if (technicalPercentage !== null) {
              weightedBase = technicalPercentage;
            } else if (qualitativePercentage !== null) {
              weightedBase = qualitativePercentage;
            }
          }

          const shouldApplyAdjustments = shouldAutoAdjustPercentage;
          percentage = shouldApplyAdjustments
            ? applyPercentageAdjustments(weightedBase)
            : Math.max(0, weightedBase);
          if (shouldUseTechQualAverage) {
            finalScoreValue = percentage;
          }
          weightedDetails = [
            technicalPercentage !== null
              ? `Téc: ${technicalPercentage.toFixed(2)}%×${technicalWeight}%`
              : '',
            qualitativePercentage !== null
              ? `Qual: ${qualitativePercentage.toFixed(2)}%×${qualitativeWeight}%`
              : '',
            shouldUseTechQualAverage && technicalPercentage !== null && qualitativePercentage !== null
              ? `Média(Téc,Qual): (${technicalPercentage.toFixed(2)}% + ${qualitativePercentage.toFixed(2)}%) / 2`
              : '',
            technicalPercentage !== null && qualitativePercentage === null
              ? `Apenas Técnica considerada`
              : '',
            qualitativePercentage !== null && technicalPercentage === null
              ? `Apenas Qualitativa considerada`
              : '',
            !shouldUseTechQualAverage && penaltyMode === 'percentage' && penaltiesNum > 0 ? `- ${penaltiesNum}%` : '',
            !shouldUseTechQualAverage && penaltyMode !== 'percentage' && penaltiesNum > 0 ? `Penalizações: ${penaltiesNum} (sem desconto % automático)` : '',
            !shouldUseTechQualAverage && bonusNum > 0 ? `+ ${bonusNum}%` : ''
          ].filter(Boolean).join(' | ');
        }
      } else {
        percentage = applyPercentageAdjustments(percentage);
      }
      
      return {
        final_score: parseFloat(finalScoreValue.toFixed(2)),
        percentage: parseFloat(Math.max(0, percentage).toFixed(2)),
        calculation_details: `Total: ${details.join(' + ')} = ${basePointsScore} pts${!shouldUseTechQualAverage && penaltyMode === 'percentage' && penaltiesNum > 0 ? ` | Perc: -${penaltiesNum}%` : ''}${!shouldUseTechQualAverage && bonusNum > 0 ? ` +${bonusNum}%` : ''}${weightedDetails ? ` | ${weightedDetails}` : ` = ${percentage.toFixed(2)}%`}${shouldUseTechQualAverage ? ` | Nota final: ${finalScoreValue.toFixed(2)}` : ''}`
      };
    }
  }

  // Se já tiver pontuação final extraída e não houver fórmula, usa a extraída
  if (scores.final_score && !modalityData?.scoring_formula) {
    const extractedPercentage = toSafeNumber(scores.percentage, 0);
    return {
      final_score: scores.final_score,
      percentage: parseFloat(applyPercentageAdjustments(extractedPercentage).toFixed(2)),
      calculation_details: 'Pontuação extraída do protocolo'
    };
  }

  let final_score = 0;
  let percentage = 0;
  let calculation_details = '';

  if (!modalityData?.scoring_formula) {
    // Sem fórmula: pontuação base, penalizações em %
    final_score = baseScoreNum;
    const configuredBase = toSafeNumber(competitionData?.base_percentage, 0);
    const base_percentage = configuredBase > 0
      ? configuredBase
      : inferScaleMax(baseScoreNum);
    const basePercentage = base_percentage > 0 ? (final_score / base_percentage) * 100 : 0;
    percentage = applyPercentageAdjustments(basePercentage);
    calculation_details = `Base (${baseScoreNum}) = ${basePercentage.toFixed(2)}%${penaltyMode === 'percentage' && penaltiesNum > 0 ? ` - ${penaltiesNum}%` : ''}${bonusNum > 0 ? ` + ${bonusNum}%` : ''} = ${percentage.toFixed(2)}%`;
  } else {
    const formula = scoringFormula;
    const coefficients = modalityData.coefficients || {};
    const configuredBase = toSafeNumber(competitionData?.base_percentage, 0);
    const base_percentage = configuredBase > 0
      ? configuredBase
      : inferScaleMax(baseScoreNum, technicalScoreNum, artisticScoreNum);

    // Dressage / Ensino (fórmula típica)
    if (formula.includes('dressage') || formula.includes('ensino')) {
      // Fórmula: (pontos obtidos / pontos máximos) * 100, penalizações em %
      const max_points = base_percentage || 100;
      if (baseScoreNum > 0) {
        final_score = baseScoreNum;
        const basePercentage = (baseScoreNum / max_points) * 100;
        percentage = applyPercentageAdjustments(basePercentage);
        calculation_details = `Dressage: ${baseScoreNum}/${max_points} = ${basePercentage.toFixed(2)}%${penaltyMode === 'percentage' && penaltiesNum > 0 ? ` - ${penaltiesNum}%` : ''}${bonusNum > 0 ? ` + ${bonusNum}%` : ''} = ${percentage.toFixed(2)}%`;
      }
    }
    // Working Equitation - Sistema de 3 provas
    else if (formula.includes('working') || formula.includes('we')) {
      // WE tem 3 componentes: Dressage, Maneabilidade (técnica), Velocidade (tempo)
      // Sistema de pontos: menor tempo = mais pontos, penalizações reduzem
      if (technicalScoreNum > 0 || artisticScoreNum > 0) {
        // Componentes com pesos configuráveis
        const dressage_weight = coefficients.dressage || 1;
        const technical_weight = coefficients.technical || coefficients.maneabilidade || 1;
        const speed_weight = coefficients.speed || coefficients.velocidade || 1;
        
        let total_weighted = 0;
        let details = [];
        
        if (baseScoreNum > 0) {
          total_weighted += baseScoreNum * dressage_weight;
          details.push(`Dressage: ${baseScoreNum}×${dressage_weight}`);
        }
        if (technicalScoreNum > 0) {
          total_weighted += technicalScoreNum * technical_weight;
          details.push(`Maneabilidade: ${technicalScoreNum}×${technical_weight}`);
        }
        if (artisticScoreNum > 0) {
          total_weighted += artisticScoreNum * speed_weight;
          details.push(`Velocidade: ${artisticScoreNum}×${speed_weight}`);
        }
        
        // Penalizações em percentagem
        final_score = total_weighted;
        const max_possible = base_percentage || 300;
        const basePercentage = (final_score / max_possible) * 100;
        percentage = applyPercentageAdjustments(basePercentage);
        
        calculation_details = `WE: ${details.join(' + ')} = ${final_score} | ${basePercentage.toFixed(2)}%${penaltyMode === 'percentage' && penaltiesNum > 0 ? ` - ${penaltiesNum}%` : ''}${bonusNum > 0 ? ` + ${bonusNum}%` : ''} = ${percentage.toFixed(2)}%`;
      } else {
        final_score = baseScoreNum;
        const basePercentage = base_percentage > 0 ? (final_score / base_percentage) * 100 : 0;
        percentage = applyPercentageAdjustments(basePercentage);
        calculation_details = `WE: ${baseScoreNum} = ${basePercentage.toFixed(2)}%${penaltyMode === 'percentage' && penaltiesNum > 0 ? ` - ${penaltiesNum}%` : ''}${bonusNum > 0 ? ` + ${bonusNum}%` : ''} = ${percentage.toFixed(2)}%`;
      }
    }
    // Saltos de Obstáculos - Sistema de penalizações
    else if (formula.includes('saltos') || formula.includes('jumping')) {
      // Sistema padrão FEI:
      // - Derrube de obstáculo: +4 pontos
      // - 1ª desobediência: +4 pontos
      // - 2ª desobediência: eliminação
      // - Queda: eliminação
      
      final_score = penaltiesNum; // Em saltos, menor pontuação é melhor (0 = percurso limpo)
      calculation_details = `Saltos: ${penaltiesNum} pontos de falta`;
      
      // Percentagem inversa usada apenas como métrica interna de visualização
      const max_faults = base_percentage || 50;
      percentage = Math.max(0, 100 - ((penaltiesNum / max_faults) * 100));
      percentage += bonusNum;
    }
    // Fórmula personalizada (expressão matemática)
    else if (
      formula.includes('base') ||
      formula.includes('technical') ||
      formula.includes('artistic') ||
      formula.includes('qualit')
    ) {
      try {
        // Tenta avaliar a fórmula como expressão
        const formula_result = evaluateFormula(formula, {
          base: baseScoreNum,
          technical: technicalScoreNum,
          qualitative: artisticScoreNum,
          artistic: artisticScoreNum,
          penalties: penaltiesNum,
          bonus: bonusNum,
          ...coefficients
        });
        final_score = formula_result;
        percentage = base_percentage > 0 ? (final_score / base_percentage) * 100 : 0;
        calculation_details = `Fórmula: ${formula} = ${final_score.toFixed(2)}`;
      } catch (e) {
        // Se falhar, usa base, penalizações em %
        final_score = baseScoreNum;
        const basePercentage = base_percentage > 0 ? (final_score / base_percentage) * 100 : 0;
        percentage = applyPercentageAdjustments(basePercentage);
        calculation_details = `Base ${baseScoreNum} | ${basePercentage.toFixed(2)}%${penaltyMode === 'percentage' && penaltiesNum > 0 ? ` - ${penaltiesNum}%` : ''}${bonusNum > 0 ? ` + ${bonusNum}%` : ''} = ${percentage.toFixed(2)}% (fórmula inválida)`;
      }
    }
    // Default
    else {
      final_score = baseScoreNum;
      const base_percentage = competitionData?.base_percentage || 100;
      const basePercentage = base_percentage > 0 ? (final_score / base_percentage) * 100 : 0;
      percentage = applyPercentageAdjustments(basePercentage);
      calculation_details = `${baseScoreNum} = ${basePercentage.toFixed(2)}%${penaltyMode === 'percentage' && penaltiesNum > 0 ? ` - ${penaltiesNum}%` : ''}${bonusNum > 0 ? ` + ${bonusNum}%` : ''} = ${percentage.toFixed(2)}%`;
    }
  }

  return {
    final_score: parseFloat(final_score.toFixed(2)),
    percentage: parseFloat(percentage.toFixed(2)),
    calculation_details
  };
}

/**
 * Avalia uma fórmula matemática simples
 * @param {String} formula - Fórmula como string (ex: "base + technical - penalties")
 * @param {Object} variables - Variáveis disponíveis
 * @returns {Number} - Resultado
 */
function evaluateFormula(formula, variables) {
  // Substitui variáveis na fórmula
  let expression = formula;
  Object.keys(variables).forEach(key => {
    const regex = new RegExp(`\\b${key}\\b`, 'g');
    expression = expression.replace(regex, variables[key] || 0);
  });

  // Avalia a expressão (apenas operações básicas permitidas)
  // Remove tudo que não seja número, operador ou parênteses
  expression = expression.replace(/[^0-9+\-*/().]/g, '');
  
  // Avalia usando Function (seguro porque já sanitizámos)
  try {
    return new Function('return ' + expression)();
  } catch (e) {
    throw new Error('Fórmula inválida');
  }
}

/**
 * Calcula rankings baseados em pontuações
 * @param {Array} results - Array de resultados com pontuações
 * @param {String} sortBy - Campo para ordenar ('final_score', 'percentage', 'time')
 * @returns {Array} - Resultados ordenados com posições
 */
export function calculateRankings(results, sortBy = 'final_score', reverseOrder = false) {
  // Ordena por pontuação
  const sorted = [...results].sort((a, b) => {
    // Para saltos, menor pontuação é melhor (reverseOrder = true)
    if (reverseOrder) {
      return (a[sortBy] || 0) - (b[sortBy] || 0);
    }
    
    // Para pontuação normal, maior é melhor
    return (b[sortBy] || 0) - (a[sortBy] || 0);
  });

  // Atribui posições (considera empates)
  let currentPosition = 1;
  let previousScore = null;
  
  return sorted.map((result, index) => {
    const currentScore = sortBy === 'time' && result.time 
      ? parseTime(result.time) 
      : result[sortBy];
    
    if (previousScore !== null && currentScore !== previousScore) {
      currentPosition = index + 1;
    }
    
    previousScore = currentScore;
    
    return {
      ...result,
      position: currentPosition
    };
  });
}

/**
 * Converte string de tempo em segundos
 * @param {String} timeStr - Tempo como "1:23.45" ou "83.45"
 * @returns {Number} - Segundos
 */
function parseTime(timeStr) {
  if (!timeStr) return Infinity;
  
  // Se já for número, retorna
  if (typeof timeStr === 'number') return timeStr;
  
  // Formato MM:SS.MS
  if (timeStr.includes(':')) {
    const [minutes, seconds] = timeStr.split(':');
    return parseInt(minutes) * 60 + parseFloat(seconds);
  }
  
  // Formato SS.MS
  return parseFloat(timeStr);
}

/**
 * Valida se uma fórmula de pontuação é válida
 * @param {String} formula - Fórmula a validar
 * @returns {Boolean}
 */
export function validateFormula(formula) {
  if (!formula) return false;
  
  try {
    // Tenta avaliar com valores dummy
    evaluateFormula(formula, {
      base: 100,
      technical: 50,
      qualitative: 40,
      artistic: 50,
      penalties: 0,
      bonus: 0
    });
    return true;
  } catch (e) {
    return false;
  }
}
