const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Thống kê nghề nghiệp của học sinh
 * Trả về danh sách các career đang học và tiến độ học tập
 */
const getStudentCareerStatistics = async (student_id) => {
  // Lấy danh sách tiến độ học tập của học sinh
  const progresses = await prisma.student_learn_progress.findMany({
    where: { student_id },
    orderBy: {
      updated_at: "desc",
    },
  });

  if (progresses.length === 0) {
    return {
      student_id,
      total_careers: 0,
      statistics: [],
    };
  }

  // Lấy unique career_id và criteria_id
  const careerIds = [...new Set(progresses.map(p => p.career_id))];
  const criteriaIds = [...new Set(progresses.map(p => p.criteria_id))];

  // Fetch career và criteria info
  const [careers, criterias] = await Promise.all([
    prisma.career.findMany({
      where: { id: { in: careerIds } },
      select: {
        id: true,
        code: true,
        name: true,
        tags: true,
      },
    }),
    prisma.career_criteria.findMany({
      where: { id: { in: criteriaIds } },
      select: {
        id: true,
        name: true,
        order_index: true,
      },
    }),
  ]);

  // Tạo map để lookup nhanh
  const careerMap = {};
  careers.forEach(career => {
    careerMap[career.id] = career;
  });

  const criteriaMap = {};
  criterias.forEach(criteria => {
    criteriaMap[criteria.id] = criteria;
  });

  // Nhóm theo career_id và tính tổng tiến độ
  const careerStats = {};
  
  progresses.forEach((progress) => {
    const career_id = progress.career_id;
    
    if (!careerStats[career_id]) {
      const careerInfo = careerMap[career_id] || {};
      careerStats[career_id] = {
        career_id,
        career_code: careerInfo.code,
        career_name: careerInfo.name,
        career_tags: careerInfo.tags,
        total_criteria: 0,
        completed_criteria: 0,
        in_progress_criteria: 0,
        not_started_criteria: 0,
        average_progress: 0,
        criteria_details: [],
      };
    }

    const criteriaInfo = criteriaMap[progress.criteria_id] || {};

    careerStats[career_id].total_criteria++;
    careerStats[career_id].criteria_details.push({
      criteria_id: progress.criteria_id,
      criteria_name: criteriaInfo.name,
      criteria_order_index: criteriaInfo.order_index,
      progress_percent: progress.progress_percent || 0,
      last_watched_position: progress.last_watched_positon,
      status: progress.status,
      last_updated: progress.updated_at,
    });

    // Đếm theo trạng thái
    if (progress.status === "COMPLETED") {
      careerStats[career_id].completed_criteria++;
    } else if (progress.status === "WATCHING" || progress.status === "PAUSED" || progress.status === "SEEK_ATTEMPT") {
      careerStats[career_id].in_progress_criteria++;
    } else {
      careerStats[career_id].not_started_criteria++;
    }
  });

  // Tính average_progress cho mỗi career
  Object.values(careerStats).forEach((career) => {
    if (career.total_criteria > 0) {
      const totalProgress = career.criteria_details.reduce(
        (sum, criteria) => sum + (criteria.progress_percent || 0),
        0
      );
      career.average_progress = parseFloat(
        (totalProgress / career.total_criteria).toFixed(2)
      );
    }
  });

  // Convert object to array và sort theo average_progress
  const result = Object.values(careerStats).sort(
    (a, b) => b.average_progress - a.average_progress
  );

  return {
    student_id,
    total_careers: result.length,
    statistics: result,
  };
};

/**
 * Thống kê đánh giá nghề nghiệp của học sinh
 * Trả về danh sách các career đã đánh giá, tiêu chí và kết quả
 */
