// The four areas of Campus OS. `soon` modules show a roadmap page instead of a tool.
export const MODULES = [
  {
    id: "resources",
    path: "/resources",
    title: "Academic resources",
    description: "Your notes, assignments and study material, organized by subject.",
    icon: "folder",
    accent: "purple",
    eyebrow: "YOUR STUDY SPACE",
    soon: false,
  },
  {
    id: "study-assistant",
    path: "/assistant",
    title: "AI study assistant",
    description: "Ask questions and get answers grounded in your own PDFs.",
    icon: "sparkles",
    accent: "blue",
    eyebrow: "LEARN SMARTER",
    soon: false,
  },
  {
    id: "resume-builder",
    path: "/resume-builder",
    title: "Resume builder",
    description: "Turn your projects and experience into a clear, role-focused resume.",
    icon: "resume",
    accent: "orange",
    eyebrow: "CAREER READY",
    soon: true,
    plan: [
      ["Bring your experience together", "Organize skills, education, projects and experience."],
      ["Tailor your resume", "Improve wording for a role without inventing achievements."],
      ["Export a polished PDF", "Prepare a professional resume you can share."],
    ],
  },
  {
    id: "dsa-tracker",
    path: "/dsa-tracker",
    title: "DSA tracker",
    description: "Track coding practice, topics to revisit and problem-solving progress.",
    icon: "code",
    accent: "green",
    eyebrow: "BUILD CONSISTENCY",
    soon: true,
    plan: [
      ["Keep practice organized", "Save problem links and record completion status."],
      ["Spot topics to revisit", "Review your work by difficulty and topic."],
      ["Build a revision habit", "Mark problems to do again and keep your plan visible."],
    ],
  },
];

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
