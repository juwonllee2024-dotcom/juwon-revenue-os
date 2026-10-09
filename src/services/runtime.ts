import path from 'node:path';
import {createOrderService} from './order-service';
import {createApprovalService} from './approval-service';
import {createDeliveryService} from './delivery-service';
import {createProductionService} from './production-service';

const dataRoot = path.resolve(process.env.REVENUE_OS_DATA_DIR || path.join(process.cwd(), 'data'));

export const orderService = createOrderService({
  stateFile: path.join(dataRoot, 'state.json'),
  auditFile: path.join(dataRoot, 'audit.jsonl'),
  uploadRoot: path.join(dataRoot, 'uploads'),
});

export const runtimePaths = {
  dataRoot,
  artifactRoot: path.resolve(process.env.REVENUE_OS_ARTIFACT_DIR || path.join(process.cwd(), 'artifacts')),
};

export const approvalService = createApprovalService(orderService);
export const productionService = createProductionService(orderService, runtimePaths.artifactRoot);
export const deliveryService = createDeliveryService(orderService, runtimePaths.artifactRoot);
