import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Student from "@/models/Student";
import jwt from "jsonwebtoken";
import { successResponse, errorResponse, handleApiError } from "@/utils/apiResponse";
import { getJwtSecret } from "@/lib/auth";

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { email, password } = body;

    // Validate required fields
    if (!email || !password) {
      return errorResponse("Email and password are required", 400);
    }

    // Find student by email and include password
    const student = await Student.findOne({ email: email.toLowerCase() }).select("+password");

    if (!student) {
      return errorResponse("Invalid email or password", 401);
    }

    // Check if student is active
    if (student.status !== "active") {
      return errorResponse("Account is inactive. Please contact administrator.", 403);
    }

    // Compare password
    const isPasswordValid = await student.comparePassword(password);

    if (!isPasswordValid) {
      return errorResponse("Invalid email or password", 401);
    }

    // Update last login
    student.lastLogin = new Date();
    await student.save();

    // Generate JWT token
    const jwtSecret = getJwtSecret();
    const token = jwt.sign(
      {
        studentId: student._id,
        email: student.email,
        type: "student",
      },
      jwtSecret,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || "30d",
      }
    );

    // Return student data without password
    const studentData = student.toJSON();

    return successResponse(
      {
        student: studentData,
        token,
      },
      "Login successful"
    );
  } catch (error) {
    return handleApiError(error, "Login failed");
  }
}

