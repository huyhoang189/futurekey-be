const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * ========================================
 * STUDENT APIs - Đánh giá nghề nghiệp
 * ========================================
 */

/**
 * Học sinh nộp bài đánh giá nghề nghiệp
 */
const submitCareerEvaluation = async (studentId, classId, careerId, scores) => {
  // Validate: Tất cả tiêu chí phải được đánh giá
  const requiredCriteria = await prisma.class_criteria_config.findMany({
    where: {
      class_id: classId,
      career_id: careerId,
    },
    select: {
      career_criteria_id: true,
    },
  });

  const requiredIds = requiredCriteria.map((c) => c.career_criteria_id);
  const submittedIds = scores.map((s) => s.criteria_id);

  const missingIds = requiredIds.filter((id) => !submittedIds.includes(id));
  if (missingIds.length > 0) {
    throw new Error(`Missing criteria: ${missingIds.join(", ")}`);
  }

  // Validate: Điểm phải từ 0-10
  const invalidScores = scores.filter((s) => s.score < 0 || s.score > 10);
  if (invalidScores.length > 0) {
    throw new Error("All scores must be between 0 and 10");
  }

  // Lấy trọng số
  const weights = await prisma.class_criteria_weights.findMany({
    where: {
      class_id: classId,
      career_id: careerId,
    },
  });

  if (weights.length === 0) {
    throw new Error("Criteria weights not configured for this class");
  }

  // Tính điểm có trọng số
  let weightedSum = 0;
  scores.forEach((s) => {
    const weight = weights.find((w) => w.criteria_id === s.criteria_id);
    if (!weight) {
      throw new Error(`Weight not found for criteria: ${s.criteria_id}`);
    }
    weightedSum += (s.score * weight.weight) / 100;
  });

  // Tính điểm tổng = weighted_sum × số_tiêu_chí
  const criteriaCount = requiredIds.length;
  const finalScore = weightedSum * criteriaCount;
  const maxScore = criteriaCount * 10;
  const percentage = (finalScore / maxScore) * 100;

  // Lấy ngưỡng đánh giá
  const threshold = await prisma.career_evaluation_thresholds.findUnique({
    where: {
      class_id_career_id: {
        class_id: classId,
        career_id: careerId,
      },
    },
  });

  if (!threshold) {
    throw new Error("Evaluation thresholds not configured for this class");
  }

  // Xác định kết quả
  let evaluationResult;
  if (finalScore >= threshold.very_suitable_min) {
    evaluationResult = "VERY_SUITABLE";
  } else if (finalScore >= threshold.suitable_min) {
    evaluationResult = "SUITABLE";
  } else {
    evaluationResult = "NOT_SUITABLE";
  }

  // Lưu kết quả
  const result = await prisma.student_career_evaluations.upsert({
    where: {
      student_id_career_id_class_id: {
        student_id: studentId,
        career_id: careerId,
        class_id: classId,
      },
    },
    update: {
      raw_scores: scores,
      weighted_score: finalScore,
      max_score: maxScore,
      percentage,
      evaluation_result: evaluationResult,
      evaluated_at: new Date(),
      updated_at: new Date(),
    },
    create: {
      student_id: studentId,
      class_id: classId,
      career_id: careerId,
      raw_scores: scores,
      weighted_score: finalScore,
      max_score: maxScore,
      percentage,
      evaluation_result: evaluationResult,
    },
  });

  return {
    ...result,
    breakdown: {
      weighted_sum: weightedSum.toFixed(2),
      criteria_count: criteriaCount,
      final_score: finalScore.toFixed(2),
      max_score: maxScore,
      percentage: percentage.toFixed(2),
    },
  };
};

/**
 * Xem kết quả đánh giá của học sinh
 */
const getMyEvaluationResults = async (studentId, filters = {}) => {
  const { career_id, class_id } = filters;

  const where = {
    student_id: studentId,
    ...(career_id && { career_id }),
    ...(class_id && { class_id }),
  };

  const results = await prisma.student_career_evaluations.findMany({
    where,
    orderBy: {
      evaluated_at: "desc",
    },
  });

  // Thêm chi tiết điểm từng tiêu chí
  const detailedResults = await Promise.all(
    results.map(async (result) => {
      const weights = await prisma.class_criteria_weights.findMany({
        where: {
          class_id: result.class_id,
          career_id: result.career_id,
        },
      });

      const rawScores = result.raw_scores || [];
      const detailedScores = rawScores.map((score) => {
        const weight = weights.find((w) => w.criteria_id === score.criteria_id);
        const weightedScore = weight ? (score.score * weight.weight) / 100 : 0;

        return {
          criteria_id: score.criteria_id,
          raw_score: score.score,
          weight: weight?.weight,
          weighted_score: weightedScore.toFixed(2),
        };
      });

      return {
        ...result,
        detailed_scores: detailedScores,
      };
    })
  );

  return detailedResults;
};

/**
 * ========================================
 * SCHOOL/TEACHER APIs - Cấu hình
 * ========================================
 */

/**
 * Cấu hình trọng số tiêu chí cho lớp
 */
