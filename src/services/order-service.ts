import {createHash, randomUUID} from 'node:crypto';
import {access} from 'node:fs/promises';
import {
  DeliverableSchema,
  RevenueStateSchema,
  type Approval,
  type Customer,
  type Deliverable,
  type Intake,
  type Order,
  type OrderStatus,
  type RevenueState,
} from '../domain/schema';
import {appendAuditEvent} from '../storage/audit-log';
import {createJsonStore} from '../storage/json-store';
import {normalizeIntake} from './intake-service';

type OrderServiceOptions = {
  stateFile: string;
  auditFile: string;
  uploadRoot: string;
  now?: () => string;
};

const emptyState = (): RevenueState => ({version: 1, customers: [], orders: []});
const hash = (value: unknown): string =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex');
const id = (prefix: string): string => `${prefix}_${randomUUID().replaceAll('-', '')}`;

const transitions: Record<OrderStatus, OrderStatus[]> = {
  intake: ['planned'],
  planned: ['producing'],
  producing: ['review'],
  review: ['producing', 'approved'],
  approved: ['delivered'],
  delivered: [],
};

export const manifestHashFor = (deliverables: Deliverable[]): string =>
  hash(
    deliverables
      .map(({id: deliverableId, kind, path: deliverablePath, checksum, status}) => ({
        id: deliverableId,
        kind,
        path: deliverablePath,
        checksum: checksum || null,
        status,
      }))
      .sort((left, right) => left.id.localeCompare(right.id)),
  );

export const createOrderService = (options: OrderServiceOptions) => {
  const now = options.now ?? (() => new Date().toISOString());
  const store = createJsonStore(options.stateFile, RevenueStateSchema);

  const readState = async (): Promise<RevenueState> => {
    try {
      await access(options.stateFile);
      return await store.read();
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return emptyState();
      throw error;
    }
  };

  const save = async (before: RevenueState, after: RevenueState, action: string, entityId: string, actor: string) => {
    await store.write(after);
    await appendAuditEvent(options.auditFile, {
      id: id('audit'),
      at: now(),
      actor,
      action,
      entityType: 'order',
      entityId,
      beforeHash: hash(before),
      afterHash: hash(after),
    });
  };

  return {
    async createOrder(input: Intake | unknown): Promise<Order> {
      const intake = normalizeIntake(input, options.uploadRoot);
      const timestamp = now();
      const customerId = id('customer');
      const order: Order = {
        id: id('order'),
        customerId,
        status: 'intake',
        shortCount: 4,
        deliverables: [],
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      const before = await readState();
      const after: RevenueState = {
        ...before,
        customers: [
          ...before.customers,
          {...intake, id: customerId, createdAt: timestamp, updatedAt: timestamp},
        ],
        orders: [...before.orders, order],
      };
      await save(before, after, 'order.created', order.id, 'operator');
      return order;
    },

    async transitionOrder(orderId: string, next: OrderStatus, actor: string): Promise<Order> {
      const before = await readState();
      const current = before.orders.find((order) => order.id === orderId);
      if (!current) throw new Error('order not found');
      if (next === 'delivered' && current.approval?.state !== 'approved') {
        throw new Error('approval required before delivery');
      }
      if (!transitions[current.status].includes(next)) {
        throw new Error(`invalid transition: ${current.status} -> ${next}`);
      }
      const updated: Order = {...current, status: next, updatedAt: now()};
      const after = {...before, orders: before.orders.map((order) => (order.id === orderId ? updated : order))};
      await save(before, after, `order.${next}`, orderId, actor);
      return updated;
    },

    async getOrder(orderId: string): Promise<Order> {
      const order = (await readState()).orders.find((entry) => entry.id === orderId);
      if (!order) throw new Error('order not found');
      return order;
    },

    async getCustomerForOrder(orderId: string): Promise<Customer> {
      const state = await readState();
      const order = state.orders.find((entry) => entry.id === orderId);
      if (!order) throw new Error('order not found');
      const customer = state.customers.find((entry) => entry.id === order.customerId);
      if (!customer) throw new Error('customer not found');
      return customer;
    },

    async recordDeliverables(orderId: string, input: Deliverable[], actor: string): Promise<Order> {
      const deliverables = DeliverableSchema.array().parse(input);
      if (deliverables.some((item) => item.orderId !== orderId)) throw new Error('deliverable order mismatch');
      if (deliverables.filter((item) => item.kind === 'website').length !== 1) throw new Error('one website required');
      if (deliverables.filter((item) => item.kind === 'short-brief').length !== 4) throw new Error('four shorts required');
      if (deliverables.filter((item) => item.kind === 'social-copy').length !== 1) throw new Error('social copy required');
      const before = await readState();
      const current = before.orders.find((entry) => entry.id === orderId);
      if (!current) throw new Error('order not found');
      if (!['producing', 'review', 'approved'].includes(current.status)) throw new Error('order is not producing');
      const manifestHash = manifestHashFor(deliverables);
      const approvalStillValid = current.approval?.manifestHash === manifestHash;
      const updated: Order = {
        ...current,
        deliverables,
        manifestHash,
        approval: approvalStillValid ? current.approval : undefined,
        status: approvalStillValid && current.approval?.state === 'approved' ? 'approved' : 'review',
        updatedAt: now(),
      };
      const after = {...before, orders: before.orders.map((entry) => (entry.id === orderId ? updated : entry))};
      await save(before, after, 'order.deliverables-recorded', orderId, actor);
      return updated;
    },

    async setApproval(orderId: string, approval: Approval, status: 'review' | 'approved' | 'producing', actor: string): Promise<Order> {
      const before = await readState();
      const current = before.orders.find((entry) => entry.id === orderId);
      if (!current) throw new Error('order not found');
      const updated: Order = {...current, approval, status, updatedAt: now()};
      const after = {...before, orders: before.orders.map((entry) => (entry.id === orderId ? updated : entry))};
      await save(before, after, `approval.${approval.state}`, orderId, actor);
      return updated;
    },

    async getState(): Promise<RevenueState> {
      return readState();
    },
  };
};

export type OrderService = ReturnType<typeof createOrderService>;
