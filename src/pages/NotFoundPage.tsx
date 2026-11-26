import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center py-20 text-center">
      <h1 className="text-3xl">We could not find that page</h1>
      <p className="mt-2 text-ink-soft">The link may be old or mistyped.</p>
      <Link to="/" className="mt-6">
        <Button icon="home">Go to Home</Button>
      </Link>
    </div>
  );
}
