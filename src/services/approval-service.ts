import {randomUUID} from 'node:crypto';
import {ApprovalSchema, type Approval} from '../domain/schema';
import {manifestHashFor, type OrderService} from './order-service';

type ResolveInput = {
  orderId: string;
  operator: string;
  decision: 'approved' | 'rejected';
  note: string;
  manifestHash: string;
};

export const createApprovalService = (
  orders: OrderService,
  now: () => string = () => new Date().toISOString(),
) => ({
  async requestApproval(orderId: string): Promise<Approval> {
    const order = await orders.getOrder(orderId);
    if (order.status !== 'review') throw new Error('order must be in review');
    const manifestHash = manifestHashFor(order.deliverables);
    const approval = ApprovalSchema.parse({
      id: `approval_${randomUUID().replaceAll('-', '')}`,
      orderId,
      state: 'pending',
      manifestHash,
      note: '',
      createdAt: now(),
    });
    await orders.setApproval(orderId, approval, 'review', 'operator');
    return approval;
  },

  async resolveApproval(input: ResolveInput): Promise<Approval> {
    const order = await orders.getOrder(input.orderId);
    const currentHash = manifestHashFor(order.deliverables);
    if (!order.approval || order.approval.state !== 'pending') throw new Error('pending approval not found');
    if (input.manifestHash !== currentHash || input.manifestHash !== order.approval.manifestHash) {
      throw new Error('manifest changed; request approval again');
    }
    const approval = ApprovalSchema.parse({
      ...order.approval,
      state: input.decision,
      operator: input.operator,
      note: input.note,
      resolvedAt: now(),
    });
    await orders.setApproval(
      input.orderId,
      approval,
      input.decision === 'approved' ? 'approved' : 'producing',
      input.operator,
    );
    return approval;
  },
});

export type ApprovalService = ReturnType<typeof createApprovalService>;
