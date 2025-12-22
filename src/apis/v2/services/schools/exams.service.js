const prisma = require("../../../../configs/prisma");

/**
 * Lay danh sach bai thi cua hoc sinh theo lop voi cac filter
 */
const getExamAttemptsByClass = async ({
  class_id,
  search,
  career_id,
  career_criteria_id,
  status,
  paging = { skip: 0, limit: 10 },
  orderBy = { submit_time: "desc" },
}) => {
  if (!class_id) {
    throw new Error("class_id is required");
  }

  const { skip = 0, limit = 10 } = paging;

  // Load students in class (and optional search on code/name)
  const studentFilter = { class_id };
  if (search) {
    const matchedUsers = await prisma.auth_base_user.findMany({
      where: { full_name: { contains: search } },
      select: { id: true },
    });
    const userIdsFromName = matchedUsers.map((u) => u.id);
    studentFilter.OR = [{ student_code: { contains: search } }];
    if (userIdsFromName.length) {
      studentFilter.OR.push({ user_id: { in: userIdsFromName } });
    }
  }

  const students = await prisma.auth_impl_user_student.findMany({
    where: studentFilter,
    select: { id: true, student_code: true, user_id: true },
  });

  if (!students.length) {
    return { data: [], meta: { total: 0, skip, limit } };
  }

  const studentIds = students.map((s) => s.id);
  const studentMap = new Map(students.map((s) => [s.id, s]));
  const userIds = [...new Set(students.map((s) => s.user_id).filter(Boolean))];

  const userMap = userIds.length
    ? new Map(
        (
          await prisma.auth_base_user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, full_name: true },
          })
        ).map((u) => [u.id, u.full_name || "N/A"])
      )
    : new Map();

  // Optional exam_config filter by career or criteria
  let allowedConfigIds = null;
  let examConfigMap = new Map();

  if (career_id || career_criteria_id) {
    const configFilter = {};

    if (career_id) {
      // exam_configs does not store career_id; filter via criteria
      const criteriaForCareer = await prisma.career_criteria.findMany({
        where: { career_id },
        select: { id: true },
      });
      const criteriaIds = criteriaForCareer.map((c) => c.id);
      if (!criteriaIds.length) {
        return { data: [], meta: { total: 0, skip, limit } };
      }
      configFilter.career_criteria_id = { in: criteriaIds };
    }

    if (career_criteria_id) {
      configFilter.career_criteria_id = career_criteria_id;
    }

    const configs = await prisma.exam_configs.findMany({
      where: configFilter,
      select: {
        id: true,
        config_name: true,
        exam_type_scope: true,
        career_criteria_id: true,
      },
    });

    allowedConfigIds = configs.map((c) => c.id);
    examConfigMap = new Map(configs.map((c) => [c.id, c]));

    if (!allowedConfigIds.length) {
      return { data: [], meta: { total: 0, skip, limit } };
    }
  }

  // Build attempt filter
  const attemptWhere = {
    student_id: { in: studentIds },
  };

  if (status) {
    attemptWhere.status = status;
  }

  if (allowedConfigIds !== null) {
    attemptWhere.exam_config_id = { in: allowedConfigIds };
  }

  const total = await prisma.student_exam_attempts.count({
    where: attemptWhere,
  });

  const attempts = await prisma.student_exam_attempts.findMany({
    where: attemptWhere,
    skip,
    take: limit,
    orderBy,
  });

  // Ensure we have exam_config info for returned attempts
  const missingConfigIds = [
    ...new Set(
      attempts
        .map((a) => a.exam_config_id)
        .filter((id) => id && !examConfigMap.has(id))
    ),
  ];

  if (missingConfigIds.length) {
    const configs = await prisma.exam_configs.findMany({
      where: { id: { in: missingConfigIds } },
      select: {
        id: true,
        config_name: true,
        exam_type_scope: true,
        career_criteria_id: true,
      },
    });
    configs.forEach((c) => examConfigMap.set(c.id, c));
  }

  // Load criteria and career names for display
  const criteriaIds = [
    ...new Set(
      Array.from(examConfigMap.values())
        .map((c) => c.career_criteria_id)
        .filter(Boolean)
    ),
  ];

  let criteriaMap = new Map();
  let careerMap = new Map();

  if (criteriaIds.length) {
    const criteriaItems = await prisma.career_criteria.findMany({
      where: { id: { in: criteriaIds } },
      select: { id: true, name: true, career_id: true },
    });

    criteriaMap = new Map(
      criteriaItems.map((c) => [c.id, { name: c.name, career_id: c.career_id }])
    );

    const careerIds = [
      ...new Set(criteriaItems.map((c) => c.career_id).filter(Boolean)),
    ];

    if (careerIds.length) {
      careerMap = new Map(
        (
          await prisma.career.findMany({
            where: { id: { in: careerIds } },
            select: { id: true, name: true },
          })
        ).map((c) => [c.id, c.name])
      );
    }
  }

  // Format response
  const data = attempts.map((attempt) => {
    const student = studentMap.get(attempt.student_id);
    const config = examConfigMap.get(attempt.exam_config_id);
    const criteria = config?.career_criteria_id
      ? criteriaMap.get(config.career_criteria_id)
      : null;
    const score = attempt.total_score;
    const maxScore = attempt.max_score;
    let examName = (criteria && criteria.name) || config?.config_name || "N/A";

    return {
      id: attempt.id,
      student_code: student?.student_code || "N/A",
      student_name: student?.user_id
        ? userMap.get(student.user_id) || "N/A"
        : "N/A",
      exam_name: examName,
      career_name:
        criteria?.career_id && careerMap.has(criteria.career_id)
          ? careerMap.get(criteria.career_id)
          : "N/A",
      start_time: attempt.start_time,
      submit_time: attempt.submit_time,
      score,
      max_score: maxScore,
      percentage:
        score !== null && score !== undefined && maxScore
          ? ((Number(score) / Number(maxScore)) * 100).toFixed(2)
          : null,
      status: attempt.status,
    };
  });

  return {
    data,
    meta: {
      total,
      skip,
      limit,
    },
  };
};

