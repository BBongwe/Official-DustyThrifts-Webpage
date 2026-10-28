# Catalogue and maintenance notes

The aim is to keep ordinary product edits away from the page structure and
payment code. This is a public overview of that workflow, not an AWS account
setup guide or a replacement for the private operational runbooks.

## Adding or editing products

Edit `catalogue.json` to change product titles, display titles, prices, sizes,
measurements, condition, fabric and image paths. Add new product objects to
extend the collection; there is no twelve-item limit or requirement to stop
after single-letter IDs.

Each physical item needs a unique, stable ID. Do not reuse a sold item's ID for
a different piece, even if both are the same style or size. Check that the title,
display title and photographs all describe the same item.

Image paths need to match the published files, including filename case. Four
views per product are used in the current catalogue. Changing the filename alone
does not update the JSON references.

Before publishing, check that the JSON parses:

```sh
python3 -m json.tool catalogue.json > /dev/null
```

Parsing catches malformed JSON, not a wrong price, a duplicate ID or the wrong
photograph. Those still need review. A catalogue price is public information;
its security comes from the server reading the trusted published copy rather
than accepting the customer's claimed amount.

## What happens to stock

A sale changes DynamoDB inventory. It does not write a sold status back into
GitHub or rewrite the S3 catalogue. The storefront combines catalogue information
with the backend's availability response.

An existing sold inventory record cannot be reopened just by changing JSON to
`available`. A new product ID can be registered conditionally at checkout, but
that must not replace an existing item's sale history.

Reopening a previously sold item is a separate controlled action. It checks the
exact previous allocation, confirms the same physical item is held, and retains
an audit history. Refunding an order does not automatically reopen its stock.
Older unpaid checkout pages may still matter when an item is reopened, so this
must not be treated as a casual text edit.

## After a payment

The business email distinguishes an allocated order from a stock conflict. Do
not ship a basket marked `refund_required` just because its payment status is
paid. In a conflict, none of the basket is allocated and the full payment,
including shipping, needs manual refund handling.

Dispatch is within two working days for confirmed, allocated orders, with
courier transit time additional. PEP Paxi and Aramex send their own recipient
updates. Booking the parcel, checking the delivery details and resolving
shipping concerns still require the owner.

Do not mark an order unpaid, reopen stock or make another purchase just to
retry an email. Notification recovery and refund handling are separate from
the payment record. Vouchers and goodwill offers are manual arrangements, not
an implemented checkout discount-code system.

## Website changes and backend changes

The active GitHub workflow is [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml).
It publishes allowlisted website assets to S3 and requests a CloudFront cache
invalidation. Documentation is not on that upload allowlist. A documentation-only
push still starts the workflow, but does not make the Markdown files website
content.

For a documentation-only update, a [GitHub-supported skip directive](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/skip-workflow-runs)
in the commit message can avoid running this deployment-only workflow. That
does not change the workflow or deploy the backend, and should not be confused
with passing tests.

The extensionless `yaml` file at the repository root is an older deployment
example, not the active workflow. It does not describe the current restricted
upload policy and should not be copied as setup instructions.

GitHub publication does not update a Lambda function, IAM policy, database or
email trigger. Business rules shared by both layers, such as the free-delivery
threshold, need a coordinated backend and frontend release.

Secrets belong in private configuration, not the catalogue or browser code.
Keep API keys, signing secrets, customer exports, CloudShell output, deployment
archives and account-specific runbooks out of public commits. An excluded S3
path is not permission to commit private material to GitHub.

## Local work

This repository does not include an isolated replica of the AWS backend. The
frontend currently points to production endpoints. Merely serving the HTML on
localhost does not turn payments or contact messages into test requests.

Use a separate test backend or intercept/mock those requests before submitting
forms from a development copy. The private browser checks used during this
project blocked real checkout/contact writes; their fixtures and tools are not
included in this documentation-only publication.

Read-only checks available in the public checkout include JSON validation and:

```sh
node --check script.js
```

GitHub Actions currently deploys the website; it does not run the private backend
test suite. Do not present a successful deployment as a full payment, stock-race
or inbox-delivery test.

## Current boundaries

- The visual catalogue-management dashboard is planned. Product editing is
  still through JSON.
- Notification backlog alerts do not cover all checkout/webhook outages or
  establish end-to-end email delivery.
- Delivery booking, tracking enquiries and refunds are not fully automated.
- Small owner-made payment tests are evidence of the paths tested, not a load
  test or a simultaneous live-payment conflict test.
- Store policies still need business/legal review. Publishing their wording is
  not a legal-compliance certification.

The intended next step is making the store easier to operate without pretending
that every manual task or payment-provider limitation has already disappeared.
