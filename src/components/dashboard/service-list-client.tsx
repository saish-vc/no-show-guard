'use client';

import * as React from 'react';
import { getServices, toggleServiceActiveAction, deleteServiceAction } from '@/app/actions/services';
import { ServiceFormModal } from '@/components/dashboard/service-form-modal';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import {
  Plus,
  Pencil,
  Trash2,
  Clock,
  DollarSign,
  ToggleLeft,
  ToggleRight,
  Briefcase,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import type { Service } from '@/types';

interface ServiceListClientProps {
  initialServices: Service[];
}

export function ServiceListClient({ initialServices }: ServiceListClientProps) {
  const { toast } = useToast();
  const [services, setServices] = React.useState<Service[]>(initialServices);
  const [showModal, setShowModal] = React.useState(false);
  const [editingService, setEditingService] = React.useState<Service | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [loadingAction, setLoadingAction] = React.useState<string | null>(null);

  const refreshServices = React.useCallback(async () => {
    const fresh = await getServices();
    setServices(fresh);
  }, []);

  const openCreate = () => {
    setEditingService(null);
    setShowModal(true);
  };

  const openEdit = (service: Service) => {
    setEditingService(service);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingService(null);
  };

  const handleModalSuccess = () => {
    closeModal();
    refreshServices();
  };

  const handleToggle = async (service: Service) => {
    setLoadingAction(service.id);
    setActionError(null);
    const newStatus = !service.is_active;
    const result = await toggleServiceActiveAction(service.id, newStatus);
    if (result.error) {
      setActionError(result.error);
      toast.error(result.error);
    } else {
      await refreshServices();
      toast.success(newStatus ? `"${service.name}" activated.` : `"${service.name}" archived.`);
    }
    setLoadingAction(null);
  };

  const handleDelete = async (service: Service) => {
    if (!window.confirm(`Delete "${service.name}"? This cannot be undone.`)) return;
    setLoadingAction(service.id);
    setActionError(null);
    const result = await deleteServiceAction(service.id);
    if (result.error) {
      setActionError(result.error);
      toast.error(result.error);
    } else {
      await refreshServices();
      toast.success(`"${service.name}" deleted successfully.`);
    }
    setLoadingAction(null);
  };

  const activeServices = services.filter((s) => s.is_active);
  const archivedServices = services.filter((s) => !s.is_active);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Services & Pricing</h1>
          <p className="text-sm text-zinc-500">
            Define your service offerings, session durations, and rates. Active services appear on your public booking page.
          </p>
        </div>
        <Button id="add-service-btn" onClick={openCreate} className="bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm">
          <Plus className="h-4 w-4 mr-2" />
          Add New Service
        </Button>
      </div>

      {/* Stitch KPI Stats Summary Bar */}
      {services.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-white border-zinc-200 shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Active Services</p>
                <p className="text-2xl font-bold text-zinc-900 mt-0.5">{activeServices.length}</p>
                <p className="text-[11px] text-zinc-400">Available to customers</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                <Briefcase className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-zinc-200 shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Average Duration</p>
                <p className="text-2xl font-bold text-zinc-900 mt-0.5">
                  {activeServices.length > 0
                    ? Math.round(
                        activeServices.reduce((acc, s) => acc + s.duration_minutes, 0) / activeServices.length
                      )
                    : 0}{' '}
                  <span className="text-sm font-normal text-zinc-500">mins</span>
                </p>
                <p className="text-[11px] text-zinc-400">Per appointment slot</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Clock className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-zinc-200 shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Average Value</p>
                <p className="text-2xl font-bold text-zinc-900 mt-0.5">
                  ${activeServices.length > 0
                    ? (
                        activeServices.reduce((acc, s) => acc + Number(s.price), 0) / activeServices.length
                      ).toFixed(2)
                    : '0.00'}
                </p>
                <p className="text-[11px] text-zinc-400">Across active services</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <DollarSign className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {actionError && (
        <Alert variant="error">{actionError}</Alert>
      )}

      {/* Empty State */}
      {services.length === 0 && (
        <Card className="text-center py-16">
          <CardContent className="space-y-4 max-w-sm mx-auto">
            <div className="h-14 w-14 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mx-auto">
              <Briefcase className="h-7 w-7" />
            </div>
            <div>
              <p className="font-semibold text-zinc-900 text-lg">No services yet</p>
              <p className="text-sm text-zinc-500 mt-1">
                Create your first service to start accepting client bookings.
              </p>
            </div>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Service
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Active Services */}
      {activeServices.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">
            Active Services ({activeServices.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeServices.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                isLoading={loadingAction === service.id}
                onEdit={() => openEdit(service)}
                onToggle={() => handleToggle(service)}
                onDelete={() => handleDelete(service)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Archived Services */}
      {archivedServices.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">
            Archived Services ({archivedServices.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {archivedServices.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                isLoading={loadingAction === service.id}
                onEdit={() => openEdit(service)}
                onToggle={() => handleToggle(service)}
                onDelete={() => handleDelete(service)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Stitch Deposit & Cancellation Policy Card */}
      <Card className="bg-gradient-to-r from-emerald-50/80 via-white to-zinc-50 border-emerald-100/80 shadow-xs">
        <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded">
                Cancellation & Attendance Policy
              </span>
              <span className="text-xs text-zinc-400">Guaranteed Protection</span>
            </div>
            <p className="text-sm text-zinc-700 font-medium">
              Automated reminders are dispatched 24h &amp; 2h before every scheduled session to prevent empty chairs.
            </p>
          </div>
          <span className="text-xs text-emerald-700 bg-white border border-emerald-200 px-3 py-1.5 rounded-lg shadow-2xs font-semibold whitespace-nowrap">
            Active on all services
          </span>
        </CardContent>
      </Card>

      {/* Modal */}
      {showModal && (
        <ServiceFormModal
          service={editingService}
          onClose={closeModal}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
}

// ── Individual Service Card ────────────────────────────────────────────────

function ServiceCard({
  service,
  isLoading,
  onEdit,
  onToggle,
  onDelete,
}: {
  service: Service;
  isLoading: boolean;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <Card
      className={`transition-opacity ${
        !service.is_active ? 'opacity-60' : ''
      }`}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-zinc-900 text-base truncate">
                {service.name}
              </h3>
              <Badge variant={service.is_active ? 'success' : 'secondary'}>
                {service.is_active ? 'Active' : 'Archived'}
              </Badge>
            </div>

            {service.description && (
              <p className="text-sm text-zinc-500 line-clamp-2">{service.description}</p>
            )}

            <div className="flex items-center gap-4 text-sm text-zinc-600">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-zinc-400" />
                {service.duration_minutes} min
              </span>
              <span className="inline-flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5 text-zinc-400" />
                {Number(service.price) === 0
                  ? 'Free'
                  : `$${Number(service.price).toFixed(2)}`}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 shrink-0">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
            ) : (
              <>
                <button
                  onClick={onToggle}
                  className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors"
                  title={service.is_active ? 'Archive' : 'Reactivate'}
                >
                  {service.is_active ? (
                    <ToggleRight className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <ToggleLeft className="h-4 w-4" />
                  )}
                </button>
                <button
                  onClick={onEdit}
                  className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors"
                  title="Edit"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={onDelete}
                  className="p-2 rounded-lg hover:bg-red-50 text-zinc-400 hover:text-red-600 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
