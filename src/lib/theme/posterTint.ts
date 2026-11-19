/**
 * Which of the five poster tints (`--poster-1` to `--poster-5`) a film without artwork gets: the same
 * one every time for its title. The app's NoPoster face and its share card use it (D-49, D-149).
 */
export function posterTint(title: string): number {
  let hash = 0;
  for (const char of title) hash = (hash * 31 + char.codePointAt(0)!) >>> 0;
  return (hash % 5) + 1;
}
