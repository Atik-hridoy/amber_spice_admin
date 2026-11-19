interface DishSettings {
  station: string
  spicyLevel: number
  prepTime: string
  dietary: string[]
  isAvailable: boolean
  isPopular: boolean
  isBestseller: boolean
  isSpecial: boolean
}

const INPUT_CLASS = 'mt-1.5 w-full rounded-xl border border-stone-200 bg-[#FAF9F5] p-2.5 text-sm'
const DIETS = ['halal', 'vegetarian', 'vegan', 'gluten-free', 'dairy-free']

export function DishSettingsFields({ form, onChange }: { form: DishSettings; onChange: (values: Partial<DishSettings>) => void }) {
  return <>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div><label htmlFor="dish-station" className="text-xs font-semibold text-stone-700">Kitchen station</label><select id="dish-station" value={form.station} onChange={(event) => onChange({ station: event.target.value })} className={INPUT_CLASS}>{['biryani', 'curry', 'grill', 'breads', 'dessert', 'beverage'].map((station) => <option key={station} value={station}>{station}</option>)}</select></div>
      <div><label htmlFor="dish-spice" className="text-xs font-semibold text-stone-700">Spicy Level</label><select id="dish-spice" value={form.spicyLevel} onChange={(event) => onChange({ spicyLevel: Number(event.target.value) })} className={INPUT_CLASS}><option value={0}>Non-Spicy</option><option value={1}>Mild</option><option value={2}>Medium</option><option value={3}>Extra Hot</option></select></div>
    </div>
    <div><label htmlFor="dish-prep" className="text-xs font-semibold text-stone-700">Preparation time</label><input id="dish-prep" maxLength={50} value={form.prepTime} onChange={(event) => onChange({ prepTime: event.target.value })} placeholder="e.g. 15-20 min" className={INPUT_CLASS} /></div>
    <fieldset><legend className="text-xs font-semibold text-stone-700">Dietary labels</legend><div className="mt-2 flex flex-wrap gap-3">{DIETS.map((diet) => <label key={diet} className="flex items-center gap-2 text-xs text-stone-600"><input type="checkbox" checked={form.dietary.includes(diet)} onChange={(event) => onChange({ dietary: event.target.checked ? [...form.dietary, diet] : form.dietary.filter((value) => value !== diet) })} />{diet}</label>)}</div></fieldset>
    <div className="grid grid-cols-2 gap-3">{([['isAvailable', 'Available'], ['isPopular', 'Popular'], ['isBestseller', 'Bestseller'], ['isSpecial', 'Special']] as const).map(([key, label]) => <label key={key} className="flex items-center gap-2 text-xs text-stone-600"><input type="checkbox" checked={form[key]} onChange={(event) => onChange({ [key]: event.target.checked })} />{label}</label>)}</div>
  </>
}
