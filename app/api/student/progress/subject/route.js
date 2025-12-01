import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import SubjectProgress from "@/models/SubjectProgress";
import { successResponse, errorResponse, handleApiError } from "@/utils/apiResponse";

// Middleware to verify student token
async function verifyStudentToken(request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { error: "No token provided", status: 401 };
  }

  try {
    const token = authHeader.substring(7);
    const { verifyToken } = await import("@/lib/auth");
    const decoded = verifyToken(token);

    if (!decoded || decoded.type !== "student") {
      return { error: "Invalid token", status: 401 };
    }

    return { studentId: decoded.studentId, error: null };
  } catch (error) {
    return { error: "Invalid or expired token", status: 401 };
  }
}

// GET: Fetch subject progress for a student
export async function GET(request) {
  try {
    const authCheck = await verifyStudentToken(request);
    if (authCheck.error) {
      return NextResponse.json(
        { success: false, message: authCheck.error },
        { status: authCheck.status }
      );
    }

    await connectDB();
    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get("subjectId");

    if (!subjectId) {
      return errorResponse("Subject ID is required", 400);
    }

    const subjectProgress = await SubjectProgress.findOne({
      studentId: authCheck.studentId,
      subjectId,
    });

    if (!subjectProgress) {
      return successResponse(
        {
          subjectId,
          subjectProgress: 0,
          subjectCongratulationsShown: false,
        },
        "Subject progress fetched successfully"
      );
    }

    return successResponse(
      {
        subjectId: subjectProgress.subjectId,
        subjectProgress: subjectProgress.subjectProgress || 0,
        subjectCongratulationsShown: subjectProgress.subjectCongratulationsShown || false,
      },
      "Subject progress fetched successfully"
    );
  } catch (error) {
    return handleApiError(error, "Failed to fetch subject progress");
  }
}

