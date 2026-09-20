import { Suspense } from 'react';
import AuthShell from '@/components/auth-shell';
import AuthForm from '@/components/auth-form';

export default function LoginPage() {
  return (
    <AuthShell title="Вход" subtitle="Войдите по номеру телефона и паролю.">
      <Suspense fallback={null}>
        <AuthForm mode="login" />
      </Suspense>
    </AuthShell>
  );
}
