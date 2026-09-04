import { z } from 'zod';
import { constants } from '../config/constants.js';

export const ValidationService = {
  // Build Zod schema from definition
  buildZodSchema(schemaDefinition) {
    const fields = schemaDefinition.fields || {};
    const shape = {};

    for (const [fieldName, rules] of Object.entries(fields)) {
      let validator;

      switch (rules.type) {
        case 'string':
          validator = z.string();
          if (rules.min !== undefined) validator = validator.min(rules.min);
          if (rules.max !== undefined) validator = validator.max(rules.max);
          break;

        case 'number':
          validator = z.number();
          if (rules.min !== undefined) validator = validator.min(rules.min);
          if (rules.max !== undefined) validator = validator.max(rules.max);
          break;

        case 'boolean':
          validator = z.boolean();
          break;

        case 'array':
          validator = z.array(z.any());
          break;

        case 'object':
          validator = z.record(z.any());
          break;

        case 'email':
          validator = z.string().email();
          break;

        case 'url':
          validator = z.string().url();
          break;

        default:
          validator = z.any();
      }

      if (rules.required) {
        shape[fieldName] = validator;
      } else {
        shape[fieldName] = validator.optional();
      }
    }

    return z.object(shape);
  },

  // Validate data against schema definition
  validate(data, schemaDefinition) {
    try {
      const zodSchema = this.buildZodSchema(schemaDefinition);
      const result = zodSchema.safeParse(data);

      if (result.success) {
        return {
          valid: true,
          data: result.data,
          errors: null
        };
      }

      return {
        valid: false,
        data: null,
        errors: this.formatErrors(result.error.errors)
      };
    } catch (error) {
      return {
        valid: false,
        data: null,
        errors: [{ message: 'Invalid schema definition', path: [] }]
      };
    }
  },

  // Format Zod errors for API response
  formatErrors(zodErrors) {
    return zodErrors.map(error => ({
      field: error.path.join('.'),
      message: error.message
    }));
  },

  // Validate request body against a schema
  validateBody(body, schemaDefinition) {
    return this.validate(body, schemaDefinition);
  },

  // Quick validation for required fields
  validateRequired(data, requiredFields) {
    const errors = [];
    for (const field of requiredFields) {
      if (data[field] === undefined || data[field] === null || data[field] === '') {
        errors.push({
          field,
          message: `${field} is required`
        });
      }
    }
    return {
      valid: errors.length === 0,
      errors
    };
  },

  // Validate email format
  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },

  // Validate URL format
  isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  // Validate status code
  isValidStatusCode(code) {
    return code >= 100 && code <= 599;
  }
};