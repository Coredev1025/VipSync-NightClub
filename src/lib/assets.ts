export const images = {
  bgChats: require("../../assets/vipsync/images/bg-chats.jpg"),
  bgHome: require("../../assets/vipsync/images/bg-home.jpg"),
  bgMap: require("../../assets/vipsync/images/bg-map.jpg"),
  bgOps: require("../../assets/vipsync/images/bg-ops.jpg"),
  bgProfile: require("../../assets/vipsync/images/bg-ops.jpg"),
  nightclubBg: require("../../assets/vipsync/images/nightclub-bg.png"),
  clubFloor: require("../../assets/vipsync/images/club-floor.jpg"),
  mainBar: require("../../assets/vipsync/images/mainbar.jpg"),
  splashBg: require("../../assets/vipsync/images/splash-bg.jpg"),
  authBg: require("../../assets/vipsync/images/auth-bg.png"),
} as const

export const bottleImages = {
  ace: require("../../assets/vipsync/images/bottles/ace.png"),
  champagne: require("../../assets/vipsync/images/bottles/champagne.png"),
  wine: require("../../assets/vipsync/images/bottles/wine.png"),
  cocktail: require("../../assets/vipsync/images/bottles/cocktail.png"),
  beer: require("../../assets/vipsync/images/bottles/beer.png"),
  soda: require("../../assets/vipsync/images/bottles/soda.png"),
  coffee: require("../../assets/vipsync/images/bottles/coffee.png"),
} as const

export type BottleImageKey = keyof typeof bottleImages

export const tableImages = {
  table: require("../../assets/vipsync/images/tables/table.png"),
  table1: require("../../assets/vipsync/images/tables/table1.png"),
  table2: require("../../assets/vipsync/images/tables/table2.png"),
  table3: require("../../assets/vipsync/images/tables/table3.png"),
  table4: require("../../assets/vipsync/images/tables/table4.png"),
  table5: require("../../assets/vipsync/images/tables/table5.png"),
  table6: require("../../assets/vipsync/images/tables/table6.png"),
  table7: require("../../assets/vipsync/images/tables/table7.png"),
} as const

export type TableImageKey = keyof typeof tableImages

export const avatars = {
  man1: require("../../assets/vipsync/images/avatars/man1.png"),
  man2: require("../../assets/vipsync/images/avatars/man2.png"),
  man3: require("../../assets/vipsync/images/avatars/man3.png"),
  man4: require("../../assets/vipsync/images/avatars/man4.png"),
  man5: require("../../assets/vipsync/images/avatars/man5.png"),
  man6: require("../../assets/vipsync/images/avatars/man6.png"),
  man7: require("../../assets/vipsync/images/avatars/man7.png"),
  man8: require("../../assets/vipsync/images/avatars/man8.png"),
  woman1: require("../../assets/vipsync/images/avatars/woman1.png"),
} as const

export function resolveAvatar(assetPath?: string) {
  if (!assetPath) return undefined
  const name = assetPath.split("/").pop()?.replace(".png", "")
  if (!name) return undefined
  return (avatars as any)[name]
}

