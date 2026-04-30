import { useCallback, useEffect, useState } from 'react';
import { useTenant } from '../contexts/TenantContext';
import { useAuth } from '../contexts/AuthContext';
import { schoolService } from '../utils/centralDataService';

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
      if (!schoolId) {
        setSchoolData(null);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const data = await schoolService.getById(schoolId);
        setSchoolData(data);
      } catch (error) {
        console.error('Failed to fetch school AI settings:', error);
        setSchoolData(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSchoolData();
  }, [schoolId]);

  const isEnabled = useCallback(() => {
    // If user is superadmin, always allow AI features
    if (user?.role === 'superadmin') {
      return true;
    }

    // If school data is loaded, check if AI is enabled for the school
    if (schoolData) {
      return schoolData.aiEnabled !== false;
    }

    // If we are still loading or have no school context, disable AI for safety
    // This prevents access during the split second of loading or if the context is missing
    return false;
  }, [schoolData, user?.role]);

  const getDisabledMessage = useCallback(() => {
    return "AI features are currently disabled for your school. Please contact your school administrator to enable this service.";
  }, []);

  return { isEnabled: isEnabled(), isLoading, getDisabledMessage };
}
