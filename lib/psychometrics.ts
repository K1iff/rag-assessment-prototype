export const DEFAULT_BLEPP_WEIGHTS: Record<string, number> = {
  'Psychological Assessment': 40.0,
  'Abnormal Psychology': 20.0,
  'Industrial-Organizational Psychology': 20.0,
  'Developmental Psychology': 20.0,
};

// =========================================================================
// TYPES & INTERFACES
// =========================================================================

export type PsychometricStatus =
  | 'IDEAL'
  | 'TOO_EASY'
  | 'TOO_HARD'
  | 'FLAWED_DISCRIMINATION'
  | 'MISKEYED_SUSPECT'
  | 'ACCEPTABLE'
  | 'PENDING_DATA';

export interface DistractorMetric {
  optionText: string;
  count: number;
  selectionRate: number; // 0.00 to 1.00
  isCorrect: boolean;
  isNonFunctional: boolean; // Selected by < 5% of examinees
}

export interface ItemAnalysisResult {
  questionId: string;
  facilityIndex: number; // P-value: 0.00 to 1.00
  discriminationIndex: number; // D-value: -1.00 to 1.00
  facilityLabel: 'Very Easy' | 'Fairly Easy' | 'Moderate' | 'Difficult' | 'Below Chance / Suspect';
  discriminationLabel: 'Excellent' | 'Good' | 'Acceptable' | 'Poor' | 'Negative / Flawed';
  status: PsychometricStatus;
  statusMessage: string;
  distractors: DistractorMetric[];
}

export interface StudentAttemptScore {
  studentId: string;
  totalScore: number;
  answers: {
    questionId: string;
    selectedOption: string;
    isCorrect: boolean;
  }[];
}

export interface QuestionDefinition {
  id: string;
  subject: string;
  competency: string;
  options: string[];
  correctAnswer: string;
}

export interface TOSWeightRule {
  subject: string;
  competency?: string | null;
  weight: number; // Percentage e.g. 40.00
}

export interface SubjectBreakdown {
  totalItems: number;
  correctItems: number;
  accuracy: number; // 0 to 100%
  weightPercentage: number; // e.g. 40%
  weightedContribution: number;
}

export interface CompetencyBreakdown {
  subject: string;
  competency: string;
  totalItems: number;
  correctItems: number;
  accuracy: number; // 0 to 100%
  needsRemediation: boolean; // Flagged if < 60%
}

export interface TOSScoringResult {
  rawScore: number;
  totalItems: number;
  rawPercentage: number;
  tosWeightedScore: number; // 0.00 to 100.00%
  isProjectedPass: boolean; // Meets or exceeds 75% PRC board passing standard
  subjectBreakdown: Record<string, SubjectBreakdown>;
  competencyBreakdown: Record<string, CompetencyBreakdown>;
}

export interface BLEPPDomainMeta {
  name: string;
  shortLabel: string;
  weight: number; // e.g. 0.40
  weightPercent: number; // 40
  description: string;
  studyTip: string;
}

export interface EvaluatedItemResponse {
  questionId?: string;
  subject: string;
  competency?: string;
  isCorrect: boolean;
}

export interface StudentReadinessResult {
  compositeTOSScore: number; // 0 - 100%
  isBoardReady: boolean; // composite >= 75 and 0 core deficits < 60%
  totalEvaluatedItems: number;
  criticalDeficitCount: number;
  domains: Record<string, {
    name: string;
    shortLabel: string;
    weightPercent: number;
    accuracy: number;
    itemsCorrect: number;
    itemsTotal: number;
    status: 'Mastery' | 'Competent' | 'Critical Deficit';
    description: string;
  }>;
  radarData: {
    subject: string;
    fullSubject: string;
    score: number;
    fullMark: number;
  }[];
  weakSpots: {
    competency: string;
    subject: string;
    accuracy: number;
    missed: number;
    total: number;
    recommendation: string;
  }[];
}

// =========================================================================
// BLEPP DOMAIN METADATA & NORMALIZATION
// =========================================================================

