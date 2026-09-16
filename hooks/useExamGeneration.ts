import { useState, useEffect, useCallback } from 'react';

interface GenerationDetails {
  step?: string;
  attempt?: number;
  details?: string;
  message?: string;
}

export function useExamGeneration() {
  const [taskId, setTaskId] = useState<string | null>(null);
  const [status, setStatus] = useState<'IDLE' | 'PROCESSING' | 'SUCCESS' | 'FAILURE'>('IDLE');
  const [progressDetails, setProgressDetails] = useState<GenerationDetails | null>(null);

  // 1. Trigger the FastAPI Backend
  const generateItem = useCallback(async (subject: string, competency: string, bloom: string, examSessionId: string) => {
    try {
      setStatus('PROCESSING');
      setProgressDetails({ step: 'Initializing', details: 'Connecting to AI engine...' });
      
      const response = await fetch('http://localhost:8000/api/generate/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          competency,
          bloom,
          count: 1,
          exam_session_id: examSessionId
        }),
      });

      const data = await response.json();
      if (data.task_ids && data.task_ids.length > 0) {
        setTaskId(data.task_ids[0]); // This triggers the polling effect below
      }
    } catch (error) {
      setStatus('FAILURE');
      setProgressDetails({ message: 'Failed to connect to the generation server.' });
      console.error(error);
    }
  }, []);

  // 2. Poll the Task Status
  useEffect(() => {
    if (!taskId) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/tasks/${taskId}`);
        const data = await response.json();

        if (data.status === 'PROCESSING') {
          setProgressDetails(data.details); // e.g., "Evaluating Faithfulness..."
        } 
        else if (data.status === 'SUCCESS') {
          setStatus('SUCCESS');
          setProgressDetails(data.details);
          clearInterval(interval);
          setTaskId(null);
        } 
        else if (data.status === 'FAILURE') {
          setStatus('FAILURE');
          setProgressDetails({ message: 'The generation task failed.' });
          clearInterval(interval);
          setTaskId(null);
        }
      } catch (error) {
        console.error("Polling error:", error);
      }
    }, 2500); // Poll every 2.5 seconds

    return () => clearInterval(interval); // Cleanup on unmount
  }, [taskId]);

  return { generateItem, status, progressDetails };
}