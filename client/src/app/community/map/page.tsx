import { redirect } from 'next/navigation';

export default function CommunityMapPage() {
  // Server-side redirect to the new /map route
  redirect('/map');
}