/**
 * Lay chi tiet attempt (danh cho truong/giao vien)
 */
const getAttemptDetailsById = async (attemptId) => {
  const attempt = await prisma.student_exam_attempts.findUnique({
    where: { id: attemptId },
  });

  if (!attempt) {
    throw new Error("Attempt not found");
  }

  const answers = await prisma.student_answers.findMany({
    where: { attempt_id: attemptId },
  });

  // Map answers by question_id for quick lookup
  const answerMap = new Map();
  answers.forEach((ans) => {
    answerMap.set(ans.question_id, ans);
  });

  const attemptInfo = {
    id: attempt.id,
    status: attempt.status,
    total_score: attempt.total_score,
    max_score: attempt.max_score,
    duration_seconds: attempt.duration_seconds,
    submit_time: attempt.submit_time,
  };

  const sectionsMap = new Map();
  const snapshotQuestions = attempt.snapshot_data?.questions || [];

  for (const q of snapshotQuestions) {
    const categoryName = q.category?.name || "N/A";
    if (!sectionsMap.has(categoryName)) {
      sectionsMap.set(categoryName, []);
    }

    const answer = answerMap.get(q.question_id) || answerMap.get(q.id);

    // Extract student answer content/selection
    let selectedIds = null;
    let freeText = null;
    if (answer) {
      const data = answer.answer_data;
      if (Array.isArray(data)) {
        selectedIds = data;
      } else if (data && typeof data === "object") {
        if (Array.isArray(data.selected_option_ids)) {
          selectedIds = data.selected_option_ids;
        } else if (data.selected_option_id) {
          selectedIds = [data.selected_option_id];
        }
        if (data.free_text) {
          freeText = data.free_text;
        }
      } else if (typeof data === "string") {
        freeText = data;
      }
    }

    const isManual = ["SHORT_ANSWER", "ESSAY"].includes(q.question_type);
    const correctIds =
      isManual || !q.correct_option_ids ? null : q.correct_option_ids;

    const questionEntry = {
      question_id: q.question_id || q.id,
      type: q.question_type,
      content: q.content,
      points: q.points,
      explanation: q.explanation || null,
      options: q.options || [],
      correct_ids: correctIds,
      student_answer: answer
        ? {
            answer_id: answer.id,
            content: freeText || null,
            selected_ids: selectedIds,
            is_correct: answer.is_correct,
            score: answer.score,
            feedback: answer.feedback,
            is_manual_grading_required: isManual,
          }
        : {
            answer_id: null,
            content: freeText || null,
            selected_ids: selectedIds,
            is_correct: null,
            score: null,
            feedback: null,
            is_manual_grading_required: isManual,
          },
    };

    sectionsMap.get(categoryName).push(questionEntry);
  }

  const sections = Array.from(sectionsMap.entries()).map(
    ([category_name, questions]) => ({ category_name, questions })
  );

  return {
    attempt_info: attemptInfo,
    sections,
  };
};

