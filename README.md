# Visa Collection System Backend

A scalable and modular backend system for processing visa applications across multiple countries with a step-based workflow.

## 🚀 Features

- **Multi-Country Architecture**: Modular design for easy addition of new countries
- **Step-based Application Process**: Standardized 4-step visa application workflow
- **Multi-Applicant Support**: Main applicant + additional applicants under one application
- **Global Document Upload Service**: Centralized file upload with Cloudinary integration
- **Two-Tier Upload Architecture**: Separate file upload from document registration
- **PayPal Payment Integration**: Secure one-time payments with webhook support
- **Email Notifications**: Automated email confirmations and updates
- **Comprehensive Validation**: Zod-based input validation with detailed error messages
- **Structured Logging**: Winston-based logging with different levels
- **Health Monitoring**: Built-in health checks and system monitoring

## 📋 Supported Countries

### Turkey 🇹🇷

- **Status**: ✅ Fully Implemented
- **Documentation**: See [turkey.md](./turkey.md)
- **Supported Countries**: 45 countries
- **Features**: Complete visa application workflow

### Future Countries

- Australia 🇦🇺 (Planned)
- UAE 🇦🇪 (Planned)
- And more...

## 🏗 Architecture Overview

### Core Structure

```
src/
 ├── config/       # Database, environment configuration
 ├── models/       # Country-specific Mongoose schemas
 ├── schemas/      # Zod validation schemas
 ├── services/     # Business logic layer
 ├── controllers/  # Request/response handlers
 ├── routes/       # Express routes (organized by country)
 ├── middleware/   # Authentication, validation, errors
 ├── utils/        # Helpers (email, file upload, etc.)
 └── scripts/      # Database seeding and utilities
```

### Country-Specific Pattern

Each country follows the same modular pattern:

```
routes/
├── turkeyVisa.js
└── australiaVisa.js (future)

controllers/
├── turkeyVisaController.js
└── australiaVisaController.js (future)

models/
├── TurkeyApplication.js
├── TurkeyVisaFee.js
└── AustraliaApplication.js (future)
```

## 🔧 Setup & Installation

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Clone the repository**

```bash
cd visa-collection-backend
```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Configuration**
   Copy the environment template and configure your settings:

   ```bash
   cp env.example .env
   ```

````

Configure the following environment variables:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/visa-collect

# Server
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:3000

# Email (choose provider)
EMAIL_PROVIDER=ethereal
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=your-email@gmail.com

# Cloudinary (for document uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# PayPal (for payment processing)
PAYPAL_MODE=sandbox
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_WEBHOOK_ID=your_paypal_webhook_id

# Application
FRONTEND_URL=http://localhost:3000
MAX_FILE_SIZE=5242880
````

4. **Seed Database**
   Populate visa fee data for supported countries:

```bash
npm run seed
```

5. **Start Development Server**

```bash
npm run dev
```

The server will start on `http://localhost:3000`

## 🛠 API Structure

### Base URLs

- **Health Check**: `/health`
- **Global Document Service**: `/api/v1/document/*`
- **Payment APIs**: `/api/v1/payment/*`
- **Turkey APIs**: `/api/v1/turkey/*`
- **Future Countries**: `/api/v1/{country}/*`

### Global Document Upload Endpoints

- `POST /api/v1/single/document` - Upload single document
- `POST /api/v1/multiple/document` - Upload multiple documents
- `GET /api/v1/document/:publicId` - Get document info
- `DELETE /api/v1/document/:publicId` - Delete document

### PayPal Payment Endpoints

- `POST /api/v1/payment/paypal/create` - Create PayPal order
- `POST /api/v1/payment/paypal/capture` - Capture PayPal payment
- `POST /api/v1/payment/paypal/webhook` - Handle PayPal webhooks
- `GET /api/v1/payment/:paymentId` - Get payment status
- `POST /api/v1/payment/refund` - Process payment refund
- `GET /api/v1/payment/stats/payment` - Get payment statistics

### Country-Specific Endpoints (per country)

- `GET /{country}/visa-fee` - Get visa fees
- `GET /{country}/countries` - Get supported countries
- `POST /{country}/start` - Start application
- `POST /{country}/applicant-details` - Save applicant details
- `POST /{country}/documents` - Register documents with application
- `POST /{country}/add-applicant` - Add additional applicants
- `POST /{country}/submit` - Submit application
- `GET /{country}/application/:id` - Get application details

## 📊 Database Design

### Application Models

Each country has its own application model following the same structure:

- **applicationId**: Unique country-specific ID
- **passportCountry**: Applicant's passport country
- **email**: Applicant's email address
- **mainApplicant**: Main applicant details and documents
- **additionalApplicants**: Array of additional applicants
- **status**: Application status tracking
- **currentStep**: Current step in application process
- **visaFee**: Visa fee for the passport country
- **serviceFee**: Fixed service fee
- **totalFee**: Calculated total fee

### Visa Fee Models

Country-specific fee models containing:

- **country**: Country name
- **visaFee**: Visa fee amount
- **duration**: Visa validity period
- **numberOfEntries**: Single/Multiple entry
- **serviceFee**: Fixed service fee
- **isActive**: Active status

## 🔒 Security & Validation

### Input Validation

- **Zod Schemas**: Comprehensive validation for all inputs
- **Sanitization**: Input cleaning and XSS prevention
- **File Upload Security**: Type and size validation

### Authentication & Authorization

- **Application Ownership**: Email-based verification
- **Rate Limiting**: Protection against abuse (ready for implementation)
- **CORS**: Strict origin control

### Data Protection

- **Environment Variables**: Sensitive data not in code
- **Input Sanitization**: Prevent NoSQL injection
- **File Security**: Cloudinary secure uploads

## 📁 Document Upload Architecture

The system implements a two-tier document upload architecture for better scalability and efficiency:

### Tier 1: Global Document Upload Service

- **Endpoints**: `/api/v1/single/document`, `/api/v1/multiple/document`
- **Purpose**: Handle actual file uploads to Cloudinary
- **Returns**: Structured metadata (URL, publicId, size, format, etc.)
- **Features**: File validation, Cloudinary integration, folder organization

### Tier 2: Country-Specific Document Registration

- **Endpoints**: `/{country}/documents`
- **Purpose**: Register uploaded documents with visa applications
- **Accepts**: Metadata from Tier 1 + supporting document details
- **Features**: Application-specific validation, document categorization

### Benefits

- **Separation of Concerns**: File handling separate from business logic
- **Reusability**: Global service works across all countries
- **Efficiency**: Reduced payload sizes, better error handling
- **Scalability**: Easy to extend without modifying country-specific code

## 💳 PayPal Payment Integration

The system includes comprehensive PayPal REST API integration for secure one-time payments, supporting both web and mobile platforms.

### Key Features

- **Order Creation**: Create PayPal orders with custom amounts and currencies
- **Payment Capture**: Secure server-side payment capture
- **Webhook Support**: Real-time payment status updates via PayPal webhooks
- **Multi-Platform**: Unified API for web (Next.js) and mobile (React Native Expo)
- **Error Handling**: Comprehensive error handling with retry mechanisms
- **Environment Support**: Sandbox and production environment configuration

### Payment Flow

1. **Create Order**: Frontend calls `/api/v1/payment/paypal/create` with application details
2. **PayPal Redirect**: User is redirected to PayPal for payment approval
3. **Payment Approval**: User approves payment on PayPal
4. **Return to App**: User returns to frontend with approval token
5. **Capture Payment**: Frontend calls `/api/v1/payment/paypal/capture` to complete payment
6. **Webhook Confirmation**: PayPal sends webhook for payment confirmation

### Security Features

- **Server-to-Server**: No client-side handling of PayPal secrets
- **Webhook Verification**: Signature verification for webhook authenticity
- **Idempotent Operations**: Duplicate prevention for order creation and capture
- **Input Validation**: Comprehensive validation using Zod schemas
- **Environment Separation**: Separate sandbox/production credentials

### Payment Status Tracking

- **CREATED**: PayPal order created, waiting for approval
- **APPROVED**: User approved payment on PayPal
- **COMPLETED**: Payment successfully captured
- **FAILED**: Payment failed or was denied
- **REFUNDED**: Payment was refunded
- **CANCELLED**: Payment was cancelled

### Database Schema

The Payment model includes:

- **paymentId**: Unique payment identifier
- **applicationId**: Linked visa application
- **orderId**: PayPal order ID
- **transactionId**: PayPal transaction ID
- **status**: Payment status
- **amount & currency**: Payment details
- **payerEmail & payerName**: Customer information
- **webhookEvents**: Webhook event history
- **paypalResponse**: Full PayPal API responses

## 📧 Notification System

### Email Templates

- **Application Started**: Welcome with application ID and resume link
- **Application Completed**: Submission confirmation with next steps
- **Status Updates**: Processing status notifications

### Providers