export const BLEPP_DOMAINS: Record<string, BLEPPDomainMeta> = {
  'Psychological Assessment': {
    name: 'Psychological Assessment',
    shortLabel: 'Assessment',
    weight: 0.40,
    weightPercent: 40,
    description: 'Psychometrics, test construction, reliability/validity, ethics, and assessment interpretation.',
    studyTip: 'Prioritize variance formulas, standard error of measurement (SEM), and Kelly\'s Discrimination index.'
  },
  'Abnormal Psychology': {
    name: 'Abnormal Psychology',
    shortLabel: 'Abnormal',
    weight: 0.20,
    weightPercent: 20,
    description: 'Clinical psychopathology, DSM-5-TR diagnostic criteria, etiology, and symptomatology.',
    studyTip: 'Focus on DSM-5-TR differential diagnostic trees (e.g., Bipolar vs. Borderline, MDD vs. PDD).'
  },
  'Industrial-Organizational Psychology': {
    name: 'Industrial-Organizational Psychology',
    shortLabel: 'I/O Psych',
    weight: 0.20,
    weightPercent: 20,
    description: 'Job analysis, selection, performance appraisal, organizational dynamics, and leadership.',
    studyTip: 'Review structured interviewing techniques, validation strategies, and Kirkpatrick\'s 4 evaluation levels.'
  },
  'Developmental Psychology': {
    name: 'Developmental Psychology',
    shortLabel: 'Dev Psych',
    weight: 0.20,
    weightPercent: 20,
    description: 'Lifespan development, cognitive milestones, socio-emotional stages, and normative crises.',
    studyTip: 'Compare psychosocial (Erikson) and cognitive (Piaget) developmental markers against atypical trajectories.'
  }
};

/**
 * Normalizes input subject strings into the canonical 4 regulatory BLEPP board domains.
 */
export function normalizeBLEPPSubject(subj: string): string {
  const s = (subj || '').trim().toLowerCase();
  if (s.includes('assess')) return 'Psychological Assessment';
  if (s.includes('abnormal') || s.includes('clinical')) return 'Abnormal Psychology';
  if (s.includes('indust') || s.includes('i/o') || s.includes('organizational')) return 'Industrial-Organizational Psychology';
  if (s.includes('dev') || s.includes('personality') || s.includes('lifespan')) return 'Developmental Psychology';
  return 'Psychological Assessment';
}

// =========================================================================
// 1. CLASSICAL TEST THEORY: ITEM FACILITY & DISCRIMINATION
// =========================================================================

/**
 * Calculates Facility Index (P), Kelly's 27% Discrimination Index (D),
 * distractor efficiency, and diagnostic quality flags for a single question.
 */
