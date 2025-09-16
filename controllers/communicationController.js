const Announcement = require("../models/Announcement");
const Event = require("../models/Event");  // Assuming you have an Event model
const User = require("../models/User"); // Assuming you have a User model

// Create Announcement
exports.createAnnouncement = async (req, res) => {
  try {
    const { scope, title, content, department } = req.body;
    const userRole = req.headers['x-user-role'];  // The role should be passed from the frontend (e.g., from localStorage)
    const userDept = req.headers['x-user-department'];  // The department should also be passed

    if (!userRole) {
      return res.status(400).json({ message: "Role is required" });
    }

    let dept = null;

    if (scope === "department") {
      if (!["Admin", "SuperAdmin", "Moderator"].includes(userRole)) {
        return res.status(403).json({ message: "Only teachers and admins can post department announcements" });
      }
      dept = department || userDept;  // Fallback to user's department if not explicitly passed
    }

    if (scope === "schoolwide" && userRole !== "SuperAdmin") {
      return res.status(403).json({ message: "Only SuperAdmin can post schoolwide announcements" });
    }

    const ann = new Announcement({
      scope,
      department: dept,
      title,
      content,
      createdBy: req.user._id,  // Assuming the user ID is still available
    });

    await ann.save();
    res.status(201).json(ann);
  } catch (err) {
    res.status(500).json({ message: "Error creating announcement", error: err.message });
  }
};

// Get Announcements
exports.getAnnouncements = async (req, res) => {
  try {
    const userRole = req.headers['x-user-role'];  // Get role from headers (passed from frontend)
    const userDept = req.headers['x-user-department'];  // Get department from headers

    if (!userRole) {
      return res.status(400).json({ message: "Role is required" });
    }

    let filter = {};

    if (req.params.deptId) {
      filter = { scope: "department", department: req.params.deptId };
    } else {
      if (userRole === "Student") {
        filter.scope = "schoolwide";
      } else if (["Moderator", "Admin"].includes(userRole)) {
        filter = {
          $or: [
            { scope: "schoolwide" },
            { scope: "department", department: userDept },
          ],
        };
      }
    }

    const anns = await Announcement.find(filter)
      .populate("createdBy", "name role")
      .sort({ createdAt: -1 });

    res.json(anns);
  } catch (err) {
    res.status(500).json({ message: "Error fetching announcements", error: err.message });
  }
};

// Delete Announcement
exports.deleteAnnouncement = async (req, res) => {
  try {
    const ann = await Announcement.findById(req.params.id);
    if (!ann) return res.status(404).json({ message: "Not found" });

    const userRole = req.headers['x-user-role'];  // Get role from headers (passed from frontend)

    if (userRole !== "SuperAdmin" && !ann.createdBy.equals(req.user._id)) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await ann.deleteOne();
    res.json({ message: "Announcement deleted" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting announcement", error: err.message });
  }
};

// Create Event
exports.createEvent = async (req, res) => {
  try {
    const { title, description, date, department } = req.body;
    const userRole = req.headers['x-user-role'];  // Role from frontend
    const userDept = req.headers['x-user-department'];  // Department from frontend

    if (!userRole) {
      return res.status(400).json({ message: "Role is required" });
    }

    if (!title || !description || !date) {
      return res.status(400).json({ message: "Title, description, and date are required" });
    }

    let dept = department || userDept;

    const event = new Event({
      title,
      description,
      date,
      department: dept,
      createdBy: req.user._id,
    });

    await event.save();
    res.status(201).json(event);
  } catch (err) {
    res.status(500).json({ message: "Error creating event", error: err.message });
  }
};

// Get Events
exports.getEvents = async (req, res) => {
  try {
    const userRole = req.headers['x-user-role'];
    const userDept = req.headers['x-user-department'];

    if (!userRole) {
      return res.status(400).json({ message: "Role is required" });
    }

    let filter = {};

    if (userRole === "Student") {
      filter = { department: userDept };  // Students see events for their department
    } else if (["Moderator", "Admin"].includes(userRole)) {
      filter = { department: userDept };  // Admins and Moderators see events for their department
    }

    // SuperAdmins see all events
    if (userRole === "SuperAdmin") {
      filter = {};
    }

    const events = await Event.find(filter)
      .populate("createdBy", "name role")
      .sort({ date: 1 });  // Sort events by date ascending

    res.json(events);
  } catch (err) {
    res.status(500).json({ message: "Error fetching events", error: err.message });
  }
};

// Get User Profile
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user._id; // Assuming user ID is attached to the request (from authentication middleware)
    const user = await User.findById(userId).select("-password");  // Exclude password from profile response

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);  // Return the user profile data
  } catch (err) {
    res.status(500).json({ message: "Error fetching profile", error: err.message });
  }
};

// Update User Profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;  // Assuming user ID is attached to the request
    const { name, email, department } = req.body;  // You can add other fields as needed

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name, email, department },  // Update the profile with new values
      { new: true, runValidators: true }  // Ensure the updates are valid and return the updated document
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(updatedUser);  // Return updated profile data
  } catch (err) {
    res.status(500).json({ message: "Error updating profile", error: err.message });
  }
};
