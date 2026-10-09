import {NextResponse} from 'next/server';
import type {OrderService} from '../../../services/order-service';

export const createIntakeHandler = (service: OrderService) => async (request: Request) => {
  try {
    const order = await service.createOrder(await request.json());
    return NextResponse.json({order}, {status: 201});
  } catch (error) {
    return NextResponse.json({error: (error as Error).message}, {status: 400});
  }
};
