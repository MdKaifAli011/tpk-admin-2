"use client";
import React from "react";
import { FaTrash, FaEye, FaLock, FaEnvelope, FaPhone, FaGlobe, FaUser, FaCalendarAlt } from "react-icons/fa";
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

  // Helper function to format date for mobile (shorter)
  const formatDateShort = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Helper function to get status badge color with compact styling
  const getStatusBadge = (status, updateCount = 0) => {
    const statusConfig = {
      new: { 
        bg: "bg-blue-50", 
        text: "text-blue-700", 
        label: "New"
      },
      updated: {
        bg: "bg-purple-50",
        text: "text-purple-700",
        label: updateCount > 0
          ? `Updated ${updateCount}x`
          : "Updated"
      },
      contacted: {
        bg: "bg-amber-50",
        text: "text-amber-700",
        label: "Contacted"
      },
      converted: {
        bg: "bg-green-50",
        text: "text-green-700",
        label: "Converted"
      },
      archived: {
        bg: "bg-gray-50",
        text: "text-gray-700",
        label: "Archived"
      },
    };
    const config = statusConfig[status] || statusConfig.new;
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${config.bg} ${config.text}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60"></span>
        {config.label}
      </span>
    );
  };

  if (!leads || leads.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-3">
          <FaEnvelope className="w-6 h-6 text-gray-400" />
        </div>
        <h3 className="text-base font-semibold text-gray-900 mb-1">
          No Leads Found
        </h3>
        <p className="text-sm text-gray-500 max-w-sm mx-auto">
          Leads submitted from the frontend will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Country
              </th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Class
              </th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                <td className="px-2 py-2 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
                      <FaUser className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {lead.name}
                    </span>
                  </div>
                </td>
                <td className="px-2 py-2 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <FaEnvelope className="w-3 h-3 text-gray-400 flex-shrink-0" />
                    <a 
                      href={`mailto:${lead.email}`}
                      className="text-sm text-gray-600 hover:text-blue-600 transition-colors truncate max-w-[200px]"
                      title={lead.email}
                    >
                      {lead.email}
                    </a>
                  </div>
                </td>
                <td className="px-2 py-2 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <FaGlobe className="w-3 h-3 text-gray-400 flex-shrink-0" />
                    <span className="text-sm text-gray-600">{lead.country}</span>
                  </div>
                </td>
                <td className="px-2 py-2 whitespace-nowrap">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                    {lead.className}
                  </span>
                </td>
                <td className="px-2 py-2 whitespace-nowrap">
                  {lead.phoneNumber ? (
                    <div className="flex items-center gap-1.5">
                      <FaPhone className="w-3 h-3 text-gray-400 flex-shrink-0" />
                      <a 
                        href={`tel:${lead.phoneNumber}`}
                        className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
                      >
                        {lead.phoneNumber}
                      </a>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400 italic">N/A</span>
                  )}
                </td>
                <td className="px-2 py-2 whitespace-nowrap">
                  {getStatusBadge(lead.status || "new", lead.updateCount || 0)}
                </td>
                <td className="px-2 py-2 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <FaCalendarAlt className="w-3 h-3 text-gray-400 flex-shrink-0" />
                    <time className="text-sm text-gray-500" dateTime={lead.createdAt}>
                      {formatDate(lead.createdAt)}
                    </time>
                  </div>
                </td>
                <td className="px-2 py-2 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end gap-1">
                    {onView && (
                      <button
                        onClick={() => onView(lead)}
                        className="p-1.5 bg-green-50 text-green-600 rounded-lg transition-colors hover:bg-green-100"
                        title="View Lead Details"
                      >
                        <FaEye className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {onDelete && (
                      canDelete ? (
                        <button
                          onClick={() => onDelete(lead)}
                          className="p-1.5 bg-red-50 text-red-600 rounded-lg transition-colors hover:bg-red-100"
                          title="Delete Lead"
                        >
                          <FaTrash className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          disabled
                          title={getPermissionMessage("delete", role)}
                          className="p-1.5 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed"
                        >
                          <FaLock className="w-3.5 h-3.5" />
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
      <div className="md:hidden space-y-2">
        {leads.map((lead, index) => (
          <div
            key={lead._id || lead.id || index}
            className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm"
          >
            {/* Header Section */}
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <FaUser className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 mb-0.5 truncate">
                    {lead.name}
                  </h3>
                  <a 
                    href={`mailto:${lead.email}`}
                    className="text-xs text-gray-500 hover:text-blue-600 transition-colors truncate block"
                  >
                    {lead.email}
                  </a>
                </div>
              </div>
              <div className="shrink-0">
                {getStatusBadge(lead.status || "new", lead.updateCount || 0)}
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="flex items-center gap-1.5">
                <FaGlobe className="w-3 h-3 text-gray-400 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs text-gray-500">Country</div>
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {lead.country}
                  </div>
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-0.5">Class</div>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                  {lead.className}
                </span>
              </div>
              {lead.phoneNumber && (
                <div className="flex items-center gap-1.5">
                  <FaPhone className="w-3 h-3 text-gray-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs text-gray-500">Phone</div>
                    <a 
                      href={`tel:${lead.phoneNumber}`}
                      className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors"
                    >
                      {lead.phoneNumber}
                    </a>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <FaCalendarAlt className="w-3 h-3 text-gray-400 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs text-gray-500">Date</div>
                  <time className="text-sm font-medium text-gray-900" dateTime={lead.createdAt}>
                    {formatDateShort(lead.createdAt)}
                  </time>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
              {onView && (
                <button
                  onClick={() => onView(lead)}
                  className="flex-1 px-3 py-1.5 bg-green-50 text-green-600 rounded-lg transition-colors hover:bg-green-100 text-xs font-medium flex items-center justify-center gap-1.5"
                >
                  <FaEye className="w-3.5 h-3.5" />
                  View
                </button>
              )}
              {onDelete && (
                canDelete ? (
                  <button
                    onClick={() => onDelete(lead)}
                    className="flex-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg transition-colors hover:bg-red-100 text-xs font-medium flex items-center justify-center gap-1.5"
                  >
                    <FaTrash className="w-3.5 h-3.5" />
                    Delete
                  </button>
                ) : (
                  <button
                    disabled
                    title={getPermissionMessage("delete", role)}
                    className="flex-1 px-3 py-1.5 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed text-xs font-medium flex items-center justify-center gap-1.5"
                  >
                    <FaLock className="w-3.5 h-3.5" />
                    Delete
                  </button>
                )
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LeadTable;

