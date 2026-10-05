import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useAppStore = create(
  persist(
    (set, get) => ({
      // --- Hydration state ---
      _hasHydrated: false,
      setHasHydrated: (hasHydrated) => set({ _hasHydrated: hasHydrated }),

      // --- Auth state (Persisted) ---
      user: null, // { id, name, email } or null
      currentUser: null, // alias for user
      token: null, // JWT access token string or null
      authToken: null, // alias for token
      isAuthenticated: false,

      setAuth: (user, token) =>
        set({
          user,
          currentUser: user,
          token,
          authToken: token,
          isAuthenticated: Boolean(token),
        }),

      logout: () =>
        set({
          user: null,
          currentUser: null,
          token: null,
          authToken: null,
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

      // --- Upload / Ingestion state (In-Memory Only) ---
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
              if (file.extracted_email && !newEmails[file.file_name]) {
                newEmails[file.file_name] = file.extracted_email;
              }
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

      // --- Batch state (In-Memory Only) ---
      activeBatch: null, // { id, job_title, job_description } or null

      setActiveBatch: (activeBatch) =>
        set({
          activeBatch,
        }),

      // --- Candidates state (In-Memory Only) ---
      candidates: [],

      setCandidates: (candidates) =>
        set({
          candidates,
        }),

      updateCandidateStatus: (candidateId, newStatus) =>
        set((state) => ({
          candidates: state.candidates.map((candidate) =>
            candidate.candidate_id === candidateId ||
            candidate.id === candidateId ||
            (candidate.file_name && candidate.file_name === candidateId)
              ? {
                  ...candidate,
                  status: newStatus,
                  shortlisted: newStatus === 'shortlisted',
                }
              : candidate
          ),
        })),

      setCandidateInsights: (candidateId, insights, fileName) =>
        set((state) => ({
          candidates: state.candidates.map((candidate) => {
            const isMatch =
              (candidateId &&
                (candidate.candidate_id === candidateId || candidate.id === candidateId)) ||
              (fileName && candidate.file_name === fileName) ||
              (candidateId && candidate.file_name === candidateId);
            return isMatch
              ? {
                  ...candidate,
                  ...insights,
                  insights,
                  red_flags: insights?.red_flags ?? candidate.red_flags,
                }
              : candidate;
          }),
        })),

      // --- Comparison state (In-Memory Only) ---
      comparisonSelection: [], // array of candidate_ids, max 3

      setComparisonSelection: (comparisonSelection) =>
        set({
          comparisonSelection: Array.isArray(comparisonSelection)
            ? comparisonSelection.slice(0, 3)
            : [],
        }),

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
    }),
    {
      name: 'filterai-auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist auth credentials; all batch/candidate/resume states remain in-memory
      partialize: (state) => ({
        user: state.user,
        currentUser: state.currentUser || state.user,
        token: state.token,
        authToken: state.authToken || state.token,
        isAuthenticated: Boolean(state.token || state.authToken),
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          const validToken = state.token || state.authToken;
          const validUser = state.user || state.currentUser;
          if (validToken) {
            state.token = validToken;
            state.authToken = validToken;
            state.user = validUser;
            state.currentUser = validUser;
            state.isAuthenticated = true;
          }
          state.setHasHydrated(true);
        }
      },
    }
  )
);

export default useAppStore;

