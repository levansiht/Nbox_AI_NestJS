import { Injectable } from '@nestjs/common';
import { ROLENAME } from 'src/shared/contants/role.constant';
import { PrismaService } from 'src/shared/services/prisma.service';

@Injectable()
export class RolesService {
  private clientRoleId: number | null = null;
  constructor(private readonly prismaService: PrismaService) {}

  async getClientRoleId(): Promise<number> {
    if (this.clientRoleId) {
      return this.clientRoleId;
    }

    const role = await this.prismaService.role.findFirstOrThrow({
      where: {
        name: ROLENAME.User,
      },
    });

    this.clientRoleId = role.id;
    return this.clientRoleId;
  }
}
