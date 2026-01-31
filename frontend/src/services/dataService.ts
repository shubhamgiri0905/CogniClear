import { Decision } from '../types';

/**
 * DataService acts as the Data Access Layer (DAL).
 * Currently backed by LocalStorage, but structured to easily swap for API calls
 * to a MongoDB backend in the future.
 */

const STORAGE_KEY_PREFIX = 'cogniclear_decisions_';

export const dataService = {
  
  // Simulate: db.decisions.find({ userId: userId })
  getDecisions: async (userId: string): Promise<Decision[]> => {
    // Simulate network latency
    await new Promise(resolve => setTimeout(resolve, 300));
    
    try {
      const key = `${STORAGE_KEY_PREFIX}${userId}`;
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Error fetching decisions:", error);
      return [];
    }
  },

  // Simulate: db.decisions.create(decision)
  createDecision: async (decision: Decision): Promise<Decision> => {
    await new Promise(resolve => setTimeout(resolve, 300));

    try {
      const key = `${STORAGE_KEY_PREFIX}${decision.userId}`;
      const existing = await dataService.getDecisions(decision.userId);
      const updated = [decision, ...existing];
      localStorage.setItem(key, JSON.stringify(updated));
      return decision;
    } catch (error) {
      console.error("Error creating decision:", error);
      throw error;
    }
  },

  // Simulate: db.decisions.findOneAndUpdate({ _id: decision.id }, decision)
  updateDecision: async (decision: Decision): Promise<Decision> => {
    await new Promise(resolve => setTimeout(resolve, 300));

    try {
      const key = `${STORAGE_KEY_PREFIX}${decision.userId}`;
      const existing = await dataService.getDecisions(decision.userId);
      
      const updatedList = existing.map(d => 
        d.id === decision.id ? decision : d
      );
      
      localStorage.setItem(key, JSON.stringify(updatedList));
      return decision;
    } catch (error) {
      console.error("Error updating decision:", error);
      throw error;
    }
  },

  // Utility to clear data (for logout)
  clearLocalCache: () => {
    // In a real app with auth tokens, we might just clear the token.
    // Here we do nothing to localStorage so data persists for next login.
  }
};