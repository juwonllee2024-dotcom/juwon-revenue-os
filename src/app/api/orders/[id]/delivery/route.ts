import {NextResponse} from 'next/server';
import {deliveryService} from '../../../../../services/runtime';

type Context = {params: Promise<{id: string}>};

export const POST = async (_request: Request, context: Context) => {
  try {
    return NextResponse.json(await deliveryService.buildDelivery((await context.params).id));
  } catch (error) {
    return NextResponse.json({error: (error as Error).message}, {status: 400});
  }
};