/**
 * Cham cau hoi tu luan / short answer
 */
const gradeAnswer = async ({ answerId, earned_score, feedback, grader_id }) => {
  const scoreValue = Number(earned_score);
  if (Number.isNaN(scoreValue)) {
    throw new Error("earned_score must be a number");
  }
  if (scoreValue < 0) {
    throw new Error("earned_score must be >= 0");
  }

  const answer = await prisma.student_answers.findUnique({
    where: { id: answerId },
  });

  if (!answer) {
    throw new Error("Answer not found");
  }

  if (answer.max_score !== null && answer.max_score !== undefined) {
    if (scoreValue > Number(answer.max_score)) {
      throw new Error("earned_score cannot exceed max_score");
    }
  }

  const question = await prisma.questions.findUnique({
    where: { id: answer.question_id },
    select: { question_type: true },
  });

  if (!question) {
    throw new Error("Question not found");
  }

  if (!["SHORT_ANSWER", "ESSAY"].includes(question.question_type)) {
    throw new Error("Only SHORT_ANSWER or ESSAY can be graded manually");
  }

  await prisma.student_answers.update({
    where: { id: answerId },
    data: {
      score: scoreValue,
      feedback: feedback || null,
      graded_by: grader_id,
      graded_at: new Date(),
      is_correct: null,
    },
  });

  // Recompute totals for attempt
  const attemptAnswers = await prisma.student_answers.findMany({
    where: { attempt_id: answer.attempt_id },
    select: { score: true, max_score: true },
  });

  const totalScore = attemptAnswers.reduce(
    (sum, a) =>
      sum + (a.score !== null && a.score !== undefined ? Number(a.score) : 0),
    0
  );
  const maxScore = attemptAnswers.reduce(
    (sum, a) =>
      sum +
      (a.max_score !== null && a.max_score !== undefined
        ? Number(a.max_score)
        : 0),
    0
  );

  const allGraded = attemptAnswers.every(
    (a) => a.score !== null && a.score !== undefined
  );

  const updateData = {
    total_score: totalScore,
    max_score: maxScore,
    status: allGraded ? "GRADED" : "SUBMITTED",
  };

  if (allGraded) {
    updateData.graded_by = grader_id;
    updateData.graded_at = new Date();
  }

  const updatedAttempt = await prisma.student_exam_attempts.update({
    where: { id: answer.attempt_id },
    data: updateData,
  });

  return {
    answer_id: answerId,
    attempt_id: answer.attempt_id,
    score: scoreValue,
    feedback: feedback || null,
    status: updatedAttempt.status,
    total_score: updatedAttempt.total_score,
    max_score: updatedAttempt.max_score,
    all_graded: allGraded,
  };
};

module.exports = {
  getExamAttemptsByClass,
  getAttemptDetailsById,
  gradeAnswer,
};
