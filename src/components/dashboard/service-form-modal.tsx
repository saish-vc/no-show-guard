'use client';

import * as React from 'react';
import { createServiceAction, updateServiceAction } from '@/app/actions/services';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert } from '@/components/ui/alert';
import { X, DollarSign, Clock as ClockIcon } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import type { Service } from '@/types';

interface ServiceFormModalProps {
  service?: Service | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function ServiceFormModal({ service, onClose, onSuccess }: ServiceFormModalProps) {
  const { toast } = useToast();
  const isEditing = Boolean(service);
  const formAction = isEditing ? updateServiceAction : createServiceAction;

  const [state, action, isPending] = React.useActionState(formAction, null);

  // When server action reports success, close the modal
  React.useEffect(() => {
    if (state?.success) {
      toast.success(isEditing ? 'Service updated successfully!' : 'Service created successfully!');
      onSuccess();
    }
  }, [state?.success, isEditing, onSuccess, toast]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-xs"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl border border-zinc-200 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-100">
          <h2 className="text-lg font-bold text-zinc-900">
            {isEditing ? 'Edit Service' : 'Create New Service'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form action={action}>
          <div className="p-6 space-y-5">
            {state?.error && (
              <Alert variant="error">{state.error}</Alert>
            )}

            {isEditing && (
              <input type="hidden" name="service_id" value={service!.id} />
            )}

            <Input
              id="service-name"
              name="name"
              label="Service Name"
              placeholder="e.g. 1-Hour Tutoring Session"
              defaultValue={service?.name || ''}
              required
              helperText="The name customers will see when booking"
            />

            <Textarea
              id="service-description"
              name="description"
              label="Description"
              placeholder="Brief description of what this service includes..."
              defaultValue={service?.description || ''}
              rows={3}
              helperText="Optional — displayed on your public booking page"
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                id="service-duration"
                name="duration_minutes"
                type="number"
                label="Duration"
                placeholder="60"
                defaultValue={service?.duration_minutes?.toString() || '60'}
                min={5}
                max={480}
                step={5}
                required
                prefixElement={<ClockIcon className="h-4 w-4" />}
                helperText="In minutes (5–480)"
              />

              <Input
                id="service-price"
                name="price"
                type="number"
                label="Price"
                placeholder="0.00"
                defaultValue={service?.price?.toString() || '0'}
                min={0}
                step={0.01}
                required
                prefixElement={<DollarSign className="h-4 w-4" />}
                helperText="Leave 0 for free"
              />
            </div>

            {isEditing && (
              <div className="flex items-center gap-3 p-3 rounded-lg border border-zinc-200 bg-zinc-50">
                <label htmlFor="service-active-toggle" className="text-sm font-medium text-zinc-700 flex-1">
                  Service is visible and bookable
                </label>
                <input
                  id="service-active-toggle"
                  type="hidden"
                  name="is_active"
                  value={service?.is_active ? 'true' : 'false'}
                />
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked={service?.is_active ?? true}
                    onChange={(e) => {
                      const hidden = document.querySelector<HTMLInputElement>('#service-active-toggle');
                      if (hidden) hidden.value = e.target.checked ? 'true' : 'false';
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-emerald-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
                </label>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-zinc-100 bg-zinc-50/50 rounded-b-2xl">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button id="service-submit-btn" type="submit" isLoading={isPending}>
              {isEditing ? 'Save Changes' : 'Create Service'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
