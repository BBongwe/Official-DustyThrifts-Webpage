**Dusty Thrifts Website**

This is the official website for Dusty Thrifts, my online thrift store.

I originally built this project to give the business an online presence, but it has also become my main cloud computing project. As I continue learning AWS, I use this website to apply new skills in a real environment instead of only following tutorials.

**Built With**:

- HTML
- CSS
- JavaScript
- Git & GitHub

**AWS Services Used**:

- Amazon S3, Amazon CloudFront, Amazon Route 53, AWS Certificate Manager (SSL), Amazon API Gateway, AWS Lambda, Amazon SNS, Amazon CloudWatch, AWS IAM
  
**Features**:

- Responsive static website
- Serverless contact form
- Email notifications for enquiries
- HTTPS using a custom domain
- Automatic deployments with GitHub Actions
- CloudWatch monitoring and alerts

**Architecture**

The website is hosted on Amazon S3 and delivered through CloudFront.

A custom domain is managed with Route 53, and AWS Certificate Manager provides the SSL certificate for HTTPS.

When a visitor submits the contact form:

Website

↓

API Gateway

↓

AWS Lambda

↓

Amazon SNS

↓

Email notification

**CI/CD**

This project uses GitHub Actions to automatically deploy changes whenever code is pushed to the main branch. CloudFront cache invalidation is included so updates appear without needing manual intervention.

 **What I Learned**

This project helped me gain practical experience with:

- Static website hosting
- Serverless applications
- DNS configuration
- HTTPS and SSL certificates
- IAM permissions
- Monitoring with CloudWatch
- GitHub Actions and CI/CD
- Troubleshooting cloud deployments

**Future Improvements**

- Product catalogue
- Inventory management
- Backend database
- Search functionality
- More automation




Currently preparing for the AWS Solutions Architect – Associate certification.
