"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  PLANS,
  type PlanCode,
  isTrialEnabled,
  getTrialDays,
} from "@/lib/stripe/plans";
import { cn } from "@/lib/utils";

export default function BillingSetupPage() {
  const [selectedPlan, setSelectedPlan] = useState<PlanCode>("growth");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trialEnabled = isTrialEnabled();
  const trialDays = getTrialDays();

  const visiblePlans: [PlanCode, (typeof PLANS)[PlanCode]][] = [
    ["growth", PLANS.growth],
    ["pro", PLANS.pro],
  ];

  const handleSubscribe = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planCode: selectedPlan }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to start checkout");
      }

      if (data.url) {
        window.location.href = data.url;
        return;
      }

      throw new Error("Missing checkout URL");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-50 to-surface-100">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-600 shadow-[0_12px_30px_rgba(2,132,199,0.24)]">
            <span className="text-2xl font-bold text-white">E</span>
          </div>

          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
            Choose your EnCare plan
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            Pick the plan that fits your organisation best. Upgrade anytime as
            your care service grows.
          </p>

          {trialEnabled && (
            <p className="mt-3 font-medium text-primary-600">
              Start with a {trialDays}-day free trial. No credit card charged
              until trial ends.
            </p>
          )}
        </div>

        {error && (
          <div className="mx-auto mb-8 max-w-md">
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center text-sm text-red-700">
              {error}
            </div>
          </div>
        )}

        <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
          {visiblePlans.map(([code, plan]) => {
            const isSelected = selectedPlan === code;
            const isPopular = code === "growth";

            return (
              <div key={code} className="relative">
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 z-10 -translate-x-1/2">
                    <span className="inline-block rounded-full bg-primary-600 px-4 py-1 text-sm font-medium text-white shadow-lg">
                      Most Popular
                    </span>
                  </div>
                )}

                <Card
                  variant={isSelected ? "elevated" : "default"}
                  padding="lg"
                  className={cn(
                    "h-full cursor-pointer transition-all duration-300",
                    isSelected && "ring-2 ring-primary-500 ring-offset-2",
                    isPopular && "scale-[1.01]",
                  )}
                  onClick={() => setSelectedPlan(code)}
                >
                  <div className="flex h-full flex-col">
                    <div className="mb-6">
                      <h3 className="mb-1 text-xl font-semibold text-slate-900">
                        {plan.name}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {plan.description}
                      </p>
                    </div>

                    <div className="mb-6">
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold text-slate-900">
                          {plan.currency === "GBP" ? "£" : "$"}
                          {plan.price}
                        </span>
                        <span className="text-slate-500">/{plan.interval}</span>
                      </div>

                      {trialEnabled && (
                        <p className="mt-1 text-sm text-primary-600">
                          {trialDays} days free
                        </p>
                      )}
                    </div>

                    <ul className="mb-8 flex-grow space-y-3">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary-600" />
                          <span className="text-sm text-slate-600">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <div
                      className={cn(
                        "w-full rounded-xl py-3 text-center font-medium transition-colors",
                        isSelected
                          ? "bg-primary-100 text-primary-700"
                          : "bg-surface-100 text-slate-500",
                      )}
                    >
                      {isSelected ? "Selected" : "Select plan"}
                    </div>
                  </div>
                </Card>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <Button
            size="lg"
            onClick={handleSubscribe}
            isLoading={isLoading}
            className="min-w-[240px]"
          >
            {trialEnabled ? "Start free trial" : "Subscribe now"}
          </Button>

          <p className="mt-4 text-sm text-slate-500">
            Cancel anytime. No long-term contracts.
          </p>
        </div>

        <div className="mt-16 border-t border-slate-200 pt-8">
          <div className="flex flex-wrap justify-center gap-8 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>SSL Secured</span>
            </div>

            <div className="flex items-center gap-2">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                <path
                  fillRule="evenodd"
                  d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Powered by Stripe</span>
            </div>

            <div className="flex items-center gap-2">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>GDPR Compliant</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