const configureCriteriaWeights = async (classId, careerId, weights, createdBy) => {
  // Validate tổng trọng số = 100%
  const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
  if (totalWeight !== 100) {
    throw new Error(`Total weight must be 100%, current: ${totalWeight}%`);
  }

  // Kiểm tra tất cả criteria_id có trong class_criteria_config không
  const configuredCriteria = await prisma.class_criteria_config.findMany({
    where: {
      class_id: classId,
      career_id: careerId,
    },
  });

  const configuredIds = configuredCriteria.map((c) => c.criteria_id);
  const weightIds = weights.map((w) => w.criteria_id);

  const missingIds = weightIds.filter((id) => !configuredIds.includes(id));
  if (missingIds.length > 0) {
    throw new Error(`Criteria not configured for class: ${missingIds.join(", ")}`);
  }

  // Xóa cấu hình cũ và tạo mới
  await prisma.$transaction(async (tx) => {
    await tx.class_criteria_weights.deleteMany({
      where: {
        class_id: classId,
        career_id: careerId,
      },
    });

    await tx.class_criteria_weights.createMany({
      data: weights.map((w) => ({
        class_id: classId,
        career_id: careerId,
        criteria_id: w.criteria_id,
        weight: w.weight,
        created_by: createdBy,
      })),
    });
  });

  return {
    message: "Criteria weights configured successfully",
    total_weight: totalWeight,
    criteria_count: weights.length,
  };
};

/**
 * Lấy cấu hình trọng số của lớp
 */
const getCriteriaWeights = async (classId, careerId) => {
  const weights = await prisma.class_criteria_weights.findMany({
    where: {
      class_id: classId,
      career_id: careerId,
    },
    orderBy: {
      weight: "desc",
    },
  });

  const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);

  return {
    class_id: classId,
    career_id: careerId,
    weights,
    total_weight: totalWeight,
    is_valid: totalWeight === 100,
  };
};

/**
 * Cấu hình ngưỡng đánh giá
 */
const configureEvaluationThresholds = async (classId, careerId, thresholds, createdBy) => {
  const { very_suitable_min, suitable_min } = thresholds;

  if (very_suitable_min <= suitable_min) {
    throw new Error("very_suitable_min must be greater than suitable_min");
  }

  // Tính max_score dựa trên số tiêu chí
  const criteriaCount = await prisma.class_criteria_config.count({
    where: {
      class_id: classId,
      career_id: careerId,
    },
  });

  const maxScore = criteriaCount * 10;

  if (very_suitable_min > maxScore || suitable_min > maxScore) {
    throw new Error(`Thresholds must not exceed max_score: ${maxScore}`);
  }

  const result = await prisma.career_evaluation_thresholds.upsert({
    where: {
      class_id_career_id: {
        class_id: classId,
        career_id: careerId,
      },
    },
    update: {
      max_score: maxScore,
      very_suitable_min,
      suitable_min,
      updated_at: new Date(),
    },
    create: {
      class_id: classId,
      career_id: careerId,
      max_score: maxScore,
      very_suitable_min,
      suitable_min,
      created_by: createdBy,
    },
  });

  return result;
};

/**
 * Lấy ngưỡng đánh giá
 */
const getEvaluationThresholds = async (classId, careerId) => {
  const threshold = await prisma.career_evaluation_thresholds.findUnique({
    where: {
      class_id_career_id: {
        class_id: classId,
        career_id: careerId,
      },
    },
  });

  return threshold;
};

/**
 * Thống kê đánh giá theo lớp/nghề (cho giáo viên xem)
 */
const getEvaluationStatistics = async (classId, careerId) => {
  const evaluations = await prisma.student_career_evaluations.findMany({
    where: {
      class_id: classId,
      career_id: careerId,
    },
  });

  const total = evaluations.length;
  const verySuitable = evaluations.filter((e) => e.evaluation_result === "VERY_SUITABLE").length;
  const suitable = evaluations.filter((e) => e.evaluation_result === "SUITABLE").length;
  const notSuitable = evaluations.filter((e) => e.evaluation_result === "NOT_SUITABLE").length;

  const avgScore =
    total > 0 ? evaluations.reduce((sum, e) => sum + e.weighted_score, 0) / total : 0;

  const avgPercentage =
    total > 0 ? evaluations.reduce((sum, e) => sum + e.percentage, 0) / total : 0;

  return {
    class_id: classId,
    career_id: careerId,
    total_evaluations: total,
    summary: {
      very_suitable: {
        count: verySuitable,
        percentage: total > 0 ? ((verySuitable / total) * 100).toFixed(2) : 0,
      },
      suitable: {
        count: suitable,
        percentage: total > 0 ? ((suitable / total) * 100).toFixed(2) : 0,
      },
      not_suitable: {
        count: notSuitable,
        percentage: total > 0 ? ((notSuitable / total) * 100).toFixed(2) : 0,
      },
    },
    average_score: avgScore.toFixed(2),
    average_percentage: avgPercentage.toFixed(2),
  };
};

module.exports = {
  // Student APIs
  submitCareerEvaluation,
  getMyEvaluationResults,
  
  // School/Teacher APIs
  configureCriteriaWeights,
  getCriteriaWeights,
  configureEvaluationThresholds,
  getEvaluationThresholds,
  getEvaluationStatistics,
};
