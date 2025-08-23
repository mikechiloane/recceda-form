# Recceda Form JavaScript Library

A lightweight JavaScript library for dynamically generating forms from Recceda schemas.

## Features

- **Zero Dependencies**: Pure JavaScript, no external libraries required
- **Dynamic Form Generation**: Builds forms from JSON schema
- **Built-in Validation**: Required fields and regex pattern validation
- **XSS Protection**: Sanitizes all user inputs and schema data
- **Accessibility**: Proper label associations and semantic HTML
- **Modern Browser Support**: Works with Chrome, Firefox, Safari, and Edge

## Quick Start

1. Download `recceda.min.js` and include it in your project
2. Add a container element and initialize the form:

```html
<div id="form-container"></div>
<script src="recceda.min.js"></script>
<script>
  ReccedaForm.init("your-form-id", "form-container");
</script>
```

## API Reference

### ReccedaForm.init(formId, targetElementId)

Initializes and renders a form in the specified container.

**Parameters:**
- `formId` (string): Unique form identifier from Recceda
- `targetElementId` (string): DOM element ID where the form will be rendered

**Example:**
```javascript
ReccedaForm.init("68a9c905c61c03529d9384d5", "my-form");
```

## Supported Field Types

- `text` - Text input
- `email` - Email input with validation
- `number` - Number input
- `textarea` - Multi-line text area
- `select` - Dropdown selection
- `radio` - Radio button group
- `checkbox` - Checkbox input

## Field Properties

- `label` - Field label (required)
- `placeholder` - Input placeholder text
- `required` - Makes field mandatory
- `regex` - Pattern validation
- `defaultValue` - Pre-filled value
- `readOnly` - Makes field read-only
- `disabled` - Disables field interaction
- `options` - Array of options for select/radio fields

## Error Handling

The library handles various error scenarios:

- **Schema Loading Failure**: Shows "Failed to load form." message
- **Validation Errors**: Displays inline error messages under fields
- **Submission Failure**: Shows "Submission failed." message
- **Console Logging**: All errors are logged to browser console

## Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## File Structure

- `recceda.js` - Development version with readable code
- `recceda.min.js` - Minified production version
- `test.html` - Example implementation

## Security

- All user inputs and schema data are sanitized to prevent XSS attacks
- Form submissions use secure HTTPS endpoints
- No sensitive data is stored in browser memory