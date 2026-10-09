import {NextResponse} from 'next/server';
import {approvalService} from '../../../../../services/runtime';

type Context = {params: Promise<{id: string}>};

export const POST = async (request: Request, context: Context) => {
  try {
    const orderId = (await context.params).id;
    const body = await request.json();
    const approval =
      body.action === 'request'
        ? await approvalService.requestApproval(orderId)
        : await approvalService.resolveApproval({
            orderId,
            operator: String(body.operator || ''),
            decision: body.decision,
            note: String(body.note || ''),
            manifestHash: String(body.manifestHash || ''),
          });
    return NextResponse.json({approval});
  } catch (error) {
    return NextResponse.json({error: (error as Error).message}, {status: 400});
  }
};
