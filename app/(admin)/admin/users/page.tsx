"use client";

import FullScreenLoader from '@/components/ui/FullScreenLoader';
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { useDebounce } from "@/hooks/useDebounce";
import { usePermissions } from "@/hooks/usePermissions";
import { supabase } from "@/lib/supabaseClient";
import { GlobalTable, GlobalPagination, ColumnDef } from '@/components/ui/GlobalTable';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  cohort: string;
  status: string;
  lastLogin: string;
}

interface PendingDeactivation {
  userId: string;
  userEmail: string;
}

interface PendingPasswordReset {
  userId: string;
  userEmail: string;
}

interface ResetSuccessInfo {
  email: string;
  tempPass: string;
}

export default function AdminUsersPage() {
  const router = useRouter();
  
  // Security Bouncer Hook
  const { manageUsers, isLoading: isPermissionsLoading } = usePermissions();

  const [userSearch, setUserSearch] = useState("");
  const debouncedUserSearch = useDebounce(userSearch, 300);

  const [cohortFilter, setCohortFilter] = useState("All Cohorts");
  const [roleFilter, setRoleFilter] = useState("All Roles");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [dbCohorts, setDbCohorts] = useState<string[]>([]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const USERS_PER_PAGE = 10;

  
  // Dynamic Loading States
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Loading users...");

  // Safety Modal & Countdown States - Deactivation
  const [pendingDeactivation, setPendingDeactivation] = useState<PendingDeactivation | null>(null);
  const [deactivateCountdown, setDeactivateCountdown] = useState(5);

  // Safety Modal & Countdown States - Password Reset
  const [pendingPasswordReset, setPendingPasswordReset] = useState<PendingPasswordReset | null>(null);
  const [resetCountdown, setResetCountdown] = useState(5);
  const [resetSuccessInfo, setResetSuccessInfo] = useState<ResetSuccessInfo | null>(null);
  const [hasCopiedPassword, setHasCopiedPassword] = useState(false);

  // Deactivate Countdown Timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (pendingDeactivation && deactivateCountdown > 0) {
      timer = setTimeout(() => {
        setDeactivateCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [pendingDeactivation, deactivateCountdown]);

  // Reset Password Countdown Timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (pendingPasswordReset && resetCountdown > 0) {
      timer = setTimeout(() => {
        setResetCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [pendingPasswordReset, resetCountdown]);

  // Security Redirection
  useEffect(() => {
    if (!isPermissionsLoading && !manageUsers) {
      router.push("/dashboard"); 
    }
  }, [isPermissionsLoading, manageUsers, router]);

  useEffect(() => {
    const fetchUsersAndCohorts = async () => {
      if (isPermissionsLoading || !manageUsers) return;

      setIsLoading(true);
      setLoadingMessage("Fetching directory data...");

      const [usersResponse, cohortsResponse] = await Promise.all([
        supabase.from("Users").select(`
          *,
          Cohorts (
            cohort_name
          )
        `),
        supabase
          .from("Cohorts")
          .select("cohort_name")
          .eq("account_status", "Active")
          .order("cohort_name"),
      ]);

      if (usersResponse.error) {
        console.error("Error fetching users:", usersResponse.error.message);
        setIsLoading(false);
        return;
      }

      if (cohortsResponse.data) {
        setDbCohorts(cohortsResponse.data.map((c) => c.cohort_name));
      }

      const formattedUsers = usersResponse.data.map((user: any) => {
        let roleName = "Unknown";
        let displayCohort = "N/A";

        if (user.role_id === 1) {
          roleName = "Learner / Reviewer";
          displayCohort = user.Cohorts?.cohort_name || "Unassigned";
        } else if (user.role_id === 2) {
          roleName = "Teacher / Faculty";
          displayCohort = "Multiple (Managed)";
        } else if (user.role_id === 3) {
          roleName = "Admin";
          displayCohort = "N/A";
        }

        const loginStr = user.last_login
          ? new Date(user.last_login).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "Never logged in";

        return {
          id: user.user_id,
          name: user.name,
          email: user.email,
          role: roleName,
          cohort: displayCohort,
          status: user.account_status || "Active",
          lastLogin: loginStr,
        };
      });

      setAllUsers(formattedUsers);
      setIsLoading(false);
    };

    fetchUsersAndCohorts();
  }, [isPermissionsLoading, manageUsers]);

  const filteredUsers = allUsers.filter((user) => {
    const safeSearch = (debouncedUserSearch || "").toLowerCase();
    const matchesSearch =
      user.name.toLowerCase().includes(safeSearch) ||
      user.email.toLowerCase().includes(safeSearch);
    const matchesCohort =
      cohortFilter === "All Cohorts" ||
      user.cohort === cohortFilter ||
      (user.cohort === "Multiple (Managed)" &&
        roleFilter === "Teacher / Faculty");
    const matchesRole = roleFilter === "All Roles" || user.role === roleFilter;
    return matchesSearch && matchesCohort && matchesRole;
  });

  const toggleSelectUser = (id: string) => {
    if (selectedUsers.includes(id)) {
      setSelectedUsers(selectedUsers.filter((userId) => userId !== id));
    } else {
      setSelectedUsers([...selectedUsers, id]);
    }
  };


  const columns: ColumnDef<UserProfile>[] = [
    {
      header: 'User Details',
      cell: (user) => (
        <div>
          <p className="font-bold text-slate-800">{user.name}</p>
          <p className="text-xs font-bold text-slate-500">{user.email}</p>
        </div>
      )
    },
    {
      header: 'Role',
      cell: (user) => <p className="font-bold text-slate-600">{user.role}</p>
    },
    {
      header: 'Cohort',
      className: 'hidden md:table-cell',
      headerClassName: 'hidden md:table-cell',
      cell: (user) => <p className="font-bold text-slate-600">{user.cohort}</p>
    },
    {
      header: 'Status',
      cell: (user) => (
        <Badge variant={user.status === "Active" ? "success" : "neutral"}>
          {user.status}
        </Badge>
      )
    },
    {
      header: 'Last Login',
      className: 'text-slate-500 font-bold hidden md:table-cell',
      headerClassName: 'hidden md:table-cell',
      cell: (user) => <span>{user.lastLogin}</span>
    },
    {
      header: 'Actions',
      className: 'text-right whitespace-nowrap',
      headerClassName: 'text-right',
      cell: (user) => (
        <div className="inline-flex gap-2 p-1.5 border border-slate-200 bg-slate-50 rounded-lg">
          <button
            onClick={(e) => { e.stopPropagation(); handleInitiatePasswordReset(user.id, user.email); }}
            disabled={isProcessing}
            className="px-3 py-1.5 bg-white border border-slate-200 text-xs font-bold text-blue-600 rounded hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
          >
            Reset Pass
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleInitiateStatusChange(user.id, user.status, user.email); }}
            disabled={isProcessing}
            className={`px-3 py-1.5 bg-white border border-slate-200 text-xs font-bold rounded hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50 ${user.status === "Active" ? "text-rose-600" : "text-emerald-600"}`}
          >
            {user.status === "Active" ? "Deactivate" : "Activate"}
          </button>
        </div>
      )
    }
  ];

  const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * USERS_PER_PAGE,
    currentPage * USERS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [userSearch, cohortFilter, roleFilter]);

  const toggleSelectAll = () => {
    if (
      selectedUsers.length === filteredUsers.length &&
      filteredUsers.length > 0
    ) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map((u) => u.id));
    }
  };

  const executeStatusChange = async (userId: string, newStatus: string, targetEmail: string) => {
    setLoadingMessage(`Changing status for ${targetEmail}...`);
    setIsProcessing(true);

    const { error } = await supabase
      .from("Users")
      .update({ account_status: newStatus })
      .eq("user_id", userId);

    if (!error) {
      setAllUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, status: newStatus } : user,
        ),
      );

      const { data: sessionData } = await supabase.auth.getUser();
      const adminEmail = sessionData?.user?.email || "Unknown Admin";

      await supabase.from("AuditLogs").insert([
        {
          user_email: adminEmail,
          role: "Admin",
          action: `Changed account status to ${newStatus} for user: ${targetEmail}`,
          type: "Security",
          severity: newStatus === "Inactive" ? "Warning" : "Info",
          ip_address: "Internal",
          user_agent: navigator.userAgent,
        },
      ]);
    } else {
      console.error("Error toggling status:", error.message);
    }
    
    setIsProcessing(false);
  };

  const handleInitiateStatusChange = (userId: string, currentStatus: string, targetEmail: string) => {
    if (currentStatus === "Active") {
      setPendingDeactivation({ userId, userEmail: targetEmail });
      setDeactivateCountdown(5);
    } else {
      executeStatusChange(userId, "Active", targetEmail);
    }
  };

  const handleConfirmDeactivation = async () => {
    if (!pendingDeactivation || deactivateCountdown > 0) return;
    const { userId, userEmail } = pendingDeactivation;
    setPendingDeactivation(null);
    await executeStatusChange(userId, "Inactive", userEmail);
  };

  // Trigger modal confirmation
  const handleInitiatePasswordReset = (userId: string, targetEmail: string) => {
    setPendingPasswordReset({ userId, userEmail: targetEmail });
    setResetCountdown(5);
  };

  // Perform password reset via API
  const handleConfirmPasswordReset = async () => {
    if (!pendingPasswordReset || resetCountdown > 0) return;
    const { userId, userEmail } = pendingPasswordReset;
    const defaultPassword = "malayan@2026";
    
    setPendingPasswordReset(null);
    setLoadingMessage(`Resetting password for ${userEmail}...`);
    setIsProcessing(true);

    try {
      const { data: sessionData } = await supabase.auth.getUser();
      const adminEmail = sessionData?.user?.email || "Unknown Admin";
      const response = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          newPassword: defaultPassword,
          adminEmail,
          targetEmail: userEmail,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setHasCopiedPassword(false);
      setResetSuccessInfo({ email: userEmail, tempPass: defaultPassword });
    } catch (error: any) {
      console.error("Failed to reset password:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyPassword = () => {
    if (!resetSuccessInfo) return;
    navigator.clipboard.writeText(resetSuccessInfo.tempPass);
    setHasCopiedPassword(true);
    setTimeout(() => setHasCopiedPassword(false), 2000);
  };

  if (isPermissionsLoading || !manageUsers) {
    return <div className="p-12 text-center text-slate-500 font-bold mt-20">Verifying security clearance...</div>;
  }

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Global User Directory
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-bold">
            Manage all platform accounts, roles, and access statuses.
          </p>
        </div>
        <button
          onClick={() => router.push("/admin/users/add")}
          className="px-6 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm whitespace-nowrap"
        >
          + Add New User
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex flex-col gap-4">
          <h3 className="font-bold text-slate-700">Filter Directory</h3>
          <div className="flex flex-col md:flex-row gap-3 w-full">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search by name or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-4 pr-4 py-2 border border-slate-300 rounded-lg text-sm font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white md:w-48"
            >
              <option value="All Roles">All Roles</option>
              <option value="Learner / Reviewer">Learner / Reviewer</option>
              <option value="Teacher / Faculty">Teacher / Faculty</option>
              <option value="Admin">Admin</option>
            </select>
            <select
              value={cohortFilter}
              onChange={(e) => setCohortFilter(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white md:w-56"
            >
              <option value="All Cohorts">All Cohorts</option>
              {dbCohorts.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
              <option value="Unassigned">Unassigned (Learners)</option>
              <option value="Multiple (Managed)">Multiple (Teachers)</option>
              <option value="N/A">N/A (Admins)</option>
            </select>
          </div>
        </div>

        {selectedUsers.length > 0 && (
          <div className="bg-blue-50 px-6 py-3 flex items-center justify-between border-b border-blue-100">
            <span className="text-sm font-bold text-blue-800">
              {selectedUsers.length} users selected
            </span>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 bg-white border border-blue-200 text-blue-700 text-xs font-bold rounded hover:bg-blue-100 transition-colors shadow-sm">
                Bulk Password Reset
              </button>
              <button className="px-3 py-1.5 bg-white border border-blue-200 text-rose-600 text-xs font-bold rounded hover:bg-rose-50 transition-colors shadow-sm">
                Bulk Deactivate
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <GlobalTable
            data={paginatedUsers}
            columns={columns}
            enableCheckboxes={true}
            selectedIds={selectedUsers}
            onSelectionChange={toggleSelectUser}
            onSelectAll={toggleSelectAll}
            keyExtractor={(item) => item.id}
            isLoading={isLoading}
            loadingMessage="Loading users..."
            emptyMessage="We could not find any users matching your current search criteria. Try adjusting your filters."
            emptyTitle="No matching users"
          />
          {filteredUsers.length > 0 && !isLoading && (
            <GlobalPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={allUsers.length}
              itemsPerPage={USERS_PER_PAGE}
              onPageChange={setCurrentPage}
              filteredItemsCount={filteredUsers.length}
            />
          )}</div>
      </div>

      {/* Mandatory Deactivation Confirmation Modal with 5s Timer */}
      {pendingDeactivation && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <h3 className="text-lg font-bold text-slate-800 mb-2">Deactivate Account?</h3>
            <p className="text-sm text-slate-600 font-bold mb-4">
              Are you sure you want to deactivate <span className="text-slate-900 font-extrabold">{pendingDeactivation.userEmail}</span>?
            </p>
            <p className="text-xs text-rose-600 font-bold bg-rose-50 border border-rose-200 rounded-lg p-3 mb-6 text-left">
              Deactivated users are immediately barred from signing in, submitting assessments, and accessing learning materials.
            </p>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setPendingDeactivation(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeactivation}
                disabled={deactivateCountdown > 0}
                className="min-w-[170px] px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 text-white text-sm font-bold rounded-lg transition-colors shadow-sm disabled:cursor-not-allowed"
              >
                {deactivateCountdown > 0 ? `Confirm in ${deactivateCountdown}s` : "Confirm Deactivation"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mandatory Password Reset Confirmation Modal with 5s Timer */}
      {pendingPasswordReset && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            
            <h3 className="text-lg font-bold text-slate-800 mb-2">Reset Account Password?</h3>
            <p className="text-sm text-slate-600 font-bold mb-4">
              Reset login credentials for <span className="text-slate-900 font-extrabold">{pendingPasswordReset.userEmail}</span>?
            </p>
            <p className="text-xs text-amber-800 font-bold bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6 text-left">
              The user’s current password will be invalidated and replaced with the system standard temporary password (<code className="font-mono font-black text-amber-950">malayan@2026</code>).
            </p>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setPendingPasswordReset(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPasswordReset}
                disabled={resetCountdown > 0}
                className="min-w-[170px] px-5 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 text-white text-sm font-bold rounded-lg transition-colors shadow-sm disabled:cursor-not-allowed"
              >
                {resetCountdown > 0 ? `Confirm in ${resetCountdown}s` : "Confirm Password Reset"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Reset Success Modal */}
      {resetSuccessInfo && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h3 className="text-lg font-bold text-slate-800 mb-2">Password Reset Successful</h3>
            <p className="text-sm text-slate-600 font-bold mb-4">
              Credentials for <span className="text-slate-900 font-extrabold">{resetSuccessInfo.email}</span> have been reset.
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 flex items-center justify-between">
              <div className="text-left">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Temporary Password</span>
                <span className="font-mono text-base font-black text-slate-800">{resetSuccessInfo.tempPass}</span>
              </div>
              <button
                type="button"
                onClick={handleCopyPassword}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700 rounded-lg shadow-sm transition-colors"
              >
                {hasCopiedPassword ? "Copied! ✓" : "Copy"}
              </button>
            </div>

            <button
              type="button"
              onClick={() => setResetSuccessInfo(null)}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors shadow-sm"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* FullScreenLoader Component */}
      <FullScreenLoader 
        isOpen={isLoading || isProcessing} 
        message={loadingMessage} 
      />
    </div>
  );
}