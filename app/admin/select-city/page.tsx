import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { cities } from '@/lib/data';
import Link from 'next/link';
import AuthShell from '@/components/auth-shell';
export const dynamic='force-dynamic';
export default async function AdminSelectCity(){const user=await getCurrentUser();if(!user || user.role!=='ADMIN')redirect('/login');return <AuthShell title="Выберите рабочий город" subtitle="Администратор сначала выбирает город. После выбора все разделы работают только в его контексте."><div className="grid gap-3">{cities.map(c=><Link key={c.slug} href={`/admin?city=${c.slug}`} className="surface p-5 transition hover:-translate-y-0.5 hover:border-orange-300"><div className="text-lg font-semibold">{c.name}</div><div className="muted mt-1 text-sm">Открыть рабочую область →</div></Link>)}</div></AuthShell>}
