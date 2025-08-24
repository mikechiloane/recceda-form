import { Field, Schema, ApiResponse, ReccedaFormData } from './types';
import { sanitize } from './utils';

export class ReccedaForm {
  private formId: string;
  private schema: Schema;
  private targetElement: HTMLElement;
  private baseUrl: string;

  static async init(formId: string, targetElementId: string, baseUrl: string = 'http://localhost:8080'): Promise<void> {
    const targetElement = document.getElementById(targetElementId);
    if (!targetElement) {
      console.error(`Target element with ID "${targetElementId}" not found`);
      return;
    }

    try {
      const schema = await this.fetchSchema(formId, baseUrl);
      const form = new ReccedaForm(formId, schema, targetElement, baseUrl);
      form.render();
    } catch (error) {
      console.error('Failed to initialize form:', error);
      targetElement.innerHTML = '<div style="text-align: center; padding: 40px 20px; color: #666; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif;"><h3 style="margin: 0 0 10px 0; color: #333;">Unable to Load Form</h3><p style="margin: 0; font-size: 14px;">Please check your connection and try again.</p></div>';
    }
  }

  static async fetchSchema(formId: string, baseUrl: string): Promise<Schema> {
    const response = await fetch(`${baseUrl}/public/submission/form/${formId}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data: ApiResponse = await response.json();
    if (!data.success || !data.data || !data.data[0] || !data.data[0].fields) {
      throw new Error('Invalid schema format');
    }
    
    return data.data[0];
  }

  constructor(formId: string, schema: Schema, targetElement: HTMLElement, baseUrl: string) {
    this.formId = formId;
    this.schema = schema;
    this.targetElement = targetElement;
    this.baseUrl = baseUrl;
  }

  render(): void {
    const container = document.createElement('div');
    container.className = 'recceda-form-container';
    
    if (this.schema.name) {
      const title = document.createElement('h1');
      title.className = 'recceda-form-title';
      title.textContent = sanitize(this.schema.name);
      container.appendChild(title);
    }
    
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
    
    container.appendChild(form);
    this.targetElement.innerHTML = '';
    this.targetElement.appendChild(container);
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
      errorDiv.classList.remove('show');

      if (field.required && !input.value.trim()) {
        errorDiv.textContent = `${field.label} is required`;
        errorDiv.classList.add('show');
        isValid = false;
        return;
      }

      if (field.regex && input.value && !new RegExp(field.regex).test(input.value)) {
        errorDiv.textContent = `${field.label} format is invalid`;
        errorDiv.classList.add('show');
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
      const response = await fetch(`${this.baseUrl}/public/submission/form/${this.formId}`, {
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
    form.insertBefore(messageDiv, form.firstChild);
    
    setTimeout(() => messageDiv.remove(), 5000);
  }
}