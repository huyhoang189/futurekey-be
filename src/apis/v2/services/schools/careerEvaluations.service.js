const prisma = require("../../../../configs/prisma");

/**
 * ========================================
 * STUDENT APIs - Đánh giá nghề nghiệp
 * ========================================
 */

/**
 * Học sinh nộp bài đánh giá nghề nghiệp
 */
const submitCareerEvaluation = async (
  classId,
  careerId,
  scores,
  studentId = null,
  userId = null
) => {
  let finalStudentId = studentId;

  // Tìm student từ userId nếu cần
  if (!finalStudentId && userId) {
    const student = await prisma.auth_impl_user_student.findFirst({
      where: { user_id: userId },
      select: { id: true },
    });
    if (!student) throw new Error("Student not found for this user");
    finalStudentId = student.id;
  }
  if (!finalStudentId)
    throw new Error("student_id or valid userId is required");

  // Các tiêu chí bắt buộc của lớp/nghề
  const requiredCriteria = await prisma.class_criteria_config.findMany({
    where: { class_id: classId, career_id: careerId },
    select: { criteria_id: true },
  });
  const requiredIds = requiredCriteria.map((c) => c.criteria_id);

  // Lấy bài chấm trước đó (nếu có) để giữ điểm cũ
  const existing = await prisma.student_career_evaluations.findUnique({
    where: {
      student_id_career_id_class_id: {
        student_id: finalStudentId,
        career_id: careerId,
        class_id: classId,
      },
    },
  });

  // Map điểm hiện tại (cũ nếu có, hoặc mặc định 0)
  const scoreMap = new Map();
  if (existing?.raw_scores?.length) {
    existing.raw_scores.forEach((s) => scoreMap.set(s.criteria_id, s.score));
  } else {
    requiredIds.forEach((id) => scoreMap.set(id, 0));
  }

  // Validate điểm nhập vào 0-100 và chỉ nhận criteria hợp lệ
  const invalidScores = scores.filter((s) => s.score < 0 || s.score > 100);
  if (invalidScores.length > 0)
    throw new Error("All scores must be between 0 and 100");

  const unknownIds = scores.filter((s) => !requiredIds.includes(s.criteria_id));
  if (unknownIds.length > 0)
    throw new Error(
      `Criteria not configured for class: ${unknownIds
        .map((i) => i.criteria_id)
        .join(", ")}`
    );

  // Ghi đè điểm cho các tiêu chí được gửi lên
  scores.forEach((s) => scoreMap.set(s.criteria_id, s.score));

  // Danh sách điểm cuối cùng (đảm bảo đủ mọi criteria)
  const mergedScores = requiredIds.map((id) => ({
    criteria_id: id,
    score: scoreMap.get(id) ?? 0,
  }));

  // Lấy trọng số
  const weights = await prisma.class_criteria_weights.findMany({
    where: { class_id: classId, career_id: careerId },
  });
  if (weights.length === 0)
    throw new Error("Criteria weights not configured for this class");

  // Tính điểm có trọng số
  let weightedSum = 0;
  mergedScores.forEach((s) => {
    const weight = weights.find((w) => w.criteria_id === s.criteria_id);
    if (!weight)
      throw new Error(`Weight not found for criteria: ${s.criteria_id}`);
    weightedSum += (s.score * weight.weight) / 100;
  });

  const criteriaCount = requiredIds.length;
  const finalScore = weightedSum * criteriaCount;
  const maxScore = criteriaCount * 100;
  const percentage = (finalScore / maxScore) * 100;

  // Ngưỡng đánh giá
  const threshold = await prisma.career_evaluation_thresholds.findUnique({
    where: { class_id_career_id: { class_id: classId, career_id: careerId } },
  });
  if (!threshold)
    throw new Error("Evaluation thresholds not configured for this class");

  let evaluationResult;
  if (finalScore >= threshold.very_suitable_min)
    evaluationResult = "VERY_SUITABLE";
  else if (finalScore >= threshold.suitable_min) evaluationResult = "SUITABLE";
  else evaluationResult = "NOT_SUITABLE";

  // Lưu
  const result = await prisma.student_career_evaluations.upsert({
    where: {
      student_id_career_id_class_id: {
        student_id: finalStudentId,
        career_id: careerId,
        class_id: classId,
      },
    },
    update: {
      raw_scores: mergedScores,
      weighted_score: finalScore,
      max_score: maxScore,
      percentage,
      evaluation_result: evaluationResult,
      evaluated_at: new Date(),
      updated_at: new Date(),
    },
    create: {
      student_id: finalStudentId,
      class_id: classId,
      career_id: careerId,
      raw_scores: mergedScores,
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
const getMyEvaluationResults = async (filters = {}) => {
  const { career_id, class_id, student_id, userId } = filters;

  let finalStudentId = student_id;

  // Nếu không truyền studentId, tìm từ userId
  if (!finalStudentId && userId) {
    const student = await prisma.auth_impl_user_student.findFirst({
      where: { user_id: userId },
      select: { id: true },
    });

    if (!student) {
      throw new Error("Student not found for this user");
    }

    finalStudentId = student.id;
  }

  if (!finalStudentId) {
    throw new Error("student_id or valid userId is required");
  }

  const where = {
    student_id: finalStudentId,
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
const configureCriteriaWeights = async (
  classId,
  careerId,
  weights,
  createdBy
) => {
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
    throw new Error(
      `Criteria not configured for class: ${missingIds.join(", ")}`
    );
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
const configureEvaluationThresholds = async (
  classId,
  careerId,
  thresholds,
  createdBy
) => {
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

  const maxScore = criteriaCount * 100;

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

// Cấu hình đồng thời tiêu chí, trọng số và ngưỡng (replace-all)
const configureCareerConfigAdvanced = async (
  classId,
  careerId,
  configList,
  thresholds,
  createdBy
) => {
  if (!classId || !careerId) {
    throw new Error("class_id and career_id are required");
  }

  if (!Array.isArray(configList) || configList.length === 0) {
    throw new Error("config_list must be a non-empty array");
  }

  if (
    !thresholds ||
    thresholds.very_suitable_min === undefined ||
    thresholds.suitable_min === undefined
  ) {
    throw new Error(
      "thresholds.very_suitable_min and thresholds.suitable_min are required"
    );
  }

  // Validate trùng lặp và tổng trọng số = 100
  const seen = new Set();
  let totalWeight = 0;
  for (const item of configList) {
    if (!item.career_criteria_id && !item.criteria_id) {
      throw new Error("career_criteria_id is required for each item");
    }
    const criteriaId = item.career_criteria_id || item.criteria_id;
    if (seen.has(criteriaId)) {
      throw new Error("Duplicate career_criteria_id in config_list");
    }
    seen.add(criteriaId);
    totalWeight += Number(item.weight || 0);
  }

  // Cho phép sai số nhỏ do số thực
  if (Math.abs(totalWeight - 100) > 0.001) {
    throw new Error(`Total weight must equal 100. Current: ${totalWeight}`);
  }

  // Kiểm tra tiêu chí thuộc nghề và đang active
  const criteriaIds = configList.map(
    (c) => c.career_criteria_id || c.criteria_id
  );
  const validCriteria = await prisma.career_criteria.findMany({
    where: {
      career_id: careerId,
      id: { in: criteriaIds },
      is_active: true,
    },
    select: { id: true },
  });
  const validIds = new Set(validCriteria.map((c) => c.id));
  const invalidIds = criteriaIds.filter((id) => !validIds.has(id));
  if (invalidIds.length > 0) {
    throw new Error(
      `Criteria not valid for this career: ${invalidIds.join(", ")}`
    );
  }

  const criteriaCount = criteriaIds.length;
  const maxScore = criteriaCount * 100;
  const { very_suitable_min, suitable_min } = thresholds;

  if (very_suitable_min <= suitable_min) {
    throw new Error("very_suitable_min must be greater than suitable_min");
  }
  // Chỉ validate ngưỡng phải > 0 và < 100 (thang điểm phần trăm)
  if (very_suitable_min <= 0 || suitable_min <= 0 || very_suitable_min > 100 || suitable_min > 100) {
    throw new Error("Thresholds must be between 0 and 100");
  }

  const now = new Date();

  const saved = await prisma.$transaction(
    async (tx) => {
      // Xóa song song để tăng tốc
      await Promise.all([
        tx.class_criteria_weights.deleteMany({
          where: { class_id: classId, career_id: careerId },
        }),
        tx.class_criteria_config.deleteMany({
          where: { class_id: classId, career_id: careerId },
        }),
      ]);

      // Tạo mới song song
      await Promise.all([
        tx.class_criteria_config.createMany({
          data: criteriaIds.map((id) => ({
            class_id: classId,
            career_id: careerId,
            criteria_id: id,
          })),
          skipDuplicates: true,
        }),
        tx.class_criteria_weights.createMany({
          data: configList.map((item) => ({
            class_id: classId,
            career_id: careerId,
            criteria_id: item.career_criteria_id || item.criteria_id,
            weight: Number(item.weight || 0),
            created_by: createdBy,
          })),
          skipDuplicates: true,
        }),
      ]);

      // Upsert threshold
      const threshold = await tx.career_evaluation_thresholds.upsert({
        where: {
          class_id_career_id: { class_id: classId, career_id: careerId },
        },
        update: {
          max_score: maxScore,
          very_suitable_min,
          suitable_min,
          updated_at: now,
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

      return threshold;
    },
    {
      maxWait: 10000, // Tăng thời gian chờ lấy kết nối lên 10s
      timeout: 30000, // Tăng timeout transaction lên 30s
      isolationLevel: "ReadCommitted", // Giảm lock contention
    }
  );

  return {
    class_id: classId,
    career_id: careerId,
    criteria_count: criteriaCount,
    total_weight: totalWeight,
    thresholds: {
      max_score: maxScore,
      very_suitable_min,
      suitable_min,
    },
    updated_threshold: saved,
  };
};

// Lấy cấu hình tiêu chí + trọng số + ngưỡng
const getCareerConfigAdvanced = async (classId, careerId) => {
  if (!classId || !careerId) {
    throw new Error("class_id and career_id are required");
  }

  const [config, weights, threshold, criteria] = await Promise.all([
    prisma.class_criteria_config.findMany({
      where: { class_id: classId, career_id: careerId },
    }),
    prisma.class_criteria_weights.findMany({
      where: { class_id: classId, career_id: careerId },
    }),
    prisma.career_evaluation_thresholds.findUnique({
      where: { class_id_career_id: { class_id: classId, career_id: careerId } },
    }),
    prisma.career_criteria.findMany({
      where: { career_id: careerId },
      select: { id: true, name: true, description: true, order_index: true },
    }),
  ]);

  const weightMap = new Map(weights.map((w) => [w.criteria_id, w.weight]));
  const criteriaMap = new Map(criteria.map((c) => [c.id, c]));

  const items = config.map((c) => ({
    criteria_id: c.criteria_id,
    weight: weightMap.get(c.criteria_id) ?? null,
    criteria: criteriaMap.get(c.criteria_id) || null,
  }));

  return {
    class_id: classId,
    career_id: careerId,
    items,
    total_weight: weights.reduce((sum, w) => sum + w.weight, 0),
    thresholds: threshold || null,
  };
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
  const verySuitable = evaluations.filter(
    (e) => e.evaluation_result === "VERY_SUITABLE"
  ).length;
  const suitable = evaluations.filter(
    (e) => e.evaluation_result === "SUITABLE"
  ).length;
  const notSuitable = evaluations.filter(
    (e) => e.evaluation_result === "NOT_SUITABLE"
  ).length;

  const avgScore =
    total > 0
      ? evaluations.reduce((sum, e) => sum + e.weighted_score, 0) / total
      : 0;

  const avgPercentage =
    total > 0
      ? evaluations.reduce((sum, e) => sum + e.percentage, 0) / total
      : 0;

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
  configureCareerConfigAdvanced,
  getCareerConfigAdvanced,
};
