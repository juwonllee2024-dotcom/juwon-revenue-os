import {z} from 'zod';

export const IdSchema = z.string().regex(/^[a-z0-9][a-z0-9_-]{1,63}$/);
export const TimestampSchema = z.iso.datetime();
export const HttpUrlSchema = z
  .url()
  .refine((value) => ['http:', 'https:'].includes(new URL(value).protocol), 'URL must use http or https');

export const CustomerSchema = z.object({
  id: IdSchema,
  businessName: z.string().trim().min(2).max(120),
  niche: z.string().trim().min(2).max(60),
  bookingUrl: HttpUrlSchema.optional(),
  services: z.array(z.string().trim().min(1).max(100)).min(1).max(20),
  contact: z.string().trim().min(3).max(160),
  tone: z.string().trim().min(2).max(80).default('고급스럽고 따뜻함'),
  colors: z.array(z.string().regex(/^#[0-9a-fA-F]{6}$/)).max(5).default([]),
  priceRange: z.string().trim().max(100).optional(),
  sourceMedia: z.array(z.string().min(1)).max(50).default([]),
  consent: z.boolean().default(false),
  demo: z.boolean().default(false),
  createdAt: TimestampSchema.optional(),
  updatedAt: TimestampSchema.optional(),
});

export const DeliverableKindSchema = z.enum([
  'website',
  'short-brief',
  'short-video',
  'social-copy',
  'delivery-package',
  'case-study',
]);

export const DeliverableSchema = z.object({
  id: IdSchema,
  orderId: IdSchema,
  kind: DeliverableKindSchema,
  status: z.enum(['planned', 'ready', 'failed']),
  path: z.string().min(1),
  checksum: z.string().regex(/^[a-f0-9]{64}$/).optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});

export const ApprovalSchema = z.object({
  id: IdSchema,
  orderId: IdSchema,
  state: z.enum(['pending', 'approved', 'rejected']),
  manifestHash: z.string().regex(/^[a-f0-9]{64}$/),
  operator: z.string().trim().min(2).max(100).optional(),
  note: z.string().trim().max(1000).default(''),
  createdAt: TimestampSchema,
  resolvedAt: TimestampSchema.optional(),
});

export const OrderStatusSchema = z.enum([
  'intake',
  'planned',
  'producing',
  'review',
  'approved',
  'delivered',
]);

export const OrderSchema = z.object({
  id: IdSchema,
  customerId: IdSchema,
  status: OrderStatusSchema,
  shortCount: z.literal(4),
  deliverables: z.array(DeliverableSchema),
  approval: ApprovalSchema.optional(),
  manifestHash: z.string().regex(/^[a-f0-9]{64}$/).optional(),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});

export const RevenueStateSchema = z.object({
  version: z.literal(1),
  customers: z.array(CustomerSchema),
  orders: z.array(OrderSchema),
});

export const IntakeSchema = CustomerSchema.omit({id: true, createdAt: true, updatedAt: true});

export type Customer = z.infer<typeof CustomerSchema>;
export type Deliverable = z.infer<typeof DeliverableSchema>;
export type Approval = z.infer<typeof ApprovalSchema>;
export type Order = z.infer<typeof OrderSchema>;
export type OrderStatus = z.infer<typeof OrderStatusSchema>;
export type RevenueState = z.infer<typeof RevenueStateSchema>;
export type Intake = z.infer<typeof IntakeSchema>;