export function calculateItemAnalysis(
  question: QuestionDefinition,
  allAttempts: StudentAttemptScore[]
): ItemAnalysisResult {
  const totalExaminees = allAttempts.length;

  // 1. Extract responses for this specific question
  const responses = allAttempts.map((attempt) => {
    const ans = attempt.answers.find((a) => a.questionId === question.id);
    return {
      studentId: attempt.studentId,
      totalScore: attempt.totalScore,
      selectedOption: ans?.selectedOption || '',
      isCorrect: ans ? ans.isCorrect : false,
    };
  });

  // 2. Distractor Analysis (Supports both full text and letter 'A', 'B', 'C', 'D' matching)
  const normalizedCorrectAnswer = question.correctAnswer.trim().toLowerCase();
  const distractors: DistractorMetric[] = (question.options || []).map((opt, idx) => {
    const isCorrect = opt.trim().toLowerCase() === normalizedCorrectAnswer;
    const optLetter = String.fromCharCode(65 + idx).toLowerCase(); // 'a', 'b', 'c', 'd'

    const count = responses.filter((r) => {
      const sel = (r.selectedOption || '').trim().toLowerCase();
      return (
        sel === opt.trim().toLowerCase() ||
        sel === optLetter ||
        sel === `option ${optLetter}`
      );
    }).length;

    const selectionRate = totalExaminees > 0 ? Number((count / totalExaminees).toFixed(3)) : 0;

    return {
      optionText: opt,
      count,
      selectionRate,
      isCorrect,
      isNonFunctional: totalExaminees >= 4 && !isCorrect && selectionRate < 0.05,
    };
  });

  // 3. Handle sparse or missing data (returns choices and counts even when examinees < 4)
  if (totalExaminees < 4) {
    const correctCount = responses.filter((r) => r.isCorrect).length;
    const P = totalExaminees > 0 ? Number((correctCount / totalExaminees).toFixed(3)) : 0;

    return {
      questionId: question.id,
      facilityIndex: P,
      discriminationIndex: 0,
      facilityLabel: totalExaminees === 0 ? 'Moderate' : P >= 0.7 ? 'Fairly Easy' : P >= 0.4 ? 'Moderate' : 'Difficult',
      discriminationLabel: 'Acceptable',
      status: 'PENDING_DATA',
      statusMessage: totalExaminees === 0 
        ? 'No examinee attempts recorded yet.' 
        : 'Insufficient attempt data to calculate discrimination index (min. 4 examinees required).',
      distractors,
    };
  }

  // 4. Compute Item Facility Index (P)
  const correctCount = responses.filter((r) => r.isCorrect).length;
  const P = Number((correctCount / totalExaminees).toFixed(3));

  // 5. Compute Item Discrimination Index (D) using Kelly's Upper/Lower 27% Rule
  const sorted = [...responses].sort((a, b) => b.totalScore - a.totalScore);
  const groupSize = Math.max(1, Math.round(totalExaminees * 0.27));

  const upperGroup = sorted.slice(0, groupSize);
  const lowerGroup = sorted.slice(sorted.length - groupSize);

  const upperCorrect = upperGroup.filter((r) => r.isCorrect).length;
  const lowerCorrect = lowerGroup.filter((r) => r.isCorrect).length;

  const Pu = upperCorrect / groupSize;
  const Pl = lowerCorrect / groupSize;
  const D = Number((Pu - Pl).toFixed(3));

  // 6. Psychometric Labels & Diagnostic Status
  let facilityLabel: ItemAnalysisResult['facilityLabel'] = 'Moderate';
  if (P >= 0.85) facilityLabel = 'Very Easy';
  else if (P >= 0.70) facilityLabel = 'Fairly Easy';
  else if (P >= 0.40) facilityLabel = 'Moderate';
  else if (P >= 0.25) facilityLabel = 'Difficult';
  else facilityLabel = 'Below Chance / Suspect';

  let discriminationLabel: ItemAnalysisResult['discriminationLabel'] = 'Acceptable';
  if (D >= 0.40) discriminationLabel = 'Excellent';
  else if (D >= 0.30) discriminationLabel = 'Good';
  else if (D >= 0.20) discriminationLabel = 'Acceptable';
  else if (D >= 0.00) discriminationLabel = 'Poor';
  else discriminationLabel = 'Negative / Flawed';

  let status: PsychometricStatus = 'ACCEPTABLE';
  let statusMessage = 'Item meets baseline psychometric standards.';

  if (P < 0.20 && D <= 0) {
    status = 'MISKEYED_SUSPECT';
    statusMessage = 'Below-chance accuracy and negative discrimination. High probability of an incorrect answer key or misleading phrasing.';
  } else if (D < 0.00) {
    status = 'FLAWED_DISCRIMINATION';
    statusMessage = 'Negative discrimination. Lower-scoring examinees answered correctly more frequently than top examinees. Check distractors.';
  } else if (D < 0.20) {
    status = 'FLAWED_DISCRIMINATION';
    statusMessage = 'Low discrimination capacity. The item does not adequately separate strong examinees from weak examinees.';
  } else if (P > 0.85) {
    status = 'TOO_EASY';
    statusMessage = 'Question is very easy. Provides minimal psychometric score variance.';
  } else if (P < 0.25) {
    status = 'TOO_HARD';
    statusMessage = 'High difficulty item. Check if concept requires targeted cohort remedial coverage.';
  } else if (P >= 0.40 && P <= 0.70 && D >= 0.30) {
    status = 'IDEAL';
    statusMessage = 'Optimal difficulty and discrimination zone. Maximizes test reliability.';
  }

  return {
    questionId: question.id,
    facilityIndex: P,
    discriminationIndex: D,
    facilityLabel,
    discriminationLabel,
    status,
    statusMessage,
    distractors,
  };
}

