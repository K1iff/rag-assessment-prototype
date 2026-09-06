'use client';

import React, { useState } from 'react';

export default function AdminRagPage() {
  const [temperature, setTemperature] = useState(0.3);
  const [chunkSize, setChunkSize] = useState(1024);
  const [topK, setTopK] = useState(5);
  
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const [ragFiles, setRagFiles] = useState([
    { id: 'DOC-01', filename: 'Industrial_Psychology_Reviewer.pdf', uploadedBy: 'prof.marquez@univ.edu', date: '2026-07-10', size: '4.2 MB', status: 'Embedded' },
    { id: 'DOC-02', filename: 'Abnormal_Psych_DSM5_Guidelines.pdf', uploadedBy: 'admin.mark@system.com', date: '2026-07-08', size: '12.5 MB', status: 'Embedded' },
    { id: 'DOC-03', filename: 'Theories_Of_Personality_Chp1.pdf', uploadedBy: 'carlos.lim@univ.edu', date: '2026-07-11', size: '3.1 MB', status: 'Processing' },
  ]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setUploadError('');
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError('');
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const submitUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError('');

    if (!selectedFile) {
      setUploadError('Please select a file to upload.');
      return;
    }

    setIsUploading(true);

    try {
      // Simulate API file upload
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      const newRecord = {
        id: `DOC-0${ragFiles.length + 1}`,
        filename: selectedFile.name,
        uploadedBy: 'admin.mark@system.com',
        date: new Date().toISOString().split('T')[0],
        size: `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`,
        status: 'Processing'
      };

      setRagFiles([newRecord, ...ragFiles]);
      setShowUploadModal(false);
      setSelectedFile(null);
    } catch (error) {
      setUploadError('Failed to upload the document. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6 relative">
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Knowledge Base</h1>
          <p className="text-sm text-slate-500 mt-1 font-bold">Manage reference materials and configure global AI retrieval settings.</p>
        </div>
        <button 
          onClick={() => { setShowUploadModal(true); setSelectedFile(null); setUploadError(''); }}
          className="px-6 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm whitespace-nowrap"
        >
          Upload New Document
        </button>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-6">
          <div className="flex justify-between items-start mb-6">
            <h3 className="font-bold text-lg text-slate-800">AI Generation Parameters</h3>
            <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded font-bold">
              Pending Confirmation Validation required for UI exposure and database persistence.
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Creativity (Temperature): <span className="text-purple-600">{temperature}</span>
              </label>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.1" 
                value={temperature} 
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full accent-purple-600" 
              />
              <p className="text-xs text-slate-500 mt-2 font-bold">Lower values strictly ensure factual adherence to RAG materials.</p>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Context Chunk Size: <span className="text-purple-600">{chunkSize}</span>
              </label>
              <input 
                type="range" 
                min="256" 
                max="2048" 
                step="128" 
                value={chunkSize}
                onChange={(e) => setChunkSize(parseInt(e.target.value))}
                className="w-full accent-purple-600" 
              />
              <p className="text-xs text-slate-500 mt-2 font-bold">Defines the size of text chunks retrieved per generation query.</p>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Retrieval Count (Top-K): <span className="text-purple-600">{topK}</span>
              </label>
              <input 
                type="range" 
                min="1" 
                max="10" 
                step="1" 
                value={topK}
                onChange={(e) => setTopK(parseInt(e.target.value))}
                className="w-full accent-purple-600" 
              />
              <p className="text-xs text-slate-500 mt-2 font-bold">Specifies the number of relevant chunks injected into the AI context.</p>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
            <button className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-lg transition-colors shadow-sm">
              Save Configuration
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h3 className="font-bold text-slate-700">Knowledge Base Files</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-slate-200">
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Filename and Size</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Uploaded By</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Date Added</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Embedding Status</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {ragFiles.map((file) => (
                  <tr key={file.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-slate-800">{file.filename}</p>
                      <p className="text-xs font-bold text-slate-500">{file.size}</p>
                    </td>
                    <td className="p-4 text-slate-600 font-bold">{file.uploadedBy}</td>
                    <td className="p-4 text-slate-500 font-bold">{file.date}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        file.status === 'Embedded' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {file.status === 'Processing' && <span className="h-2 w-2 bg-amber-500 rounded-full animate-pulse"></span>}
                        {file.status}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-4">
                      <button className="text-xs font-bold text-blue-600 hover:underline">Preview</button>
                      <button className="text-xs font-bold text-rose-600 hover:underline">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-slate-200">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
              <h3 className="text-xl font-bold text-slate-800">Upload RAG Document</h3>
              <button 
                onClick={() => !isUploading && setShowUploadModal(false)}
                disabled={isUploading}
                className="text-slate-400 hover:text-slate-700 transition-colors disabled:opacity-50"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <form onSubmit={submitUpload}>
              <div className="space-y-5">

                {uploadError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800 font-bold flex items-center gap-2">
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {uploadError}
                  </div>
                )}
                
                <div 
                  className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors relative ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'} ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                  </div>
                  
                  {selectedFile ? (
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 mb-1">{selectedFile.name}</h4>
                      <p className="text-xs font-bold text-slate-500 mb-4">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB ready for upload</p>
                      <button 
                        type="button" 
                        onClick={() => setSelectedFile(null)}
                        disabled={isUploading}
                        className="text-xs font-bold text-red-500 hover:underline relative z-20 disabled:opacity-50"
                      >
                        Remove file
                      </button>
                    </div>
                  ) : (
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 mb-1">Drag and drop your document</h4>
                      <p className="text-xs font-bold text-slate-500 mb-4">Supports PDF files for AI indexing</p>
                      
                      <div className="flex items-center justify-center">
                        <span className="px-2 bg-slate-50 text-xs font-bold text-slate-400 uppercase relative z-10">Or</span>
                        <div className="absolute left-10 right-10 top-auto h-px bg-slate-200"></div>
                      </div>
                      
                      <label className="mt-4 px-5 py-2 border border-slate-300 text-slate-700 text-sm font-bold rounded-lg bg-white hover:bg-slate-50 transition-colors shadow-sm relative z-20 cursor-pointer inline-block">
                        Browse Files
                        <input type="file" className="hidden" accept=".pdf" onChange={handleFileInput} />
                      </label>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button 
                    type="button"
                    onClick={() => !isUploading && setShowUploadModal(false)}
                    disabled={isUploading}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isUploading || !selectedFile}
                    className={`min-w-[170px] px-5 py-2.5 text-white text-sm font-bold rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2 ${
                      isUploading || !selectedFile ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {isUploading ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Uploading...
                      </>
                    ) : (
                      'Upload and Embed'
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}