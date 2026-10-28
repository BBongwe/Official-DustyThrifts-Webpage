# What took the work

The visible website was only part of this project. Most of the difficult work
was finding out which system knew the truth at each stage, and what a passing
test did or did not prove.

These notes describe the problems encountered while building the store. They
are not instructions to repeat old production repairs.

## A price changed on the page, but not in the basket

Product information was initially too closely tied to the page markup and
JavaScript. Changing the visible price did not reliably change every place
that used it.

Moving product information into `catalogue.json` made routine edits simpler.
That solved the editing problem, but not the security problem: a customer can
still change browser code or send a request without using the page.

The checkout therefore has its own calculation. It reads the published catalogue
from S3 and uses item IDs, not a total supplied by the browser. Shipping is also
calculated there. Stable product IDs matter just as much as the prices, because
those IDs tie the catalogue, basket, order and inventory record together.

## An HTTP 200 did not mean the browser could use the response

Early checkout troubleshooting included CORS errors even when the network
response said 200. A request can reach an API successfully while the browser
refuses to expose its response to JavaScript.

One source of confusion was treating `Access-Control-Allow-Origin` as a place
to put a comma-separated list of origins. It [specifies one origin or a permitted wildcard](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Access-Control-Allow-Origin).
Preflight responses and
the actual POST response also need compatible CORS handling.

That was separate from securing the order calculation. CORS is a browser
policy, not proof that a request came from a genuine customer or that its price
can be trusted.

## Payment succeeded, but the order stayed pending

This took several rounds of investigation. Being able to call the webhook URL
with curl showed that the route existed. It did not show that Yoco was sending
events to it, that a real event was authentic, or that the event matched an order.

An obsolete registration still pointed to a placeholder URL. There were also
multiple registrations and confusion between different Yoco API credentials.
The signing secret had copy/paste mistakes, including similar-looking
characters. Later logs showed actual deliveries arriving but being rejected for
signature mismatch. At that point the question was no longer simply whether
Yoco could reach AWS.

The repair kept the receiving URL, registration and exact signing secret
together, verified that path, and retired the obsolete registrations. The
receiver now distinguishes missing signature headers, invalid configuration,
timestamp problems and a signature mismatch without printing secret values or
customer payloads.

Yoco's [signature verification guide](https://developer.yoco.com/guides/online-payments/webhooks/verifying-the-events)
uses the webhook ID, signed timestamp and raw request body, with the subscription's
signing secret. Reformatting JSON before checking it changes the bytes being
verified. The Checkout API also has [different credentials from the broader Yoco API](https://developer.yoco.com/api-reference/checkout-api).

A locally signed probe was useful, but it only proved that the secret used by
the probe worked with the receiver. It could not prove that Yoco was signing
with that same secret. The important confirmation was a real payment changing
its matching order to paid. Payment verification also checks the stored
checkout association, amount, currency and mode; a signature alone is not the
whole reconciliation step.

## The checkout-link problem

My first plan for one-of-one stock was familiar: hold an item while a customer
checks out, then release it after a short timeout if they do not pay.

That left a difficult question. If the website releases the item, can the first
customer still pay using the Yoco checkout page they opened earlier?

I asked about a guaranteed Hosted Checkout lifetime, a way to cancel or expire
an unpaid session, and a terminal state that would prove it could no longer
accept a payment. I did not obtain the guarantee needed for a safe automatic
release. A closed tab, no webhook, a failed attempt or a website countdown was
not enough evidence.

The current [create-checkout reference](https://developer.yoco.com/api-reference/checkout-api/checkout/create-checkout)
documents the hosted session and return URLs. A `cancelUrl` is a return URL, not
the server-side cancellation guarantee this reservation design needed. This
account is about the integration and evidence available during the project;
it does not claim that checkout links live forever or that Yoco can never add
expiry controls.

There is another naming trap: Hosted Checkout returns a URL, so it is easy to
call that a "payment link". Yoco also has a separate [Payment Links API](https://developer.yoco.com/api-reference/yoco-api/payment-links/delete-payment-link-v-1-payment-links-payment-link-id-delete)
with a delete operation. That is not the Hosted Checkout endpoint used here,
and its existence is not evidence that this store can cancel its old checkout
sessions. Any move to another API needs its own authentication and payment-state
review.

Rather than invent an expiry time or leave stock held indefinitely, I chose no
timed reservations. The backend checks availability before creating a checkout,
then allocates stock when a verified payment is processed.

For example, one basket contains a jacket; another contains that jacket and
shoes. If the first basket wins allocation, a later payment for the second basket
does not get the shoes on their own. None of that basket is allocated, the shoes
remain available, and the full second payment is flagged for a manual refund.

The trade-off is deliberate:

- A database transaction prevents two orders being allocated the same item.
- It cannot stop every payment through a checkout that was already opened.
- The winner is the first successful verified allocation transaction, not
  necessarily the earliest timestamp shown by a bank.
- A refund-required flag is an instruction to act, not a refund already issued.

Idempotency keys are useful for replaying the same keyed checkout-creation
request. They do not reserve stock or invalidate a different existing checkout.

## The email work was more than a send button

Originally I still needed to check Yoco or DynamoDB to find out what had been
paid. The business notification now follows the paid transition, and customer
confirmations use a separate SES worker.

Keeping these workers out of the payment receiver means email problems do not
make the payment webhook responsible for also delivering an inbox message.
It also means a refund-review email must not accidentally tell someone their
items are secured.

Customer sending needed domain verification, permission to send beyond SES's
sandbox, a reply route, and tests for bounce and complaint feedback. A provider
message ID is useful evidence, but it is not proof of delivery. Likewise, an
empty failure queue is not proof that every worker is running or every inbox
received its message.

The business and customer email paths were verified with owner-made purchases.
The refund-review templates and conflict logic were tested locally; I have not
used simultaneous real customer charges as a test case.

## A deployment stopped halfway through

During the inventory rollout, two functions updated before checkout stopped on
a `PreconditionFailedException`. New checkout creation had been paused for the
rollout, so the failure needed a controlled recovery rather than a blind rerun.

The deployment helper was changed to obtain a fresh revision immediately before
an update and verify completed work before resuming the remaining function.
Optimistic concurrency checks stayed in place. The exact external cause of the
production revision change was not established from audit logs, so this is not
a claim that every precondition failure has the same cause.

This was a useful lesson: a backup version, a record of completed steps and a
resume check matter when a release can stop after making some changes.

## Small business rules still cross several systems

Changing free delivery from R300 to R350 sounded like a text edit. It also
affected the basket calculation, progress message, terms and the authoritative
backend calculation. Publishing only one side would have left them disagreeing.

The update was tested below and at the threshold for both delivery methods,
deployed on the backend first, then matched by the website release. Existing
orders and already-created checkout amounts were not rewritten.

The same applies to reopening stock: changing JSON is not a replacement for a
controlled inventory action, and issuing a refund does not automatically mean
the physical item is back in my possession.

## What I would not claim from this work

The site has passed small real-payment checks and targeted local tests. That
does not establish high-traffic capacity, exactly-once email delivery, universal
device compatibility, automatic refunds or complete outage detection. Those
are separate things to design and verify, not benefits to assume because the
checkout worked once.
