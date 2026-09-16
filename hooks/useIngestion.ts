import { useState, useEffect, useCallback } from 'react';

interface IngestionDetails {
  current_file?: string;
  progress?: string;
  message?: string;
}

export function useIngestion() {
  const [taskId, setTaskId] = useState<string | null>(null);
  const [status, setStatus] = useState<'IDLE' | 'PROCESSING' | 'SUCCESS' | 'FAILURE'>('IDLE');
  const [progressDetails, setProgressDetails] = useState<IngestionDetails | null>(null);

  // 1. Trigger the FastAPI Ingestion Endpoint
  const startIngestion = useCallback(async (pdfDirectory: string = "./textbooks") => {
    try {
      setStatus('PROCESSING');
      setProgressDetails({ message: 'Initializing textbook ingestion...' });
      
      const response = await fetch('http://localhost:8000/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdf_directory: pdfDirectory }),
      });

      const data = await response.json();
      if (data.task_id) {
        setTaskId(data.task_id); // Triggers the polling effect
      }
    } catch (error) {
      setStatus('FAILURE');
      setProgressDetails({ message: 'Failed to connect to the backend server.' });
      console.error(error);
    }
  }, []);

  // 2. Poll the Task Status via Redis/Celery
  useEffect(() => {
    if (!taskId) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/tasks/${taskId}`);
        const data = await response.json();

        if (data.status === 'PROCESSING') {
          // This captures the meta dictionary we passed to self.update_state() in Python
          setProgressDetails(data.details); 
        } 
        else if (data.status === 'SUCCESS') {
          setStatus('SUCCESS');
          setProgressDetails({ message: 'All textbooks successfully vectorized and saved to Supabase.' });
          clearInterval(interval);
          setTaskId(null);
        } 
        else if (data.status === 'FAILURE') {
          setStatus('FAILURE');
          setProgressDetails({ message: 'The ingestion task failed.' });
          clearInterval(interval);
          setTaskId(null);
        }
      } catch (error) {
        console.error("Polling error:", error);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [taskId]);

  return { startIngestion, status, progressDetails };
}