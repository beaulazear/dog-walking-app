# Stripe Setup Instructions

## Get Your Connect Client ID

1. Go to: https://dashboard.stripe.com/test/settings/applications
2. Under "Connect", you should see "Client ID"
3. Copy the value (starts with `ca_`)

## Add Stripe Credentials

Once you have your Connect Client ID, run this command:

```bash
EDITOR="code --wait" rails credentials:edit
```

(Or use your preferred editor: nano, vim, etc.)

Add the following to your credentials file:

```yaml
aws:
  access_key_id: YOUR_AWS_ACCESS_KEY_ID
  secret_access_key: YOUR_AWS_SECRET_ACCESS_KEY

stripe:
  publishable_key: YOUR_STRIPE_PUBLISHABLE_KEY  # pk_test_...
  secret_key: YOUR_STRIPE_SECRET_KEY            # sk_test_...
  connect_client_id: YOUR_CONNECT_CLIENT_ID     # ca_...
  webhook_secret: YOUR_WEBHOOK_SECRET           # whsec_...

secret_key_base: YOUR_SECRET_KEY_BASE
```

**Note**: Your actual keys are already configured in the encrypted credentials file. This is just the format.

Save and close the file.

## Set Environment Variable

Add to your `.env` file (or create one):

```bash
FRONTEND_URL=http://localhost:19006
```

This is the URL where your React Native Expo app will be running.

## Enable Stripe Connect

1. Go to: https://dashboard.stripe.com/test/settings/applications
2. If you haven't enabled Connect yet, click "Get Started"
3. Choose "Platform" as your integration type
4. Fill out the basic info (you can change this later)

## Setup Webhook Endpoint (Next Step)

We'll set this up after you get your Connect Client ID configured.
