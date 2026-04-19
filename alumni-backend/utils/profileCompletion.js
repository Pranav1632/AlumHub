const normalizeText = (value) => String(value || "").trim();

const hasListValue = (value) => Array.isArray(value) && value.some((item) => normalizeText(item));

const rulesByRole = {
  student: [
    { key: "phone", label: "Phone Number" },
    { key: "branch", label: "Branch" },
    { key: "yearOfStudy", label: "Year Of Study" },
    { key: "graduationYear", label: "Graduation Year" },
    { key: "headline", label: "Headline" },
    { key: "bio", label: "Bio" },
    { key: "location", label: "Location" },
    { key: "skills", label: "Skills", isList: true },
    { key: "interests", label: "Interests", isList: true },
    { key: "achievements", label: "Achievements", isList: true },
    { key: "linkedIn", label: "LinkedIn URL" },
    { key: "github", label: "GitHub URL" },
    { key: "portfolio", label: "Portfolio URL" },
    {
      label: "Recent Fee Receipt or Student ID Card (PDF)",
      anyOf: ["recentFeeReceiptUrl", "studentIdCardUrl"],
    },
  ],
  alumni: [
    { key: "phone", label: "Phone Number" },
    { key: "branch", label: "Branch" },
    { key: "graduationYear", label: "Graduation Year" },
    { key: "currentCompany", label: "Current Company" },
    { key: "jobTitle", label: "Job Title" },
    { key: "headline", label: "Headline" },
    { key: "bio", label: "Bio" },
    { key: "location", label: "Location" },
    { key: "skills", label: "Skills", isList: true },
    { key: "interests", label: "Interests", isList: true },
    { key: "achievements", label: "Achievements", isList: true },
    { key: "linkedIn", label: "LinkedIn URL" },
    { key: "github", label: "GitHub URL" },
    { key: "portfolio", label: "Portfolio URL" },
    {
      label: "Resume or Last Year Fee Receipt (PDF)",
      anyOf: ["resumeLink", "lastYearFeeReceiptUrl"],
    },
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
      if (Array.isArray(rule.anyOf) && rule.anyOf.length > 0) {
        return !rule.anyOf.some((fieldKey) => normalizeText(profile?.[fieldKey]));
      }
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