const getStudentCareerEvaluations = async (student_id) => {
  // Lấy danh sách đánh giá của học sinh
  const evaluations = await prisma.student_career_evaluations.findMany({
    where: { student_id },
    orderBy: {
      evaluated_at: "desc",
    },
  });

  if (evaluations.length === 0) {
    return {
      student_id,
      total_evaluations: 0,
      evaluations: [],
    };
  }

  // Lấy unique career_id và class_id
  const careerIds = [...new Set(evaluations.map(e => e.career_id))];
  const classIds = [...new Set(evaluations.map(e => e.class_id))];

  // Fetch career và class info
  const [careers, classes] = await Promise.all([
    prisma.career.findMany({
      where: { id: { in: careerIds } },
      select: {
        id: true,
        code: true,
        name: true,
      },
    }),
    prisma.classes.findMany({
      where: { id: { in: classIds } },
      select: {
        id: true,
        name: true,
      },
    }),
  ]);

  // Tạo map để lookup nhanh
  const careerMap = {};
  careers.forEach(career => {
    careerMap[career.id] = career;
  });

  const classMap = {};
  classes.forEach(cls => {
    classMap[cls.id] = cls;
  });

  // Lấy tất cả criteria_id từ raw_scores
  const allCriteriaIds = new Set();
  evaluations.forEach(evaluation => {
    if (Array.isArray(evaluation.raw_scores)) {
      evaluation.raw_scores.forEach(score => {
        if (score.criteria_id) {
          allCriteriaIds.add(score.criteria_id);
        }
      });
    }
  });

  // Fetch criteria info
  const criterias = await prisma.career_criteria.findMany({
    where: { id: { in: Array.from(allCriteriaIds) } },
    select: {
      id: true,
      name: true,
      order_index: true,
    },
  });

  const criteriaMap = {};
  criterias.forEach(criteria => {
    criteriaMap[criteria.id] = criteria;
  });

  // Format kết quả
  const result = evaluations.map(evaluation => {
    const careerInfo = careerMap[evaluation.career_id] || {};
    const classInfo = classMap[evaluation.class_id] || {};

    // Parse raw_scores và thêm thông tin criteria
    const criteriaScores = [];
    if (Array.isArray(evaluation.raw_scores)) {
      evaluation.raw_scores.forEach(score => {
        const criteriaInfo = criteriaMap[score.criteria_id] || {};
        criteriaScores.push({
          criteria_id: score.criteria_id,
          criteria_name: criteriaInfo.name,
          criteria_order_index: criteriaInfo.order_index,
          score: score.score,
        });
      });
    }

    // Sort theo order_index
    criteriaScores.sort((a, b) => (a.criteria_order_index || 0) - (b.criteria_order_index || 0));

    return {
      evaluation_id: evaluation.id,
      career_id: evaluation.career_id,
      career_code: careerInfo.code,
      career_name: careerInfo.name,
      class_id: evaluation.class_id,
      class_name: classInfo.name,
      criteria_scores: criteriaScores,
      total_criteria: criteriaScores.length,
      weighted_score: evaluation.weighted_score,
      max_score: evaluation.max_score,
      percentage: evaluation.percentage,
      evaluation_result: evaluation.evaluation_result,
      notes: evaluation.notes,
      evaluated_at: evaluation.evaluated_at,
    };
  });

  return {
    student_id,
    total_evaluations: result.length,
    evaluations: result,
  };
};

/**
 * Thống kê tổng quan theo lớp
 * Trả về số lượng học sinh, phân bổ giới tính, số nghề được giao học
 */
const getClassOverviewStatistics = async (class_id) => {
  // 1. Lấy thông tin lớp
  const classInfo = await prisma.classes.findUnique({
    where: { id: class_id },
    select: { id: true, name: true },
  });

  // 2. Đếm tổng số học sinh trong lớp
  const totalStudents = await prisma.auth_impl_user_student.count({
    where: { class_id },
  });

  // 3. Phân bổ giới tính
  const students = await prisma.auth_impl_user_student.findMany({
    where: { class_id },
    select: { sex: true },
  });

  const genderDistribution = {
    male: students.filter(s => s.sex === 'MALE').length,
    female: students.filter(s => s.sex === 'FEMALE').length,
    other: students.filter(s => !s.sex || (s.sex !== 'MALE' && s.sex !== 'FEMALE')).length,
  };

  // 4. Số nghề được giao học (unique career_id trong class_criteria_config)
  const assignedCareers = await prisma.class_criteria_config.findMany({
    where: { class_id },
    select: { career_id: true },
    distinct: ['career_id'],
  });

  const uniqueCareerIds = [...new Set(assignedCareers.map(c => c.career_id))];
  
  // Lấy thông tin chi tiết các nghề
  const careers = await prisma.career.findMany({
    where: { id: { in: uniqueCareerIds } },
    select: {
      id: true,
      code: true,
      name: true,
    },
  });

  return {
    class_id,
    class_name: classInfo?.name || null,
    total_students: totalStudents,
    gender_distribution: {
      male: genderDistribution.male,
      female: genderDistribution.female,
      other: genderDistribution.other,
    },
    assigned_careers: {
      total: careers.length,
      careers: careers,
    },
  };
};

