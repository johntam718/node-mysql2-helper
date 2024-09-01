import { z, ZodSchema, ZodError, infer as ZodInfer } from 'zod';

class ValidationHelper {
  private schema: ZodSchema<any>;

  constructor(schema: ZodSchema<any>) {
    this.schema = schema;
  }

  validate(data: unknown): ZodInfer<typeof this.schema> {
    try {
      return this.schema.parse(data);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new Error(`Validation failed: ${error.errors.map(e => e.message).join(', ')}`);
      }
      throw error;
    }
  }

  async validateAsync(data: unknown): Promise<ZodInfer<typeof this.schema>> {
    try {
      return this.schema.parseAsync(data);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new Error(`Validation failed: ${error.errors.map(e => e.message).join(', ')}`);
      }
      throw error;
    }
  }
}

export { ValidationHelper };