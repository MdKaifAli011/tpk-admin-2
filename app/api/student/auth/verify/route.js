import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Student from "@/models/Student";
import { verifyToken } from "@/lib/auth";
import { successResponse, errorResponse } from "@/utils/apiResponse";

export async function GET(request) {
  try {
    await connectDB();

    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return errorResponse("No token provided", 401);
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded || decoded.type !== "student") {
      return errorResponse("Invalid token", 401);
    }

    const student = await Student.findById(decoded.studentId);

    if (!student) {
      return errorResponse("Student not found", 404);
    }

    if (student.status !== "active") {
      return errorResponse("Account is inactive", 403);
    }

    const studentData = student.toJSON();

    return successResponse({ student: studentData }, "Token verified");
  } catch (error) {
    return errorResponse("Invalid or expired token", 401);
  }
}

