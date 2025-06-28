export const isElectron = () => !!(typeof window !== "undefined" && window.process && window.process.type === "renderer")
