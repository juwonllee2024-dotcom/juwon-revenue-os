import type {Order} from '../domain/schema';
import {buildShortBriefs} from './content-service';
import type {OrderService} from './order-service';
import {buildLandingBundle} from './website-service';

export const createProductionService = (
  orders: OrderService,
  artifactRoot: string,
  now: () => string = () => new Date().toISOString(),
) => ({
  async produce(orderId: string): Promise<Order> {
    let order = await orders.getOrder(orderId);
    if (order.status === 'intake') order = await orders.transitionOrder(orderId, 'planned', 'operator');
    if (order.status === 'planned') order = await orders.transitionOrder(orderId, 'producing', 'operator');
    if (order.status !== 'producing') throw new Error('order is not ready for production');
    const customer = await orders.getCustomerForOrder(orderId);
    const website = await buildLandingBundle({order, customer, artifactRoot, now});
    const content = await buildShortBriefs({order, customer, artifactRoot, now});
    return orders.recordDeliverables(orderId, [website, ...content], 'operator');
  },
});

export type ProductionService = ReturnType<typeof createProductionService>;
