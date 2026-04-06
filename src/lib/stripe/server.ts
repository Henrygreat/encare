import Stripe from 'stripe'
import { getStripeInstance, getTrialDays, isTrialEnabled, PLANS, type PlanCode } from './config'
import { createClient } from '@supabase/supabase-js'

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

  // Check if customer already exists
  const { data: existingCustomer } = await supabase
    .from('billing_customers')
    .select('customer_id')
    .eq('organisation_id', organisationId)
    .single()

  if (existingCustomer?.customer_id) {
    return existingCustomer.customer_id
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email,
    name: organisationName,
    metadata: {
      organisation_id: organisationId,
    },
  })

  // Save to database
  await supabase.from('billing_customers').insert({
    organisation_id: organisationId,
    customer_id: customer.id,
    email,
  })

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

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
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

  // Add trial if enabled
  if (isTrialEnabled()) {
    sessionParams.subscription_data!.trial_period_days = getTrialDays()
  }

  return stripe.checkout.sessions.create(sessionParams)
}

export async function createCustomerPortalSession(
  customerId: string,
  returnUrl: string
): Promise<Stripe.BillingPortal.Session> {
  const stripe = getStripeInstance()

  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })
}

export async function getSubscriptionByOrganisationId(organisationId: string) {
  const supabase = getServiceRoleClient()

  const { data } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('organisation_id', organisationId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return data
}

export async function upsertSubscription(
  subscription: Stripe.Subscription,
  organisationId?: string
): Promise<void> {
  const supabase = getServiceRoleClient()

  const orgId = organisationId || subscription.metadata.organisation_id

  if (!orgId) {
    console.error('No organisation_id found for subscription:', subscription.id)
    return
  }

  const subscriptionData = {
    organisation_id: orgId,
    provider: 'stripe',
    customer_id: subscription.customer as string,
    subscription_id: subscription.id,
    price_id: subscription.items.data[0]?.price.id || null,
    status: subscription.status,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
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
    console.error('Error upserting subscription:', error)
    throw error
  }
}

export async function cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  const stripe = getStripeInstance()

  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  })
}

export async function reactivateSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  const stripe = getStripeInstance()

  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  })
}

export async function getCustomerIdByOrganisationId(organisationId: string): Promise<string | null> {
  const supabase = getServiceRoleClient()

  const { data } = await supabase
    .from('billing_customers')
    .select('customer_id')
    .eq('organisation_id', organisationId)
    .single()

  return data?.customer_id || null
}

export function isSubscriptionActive(status: string): boolean {
  return status === 'active' || status === 'trialing'
}

export async function handleWebhookEvent(event: Stripe.Event): Promise<void> {
  const supabase = getServiceRoleClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session

      if (session.mode === 'subscription' && session.subscription) {
        const stripe = getStripeInstance()
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        )
        await upsertSubscription(subscription, session.metadata?.organisation_id)
      }
      break
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      await upsertSubscription(subscription)
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      await upsertSubscription(subscription)
      break
    }

    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice
      // Subscription is already handled by customer.subscription.updated
      // Log for audit purposes
      console.log(`Invoice paid: ${invoice.id} for customer: ${invoice.customer}`)
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      console.error(`Invoice payment failed: ${invoice.id} for customer: ${invoice.customer}`)
      // The subscription status will be updated via customer.subscription.updated
      // You could add additional notification logic here
      break
    }

    default:
      console.log(`Unhandled webhook event type: ${event.type}`)
  }
}
