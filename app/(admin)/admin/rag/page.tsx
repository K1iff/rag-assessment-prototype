'use client';

import FullScreenLoader from '@/components/ui/FullScreenLoader';
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useIngestion } from '@/hooks/useIngestion'; 
import { useToast } from '@/components/ui/ToastContext';
import { GlobalTable, GlobalPagination, ColumnDef } from '@/components/ui/GlobalTable';


interface DomainSetting {
  id: string;
  subject: string;
  setting_name: string;
  created_at: string;
}

const BLEPP_SUBJECTS = [
  'Industrial-Organizational Psychology',
  'Abnormal Psychology',
  'Psychological Assessment',
  'Developmental Psychology'
];

const DOCS_PER_PAGE = 10;
const SETTINGS_PER_PAGE = 10;
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB Supabase storage ceiling

export default function AdminRagPage() {
  // Top-level Navigation Switcher
  const [currentSection, setCurrentSection] = useState<'documents' | 'settings'>('documents');
  const { addToast } = useToast();

  // Document Management States
  const [activeTab, setActiveTab] = useState<'action' | 'active' | 'archive'>('action');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [adminUploadSubject, setAdminUploadSubject] = useState(BLEPP_SUBJECTS[0]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Loading knowledge base...');

  const [rejectModal, setRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [viewDetailsModal, setViewDetailsModal] = useState<any | null>(null);
  const [editModalSubject, setEditModalSubject] = useState(BLEPP_SUBJECTS[0]);
  const [isUpdatingSubject, setIsUpdatingSubject] = useState(false);
  
  // Document Search & Pagination
  const [docSearchQuery, setDocSearchQuery] = useState('');
  const [docPage, setDocPage] = useState(1);

  // Destructive Document Archive Modal + 5s Timer
  const [deleteModal, setDeleteModal] = useState<{ id: string, title: string, path: string, status: string } | null>(null);
  const [archiveCountdown, setArchiveCountdown] = useState(5);

  // Domain Settings States
  const [domainSettings, setDomainSettings] = useState<DomainSetting[]>([]);
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('All');
  const [isSettingsLoading, setIsSettingsLoading] = useState(false);
  const [showAddSettingModal, setShowAddSettingModal] = useState(false);
  const [newSettingSubject, setNewSettingSubject] = useState(BLEPP_SUBJECTS[0]);
  const [newSettingName, setNewSettingName] = useState('');
  const [isSubmittingSetting, setIsSubmittingSetting] = useState(false);
  const [settingActionError, setSettingActionError] = useState('');
  const [settingPage, setSettingPage] = useState(1);

  // Destructive Domain Setting Delete Modal + 5s Timer
  const [deleteSettingModal, setDeleteSettingModal] = useState<DomainSetting | null>(null);
  const [settingDeleteCountdown, setSettingDeleteCountdown] = useState(5);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

  // Centralized Audit Logging
  const logAuditAction = async (actionDesc: string, type: string = 'Document Uploads', severity: string = 'Info') => {
    try {
      const { data: sessionData } = await supabase.auth.getUser();
      const adminEmail = sessionData?.user?.email || 'Unknown Admin';

      await supabase.from('AuditLogs').insert([
        {
          user_email: adminEmail,
          role: 'Admin',
          action: actionDesc,
          type,
          severity,
          ip_address: 'Internal',
          user_agent: navigator.userAgent
        }
      ]);
    } catch (err) {
      console.error('AuditLog insert failed:', err);
    }
  };

  // 5-second countdown timer effect for Document Archive
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (deleteModal && archiveCountdown > 0) {
      timer = setTimeout(() => {
        setArchiveCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [deleteModal, archiveCountdown]);

  // 5-second countdown timer effect for Setting Deletion
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (deleteSettingModal && settingDeleteCountdown > 0) {
      timer = setTimeout(() => {
        setSettingDeleteCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [deleteSettingModal, settingDeleteCountdown]);

  // Restore active document tab on mount
  useEffect(() => {
    const savedTab = localStorage.getItem('adminRagTab') as 'action' | 'active' | 'archive';
    if (savedTab) setActiveTab(savedTab);
  }, []);

  const handleTabChange = (tab: 'action' | 'active' | 'archive') => {
    setActiveTab(tab);
    setDocPage(1);
    localStorage.setItem('adminRagTab', tab);
  };

  // Fetch Material Requests
  const fetchRequests = async (silent = false) => {
    if (!silent) {
      setIsLoading(true);
      setLoadingMessage('Loading knowledge base documents...');
    }
    const { data, error } = await supabase
      .from('Material Requests')
      .select('*, faculty:Users(name, email)')
      .order('created_at', { ascending: false });

    if (!error && data) setRequests(data);
    if (!silent) setIsLoading(false);
  };

  // Persistent background polling: If any file is in 'Processing' status, keep polling
  useEffect(() => {
    const hasProcessing = requests.some(r => r.status === 'Processing');
    if (!hasProcessing) return;

    const interval = setInterval(() => {
      fetchRequests(true);
    }, 3500);

    return () => clearInterval(interval);
  }, [requests]);

  // Fetch Domain Settings
  const fetchDomainSettings = async () => {
    setIsSettingsLoading(true);
    const { data, error } = await supabase
      .from('Domain_Settings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("[Domain_Settings Fetch Error]:", error);
    } else if (data) {
      setDomainSettings(data);
    }
    setIsSettingsLoading(false);
  };

  useEffect(() => {
    fetchRequests();
    fetchDomainSettings();
  }, []);

  const { startIngestion, status: ingestionStatus, progressDetails } = useIngestion({
    onSuccess: () => fetchRequests()
  });

  const actionRequired = useMemo(() => requests.filter(r => r.status === 'Pending Admin Approval'), [requests]);
  const activeFiles = useMemo(() => requests.filter(r => r.status === 'Approved & Indexed' || r.status === 'Processing'), [requests]);
  const archivedFiles = useMemo(() => requests.filter(r => ['Archived', 'Rejected', 'Deleted by Admin', 'File Purged'].includes(r.status)), [requests]);

  // Files currently undergoing active ingestion (handles page reload persistence)
  const processingFiles = useMemo(() => requests.filter(r => r.status === 'Processing'), [requests]);

  const getBaseVisibleFiles = () => {
    if (activeTab === 'action') return actionRequired;
    if (activeTab === 'active') return activeFiles;
    return archivedFiles;
  };

  // Search filter for documents
  const filteredDocFiles = useMemo(() => {
    const list = getBaseVisibleFiles();
    if (!docSearchQuery.trim()) return list;
    const q = docSearchQuery.toLowerCase();

    return list.filter((file) => {
      const matchTitle = (file.title || '').toLowerCase().includes(q);
      const matchFileName = (file.file_name || '').toLowerCase().includes(q);
      const matchSubject = (file.subject || file.tags?.[0] || '').toLowerCase().includes(q);
      const matchFacultyName = (file.faculty?.name || '').toLowerCase().includes(q);
      const matchFacultyEmail = (file.faculty?.email || '').toLowerCase().includes(q);

      return matchTitle || matchFileName || matchSubject || matchFacultyName || matchFacultyEmail;
    });
  }, [activeTab, requests, docSearchQuery]);

  // Paginated Document Slices
  const totalDocPages = Math.max(1, Math.ceil(filteredDocFiles.length / DOCS_PER_PAGE));
  const paginatedDocFiles = useMemo(() => {
    const start = (docPage - 1) * DOCS_PER_PAGE;
    return filteredDocFiles.slice(start, start + DOCS_PER_PAGE);
  }, [filteredDocFiles, docPage]);

  // Reset page when search or tab changes
  useEffect(() => {
    setDocPage(1);
  }, [docSearchQuery, activeTab]);

  // Client-Side File Size Validation Guard
  const validateAndSetFile = (file: File): boolean => {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      const errorMsg = `File size (${sizeMB} MB) exceeds the 50 MB storage limit. Please compress the file or choose a smaller document.`;
      setUploadError(errorMsg);
      addToast(errorMsg, 'error');
      setSelectedFile(null);
      return false;
    }
    setUploadError('');
    setSelectedFile(file);
    return true;
  };

  const handleReview = async (path: string) => {
    if (!path) {
      addToast('No storage path found for this document.', 'error');
      return;
    }

    try {
      let { data, error } = await supabase.storage.from('textbooks').createSignedUrl(path, 60);

      if (error || !data?.signedUrl) {
        let alternatePath = '';
        if (path.startsWith('pending/')) {
          alternatePath = path.replace('pending/', 'indexed/');
        } else if (path.startsWith('indexed/')) {
          alternatePath = path.replace('indexed/', 'pending/');
        }

        if (alternatePath) {
          const retry = await supabase.storage.from('textbooks').createSignedUrl(alternatePath, 60);
          if (retry.data?.signedUrl) {
            data = retry.data;
            error = null;
          }
        }
      }

      if (error || !data?.signedUrl) {
        addToast('Could not load file. It may have been deleted or purged from storage.', 'error');
        return;
      }

      window.open(data.signedUrl, '_blank');
    } catch (err: any) {
      addToast(err.message || 'Error generating secure document link.', 'error');
    }
  };

  const handleApproveAndProcess = async (requestId: string, filePath: string, subject: string, fileName?: string) => {
    await supabase.from('Material Requests').update({ status: 'Processing' }).eq('id', requestId);
    await logAuditAction(`Approved and initiated ingestion for material request: "${fileName || filePath}" (${subject})`, 'Document Uploads', 'Info');
    fetchRequests(true); 
    await startIngestion(requestId, filePath, [subject]);
  };

  const executeReject = async () => {
    if (!rejectModal) return;
    const targetFile = requests.find(r => r.id === rejectModal);
    const finalReason = rejectReason || 'File did not meet formatting requirements.';

    await supabase.from('Material Requests').update({ 
      status: 'Rejected',
      reject_reason: finalReason
    }).eq('id', rejectModal);
    
    await logAuditAction(`Rejected material request "${targetFile?.title || 'Unknown'}" (Reason: ${finalReason})`, 'Document Uploads', 'Warning');

    fetchRequests();
    setRejectModal(null);
    setRejectReason('');
  };

  // Archive & Purge Handler
  const executeAdminArchive = async () => {
    if (!deleteModal || archiveCountdown > 0) return;
    setLoadingMessage('Purging file vectors and archiving request...');
    setIsLoading(true);

    try {
      if (deleteModal.status === 'Approved & Indexed' || deleteModal.status === 'Processing') {
        try {
          await fetch(`${API_BASE_URL}/api/v1/vectors`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ storage_path: deleteModal.path })
          });
        } catch (e) {
          console.error("FastAPI vector deletion failed:", e);
        }
      }

      if (deleteModal.path) {
        await supabase.storage.from('textbooks').remove([deleteModal.path]);
      }

      await supabase.from('Material Requests').update({ 
        status: 'Archived',
        reject_reason: 'Archived by administrator. Physical file removed and vector embeddings dropped.'
      }).eq('id', deleteModal.id);

      await logAuditAction(
        `Archived material "${deleteModal.title}": purged from storage and dropped vector embeddings`,
        'Document Uploads',
        'Warning'
      );

    } catch (err) {
      console.error("Error executing archive:", err);
    } finally {
      await fetchRequests();
      setIsLoading(false);
      setDeleteModal(null);
    }
  };

  const submitDirectAdminUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      const sizeMB = (selectedFile.size / (1024 * 1024)).toFixed(1);
      const errorMsg = `Upload blocked: File size (${sizeMB} MB) exceeds the 50 MB storage limit.`;
      setUploadError(errorMsg);
      addToast(errorMsg, 'error');
      return;
    }

    setIsUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const safeName = selectedFile.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      const filePath = `pending/admin_${Date.now()}_${safeName}`;
      
      const { error: uploadError } = await supabase.storage.from('textbooks').upload(filePath, selectedFile);
      if (uploadError) throw uploadError;

      const fileSizeMB = (selectedFile.size / (1024 * 1024)).toFixed(2);
      const { data: insertData, error: insertError } = await supabase.from('Material Requests').insert({
        faculty_id: user?.id,
        title: selectedFile.name,
        file_name: selectedFile.name,
        file_path: filePath,
        file_size_mb: fileSizeMB,
        subject: adminUploadSubject,
        tags: [adminUploadSubject],
        status: 'Processing'
      }).select().single();

      if (insertError) throw insertError;

      await logAuditAction(
        `Direct admin upload: "${selectedFile.name}" (${fileSizeMB} MB) assigned to [${adminUploadSubject}]`,
        'Document Uploads',
        'Info'
      );

      fetchRequests(true);
      setShowUploadModal(false);
      setSelectedFile(null);
      await startIngestion(insertData.id, filePath, [adminUploadSubject]);

    } catch (error) {
      setUploadError('Failed to upload the document. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Open Details Modal and sync subject state
    const columnsDocs: ColumnDef<any>[] = [
    {
      header: 'Filename and Size',
      cell: (doc) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 border border-blue-100 shadow-inner">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-slate-800 truncate">{doc.title}</span>
            <span className="text-[11px] text-slate-500 font-bold">{doc.size_bytes ? (doc.size_bytes / 1024).toFixed(1) + ' KB' : 'Unknown Size'}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Requested By',
      cell: (doc) => (
        <div className="flex flex-col min-w-0">
          <span className="font-bold text-slate-700 truncate">{doc.faculty?.name || 'Admin Upload'}</span>
          <span className="text-[10px] text-slate-500 font-bold truncate">{doc.faculty?.email || 'N/A'}</span>
        </div>
      )
    },
    {
      header: 'BLEPP Subject',
      cell: (doc) => (
        <span className="inline-block px-2.5 py-1 bg-slate-100 border border-slate-200 rounded text-[11px] font-bold text-slate-700 whitespace-nowrap">
          {doc.subject || doc.tags?.[0] || 'Uncategorized'}
        </span>
      )
    },
    {
      header: 'Pipeline Status',
      cell: (doc) => (
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center justify-center w-2 h-2 rounded-full ${doc.status === 'Available' ? 'bg-emerald-500' : doc.status === 'Processing' ? 'bg-amber-400 animate-pulse' : 'bg-slate-300'}`}></span>
          <span className={`font-bold text-xs uppercase tracking-wider ${doc.status === 'Available' ? 'text-emerald-700' : doc.status === 'Processing' ? 'text-amber-700' : 'text-slate-500'}`}>
            {doc.status}
          </span>
        </div>
      )
    },
    {
      header: 'Actions',
      className: 'text-right whitespace-nowrap',
      cell: (doc) => (
        <div className="inline-flex gap-2 justify-end w-full">
          {doc.status === 'Pending' ? (
            <>
              <button
                onClick={() => handleReview(doc.file_path)}
                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                title="Review File"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
              <button
                onClick={() => handleApproveAndProcess(doc.id, doc.file_path, doc.subject || BLEPP_SUBJECTS[0], doc.title)}
                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-transparent hover:border-emerald-100"
                title="Approve & Process"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </button>
              <button
                onClick={() => setRejectModal(doc.id)}
                className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100"
                title="Reject Request"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => handleOpenDetails(doc)}
                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                title="Inspect Document Metadata"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              {doc.status === 'Available' && (
                <button
                  onClick={() => {
                    setDeleteModal({ id: doc.id, title: doc.title, path: doc.file_path, status: doc.status });
                    setArchiveCountdown(5);
                  }}
                  className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100"
                  title="Archive Document"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                </button>
              )}
            </>
          )}
        </div>
      )
    }
  ];

  const columnsSettings: ColumnDef<any>[] = [
    {
      header: 'Setting / Operational Context',
      cell: (setting) => (
        <div className="flex flex-col min-w-0 pr-4">
          <span className="font-bold text-slate-800 line-clamp-2 leading-relaxed">{setting.description}</span>
        </div>
      )
    },
    {
      header: 'Target Subject',
      cell: (setting) => (
        <span className="inline-block px-2.5 py-1 bg-slate-100 border border-slate-200 rounded text-[11px] font-bold text-slate-700 whitespace-nowrap">
          {setting.subject || 'All Subjects'}
        </span>
      )
    },
    {
      header: 'Date Added',
      cell: (setting) => <span className="font-bold text-slate-500 text-xs">{new Date(setting.created_at).toLocaleDateString()}</span>
    },
    {
      header: 'Actions',
      className: 'text-right whitespace-nowrap',
      cell: (setting) => (
        <div className="inline-flex justify-end w-full">
          <button
            onClick={() => { setDeleteSettingModal(setting); setSettingDeleteCountdown(5); }}
            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100"
            title="Delete Setting"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      )
    }
  ];

  const handleOpenDetails = (file: any) => {
    setViewDetailsModal(file);
    const initialSubject = file.subject || (file.tags && file.tags[0]) || BLEPP_SUBJECTS[0];
    setEditModalSubject(initialSubject);
  };

  // Edit BLEPP Subject Handler
  const handleUpdateDocumentSubject = async () => {
    if (!viewDetailsModal) return;
    setIsUpdatingSubject(true);

    try {
      const { error } = await supabase
        .from('Material Requests')
        .update({
          subject: editModalSubject,
          tags: [editModalSubject]
        })
        .eq('id', viewDetailsModal.id);

      if (error) throw error;

      await logAuditAction(
        `Updated BLEPP subject for "${viewDetailsModal.title}" to [${editModalSubject}]`,
        'Document Uploads',
        'Info'
      );

      setRequests(prev => prev.map(r => r.id === viewDetailsModal.id ? {
        ...r,
        subject: editModalSubject,
        tags: [editModalSubject]
      } : r));

      setViewDetailsModal((prev: any) => ({
        ...prev,
        subject: editModalSubject,
        tags: [editModalSubject]
      }));

      addToast('BLEPP Subject successfully updated.', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to update subject.', 'error');
    } finally {
      setIsUpdatingSubject(false);
    }
  };

  // Domain Settings Actions
  const handleAddDomainSetting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSettingName.trim()) return;
    setIsSubmittingSetting(true);
    setSettingActionError('');

    try {
      const trimmedName = newSettingName.trim();
      const { error } = await supabase.from('Domain_Settings').insert({
        subject: newSettingSubject,
        setting_name: trimmedName
      });

      if (error) throw error;

      await logAuditAction(
        `Added operational vignette setting "${trimmedName}" for subject: ${newSettingSubject}`,
        'AI Engine',
        'Info'
      );

      setNewSettingName('');
      setShowAddSettingModal(false);
      fetchDomainSettings();
      addToast('Domain setting added successfully.', 'success');
    } catch (err: any) {
      setSettingActionError(err.message || 'Failed to save domain setting.');
    } finally {
      setIsSubmittingSetting(false);
    }
  };

  const executeDeleteDomainSetting = async () => {
    if (!deleteSettingModal || settingDeleteCountdown > 0) return;
    setLoadingMessage('Removing operational setting...');
    setIsSettingsLoading(true);

    const targetId = deleteSettingModal.id;
    const targetName = deleteSettingModal.setting_name;
    const targetSubject = deleteSettingModal.subject;

    const { error } = await supabase.from('Domain_Settings').delete().eq('id', targetId);
    
    if (!error) {
      setDomainSettings(prev => prev.filter(s => s.id !== targetId));

      await logAuditAction(
        `Deleted operational vignette setting "${targetName}" from subject: ${targetSubject}`,
        'AI Engine',
        'Warning'
      );
      addToast('Operational setting removed.', 'info');
    } else {
      console.error('Failed to delete setting:', error.message);
      addToast('Failed to delete setting.', 'error');
    }
    
    setIsSettingsLoading(false);
    setDeleteSettingModal(null);
  };

  const filteredDomainSettings = useMemo(() => {
    return selectedSubjectFilter === 'All'
      ? domainSettings
      : domainSettings.filter(s => s.subject === selectedSubjectFilter);
  }, [domainSettings, selectedSubjectFilter]);

  const totalSettingPages = Math.max(1, Math.ceil(filteredDomainSettings.length / SETTINGS_PER_PAGE));
  const paginatedSettings = useMemo(() => {
    const start = (settingPage - 1) * SETTINGS_PER_PAGE;
    return filteredDomainSettings.slice(start, start + SETTINGS_PER_PAGE);
  }, [filteredDomainSettings, settingPage]);

  useEffect(() => {
    setSettingPage(1);
  }, [selectedSubjectFilter]);

  return (
    <div className="space-y-6 relative pb-20">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Knowledge Base & Domain Administration</h1>
          <p className="text-sm text-slate-500 mt-1 font-bold">
            {currentSection === 'documents' 
              ? 'Review faculty material requests, search knowledge documents, and monitor vectorization status.' 
              : 'Manage operational vignette settings sampled during HOTS exam generation.'}
          </p>
        </div>

        {currentSection === 'documents' ? (
          <button 
            onClick={() => { setShowUploadModal(true); setSelectedFile(null); setUploadError(''); }} 
            className="px-6 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm whitespace-nowrap"
          >
            Direct Admin Upload
          </button>
        ) : (
          <button 
            onClick={() => { setShowAddSettingModal(true); setSettingActionError(''); }} 
            className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm whitespace-nowrap"
          >
            + Add Operational Setting
          </button>
        )}
      </div>

      {/* Top-Level Mode Selector */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setCurrentSection('documents')}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-bold border-b-2 transition-all ${
            currentSection === 'documents'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          Knowledge Base Documents
        </button>
        <button
          onClick={() => setCurrentSection('settings')}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-bold border-b-2 transition-all ${
            currentSection === 'settings'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          Domain Vignette Settings
        </button>
      </div>

      {/* SECTION 1: DOCUMENT MANAGEMENT */}
      {currentSection === 'documents' && (
        <>
          {/* Tabs and Search Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-3 mb-6">
            <div className="flex gap-4">
              <button 
                onClick={() => handleTabChange('action')} 
                className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'action' ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                Action Required ({actionRequired.length})
              </button>
              <button 
                onClick={() => handleTabChange('active')} 
                className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'active' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                Active Knowledge Base ({activeFiles.length})
              </button>
              <button 
                onClick={() => handleTabChange('archive')} 
                className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'archive' ? 'border-slate-500 text-slate-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                Archive ({archivedFiles.length})
              </button>
            </div>

            {/* Live Document Search Input */}
            <div className="relative w-full lg:w-80">
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by title, subject, or requester..."
                value={docSearchQuery}
                onChange={(e) => setDocSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 bg-white focus:outline-none focus:border-blue-500"
              />
              {docSearchQuery && (
                <button
                  type="button"
                  onClick={() => setDocSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Persistent Ingestion Progress / Auto-Recovery Banner */}
          {(ingestionStatus === 'PROCESSING' && progressDetails) ? (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between mb-6 shadow-sm animate-in fade-in">
              <div>
                <h4 className="text-sm font-bold text-blue-800 flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {progressDetails.step || 'Processing Document'}
                </h4>
                <p className="text-xs text-blue-600 mt-1">{progressDetails.details || progressDetails.message}</p>
              </div>
            </div>
          ) : processingFiles.length > 0 ? (
            <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-4 flex items-center justify-between mb-6 shadow-sm animate-in fade-in">
              <div className="flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-600"></span>
                </span>
                <div>
                  <h4 className="text-sm font-bold text-blue-900 flex items-center gap-2">
                    Background Ingestion Active ({processingFiles.length} file{processingFiles.length === 1 ? '' : 's'})
                  </h4>
                  <p className="text-xs text-blue-700 font-medium mt-0.5">
                    Currently chunking and vectorizing: <span className="font-bold">{processingFiles.map(f => f.title).join(', ')}</span>. The table updates automatically.
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {/* Documents Table */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <GlobalTable
              data={paginatedDocFiles}
              columns={columnsDocs}
              keyExtractor={(item) => item.id}
              isLoading={isLoading}
              loadingMessage="Scanning vector database..."
              emptyMessage="No documents found matching your search."
            />
            {filteredDocFiles.length > 0 && !isLoading && (
              <GlobalPagination
                currentPage={docPage}
                totalPages={Math.ceil(filteredDocFiles.length / DOCS_PER_PAGE)}
                totalItems={getBaseVisibleFiles().length}
                itemsPerPage={DOCS_PER_PAGE}
                onPageChange={setDocPage}
                filteredItemsCount={filteredDocFiles.length}
              />
            )}
          </div>
        </>
      )}

      {/* SECTION 2: DOMAIN VIGNETTE SETTINGS */}
      {currentSection === 'settings' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Filter by Domain:</span>
              <select 
                value={selectedSubjectFilter} 
                onChange={(e) => setSelectedSubjectFilter(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm font-bold text-slate-700 bg-slate-50 focus:outline-none focus:border-indigo-500"
              >
                <option value="All">All BLEPP Domains ({domainSettings.length})</option>
                {BLEPP_SUBJECTS.map((subj) => (
                  <option key={subj} value={subj}>
                    {subj} ({domainSettings.filter(s => s.subject === subj).length})
                  </option>
                ))}
              </select>
            </div>
            <p className="text-xs text-slate-500 font-bold">
              Showing {filteredDomainSettings.length} active scenario contexts
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <GlobalTable
              data={paginatedSettings}
              columns={columnsSettings}
              keyExtractor={(item) => item.id}
              isLoading={isSettingsLoading}
              loadingMessage="Loading configurations..."
              emptyMessage="No settings configured for this subject."
            />
            {filteredDomainSettings.length > 0 && !isSettingsLoading && (
              <GlobalPagination
                currentPage={settingPage}
                totalPages={Math.ceil(filteredDomainSettings.length / SETTINGS_PER_PAGE)}
                totalItems={domainSettings.length}
                itemsPerPage={SETTINGS_PER_PAGE}
                onPageChange={setSettingPage}
                filteredItemsCount={filteredDomainSettings.length}
              />
            )}
          </div>
        </div>
      )}

      {/* Add Domain Setting Modal */}
      {showAddSettingModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex justify-between items-center mb-5 border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-800">Add Operational Vignette Setting</h3>
              <button onClick={() => setShowAddSettingModal(false)} className="text-slate-400 hover:text-slate-700">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddDomainSetting} className="space-y-4">
              {settingActionError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800 font-bold">
                  {settingActionError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Target Subject / Domain
                </label>
                <select
                  value={newSettingSubject}
                  onChange={(e) => setNewSettingSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-700 focus:outline-none focus:border-indigo-500"
                >
                  {BLEPP_SUBJECTS.map((subj) => (
                    <option key={subj} value={subj}>{subj}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Setting / Workplace Context Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tertiary Hospital Ward, Corporate HR Department"
                  value={newSettingName}
                  onChange={(e) => setNewSettingName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[11px] text-slate-500 font-semibold mt-1">
                  The AI pipeline will situate vignette scenarios in this specific environment when testing HOTS items.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddSettingModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSetting || !newSettingName.trim()}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg transition-colors shadow-sm disabled:opacity-50"
                >
                  {isSubmittingSetting ? 'Saving...' : 'Save Setting'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Direct Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-slate-200">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
              <h3 className="text-xl font-bold text-slate-800">Direct Admin Upload</h3>
              <button onClick={() => !isUploading && setShowUploadModal(false)} disabled={isUploading} className="text-slate-400 hover:text-slate-700 transition-colors disabled:opacity-50"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <form onSubmit={submitDirectAdminUpload}>
              <div className="space-y-5">
                {uploadError && (<div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800 font-bold flex items-center gap-2">{uploadError}</div>)}
                
                <div 
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors relative ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'} ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }} 
                  onDragLeave={() => setDragActive(false)} 
                  onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                  onDrop={(e) => { 
                    e.preventDefault(); 
                    setDragActive(false); 
                    if (e.dataTransfer.files?.[0]) {
                      validateAndSetFile(e.dataTransfer.files[0]);
                    }
                  }}
                >
                  <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  {selectedFile ? (
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 mb-1">{selectedFile.name}</h4>
                      <div className="mt-2 mb-3 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                        <span>{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB / 50 MB</span>
                      </div>
                      <div>
                        <button type="button" onClick={() => { setSelectedFile(null); setUploadError(''); }} disabled={isUploading} className="text-xs font-bold text-red-500 hover:underline relative z-20 disabled:opacity-50">
                          Remove file
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 mb-1">Drag and drop your document</h4>
                      <p className="text-xs font-bold text-slate-500 mb-2">Upload global materials directly to the AI pending queue</p>
                      <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-bold mb-4">
                        <svg className="w-3.5 h-3.5 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span>Maximum file size: 50 MB (Supabase Storage Ceiling)</span>
                      </div>
                      <div className="flex items-center justify-center">
                        <span className="px-2 bg-slate-50 text-xs font-bold text-slate-400 uppercase relative z-10">Or</span>
                        <div className="absolute left-10 right-10 top-auto h-px bg-slate-200"></div>
                      </div>
                      <label className="mt-4 px-5 py-2 border border-slate-300 text-slate-700 text-sm font-bold rounded-lg bg-white hover:bg-slate-50 transition-colors shadow-sm relative z-20 cursor-pointer inline-block">
                        Browse Files
                        <input 
                          type="file" 
                          className="hidden" 
                          accept=".pdf,.pptx,.docx" 
                          onChange={(e) => { 
                            if (e.target.files?.[0]) {
                              validateAndSetFile(e.target.files[0]);
                            }
                          }} 
                        />
                      </label>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Target BLEPP Subject
                  </label>
                  <select
                    value={adminUploadSubject}
                    onChange={(e) => setAdminUploadSubject(e.target.value)}
                    disabled={isUploading}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-700 bg-white focus:outline-none focus:border-blue-500"
                  >
                    {BLEPP_SUBJECTS.map((subj) => (
                      <option key={subj} value={subj}>{subj}</option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button type="button" onClick={() => !isUploading && setShowUploadModal(false)} disabled={isUploading} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-lg transition-colors disabled:opacity-50">Cancel</button>
                  <button type="submit" disabled={isUploading || !selectedFile} className={`min-w-[170px] px-5 py-2.5 text-white text-sm font-bold rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2 ${isUploading || !selectedFile ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>{isUploading ? 'Uploading...' : 'Upload and Embed'}</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Reject Request</h3>
            <p className="text-sm text-slate-600 font-bold mb-4">Please provide a reason for rejecting this material request.</p>
            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="e.g. File contains corrupted text formatting." className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm font-bold focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 mb-6 min-h-[100px] resize-none" />
            <div className="flex justify-end gap-3">
              <button onClick={() => { setRejectModal(null); setRejectReason(''); }} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-lg transition-colors">Cancel</button>
              <button onClick={executeReject} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-lg transition-colors">Confirm Rejection</button>
            </div>
          </div>
        </div>
      )}

      {/* Mandatory Archive & Purge Modal with 5s Timer */}
      {deleteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>

            <h3 className="text-lg font-bold text-slate-800 mb-2">Archive Material & Drop Vectors?</h3>
            <p className="text-sm text-slate-600 font-bold mb-4">
              Are you sure you want to archive <span className="text-slate-900 font-extrabold">{deleteModal.title}</span>?
            </p>
            <p className="text-xs text-rose-600 font-bold bg-rose-50 border border-rose-200 rounded-lg p-3 mb-6 text-left">
              This action permanently purges the physical file from cloud storage and drops all corresponding document embeddings from the vector database. Future mock exams will no longer sample this reference material.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                type="button"
                onClick={() => setDeleteModal(null)} 
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={executeAdminArchive} 
                disabled={archiveCountdown > 0}
                className="min-w-[190px] px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 text-white text-sm font-bold rounded-lg transition-colors shadow-sm disabled:cursor-not-allowed"
              >
                {archiveCountdown > 0 ? `Confirm in ${archiveCountdown}s` : 'Archive & Drop Vectors'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mandatory Domain Setting Deletion Modal with 5s Timer */}
      {deleteSettingModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Delete Vignette Setting?</h3>
            <p className="text-sm text-slate-600 font-bold mb-4">
              Delete setting <span className="text-slate-900 font-extrabold">&quot;{deleteSettingModal.setting_name}&quot;</span> for domain <span className="text-indigo-600 font-extrabold">{deleteSettingModal.subject}</span>?
            </p>
            <p className="text-xs text-rose-600 font-bold bg-rose-50 border border-rose-200 rounded-lg p-3 mb-6 text-left">
              This operational context will immediately be removed from the sampling pool for Higher-Order Thinking Skills (HOTS) question generation.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                type="button"
                onClick={() => setDeleteSettingModal(null)} 
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={executeDeleteDomainSetting} 
                disabled={settingDeleteCountdown > 0}
                className="min-w-[170px] px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 text-white text-sm font-bold rounded-lg transition-colors shadow-sm disabled:cursor-not-allowed"
              >
                {settingDeleteCountdown > 0 ? `Confirm in ${settingDeleteCountdown}s` : 'Confirm Deletion'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View & Edit Details Modal */}
      {viewDetailsModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 border border-slate-200">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Document Details & Metadata</h3>
                <p className="text-xs text-slate-500 font-bold mt-0.5">Review material properties and reassign BLEPP subject classification.</p>
              </div>
              <button onClick={() => setViewDetailsModal(null)} className="text-slate-400 hover:text-slate-700">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">File Name</span>
                <p className="text-sm font-bold text-slate-800">{viewDetailsModal.title}</p>
              </div>

              <div>
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Requested By</span>
                <p className="text-sm font-bold text-slate-800">
                  {viewDetailsModal.faculty?.name || 'Admin Upload'} ({viewDetailsModal.faculty?.email || 'N/A'})
                </p>
              </div>

              {/* Editable BLEPP Subject */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                    BLEPP Subject / Domain
                  </span>
                  {editModalSubject !== (viewDetailsModal.subject || viewDetailsModal.tags?.[0]) && (
                    <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Unsaved Change
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={editModalSubject}
                    onChange={(e) => setEditModalSubject(e.target.value)}
                    disabled={isUpdatingSubject}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-800 bg-white focus:outline-none focus:border-indigo-500"
                  >
                    {BLEPP_SUBJECTS.map((subj) => (
                      <option key={subj} value={subj}>
                        {subj}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleUpdateDocumentSubject}
                    disabled={isUpdatingSubject || editModalSubject === (viewDetailsModal.subject || viewDetailsModal.tags?.[0])}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg transition-colors shrink-0 shadow-xs"
                  >
                    {isUpdatingSubject ? 'Saving...' : 'Update Subject'}
                  </button>
                </div>
              </div>

              {(viewDetailsModal.status === 'Rejected' || viewDetailsModal.status === 'Deleted by Admin' || viewDetailsModal.status === 'File Purged' || viewDetailsModal.status === 'Archived') && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
                  <span className="block text-xs font-bold text-red-500 uppercase tracking-wider mb-1">Status Note / Audit Reason</span>
                  <p className="text-sm font-bold text-red-800">{viewDetailsModal.reject_reason || 'Archived'}</p>
                </div>
              )}
            </div>

            <div className="mt-8 pt-4 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setViewDetailsModal(null)} 
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <FullScreenLoader 
        isOpen={isLoading || isSettingsLoading} 
        message={loadingMessage} 
      />
    </div>
  );
}