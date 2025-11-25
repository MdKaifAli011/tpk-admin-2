import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import DefinitionDetails from "@/models/DefinitionDetails";
import Definition from "@/models/Definition";
import mongoose from "mongoose";
import {
  successResponse,
  errorResponse,
  handleApiError,
  notFoundResponse,
} from "@/utils/apiResponse";
import { ERROR_MESSAGES } from "@/constants";
import { requireAuth, requireAction } from "@/middleware/authMiddleware";

// ---------- GET DEFINITION DETAILS ----------
export async function GET(request, { params }) {
  try {
    // Check authentication (all authenticated users can view)
    const authCheck = await requireAuth(request);
    if (authCheck.error) {
      return NextResponse.json(authCheck, { status: authCheck.status || 401 });
    }

    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse("Invalid definition ID", 400);
    }

    // Check if definition exists
    const definition = await Definition.findById(id);
    if (!definition) {
      return notFoundResponse(ERROR_MESSAGES.DEFINITION_NOT_FOUND);
    }

    // Find or create details
    let details = await DefinitionDetails.findOne({ definitionId: id }).lean();
    
    // If no details exist, return empty defaults
    if (!details) {
      details = {
        definitionId: id,
        content: "",
        title: "",
        metaDescription: "",
        keywords: "",
        status: "draft",
      };
    }

    return successResponse(details);
  } catch (error) {
    return handleApiError(error, ERROR_MESSAGES.FETCH_FAILED);
  }
}

// ---------- CREATE OR UPDATE DEFINITION DETAILS ----------
export async function PUT(request, { params }) {
  try {
    // Check authentication and permissions
    const authCheck = await requireAction(request, "PUT");
    if (authCheck.error) {
      return NextResponse.json(authCheck, { status: authCheck.status || 403 });
    }

    await connectDB();
    const { id } = await params;
    const body = await request.json();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse("Invalid definition ID", 400);
    }

    // Check if definition exists
    const definition = await Definition.findById(id);
    if (!definition) {
      return notFoundResponse(ERROR_MESSAGES.DEFINITION_NOT_FOUND);
    }

    const { content, title, metaDescription, keywords, status } = body;

    // Prepare update data
    const updateData = {
      definitionId: id,
      content: content || "",
      title: title || "",
      metaDescription: metaDescription || "",
      keywords: keywords || "",
      status: status || "draft",
    };

    // Use upsert to create or update
    const details = await DefinitionDetails.findOneAndUpdate(
      { definitionId: id },
      { $set: updateData },
      { new: true, upsert: true, runValidators: true }
    ).lean();

    return successResponse(details, "Definition details saved successfully");
  } catch (error) {
    return handleApiError(error, ERROR_MESSAGES.UPDATE_FAILED);
  }
}

// ---------- DELETE DEFINITION DETAILS ----------
export async function DELETE(request, { params }) {
  try {
    // Check authentication and permissions
    const authCheck = await requireAction(request, "DELETE");
    if (authCheck.error) {
      return NextResponse.json(authCheck, { status: authCheck.status || 403 });
    }

    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse("Invalid definition ID", 400);
    }

    const deleted = await DefinitionDetails.findOneAndDelete({ definitionId: id });
    
    if (!deleted) {
      return notFoundResponse("Definition details not found");
    }

    return successResponse(deleted, "Definition details deleted successfully");
  } catch (error) {
    return handleApiError(error, ERROR_MESSAGES.DELETE_FAILED);
  }
}

