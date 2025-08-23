# API Documentation

## ReccedaForm.init(formId, targetElementId)

Initializes and renders a form in the specified container.

### Parameters
- `formId` (string): Unique form identifier from Recceda
- `targetElementId` (string): DOM element ID where the form will be rendered

### Returns
- `Promise<void>`

### Example
```javascript
ReccedaForm.init("68a9c905c61c03529d9384d5", "form-container");
```

## Field Types

| Type | Description |
|------|-------------|
| `text` | Text input |
| `email` | Email input with validation |
| `number` | Number input |
| `textarea` | Multi-line text area |
| `select` | Dropdown selection |
| `radio` | Radio button group |
| `checkbox` | Checkbox input |

## Field Properties

| Property | Type | Description |
|----------|------|-------------|
| `label` | string | Field label (required) |
| `placeholder` | string | Input placeholder text |
| `required` | boolean | Makes field mandatory |
| `regex` | string | Pattern validation |
| `defaultValue` | string | Pre-filled value |
| `readOnly` | boolean | Makes field read-only |
| `disabled` | boolean | Disables field interaction |
| `options` | array | Options for select/radio fields |