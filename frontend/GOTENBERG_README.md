# Gotenberg PDF Converter Integration

This project includes React components that integrate with Gotenberg (running in Docker) to convert HTML content to PDF documents.

## Components

### 1. GotenbergPDFConverter
A general-purpose React component for converting HTML content to PDF.

```jsx
import GotenbergPDFConverter from './Components/GotenbergPDFConverter';

<GotenbergPDFConverter
  htmlContent="<h1>Hello World</h1><p>This will be converted to PDF</p>"
  fileName="my-document.pdf"
  buttonText="Download PDF"
  options={{
    format: 'A4',
    marginTop: '1in',
    marginBottom: '1in',
    marginLeft: '1in',
    marginRight: '1in'
  }}
/>
```

### 2. CVPDFGenerator
A specialized component for generating PDFs from CV data structures.

```jsx
import CVPDFGenerator from './Components/CVPDFGenerator';

const cvData = {
  personalInfo: {
    name: 'John Doe',
    email: 'john@example.com'
  },
  education: [...],
  employment: [...],
  publications: [...]
};

<CVPDFGenerator
  cvData={cvData}
  fileName="john-doe-cv.pdf"
  showPreview={true}
/>
```

### 3. useGotenbergPDF Hook
A custom React hook for programmatic PDF conversion.

```jsx
import useGotenbergPDF from './hooks/useGotenbergPDF';

function MyComponent() {
  const { convertAndDownload, isConverting, checkServiceAvailability } = useGotenbergPDF();

  const handleConvert = async () => {
    await convertAndDownload(
      '<h1>Document</h1><p>Content here</p>',
      'document.pdf'
    );
  };

  return (
    <button onClick={handleConvert} disabled={isConverting}>
      {isConverting ? 'Converting...' : 'Generate PDF'}
    </button>
  );
}
```

## Setup Instructions

### 1. Start Gotenberg Service

Make sure Docker is installed and running, then start the Gotenberg service:

```bash
# From the project root directory
docker-compose up -d
```

This will start the Gotenberg service on port 3000.

### 2. Verify Service is Running

Check if Gotenberg is running:

```bash
# Check container status
docker-compose ps

# Check health
curl http://localhost:3000/health
```

### 3. Use in React Components

Import and use the components in your React application:

```jsx
import PDFExamples from './Components/PDFExamples';

function App() {
  return (
    <div>
      <PDFExamples />
    </div>
  );
}
```

## Configuration Options

### PDF Conversion Options

The following options can be passed to customize PDF generation:

- `marginTop`, `marginBottom`, `marginLeft`, `marginRight`: Page margins (e.g., '1in', '2cm')
- `format`: Paper format ('A4', 'Letter', 'Legal', etc.)
- `landscape`: Boolean for landscape orientation
- `scale`: Scale factor (0.1 to 2.0)
- `printBackground`: Include background graphics
- `waitDelay`: Time to wait before conversion (e.g., '2s')
- `emulatedMediaType`: CSS media type ('print' or 'screen')

### Gotenberg URL Configuration

By default, the components connect to `http://localhost:3000`. You can change this:

```jsx
<GotenbergPDFConverter
  gotenbergUrl="http://your-gotenberg-server:3000"
  // ... other props
/>
```

## Docker Configuration

### docker-compose.yml

The included `docker-compose.yml` provides:

```yaml
services:
  gotenberg:
    image: gotenberg/gotenberg:8.11.1
    ports:
      - "3000:3000"
    # Additional configuration for CORS and security
    
  gotenberg-proxy:
    image: nginx:alpine
    ports:
      - "3001:80"
    # CORS proxy for browser compatibility
```

### Environment Variables

You can customize Gotenberg using environment variables:

- `GOTENBERG_API_PORT`: API port (default: 3000)
- `GOTENBERG_LOG_LEVEL`: Logging level (INFO, DEBUG, etc.)
- `GOTENBERG_CHROMIUM_DISABLE_WEB_SECURITY`: Disable web security for local development

## Troubleshooting

### Common Issues

