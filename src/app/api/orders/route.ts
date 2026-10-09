import {NextResponse} from 'next/server';
import {orderService} from '../../../services/runtime';

export const GET = async () => NextResponse.json(await orderService.getState());
