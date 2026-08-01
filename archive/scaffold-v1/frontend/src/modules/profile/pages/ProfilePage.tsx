import { ProfileList } from '../components/ProfileList';

// Current user's profile view.
// Requirement(s) covered: NFR-1.4 (role-based access)
export function ProfilePage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-gray-900">Profile</h1>
      <ProfileList />
    </div>
  );
}
