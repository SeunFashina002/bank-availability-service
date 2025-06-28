# Bank Availability Service

A robust NestJS service that calculates and reports bank availability based on transaction data. This service processes transaction status codes to determine bank health and provides real-time availability metrics through a RESTful API.

## 🎯 Project Overview

This service addresses the challenge of monitoring bank availability by:

- Processing transaction status data for different banks
- Calculating availability percentages over configurable time windows
- Providing confidence levels for availability scores
- Exposing availability data through a simple, well-documented API

## 🛠 Technology Stack

- **Framework**: [NestJS](https://nestjs.com/) - A progressive Node.js framework
- **Language**: [TypeScript](https://www.typescriptlang.org/) - For type safety and better developer experience
- **Testing**: [Jest](https://jestjs.io/) - Comprehensive testing framework
- **API Documentation**: [Swagger/OpenAPI](https://swagger.io/) - Interactive API documentation
- **Storage**: JSON file-based persistence for simplicity and portability

## 📋 Features

### Core Functionality

- ✅ Bank availability calculation based on transaction status codes
- ✅ Availability expressed as percentage (0-100%)
- ✅ Configurable time windows (1h, 6h, 24h, or custom hours)
- ✅ Confidence level assessment (Insufficient Data, Low, Medium, High)
- ✅ RESTful API endpoints for single bank and all banks
- ✅ Persistent data storage using JSON files
- ✅ Comprehensive error handling

### Status Code Support

- **"00"**: Successful transaction (counts towards available)
- **"91"**: Beneficiary bank unavailable (counts towards unavailable)
- Other status codes are filtered out for calculation purposes

### API Endpoints

- `GET /banks/{bank_code}/availability` - Get availability for a specific bank
- `GET /banks/availability` - Get availability for all banks
- Both endpoints support optional `window` query parameter

## 🚀 Installation & Setup

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager

### Installation Steps

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd bank-availability-service
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Build the project**
   ```bash
   npm run build
   ```

## 🏃‍♂️ Running the Service

### Development Mode

```bash
npm run start:dev
```

The service will start on `http://localhost:3000` with hot reload enabled.

### Production Mode

```bash
npm run start:prod
```

### Debug Mode

```bash
npm run start:debug
```

## 📚 API Documentation

Once the service is running, you can access the interactive Swagger documentation at:

```
http://localhost:3000/api/docs
```

### Endpoint Examples

#### Get Bank Availability

```bash
# Get availability for BANK_A with default 1-hour window
curl http://localhost:3000/banks/BANK_A/availability

# Get availability with custom 6-hour window
curl http://localhost:3000/banks/BANK_A/availability?window=6h

# Get availability with numeric window (12 hours)
curl http://localhost:3000/banks/BANK_A/availability?window=12
```

#### Get All Banks Availability

```bash
# Get availability for all banks with 24-hour window
curl http://localhost:3000/banks/availability?window=24h
```

### Response Format

```json
{
  "bank_code": "BANK_A",
  "availability_percentage": 85.5,
  "confidence_level": "High",
  "time_window": "1h",
  "last_calculated_at": "2024-01-01T10:30:00Z",
  "total_transactions_in_window": 100,
  "status_counts": {
    "00": 85,
    "91": 15
  }
}
```

## 🧪 Testing

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Run Tests with Coverage

```bash
npm run test:cov
```

### Run Specific Test Files

```bash
# Test storage service
npm test -- --testPathPattern=storage.service.spec.ts

# Test availability service
npm test -- --testPathPattern=availability.service.spec.ts

# Test transaction service
npm test -- --testPathPattern=transactions.service.spec.ts

# Test controller
npm test -- --testPathPattern=availability.controller.spec.ts
```

### Test Coverage Results

Current test coverage:

- **Overall**: 84.93% statements, 82.92% branches, 97.36% functions, 86% lines
- **Availability Service**: 100% coverage
- **Transactions Service**: 100% coverage
- **Storage Service**: 94% statements, 100% branches, 100% functions
- **Controller**: 89.74% statements, 61.53% branches, 100% functions

## 🏗 Architecture & Design Decisions

### Service Architecture

### Key Design Decisions

1. **JSON File Storage**: Chose JSON files over in-memory storage for persistence and data portability
2. **Service Layer Separation**: Separated business logic (services) from HTTP handling (controllers)
3. **TypeScript Interfaces**: Used strict typing for better code quality and developer experience
4. **Comprehensive Testing**: Implemented unit tests for all business logic and integration tests for API endpoints
5. **Flexible Time Windows**: Support for multiple time windows (1h, 6h, 24h, custom) as a bonus feature
6. **Error Handling**: Proper HTTP status codes and meaningful error messages

### Availability Calculation Logic

1. **Filter transactions** by time window and bank code
2. **Count status codes**: "00" (success) and "91" (unavailable)
3. **Calculate percentage**: `(successful_transactions / total_relevant_transactions) * 100`
4. **Determine confidence level**:
   - 0 transactions: "Insufficient Data"
   - 1-5 transactions: "Low"
   - 6-20 transactions: "Medium"
   - > 20 transactions: "High"

## 🔧 Configuration

### Environment Variables

The service uses default configurations, but you can customize:

- Port: Default 3000
- Data directory: `./data/` (auto-created)
- Sample data generation: Automatic when no transactions exist

### Data Files

- `data/transactions.json` - Stored transaction data
- `data/availability.json` - Cached availability calculations

## 🚀 Bonus Features Implemented

1. **Multiple Time Windows**: Support for 1h, 6h, 24h, and custom hour windows
2. **All Banks Endpoint**: `GET /banks/availability` returns data for all monitored banks
3. **Persistent Storage**: JSON file-based storage with automatic data generation
4. **Comprehensive Testing**: Unit tests, integration tests, and 84%+ coverage
5. **API Documentation**: Interactive Swagger documentation
6. **Error Handling**: Proper HTTP status codes and validation

## 🎉 Acknowledgments

- Built with [NestJS](https://nestjs.com/) framework
- Testing powered by [Jest](https://jestjs.io/)
- API documentation with [Swagger](https://swagger.io/)
