import {orderService} from '../../../services/runtime';
import {createIntakeHandler} from './handler';

export const POST = createIntakeHandler(orderService);
