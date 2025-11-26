import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Lead from "@/models/Lead";
import { parsePagination, createPaginationResponse } from "@/utils/pagination";
import {
  successResponse,
  errorResponse,
  handleApiError,
} from "@/utils/apiResponse";
import { requireAuth } from "@/middleware/authMiddleware";

export async function GET(request) {
  try {
    const authCheck = await requireAuth(request);
    if (authCheck.error) {
      return NextResponse.json(authCheck, { status: authCheck.status || 401 });
    }

    await connectDB();
    const { searchParams } = new URL(request.url);

    const { page, limit, skip } = parsePagination(searchParams);
    const countryFilter = searchParams.get("country");
    const classNameFilter = searchParams.get("className");
    const statusFilter = searchParams.get("status");
    const searchQuery = searchParams.get("search");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

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

    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) {
        query.createdAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        query.createdAt.$lte = endDate;
      }
    }

    const total = await Lead.countDocuments(query);
    const leads = await Lead.find(query)
      .sort({ createdAt: -1 })
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

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();

    if (!body.name?.trim()) {
      return errorResponse("Name is required", 400);
    }

    if (!body.email?.trim()) {
      return errorResponse("Email is required", 400);
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(body.email)) {
      return errorResponse("Please provide a valid email address", 400);
    }

    if (!body.country?.trim()) {
      return errorResponse("Country is required", 400);
    }

    if (!body.className?.trim()) {
      return errorResponse("Class name is required", 400);
    }

    if (!body.phoneNumber?.trim()) {
      return errorResponse("Phone number is required", 400);
    }

    const email = body.email.toLowerCase().trim();
    const existingLead = await Lead.findOne({ email });

    let lead;
    let message;
    let isUpdated = false;
    let previousStatus = null;

    if (existingLead) {
      previousStatus = existingLead.status;
      const newUpdateCount = (existingLead.updateCount || 0) + 1;

      lead = await Lead.findOneAndUpdate(
        { email },
        {
          name: body.name.trim(),
          country: body.country.trim(),
          className: body.className.trim(),
          phoneNumber: body.phoneNumber.trim(),
          status: "updated",
          updateCount: newUpdateCount,
        },
        { new: true, runValidators: true }
      );

      message = `Lead updated successfully. This is update #${newUpdateCount}.`;
      isUpdated = true;
    } else {
      lead = await Lead.create({
      name: body.name.trim(),
        email,
      country: body.country.trim(),
      className: body.className.trim(),
        phoneNumber: body.phoneNumber.trim(),
        status: "new",
        updateCount: 0,
    });
      message = "Lead submitted successfully";
    }

    const responseData = {
      ...lead.toObject(),
      isUpdated,
      previousStatus: previousStatus || null,
    };

    return successResponse(responseData, message, isUpdated ? 200 : 201);
  } catch (error) {
    return handleApiError(error, "Failed to submit lead");
  }
}

