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
  const {
    base_score = 0,
    technical_score = 0,
    artistic_score = 0,
    penalties = 0,
    time = null,
    exercise_scores = null
  } = scores;

  const exercisesSource =
    competitionData?.exercises?.length > 0
      ? competitionData.exercises
      : modalityData?.exercises?.length > 0
        ? modalityData.exercises
        : modalityData?.coefficients?.__exercises?.length > 0
          ? modalityData.coefficients.__exercises
        : [];

  // Se tem exercícios e pontuações por exercício, calcular baseado nisso
  if (exercisesSource.length > 0 && exercise_scores) {
    let totalPoints = 0;
    let scoredExercises = 0;
    let maxPoints = 0;
    let details = [];

    exercisesSource.forEach(exercise => {
      const score = exercise_scores[exercise.number];
      const coef = exercise.coefficient || 1;
      const exMax = typeof exercise.max_points === 'number' ? exercise.max_points : 10;
      maxPoints += exMax * coef;

      if (score !== null && score !== undefined && !isNaN(score)) {
        const weighted = score * coef;
        totalPoints += weighted;
        scoredExercises++;
        if (coef !== 1) {
          details.push(`Ex${exercise.number}: ${score}×${coef}=${weighted}`);
        } else {
          details.push(`Ex${exercise.number}: ${score}`);
        }
      }
    });

    if (scoredExercises > 0) {
      // Soma total com coeficientes (não média)
      const final_score = totalPoints - (penalties || 0);
      const percentage = maxPoints > 0 ? (final_score / maxPoints) * 100 : 0;
      
      return {
        final_score: parseFloat(final_score.toFixed(2)),
        percentage: parseFloat(Math.max(0, percentage).toFixed(2)),
        calculation_details: `Total: ${details.join(' + ')}${penalties > 0 ? ` - Penalizações(${penalties})` : ''} = ${final_score}`
      };
    }
  }

  // Se já tiver pontuação final extraída e não houver fórmula, usa a extraída
  if (scores.final_score && !modalityData?.scoring_formula) {
    return {
      final_score: scores.final_score,
      percentage: scores.percentage || 0,
      calculation_details: 'Pontuação extraída do protocolo'
    };
  }

  let final_score = 0;
  let percentage = 0;
  let calculation_details = '';

  if (!modalityData?.scoring_formula) {
    // Sem fórmula: pontuação base menos penalizações
    final_score = base_score - penalties;
    calculation_details = `Base (${base_score}) - Penalizações (${penalties})`;
  } else {
    const formula = modalityData.scoring_formula.toLowerCase();
    const coefficients = modalityData.coefficients || {};
    const base_percentage = competitionData?.base_percentage || 100;

    // Dressage / Ensino (fórmula típica)
    if (formula.includes('dressage') || formula.includes('ensino')) {
      // Fórmula: (pontos obtidos / pontos máximos) * 100
      const max_points = base_percentage || 100;
      if (base_score > 0) {
        percentage = (base_score / max_points) * 100;
        final_score = base_score - penalties;
        calculation_details = `Dressage: ${base_score}/${max_points} = ${percentage.toFixed(2)}% - Penalizações: ${penalties}`;
      }
    }
    // Working Equitation - Sistema de 3 provas
    else if (formula.includes('working') || formula.includes('we')) {
      // WE tem 3 componentes: Dressage, Maneabilidade (técnica), Velocidade (tempo)
      // Sistema de pontos: menor tempo = mais pontos, penalizações reduzem
      if (technical_score > 0 || artistic_score > 0) {
        // Componentes com pesos configuráveis
        const dressage_weight = coefficients.dressage || 1;
        const technical_weight = coefficients.technical || coefficients.maneabilidade || 1;
        const speed_weight = coefficients.speed || coefficients.velocidade || 1;
        
        let total_weighted = 0;
        let details = [];
        
        if (base_score > 0) {
          total_weighted += base_score * dressage_weight;
          details.push(`Dressage: ${base_score}×${dressage_weight}`);
        }
        if (technical_score > 0) {
          total_weighted += technical_score * technical_weight;
          details.push(`Maneabilidade: ${technical_score}×${technical_weight}`);
        }
        if (artistic_score > 0) {
          total_weighted += artistic_score * speed_weight;
          details.push(`Velocidade: ${artistic_score}×${speed_weight}`);
        }
        
        // Aplicar penalizações
        final_score = Math.max(0, total_weighted - penalties);
        const max_possible = base_percentage || 300;
        percentage = (final_score / max_possible) * 100;
        
        calculation_details = `WE: ${details.join(' + ')}${penalties > 0 ? ` - Penaliz(${penalties})` : ''} = ${final_score}`;
      } else {
        final_score = Math.max(0, base_score - penalties);
        percentage = base_percentage > 0 ? (final_score / base_percentage) * 100 : 0;
        calculation_details = `WE: ${base_score}${penalties > 0 ? ` - ${penalties}` : ''} = ${final_score}`;
      }
    }
    // Saltos de Obstáculos - Sistema de penalizações
    else if (formula.includes('saltos') || formula.includes('jumping')) {
      // Sistema padrão FEI:
      // - Derrube de obstáculo: +4 pontos
      // - 1ª desobediência: +4 pontos
      // - 2ª desobediência: eliminação
      // - Queda: eliminação
      
      final_score = penalties; // Em saltos, menor pontuação é melhor (0 = percurso limpo)
      calculation_details = `Saltos: ${penalties} pontos de falta`;
      
      // Percentagem inversa (100% = 0 faltas)
      const max_faults = base_percentage || 50;
      percentage = Math.max(0, 100 - ((penalties / max_faults) * 100));
    }
    // Fórmula personalizada (expressão matemática)
    else if (formula.includes('base') || formula.includes('technical') || formula.includes('artistic')) {
      try {
        // Tenta avaliar a fórmula como expressão
        const formula_result = evaluateFormula(formula, {
          base: base_score,
          technical: technical_score,
          artistic: artistic_score,
          penalties: penalties,
          ...coefficients
        });
        final_score = formula_result;
        percentage = base_percentage > 0 ? (final_score / base_percentage) * 100 : 0;
        calculation_details = `Fórmula: ${formula} = ${final_score.toFixed(2)}`;
      } catch (e) {
        // Se falhar, usa base - penalties
        final_score = base_score - penalties;
        calculation_details = `Base ${base_score} - Penalizações ${penalties} (fórmula inválida)`;
      }
    }
    // Default
    else {
      final_score = base_score - penalties;
      calculation_details = `${base_score} - ${penalties}`;
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
      artistic: 50,
      penalties: 0
    });
    return true;
  } catch (e) {
    return false;
  }
}
