import { Field, Schema, ApiResponse, ReccedaFormData } from './types';
import { sanitize } from './utils';

// Inject CSS styles
const css = `
.recceda-form {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.recceda-field {
  margin-bottom: 20px;
}

.recceda-field label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #333;
}

.recceda-field input,
.recceda-field textarea,
.recceda-field select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.recceda-field input:focus,
.recceda-field textarea:focus,
.recceda-field select:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
}

.recceda-field textarea {
  resize: vertical;
  min-height: 80px;
}

.recceda-radio-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.recceda-radio-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.recceda-radio-item input[type="radio"] {
  width: auto;
  margin: 0;
}

.recceda-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
}

.recceda-checkbox input[type="checkbox"] {
  width: auto;
  margin: 0;
}

.recceda-submit {
  background: #007bff;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.recceda-submit:hover {
  background: #0056b3;
}

.recceda-error {
  color: #dc3545;
  font-size: 12px;
  margin-top: 4px;
}

.recceda-message {
  padding: 10px;
  margin: 10px 0;
  border-radius: 4px;
  font-weight: 500;
}

.recceda-message.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.recceda-message.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}
`;

// Inject styles into document
if (!document.getElementById('recceda-styles')) {
  const style = document.createElement('style');
  style.id = 'recceda-styles';
  style.textContent = css;
  document.head.appendChild(style);
}

class ReccedaForm {
  private formId: string;
  private schema: Schema;
  private targetElement: HTMLElement;

  static async init(formId: string, targetElementId: string): Promise<void> {
    const targetElement = document.getElementById(targetElementId);
    if (!targetElement) {
      console.error(`Target element with ID "${targetElementId}" not found`);
      return;
    }

    try {
      const schema = await this.fetchSchema(formId);
      const form = new ReccedaForm(formId, schema, targetElement);
      form.render();
    } catch (error) {
      console.error('Failed to initialize form:', error);
      targetElement.innerHTML = 'Failed to load form.';
    }
  }