/**
 * Thống kê danh sách nghề của lớp và tiến độ trung bình
 */
const getClassCareerProgress = async (class_id) => {
  // 1. Lấy thông tin lớp
  const classInfo = await prisma.classes.findUnique({
    where: { id: class_id },
    select: { id: true, name: true },
  });

  // 2. Lấy danh sách nghề được giao cho lớp
  const assignedCareers = await prisma.class_criteria_config.findMany({
    where: { class_id },
    select: { career_id: true, criteria_id: true },
  });

  const uniqueCareerIds = [...new Set(assignedCareers.map(c => c.career_id))];

  if (uniqueCareerIds.length === 0) {
    return {
      class_id,
      class_name: classInfo?.name || null,
      total_careers: 0,
      careers_progress: [],
    };
  }

  // 3. Lấy thông tin chi tiết các nghề
  const careers = await prisma.career.findMany({
    where: { id: { in: uniqueCareerIds } },
    select: {
      id: true,
      code: true,
      name: true,
      description: true,
    },
  });

  const careerMap = {};
  careers.forEach(career => {
    careerMap[career.id] = career;
  });

  // 4. Đếm số tiêu chí mỗi nghề
  const criteriaCounts = {};
  assignedCareers.forEach(ac => {
    if (!criteriaCounts[ac.career_id]) {
      criteriaCounts[ac.career_id] = 0;
    }
    criteriaCounts[ac.career_id]++;
  });

  // 5. Lấy tiến độ học tập của học sinh trong lớp
  const students = await prisma.auth_impl_user_student.findMany({
    where: { class_id },
    select: { id: true },
  });

  const studentIds = students.map(s => s.id);

  const progresses = await prisma.student_learn_progress.findMany({
    where: {
      student_id: { in: studentIds },
      career_id: { in: uniqueCareerIds },
    },
    select: {
      student_id: true,
      career_id: true,
      criteria_id: true,
      progress_percent: true,
      status: true,
    },
  });

  // 6. Tính toán thống kê cho từng nghề
  const careersProgress = uniqueCareerIds.map(careerId => {
    const careerInfo = careerMap[careerId] || {};
    const totalCriteria = criteriaCounts[careerId] || 0;

    // Lọc progress của nghề này
    const careerProgresses = progresses.filter(p => p.career_id === careerId);

    // Đếm số học sinh đang học (unique student_id)
    const studentsEnrolled = [...new Set(careerProgresses.map(p => p.student_id))].length;

    // Tính average progress
    let totalProgress = 0;
    let progressCount = 0;
    let completed = new Set();
    let inProgress = new Set();
    let notStarted = 0;

    careerProgresses.forEach(p => {
      totalProgress += p.progress_percent || 0;
      progressCount++;

      if (p.status === 'COMPLETED' || p.progress_percent === 100) {
        completed.add(p.student_id);
      } else if (p.status === 'WATCHING' || p.status === 'PAUSED' || p.status === 'SEEK_ATTEMPT') {
        if (!completed.has(p.student_id)) {
          inProgress.add(p.student_id);
        }
      }
    });

    const averageProgress = progressCount > 0 ? (totalProgress / progressCount) : 0;

    // Học sinh chưa bắt đầu = tổng học sinh trong lớp - học sinh đang học
    notStarted = students.length - studentsEnrolled;

    return {
      career_id: careerId,
      career_code: careerInfo.code,
      career_name: careerInfo.name,
      career_description: careerInfo.description,
      total_criteria: totalCriteria,
      students_enrolled: studentsEnrolled,
      average_progress: parseFloat(averageProgress.toFixed(2)),
      completion_stats: {
        completed: completed.size,
        in_progress: inProgress.size,
        not_started: notStarted,
      },
    };
  });

  // Sort theo average_progress giảm dần
  careersProgress.sort((a, b) => b.average_progress - a.average_progress);

  return {
    class_id,
    class_name: classInfo?.name || null,
    total_careers: careersProgress.length,
    careers_progress: careersProgress,
  };
};

