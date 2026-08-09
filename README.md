**Dusty Thrifts Website**

This is my first official webiste and I build it after almost a year of using the AWS Free trial. I originally built this project to give my thrifting business an online presence but it has also become my main cloud computing project (in 2025). As I continue learning AWS, I use this website to apply new skills in a real environment instead of only following tutorials.

**Built With**:

- HTML
- CSS
- JavaScript
- Git & GitHub

**AWS Services Used**:

- Amazon S3, Amazon CloudFront, Amazon Route 53, AWS Certificate Manager (SSL), Amazon API Gateway, AWS Lambda, Amazon SNS, Amazon CloudWatch, AWS IAM
  
**Features**:

- Responsive static website, Serverless contact form, Email notifications for enquiries, HTTPS using a custom domain, Automatic deployments with GitHub Actions and CloudWatch monitoring and alerts

**Architecture**

I am hosting the website on Amazon S3 and delivering it through CloudFront.

A custom domain is managed with Route 53 and AWS Certificate Manager provides the SSL certificate for HTTPS.

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

**Side Notes** 

- It is difficult to learn without real clients because to solidify my learning I need to do it repeatedly to a point where it is easy and to help myself get there, I have been approaching small businesses to create websites for them so that I can gain more experience when I host the websites for them. So far, I have been lucky to get a client who runs a cleaning business and I created a website with the similar architecture and features as Dustythrifts.com, her website is Ntumbacleaning.co.za.

- What I  was most proud of with this project for her was that it took me less time from start to finish, her website was up and running within 4 days of her sharing the idea with me. I know I can get better the more I do practice. 

I am currently preparing for the AWS Solutions Architect – Associate certification.
