import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import AdminShell from '@/components/admin-shell';
import ReadTable from '@/components/admin/read-table';
export const dynamic='force-dynamic';
export default async function ManagersPage({searchParams}:{searchParams:Promise<{city?:string}>}){const user=await getCurrentUser();if(user?.role!=='ADMIN')redirect('/admin');const p=await searchParams;if(!p.city)redirect('/admin/select-city');const city=await prisma.city.findUnique({where:{slug:p.city}});if(!city)redirect('/admin/select-city');const managers=await prisma.manager.findMany({where:{cityId:city.id},orderBy:{firstName:'asc'}});return <AdminShell citySlug={city.slug} currentPath="/admin/managers"><div className="mb-7"><div className="eyebrow">{city.name}</div><h1 className="mt-2 text-3xl font-semibold">Менеджеры</h1><p className="muted mt-2 text-sm">Менеджер навсегда привязан к одному городу.</p></div><ReadTable headers={['Имя','Телефон','Город']} rows={managers.map(m=>[<span className="font-medium">{m.firstName} {m.lastName}</span>,m.phone,city.name])}/></AdminShell>}
