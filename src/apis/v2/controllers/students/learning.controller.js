const { StatusCodes } = require("http-status-codes");
const learningService = require("../../services/students/learning.service");

const parseLearningPayload = (payload) => {
  const values = payload.split(",").map((segment) => segment.trim());

  const [career_id, criteria_id, current_time, last_watched_position, status] =
    values;

  return {
    career_id,
    criteria_id,
    current_time,
    last_watched_position,
    status,
  };
};

/**
 * Extract the comma-delimited learning payload from various request body formats
 * Handles: plain string, nested properties (str/payload/data/learning), or form-encoded key
 */
const extractRawLearningPayload = (req) => {
  // Direct string body
  if (typeof req.body === "string") {
    return req.body;
  }

  if (!req.body || typeof req.body !== "object") {
    return "";
  }

  // Check common property names
  const payloadFields = ["str", "payload", "data", "learning"];
  for (const field of payloadFields) {
    if (req.body[field]) {
      return req.body[field];
    }
  }

  // Handle form-encoded: single key with empty value
  const keys = Object.keys(req.body);
  if (keys.length === 1 && req.body[keys[0]] === "") {
    return keys[0];
  }

  return "";
};

const isBlank = (value) =>
  value === undefined || value === null || value === "";

/**
 * Record student learning progress for a career criteria
 * Accepts comma-delimited payload: career_id,criteria_id,current_time,last_watched_position,status
 */
const learn = async (req, res) => {
  try {
    const student = req.student;

    // Validate authenticated student
    if (!student?.id) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "Authentication required: student not found",
      });
    }

    // Extract and validate payload
    const rawPayload = extractRawLearningPayload(req);
    if (!rawPayload) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Missing learning payload",
      });
    }

    // Parse payload into structured data
    const parsed = parseLearningPayload(rawPayload);
    const missingFields = Object.entries(parsed)
      .filter(([, value]) => isBlank(value))
      .map(([key]) => key);

    if (missingFields.length > 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(", ")}.`,
      });
    }

    // Upsert learning progress record
    const savedProgress = await learningService.upsertStudentLearningProgress({
      student_id: student.id,
      career_id: parsed.career_id,
      criteria_id: parsed.criteria_id,
      current_time: parsed.current_time,
      last_watched_position: parsed.last_watched_position,
      status: parsed.status,
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "successfully",
      //   data: savedProgress,
    });
  } catch (error) {
    if (error.message.includes("required")) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: error.message,
      });
    }
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: `Failed to record learning progress: ${error.message}`,
    });
  }
};

module.exports = {
  learn,
};