  static async fetchSchema(formId: string): Promise<Schema> {
    const response = await fetch(`http://localhost:8080/public/submission/form/${formId}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data: ApiResponse = await response.json();
    if (!data.success || !data.data || !data.data[0] || !data.data[0].fields) {
      throw new Error('Invalid schema format');
    }
    
    return data.data[0];
  }

  constructor(formId: string, schema: Schema, targetElement: HTMLElement) {
    this.formId = formId;
    this.schema = schema;
    this.targetElement = targetElement;
  }

  render(): void {
    const form = document.createElement('form');
    form.id = `recceda-form-${this.formId}`;
    form.className = 'recceda-form';
    
    this.schema.fields.forEach(field => {
      const fieldContainer = this.createField(field);
      form.appendChild(fieldContainer);
    });

    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.textContent = 'Submit';
    submitButton.className = 'recceda-submit';
    form.appendChild(submitButton);

    form.addEventListener('submit', (e) => this.handleSubmit(e));
    
    this.targetElement.innerHTML = '';
    this.targetElement.appendChild(form);
  }

  private createField(field: Field): HTMLDivElement {
    const container = document.createElement('div');
    container.className = 'recceda-field';
    
    const label = document.createElement('label');
    label.setAttribute('for', field.name);
    label.textContent = sanitize(field.label);
    container.appendChild(label);

    const input = this.createInput(field);
    container.appendChild(input);

    const errorDiv = document.createElement('div');
    errorDiv.className = 'recceda-error';
    container.appendChild(errorDiv);

    return container;
  }

  private createInput(field: Field): HTMLElement {
    let input: HTMLElement;

    if (field.fieldType === 'textarea') {
      input = document.createElement('textarea');
    } else if (field.fieldType === 'select') {
      input = document.createElement('select');
      if (field.options) {
        field.options.forEach(option => {
          const opt = document.createElement('option');
          const optValue = typeof option === 'string' ? option : (option.value || option.label || '');
          const optLabel = typeof option === 'string' ? option : (option.label || option.value || '');
          opt.value = sanitize(optValue);
          opt.textContent = sanitize(optLabel);
          (input as HTMLSelectElement).appendChild(opt);
        });
      }
    } else if (field.fieldType === 'radio') {
      const container = document.createElement('div');
      container.className = 'recceda-radio-group';
      if (field.options) {
        field.options.forEach(option => {
          const radioItem = document.createElement('div');
          radioItem.className = 'recceda-radio-item';
          
          const radioInput = document.createElement('input');
          radioInput.type = 'radio';
          radioInput.name = field.name;
          const optValue = typeof option === 'string' ? option : (option.value || option.label || '');
          const optLabel = typeof option === 'string' ? option : (option.label || option.value || '');
          radioInput.value = sanitize(optValue);
          radioInput.id = `${field.name}-${optValue}`;
          
          const radioLabel = document.createElement('label');
          radioLabel.setAttribute('for', radioInput.id);
          radioLabel.textContent = sanitize(optLabel);
          
          radioItem.appendChild(radioInput);
          radioItem.appendChild(radioLabel);
          container.appendChild(radioItem);
        });
      }
      return container;
    } else if (field.fieldType === 'checkbox') {
      const container = document.createElement('div');
      container.className = 'recceda-checkbox';
      
      input = document.createElement('input');
      (input as HTMLInputElement).type = 'checkbox';
      
      const checkboxLabel = document.createElement('label');
      checkboxLabel.setAttribute('for', field.name);
      checkboxLabel.textContent = sanitize(field.label);
      
      container.appendChild(input);
      container.appendChild(checkboxLabel);
      
      (input as HTMLInputElement).name = field.name;
      input.id = field.name;
      
      if (field.defaultValue) (input as HTMLInputElement).checked = field.defaultValue === 'true';
      if (field.readOnly) (input as HTMLInputElement).readOnly = true;
      if (field.disabled) (input as HTMLInputElement).disabled = true;
      
      return container;
    } else {
      input = document.createElement('input');
      (input as HTMLInputElement).type = field.fieldType === 'number' ? 'number' : 
                  field.fieldType === 'email' ? 'email' : 'text';
    }

    (input as HTMLInputElement).name = field.name;
    input.id = field.name;

    if (field.placeholder) (input as HTMLInputElement).placeholder = sanitize(field.placeholder);
    if (field.required) (input as HTMLInputElement).required = true;
    if (field.regex) (input as HTMLInputElement).pattern = field.regex;
    if (field.defaultValue) (input as HTMLInputElement).value = sanitize(field.defaultValue);
    if (field.readOnly) (input as HTMLInputElement).readOnly = true;
    if (field.disabled) (input as HTMLInputElement).disabled = true;

    return input;
  }

  private handleSubmit(e: Event): void {
    e.preventDefault();
    
    if (!this.validateForm(e)) return;

    const formData = this.serializeForm();
    this.submitForm(formData);
  }

  private validateForm(e: Event): boolean {
    const form = e.target as HTMLFormElement;
    let isValid = true;

    this.schema.fields.forEach(field => {
      const input = form.querySelector(`[name="${field.name}"]`) as HTMLInputElement;
      const errorDiv = input.closest('.recceda-field')!.querySelector('.recceda-error') as HTMLDivElement;
      errorDiv.textContent = '';

      if (field.required && !input.value.trim()) {
        errorDiv.textContent = `${field.label} is required`;
        isValid = false;
        return;
      }

      if (field.regex && input.value && !new RegExp(field.regex).test(input.value)) {
        errorDiv.textContent = `${field.label} format is invalid`;
        isValid = false;
      }
    });

    return isValid;
  }

  private serializeForm(): ReccedaFormData {
    const form = document.getElementById(`recceda-form-${this.formId}`) as HTMLFormElement;
    const formData: ReccedaFormData = {};

    this.schema.fields.forEach(field => {
      const input = form.querySelector(`[name="${field.name}"]`) as HTMLInputElement;
      if (input) {
        if (field.fieldType === 'checkbox') {
          formData[field.name] = input.checked;
        } else if (field.fieldType === 'radio') {
          const checked = form.querySelector(`[name="${field.name}"]:checked`) as HTMLInputElement;
          formData[field.name] = checked ? checked.value : '';
        } else {
          formData[field.name] = input.value;
        }
      }
    });

    return formData;
  }

  private async submitForm(formData: ReccedaFormData): Promise<any> {
    try {
      const response = await fetch(`http://localhost:8080/public/submission/form/${this.formId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      
      if (response.ok) {
        this.showMessage('Form submitted successfully!', 'green');
        return result;
      } else {
        throw new Error(result.message || 'Submission failed');
      }
    } catch (error) {
      console.error('Submission error:', error);
      this.showMessage('Submission failed.', 'red');
      return { error: (error as Error).message };
    }
  }

  private showMessage(message: string, type: string): void {
    const messageDiv = document.createElement('div');
    messageDiv.textContent = message;
    messageDiv.className = `recceda-message ${type === 'green' ? 'success' : 'error'}`;
    
    const form = document.getElementById(`recceda-form-${this.formId}`)!;
    form.parentNode!.insertBefore(messageDiv, form.nextSibling);
    
    setTimeout(() => messageDiv.remove(), 5000);
  }
}

// Expose globally for browser usage
(window as any).ReccedaForm = ReccedaForm;