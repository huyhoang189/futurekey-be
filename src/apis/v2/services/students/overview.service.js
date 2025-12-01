const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

/**
 * Get career learning overview statistics for a student
 * Returns: total criteria to learn, careers configured, completed criteria, completed careers
 */
const getCareerOverviewStats = async ({ student_id, class_id }) => {
  if (!student_id || !class_id) {
    throw new Error("student_id and class_id are required");
  }

  // B1: Get all configured criteria for the student's class
  const configuredCriteria = await prisma.class_criteria_config.findMany({
    where: { class_id },
    select: {
      career_id: true,
      criteria_id: true,
    },
  });

  const totalCriteriaCount = configuredCriteria.length;

  // B2: Get unique careers that have configured criteria
  const careerIds = [
    ...new Set(
      configuredCriteria.map((config) => config.career_id).filter(Boolean)
    ),
  ];
  const totalCareersCount = careerIds.length;

  // B3: Get completed criteria from student_learn_progress
  const completedCriteria = await prisma.student_learn_progress.findMany({
    where: {
      student_id,
      career_id: { in: careerIds },
      status: "COMPLETED",
    },
    select: {
      career_id: true,
      criteria_id: true,
    },
  });

  const completedCriteriaCount = completedCriteria.length;

  // B4: Calculate completed careers
  // Group configured criteria by career
  const criteriaByCareer = configuredCriteria.reduce((acc, config) => {
    if (!acc[config.career_id]) {
      acc[config.career_id] = new Set();
    }
    acc[config.career_id].add(config.criteria_id);
    return acc;
  }, {});

  // Group completed criteria by career
  const completedCriteriaByCareer = completedCriteria.reduce((acc, record) => {
    if (!acc[record.career_id]) {
      acc[record.career_id] = new Set();
    }
    acc[record.career_id].add(record.criteria_id);
    return acc;
  }, {});

  // Count careers where all criteria are completed
  let completedCareersCount = 0;
  for (const careerId of careerIds) {
    const requiredCriteria = criteriaByCareer[careerId] || new Set();
    const completedForCareer = completedCriteriaByCareer[careerId] || new Set();

    // Check if all required criteria are completed
    const allCompleted = [...requiredCriteria].every((criteriaId) =>
      completedForCareer.has(criteriaId)
    );

    if (allCompleted && requiredCriteria.size > 0) {
      completedCareersCount++;
    }
  }

  return {
    total_criteria: totalCriteriaCount,
    total_careers: totalCareersCount,
    completed_criteria: completedCriteriaCount,
    completed_careers: completedCareersCount,
  };
};

/**
 * Get list of careers student is learning with completion progress
 * Returns career details with progress percentage based on completed criteria
 */
const getCareersInProgress = async ({ student_id, class_id }) => {
  if (!student_id || !class_id) {
    throw new Error("student_id and class_id are required");
  }

  // Get all configured criteria for the student's class
  const configuredCriteria = await prisma.class_criteria_config.findMany({
    where: { class_id },
    select: {
      career_id: true,
      criteria_id: true,
    },
  });

  // Get unique career IDs
  const careerIds = [
    ...new Set(
      configuredCriteria.map((config) => config.career_id).filter(Boolean)
    ),
  ];

  if (careerIds.length === 0) {
    return [];
  }

  // Get active careers from career table
  const activeCareers = await prisma.career.findMany({
    where: {
      id: { in: careerIds },
      is_active: true,
    },
    select: {
      id: true,
      name: true,
      description: true,
      code: true,
    },
  });

  const activeCareerIds = activeCareers.map((career) => career.id);

  // Get completed criteria for this student
  const completedCriteria = await prisma.student_learn_progress.findMany({
    where: {
      student_id,
      career_id: { in: activeCareerIds },
      status: "COMPLETED",
    },
    select: {
      career_id: true,
      criteria_id: true,
    },
  });

  // Group configured criteria by career (only active careers)
  const criteriaByCareer = configuredCriteria.reduce((acc, config) => {
    if (activeCareerIds.includes(config.career_id)) {
      if (!acc[config.career_id]) {
        acc[config.career_id] = new Set();
      }
      acc[config.career_id].add(config.criteria_id);
    }
    return acc;
  }, {});

  // Group completed criteria by career
  const completedCriteriaByCareer = completedCriteria.reduce((acc, record) => {
    if (!acc[record.career_id]) {
      acc[record.career_id] = new Set();
    }
    acc[record.career_id].add(record.criteria_id);
    return acc;
  }, {});

  // Build result with progress percentage
  const careersWithProgress = activeCareers.map((career) => {
    const totalCriteria = criteriaByCareer[career.id]?.size || 0;
    const completedCount = completedCriteriaByCareer[career.id]?.size || 0;

    // Calculate progress percentage
    const progressPercent =
      totalCriteria > 0 ? (completedCount / totalCriteria) * 100 : 0;

    return {
      id: career.id,
      code: career.code,
      name: career.name,
      description: career.description,
      total_criteria: totalCriteria,
      completed_criteria: completedCount,
      progress_percent: Math.round(progressPercent * 100) / 100, // Round to 2 decimal places
      is_completed: totalCriteria > 0 && completedCount === totalCriteria,
    };
  });

  return careersWithProgress;
};

