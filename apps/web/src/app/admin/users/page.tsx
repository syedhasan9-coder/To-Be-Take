'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminUsersRedirectPage(): React.ReactElement {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/users/customers');
  }, [router]);

  return (
    <div style={{ padding: '3rem 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
      <span className="spinner" style={{ marginRight: '0.75rem' }} />
      <span>Redirecting to User Management...</span>
    </div>
  );
}
