"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/layout/ConfirmDialog";
import { Button } from "@/components/ui/Button";
import { pushToast } from "@/components/ui/Toast";

interface Props {
  id: string;
  onSuccess?: () => void;
}

export default function CancelBookingButton({ id, onSuccess }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    // Confirm with user before proceeding
    const confirmed = window.confirm(
      "Cancel your booking? Your time slot will be released immediately for other customers.",
    );
    if (!confirmed) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/booking/${encodeURIComponent(id)}`, { method: "DELETE" });
      if (res.ok) {
        pushToast("success", "Booking cancelled");
        if (onSuccess) {
          onSuccess();
        }
        router.refresh();
      } else {
        let msg = "Unable to cancel booking.";
        try {
          const j = await res.json();
          msg = j?.error?.message ?? j?.message ?? msg;
        } catch (_) {}
        pushToast("error", msg);
      }
    } catch (err) {
      pushToast("error", (err as Error).message || "Unable to cancel booking.");
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  return (
    <>
      <ConfirmDialog
        open={open}
        title="Cancel booking"
        description="Are you sure you want to cancel this booking? This action cannot be undone."
        onConfirm={handleConfirm}
        onCancel={() => setOpen(false)}
      />

      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        disabled={loading}
      >
        Cancel
      </Button>
    </>
  );
}