// =========================================================================
// 2. EXAM RELIABILITY: KUDER-RICHARDSON FORMULA 20 (KR-20)
// =========================================================================

/**
 * Computes KR-20 reliability coefficient for dichotomous items.
 * Measures the internal consistency of an assessment based on item variances.
 */
export function calculateKR20Reliability(
  totalQuestions: number,
  itemFacilities: number[],
  totalStudentScores: number[]
): number {
  const k = totalQuestions;
  const n = totalStudentScores.length;

  if (k <= 1 || n <= 1) return 0;

  const sumItemVariance = itemFacilities.reduce((sum, p) => sum + p * (1 - p), 0);
  const meanScore = totalStudentScores.reduce((sum, s) => sum + s, 0) / n;
  const totalScoreVariance =
    totalStudentScores.reduce((sum, s) => sum + Math.pow(s - meanScore, 2), 0) / (n - 1);

  if (totalScoreVariance <= 0) return 0;

  const kr20 = (k / (k - 1)) * (1 - sumItemVariance / totalScoreVariance);
  return Number(Math.max(0, Math.min(1, kr20)).toFixed(3));
}

// =========================================================================
// 3. TABLE OF SPECIFICATIONS (TOS) WEIGHTED SCORING
// =========================================================================

/**
 * Computes official Table of Specifications (TOS) weighted performance.
 * Accurately models the 40-20-20-20 BLEPP board exam allocation.
 */
export function calculateTOSScoring(
  questions: QuestionDefinition[],
  studentAnswers: { questionId: string; isCorrect: boolean }[],
  customTOSWeights?: TOSWeightRule[]
): TOSScoringResult {
  const totalItems = questions.length;
  let rawScore = 0;

  const subjectMap: Record<
    string,
    { total: number; correct: number; weight: number }
  > = {};

  const competencyMap: Record<
    string,
    { subject: string; total: number; correct: number }
  > = {};

  const weightLookup: Record<string, number> = {};

  if (customTOSWeights && customTOSWeights.length > 0) {
    customTOSWeights.forEach((rule) => {
      weightLookup[rule.subject] = Number(rule.weight);
    });
  } else {
    Object.entries(DEFAULT_BLEPP_WEIGHTS).forEach(([subj, weight]) => {
      weightLookup[subj] = weight;
    });
  }

  questions.forEach((q) => {
    const ans: any = studentAnswers.find(
      (a: any) => (a.questionId || a.question_id) === q.id
    );
    const isCorrect = ans ? (ans.isCorrect ?? ans.is_correct ?? false) : false;
    if (isCorrect) rawScore += 1;

    const subj = normalizeBLEPPSubject(q.subject || 'General Scope');
    if (!subjectMap[subj]) {
      const assignedWeight = weightLookup[subj] !== undefined ? weightLookup[subj] : 0;
      subjectMap[subj] = { total: 0, correct: 0, weight: assignedWeight };
    }
    subjectMap[subj].total += 1;
    if (isCorrect) subjectMap[subj].correct += 1;

    const compKey = `${subj}:::${q.competency || 'General Competency'}`;
    if (!competencyMap[compKey]) {
      competencyMap[compKey] = {
        subject: subj,
        total: 0,
        correct: 0,
      };
    }
    competencyMap[compKey].total += 1;
    if (isCorrect) competencyMap[compKey].correct += 1;
  });

  let tosWeightedScore = 0;
  let activeWeightTotal = 0;

  const subjectBreakdown: Record<string, SubjectBreakdown> = {};

  Object.entries(subjectMap).forEach(([subj, data]) => {
    const accuracy = data.total > 0 ? (data.correct / data.total) * 100 : 0;
    activeWeightTotal += data.weight;

    subjectBreakdown[subj] = {
      totalItems: data.total,
      correctItems: data.correct,
      accuracy: Number(accuracy.toFixed(2)),
      weightPercentage: data.weight,
      weightedContribution: Number(((accuracy * data.weight) / 100).toFixed(2)),
    };
  });

  if (activeWeightTotal > 0) {
    const weightedSum = Object.values(subjectBreakdown).reduce(
      (sum, s) => sum + (s.accuracy * s.weightPercentage) / 100,
      0
    );
    tosWeightedScore = Number(((weightedSum / activeWeightTotal) * 100).toFixed(2));
  } else {
    tosWeightedScore = totalItems > 0 ? Number(((rawScore / totalItems) * 100).toFixed(2)) : 0;
  }

  const competencyBreakdown: Record<string, CompetencyBreakdown> = {};

  Object.entries(competencyMap).forEach(([compKey, data]) => {
    const [, competencyName] = compKey.split(':::');
    const accuracy = data.total > 0 ? (data.correct / data.total) * 100 : 0;

    competencyBreakdown[compKey] = {
      subject: data.subject,
      competency: competencyName,
      totalItems: data.total,
      correctItems: data.correct,
      accuracy: Number(accuracy.toFixed(2)),
      needsRemediation: accuracy < 60.0,
    };
  });

  const rawPercentage = totalItems > 0 ? Number(((rawScore / totalItems) * 100).toFixed(2)) : 0;

  return {
    rawScore,
    totalItems,
    rawPercentage,
    tosWeightedScore,
    isProjectedPass: tosWeightedScore >= 75.0,
    subjectBreakdown,
    competencyBreakdown,
  };
}

