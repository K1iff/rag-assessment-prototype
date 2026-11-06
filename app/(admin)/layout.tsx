import React from 'react';
import { redirect } from 'next/navigation';
import { getServerSessionAndRole, getRoleHome } from '@/lib/authServer';

export default async function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, role } = await getServerSessionAndRole();

  if (!session) {
    redirect('/login');
  }

  if (role !== 'admin') {
    redirect(role ? getRoleHome(role) : '/login');
  }

  return <>{children}</>;
}