/**
 * Thống kê kết quả đánh giá nghề nghiệp trung bình của lớp
 */
const getClassCareerEvaluations = async (class_id) => {
  // 1. Lấy thông tin lớp
  const classInfo = await prisma.classes.findUnique({
    where: { id: class_id },
    select: { id: true, name: true },
  });

  // 2. Đếm tổng số học sinh trong lớp
  const totalStudents = await prisma.auth_impl_user_student.count({
    where: { class_id },
  });

  // 3. Lấy danh sách nghề được giao cho lớp
  const assignedCareers = await prisma.class_criteria_config.findMany({
    where: { class_id },
    select: { career_id: true, criteria_id: true },
    distinct: ['career_id'],
  });

  const uniqueCareerIds = [...new Set(assignedCareers.map(c => c.career_id))];

  if (uniqueCareerIds.length === 0) {
    return {
      class_id,
      class_name: classInfo?.name || null,
      total_students: totalStudents,
      total_evaluated_students: 0,
      careers_evaluation_summary: [],
    };
  }

  // 4. Lấy danh sách học sinh trong lớp
  const students = await prisma.auth_impl_user_student.findMany({
    where: { class_id },
    select: { id: true },
  });

  const studentIds = students.map(s => s.id);

  // 5. Lấy tất cả đánh giá của học sinh trong lớp
  const evaluations = await prisma.student_career_evaluations.findMany({
    where: {
      student_id: { in: studentIds },
      career_id: { in: uniqueCareerIds },
      class_id: class_id,
    },
    select: {
      student_id: true,
      career_id: true,
      weighted_score: true,
      max_score: true,
      percentage: true,
      evaluation_result: true,
      raw_scores: true,
    },
  });

  // Đếm số học sinh đã đánh giá (unique student_id)
  const evaluatedStudentIds = [...new Set(evaluations.map(e => e.student_id))];

  // 6. Lấy thông tin chi tiết các nghề
  const careers = await prisma.career.findMany({
    where: { id: { in: uniqueCareerIds } },
    select: {
      id: true,
      code: true,
      name: true,
      description: true,
    },
  });

  const careerMap = {};
  careers.forEach(career => {
    careerMap[career.id] = career;
  });

  // 7. Lấy tất cả criteria_id từ raw_scores để fetch criteria info
  const allCriteriaIds = new Set();
  evaluations.forEach(evaluation => {
    if (Array.isArray(evaluation.raw_scores)) {
      evaluation.raw_scores.forEach(score => {
        if (score.criteria_id) {
          allCriteriaIds.add(score.criteria_id);
        }
      });
    }
  });

  const criterias = await prisma.career_criteria.findMany({
    where: { id: { in: Array.from(allCriteriaIds) } },
    select: {
      id: true,
      name: true,
      order_index: true,
    },
  });

  const criteriaMap = {};
  criterias.forEach(criteria => {
    criteriaMap[criteria.id] = criteria;
  });

  // 8. Tính toán thống kê cho từng nghề
  const careersSummary = uniqueCareerIds.map(careerId => {
    const careerInfo = careerMap[careerId] || {};

    // Lọc evaluations của nghề này
    const careerEvaluations = evaluations.filter(e => e.career_id === careerId);

    if (careerEvaluations.length === 0) {
      return {
        career_id: careerId,
        career_code: careerInfo.code,
        career_name: careerInfo.name,
        career_description: careerInfo.description,
        total_evaluations: 0,
        average_weighted_score: 0,
        average_max_score: 0,
        average_percentage: 0,
        evaluation_distribution: {
          very_suitable: 0,
          suitable: 0,
          not_suitable: 0,
          not_evaluated: totalStudents,
        },
        criteria_scores: [],
      };
    }

    // Tính điểm trung bình
    const totalWeightedScore = careerEvaluations.reduce((sum, e) => sum + (e.weighted_score || 0), 0);
    const totalMaxScore = careerEvaluations.reduce((sum, e) => sum + (e.max_score || 0), 0);
    const totalPercentage = careerEvaluations.reduce((sum, e) => sum + (e.percentage || 0), 0);

    const avgWeightedScore = careerEvaluations.length > 0 ? totalWeightedScore / careerEvaluations.length : 0;
    const avgMaxScore = careerEvaluations.length > 0 ? totalMaxScore / careerEvaluations.length : 0;
    const avgPercentage = careerEvaluations.length > 0 ? totalPercentage / careerEvaluations.length : 0;

    // Phân loại theo evaluation_result
    const distribution = {
      very_suitable: careerEvaluations.filter(e => e.evaluation_result === 'VERY_SUITABLE').length,
      suitable: careerEvaluations.filter(e => e.evaluation_result === 'SUITABLE').length,
      not_suitable: careerEvaluations.filter(e => e.evaluation_result === 'NOT_SUITABLE').length,
      not_evaluated: totalStudents - careerEvaluations.length,
    };

    // Tính điểm trung bình cho từng tiêu chí
    const criteriaScoresMap = {};

    careerEvaluations.forEach(evaluation => {
      if (Array.isArray(evaluation.raw_scores)) {
        evaluation.raw_scores.forEach(score => {
          if (!criteriaScoresMap[score.criteria_id]) {
            criteriaScoresMap[score.criteria_id] = {
              total: 0,
              count: 0,
              min: score.score,
              max: score.score,
            };
          }
          criteriaScoresMap[score.criteria_id].total += score.score || 0;
          criteriaScoresMap[score.criteria_id].count++;
          criteriaScoresMap[score.criteria_id].min = Math.min(
            criteriaScoresMap[score.criteria_id].min,
            score.score || 0
          );
          criteriaScoresMap[score.criteria_id].max = Math.max(
            criteriaScoresMap[score.criteria_id].max,
            score.score || 0
          );
        });
      }
    });

    // Format criteria scores
    const criteriaScores = Object.keys(criteriaScoresMap).map(criteriaId => {
      const criteriaInfo = criteriaMap[criteriaId] || {};
      const stats = criteriaScoresMap[criteriaId];
      return {
        criteria_id: criteriaId,
        criteria_name: criteriaInfo.name,
        criteria_order_index: criteriaInfo.order_index,
        average_score: parseFloat((stats.total / stats.count).toFixed(2)),
        min_score: stats.min,
        max_score: stats.max,
      };
    });

    // Sort theo order_index
    criteriaScores.sort((a, b) => (a.criteria_order_index || 0) - (b.criteria_order_index || 0));

    return {
      career_id: careerId,
      career_code: careerInfo.code,
      career_name: careerInfo.name,
      career_description: careerInfo.description,
      total_evaluations: careerEvaluations.length,
      average_weighted_score: parseFloat(avgWeightedScore.toFixed(2)),
      average_max_score: parseFloat(avgMaxScore.toFixed(2)),
      average_percentage: parseFloat(avgPercentage.toFixed(2)),
      evaluation_distribution: distribution,
      criteria_scores: criteriaScores,
    };
  });

  // Sort theo average_percentage giảm dần
  careersSummary.sort((a, b) => b.average_percentage - a.average_percentage);

  return {
    class_id,
    class_name: classInfo?.name || null,
    total_students: totalStudents,
    total_evaluated_students: evaluatedStudentIds.length,
    careers_evaluation_summary: careersSummary,
  };
};

