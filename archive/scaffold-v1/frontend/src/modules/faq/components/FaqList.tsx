import { Card } from '../../../components/common/Card';
import { Spinner } from '../../../components/common/Spinner';
import { useFaq } from '../hooks/useFaq';

// TODO: replace this generic JSON dump with real module-specific UI once the backend
// knowledge-base module returns real fields.
export function FaqList() {
  const { data, loading, error } = useFaq();

  if (loading) return <Spinner />;
  if (error) return <p className="text-red-600 text-sm">{error}</p>;

  return (
    <div className="flex flex-col gap-3">
      {data.map((item) => (
        <Card key={item.id}>
          <pre className="text-xs text-gray-700 whitespace-pre-wrap">{JSON.stringify(item, null, 2)}</pre>
        </Card>
      ))}
    </div>
  );
}
