import { getServices } from '@/app/actions/services';
import { ServiceListClient } from '@/components/dashboard/service-list-client';

export default async function ServicesPage() {
  const services = await getServices();

  return <ServiceListClient initialServices={services} />;
}
