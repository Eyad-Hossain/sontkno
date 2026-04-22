/**
 * A curated array of beautiful flower pseudonyms.
 * These replace usernames/author names throughout the platform
 * to ensure complete anonymity.
 */
const FLOWER_NAMES = [
  "Silent Lily",
  "Neon Rose",
  "Midnight Dahlia",
  "Crystal Orchid",
  "Amber Marigold",
  "Velvet Peony",
  "Ghost Jasmine",
  "Ember Tulip",
  "Frost Lavender",
  "Dusk Magnolia",
  "Solar Sunflower",
  "Twilight Iris",
  "Phantom Poppy",
  "Golden Wisteria",
  "Cobalt Hydrangea",
  "Crimson Camellia",
  "Silver Lotus",
  "Indigo Bluebell",
  "Starlit Carnation",
  "Opal Begonia",
  "Shadow Violet",
  "Sapphire Aster",
  "Coral Zinnia",
  "Jade Chrysanthemum",
  "Lunar Gardenia",
  "Obsidian Snapdragon",
  "Ivory Anemone",
  "Neon Foxglove",
  "Arctic Heather",
  "Burnt Clover",
] as const;

/**
 * Returns a randomly selected flower pseudonym.
 * Used when creating posts and comments to assign an anonymous identity.
 */
export function getRandomFlower(): string {
  return FLOWER_NAMES[Math.floor(Math.random() * FLOWER_NAMES.length)];
}

export { FLOWER_NAMES };
