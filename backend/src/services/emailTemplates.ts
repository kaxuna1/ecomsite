/**
 * Email Templates
 *
 * HTML email templates with variable substitution.
 * Uses a simple templating system with {{ variable }} syntax.
 */

export interface EmailTemplateData {
  [key: string]: string | number | boolean | undefined;
}

/**
 * Base email layout
 */
function emailLayout(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Luxia Products</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background: white;
      border-radius: 8px;
      padding: 40px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #f0f0f0;
    }
    .logo {
      font-size: 28px;
      font-weight: bold;
      color: #4CAF50;
      text-decoration: none;
    }
    .content {
      margin-bottom: 30px;
    }
    h1 {
      color: #2c3e50;
      font-size: 24px;
      margin-bottom: 20px;
    }
    p {
      margin-bottom: 15px;
    }
    .button {
      display: inline-block;
      padding: 12px 30px;
      background-color: #4CAF50;
      color: white !important;
      text-decoration: none;
      border-radius: 4px;
      font-weight: 600;
      margin: 20px 0;
    }
    .button:hover {
      background-color: #45a049;
    }
    .review-details {
      background: #f9f9f9;
      border-left: 4px solid #4CAF50;
      padding: 15px;
      margin: 20px 0;
    }
    .rating-stars {
      color: #FFB800;
      font-size: 20px;
      margin: 10px 0;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 2px solid #f0f0f0;
      text-align: center;
      font-size: 14px;
      color: #666;
    }
    .footer a {
      color: #4CAF50;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <a href="{{siteUrl}}" class="logo">Luxia Products</a>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>
        © {{currentYear}} Luxia Products. All rights reserved.<br>
        <a href="{{siteUrl}}">Visit our website</a> |
        <a href="{{siteUrl}}/account/profile">Manage preferences</a>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Render stars as HTML
 */
function renderStars(rating: number): string {
  const fullStars = Math.floor(rating);
  const emptyStars = 5 - fullStars;
  return '★'.repeat(fullStars) + '☆'.repeat(emptyStars);
}

/**
 * Review submitted - notification to customer
 */
export function reviewSubmittedCustomerTemplate(data: EmailTemplateData): string {
  const content = `
    <h1>Thank You for Your Review!</h1>
    <p>Hi {{customerName}},</p>
    <p>Thank you for taking the time to review <strong>{{productName}}</strong>. Your feedback helps other customers make informed decisions.</p>

    <div class="review-details">
      <div class="rating-stars">{{stars}}</div>
      {{#reviewTitle}}
      <h3 style="margin: 10px 0;">{{reviewTitle}}</h3>
      {{/reviewTitle}}
      {{#reviewText}}
      <p>{{reviewText}}</p>
      {{/reviewText}}
    </div>

    <p>Your review is currently being reviewed by our team. Once approved, it will be visible to other customers on the product page.</p>

    <a href="{{productUrl}}" class="button">View Product</a>

    <p>If you have any questions, feel free to contact us.</p>
  `;

  return renderTemplate(emailLayout(content), {
    ...data,
    stars: renderStars(Number(data.rating || 0)),
    currentYear: new Date().getFullYear(),
  });
}

/**
 * Review approved - notification to customer
 */
export function reviewApprovedTemplate(data: EmailTemplateData): string {
  const content = `
    <h1>Your Review Has Been Approved!</h1>
    <p>Hi {{customerName}},</p>
    <p>Great news! Your review for <strong>{{productName}}</strong> has been approved and is now live on our website.</p>

    <div class="review-details">
      <div class="rating-stars">{{stars}}</div>
      {{#reviewTitle}}
      <h3 style="margin: 10px 0;">{{reviewTitle}}</h3>
      {{/reviewTitle}}
      {{#reviewText}}
      <p>{{reviewText}}</p>
      {{/reviewText}}
    </div>

    <p>Thank you for sharing your experience with other customers!</p>

    <a href="{{productUrl}}" class="button">View Your Review</a>
  `;

  return renderTemplate(emailLayout(content), {
    ...data,
    stars: renderStars(Number(data.rating || 0)),
    currentYear: new Date().getFullYear(),
  });
}

/**
 * Admin response added - notification to customer
 */
export function reviewResponseTemplate(data: EmailTemplateData): string {
  const content = `
    <h1>We've Responded to Your Review</h1>
    <p>Hi {{customerName}},</p>
    <p>We've responded to your review of <strong>{{productName}}</strong>.</p>

    <div class="review-details">
      <h3 style="margin: 10px 0;">Your Review:</h3>
      <div class="rating-stars">{{stars}}</div>
      {{#reviewTitle}}
      <p><strong>{{reviewTitle}}</strong></p>
      {{/reviewTitle}}
      {{#reviewText}}
      <p>{{reviewText}}</p>
      {{/reviewText}}

      <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">

      <h3 style="margin: 10px 0;">Our Response:</h3>
      <p>{{responseText}}</p>
    </div>

    <a href="{{productUrl}}" class="button">View Conversation</a>

    <p>Thank you for your valuable feedback!</p>
  `;

  return renderTemplate(emailLayout(content), {
    ...data,
    stars: renderStars(Number(data.rating || 0)),
    currentYear: new Date().getFullYear(),
  });
}

/**
 * Review reminder - send to customers after purchase
 */
export function reviewReminderTemplate(data: EmailTemplateData): string {
  const content = `
    <h1>How's Your Recent Purchase?</h1>
    <p>Hi {{customerName}},</p>
    <p>We hope you're enjoying your recent purchase of <strong>{{productName}}</strong>!</p>

    <p>We'd love to hear about your experience. Your feedback helps us improve and helps other customers make informed decisions.</p>

    <div style="text-align: center; margin: 30px 0;">
      <img src="{{productImageUrl}}" alt="{{productName}}" style="max-width: 200px; border-radius: 8px;">
    </div>

    <p style="text-align: center;">
      <a href="{{reviewUrl}}" class="button">Write a Review</a>
    </p>

    <p style="font-size: 14px; color: #666; text-align: center;">
      It only takes a minute and means a lot to us!
    </p>
  `;

  return renderTemplate(emailLayout(content), {
    ...data,
    currentYear: new Date().getFullYear(),
  });
}

/**
 * New review notification - send to admin
 */
export function newReviewAdminTemplate(data: EmailTemplateData): string {
  const content = `
    <h1>New Review Submitted</h1>
    <p>A new review has been submitted and requires moderation.</p>

    <div class="review-details">
      <p><strong>Product:</strong> {{productName}}</p>
      <p><strong>Reviewer:</strong> {{reviewerName}} {{#reviewerEmail}}({{reviewerEmail}}){{/reviewerEmail}}</p>
      {{#isVerifiedPurchase}}
      <p><strong>✓ Verified Purchase</strong></p>
      {{/isVerifiedPurchase}}

      <div class="rating-stars">{{stars}}</div>
      {{#reviewTitle}}
      <h3 style="margin: 10px 0;">{{reviewTitle}}</h3>
      {{/reviewTitle}}
      {{#reviewText}}
      <p>{{reviewText}}</p>
      {{/reviewText}}
    </div>

    <a href="{{adminReviewUrl}}" class="button">Review in Admin Panel</a>
  `;

  return renderTemplate(emailLayout(content), {
    ...data,
    stars: renderStars(Number(data.rating || 0)),
    currentYear: new Date().getFullYear(),
  });
}

/**
 * Simple template rendering with {{ variable }} syntax
 * Supports conditionals: {{#variable}}content{{/variable}}
 */
function renderTemplate(template: string, data: EmailTemplateData): string {
  let result = template;

  // Replace simple variables
  for (const [key, value] of Object.entries(data)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, String(value || ''));
  }

  // Handle conditionals {{#variable}}content{{/variable}}
  const conditionalRegex = /{{#(\w+)}}([\s\S]*?){{\/\1}}/g;
  result = result.replace(conditionalRegex, (match, key, content) => {
    return data[key] ? content : '';
  });

  // Clean up remaining unused variables
  result = result.replace(/{{[^}]+}}/g, '');

  return result;
}

/**
 * Render a template by name
 */
export function renderEmailTemplate(
  templateName: string,
  data: EmailTemplateData
): { subject: string; html: string; text: string } {
  let html = '';
  let subject = '';

  switch (templateName) {
    case 'reviewSubmittedCustomer':
      subject = `Thank you for your review of ${data.productName}`;
      html = reviewSubmittedCustomerTemplate(data);
      break;

    case 'reviewApproved':
      subject = `Your review of ${data.productName} is now live!`;
      html = reviewApprovedTemplate(data);
      break;

    case 'reviewResponse':
      subject = `We've responded to your review of ${data.productName}`;
      html = reviewResponseTemplate(data);
      break;

    case 'reviewReminder':
      subject = `How's your ${data.productName}?`;
      html = reviewReminderTemplate(data);
      break;

    case 'newReviewAdmin':
      subject = `New review submitted for ${data.productName}`;
      html = newReviewAdminTemplate(data);
      break;

    default:
      throw new Error(`Unknown template: ${templateName}`);
  }

  // Generate plain text version by stripping HTML
  const text = html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return { subject, html, text };
}
