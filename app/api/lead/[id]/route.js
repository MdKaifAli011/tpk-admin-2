import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Lead from "@/models/Lead";
import {
  successResponse,
  errorResponse,
  handleApiError,
} from "@/utils/apiResponse";
import { requireUserManagement } from "@/middleware/authMiddleware";

// ✅ DELETE: Delete a lead (admin only)
export async function DELETE(request, { params }) {
  try {
    // Check authentication and permissions (only admin can delete leads)
    const authCheck = await requireUserManagement(request);
    if (authCheck.error) {
      return NextResponse.json(authCheck, { status: authCheck.status || 403 });
    }

    await connectDB();
    const { id } = await params;

    if (!id) {
      return errorResponse("Lead ID is required", 400);
    }

    // Find and delete the lead
    const lead = await Lead.findByIdAndDelete(id);

    if (!lead) {
      return errorResponse("Lead not found", 404);
    }

    return successResponse(null, "Lead deleted successfully", 200);
  } catch (error) {
    return handleApiError(error, "Failed to delete lead");
  }
}

