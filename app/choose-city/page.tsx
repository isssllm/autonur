import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import AuthShell from '@/components/auth-shell';
import CityPicker from '@/components/city-picker';
export const dynamic = 'force-dynamic';
export default async function ChooseCityPage(){const user=await getCurrentUser();if(!user)redirect('/login');if(user.role!=='USER')redirect(user.role==='ADMIN'?'/admin/select-city':user.role==='INSTRUCTOR'?'/instructor':'/admin');return <AuthShell title="Выберите город" subtitle="Сначала выберите город. После этого откроется его страница с расписанием и записью."><CityPicker/></AuthShell>}
