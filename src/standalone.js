// Utility function
function sanitize(input) {
  if (typeof input !== 'string') return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// Load external CSS
if (!document.getElementById('recceda-styles')) {
  const link = document.createElement('link');
  link.id = 'recceda-styles';
  link.rel = 'stylesheet';
  link.href = './styles.css';
  document.head.appendChild(link);
}

class ReccedaForm {
  constructor(formId, schema, targetElement) {
    this.formId = formId;
    this.schema = schema;
    this.targetElement = targetElement;
  }

  static async init(formId, targetElementId) {
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

  static async fetchSchema(formId) {
    const response = await fetch(`http://localhost:8080/public/submission/form/${formId}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    console.log('API Response:', data);
    
    // Handle different possible response formats
    if (data.success && data.data && data.data[0] && data.data[0].fields) {
      return data.data[0];
    } else if (data.fields) {
      return data;
    } else if (data.success && data.data && data.data.fields) {
      return data.data;
    } else if (Array.isArray(data) && data[0] && data[0].fields) {
      return data[0];
    }
    
    throw new Error('Invalid schema format');
  }

  render() {
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

  createField(field) {
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

  createInput(field) {
    let input;

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
          input.appendChild(opt);
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
      input.type = 'checkbox';
      
      const checkboxLabel = document.createElement('label');
      checkboxLabel.setAttribute('for', field.name);
      checkboxLabel.textContent = sanitize(field.label);
      
      container.appendChild(input);
      container.appendChild(checkboxLabel);
      
      input.name = field.name;
      input.id = field.name;
      
      if (field.defaultValue) input.checked = field.defaultValue === 'true';
      if (field.readOnly) input.readOnly = true;
      if (field.disabled) input.disabled = true;
      
      return container;
    } else {
      input = document.createElement('input');
      input.type = field.fieldType === 'number' ? 'number' : 
                  field.fieldType === 'email' ? 'email' : 'text';
    }

    input.name = field.name;
    input.id = field.name;

    if (field.placeholder) input.placeholder = sanitize(field.placeholder);
    if (field.required) input.required = true;
    if (field.regex) input.pattern = field.regex;
    if (field.defaultValue) input.value = sanitize(field.defaultValue);
    if (field.readOnly) input.readOnly = true;
    if (field.disabled) input.disabled = true;

    return input;
  }

  handleSubmit(e) {
    e.preventDefault();
    
    if (!this.validateForm(e)) return;

    const formData = this.serializeForm();
    this.submitForm(formData);
  }

  validateForm(e) {
    const form = e.target;
    let isValid = true;

    this.schema.fields.forEach(field => {
      const input = form.querySelector(`[name="${field.name}"]`);
      const errorDiv = input.closest('.recceda-field').querySelector('.recceda-error');
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

  serializeForm() {
    const form = document.getElementById(`recceda-form-${this.formId}`);
    const fields = [];

    this.schema.fields.forEach(field => {
      const input = form.querySelector(`[name="${field.name}"]`);
      if (input) {
        let value;
        if (field.fieldType === 'checkbox') {
          value = input.checked;
        } else if (field.fieldType === 'radio') {
          const checked = form.querySelector(`[name="${field.name}"]:checked`);
          value = checked ? checked.value : '';
        } else {
          value = input.value;
        }
        
        fields.push({
          fieldName: field.label,
          value: value
        });
      }
    });

    return { fields };
  }

  async submitForm(formData) {
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
      return { error: error.message };
    }
  }

  showMessage(message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.textContent = message;
    messageDiv.className = `recceda-message ${type === 'green' ? 'success' : 'error'}`;
    
    const form = document.getElementById(`recceda-form-${this.formId}`);
    form.parentNode.insertBefore(messageDiv, form.nextSibling);
    
    setTimeout(() => messageDiv.remove(), 5000);
  }
}

// Expose globally for browser usage
window.ReccedaForm = ReccedaForm;