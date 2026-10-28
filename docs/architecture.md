# How orders move through DustyThrifts

This describes the system as implemented in October 2026. The storefront is
public in this repository; the deployed AWS backend is described here but its
source and account-specific setup are not included.

## Two different paths

```text
Customer browser
  |
  +-- CloudFront --> S3 website, product images and catalogue
  |
  +-- API Gateway --> checkout Lambda
                        |
                        +-- S3 catalogue: trusted prices
                        +-- DynamoDB: availability and pending order
                        +-- Yoco Hosted Checkout: payment page

Yoco payment event
  |
  v
API Gateway --> webhook Lambda
                  |
                  +-- Verify signature and match payment to stored checkout
                  +-- DynamoDB transaction: paid order + inventory allocation
                         |
                         v
                    DynamoDB Streams
                         |
                         +-- Business notification Lambda --> SNS --> owner
                         |
                         +-- Customer email Lambda --> SES --> customer

Notification processing failure --> SQS failure queue --> CloudWatch alert
```

The contact form uses its own API/email path. It does not go through checkout
or need a paid order. Courier tracking messages come from the courier after
dispatch; the site does not currently book shipments or integrate tracking APIs.

## Product information is not the same as stock

| Data | Authoritative source | Why |
| --- | --- | --- |
| Product descriptions, images and catalogue prices | Published S3 `catalogue.json` | One place to edit product content; the backend reads its own trusted copy |
| Whether a previously registered item can be allocated | DynamoDB inventory | A website or JSON update must not overwrite an item that has sold |
| Expected payment amount and checkout association | DynamoDB order | The webhook needs a stored reference to validate the incoming payment |
| Payment completion | Verified matching Yoco event | A browser redirect or a customer-supplied status is not evidence |
| Email processing receipts | Fields on the order | Record provider acceptance and avoid ordinary repeat sends |

Catalogue status also acts as a listing restriction. Marking a listing sold in
JSON can keep it off sale, but changing it back to available cannot clear a sold
inventory record. Both the listing and inventory need to permit a purchase.

New catalogue IDs are registered conditionally when checkout first needs them.
The availability read does not turn a catalogue upload into a bulk inventory
overwrite. Existing sold records are preserved.

## Checkout

The browser sends customer/delivery details and item IDs with quantity one. The
checkout Lambda validates the request, loads the catalogue from S3, checks stock
and calculates the charge using integer cents. It ignores browser prices,
shipping fees, totals and claimed payment status.

The current delivery rules are R60 for PEP Paxi, R100 for Aramex, and free delivery
when the item subtotal reaches R350. The frontend displays the same rules; it
is not the authority for charging them.

The server creates a pending order, requests a Yoco checkout and saves the
checkout ID, amount, currency and mode before returning the redirect URL. The
request uses an idempotency key. That is not a stock reservation or a guarantee
that a separate new order request cannot create another checkout.

Yoco's [accepting-a-payment guide](https://developer.yoco.com/guides/online-payments/accepting-a-payment)
also distinguishes redirecting the customer from verifying the payment. The
store's `success.html` deliberately does not announce a successful purchase
just because someone reached that URL.

## Payment verification and allocation

The receiver verifies the signature against the raw request bytes and checks
the signed timestamp. A valid `payment.succeeded` event must then match one
stored checkout, its expected amount, ZAR currency and payment mode.

The checkout index can be eventually consistent, so the receiver also reads
the order itself consistently before acting. An unknown or ambiguous checkout
is not an instruction to invent a paid order.

The allocation transaction changes the pending order to paid and conditionally
changes every item from available to sold. If a stock condition fails, it does
not allocate a convenient subset of the basket. The conflict path records a
paid order that requires a full refund and keeps unrelated items unallocated.
The all-or-nothing boundary comes from [DynamoDB transactions](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/transactions.html),
not from disabling a button in the browser.

Two fields answer different questions:

| State | Meaning |
| --- | --- |
| `paymentStatus: paid` | A matching successful payment was verified |
| `fulfilmentStatus: allocated` | All items were secured for this order |
| `fulfilmentStatus: refund_required` | Payment was received, but this basket must not be shipped |

The first successful allocation transaction wins. This is not a ranking of
customers by bank timestamp. The [checkout-link decision](engineering-notes.md#the-checkout-link-problem)
explains the remaining duplicate-payment risk.

## Emails are separate from taking payment

The order table's stream includes old and new images. Separate workers respond
to the pending-to-paid transition. The business email can say either that the
order is allocated or that a refund is required. The customer worker likewise
distinguishes an order confirmation from a payment-received/order-review message.

A notification failure does not turn an already verified payment back into an
unpaid one. Sending leases, conditional updates and provider receipts reduce
repeat sends. There is still an uncertain-send window if a provider accepts a
message but saving its receipt fails; this is not exactly-once email delivery.

SES acceptance means the provider accepted the message, not that a person read
it or even that it reached the inbox. Sender-domain verification, production
sending access, bounce/complaint feedback and suppression settings were also
part of getting customer emails ready.

Failure destinations and queue-backlog alarms provide a recovery path for
notification processing. They are not end-to-end monitoring of every API,
worker, courier message or customer's inbox.

## Deployment and recovery

Website pushes to `main` run `.github/workflows/deploy.yml`. That workflow
uploads an allowlist of public assets, uploads the web manifest with an explicit
content type and requests CloudFront invalidation. It does not deploy Lambdas.

The backend was rolled out separately, with working Lambda versions retained
and guarded checks around code/configuration updates. Inventory uses on-demand
billing, point-in-time recovery and deletion protection. Backups do not replace
conditional writes, an order history or a reviewed recovery process.

The public repository is not a full account-provisioning or disaster-recovery
package. IAM policies, triggers, private configuration and AWS resources must
not be inferred from a frontend deployment succeeding.
