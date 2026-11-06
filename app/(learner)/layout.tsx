import React from 'react';
import { redirect } from 'next/navigation';
import { getServerSessionAndRole, getRoleHome } from '@/lib/authServer';

export default async function LearnerRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, role } = await getServerSessionAndRole();

  if (!session) {
    redirect('/login');
  }

  if (role !== 'learner') {
    redirect(role ? getRoleHome(role) : '/login');
  }

  return <>{children}</>;
}

