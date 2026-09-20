import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import AdminShell from '@/components/admin-shell';
import ReadTable from '@/components/admin/read-table';
import { ruTransmission } from '@/lib/data';
export const dynamic='force-dynamic';
export default async function CarsPage({searchParams}:{searchParams:Promise<{city?:string}>}){const user=await getCurrentUser();if(user?.role!=='ADMIN')redirect('/admin');const p=await searchParams;if(!p.city)redirect('/admin/select-city');const city=await prisma.city.findUnique({where:{slug:p.city}});if(!city)redirect('/admin/select-city');const list=await prisma.car.findMany({where:{cityId:city.id},orderBy:{name:'asc'}});return <AdminShell citySlug={city.slug} currentPath="/admin/cars"><div className="mb-7"><div className="eyebrow">{city.name}</div><h1 className="mt-2 text-3xl font-semibold">Автомобили</h1><p className="muted mt-2 text-sm">Просмотр автопарка выбранного города.</p></div><ReadTable headers={['Автомобиль','Год','КПП','Фото']} rows={list.map(c=>[<span className="font-medium">{c.name}</span>,String(c.year),ruTransmission(c.transmission),<img src={c.photo} alt={c.name} className="h-12 w-20 rounded-lg object-cover"/>])}/></AdminShell>}
