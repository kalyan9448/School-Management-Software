import { useCallback, useEffect, useState } from 'react';
import { useTenant } from '../contexts/TenantContext';
import { useAuth } from '../contexts/AuthContext';
import { schoolService } from '../utils/centralDataService';
import { School } from '../types';

/**
 * Hook to check if AI features are enabled for the current school
 *
 * Returns:
 * - isEnabled: boolean indicating if AI features are available for the user's school
 * - isLoading: boolean indicating if the check is still loading
 *
 * AI features include: flashcards, quizzes, chat, lesson plans, learning recommendations, etc.
 */
export function useAIFeatureEnabled() {
  const { schoolId } = useTenant();
  const { user } = useAuth();
  const [schoolData, setSchoolData] = useState<School | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchSchoolData() {
      // WAIT until user and school context are available. 
      // For non-superadmins, we NEED organization_id to fetch school data in the nested model.
      if (!schoolId) {
        setSchoolData(null);
        setIsLoading(false);
        return;
      }

      // If we have schoolId but not organization_id yet, we wait.
      // This happens briefly during hydration or role switching.
      if (!user?.organization_id && user?.role !== 'superadmin') {
        console.debug('[useAIFeatureEnabled] schoolId present but waiting for organization_id context...');
        return;
      }

      try {
        setIsLoading(true);
        console.debug(`[useAIFeatureEnabled] Fetching settings for school: ${schoolId}, org: ${user?.organization_id}`);
        const data = await schoolService.getById(schoolId);
        
        if (data) {
          console.debug('[useAIFeatureEnabled] School data retrieved. aiEnabled:', data.aiEnabled);
        } else {
          console.warn('[useAIFeatureEnabled] No school data returned for ID:', schoolId);
        }
        
        setSchoolData(data);
      } catch (error) {
        console.error('Failed to fetch school AI settings:', error);
        setSchoolData(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSchoolData();
  }, [schoolId, user?.organization_id, user?.role]);

  const isEnabled = useCallback(() => {
    // If user is superadmin, always allow AI features
    if (user?.role === 'superadmin') {
      return true;
    }

    // If school data is loaded, check if AI is enabled for the school
    if (schoolData) {
      // Default to true if the flag is missing (new schools)
      return schoolData.aiEnabled !== false;
    }

    // If we are still loading, return false (UI should show loader)
    return false;
  }, [schoolData, user?.role]);

  const getDisabledMessage = useCallback(() => {
    return "AI features are currently disabled for your school. Please contact your school administrator to enable this service.";
  }, []);

  return { isEnabled: isEnabled(), isLoading, getDisabledMessage };
}
