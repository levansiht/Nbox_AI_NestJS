import { createZodDto } from 'nestjs-zod';
import { MessageResSchema } from 'src/routes/auth/auth.model';

export class MessageResDTO extends createZodDto(MessageResSchema) {}
