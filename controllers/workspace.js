// imports
const jwt = require("jsonwebtoken");

// Data base
const db = require("../models");

// Cloudinary
const cloudinary = require('cloudinary');

// basic test
const test = async (req, res) => {
  res.json({ message: "Workspace endpoint OK!" });
};

// create workspace
const create = async (req, res) => {
  const { name } = req.body;

  try {
    // Check name uniqueness
    const test = await db.Workspace.findOne({ name });
    if (test) throw new Error("Workspace Name Taken");

    let imageUrl;
    if (req.file) {
      let image = req.file.path;
      try {
        const result = await cloudinary.uploader.upload(image);
        coverUrl = result.secure_url;
      } catch (error) {
        throw new Error("Could Not Upload To Cloudinary");
        imageUrl = ""
      }
    } else {
      imageUrl = ""
    }

    // The user that intialized the create is the first member and admin
    const [type, token] = req.headers.authorization.split(' ');
    const payload = jwt.decode(token);

    // Find the user
    const user = await db.User.findOne({ _id: payload.id });   

    // create workspace
    const workspace = await db.Workspace.create({
      name,
      imageUrl,
      rooms: new Map(),
      members: new Map(),
    });
    
    // Make a member
    const member = await db.Member.create({
      firstName: user.firstName,
      lastName: user.lastName,
      nickName: "",
      bio: "",
      userId: user._id,
      workspaceId: workspace._id,
      imageUrl: "default Img",
      role: ['admin', 'member'],
      permissions: ['*'],
      rooms: new Map(),
    });
    
    // Add the new member to the workspace.
    workspace.members.set(member.id, {
      firstName: member.firstName,
      lastName: member.lastName,
      imageUrl: member.imageUrl,
    });

    await workspace.save();

    res.status(201).json({ success: true, message: "Workspace created" });
    
  } catch (error) {
    if (error.name === "MongoError") {
      const needToChange = error.keyPattern;
      res.status(409).json({
        success: false,
        message: "Database Error",
        needToChange,
      });
    } else {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
}

// Get Workspace data for one workspace.
const readOne = async (req, res) => {
  const _id = req.params.id;

  try {
    // First find the data base
    const workspace = await db.Workspace.findOne({ _id });
    if (!workspace) throw new Error("Workspace Does Not Exist");

    // Check if member
    const [type, token] = req.headers.authorization.split(' ');
    const payload = jwt.decode(token);

    const member = await db.Member.findOne({ userId: payload.id, workspaceId: workspace.id });
    if (!member) throw new Error("Forbidden");

    res.json({ success: true, result: workspace });

  } catch (error) {
    if (error.message === "Forbidden") {
      res.status(403).json({
        success: false,
        message: "You Must Be a Member Of That Workspace To Access Data",
      });
    } else {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }
}

// Get all Workspaces
const readMany = async (req, res) => {
  // This route isn't protected, but I do limit the data returned
  try {
    // Get all
    const results = await db.Workspace.find({}).select('-rooms -members');

    res.json({success: true, count: results.length, results })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

// Edit Workspace

// Delete Workspace

// export all route functions
module.exports = {
  test,
  create,
  readOne,
  readMany,
};