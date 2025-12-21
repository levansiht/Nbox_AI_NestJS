import { createZodDto } from 'nestjs-zod';
import { MessageResSchema } from 'src/routes/auth/auth.model';

export class MessageRes extends createZodDto(MessageResSchema) {}
