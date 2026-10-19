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
import type { Service } from '@/types';

interface ServiceListClientProps {
  initialServices: Service[];
}

export function ServiceListClient({ initialServices }: ServiceListClientProps) {
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
    const result = await toggleServiceActiveAction(service.id, !service.is_active);
    if (result.error) {
      setActionError(result.error);
    } else {
      await refreshServices();
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
    } else {
      await refreshServices();
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
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Services</h1>
          <p className="text-sm text-zinc-500">
            Define the services customers can book. Active services appear on your public booking page.
          </p>
        </div>
        <Button id="add-service-btn" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Service
        </Button>
      </div>

      {actionError && (
        <Alert variant="error">{actionError}</Alert>
      )}

      {/* Empty State */}
      {services.length === 0 && (
        <Card className="text-center py-16">
          <CardContent className="space-y-4 max-w-sm mx-auto">
            <div className="h-14 w-14 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto">
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
