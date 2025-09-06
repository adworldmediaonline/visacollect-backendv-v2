import crypto from 'crypto';
import { sendEmail } from './email.js';

// Generate unique application ID
export const generateApplicationId = () => {
  // Generate 8-character alphanumeric ID
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'TUR-';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Generate secure resume token
export const generateResumeToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Email template for application started
export const sendApplicationStartedEmail = async (
  email,
  applicationId,
  applicationData
) => {
  const subject = `Turkey Visa Application Started - ${applicationId}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; margin-bottom: 30px;">
        <h1 style="color: white; margin: 0; text-align: center; font-size: 28px;">Turkey Visa Application</h1>
        <p style="color: white; margin: 10px 0 0 0; text-align: center; opacity: 0.9;">Application ID: ${applicationId}</p>
      </div>

      <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
        <h2 style="color: #333; margin-top: 0;">Application Started Successfully!</h2>
        <p>Dear Applicant,</p>
        <p>Your Turkey visa application has been started. Here are your application details:</p>

        <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0;">
          <div style="display: table; width: 100%;">
            <div style="display: table-row;">
              <div style="display: table-cell; padding: 8px 0; font-weight: bold; width: 150px;">Application ID:</div>
              <div style="display: table-cell; padding: 8px 0;">${applicationId}</div>
            </div>
            <div style="display: table-row;">
              <div style="display: table-cell; padding: 8px 0; font-weight: bold;">Passport Country:</div>
              <div style="display: table-cell; padding: 8px 0;">${applicationData.passportCountry}</div>
            </div>
            <div style="display: table-row;">
              <div style="display: table-cell; padding: 8px 0; font-weight: bold;">Visa Type:</div>
              <div style="display: table-cell; padding: 8px 0;">${applicationData.visaType}</div>
            </div>
            <div style="display: table-row;">
              <div style="display: table-cell; padding: 8px 0; font-weight: bold;">Destination:</div>
              <div style="display: table-cell; padding: 8px 0;">${applicationData.destination}</div>
            </div>
          </div>
        </div>

        <div style="background: #e3f2fd; padding: 20px; border-radius: 6px; margin: 20px 0;">
          <h3 style="color: #1976d2; margin-top: 0;">Next Steps:</h3>
          <ol style="margin: 0; padding-left: 20px;">
            <li>Complete your personal details</li>
            <li>Upload required documents</li>
            <li>Add additional applicants (if any)</li>
            <li>Review and submit your application</li>
          </ol>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'https://yourapp.com'}/resume/${applicationId}"
             style="background: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Continue Application
          </a>
        </div>

        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          <strong>Important:</strong> Please save this application ID (${applicationId}) for future reference.
          You can use it to resume your application at any time.
        </p>
      </div>

      <div style="text-align: center; color: #666; font-size: 12px; margin-top: 30px;">
        <p>This is an automated message from Turkey Visa Application System.</p>
        <p>If you didn't start this application, please ignore this email.</p>
      </div>
    </div>
  `;

  const text = `
    Turkey Visa Application Started

    Application ID: ${applicationId}

    Your Turkey visa application has been started successfully.

    Application Details:
    - Application ID: ${applicationId}
    - Passport Country: ${applicationData.passportCountry}
    - Visa Type: ${applicationData.visaType}
    - Destination: ${applicationData.destination}

    Next Steps:
    1. Complete your personal details
    2. Upload required documents
    3. Add additional applicants (if any)
    4. Review and submit your application

    Continue your application: ${process.env.FRONTEND_URL || 'https://yourapp.com'}/resume/${applicationId}

    Please save this application ID (${applicationId}) for future reference.
  `;

  return await sendEmail(email, subject, text, html);
};

// Email template for application form submission
export const sendApplicationCompletedEmail = async (
  email,
  applicationId,
  applicationData
) => {
  const subject = `Turkey Visa Application Submitted - ${applicationId}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%); padding: 30px; border-radius: 10px; margin-bottom: 30px;">
        <h1 style="color: white; margin: 0; text-align: center; font-size: 28px;">Application Form Submitted!</h1>
        <p style="color: white; margin: 10px 0 0 0; text-align: center; opacity: 0.9;">Application ID: ${applicationId}</p>
      </div>

      <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
        <h2 style="color: #333; margin-top: 0;">Your Application Form Has Been Submitted</h2>
        <p>Dear Applicant,</p>
        <p>Your Turkey visa application form has been successfully submitted. Please complete the payment to finish your application.</p>

        <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0;">
          <div style="display: table; width: 100%;">
            <div style="display: table-row;">
              <div style="display: table-cell; padding: 8px 0; font-weight: bold; width: 150px;">Application ID:</div>
              <div style="display: table-cell; padding: 8px 0;">${applicationId}</div>
            </div>
            <div style="display: table-row;">
              <div style="display: table-cell; padding: 8px 0; font-weight: bold;">Total Applicants:</div>
              <div style="display: table-cell; padding: 8px 0;">${applicationData.totalApplicants || 1}</div>
            </div>
            <div style="display: table-row;">
              <div style="display: table-cell; padding: 8px 0; font-weight: bold;">Total Fee:</div>
              <div style="display: table-cell; padding: 8px 0;">$${applicationData.totalFee || 'TBD'}</div>
            </div>
            <div style="display: table-row;">
              <div style="display: table-cell; padding: 8px 0; font-weight: bold;">Submitted Date:</div>
              <div style="display: table-cell; padding: 8px 0;">${new Date().toLocaleDateString()}</div>
            </div>
          </div>
        </div>

        <div style="background: #fff3cd; padding: 20px; border-radius: 6px; margin: 20px 0;">
          <h3 style="color: #856404; margin-top: 0;">Next Steps</h3>
          <ul style="margin: 0; padding-left: 20px; color: #856404;">
            <li><strong>Complete Payment:</strong> Finish your application by completing the payment</li>
            <li><strong>Payment Confirmation:</strong> You will receive a payment confirmation email</li>
            <li><strong>Application Processing:</strong> Our team will review your application within 2-3 business days</li>
            <li><strong>Processing Updates:</strong> You will receive email updates on your application status</li>
          </ul>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'https://yourapp.com'}/payment?id=${applicationId}"
             style="background: #FF9800; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Complete Payment
          </a>
        </div>

        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          <strong>Need help?</strong> Contact our support team at support@turkeyvisa.com
        </p>
      </div>

      <div style="text-align: center; color: #666; font-size: 12px; margin-top: 30px;">
        <p>This is an automated message from Turkey Visa Application System.</p>
      </div>
    </div>
  `;

  const text = `
    Turkey Visa Application Form Submitted

    Application ID: ${applicationId}

    Your Turkey visa application form has been successfully submitted.
    Please complete the payment to finish your application.

    Application Details:
    - Application ID: ${applicationId}
    - Total Applicants: ${applicationData.totalApplicants || 1}
    - Total Fee: $${applicationData.totalFee || 'TBD'}
    - Submitted Date: ${new Date().toLocaleDateString()}

    Next Steps:
    - Complete Payment: Finish your application by completing the payment
    - Payment Confirmation: You will receive a payment confirmation email
    - Application Processing: Our team will review your application within 2-3 business days
    - Processing Updates: You will receive email updates on your application status

    Complete your payment: ${process.env.FRONTEND_URL || 'https://yourapp.com'}/payment?id=${applicationId}

    Need help? Contact support@turkeyvisa.com
  `;

  return await sendEmail(email, subject, text, html);
};

// Helper function to format currency
export const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

// Helper function to calculate age
export const calculateAge = (dateOfBirth) => {
  const today = new Date();
  const birth = new Date(dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
};

// Helper function to validate file type
export const validateFileType = (
  filename,
  allowedTypes = ['pdf', 'jpg', 'jpeg', 'png']
) => {
  const extension = filename.split('.').pop()?.toLowerCase();
  return allowedTypes.includes(extension);
};

// Helper function to validate file size (in MB)
export const validateFileSize = (sizeInBytes, maxSizeInMB = 5) => {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  return sizeInBytes <= maxSizeInBytes;
};

// Helper function to sanitize filename
export const sanitizeFilename = (filename) => {
  return filename.replace(/[^a-zA-Z0-9.-]/g, '_');
};

// Helper function to get supported countries list
export const getSupportedCountries = () => {
  return [
    'Afghanistan',
    'Algeria',
    'Antigua and Barbuda',
    'Armenia',
    'Australia',
    'Bahamas',
    'Bangladesh',
    'Barbados',
    'Bermuda',
    'Bhutan',
    'Cambodia',
    'Cape Verde',
    'China',
    'Dominican Republic',
    'East Timor',
    'Egypt',
    'Equatorial Guinea',
    'Fiji',
    'Greek Cypriot Administration of Southern Cyprus',
    'Grenada',
    'Hong Kong (BN(O))',
    'India',
    'Iraq',
    'Jamaica',
    'Libya',
    'Maldives',
    'Mauritius',
    'Mexico',
    'Namibia',
    'Nepal',
    'Pakistan',
    'Palestine',
    'Philippines',
    'Saint Lucia',
    'Saint Vincent and the Grenadines',
    'Senegal',
    'Solomon Islands',
    'South Africa',
    'Sri Lanka',
    'Suriname',
    'Taiwan',
    'Vanuatu',
    'Vietnam',
    'Yemen',
  ];
};

// Email template for payment success
export const sendPaymentSuccessEmail = async (
  email,
  applicationId,
  paymentData,
  applicationData
) => {
  const subject = `Payment Successful - Turkey Visa Application ${applicationId}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 30px; border-radius: 10px; margin-bottom: 30px;">
        <h1 style="color: white; margin: 0; text-align: center; font-size: 28px;">Payment Successful!</h1>
        <p style="color: white; margin: 10px 0 0 0; text-align: center; opacity: 0.9;">Application ID: ${applicationId}</p>
      </div>

      <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
        <h2 style="color: #333; margin-top: 0;">Your Payment Has Been Processed Successfully</h2>
        <p>Dear Applicant,</p>
        <p>Your payment for the Turkey visa application has been successfully processed. Your application is now fully paid and ready for processing.</p>

        <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0;">
          <div style="display: table; width: 100%;">
            <div style="display: table-row;">
              <div style="display: table-cell; padding: 8px 0; font-weight: bold; width: 150px;">Application ID:</div>
              <div style="display: table-cell; padding: 8px 0;">${applicationId}</div>
            </div>
            <div style="display: table-row;">
              <div style="display: table-cell; padding: 8px 0; font-weight: bold;">Transaction ID:</div>
              <div style="display: table-cell; padding: 8px 0;">${paymentData.transactionId || 'N/A'}</div>
            </div>
            <div style="display: table-row;">
              <div style="display: table-cell; padding: 8px 0; font-weight: bold;">Payment Amount:</div>
              <div style="display: table-cell; padding: 8px 0;">$${paymentData.amount || 'N/A'}</div>
            </div>
            <div style="display: table-row;">
              <div style="display: table-cell; padding: 8px 0; font-weight: bold;">Payment Method:</div>
              <div style="display: table-cell; padding: 8px 0;">${paymentData.paymentMethod || 'PayPal'}</div>
            </div>
            <div style="display: table-row;">
              <div style="display: table-cell; padding: 8px 0; font-weight: bold;">Payment Date:</div>
              <div style="display: table-cell; padding: 8px 0;">${new Date().toLocaleDateString()}</div>
            </div>
            <div style="display: table-row;">
              <div style="display: table-cell; padding: 8px 0; font-weight: bold;">Total Applicants:</div>
              <div style="display: table-cell; padding: 8px 0;">${applicationData.totalApplicants || 1}</div>
            </div>
          </div>
        </div>

        <div style="background: #d4edda; padding: 20px; border-radius: 6px; margin: 20px 0;">
          <h3 style="color: #155724; margin-top: 0;">What's Next?</h3>
          <ul style="color: #155724; margin: 0; padding-left: 20px;">
            <li>Your application will be reviewed by our team</li>
            <li>You will receive updates on your application status</li>
            <li>Processing typically takes 2-4 weeks</li>
            <li>You can track your application using the Application ID</li>
          </ul>
        </div>

        <div style="background: #fff3cd; padding: 20px; border-radius: 6px; margin: 20px 0;">
          <h3 style="color: #856404; margin-top: 0;">Important Information</h3>
          <ul style="color: #856404; margin: 0; padding-left: 20px;">
            <li>Save this email and your Application ID for future reference</li>
            <li>Contact us if you have any questions about your application</li>
            <li>All communications will be sent to this email address</li>
          </ul>
        </div>
      </div>

      <div style="text-align: center; padding: 20px; color: #666;">
        <p>Thank you for choosing our visa application service!</p>
        <p>If you have any questions, please contact our support team.</p>
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="font-size: 12px; color: #999;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      </div>
    </div>
  `;

  const text = `
    Payment Successful - Turkey Visa Application ${applicationId}

    Dear Applicant,

    Your payment for the Turkey visa application has been successfully processed.
    Your application is now fully paid and ready for processing.

    Application Details:
    - Application ID: ${applicationId}
    - Transaction ID: ${paymentData.transactionId || 'N/A'}
    - Payment Amount: $${paymentData.amount || 'N/A'}
    - Payment Method: ${paymentData.paymentMethod || 'PayPal'}
    - Payment Date: ${new Date().toLocaleDateString()}
    - Total Applicants: ${applicationData.totalApplicants || 1}

    What's Next?
    - Your application will be reviewed by our team
    - You will receive updates on your application status
    - Processing typically takes 2-4 weeks
    - You can track your application using the Application ID

    Important Information:
    - Save this email and your Application ID for future reference
    - Contact us if you have any questions about your application
    - All communications will be sent to this email address

    Thank you for choosing our visa application service!

    This is an automated message. Please do not reply to this email.
  `;

  return await sendEmail(email, subject, text, html);
};
