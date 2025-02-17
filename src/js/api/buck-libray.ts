import { fs, path, os } from "../lib/cep/node";

const prefix = os.platform() === "win32" ? "\\" : "/";

export const SHARED_FOLDER = path.join(
  `${prefix}buck`,
  "globalprefs",
  "SHARED"
);

export const getProjectTemplate = (appId: string, templateName: string) => {
  let appName = "AFTER_EFFECTS";
  let extensiom = ".aep";
  if (appId == "PPRO") {
    appName = "PREMIERE";
    extensiom = ".prproj";
  }
  console.log("getProjectTemplate", appId, templateName);
  return path.join(
    SHARED_FOLDER,
    appName,
    "templates",
    `default${templateName}Template${extensiom}`
  );
};
