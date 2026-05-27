import mongoose from "mongoose";
import Resume from "../models/resumeSchema.js";
import { asynchandler } from "../utils/asynchandler.js";
import { apierror } from "../utils/apierror.js";
import { apiresponse } from "../utils/apiresponse.js";

const getResumeIdFromParams = (req) => req.params.resumeId || req.params.id;

const getResumeByIdAndOwner = async (resumeId, ownerId) => {
  if (!mongoose.Types.ObjectId.isValid(resumeId)) {
    throw new apierror(400, "invalid resume id");
  }

  const resume = await Resume.findOne({
    _id: resumeId,
    owner: ownerId
  });

  if (!resume) {
    throw new apierror(404, "resume not found");
  }

  return resume;
};

const createResume = asynchandler(async (req, res) => {
  const {
    title,
    targetRole,
    template,
    personalInfo,
    summary,
    skills,
    education,
    experience,
    certification,
    projects,
    languages,
    visibility
  } = req.body;

  if (!summary?.trim()) {
    throw new apierror(400, "summary is required");
  }

  const resume = await Resume.create({
    owner: req.user._id,
    title,
    targetRole,
    template,
    personalInfo,
    summary,
    skills,
    education,
    experience,
    certification,
    projects,
    languages,
    visibility
  });

  return res
    .status(201)
    .json(new apiresponse(201, resume, "resume created successfully"));
});

const getUserResumes = asynchandler(async (req, res) => {
  const resumes = await Resume.find({ owner: req.user._id }).sort({ _id: -1 });

  return res
    .status(200)
    .json(new apiresponse(200, resumes, "resumes fetched successfully"));
});

const getResume = asynchandler(async (req, res) => {
  const resume = await getResumeByIdAndOwner(
    getResumeIdFromParams(req),
    req.user._id
  );

  return res
    .status(200)
    .json(new apiresponse(200, resume, "resume fetched successfully"));
});

const updateResume = asynchandler(async (req, res) => {
  const resume = await getResumeByIdAndOwner(
    getResumeIdFromParams(req),
    req.user._id
  );

  const allowedFields = [
    "title",
    "targetRole",
    "template",
    "personalInfo",
    "summary",
    "skills",
    "education",
    "experience",
    "certification",
    "projects",
    "languages",
    "visibility"
  ];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      resume[field] = req.body[field];
    }
  });

  if (resume.summary !== undefined && !resume.summary?.trim()) {
    throw new apierror(400, "summary is required");
  }

  await resume.save();

  return res
    .status(200)
    .json(new apiresponse(200, resume, "resume updated successfully"));
});

const deleteResume = asynchandler(async (req, res) => {
  const resume = await getResumeByIdAndOwner(
    getResumeIdFromParams(req),
    req.user._id
  );

  await resume.deleteOne();

  return res
    .status(200)
    .json(new apiresponse(200, {}, "resume deleted successfully"));
});

const getShareableResume = asynchandler(async (req, res) => {
  const resumeId = getResumeIdFromParams(req);

  if (!mongoose.Types.ObjectId.isValid(resumeId)) {
    throw new apierror(400, "invalid resume id");
  }

  const resume = await Resume.findOne({
    _id: resumeId,
    visibility: "shareable"
  });

  if (!resume) {
    throw new apierror(404, "shareable resume not found");
  }

  return res
    .status(200)
    .json(new apiresponse(200, resume, "resume fetched successfully"));
});

export {
  createResume,
  getUserResumes,
  getResume,
  updateResume,
  deleteResume,
  getShareableResume
};