1. **Service Not Available**
   - Ensure Docker is running
   - Check if containers are started: `docker-compose ps`
   - Verify port 3000 is not in use by another service

2. **CORS Errors (if any)**
   - Configure your development server to disable CORS or use --disable-web-security flag in Chrome
   - Make sure Gotenberg is configured with CORS disabled for development

3. **PDF Generation Fails**
   - Check Gotenberg logs: `docker-compose logs gotenberg`
   - Ensure HTML content is valid
   - Try increasing `waitDelay` for complex content

4. **Large File Issues**
   - Adjust `client_max_body_size` in nginx configuration
   - Increase timeout values in docker-compose.yml

### Debugging

Enable debug logging in Gotenberg:

```yaml
# In docker-compose.yml
environment:
  - GOTENBERG_LOG_LEVEL=DEBUG
```

Check component state in browser dev tools:

```jsx
const { isConverting, lastError } = useGotenbergPDF();
console.log('Converting:', isConverting);
console.log('Last error:', lastError);
```

## Security Considerations

### Production Deployment

For production use:

1. **Remove CORS proxy** if not needed
2. **Enable authentication** on Gotenberg service
3. **Use HTTPS** for secure communication
4. **Restrict network access** to Gotenberg service
5. **Validate input** before sending to Gotenberg

### Example Production Configuration

```yaml
# production docker-compose.yml
services:
  gotenberg:
    image: gotenberg/gotenberg:8.11.1
    networks:
      - internal
    environment:
      - GOTENBERG_CHROMIUM_DISABLE_WEB_SECURITY=false
    # Remove port mapping for internal access only
```

## Advanced Usage

### Custom CSS Styling

Add custom CSS for better PDF formatting:

```jsx
const htmlWithCustomCSS = `
  <style>
    @media print {
      .page-break { page-break-before: always; }
      .no-print { display: none; }
    }
    body { font-family: 'Times New Roman', serif; }
  </style>
  <div>Your content here</div>
`;
```

### Batch PDF Generation

Process multiple documents:

```jsx
const { convertHtmlToPDF } = useGotenbergPDF();

const generateBatch = async (documents) => {
  const pdfs = await Promise.all(
    documents.map(doc => convertHtmlToPDF(doc.html, doc.filename))
  );
  return pdfs;
};
```

### Integration with Existing CV System

To integrate with your existing CV components:

```jsx
import CVPDFGenerator from './Components/CVPDFGenerator';

function CVDisplay({ cvData }) {
  return (
    <div>
      {/* Your existing CV display */}
      <CVDisplay data={cvData} />
      
      {/* Add PDF generation */}
      <CVPDFGenerator
        cvData={cvData}
        fileName={`${cvData.personalInfo.name}-cv.pdf`}
      />
    </div>
  );
}
```

## API Reference

### GotenbergPDFConverter Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `gotenbergUrl` | string | `'http://localhost:3000'` | Gotenberg service URL |
| `htmlContent` | string | `''` | HTML content to convert |
| `fileName` | string | `'converted-document.pdf'` | Output filename |
| `options` | object | `{}` | PDF conversion options |
| `buttonText` | string | `'Convert to PDF'` | Button text |
| `disabled` | boolean | `false` | Disable the button |
| `className` | string | `''` | Additional CSS classes |
| `onConversionStart` | function | - | Callback when conversion starts |
| `onConversionSuccess` | function | - | Callback when conversion succeeds |
| `onConversionError` | function | - | Callback when conversion fails |

### useGotenbergPDF Hook Returns

| Property | Type | Description |
|----------|------|-------------|
| `isConverting` | boolean | Conversion in progress |
| `lastError` | Error | Last error encountered |
| `lastConversionTime` | Date | Timestamp of last conversion |
| `convertHtmlToPDF` | function | Convert HTML and return blob |
| `convertAndDownload` | function | Convert HTML and download |
| `convertElementToPDF` | function | Convert DOM element |
| `convertPageToPDF` | function | Convert current page |
| `checkServiceAvailability` | function | Check if service is running |
