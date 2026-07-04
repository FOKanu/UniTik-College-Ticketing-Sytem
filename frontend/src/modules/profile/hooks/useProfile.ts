// Thin data-fetching hook for this module. TODO: replace with React Query (or similar) once the
// team needs caching/retries beyond this placeholder useEffect-based fetch.

import { useEffect, useState } from 'react';
import { profileService } from '../services/profile.service';
import { ProfileItem } from '../types/profile.types';

export function useProfile() {
  const [data, setData] = useState<ProfileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    profileService
      .list()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { data, loading, error };
}
