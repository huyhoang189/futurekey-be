const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Tạo đề thi cá nhân cho học sinh khi bắt đầu làm bài
 */
const generateExamForStudent = async (examId, studentId) => {
  // Kiểm tra đề thi
  const exam = await prisma.exams.findUnique({
    where: { id: examId },
  });

  if (!exam) {
    throw new Error("Exam not found");
  }

  if (!exam.is_published) {
    throw new Error("Exam is not published yet");
  }

  // Kiểm tra thời gian hiệu lực
  const now = new Date();
  if (exam.start_time && now < exam.start_time) {
    throw new Error("Exam has not started yet");
  }
  if (exam.end_time && now > exam.end_time) {
    throw new Error("Exam has ended");
  }

  // Kiểm tra số lần làm bài
  if (exam.max_attempts) {
    const attemptCount = await prisma.student_exam_attempts.count({
      where: {
        student_id: studentId,
        exam_id: examId,
        status: { in: ['SUBMITTED', 'GRADED'] },
      },
    });

    if (attemptCount >= exam.max_attempts) {
      throw new Error(`Maximum attempts (${exam.max_attempts}) reached`);
    }
  }

  // Kiểm tra xem có attempt đang IN_PROGRESS không
  const existingAttempt = await prisma.student_exam_attempts.findFirst({
    where: {
      student_id: studentId,
      exam_id: examId,
      status: 'IN_PROGRESS',
    },
  });

  if (existingAttempt) {
    // Trả về attempt hiện tại
    const snapshot = existingAttempt.snapshot_data;
    return {
      attempt: existingAttempt,
      questions: snapshot?.questions || [],
    };
  }

  // Lấy cấu hình random
  const distributions = await prisma.exam_question_distributions.findMany({
    where: { exam_id: examId },
    orderBy: { order_index: 'asc' },
  });

  let allQuestions = [];
  let orderIndex = 1;
  const questionIdsToUpdate = [];

  if (distributions.length > 0) {
    // Random câu hỏi theo distributions
    for (const dist of distributions) {
      const questionsForDist = [];

      // Random theo từng độ khó
      const difficulties = [
        { level: 'EASY', count: dist.easy_count || 0 },
        { level: 'MEDIUM', count: dist.medium_count || 0 },
        { level: 'HARD', count: dist.hard_count || 0 },
      ];

      for (const { level, count } of difficulties) {
        if (count > 0) {
          const filter = {
            is_active: true,
            difficulty_level: level,
            ...(dist.category_id && { category_id: dist.category_id }),
            ...(dist.career_criteria_id && { career_criteria_id: dist.career_criteria_id }),
            ...(dist.question_type && { question_type: dist.question_type }),
          };

          const available = await prisma.questions.findMany({
            where: filter,
            orderBy: { usage_count: 'asc' },
          });

          if (available.length < count) {
            throw new Error(`Not enough ${level} questions in distribution ${dist.order_index}`);
          }

          const shuffled = available.sort(() => 0.5 - Math.random());
          const selected = shuffled.slice(0, count);
          
          questionsForDist.push(...selected);
          questionIdsToUpdate.push(...selected.map(q => q.id));
        }
      }

      // Nếu không có phân bổ cụ thể
      if (questionsForDist.length === 0 && dist.quantity > 0) {
        const filter = {
          is_active: true,
          ...(dist.category_id && { category_id: dist.category_id }),
          ...(dist.career_criteria_id && { career_criteria_id: dist.career_criteria_id }),
          ...(dist.question_type && { question_type: dist.question_type }),
          ...(dist.difficulty_level && { difficulty_level: dist.difficulty_level }),
        };

        const available = await prisma.questions.findMany({
          where: filter,
          orderBy: { usage_count: 'asc' },
        });

        if (available.length < dist.quantity) {
          throw new Error(`Not enough questions in distribution ${dist.order_index}`);
        }

        const shuffled = available.sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, dist.quantity);
        
        questionsForDist.push(...selected);
        questionIdsToUpdate.push(...selected.map(q => q.id));
      }

      // Xáo trộn options nếu cần
      const questionsWithOptions = await Promise.all(
        questionsForDist.map(async (q) => {
          const options = await prisma.question_options.findMany({
            where: { question_id: q.id },
            orderBy: { order_index: 'asc' },
          });

          let shuffledOptions = options;
          if (exam.is_shuffle_options && options.length > 0) {
            shuffledOptions = [...options].sort(() => 0.5 - Math.random());
          }

          return {
            id: q.id,
            order: orderIndex++,
            points: dist.points_per_question,
            content: q.content,
            question_type: q.question_type,
            explanation: q.explanation,
            correct_answer: q.correct_answer,
            options: shuffledOptions.map(opt => ({
              key: opt.option_key,
              text: opt.option_text,
              is_correct: opt.is_correct,
            })),
          };
        })
      );

      allQuestions.push(...questionsWithOptions);
    }
  } else {
    // Không có distributions, lấy từ exam_questions
    const examQuestions = await prisma.exam_questions.findMany({
      where: { exam_id: examId },
      orderBy: { order_index: 'asc' },
    });

    if (examQuestions.length === 0) {
      throw new Error("No questions configured for this exam");
    }

    const questionIds = examQuestions.map(eq => eq.question_id);
    const questions = await prisma.questions.findMany({
      where: { id: { in: questionIds } },
    });

    const questionsMap = Object.fromEntries(questions.map(q => [q.id, q]));

    for (const eq of examQuestions) {
      const q = questionsMap[eq.question_id];
      if (!q) continue;

      const options = await prisma.question_options.findMany({
        where: { question_id: q.id },
        orderBy: { order_index: 'asc' },
      });

      let shuffledOptions = options;
      if (exam.is_shuffle_options && options.length > 0) {
        shuffledOptions = [...options].sort(() => 0.5 - Math.random());
      }

      allQuestions.push({
        id: q.id,
        order: eq.order_index,
        points: eq.points,
        content: q.content,
        question_type: q.question_type,
        explanation: q.explanation,
        correct_answer: q.correct_answer,
        options: shuffledOptions.map(opt => ({
          key: opt.option_key,
          text: opt.option_text,
          is_correct: opt.is_correct,
        })),
      });

      questionIdsToUpdate.push(q.id);
    }
  }

  // Xáo trộn câu hỏi nếu cần
  if (exam.is_shuffle_questions) {
    allQuestions = allQuestions.sort(() => 0.5 - Math.random());
    // Re-index order
    allQuestions.forEach((q, idx) => {
      q.order = idx + 1;
    });
  }

  // Tạo attempt với snapshot
  const attempt = await prisma.$transaction(async (tx) => {
    const newAttempt = await tx.student_exam_attempts.create({
      data: {
        student_id: studentId,
        exam_id: examId,
        snapshot_data: {
          questions: allQuestions,
          exam_settings: {
            is_shuffle_questions: exam.is_shuffle_questions,
            is_shuffle_options: exam.is_shuffle_options,
            show_results_immediately: exam.show_results_immediately,
          },
        },
        start_time: new Date(),
        max_score: exam.total_points,
        status: 'IN_PROGRESS',
      },
    });

    // Update usage_count
    if (questionIdsToUpdate.length > 0) {
      await tx.questions.updateMany({
        where: { id: { in: questionIdsToUpdate } },
        data: { usage_count: { increment: 1 } },
      });
    }

    return newAttempt;
  });

  return {
    attempt,
    questions: allQuestions,
  };
};