/**
 * Thống kê top học sinh theo tiến độ hoàn thành (Overall)
 */
const getClassTopStudents = async (class_id, limit = 10) => {
  // 1. Lấy thông tin lớp
  const classInfo = await prisma.classes.findUnique({
    where: { id: class_id },
    select: { id: true, name: true },
  });

  // 2. Lấy danh sách nghề được giao cho lớp
  const assignedCareers = await prisma.class_criteria_config.findMany({
    where: { class_id },
    select: { career_id: true, criteria_id: true },
  });

  const uniqueCareerIds = [...new Set(assignedCareers.map(c => c.career_id))];
  const totalCareersAssigned = uniqueCareerIds.length;

  if (uniqueCareerIds.length === 0) {
    return {
      class_id,
      class_name: classInfo?.name || null,
      total_students: 0,
      ranking_type: "overall",
      top_students: [],
    };
  }

  // 3. Lấy tất cả học sinh trong lớp
  const students = await prisma.auth_impl_user_student.findMany({
    where: { class_id },
    select: {
      id: true,
      user_id: true,
      student_code: true,
      sex: true,
    },
  });

  const totalStudents = students.length;

  // Lấy thông tin user (tên)
  const userIds = [...new Set(students.map(s => s.user_id).filter(Boolean))];
  const users = await prisma.auth_base_user.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true,
      full_name: true,
    },
  });

  const userMap = {};
  users.forEach(user => {
    userMap[user.id] = user;
  });

  const studentMap = {};
  students.forEach(student => {
    const userInfo = userMap[student.user_id] || {};
    studentMap[student.id] = {
      ...student,
      full_name: userInfo.full_name,
    };
  });

  const studentIds = students.map(s => s.id);

  // 4. Lấy tất cả tiến độ của học sinh trong lớp
  const progresses = await prisma.student_learn_progress.findMany({
    where: {
      student_id: { in: studentIds },
      career_id: { in: uniqueCareerIds },
    },
    select: {
      student_id: true,
      career_id: true,
      criteria_id: true,
      progress_percent: true,
      status: true,
      updated_at: true,
    },
  });

  // 5. Lấy thông tin chi tiết các nghề
  const careers = await prisma.career.findMany({
    where: { id: { in: uniqueCareerIds } },
    select: {
      id: true,
      code: true,
      name: true,
    },
  });

  const careerMap = {};
  careers.forEach(career => {
    careerMap[career.id] = career;
  });

  // 6. Đếm số tiêu chí mỗi nghề
  const criteriaCounts = {};
  assignedCareers.forEach(ac => {
    if (!criteriaCounts[ac.career_id]) {
      criteriaCounts[ac.career_id] = 0;
    }
    criteriaCounts[ac.career_id]++;
  });

  // 7. Tính toán thống kê cho từng học sinh
  const studentStats = studentIds.map(studentId => {
    const studentInfo = studentMap[studentId] || {};
    const studentProgresses = progresses.filter(p => p.student_id === studentId);

    // Nhóm theo career
    const careerProgress = {};
    let totalCriteriaCompleted = 0;
    let totalCriteriaAssigned = 0;
    let totalProgressSum = 0;
    let careersCompleted = 0;
    let careersInProgress = 0;

    uniqueCareerIds.forEach(careerId => {
      const careerInfo = careerMap[careerId] || {};
      const totalCriteria = criteriaCounts[careerId] || 0;
      totalCriteriaAssigned += totalCriteria;

      const careerProgs = studentProgresses.filter(p => p.career_id === careerId);
      
      // Tạo map progress theo criteria_id
      const progressMap = {};
      careerProgs.forEach(p => {
        progressMap[p.criteria_id] = p;
      });

      let completedCriteria = 0;
      let progressSum = 0;

      // Lấy danh sách criteria_id của nghề này
      const careerId_criteriaIds = assignedCareers
        .filter(ac => ac.career_id === careerId)
        .map(ac => ac.criteria_id);

      // Tính progress cho TẤT CẢ tiêu chí được giao (kể cả chưa học)
      careerId_criteriaIds.forEach(criteriaId => {
        const prog = progressMap[criteriaId];
        const progressPercent = prog?.progress_percent || 0;
        
        progressSum += progressPercent;
        totalProgressSum += progressPercent;

        if (prog && (prog.status === 'COMPLETED' || progressPercent === 100)) {
          completedCriteria++;
          totalCriteriaCompleted++;
        }
      });

      const careerAvgProgress = careerId_criteriaIds.length > 0 
        ? (progressSum / careerId_criteriaIds.length) 
        : 0;
      
      const hasProgress = careerProgs.length > 0;
      const isCompleted = completedCriteria === totalCriteria && totalCriteria > 0;
      const isInProgress = hasProgress && !isCompleted;

      if (isCompleted) careersCompleted++;
      if (isInProgress) careersInProgress++;

      careerProgress[careerId] = {
        career_id: careerId,
        career_code: careerInfo.code,
        career_name: careerInfo.name,
        progress: parseFloat(careerAvgProgress.toFixed(2)),
        completed_criteria: completedCriteria,
        total_criteria: totalCriteria,
        status: isCompleted ? 'COMPLETED' : (isInProgress ? 'IN_PROGRESS' : 'NOT_STARTED'),
      };
    });

    // Tính overall progress = tổng progress / tổng tiêu chí được giao
    const overallProgress = totalCriteriaAssigned > 0 
      ? (totalProgressSum / totalCriteriaAssigned) 
      : 0;

    return {
      student_id: studentId,
      student_code: studentInfo.student_code,
      student_name: studentInfo.full_name,
      student_avatar: null,
      gender: studentInfo.sex,
      overall_progress: parseFloat(overallProgress.toFixed(2)),
      total_criteria_completed: totalCriteriaCompleted,
      total_criteria_assigned: totalCriteriaAssigned,
      careers_completed: careersCompleted,
      careers_in_progress: careersInProgress,
      total_careers_assigned: totalCareersAssigned,
      breakdown: Object.values(careerProgress),
    };
  });

  // 8. Sắp xếp theo:
  // 1. Số tiêu chí hoàn thành (giảm dần)
  // 2. Overall progress (giảm dần)
  // 3. Số nghề hoàn thành (giảm dần)
  studentStats.sort((a, b) => {
    if (b.total_criteria_completed !== a.total_criteria_completed) {
      return b.total_criteria_completed - a.total_criteria_completed;
    }
    if (b.overall_progress !== a.overall_progress) {
      return b.overall_progress - a.overall_progress;
    }
    return b.careers_completed - a.careers_completed;
  });

  // 9. Thêm rank và lấy top N
  const topStudents = studentStats.slice(0, limit).map((student, index) => ({
    rank: index + 1,
    ...student,
  }));

  return {
    class_id,
    class_name: classInfo?.name || null,
    total_students: totalStudents,
    ranking_type: "overall",
    ranking_criteria: "criteria_completed_first",
    top_students: topStudents,
  };
};

