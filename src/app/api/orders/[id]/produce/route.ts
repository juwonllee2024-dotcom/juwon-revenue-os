import {NextResponse} from 'next/server';
import {productionService} from '../../../../../services/runtime';

type Context = {params: Promise<{id: string}>};

export const POST = async (_request: Request, context: Context) => {
  try {
    return NextResponse.json({order: await productionService.produce((await context.params).id)});
  } catch (error) {
    return NextResponse.json({error: (error as Error).message}, {status: 400});
  }
};
