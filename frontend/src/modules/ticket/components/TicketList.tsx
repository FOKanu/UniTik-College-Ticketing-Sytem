import { Card } from '../../../components/common/Card';
import { Spinner } from '../../../components/common/Spinner';
import { useTicket } from '../hooks/useTicket';

// TODO: replace this generic JSON dump with real module-specific UI once the backend
// tickets module returns real fields.
export function TicketList() {
  const { data, loading, error } = useTicket();

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
