import { Schema, model } from 'mongoose';

export const PLANS = ['free', 'pro', 'enterprise'] as const;
export const AUTO_ASSIGN_MODES = ['off', 'round_robin', 'least_loaded'] as const;

const slaPolicySchema = new Schema(
  {
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], required: true },
    firstResponseMins: { type: Number, required: true },
    resolutionMins: { type: Number, required: true },
  },
  { _id: false },
);

const settingsSchema = new Schema(
  {
    timezone: { type: String, default: 'UTC' },
    businessHours: {
      type: new Schema(
        {
          days: { type: [Number], default: [1, 2, 3, 4, 5] }, // 0 = Sunday
          start: { type: String, default: '09:00' },
          end: { type: String, default: '17:00' },
        },
        { _id: false },
      ),
      default: () => ({}),
    },
    slaPolicies: {
      type: [slaPolicySchema],
      default: [
        { priority: 'low', firstResponseMins: 480, resolutionMins: 4320 },
        { priority: 'medium', firstResponseMins: 240, resolutionMins: 2880 },
        { priority: 'high', firstResponseMins: 60, resolutionMins: 1440 },
        { priority: 'urgent', firstResponseMins: 15, resolutionMins: 480 },
      ],
    },
    categories: { type: [String], default: ['general', 'billing', 'technical'] },
    autoAssignMode: { type: String, enum: AUTO_ASSIGN_MODES, default: 'off' },
  },
  { _id: false },
);

const organizationSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    settings: { type: settingsSchema, default: () => ({}) },
    plan: { type: String, enum: PLANS, default: 'free' },
  },
  { timestamps: true },
);

export const Organization = model('Organization', organizationSchema);