/**
 * Thống kê % trung bình hoàn thành học tập nghề của lớp
 */
const getClassOverallCompletion = async (class_id) => {
  // 1. Lấy thông tin lớp
  const classInfo = await prisma.classes.findUnique({
    where: { id: class_id },
    select: { id: true, name: true },
  });

  // 2. Đếm tổng số học sinh trong lớp
  const totalStudents = await prisma.auth_impl_user_student.count({
    where: { class_id },
  });

  // 3. Lấy danh sách nghề được giao cho lớp
  const assignedCareers = await prisma.class_criteria_config.findMany({
    where: { class_id },
    select: { career_id: true, criteria_id: true },
  });

  const uniqueCareerIds = [...new Set(assignedCareers.map(c => c.career_id))];
  const totalCriteriaAssigned = assignedCareers.length;

  if (uniqueCareerIds.length === 0 || totalStudents === 0) {
    return {
      class_id,
      class_name: classInfo?.name || null,
      total_students: totalStudents,
      total_careers_assigned: 0,
      total_criteria_assigned: 0,
      overall_completion_percentage: 0,
      average_progress_percentage: 0,
      total_criteria_completed: 0,
      completion_rate: 0,
      careers_detail: [],
    };
  }

  // 4. Lấy thông tin chi tiết các nghề
  const careers = await prisma.career.findMany({
    where: { id: { in: uniqueCareerIds } },
    select: {
      id: true,
      code: true,
      name: true,
    },
  });

  const careerMap = {};
  careers.forEach(career => {
    careerMap[career.id] = career;
  });

  // 5. Đếm số tiêu chí mỗi nghề
  const criteriaCounts = {};
  assignedCareers.forEach(ac => {
    if (!criteriaCounts[ac.career_id]) {
      criteriaCounts[ac.career_id] = 0;
    }
    criteriaCounts[ac.career_id]++;
  });

  // 6. Lấy tất cả học sinh trong lớp
  const students = await prisma.auth_impl_user_student.findMany({
    where: { class_id },
    select: { id: true },
  });

  const studentIds = students.map(s => s.id);

  // 7. Lấy tất cả tiến độ của học sinh trong lớp
  const progresses = await prisma.student_learn_progress.findMany({
    where: {
      student_id: { in: studentIds },
      career_id: { in: uniqueCareerIds },
    },
    select: {
      student_id: true,
      career_id: true,
      criteria_id: true,
      progress_percent: true,
      status: true,
    },
  });

  // 8. Tạo map progress
  const progressMap = {};
  progresses.forEach(p => {
    const key = `${p.student_id}_${p.criteria_id}`;
    progressMap[key] = p;
  });

  // 9. Tính tổng hợp cho toàn lớp
  let totalProgressSum = 0;
  let totalCriteriaCompleted = 0;
  const totalPossibleProgress = totalStudents * totalCriteriaAssigned;

  // Tính tổng hợp cho từng nghề
  const careersDetail = uniqueCareerIds.map(careerId => {
    const careerInfo = careerMap[careerId] || {};
    const careerCriteriaCount = criteriaCounts[careerId] || 0;
    const careerCriteriaIds = assignedCareers
      .filter(ac => ac.career_id === careerId)
      .map(ac => ac.criteria_id);

    let careerProgressSum = 0;
    let careerCriteriaCompleted = 0;
    const careerTotalPossible = totalStudents * careerCriteriaCount;

    // Duyệt qua từng học sinh và từng tiêu chí của nghề này
    studentIds.forEach(studentId => {
      careerCriteriaIds.forEach(criteriaId => {
        const key = `${studentId}_${criteriaId}`;
        const prog = progressMap[key];
        
        const progressPercent = prog?.progress_percent || 0;
        careerProgressSum += progressPercent;
        totalProgressSum += progressPercent;

        if (prog && (prog.status === 'COMPLETED' || progressPercent === 100)) {
          careerCriteriaCompleted++;
          totalCriteriaCompleted++;
        }
      });
    });

    const careerAverageProgress = careerTotalPossible > 0 
      ? (careerProgressSum / careerTotalPossible) 
      : 0;

    const careerCompletionPercentage = careerTotalPossible > 0
      ? ((careerCriteriaCompleted * 100) / careerTotalPossible)
      : 0;

    return {
      career_id: careerId,
      career_code: careerInfo.code,
      career_name: careerInfo.name,
      total_criteria: careerCriteriaCount,
      average_progress_percentage: parseFloat(careerAverageProgress.toFixed(2)),
      completion_percentage: parseFloat(careerCompletionPercentage.toFixed(2)),
      total_criteria_completed: careerCriteriaCompleted,
      total_possible: careerTotalPossible,
    };
  });

  // 10. Tính các metrics tổng thể
  const averageProgressPercentage = totalPossibleProgress > 0 
    ? (totalProgressSum / totalPossibleProgress) 
    : 0;

  const overallCompletionPercentage = totalPossibleProgress > 0
    ? ((totalCriteriaCompleted * 100) / totalPossibleProgress)
    : 0;

  const completionRate = totalPossibleProgress > 0
    ? (totalCriteriaCompleted / totalPossibleProgress)
    : 0;

  // Sort careers theo average_progress_percentage giảm dần
  careersDetail.sort((a, b) => b.average_progress_percentage - a.average_progress_percentage);

  return {
    class_id,
    class_name: classInfo?.name || null,
    total_students: totalStudents,
    total_careers_assigned: uniqueCareerIds.length,
    total_criteria_assigned: totalCriteriaAssigned,
    overall_completion_percentage: parseFloat(overallCompletionPercentage.toFixed(2)),
    average_progress_percentage: parseFloat(averageProgressPercentage.toFixed(2)),
    total_criteria_completed: totalCriteriaCompleted,
    completion_rate: parseFloat(completionRate.toFixed(4)),
    careers_detail: careersDetail,
  };
};

module.exports = {
  getStudentCareerStatistics,
  getStudentCareerEvaluations,
  getClassOverviewStatistics,
  getClassCareerProgress,
  getClassCareerEvaluations,
  getClassTopStudents,
  getClassOverallCompletion,
};
