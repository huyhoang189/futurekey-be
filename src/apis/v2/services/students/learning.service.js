const { PrismaClient } = require("@prisma/client");
const prisma = require("../../../../configs/prisma");

/**
 * Convert string value to float, return undefined if invalid
 */
const toFloat = (value) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const number = parseFloat(value);
  return Number.isNaN(number) ? undefined : number;
};

/**
 * Create or update student learning progress for a specific career criteria
 * If a record exists for the student/career/criteria combination, it will be updated
 * Otherwise, a new record will be created
 */
const upsertStudentLearningProgress = async ({
  student_id,
  career_id,
  criteria_id,
  current_time,
  last_watched_position,
  status,
}) => {
  // Validate required identifiers
  if (!student_id || !career_id || !criteria_id) {
    throw new Error("student_id, career_id and criteria_id are required");
  }

  // Normalize and prepare update data
  const normalizedStatus = status ? status.toUpperCase() : undefined;
  const currentTimeFloat = toFloat(current_time);
  const lastWatchedPosition = toFloat(last_watched_position);

  // Calculate progress percentage: (last_watched_position / current_time) * 100
  let progressPercent = undefined;
  if (
    lastWatchedPosition !== undefined &&
    currentTimeFloat !== undefined &&
    currentTimeFloat > 0
  ) {
    progressPercent = (lastWatchedPosition / currentTimeFloat) * 100;
    // Ensure percentage is between 0-100
    progressPercent = Math.min(Math.max(progressPercent, 0), 100);
  }

  const updateData = {
    progress_percent: progressPercent,
    last_watched_positon: lastWatchedPosition,
    status: normalizedStatus,
    updated_at: new Date(),
  };

  // Filter out undefined values to avoid overwriting with nulls
  const filteredUpdateData = Object.fromEntries(
    Object.entries(updateData).filter(([, value]) => value !== undefined)
  );

  // Check if progress record already exists
  const existingProgress = await prisma.student_learn_progress.findFirst({
    where: { student_id, career_id, criteria_id },
  });

  if (existingProgress) {
    // Skip update if already completed
    if (existingProgress.status === "COMPLETED") {
      return existingProgress;
    }

    // Update existing record
    return prisma.student_learn_progress.update({
      where: { id: existingProgress.id },
      data: filteredUpdateData,
    });
  }

  // Create new record
  const createData = {
    student_id,
    career_id,
    criteria_id,
    ...filteredUpdateData,
  };

  return prisma.student_learn_progress.create({
    data: createData,
  });
};

/**
 * Get list of completed criteria for a student and career
 * Returns all criteria records with COMPLETED status
 */
const getCompletedCriteriaForCareer = async ({ student_id, career_id }) => {
  if (!student_id || !career_id) {
    throw new Error("student_id and career_id are required");
  }

  const completedRecords = await prisma.student_learn_progress.findMany({
    where: {
      student_id,
      career_id,
      status: "COMPLETED",
    },
    orderBy: {
      updated_at: "desc",
    },
  });

  return completedRecords;
};

module.exports = {
  upsertStudentLearningProgress,
  getCompletedCriteriaForCareer,
};
