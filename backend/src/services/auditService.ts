import { prisma } from '../database/db.js';

export class AuditService {
  async log(entry: {
    userId?: string;
    agentId?: string;
    action: string;
    resource: string;
    details: string;
    ipAddress?: string;
  }) {
    try {
      return await prisma.auditLog.create({
        data: {
          userId: entry.userId,
          agentId: entry.agentId,
          action: entry.action,
          resource: entry.resource,
          details: entry.details,
          ipAddress: entry.ipAddress
        }
      });
    } catch (err) {
      console.error('AuditLog error:', err);
    }
  }

  async getLogs(agentId?: string, limit: number = 50) {
    return prisma.auditLog.findMany({
      where: agentId ? { agentId } : {},
      orderBy: { timestamp: 'desc' },
      take: limit,
      include: {
        agent: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, email: true } }
      }
    });
  }
}

export const auditService = new AuditService();

