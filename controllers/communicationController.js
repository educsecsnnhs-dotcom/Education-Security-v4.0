const Announcement = require("../models/Announcement");

exports.createAnnouncement = async (req, res) => {
  try {
    // Getting role and department from the request body or headers (this should come from frontend logic)
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

exports.getAnnouncements = async (req, res) => {
  try {
    const userRole = req.headers['x-user-role'];  // Get role from headers (passed from frontend)
    const userDept = req.headers['x-user-department'];  // Get department from headers

    if (!userRole) {
      return res.status(400).json({ message: "Role is required" });
    }

    let filter = {};

    if (req.params.deptId) {
      // GET /api/announcements/department/:deptId
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
      // SuperAdmin sees everything
    }

    const anns = await Announcement.find(filter)
      .populate("createdBy", "name role")
      .sort({ createdAt: -1 });

    res.json(anns);
  } catch (err) {
    res.status(500).json({ message: "Error fetching announcements", error: err.message });
  }
};

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
