import { Injectable, InternalServerErrorException, UnprocessableEntityException } from '@nestjs/common';
import { Prisma } from 'generated/prisma/client';
import { ROLENAME } from 'src/shared/contants/role.constant';
import { HashingService } from 'src/shared/services/hashing.service';
import { PrismaService } from 'src/shared/services/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly hashingService: HashingService,
    private readonly prisma: PrismaService,
  ) {}

  async register(body: any) {
    try {
      const userRole = await this.prisma.role.findFirst({
        where: { name: ROLENAME.User },
      });

      if (!userRole) {
        throw new InternalServerErrorException('Default user role not found. Please run database seed.');
      }

      const hashedPassword = await this.hashingService.hash(body.password);
      const user = await this.prisma.user.create({
        data: {
          email: body.email,
          password: hashedPassword,
          name: body.name,
          phoneNumber: body.phoneNumber,
          roleId: userRole.id,
        },
      });
      return user;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new UnprocessableEntityException('Email already in use.');
      }
      throw error;
    }
  }
}
