"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function BillingPage() {
  const [loading, setLoading] = useState(false);

  const openPortal = async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/billing/portal", {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to open billing");
      }

      window.location.href = data.url;
    } catch (err) {
      console.error(err);
      alert("Could not open billing portal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">Billing</h1>

      <div className="rounded-xl border p-4 space-y-4">
        <p className="text-sm text-slate-600">
          Manage your subscription and payment details.
        </p>

        <Button onClick={openPortal} disabled={loading}>
          {loading ? "Opening..." : "Manage billing"}
        </Button>
      </div>
    </div>
  );
}
