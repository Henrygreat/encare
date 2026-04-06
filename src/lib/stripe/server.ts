import Stripe from 'stripe'
import { getStripeInstance, getTrialDays, isTrialEnabled } from './config'
import { createClient } from '@supabase/supabase-js'

type BillingLogLevel = 'info' | 'warn' | 'error'

function logBillingEvent(level: BillingLogLevel, event: string, context: Record<string, unknown>) {
  const payload = {
    scope: 'billing',
    event,
    ...context,
  }

  if (level === 'error') {
    console.error(payload)
    return
  }

  if (level === 'warn') {
    console.warn(payload)
    return
  }

  console.info(payload)
}

const getServiceRoleClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error('Supabase URL and service role key are required for billing operations')
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export async function getOrCreateStripeCustomer(
  organisationId: string,
  email: string,
  organisationName: string
): Promise<string> {
  const stripe = getStripeInstance()
  const supabase = getServiceRoleClient()

  const { data: existingCustomer } = await supabase
    .from('billing_customers')
    .select('customer_id')
    .eq('organisation_id', organisationId)
    .single()

  if (existingCustomer?.customer_id) {
    return existingCustomer.customer_id
  }

  const customer = await stripe.customers.create({
    email,
    name: organisationName,
    metadata: {
      organisation_id: organisationId,
    },
  })

  const { error } = await supabase.from('billing_customers').insert({
    organisation_id: organisationId,
    customer_id: customer.id,
    email,
  })

  if (error) {
    logBillingEvent('error', 'billing_customer_persist_failed', {
      organisationId,
      customerId: customer.id,
      message: error.message,
    })
    throw error
  }

  return customer.id
}

export async function createCheckoutSession(
  customerId: string,
  organisationId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string
): Promise<Stripe.Checkout.Session> {
  const stripe = getStripeInstance()

  const sessionParams: Parameters<typeof stripe.checkout.sessions.create>[0] = {
    customer: customerId,
    mode: 'subscription',
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      organisation_id: organisationId,
    },
    subscription_data: {
      metadata: {
        organisation_id: organisationId,
      },
    },
    allow_promotion_codes: true,
    billing_address_collection: 'required',
  }

  if (isTrialEnabled()) {
    sessionParams.subscription_data = {
      ...sessionParams.subscription_data,
      trial_period_days: getTrialDays(),
    }
  }

  return await stripe.checkout.sessions.create(sessionParams)
}

export async function createCustomerPortalSession(
  customerId: string,
  returnUrl: string
): Promise<Stripe.BillingPortal.Session> {
  const stripe = getStripeInstance()

  return await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })
}

export async function getSubscriptionByOrganisationId(organisationId: string) {
  const supabase = getServiceRoleClient()

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('organisation_id', organisationId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') {
    logBillingEvent('error', 'subscription_fetch_failed', {
      organisationId,
      message: error.message,
    })
    throw error
  }

  return data
}

export async function upsertSubscription(
  subscription: Stripe.Subscription,
  organisationId?: string
): Promise<void> {
  const supabase = getServiceRoleClient()

  const orgId = organisationId || subscription.metadata.organisation_id

  if (!orgId) {
    logBillingEvent('warn', 'subscription_missing_organisation', {
      subscriptionId: subscription.id,
    })
    return
  }

  const item = subscription.items.data[0]

  const subscriptionData = {
    organisation_id: orgId,
    provider: 'stripe',
    customer_id: typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id,
    subscription_id: subscription.id,
    price_id: item?.price?.id || null,
    status: subscription.status,
    current_period_start: item?.current_period_start
      ? new Date(item.current_period_start * 1000).toISOString()
      : null,
    current_period_end: item?.current_period_end
      ? new Date(item.current_period_end * 1000).toISOString()
      : null,
    cancel_at_period_end: subscription.cancel_at_period_end,
    trial_ends_at: subscription.trial_end
      ? new Date(subscription.trial_end * 1000).toISOString()
      : null,
    canceled_at: subscription.canceled_at
      ? new Date(subscription.canceled_at * 1000).toISOString()
      : null,
    raw: subscription as unknown as Record<string, unknown>,
  }

  const { error } = await supabase
    .from('subscriptions')
    .upsert(subscriptionData, {
      onConflict: 'subscription_id',
    })

  if (error) {
    logBillingEvent('error', 'subscription_upsert_failed', {
      organisationId: orgId,
      subscriptionId: subscription.id,
      message: error.message,
    })
    throw error
  }
}

export async function cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  const stripe = getStripeInstance()

  return await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  })
}

export async function reactivateSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  const stripe = getStripeInstance()

  return await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  })
}

export async function getCustomerIdByOrganisationId(organisationId: string): Promise<string | null> {
  const supabase = getServiceRoleClient()

  const { data, error } = await supabase
    .from('billing_customers')
    .select('customer_id')
    .eq('organisation_id', organisationId)
    .single()

  if (error && error.code !== 'PGRST116') {
    logBillingEvent('error', 'billing_customer_fetch_failed', {
      organisationId,
      message: error.message,
    })
    throw error
  }

  return data?.customer_id || null
}

export function isSubscriptionActive(status: string): boolean {
  return status === 'active' || status === 'trialing'
}

export async function handleWebhookEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session

      if (session.mode === 'subscription' && session.subscription) {
        const stripe = getStripeInstance()
        const subscription = await stripe.subscriptions.retrieve(
          typeof session.subscription === 'string'
            ? session.subscription
            : session.subscription.id
        )

        await upsertSubscription(subscription, session.metadata?.organisation_id)
      }
      break
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      await upsertSubscription(subscription)
      break
    }

    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice
      logBillingEvent('info', 'invoice_paid', {
        invoiceId: invoice.id,
        customerId: invoice.customer,
      })
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      logBillingEvent('warn', 'invoice_payment_failed', {
        invoiceId: invoice.id,
        customerId: invoice.customer,
      })
      break
    }

    default:
      logBillingEvent('info', 'webhook_unhandled', {
        type: event.type,
      })
  }
}
