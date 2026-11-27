import { Schema, model } from 'mongoose';

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: { type: String, required: true, trim: true },
    passwordHash: { type: String, select: false },
    googleId: { type: String, unique: true, sparse: true },
  },
  {
    timestamps: true,
    methods: {
      toPublic() {
        return { id: this.id as string, email: this.email, name: this.name };
      },
    },
  },
);

export const User = model('User', userSchema);
