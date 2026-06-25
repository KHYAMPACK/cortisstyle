export interface MoodImageLibraryAsset {
  id: string;
  label: string;
  url: string;
}

/** Pre-approved editorial mood references for the wardrobe workbench library slot. */
export const MOOD_IMAGE_LIBRARY: MoodImageLibraryAsset[] = [
  {
    id: "editorial-crimson",
    label: "Crimson Studio",
    url: "/images/clothes/outfit-02/ootd236.png",
  },
  {
    id: "editorial-archive",
    label: "Archive Floor",
    url: "/images/clothes/outfit-04/ootd278.png",
  },
  {
    id: "editorial-ss26",
    label: "SS26 Plate",
    url: "/images/clothes/outfit-05/ootd279.png",
  },
  {
    id: "editorial-utility",
    label: "Utility Grid",
    url: "/images/clothes/outfit-03/ootd237.png",
  },
  {
    id: "texture-frost",
    label: "Frost Field",
    url: "/images/clothes/outfit-01/temp_image_0AD45B1B-0275-4C7F-817B-E22C2700E090.WEBP",
  },
  {
    id: "texture-blueprint",
    label: "Blueprint Wash",
    url: "/images/temp_image_BA9895CE-E202-4395-A8F9-F1887D40902E.WEBP",
  },
  {
    id: "texture-concrete",
    label: "Concrete Haze",
    url: "/images/temp_image_76EADAD7-87D4-4649-9923-B3D060ACD1BA.WEBP",
  },
  {
    id: "texture-noir",
    label: "Noir Grain",
    url: "/images/temp_image_F2334FB9-4D25-4EC6-9821-BE54537B0E98.WEBP",
  },
];
