const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * START EXAM - Tạo đề thi cá nhân cho học sinh
 * @param {string} exam_type - 'COMPREHENSIVE' | 'CRITERIA_SPECIFIC'
 * @param {string} career_criteria_id - ID tiêu chí nghề (bắt buộc nếu CRITERIA_SPECIFIC)
 * @param {string} student_id - ID học sinh
 */
const startExam = async ({ exam_type, career_criteria_id, student_id }) => {
  // Validation
  if (!exam_type || !['COMPREHENSIVE', 'CRITERIA_SPECIFIC'].includes(exam_type)) {
    throw new Error("exam_type must be 'COMPREHENSIVE' or 'CRITERIA_SPECIFIC'");
  }

  if (exam_type === 'CRITERIA_SPECIFIC' && !career_criteria_id) {
    throw new Error("career_criteria_id is required for CRITERIA_SPECIFIC exam");
  }

  // Tìm exam config theo exam_type và career_criteria_id
  const where = { exam_type_scope: exam_type };
  
  if (exam_type === 'COMPREHENSIVE') {
    // COMPREHENSIVE: Lấy bản ghi duy nhất
    where.career_criteria_id = null;
  } else {
    // CRITERIA_SPECIFIC: Lọc theo career_criteria_id
    where.career_criteria_id = career_criteria_id;
  }

  const config = await prisma.exam_configs.findFirst({ where });

  if (!config) {
    if (exam_type === 'COMPREHENSIVE') {
      throw new Error("COMPREHENSIVE exam config not found. Please create one first.");
    } else {
      throw new Error(`Exam config not found for criteria ${career_criteria_id}`);
    }
  }

  const exam_config_id = config.id;

  // Kiểm tra xem có attempt đang IN_PROGRESS không
  const existingAttempt = await prisma.student_exam_attempts.findFirst({
    where: {
      student_id,
      exam_config_id,
      exam_type,
      status: 'IN_PROGRESS',
    },
  });

  if (existingAttempt) {
    return {
      attempt: existingAttempt,
      questions: existingAttempt.snapshot_data?.questions || [],
    };
  }

  // Load distributions
  const distributions = await prisma.exam_config_distributions.findMany({
    where: { config_id: exam_config_id },
    orderBy: { order_index: 'asc' },
  });

  if (distributions.length === 0) {
    throw new Error("No distributions configured for this exam config");
  }

  // Random câu hỏi theo từng distribution (category + difficulty)
  const allQuestions = [];
  let orderIndex = 1;

  for (const dist of distributions) {
    const questionsForCategory = await randomizeQuestionsForDistribution(
      dist,
      exam_type,
      career_criteria_id
    );

    // Enrich with options
    const enriched = await enrichQuestionsWithOptions(questionsForCategory);

    enriched.forEach(q => {
      // Lấy correct_answer từ metadata hoặc tính toán từ options
      let correct_answer = null;
      if (q.question_type === 'MULTIPLE_CHOICE' || q.question_type === 'TRUE_FALSE') {
        const correctOption = q.options?.find(opt => opt.is_correct);
        correct_answer = correctOption ? correctOption.option_key : null;
      } else if (q.metadata?.correct_answer !== undefined) {
        correct_answer = q.metadata.correct_answer;
      }

      allQuestions.push({
        order_index: orderIndex++,
        question_id: q.id,
        category_id: q.category_id,
        content: q.content,
        question_type: q.question_type,
        difficulty_level: q.difficulty_level,
        points: parseFloat(config.total_points) / (distributions.reduce((sum, d) => sum + d.quantity, 0)),
        options: q.options || [],
        correct_answer,
        explanation: q.explanation,
      });
    });
  }

  if (allQuestions.length === 0) {
    throw new Error("No questions available for this exam configuration");
  }

  // Tính max score
  const max_score = parseFloat(config.total_points);

  // Tạo snapshot data
  const snapshot_data = {
    config_id: exam_config_id,
    config_name: config.config_name,
    exam_type,
    career_criteria_id: exam_type === 'CRITERIA_SPECIFIC' ? career_criteria_id : null,
    time_limit_minutes: config.time_limit_minutes,
    total_questions: allQuestions.length,
    total_points: max_score,
    questions: allQuestions,
  };

  // Tạo student_exam_attempt
  const attempt = await prisma.student_exam_attempts.create({
    data: {
      student_id,
      exam_config_id,
      exam_type,
      career_criteria_id: exam_type === 'CRITERIA_SPECIFIC' ? career_criteria_id : null,
      snapshot_data,
      start_time: new Date(),
      max_score,
      status: 'IN_PROGRESS',
    },
  });

  // Update usage_count
  await prisma.questions.updateMany({
    where: { id: { in: allQuestions.map(q => q.question_id) } },
    data: { usage_count: { increment: 1 } },
  });

  return {
    attempt,
    questions: snapshot_data.questions,
  };
};

/**
 * Random câu hỏi cho 1 distribution (1 category)
 */
