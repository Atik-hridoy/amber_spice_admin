import type { AddedBy as Creator } from '../../types/menu-category'

export function AddedBy({ creator }: { creator: Creator | null }) {
  return <span className="block text-[10px] font-normal text-stone-500">Added by: {creator?.name || 'Not recorded'}</span>
}
