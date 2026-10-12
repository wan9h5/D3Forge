// Chart colors are independent of the interface theme. Generators embed these
// arrays directly in exported source, so no app dependency is needed at runtime.
export const vividPalette = ['#3B6FF5', '#F59E0B', '#06B6D4', '#8B5CF6', '#10B981', '#F06464'];
export function categoricalColors(primary:string,secondary?:string):string[] {
  const selected=secondary?[primary,secondary]:[primary];
  return [...selected,...vividPalette.filter(color=>!selected.some(value=>value.toLowerCase()===color.toLowerCase()))];
}
