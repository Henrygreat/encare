import { redirect } from 'next/navigation'
export default function DashboardResidentDetailPage({ params }: { params: { id: string } }) { redirect(`/app/residents/${params.id}`) }