/**
 * Lưu câu trả lời của học sinh (auto-save)
 */
const saveStudentAnswer = async (attemptId, questionId, answerData) => {
  // Kiểm tra attempt
  const attempt = await prisma.student_exam_attempts.findUnique({
    where: { id: attemptId },
  });

  if (!attempt) {
    throw new Error("Attempt not found");
  }

  if (attempt.status !== 'IN_PROGRESS') {
    throw new Error("Cannot save answer. Exam is not in progress");
  }

  // Upsert answer
  const answer = await prisma.student_answers.upsert({
    where: {
      unique_attempt_question: {
        attempt_id: attemptId,
        question_id: questionId,
      },
    },
    update: {
      answer_data: answerData,
      updated_at: new Date(),
    },
    create: {
      attempt_id: attemptId,
      question_id: questionId,
      answer_data: answerData,
    },
  });

  return answer;
};

/**
 * Nộp bài thi
 */
const submitExam = async (attemptId) => {
  const attempt = await prisma.student_exam_attempts.findUnique({
    where: { id: attemptId },
  });

  if (!attempt) {
    throw new Error("Attempt not found");
  }

  if (attempt.status !== 'IN_PROGRESS') {
    throw new Error("Exam is not in progress");
  }

  const submitTime = new Date();
  const durationSeconds = Math.floor((submitTime - attempt.start_time) / 1000);

  // Update attempt
  await prisma.student_exam_attempts.update({
    where: { id: attemptId },
    data: {
      submit_time: submitTime,
      duration_seconds: durationSeconds,
      status: 'SUBMITTED',
    },
  });

  // Trigger auto-grading cho trắc nghiệm
  try {
    await autoGradeExam(attemptId);
  } catch (error) {
    console.error('Auto-grading failed:', error);
  }

  return {
    message: "Exam submitted successfully",
    duration_seconds: durationSeconds,
  };
};

