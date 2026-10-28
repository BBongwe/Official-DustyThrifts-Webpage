### DustyThrifts

[Visit the store](https://dustythrifts.com/)

DustyThrifts is my first official website,originally built to give my instagram vintage store an online presence. It became my main AWS
learning project in 2025, applying new skills to something I actually need instead of only following tutorials.

### The Problem I Am Solving

Instagram sales involve too much back and forth in the DMs about availability, delivery, bank
details and payment confirmation. This website brings that process together and records orders and sold items.

### Built With

- HTML, CSS and JavaScript
- Python for the AWS backend
- Git and GitHub

### AWS Services Used

Amazon S3, CloudFront, Route 53, Certificate Manager, API Gateway, Lambda,
DynamoDB, DynamoDB Streams, SNS, SES, SQS, CloudWatch and IAM.

### Features

- Responsive storefront with a JSON catalogue and shopping basket.
- Yoco checkout with server-calculated prices and delivery charges, not browser totals.
- Verified payments and automatic sold labels.
- Separate business notifications and customer order-confirmation emails.
- Serverless contact form, HTTPS and notification-failure alerts.

### Architecture

S3 hosts the website and CloudFront delivers it. Route 53 and Certificate
Manager provide the domain and HTTPS. The purchase flow is:

```text
Customer selects items and enters delivery details
  -> API Gateway and Lambda check prices/stock and save a pending order
  -> Customer pays on Yoco Hosted Checkout
  -> Yoco sends a signed webhook, which the backend verifies
  -> DynamoDB records payment and atomically allocates the basket
  -> Allocated items become sold
  -> DynamoDB Streams trigger separate notification Lambdas
       -> SNS: business notification
       -> SES: customer confirmation or order-review email
```

### Limitations

Items are not held during checkout. I could not establish guaranteed expiry or
cancellation for Yoco Hosted Checkout, so a website timer would not safely
release stock while an old payment page might still work.

The first verified payment whose allocation succeeds gets the stock. If a later
payment conflicts, the whole basket is left unallocated and flagged for a
full manual refund, including shipping. This prevents duplicate stock
allocation, not all duplicate payments.

### CI/CD

GitHub Actions deploys website changes from `main` to S3 and invalidates CloudFront.
Backend deployment is separate; this repository contains the storefront and
documentation, not Lambda source.

### What I Learned

- Static hosting, DNS, HTTPS and IAM permissions.
- Building serverless APIs and calculating trusted checkout amounts.
- Debugging CORS, webhook registration and signature verification.
- DynamoDB transactions and handling competing orders for unique items.
- Separating payment processing from SNS/SES email workers.
- Retries, failure queues, CloudWatch alerts and safe deployment recovery.
- GitHub Actions and testing changes without making unnecessary real payments.

### Future Improvements

- A dashboard for adding products without editing JSON.
- Search functionality and broader checkout/webhook monitoring.

### Side Notes

- I learn best by repeating the work with real clients. I have been approaching
  small businesses to build and host websites and gain experience. I got my first client and she wanted me to create a cleaning website for her. I used a similar hosting setup for her site as dustythrifts. 
- Her website was live within four days of her sharing the idea with me. I was
  proud it took less time than my first project and I know I can improve with practice.

I am currently preparing for the AWS Solutions Architect - Associate certification.
