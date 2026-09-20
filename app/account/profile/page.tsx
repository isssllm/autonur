import AccountShell from '@/components/account-shell';
import ProfileForm from '@/components/profile-form';
export const dynamic='force-dynamic';
export default function ProfilePage(){return <AccountShell><div><div className="eyebrow">Профиль</div><h1 className="mt-2 text-3xl font-semibold">Личные данные</h1><p className="muted mt-2 text-sm">Имя, фамилию и город можно обновлять по правилам Autonur.</p><div className="mt-8 max-w-xl"><ProfileForm/></div></div></AccountShell>}
