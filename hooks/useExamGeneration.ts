import { useState, useEffect, useCallback, useRef } from 'react';

interface GenerationDetails {
  step?: string;
  attempt?: number;
  details?: string;
  message?: string;
  progress?: { completed: number; total: number };
}

interface UseExamGenerationProps {
  onSuccess?: () => void;
}

export function useExamGeneration({ onSuccess }: UseExamGenerationProps = {}) {
  const [taskIds, setTaskIds] = useState<string[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<'IDLE' | 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILURE'>('IDLE');
  const [progressDetails, setProgressDetails] = useState<GenerationDetails | null>(null);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

  const onSuccessRef = useRef(onSuccess);
  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  // 1. Generate Custom Batch (Loops through the teacher's custom blocks)
  const generateCustomBatch = useCallback(async (
    subject: string, 
    blocks: { competency: string, bloom: string, count: number }[], 
    selectedPdfs: string[], 
    examSessionId: string
  ) => {
    try {
      setStatus('PENDING');
      setProgressDetails({ message: 'Compiling custom diagnostic specifications...' });
      
      let allTaskIds: string[] = [];

      // Fire off requests for each block the teacher created
      for (const block of blocks) {
        const response = await fetch(`${API_BASE_URL}/api/generate/custom`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subject,
            competency: block.competency,
            bloom: block.bloom,
            count: block.count,
            selected_pdfs: selectedPdfs,
            exam_session_id: examSessionId
          }),
        });
        const data = await response.json();
        if (data.task_ids) {
          allTaskIds = [...allTaskIds, ...data.task_ids];
        }
      }

      if (allTaskIds.length > 0) {
        setTaskIds(allTaskIds);
      } else {
        setStatus('FAILURE');
        setProgressDetails({ message: 'Backend failed to queue the generation tasks.' });
      }
    } catch (error) {
      setStatus('FAILURE');
      setProgressDetails({ message: 'Failed to connect to the generation server.' });
      console.error(error);
    }
  }, [API_BASE_URL]);

  // 2. Generate Blueprint (Strict Board Exam Mode)
  const generateBlueprint = useCallback(async (
    blueprintId: string, 
    selectedPdfs: string[], 
    examSessionId: string
  ) => {
    try {
      setStatus('PENDING');
      setProgressDetails({ message: 'Initializing strict Board Exam blueprint...' });
      
      const response = await fetch(`${API_BASE_URL}/api/generate/blueprint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blueprint_id: blueprintId,
          selected_pdfs: selectedPdfs,
          exam_session_id: examSessionId
        }),
      });

      const data = await response.json();
      if (data.task_ids && data.task_ids.length > 0) {
        setTaskIds(data.task_ids);
      } else {
        setStatus('FAILURE');
        setProgressDetails({ message: 'Backend failed to queue blueprint tasks.' });
      }
    } catch (error) {
      setStatus('FAILURE');
      setProgressDetails({ message: 'Failed to connect to the generation server.' });
      console.error(error);
    }
  }, [API_BASE_URL]);

  // 3. Batch Polling Effect
  useEffect(() => {
    if (taskIds.length === 0) return;

    const interval = setInterval(async () => {
      try {
        const pendingTasks = taskIds.filter(id => !completedTasks.has(id));
        
        if (pendingTasks.length === 0) {
          setStatus('SUCCESS');
          setProgressDetails({ message: 'All items successfully generated and saved.' });
          clearInterval(interval);
          setTaskIds([]);
          setCompletedTasks(new Set());
          if (onSuccessRef.current) onSuccessRef.current();
          return;
        }

        // Poll a batch of pending tasks (up to 5 at a time to prevent UI stutter)
        const tasksToPoll = pendingTasks.slice(0, 5);
        const results = await Promise.all(
          tasksToPoll.map(id => fetch(`${API_BASE_URL}/api/v1/task/${id}`).then(res => res.json()))
        );

        let newCompleted = new Set(completedTasks);
        let activeDetails = null;

        for (const data of results) {
          if (data.status === 'SUCCESS' || data.status === 'FAILURE') {
            newCompleted.add(data.task_id);
          } else if (data.status === 'PROCESSING') {
            activeDetails = data.details; // Grab the live trace (e.g. "Evaluating Faithfulness")
          }
        }

        setCompletedTasks(newCompleted);

        if (activeDetails) {
          setStatus('PROCESSING');
          setProgressDetails({ 
            ...activeDetails, 
            progress: { completed: newCompleted.size, total: taskIds.length } 
          });
        } else if (newCompleted.size < taskIds.length) {
          setStatus('PENDING');
          setProgressDetails({ 
            message: 'Waiting for Celery worker hardware resources...',
            progress: { completed: newCompleted.size, total: taskIds.length }
          });
        }

      } catch (error) {
        console.error("Polling error:", error);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [taskIds, completedTasks, API_BASE_URL]);

  return { generateCustomBatch, generateBlueprint, status, progressDetails };
}