/**
 * Get weekly learning statistics for completed criteria
 * Time range options: '1month', '3months', '6months'
 */
const getWeeklyLearningStats = async ({
  student_id,
  class_id,
  time_range = "1month",
}) => {
  if (!student_id || !class_id) {
    throw new Error("student_id and class_id are required");
  }

  // Calculate date range based on time_range parameter
  const now = new Date();
  let startDate;

  switch (time_range) {
    case "1month":
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 1);
      break;
    case "3months":
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 3);
      break;
    case "6months":
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 6);
      break;
    default:
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 1);
  }

  // Get configured criteria for the student's class
  const configuredCriteria = await prisma.class_criteria_config.findMany({
    where: { class_id },
    select: {
      career_id: true,
      criteria_id: true,
    },
  });

  // Get unique career IDs
  const careerIds = [
    ...new Set(
      configuredCriteria.map((config) => config.career_id).filter(Boolean)
    ),
  ];

  if (careerIds.length === 0) {
    return [];
  }

  // Check which careers are active
  const activeCareers = await prisma.career.findMany({
    where: {
      id: { in: careerIds },
      is_active: true,
    },
    select: {
      id: true,
    },
  });

  const activeCareerIds = activeCareers.map((career) => career.id);

  // Get configured criteria IDs for active careers only
  const activeCriteriaIds = configuredCriteria
    .filter((config) => activeCareerIds.includes(config.career_id))
    .map((config) => config.criteria_id);

  if (activeCriteriaIds.length === 0) {
    return [];
  }

  // Get completed criteria within the time range
  const completedCriteria = await prisma.student_learn_progress.findMany({
    where: {
      student_id,
      criteria_id: { in: activeCriteriaIds },
      career_id: { in: activeCareerIds },
      status: "COMPLETED",
      updated_at: {
        gte: startDate,
      },
    },
    select: {
      criteria_id: true,
      updated_at: true,
    },
    orderBy: {
      updated_at: "asc",
    },
  });

  // Helper function to get week info from date
  const getWeekInfo = (date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const daysSinceFirstDay = Math.floor(
      (date - firstDayOfYear) / (24 * 60 * 60 * 1000)
    );
    const weekNumber = Math.ceil(
      (daysSinceFirstDay + firstDayOfYear.getDay() + 1) / 7
    );
    const year = date.getFullYear();

    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    return {
      weekKey: `${year}-W${String(weekNumber).padStart(2, "0")}`,
      year,
      weekNumber,
      weekStart: weekStart.toISOString().split("T")[0],
      weekEnd: weekEnd.toISOString().split("T")[0],
    };
  };

  // Generate all weeks in the range
  const allWeeks = {};
  const currentDate = new Date(startDate);
  currentDate.setHours(0, 0, 0, 0);

  // For 1month, extend end date by 1 week to show next week
  const endDate = new Date(now);
  if (time_range === "1month") {
    endDate.setDate(endDate.getDate() + 7);
  }

  while (currentDate <= endDate) {
    const weekInfo = getWeekInfo(currentDate);

    if (!allWeeks[weekInfo.weekKey]) {
      allWeeks[weekInfo.weekKey] = {
        week: weekInfo.weekKey,
        year: weekInfo.year,
        week_number: weekInfo.weekNumber,
        week_start: weekInfo.weekStart,
        week_end: weekInfo.weekEnd,
        completed_criteria_count: 0,
      };
    }

    // Move to next week
    currentDate.setDate(currentDate.getDate() + 7);
  }

  // Fill in completed criteria counts
  completedCriteria.forEach((record) => {
    const date = new Date(record.updated_at);
    const weekInfo = getWeekInfo(date);

    if (allWeeks[weekInfo.weekKey]) {
      allWeeks[weekInfo.weekKey].completed_criteria_count++;
    }
  });

  // Convert to array and sort by week
  const result = Object.values(allWeeks).sort((a, b) => {
    return a.week.localeCompare(b.week);
  });

  return result;
};

module.exports = {
  getCareerOverviewStats,
  getCareersInProgress,
  getWeeklyLearningStats,
};
