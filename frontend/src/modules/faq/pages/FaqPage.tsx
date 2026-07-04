import { FaqList } from '../components/FaqList';

// Browsable FAQ list backed by the knowledge-base module.
// Requirement(s) covered: NFR-1.1.4
export function FaqPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-gray-900">Faq</h1>
      <FaqList />
    </div>
  );
}