- **Gmail**: Production email service
- **SMTP**: Custom SMTP configuration
- **Ethereal**: Development/testing

## 🚀 Deployment Options

### Production Deployment

1. Set `NODE_ENV=production`
2. Configure production database (MongoDB Atlas)
3. Set up Cloudinary for document storage
4. Configure production email provider
5. Set proper CORS origins and HTTPS

### Vercel Deployment

- Serverless function support
- Environment variable management
- Automatic scaling capabilities

### Docker Support (Future)

- Containerized deployment
- Multi-environment support
- Easy scaling

## 🛠 Available Scripts

```bash
# Development
npm run dev          # Start development server with nodemon
npm start           # Start production server

# Database
npm run seed        # Seed database with visa fee data
npm run seed:dev    # Seed database in development mode

# Code Quality
npm run lint        # Run ESLint
npm run lint:fix    # Fix ESLint issues automatically
npm run format      # Format code with Prettier

# Testing
npm test            # Run test suite (future)
```

## 📈 Monitoring & Logging

### Logging System

- **Winston Logger**: Structured JSON logging
- **Log Levels**: error, warn, info, debug
- **File Rotation**: Automatic log rotation
- **Development**: Console output with colors

### Health Monitoring

- **Health Endpoint**: `/health` - System status
- **Readiness Probe**: `/ready` - Database connectivity
- **Metrics**: Request/response monitoring

### Error Handling

- **Centralized Middleware**: Consistent error responses
- **Operational Errors**: Expected errors (validation, DB issues)
- **Programming Errors**: Unexpected bugs
- **Development**: Full stack traces
- **Production**: Sanitized error messages

## 🔄 Adding New Countries

### 1. Create Country Models

```javascript
// models/{Country}Application.js
// models/{Country}VisaFee.js
```

### 2. Create Validation Schemas

```javascript
// utils/{country}Validation.js
```

### 3. Create Controllers

```javascript
// controllers/{country}VisaController.js
```

### 4. Create Routes

```javascript
// routes/{country}Visa.js
```

### 5. Create Database Seeds

```javascript
// scripts/seed{Country}VisaFees.js
```

### 6. Update Main App

```javascript
// index.js - Add country routes
app.use('/api/v1/{country}', {country}Routes);
```

### 7. Create Documentation

```markdown
# {country}.md - Country-specific documentation
```

## 🔄 Future Enhancements

### Core Features

- **Admin Dashboard**: Application management interface
- **Document AI**: Automated document verification
- **Real-time Updates**: WebSocket status notifications
- **SMS Integration**: Additional notification channels
- **Multi-Payment Providers**: Add Stripe, Razorpay, etc.

### Scalability

- **Microservices**: Split by country/domain
- **Queue System**: Background job processing
- **Caching**: Redis for performance
- **Load Balancing**: Multi-instance deployment

### Security

- **Rate Limiting**: Advanced protection
- **Audit Logging**: Complete action tracking
- **Encryption**: Data encryption at rest
- **Compliance**: GDPR/CCPA compliance

## 🤝 Development Guidelines

### Code Style

- **ES Modules**: Modern JavaScript imports/exports
- **Async/Await**: No callback hell
- **Functional Programming**: Prefer pure functions
- **TypeScript Ready**: Easy migration path

### File Organization

- **kebab-case**: Folder and file names
- **PascalCase**: Class names and models
- **camelCase**: Variables and functions
- **Consistent Structure**: Follow established patterns

### Testing Strategy

- **Unit Tests**: Models, utilities, validation
- **Integration Tests**: API endpoints
- **E2E Tests**: Complete workflows
- **CI/CD**: Automated testing pipeline

## 📋 Current Implementation Status

| Country      | Status      | API Endpoints | Database  | Documentation               |
| ------------ | ----------- | ------------- | --------- | --------------------------- |
| Turkey 🇹🇷    | ✅ Complete | 8 endpoints   | ✅ Seeded | ✅ [turkey.md](./turkey.md) |
| Australia 🇦🇺 | 🔄 Planned  | -             | -         | -                           |
| UAE 🇦🇪       | 🔄 Planned  | -             | -         | -                           |

## 📞 Support & Documentation

- **Turkey Guide**: See [turkey.md](./turkey.md) for complete documentation
- **API Reference**: Inline code documentation
- **Troubleshooting**: Check logs in `logs/` directory
- **Environment Setup**: Follow setup instructions above

## 📄 License

This project is licensed under the ISC License.

---

**Built with ❤️ for seamless global visa processing** 🌍
