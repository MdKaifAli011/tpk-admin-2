import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Lead from "@/models/Lead";
import { parsePagination, createPaginationResponse } from "@/utils/pagination";
import {
  successResponse,
  errorResponse,
  handleApiError,
} from "@/utils/apiResponse";
import { requireAuth, requireUserManagement } from "@/middleware/authMiddleware";

// ✅ GET: Fetch all leads with pagination and filters
export async function GET(request) {
  try {
    // Check authentication (all authenticated users can view leads)
    const authCheck = await requireAuth(request);
    if (authCheck.error) {
      return NextResponse.json(authCheck, { status: authCheck.status || 401 });
    }

    await connectDB();
    const { searchParams } = new URL(request.url);

    // Parse pagination
    const { page, limit, skip } = parsePagination(searchParams);

    // Get filters
    const countryFilter = searchParams.get("country");
    const classNameFilter = searchParams.get("className");
    const statusFilter = searchParams.get("status");
    const searchQuery = searchParams.get("search");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    // Build query
    const query = {};

    if (countryFilter) {
      query.country = { $regex: countryFilter, $options: "i" };
    }

    if (classNameFilter) {
      query.className = { $regex: classNameFilter, $options: "i" };
    }

    if (statusFilter && statusFilter !== "all") {
      query.status = statusFilter.toLowerCase();
    }

    if (searchQuery) {
      query.$or = [
        { name: { $regex: searchQuery, $options: "i" } },
        { email: { $regex: searchQuery, $options: "i" } },
        { phoneNumber: { $regex: searchQuery, $options: "i" } },
      ];
    }

    // Date range filter
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) {
        query.createdAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        // Add one day to include the entire end date
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        query.createdAt.$lte = endDate;
      }
    }

    // Get total count
    const total = await Lead.countDocuments(query);

    // Fetch leads with pagination
    const leads = await Lead.find(query)
      .sort({ createdAt: -1 }) // Newest first
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json(
      createPaginationResponse(leads, total, page, limit)
    );
  } catch (error) {
    return handleApiError(error, "Failed to fetch leads");
  }
}

// ✅ POST: Create new lead (public, no authentication required)
export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();

    // Validate required fields
    if (!body.name || body.name.trim() === "") {
      return errorResponse("Name is required", 400);
    }

    if (!body.email || body.email.trim() === "") {
      return errorResponse("Email is required", 400);
    }

    // Validate email format
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(body.email)) {
      return errorResponse("Please provide a valid email", 400);
    }

    if (!body.country || body.country.trim() === "") {
      return errorResponse("Country is required", 400);
    }

    if (!body.className || body.className.trim() === "") {
      return errorResponse("Class name is required", 400);
    }

    if (!body.message || body.message.trim() === "") {
      return errorResponse("Message is required", 400);
    }

    // Check if lead with this email already exists
    const existingLead = await Lead.findOne({
      email: body.email.toLowerCase().trim(),
    });

    if (existingLead) {
      return errorResponse("Lead with this email already exists", 409);
    }

    // Create new lead
    const newLead = await Lead.create({
      name: body.name.trim(),
      email: body.email.toLowerCase().trim(),
      country: body.country.trim(),
      className: body.className.trim(),
      phoneNumber: body.phoneNumber ? body.phoneNumber.trim() : undefined,
      message: body.message.trim(),
      status: "new", // Default status
    });

    return successResponse(newLead, "Lead submitted successfully", 201);
  } catch (error) {
    // Handle duplicate email error
    if (error.code === 11000) {
      return errorResponse("Lead with this email already exists", 409);
    }
    return handleApiError(error, "Failed to submit lead");
  }
}

