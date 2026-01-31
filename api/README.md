# Finance Bot API Documentation

This directory contains the OpenAPI 3.0 specification for the Finance Bot API.

## Files

- `openapi.yaml` - Complete OpenAPI 3.0.3 specification documenting all API endpoints

## Accessing the Documentation

### Option 1: View the Spec File Directly
The `openapi.yaml` file can be viewed in any text editor or YAML viewer.

### Option 2: Use the API Endpoint
When the API server is running, you can access the spec as JSON at:
```
GET http://localhost:3000/api-docs
```

### Option 3: Use Swagger UI (Recommended)
1. Install Swagger UI globally or use the online editor:
   ```bash
   npx swagger-ui-serve api/openapi.yaml
   ```
   Or visit https://editor.swagger.io/ and paste the contents of `openapi.yaml`

2. For a local interactive UI, you can also use:
   ```bash
   npm install -g swagger-ui-serve
   swagger-ui-serve api/openapi.yaml
   ```

## API Endpoints

The API provides the following endpoints:

### Health & Sample Data
- `GET /health` - Health check
- `GET /sample` - Get sample user data for testing

### Simulation
- `POST /simulate` - Simulate a single financial action (save, invest, or spend)
- `POST /compare` - Compare multiple financial actions side-by-side

### Analysis
- `POST /analyze` - Run simulation + AI agent analysis (returns both simulation and analysis results)

## Request/Response Examples

All endpoints are fully documented in the OpenAPI spec with:
- Request schemas
- Response schemas
- Example payloads
- Error responses

## Integration

The OpenAPI spec can be used to:
- Generate client SDKs (using tools like `openapi-generator`)
- Validate API requests/responses
- Generate API documentation websites
- Import into API testing tools (Postman, Insomnia, etc.)

## Testing

The API documentation is validated as part of the test suite:
```bash
npm run test:api
```

This ensures:
- The OpenAPI spec file exists
- The spec is valid YAML
- All endpoints are documented
- Required paths are present
