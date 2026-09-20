import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import AdminShell from '@/components/admin-shell';
import ReadTable from '@/components/admin/read-table';
export const dynamic='force-dynamic';
export default async function CitiesPage({searchParams}:{searchParams:Promise<{city?:string}>}){const user=await getCurrentUser();if(user?.role!=='ADMIN')redirect('/admin');const p=await searchParams;if(!p.city)redirect('/admin/select-city');const city=await prisma.city.findUnique({where:{slug:p.city}});if(!city)redirect('/admin/select-city');const manager=await prisma.manager.findFirst({where:{cityId:city.id},select:{phone:true}});return <AdminShell citySlug={city.slug} currentPath="/admin/cities"><div className="mb-7"><div className="eyebrow">{city.name}</div><h1 className="mt-2 text-3xl font-semibold">Города</h1><p className="muted mt-2 text-sm">Контент города и адрес изменяются разработчиком.</p></div><ReadTable headers={['Город','Автодром','2GIS','Телефон']} rows={[[city.name,city.autodrome,<a href={city.gisUrl} target="_blank" rel="noreferrer" className="text-orange-600">Открыть</a>,(manager?.phone||city.phone)]]}/></AdminShell>}