/**
 * Chấm tự động trắc nghiệm
 */
const autoGradeExam = async (attemptId) => {
  const attempt = await prisma.student_exam_attempts.findUnique({
    where: { id: attemptId },
  });

  if (!attempt) {
    throw new Error("Attempt not found");
  }

  // Get all student answers
  const studentAnswers = await prisma.student_answers.findMany({
    where: { attempt_id: attemptId },
  });

  const questionIds = studentAnswers.map(a => a.question_id);
  const questions = await prisma.questions.findMany({
    where: { id: { in: questionIds } },
  });

  const questionsMap = Object.fromEntries(questions.map(q => [q.id, q]));

  let totalScore = 0;
  const gradingResults = [];

  for (const answer of studentAnswers) {
    const question = questionsMap[answer.question_id];
    if (!question) continue;

    let isCorrect = false;
    let score = 0;

    // Get max score from snapshot
    const snapshotQuestion = attempt.snapshot_data?.questions?.find(
      q => q.id === question.id
    );
    const maxScore = snapshotQuestion?.points || question.points || 1;

    // Chỉ chấm tự động trắc nghiệm
    if (['MULTIPLE_CHOICE', 'TRUE_FALSE'].includes(question.question_type)) {
      if (question.question_type === 'TRUE_FALSE') {
        // TRUE_FALSE: lấy đáp án từ snapshot (đã lưu trong correct_answer)
        const correctAnswer = snapshotQuestion?.correct_answer;
        const studentAnswer = answer.answer_data?.value;
        isCorrect = correctAnswer === studentAnswer;
      } else if (question.question_type === 'MULTIPLE_CHOICE') {
        // MULTIPLE_CHOICE: lấy đáp án từ snapshot (đã lưu is_correct trong options)
        const snapshotOptions = snapshotQuestion?.options || [];

        const correctOptions = snapshotOptions
          .filter(opt => opt.is_correct)
          .map(opt => opt.key)
          .sort();

        const studentSelected = (answer.answer_data?.selected || []).sort();

        isCorrect = JSON.stringify(correctOptions) === JSON.stringify(studentSelected);
      }

      if (isCorrect) {
        score = maxScore;
        totalScore += score;
      }

      gradingResults.push({
        answer_id: answer.id,
        is_correct: isCorrect,
        score,
        max_score: maxScore,
      });
    }
  }

  // Update student_answers and attempt in transaction
  await prisma.$transaction(async (tx) => {
    for (const result of gradingResults) {
      await tx.student_answers.update({
        where: { id: result.answer_id },
        data: {
          is_correct: result.is_correct,
          score: result.score,
          max_score: result.max_score,
        },
      });
    }

    await tx.student_exam_attempts.update({
      where: { id: attemptId },
      data: {
        total_score: totalScore,
        is_auto_graded: true,
        status: 'GRADED',
      },
    });
  });

  return {
    message: "Auto-grading completed",
    total_score: totalScore,
    graded_count: gradingResults.length,
  };
};

/**
 * Lấy danh sách bài thi cần chấm (tự luận)
 */
const getExamsNeedGrading = async ({ filters = {}, paging = {} }) => {
  const { skip = 0, limit = 10 } = paging;

  // Tìm attempts có status = SUBMITTED hoặc GRADED nhưng có câu tự luận chưa chấm
  const attempts = await prisma.student_exam_attempts.findMany({
    where: {
      status: { in: ['SUBMITTED', 'GRADED'] },
      ...filters,
    },
    skip,
    take: limit,
    orderBy: { submit_time: 'asc' },
  });

  const results = [];

  for (const attempt of attempts) {
    // Kiểm tra có câu tự luận chưa chấm không
    const unansweredEssay = await prisma.student_answers.findFirst({
      where: {
        attempt_id: attempt.id,
        is_correct: null, // Chưa chấm
      },
      include: {
        questions: {
          where: {
            question_type: { in: ['ESSAY', 'SHORT_ANSWER'] },
          },
        },
      },
    });

    if (unansweredEssay) {
      const [student, exam] = await Promise.all([
        prisma.auth_impl_user_student.findFirst({
          where: { user_id: attempt.student_id },
          include: {
            auth_base_user: {
              select: { full_name: true },
            },
          },
        }),
        prisma.exams.findUnique({
          where: { id: attempt.exam_id },
          select: { title: true, exam_code: true },
        }),
      ]);

      results.push({
        ...attempt,
        student,
        exam,
      });
    }
  }

  return {
    data: results,
    meta: { total: results.length, skip, limit },
  };
};

