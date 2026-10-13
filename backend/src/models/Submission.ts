import { Schema, model, type InferSchemaType, type Types } from "mongoose";

const submissionSchema = new Schema(
  {
    campaign: { type: Schema.Types.ObjectId, ref: "Campaign", required: true, index: true },
    creator: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    postUrl: { type: String, required: true, trim: true },
    views: { type: Number, required: true, min: 0, default: 0 },
    payoutGranted: { type: Number, required: true, min: 0, default: 0 },
  },
  { timestamps: true },
);

submissionSchema.index({ creator: 1, createdAt: -1 });
submissionSchema.index({ campaign: 1, creator: 1 });

export type SubmissionDocument = InferSchemaType<typeof submissionSchema> & {
  campaign: Types.ObjectId;
  creator: Types.ObjectId;
};
export const Submission = model<SubmissionDocument>("Submission", submissionSchema);
