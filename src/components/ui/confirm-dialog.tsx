"use client";

import { Modal } from "./modal";
import { Button } from "./button";

export function ConfirmDialog({
  open,
  title = "Confirmar exclusão",
  description,
  confirmLabel = "Excluir",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title?: string;
  description?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <Modal title={title} onClose={onCancel}>
      {description && (
        <p className="mb-6 text-sm text-muted-foreground">{description}</p>
      )}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button variant="danger" onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
