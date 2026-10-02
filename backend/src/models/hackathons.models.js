import mongoose from "mongoose";

const hackathonSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    organizer: {
      type: String,
      required: true,
      trim: true,
    },

    link: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    fee: {
      type: Number,
      default: null,
    },

    teamSize: {
      min: {
        type: Number,
        default: null,
      },
      max: {
        type: Number,
        default: null,
      },
    },

    location: {
      type: String,
      default: null,
    },

    categories: {
      type: [String],
      default: [],
    },

    eligibility: {
      type: [String],
      default: [],
    },

    prize: {
      type: Number,
      default: null,
    },

    status: {
      type: String,
      default: null,
    },

    postedDate: {
      type: String,
      default: null,
    },

    // --- ENRICHED DATA & VECTOR SEARCH --- //

    currentDeadline: {
      type: Date,
      index: true,
    },

    techStack: {
      type: [String],
      default: [],
    },

    contextText: {
      type: String,
      default: "",
    },

    embedding: {
      type: [Number],
      default: undefined,
    },
  },
  {
    timestamps: true,
  }
);

const Hackathons = mongoose.model("Hackathons", hackathonSchema);

export default Hackathons;