const normalizeText = (value) => String(value || "").trim();

const hasListValue = (value) => Array.isArray(value) && value.some((item) => normalizeText(item));

const rulesByRole = {
  student: [
    { key: "phone", label: "Phone Number" },
    { key: "branch", label: "Branch" },
    { key: "yearOfStudy", label: "Year Of Study" },
    { key: "graduationYear", label: "Graduation Year" },
    { key: "bio", label: "Bio" },
    { key: "skills", label: "Skills", isList: true },
  ],
  alumni: [
    { key: "phone", label: "Phone Number" },
    { key: "branch", label: "Branch" },
    { key: "graduationYear", label: "Graduation Year" },
    { key: "currentCompany", label: "Current Company" },
    { key: "jobTitle", label: "Job Title" },
    { key: "bio", label: "Bio" },
    { key: "skills", label: "Skills", isList: true },
  ],
};

const getProfileCompletion = ({ user, profile }) => {
  const role = user?.role;
  const rules = rulesByRole[role] || [];

  if (rules.length === 0) {
    return {
      role,
      completionPercent: 100,
      isComplete: true,
      missingFields: [],
    };
  }

  const missingFields = rules
    .filter((rule) => {
      if (rule.isList) return !hasListValue(profile?.[rule.key]);
      return !normalizeText(profile?.[rule.key]);
    })
    .map((rule) => rule.label);

  const completionPercent = Math.round(((rules.length - missingFields.length) / rules.length) * 100);

  return {
    role,
    completionPercent,
    isComplete: missingFields.length === 0,
    missingFields,
  };
};

module.exports = {
  getProfileCompletion,
};