// =========================================================================
// 4. STUDENT CUMULATIVE BOARD READINESS CALCULATOR
// =========================================================================

/**
 * Calculates a student's cumulative readiness across all completed mock sessions,
 * outputting domain scores, 4-axis radar data, and targeted remediation items.
 */
export function calculateStudentReadiness(
  evaluatedItems: EvaluatedItemResponse[]
): StudentReadinessResult {
  const domainCounters: Record<string, { correct: number; total: number }> = {
    'Psychological Assessment': { correct: 0, total: 0 },
    'Abnormal Psychology': { correct: 0, total: 0 },
    'Industrial-Organizational Psychology': { correct: 0, total: 0 },
    'Developmental Psychology': { correct: 0, total: 0 }
  };

  const competencyCounters: Record<string, { subject: string; correct: number; total: number }> = {};

  evaluatedItems.forEach((item) => {
    const domain = normalizeBLEPPSubject(item.subject);
    if (domainCounters[domain]) {
      domainCounters[domain].total += 1;
      if (item.isCorrect) domainCounters[domain].correct += 1;
    }

    const compName = item.competency || `${domain} Fundamentals`;
    const compKey = `${domain}:::${compName}`;
    if (!competencyCounters[compKey]) {
      competencyCounters[compKey] = { subject: domain, correct: 0, total: 0 };
    }
    competencyCounters[compKey].total += 1;
    if (item.isCorrect) competencyCounters[compKey].correct += 1;
  });

  let weightedSum = 0;
  let criticalDeficits = 0;

  const domainsResult: StudentReadinessResult['domains'] = {};

  Object.keys(BLEPP_DOMAINS).forEach((domainName) => {
    const meta = BLEPP_DOMAINS[domainName];
    const data = domainCounters[domainName];
    const accuracy = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;

    weightedSum += accuracy * meta.weight;

    let status: 'Mastery' | 'Competent' | 'Critical Deficit' = 'Competent';
    if (accuracy >= 75) {
      status = 'Mastery';
    } else if (accuracy < 60) {
      status = 'Critical Deficit';
      criticalDeficits++;
    }

    domainsResult[domainName] = {
      name: domainName,
      shortLabel: meta.shortLabel,
      weightPercent: meta.weightPercent,
      accuracy,
      itemsCorrect: data.correct,
      itemsTotal: data.total,
      status,
      description: meta.description
    };
  });

  const compositeTOSScore = Math.round(weightedSum * 10) / 10;
  const isBoardReady = compositeTOSScore >= 75.0 && criticalDeficits === 0 && evaluatedItems.length > 0;

  const radarData = [
    { subject: 'Psych Assessment', fullSubject: 'Psychological Assessment', score: domainsResult['Psychological Assessment'].accuracy, fullMark: 100 },
    { subject: 'Abnormal Psych', fullSubject: 'Abnormal Psychology', score: domainsResult['Abnormal Psychology'].accuracy, fullMark: 100 },
    { subject: 'I/O Psych', fullSubject: 'Industrial-Organizational Psychology', score: domainsResult['Industrial-Organizational Psychology'].accuracy, fullMark: 100 },
    { subject: 'Dev Psych', fullSubject: 'Developmental Psychology', score: domainsResult['Developmental Psychology'].accuracy, fullMark: 100 },
  ];

  const weakSpots: StudentReadinessResult['weakSpots'] = Object.entries(competencyCounters)
    .map(([compKey, data]) => {
      const [, competency] = compKey.split(':::');
      const accuracy = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
      const missed = data.total - data.correct;
      const meta = BLEPP_DOMAINS[data.subject];

      return {
        competency,
        subject: data.subject,
        accuracy,
        missed,
        total: data.total,
        recommendation: meta ? meta.studyTip : 'Review foundational textbook chapters and clinical vignettes.'
      };
    })
    .filter((w) => w.accuracy < 75 && w.missed > 0)
    .sort((a, b) => a.accuracy - b.accuracy || b.missed - a.missed)
    .slice(0, 4);

  return {
    compositeTOSScore,
    isBoardReady,
    totalEvaluatedItems: evaluatedItems.length,
    criticalDeficitCount: criticalDeficits,
    domains: domainsResult,
    radarData,
    weakSpots
  };
}

