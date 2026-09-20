import { Suspense } from 'react';
import AuthShell from '@/components/auth-shell';
import AuthForm from '@/components/auth-form';

export default function RegisterPage() {
  return (
    <AuthShell title="Создание аккаунта" subtitle="После регистрации выберите город. Это сохранится в вашем профиле.">
      <Suspense fallback={null}>
        <AuthForm mode="register" />
      </Suspense>
    </AuthShell>
  );
}
