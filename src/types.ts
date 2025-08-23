export interface FieldOption {
  value?: string;
  label?: string;
}

export interface Field {
  name: string;
  fieldType: 'text' | 'email' | 'number' | 'textarea' | 'select' | 'radio' | 'checkbox';
  label: string;
  placeholder?: string;
  required?: boolean;
  regex?: string;
  defaultValue?: string;
  readOnly?: boolean;
  disabled?: boolean;
  options?: (FieldOption | string)[];
}

export interface Schema {
  id: string;
  name: string;
  description: string;
  fields: Field[];
}

export interface ApiResponse {
  success: boolean;
  data: Schema[];
}

export interface ReccedaFormData {
  [key: string]: string | boolean;
}