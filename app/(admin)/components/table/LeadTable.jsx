"use client";
import React from "react";
import { FaTrash, FaEye, FaLock } from "react-icons/fa";
import { usePermissions, getPermissionMessage } from "../../hooks/usePermissions";

const LeadTable = ({ leads, onView, onDelete }) => {
  const { canDelete, role } = usePermissions();

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Helper function to truncate text
  const truncateText = (text, maxLength = 50) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  // Helper function to get status badge color
  const getStatusBadge = (status) => {
    const statusConfig = {
      new: { bg: "bg-blue-100", text: "text-blue-800", label: "New" },
      contacted: {
        bg: "bg-yellow-100",
        text: "text-yellow-800",
        label: "Contacted",
      },
      converted: {
        bg: "bg-green-100",
        text: "text-green-800",
        label: "Converted",
      },
      archived: {
        bg: "bg-gray-100",
        text: "text-gray-800",
        label: "Archived",
      },
    };
    const config = statusConfig[status] || statusConfig.new;
    return (
      <span
        className={`px-2 py-0.5 rounded-full text-sm font-medium ${config.bg} ${config.text}`}
      >
        {config.label}
      </span>
    );
  };

  if (!leads || leads.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="text-gray-400 text-5xl mb-3">📋</div>
        <h3 className="text-sm font-semibold text-gray-900 mb-1">
          No Leads Found
        </h3>
        <p className="text-sm text-gray-500">
          Leads submitted from the frontend will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 table-fixed">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                Name
              </th>
              <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                Email
              </th>
              <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                Country
              </th>
              <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                Class Name
              </th>
              <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-36">
                Phone Number
              </th>
              <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Message
              </th>
              <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                Status
              </th>
              <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                Date
              </th>
              <th className="px-2 py-1 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {leads.map((lead, index) => (
              <tr
                key={lead._id || lead.id || index}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-2 py-1 whitespace-nowrap w-32">
                  <div className="text-sm font-medium text-gray-900">
                    {lead.name}
                  </div>
                </td>
                <td className="px-2 py-1 whitespace-nowrap w-48">
                  <div className="text-sm text-gray-600">{lead.email}</div>
                </td>
                <td className="px-2 py-1 whitespace-nowrap w-28">
                  <div className="text-sm text-gray-600">{lead.country}</div>
                </td>
                <td className="px-2 py-1 whitespace-nowrap w-32">
                  <div className="text-sm text-gray-600">{lead.className}</div>
                </td>
                <td className="px-2 py-1 whitespace-nowrap w-36">
                  <div className="text-sm text-gray-600">
                    {lead.phoneNumber || (
                      <span className="text-gray-400 italic">N/A</span>
                    )}
                  </div>
                </td>
                <td className="px-2 py-1">
                  <div
                    className="text-sm text-gray-600 max-w-xs truncate"
                    title={lead.message}
                  >
                    {truncateText(lead.message, 50)}
                  </div>
                </td>
                <td className="px-2 py-1 whitespace-nowrap w-24">
                  {getStatusBadge(lead.status || "new")}
                </td>
                <td className="px-2 py-1 whitespace-nowrap w-40">
                  <div className="text-sm text-gray-500">
                    {formatDate(lead.createdAt)}
                  </div>
                </td>
                <td className="px-2 py-1 whitespace-nowrap text-right w-32">
                  <div className="flex items-center justify-end gap-1">
                    {onView && (
                      <button
                        onClick={() => onView(lead)}
                        className="p-1 bg-green-50 text-green-600 rounded-lg transition-colors hover:bg-green-100"
                        title="View Lead Details"
                      >
                        <FaEye className="text-sm" />
                      </button>
                    )}
                    {onDelete && (
                      canDelete ? (
                        <button
                          onClick={() => onDelete(lead)}
                          className="p-1 bg-red-50 text-red-600 rounded-lg transition-colors hover:bg-red-100"
                          title="Delete Lead"
                        >
                          <FaTrash className="text-sm" />
                        </button>
                      ) : (
                        <button
                          disabled
                          title={getPermissionMessage("delete", role)}
                          className="p-1 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed"
                        >
                          <FaLock className="text-sm" />
                        </button>
                      )
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile/Tablet View */}
      <div className="md:hidden divide-y divide-gray-200">
        {leads.map((lead, index) => (
          <div
            key={lead._id || lead.id || index}
            className="p-1.5 hover:bg-gray-50 transition-colors"
          >
            <div className="space-y-3">
              {/* Header with Name and Status */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">
                    {lead.name}
                  </h3>
                  <div className="text-sm text-gray-600 mb-1">{lead.email}</div>
                </div>
                <div className="flex-shrink-0">
                  {getStatusBadge(lead.status || "new")}
                </div>
              </div>

              {/* Details */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-1">
                  <span className="text-gray-500 font-medium">Country:</span>
                  <span className="text-gray-900">{lead.country}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-gray-500 font-medium">Class:</span>
                  <span className="text-gray-900">{lead.className}</span>
                </div>
                {lead.phoneNumber && (
                  <div className="flex items-center gap-1">
                    <span className="text-gray-500 font-medium">Phone:</span>
                    <span className="text-gray-900">{lead.phoneNumber}</span>
                  </div>
                )}
                <div>
                  <span className="text-gray-500 font-medium">Message:</span>
                  <p className="text-gray-900 mt-1">{lead.message}</p>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-gray-500 font-medium">Date:</span>
                  <span className="text-gray-900">
                    {formatDate(lead.createdAt)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 pt-2 border-t border-gray-200">
                {onView && (
                  <button
                    onClick={() => onView(lead)}
                    className="flex-1 px-3 py-1.5 bg-green-50 text-green-600 rounded-lg transition-colors hover:bg-green-100 text-sm font-medium flex items-center justify-center gap-1"
                  >
                    <FaEye className="text-sm" />
                    View
                  </button>
                )}
                {onDelete && (
                  canDelete ? (
                    <button
                      onClick={() => onDelete(lead)}
                      className="flex-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg transition-colors hover:bg-red-100 text-sm font-medium flex items-center justify-center gap-1"
                    >
                      <FaTrash className="text-sm" />
                      Delete
                    </button>
                  ) : (
                    <button
                      disabled
                      title={getPermissionMessage("delete", role)}
                      className="flex-1 px-3 py-1.5 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed text-sm font-medium flex items-center justify-center gap-1"
                    >
                      <FaLock className="text-sm" />
                      Delete
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LeadTable;

