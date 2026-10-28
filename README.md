# DustyThrifts

[Visit the store](https://dustythrifts.com/)

DustyThrifts is my vintage clothing business in South Africa. I first built the
website to give the store an online home. It has since become the project I use
to learn AWS by running something I actually need, rather than only following
tutorials.

The work now goes well beyond displaying clothes. Customers can browse the
catalogue, pay through Yoco and receive an order email. Behind that, the system
checks prices, verifies payments, allocates unique items and tells me which
orders need attention.

## The problem I wanted to solve

Selling through Instagram can involve a lot of back-and-forth: availability
questions, delivery details, bank details, payment confirmation and keeping a
record of what has sold. I wanted more of that process in one place, without
losing the personal side of a small thrift store.

There is one important difference from a normal stock catalogue: most pieces
are one of one. If two people want the same jacket, I cannot simply send another
one from a shelf. That constraint shaped the payment and inventory work.

## What works now

- Products, prices, sizes, condition and images come from `catalogue.json`, not
  separate product markup scattered across HTML and JavaScript.
- The checkout backend calculates the amount from the trusted S3 catalogue.
  Browser-supplied prices and totals are not used to decide what to charge.
- Signed Yoco payment events are matched to stored orders before marking them
  paid. Visiting the payment-return page does not confirm a payment.
- A successful inventory transaction allocates the whole basket and marks its
  items sold. New checkouts for sold items are rejected with their names.
- Independent email workers send the business notification and the customer's
  confirmation or order-review email.
- Notification failure queues have CloudWatch alerts. They help make processing
  failures visible, but do not cover every outage or prove inbox delivery.

Delivery is currently R60 through PEP Paxi or R100 through Aramex, with free
delivery from an item subtotal of R350. These rules are enforced on the server
as well as shown in the basket.

## The Yoco limitation that changed the design

I originally wanted to reserve an item for a short period while someone paid.
The difficult part was not starting the reservation. It was knowing when it was
safe to release it if the person abandoned checkout.

For the Hosted Checkout integration used here, I could not establish the
guaranteed expiry or server-side cancellation needed to prove that an old
checkout could no longer accept payment. A countdown on my website would not
make the Yoco page expire.

I chose **no timed reservations**. The first verified payment whose allocation
transaction succeeds gets the items. If another already-open checkout is paid
later and any item is unavailable, none of that basket is allocated. It is
flagged for a full manual refund, including shipping.

This prevents simultaneous allocation of the same available item. It does **not** make
duplicate payments impossible. [The investigation and trade-off](docs/engineering-notes.md#the-checkout-link-problem)
explain that distinction, including why Yoco's separate Payment Links API is
not the same thing as the Hosted Checkout flow used by this store.

## How it is built

| Part | Technology |
| --- | --- |
| Storefront | HTML, CSS and vanilla JavaScript |
| Hosting and HTTPS | S3, CloudFront, Route 53 and AWS Certificate Manager |
| Checkout and webhook endpoints | API Gateway and Python Lambda functions |
| Orders and one-of-one stock | DynamoDB, including conditional transactions |
| Business and customer emails | DynamoDB Streams, Lambda, SNS and SES |
| Failure handling and operations | SQS, CloudWatch and IAM |
| Website deployment | GitHub Actions |

The frontend stays static. Payments, stock changes and sending order emails
happen on the backend. [Architecture and order flow](docs/architecture.md)
cover the boundaries between them.

## About this repository

This public repository contains the storefront and documentation of the AWS
system. The Lambda source, backend tests, deployment archives and private
operational notes are **not included in this publication**. It is not a complete
infrastructure template that can be cloned and deployed as another store.

| File or directory | Purpose |
| --- | --- |
| `index.html`, `style.css`, `script.js` | Storefront, basket, checkout form and information dialogs |
| `catalogue.json` | Product information and catalogue prices |
| `success.html` | Payment-return guidance, not proof of payment |
| Product `.webp` files and `images/` | Product photography, founder photo and icon assets |
| `site.webmanifest`, `favicon.ico`, `apple-touch-icon.png` | Browser and mobile shortcut icon metadata/assets |
| `.github/workflows/deploy.yml` | Active website deployment workflow |
| `docs/` | Architecture, troubleshooting history and maintenance notes |

## Verification and remaining work

Small real purchases made by me verified the allocated-order path: payment,
`paid` status, sold inventory, the business email and the customer email. Local
tests also exercised price tampering, signature rejection, stock conflicts,
shipping boundaries and desktop/mobile behaviour. Those backend tests are not
part of the public repository's GitHub Actions workflow.

I have not treated those tests as proof of large-scale performance, guaranteed
email delivery or a live simultaneous-payment race test. Refunds, physical
dispatch and controlled reopening of an item still need an operator. The
catalogue-upload dashboard is planned, not built.

- [Architecture](docs/architecture.md)
- [Problems encountered and decisions made](docs/engineering-notes.md)
- [Catalogue and maintenance notes](docs/maintenance.md)

This started as my first official website. The most useful part has been having
to investigate why something failed, work out what the evidence actually
proved, and make the next change without breaking the parts that already worked.
