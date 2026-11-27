import { Schema, Types, type Query } from 'mongoose';
import { getContext } from '../../middleware/requestContext.js';
import { AppError } from '../../utils/errors.js';

const currentOrgId = (): string => {
  const orgId = getContext()?.orgId;
  if (!orgId) throw new AppError('TENANT_CONTEXT_MISSING', 500, 'No org in request context');
  return orgId;
};

const sameOrg = (a: unknown, b: string) => String(a) === b;

export function tenantPlugin(schema: Schema): void {
  schema.add({ orgId: { type: Schema.Types.ObjectId, required: true, index: false } });

  schema.pre(/^(find|count|update|delete|distinct)/, function (this: Query<unknown, unknown>) {
    if (this.getOptions().skipTenant) return;
    const orgId = currentOrgId();
    this.where({ orgId });
    const update = this.getUpdate() as Record<string, Record<string, unknown>> | null;
    if (!update) return;
    delete update.orgId;
    delete update.$set?.orgId;
    delete update.$setOnInsert?.orgId;
  });

  schema.pre('aggregate', function () {
    if (this.options.skipTenant) return;
    this.pipeline().unshift({ $match: { orgId: new Types.ObjectId(currentOrgId()) } });
  });

  schema.pre('save', function () {
    const orgId = currentOrgId();
    if (!this.orgId) this.orgId = orgId as never;
    else if (!sameOrg(this.orgId, orgId)) throw new AppError('TENANT_MISMATCH', 500, 'Cross-tenant write');
  });

  schema.pre('insertMany', function (docs: Array<{ orgId?: unknown }> | { orgId?: unknown }) {
    const orgId = currentOrgId();
    for (const doc of Array.isArray(docs) ? docs : [docs]) {
      if (!doc.orgId) doc.orgId = orgId;
      else if (!sameOrg(doc.orgId, orgId)) throw new AppError('TENANT_MISMATCH', 500, 'Cross-tenant write');
    }
  });
}