/**
 * Chấm câu hỏi tự luận
 */
const gradeEssayQuestion = async (answerId, score, feedback, gradedBy) => {
  const answer = await prisma.student_answers.findUnique({
    where: { id: answerId },
  });

  if (!answer) {
    throw new Error("Answer not found");
  }

  // Update answer
  await prisma.student_answers.update({
    where: { id: answerId },
    data: {
      score,
      is_correct: score > 0,
      feedback,
      graded_by: gradedBy,
      graded_at: new Date(),
    },
  });

  // Recalculate total score
  const allAnswers = await prisma.student_answers.findMany({
    where: { attempt_id: answer.attempt_id },
  });

  const totalScore = allAnswers.reduce((sum, ans) => sum + (ans.score || 0), 0);

  // Check if all answers are graded
  const allGraded = allAnswers.every(ans => ans.is_correct !== null);

  await prisma.student_exam_attempts.update({
    where: { id: answer.attempt_id },
    data: {
      total_score: totalScore,
      status: allGraded ? 'GRADED' : 'SUBMITTED',
    },
  });

  return { message: "Essay question graded successfully" };
};

/**
 * Xem kết quả bài thi
 */
const getExamResults = async (attemptId) => {
  const attempt = await prisma.student_exam_attempts.findUnique({
    where: { id: attemptId },
  });

  if (!attempt) {
    throw new Error("Attempt not found");
  }

  const [exam, answers] = await Promise.all([
    prisma.exams.findUnique({
      where: { id: attempt.exam_id },
    }),
    prisma.student_answers.findMany({
      where: { attempt_id: attemptId },
    }),
  ]);

  // Get questions details
  const questionIds = answers.map(a => a.question_id);
  const questions = await prisma.questions.findMany({
    where: { id: { in: questionIds } },
  });

  const questionsMap = Object.fromEntries(questions.map(q => [q.id, q]));

  // Get categories for statistics
  const categoryIds = [...new Set(questions.map(q => q.category_id).filter(Boolean))];
  const categories = await prisma.question_categories.findMany({
    where: { id: { in: categoryIds } },
  });

  const categoriesMap = Object.fromEntries(categories.map(c => [c.id, c]));

  // Build detailed results
  const detailedAnswers = await Promise.all(
    answers.map(async (answer) => {
      const question = questionsMap[answer.question_id];
      const options = await prisma.question_options.findMany({
        where: { question_id: answer.question_id },
      });

      return {
        question_id: answer.question_id,
        question_content: question?.content,
        question_type: question?.question_type,
        category: question?.category_id ? categoriesMap[question.category_id] : null,
        student_answer: answer.answer_data,
        is_correct: answer.is_correct,
        score: answer.score,
        max_score: answer.max_score,
        feedback: answer.feedback,
        explanation: question?.explanation,
        correct_answer: question?.correct_answer,
        options: options.map(opt => ({
          key: opt.option_key,
          text: opt.option_text,
          is_correct: opt.is_correct,
        })),
      };
    })
  );

  // Statistics by category
  const categoryStats = {};
  detailedAnswers.forEach((ans) => {
    if (ans.category) {
      const catName = ans.category.name;
      if (!categoryStats[catName]) {
        categoryStats[catName] = { score: 0, max_score: 0 };
      }
      categoryStats[catName].score += ans.score || 0;
      categoryStats[catName].max_score += ans.max_score || 0;
    }
  });

  return {
    attempt,
    exam,
    summary: {
      total_score: attempt.total_score,
      max_score: attempt.max_score,
      duration_seconds: attempt.duration_seconds,
      correct_count: answers.filter(a => a.is_correct).length,
      total_questions: answers.length,
      status: attempt.status,
    },
    detailed_answers: detailedAnswers,
    category_statistics: categoryStats,
  };
};

module.exports = {
  generateExamForStudent,
  saveStudentAnswer,
  submitExam,
  autoGradeExam,
  getExamsNeedGrading,
  gradeEssayQuestion,
  getExamResults,
};
