import {NextResponse} from 'next/server';
import {OrderStatusSchema} from '../../../../domain/schema';
import {orderService} from '../../../../services/runtime';

type Context = {params: Promise<{id: string}>};

export const GET = async (_request: Request, context: Context) => {
  try {
    return NextResponse.json({order: await orderService.getOrder((await context.params).id)});
  } catch (error) {
    return NextResponse.json({error: (error as Error).message}, {status: 404});
  }
};

export const PATCH = async (request: Request, context: Context) => {
  try {
    const body = await request.json();
    const next = OrderStatusSchema.parse(body.status);
    const order = await orderService.transitionOrder(
      (await context.params).id,
      next,
      String(body.actor || 'operator'),
    );
    return NextResponse.json({order});
  } catch (error) {
    return NextResponse.json({error: (error as Error).message}, {status: 400});
  }
};