// =========================================================================
// 5. COHORT REMEDIATION & WEAK-SPOT IDENTIFIER
// =========================================================================

export interface CohortWeakSpot {
  subject: string;
  competency: string;
  totalAttempts: number;
  accuracy: number; // 0 to 100%
  recommendedAction: string;
}

/**
 * Aggregates all student attempts across a cohort to extract the top weakest
 * competencies, generating an agenda for remedial coaching sessions.
 */
export function identifyCohortWeakSpots(
  questions: QuestionDefinition[],
  allAttempts: StudentAttemptScore[],
  limit: number = 3
): CohortWeakSpot[] {
  const aggregated: Record<
    string,
    { subject: string; competency: string; totalAnswered: number; totalCorrect: number }
  > = {};

  questions.forEach((q) => {
    const compKey = `${q.subject}:::${q.competency || 'General Competency'}`;
    if (!aggregated[compKey]) {
      aggregated[compKey] = {
        subject: q.subject,
        competency: q.competency || 'General Competency',
        totalAnswered: 0,
        totalCorrect: 0,
      };
    }

    allAttempts.forEach((attempt) => {
      const ans = attempt.answers.find((a) => a.questionId === q.id);
      if (ans) {
        aggregated[compKey].totalAnswered += 1;
        if (ans.isCorrect) aggregated[compKey].totalCorrect += 1;
      }
    });
  });

  const list: CohortWeakSpot[] = Object.values(aggregated)
    .filter((entry) => entry.totalAnswered > 0)
    .map((entry) => {
      const accuracy = Number(((entry.totalCorrect / entry.totalAnswered) * 100).toFixed(1));
      let recommendedAction = 'Maintain review cycle.';

      if (accuracy < 40) {
        recommendedAction = 'Critical deficit: Mandatory remedial lecture and textbook reread required.';
      } else if (accuracy < 60) {
        recommendedAction = 'Moderate deficit: Target during final coaching drills.';
      }

      return {
        subject: entry.subject,
        competency: entry.competency,
        totalAttempts: entry.totalAnswered,
        accuracy,
        recommendedAction,
      };
    })
    .sort((a, b) => a.accuracy - b.accuracy);

  return list.slice(0, limit);
}