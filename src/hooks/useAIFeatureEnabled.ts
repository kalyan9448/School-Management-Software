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
  const { tenant } = useTenant();
  const { user } = useAuth();
  const [schoolData, setSchoolData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSchoolData = async () => {
      if (!tenant?.schoolId) {
        setIsLoading(false);
        return;
      }

      try {
        const school = await schoolService.getById(tenant.schoolId);
        setSchoolData(school);
      } catch (error) {
        console.error('Failed to fetch school data for AI check:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchoolData();
  }, [tenant?.schoolId]);

  const isEnabled = useCallback(() => {
    // If user is superadmin, always allow AI features
    if (user?.role === 'superadmin') {
      return true;
    }

    // If school data is loaded, check if AI is enabled for the school
    if (schoolData) {
      return schoolData.aiEnabled !== false;
    }

    // Default to enabled if no school data yet
    return true;
  }, [schoolData, user?.role]);

  const getDisabledMessage = useCallback(() => {
    return 'AI features are currently disabled for your school. Please contact your school administrator to enable them.';
  }, []);

  return {
    isEnabled: isEnabled(),
    isLoading,
    getDisabledMessage,
  };
}
