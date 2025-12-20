import { UnprocessableEntityException } from '@nestjs/common';
import { createZodValidationPipe } from 'nestjs-zod';
import { ZodError } from 'zod';

const CustomZodValidationPipe: any = createZodValidationPipe({
  createValidationException: (error: ZodError) => {
    return new UnprocessableEntityException(
      error.issues.map((error) => {
        return {
          ...error,
          path: error.path.join('.'),
        };
      }),
    );
  },
});

export default CustomZodValidationPipe;
