import { Schema, model } from 'mongoose';

export const ROLES = ['owner', 'manager', 'agent', 'customer'] as const;
export const MEMBERSHIP_STATUSES = ['active', 'invited', 'suspended'] as const;

const membershipSchema = new Schema(
  {
    orgId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ROLES, required: true },
    status: { type: String, enum: MEMBERSHIP_STATUSES, default: 'active' },
    openTicketCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

membershipSchema.index({ orgId: 1, userId: 1 }, { unique: true });
membershipSchema.index({ userId: 1 });

export const Membership = model('Membership', membershipSchema);
