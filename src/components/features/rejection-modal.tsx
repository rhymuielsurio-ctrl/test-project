"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

interface RejectionModalProps {
  employeeName: string;
  onSubmit: (reason: string) => void;
  onClose: () => void;
  processing: boolean;
}

export function RejectionModal({
  employeeName,
  onSubmit,
  onClose,
  processing,
}: RejectionModalProps) {
  const [reason, setReason] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal();
    textareaRef.current?.focus();
  }, []);

  function handleClose() {
    dialogRef.current?.close();
    onClose();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (reason.trim()) {
      onSubmit(reason.trim());
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={handleClose}
      className="backdrop:bg-black/50 fixed inset-0 m-auto w-fit h-fit rounded-lg border border-slate-200 bg-white p-0 shadow-lg open:backdrop:animate-in"
    >
      <form onSubmit={handleSubmit} className="w-full max-w-[calc(100vw-2rem)] p-6 sm:max-w-md">
        <h2 className="mb-2 text-lg font-semibold text-slate-900">Reject Leave Request</h2>
        <p className="mb-4 text-sm text-slate-600">
          Provide a reason for rejecting {employeeName}&apos;s request.
        </p>
        <textarea
          ref={textareaRef}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="Enter rejection reason..."
          className="mb-4 w-full resize-none rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          disabled={processing}
        />
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClose}
            disabled={processing}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="danger"
            size="sm"
            loading={processing}
            disabled={!reason.trim()}
          >
            Reject
          </Button>
        </div>
      </form>
    </dialog>
  );
}