const randomizeQuestionsForDistribution = async (distribution, exam_type, career_criteria_id) => {
  const { category_id, quantity, easy_count, medium_count, hard_count } = distribution;

  const filter = {
    is_active: true,
    category_id,
  };

  // Nếu CRITERIA_SPECIFIC, chỉ lấy câu hỏi có career_criteria_id khớp
  if (exam_type === 'CRITERIA_SPECIFIC') {
    filter.career_criteria_id = career_criteria_id;
  }

  const selected = [];

  // Random theo độ khó
  const difficulties = [
    { level: 'EASY', count: easy_count || 0 },
    { level: 'MEDIUM', count: medium_count || 0 },
    { level: 'HARD', count: hard_count || 0 },
  ];

  for (const { level, count } of difficulties) {
    if (count > 0) {
      const available = await prisma.questions.findMany({
        where: { ...filter, difficulty_level: level },
        orderBy: { usage_count: 'asc' },
      });

      if (available.length < count) {
        throw new Error(
          `Not enough ${level} questions in category ${category_id}. Need ${count}, available ${available.length}`
        );
      }

      const shuffled = [...available].sort(() => 0.5 - Math.random());
      selected.push(...shuffled.slice(0, count));
    }
  }

  return selected;
};


/**
 * Lấy full data câu hỏi kèm options
 */
const enrichQuestionsWithOptions = async (questions) => {
  const questionIds = questions.map(q => q.id);

  const allOptions = await prisma.question_options.findMany({
    where: { question_id: { in: questionIds } },
    orderBy: { order_index: 'asc' },
  });

  // Group options by question_id
  const optionsByQuestionId = {};
  allOptions.forEach(opt => {
    if (!optionsByQuestionId[opt.question_id]) {
      optionsByQuestionId[opt.question_id] = [];
    }
    optionsByQuestionId[opt.question_id].push(opt);
  });

  return questions.map(q => ({
    ...q,
    options: optionsByQuestionId[q.id] || [],
  }));
};

/**
 * Submit exam
 */
const submitExam = async ({ attempt_id, answers, student_id }) => {
  const attempt = await prisma.student_exam_attempts.findUnique({
    where: { id: attempt_id },
  });

  if (!attempt) {
    throw new Error("Exam attempt not found");
  }

  if (attempt.student_id !== student_id) {
    throw new Error("Unauthorized");
  }

  if (attempt.status !== 'IN_PROGRESS') {
    throw new Error("Exam already submitted");
  }

  const snapshot = attempt.snapshot_data;
  const questions = snapshot?.questions || [];

  // Auto grade
  let total_score = 0;
  const answerRecords = [];

  for (const answer of answers) {
    const question = questions.find(q => q.question_id === answer.question_id);
    if (!question) continue;

    const isCorrect = checkAnswer(question, answer.answer_data);
    const score = isCorrect ? question.points : 0;

    total_score += score;

    answerRecords.push({
      attempt_id,
      question_id: answer.question_id,
      answer_data: answer.answer_data,
      is_correct: isCorrect,
      score,
      max_score: question.points,
    });
  }

  // Update attempt
  const updated = await prisma.student_exam_attempts.update({
    where: { id: attempt_id },
    data: {
      submit_time: new Date(),
      duration_seconds: Math.floor((new Date() - attempt.start_time) / 1000),
      total_score,
      status: 'SUBMITTED',
      is_auto_graded: true,
    },
  });

  // Save answers
  await prisma.student_answers.createMany({
    data: answerRecords,
  });

  return {
    attempt: updated,
    total_score,
    max_score: attempt.max_score,
    percentage: (total_score / attempt.max_score) * 100,
  };
};

/**
 * Check answer correctness
 */
const checkAnswer = (question, answer_data) => {
  if (question.question_type === 'MULTIPLE_CHOICE' || question.question_type === 'TRUE_FALSE') {
    // correct_answer đã được lưu trong snapshot_data
    return answer_data === question.correct_answer;
  }
  // SHORT_ANSWER, ESSAY cần chấm thủ công
  return false;
};

/**
 * Get exam attempts của student
 */
const getStudentExamAttempts = async ({ student_id, exam_type, career_criteria_id, page = 1, limit = 10 }) => {
  const skip = (page - 1) * limit;
  const where = { student_id };

  if (exam_type) {
    where.exam_type = exam_type;
  }

  if (career_criteria_id) {
    where.career_criteria_id = career_criteria_id;
  }

  const [attempts, total] = await Promise.all([
    prisma.student_exam_attempts.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
    }),
    prisma.student_exam_attempts.count({ where }),
  ]);

  return {
    data: attempts,
    meta: { total, skip, limit, page, totalPages: Math.ceil(total / limit) },
  };
};

/**
 * Get attempt details
 */
const getAttemptDetails = async (attempt_id, student_id) => {
  const attempt = await prisma.student_exam_attempts.findUnique({
    where: { id: attempt_id },
  });

  if (!attempt) {
    throw new Error("Attempt not found");
  }

  if (attempt.student_id !== student_id) {
    throw new Error("Unauthorized");
  }

  // Load answers
  const answers = await prisma.student_answers.findMany({
    where: { attempt_id },
  });

  return {
    attempt,
    questions: attempt.snapshot_data?.questions || [],
    answers,
  };
};

module.exports = {
  startExam,
  submitExam,
  getStudentExamAttempts,
  getAttemptDetails,
};
