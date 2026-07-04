// Thin data-fetching hook for this module. TODO: replace with React Query (or similar) once the
// team needs caching/retries beyond this placeholder useEffect-based fetch.

import { useEffect, useState } from 'react';
import { faqService } from '../services/faq.service';
import { FaqItem } from '../types/faq.types';

export function useFaq() {
  const [data, setData] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    faqService
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
