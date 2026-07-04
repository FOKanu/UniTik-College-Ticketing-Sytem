import { Card } from '../../../components/common/Card';
import { Spinner } from '../../../components/common/Spinner';
import { useNotifications } from '../hooks/useNotifications';

// TODO: replace this generic JSON dump with real module-specific UI once the backend
// notifications module returns real fields.
export function NotificationsList() {
  const { data, loading, error } = useNotifications();

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
