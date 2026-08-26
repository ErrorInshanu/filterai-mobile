import { create } from 'zustand';

export const useAppStore = create((set) => ({
  // --- Auth state ---
  user: null, // { id, name, email } or null
  token: null, // string or null
  isAuthenticated: false,

  setAuth: (user, token) =>
    set({
      user,
      token,
      isAuthenticated: Boolean(token),
    }),

  logout: () =>
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      activeBatch: null,
      currentBatchId: null,
      uploadedResumes: [],
      jobDescription: '',
      candidateEmails: {},
      candidateNames: {},
      candidates: [],
      comparisonSelection: [],
    }),

  resetAll: () =>
    set({
      uploadedResumes: [],
      jobDescription: '',
      candidateEmails: {},
      candidateNames: {},
      currentBatchId: null,
      candidates: [],
      activeBatch: null,
      comparisonSelection: [],
    }),

  // --- Upload / Ingestion state ---
  uploadedResumes: [], // array of { id, name, size, uri, mimeType }
  jobDescription: '',
  candidateEmails: {}, // { [fileName]: email }
  candidateNames: {}, // { [fileName]: name }
  currentBatchId: null,

  setUploadedResumes: (uploadedResumes) =>
    set({
      uploadedResumes,
    }),

  setJobDescription: (jobDescription) =>
    set({
      jobDescription,
    }),

  setCandidateEmail: (fileName, email) =>
    set((state) => ({
      candidateEmails: {
        ...state.candidateEmails,
        [fileName]: email,
      },
    })),

  setCandidateName: (fileName, name) =>
    set((state) => ({
      candidateNames: {
        ...state.candidateNames,
        [fileName]: name,
      },
    })),

  setCurrentBatchId: (currentBatchId) =>
    set({
      currentBatchId,
    }),

  setBatchUploadResults: (batchId, files = []) =>
    set((state) => {
      const newEmails = { ...state.candidateEmails };
      const newNames = { ...state.candidateNames };

      files.forEach((file) => {
        if (file.file_name) {
          // If extracted_email is present and user has not manually set an email, populate it
          if (file.extracted_email && !newEmails[file.file_name]) {
            newEmails[file.file_name] = file.extracted_email;
          }
          // Set candidate name if present
          if (file.candidate_name && !newNames[file.file_name]) {
            newNames[file.file_name] = file.candidate_name;
          }
        }
      });

      return {
        currentBatchId: batchId,
        candidateEmails: newEmails,
        candidateNames: newNames,
      };
    }),

  // --- Batch state ---
  activeBatch: null, // { id, job_title, job_description } or null

  setActiveBatch: (activeBatch) =>
    set({
      activeBatch,
    }),

  // --- Candidates state ---
  candidates: [],

  setCandidates: (candidates) =>
    set({
      candidates,
    }),

  updateCandidateStatus: (candidateId, newStatus) =>
    set((state) => ({
      candidates: state.candidates.map((candidate) =>
        candidate.candidate_id === candidateId || candidate.id === candidateId
          ? { ...candidate, status: newStatus }
          : candidate
      ),
    })),

  // --- Comparison state ---
  comparisonSelection: [], // array of candidate_ids, max 3

  toggleComparisonSelection: (candidateId) =>
    set((state) => {
      const exists = state.comparisonSelection.includes(candidateId);
      if (exists) {
        return {
          comparisonSelection: state.comparisonSelection.filter(
            (id) => id !== candidateId
          ),
        };
      }
      if (state.comparisonSelection.length >= 3) {
        return state; // capped at max 3
      }
      return {
        comparisonSelection: [...state.comparisonSelection, candidateId],
      };
    }),
}));

export default useAppStore;
