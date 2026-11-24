import { Plus, Trash2 } from 'lucide-react'
import type { DishExtraOption, DishPortionOption } from '../../types/menu-dish'

interface DishSettings {
  station: string
  spicyLevel: number
  allowsSpiceLevel: boolean
  portionOptions: DishPortionOption[]
  extraOptions: DishExtraOption[]
  prepTime: string
  dietary: string[]
  isAvailable: boolean
  isPopular: boolean
  isBestseller: boolean
  isSpecial: boolean
}

const INPUT_CLASS = 'mt-1.5 w-full rounded-xl border border-stone-200 bg-[#FAF9F5] p-2.5 text-sm'
const MINI_INPUT_CLASS = 'rounded-lg border border-stone-200 bg-[#FAF9F5] px-2.5 py-1.5 text-xs outline-none focus:border-[#B84A22]'
const DIETS = ['halal', 'vegetarian', 'vegan', 'gluten-free', 'dairy-free']

export function DishSettingsFields({ form, onChange }: { form: DishSettings; onChange: (values: Partial<DishSettings>) => void }) {
  const addPortion = () => {
    onChange({
      portionOptions: [
        ...form.portionOptions,
        { name: 'Couple Sharing', servingInfo: 'Serves 2', priceDelta: '14.50', inventoryMultiplier: '1.80' },
      ],
    })
  }

  const updatePortion = (index: number, patch: Partial<DishPortionOption>) => {
    onChange({
      portionOptions: form.portionOptions.map((item, idx) => (idx === index ? { ...item, ...patch } : item)),
    })
  }

  const removePortion = (index: number) => {
    onChange({ portionOptions: form.portionOptions.filter((_, idx) => idx !== index) })
  }

  const addExtra = () => {
    onChange({
      extraOptions: [...form.extraOptions, { name: 'Garlic Naan', price: '4.50' }],
    })
  }

  const updateExtra = (index: number, patch: Partial<DishExtraOption>) => {
    onChange({
      extraOptions: form.extraOptions.map((item, idx) => (idx === index ? { ...item, ...patch } : item)),
    })
  }

  const removeExtra = (index: number) => {
    onChange({ extraOptions: form.extraOptions.filter((_, idx) => idx !== index) })
  }

  return <>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div><label htmlFor="dish-station" className="text-xs font-semibold text-stone-700">Kitchen station</label><select id="dish-station" value={form.station} onChange={(event) => onChange({ station: event.target.value })} className={INPUT_CLASS}>{['biryani', 'curry', 'grill', 'breads', 'dessert', 'beverage'].map((station) => <option key={station} value={station}>{station}</option>)}</select></div>
      <div><label htmlFor="dish-spice" className="text-xs font-semibold text-stone-700">Spicy Level</label><select id="dish-spice" value={form.spicyLevel} onChange={(event) => onChange({ spicyLevel: Number(event.target.value) })} className={INPUT_CLASS}><option value={0}>Non-Spicy</option><option value={1}>Mild</option><option value={2}>Medium</option><option value={3}>Extra Hot</option></select></div>
    </div>
    <div><label htmlFor="dish-prep" className="text-xs font-semibold text-stone-700">Preparation time</label><input id="dish-prep" maxLength={50} value={form.prepTime} onChange={(event) => onChange({ prepTime: event.target.value })} placeholder="e.g. 15-20 min" className={INPUT_CLASS} /></div>
    <fieldset><legend className="text-xs font-semibold text-stone-700">Dietary labels</legend><div className="mt-2 flex flex-wrap gap-3">{DIETS.map((diet) => <label key={diet} className="flex items-center gap-2 text-xs text-stone-600"><input type="checkbox" checked={form.dietary.includes(diet)} onChange={(event) => onChange({ dietary: event.target.checked ? [...form.dietary, diet] : form.dietary.filter((value) => value !== diet) })} />{diet}</label>)}</div></fieldset>
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{([['allowsSpiceLevel', 'Show Spice Selector'], ['isAvailable', 'Available'], ['isPopular', 'Popular'], ['isBestseller', 'Bestseller'], ['isSpecial', 'Special']] as const).map(([key, label]) => <label key={key} className="flex items-center gap-2 text-xs text-stone-600"><input type="checkbox" checked={form[key]} onChange={(event) => onChange({ [key]: event.target.checked })} />{label}</label>)}</div>

    {/* Serving Sizes / Portions */}
    <div className="rounded-xl border border-stone-200 p-3 space-y-2.5 bg-stone-50/50">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-stone-800">Serving Sizes (Single / Couple / Family)</span>
        <button type="button" onClick={addPortion} className="inline-flex items-center gap-1 rounded-lg bg-white border border-stone-200 px-2.5 py-1 text-[11px] font-semibold text-stone-700 hover:border-[#B84A22] cursor-pointer">
          <Plus size={12} /> Add Size
        </button>
      </div>
      {form.portionOptions.length === 0 ? (
        <p className="text-[11px] text-stone-400">Fixed single item (no serving size options).</p>
      ) : (
        <div className="space-y-2">
          {form.portionOptions.map((opt, idx) => (
            <div key={idx} className="grid grid-cols-1 sm:grid-cols-[1.3fr_1fr_80px_28px] gap-2 items-center">
              <input placeholder="e.g. Couple Sharing" value={opt.name} onChange={(e) => updatePortion(idx, { name: e.target.value })} className={MINI_INPUT_CLASS} />
              <input placeholder="e.g. Serves 2" value={opt.servingInfo || ''} onChange={(e) => updatePortion(idx, { servingInfo: e.target.value })} className={MINI_INPUT_CLASS} />
              <input type="number" step="0.01" placeholder="+€" value={opt.priceDelta} onChange={(e) => updatePortion(idx, { priceDelta: e.target.value })} className={MINI_INPUT_CLASS} />
              <button type="button" onClick={() => removePortion(idx)} className="text-stone-400 hover:text-rose-600 p-1"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      )}
    </div>

    {/* Side Pairings & Add-ons */}
    <div className="rounded-xl border border-stone-200 p-3 space-y-2.5 bg-stone-50/50">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-stone-800">Add-ons &amp; Side Pairings</span>
        <button type="button" onClick={addExtra} className="inline-flex items-center gap-1 rounded-lg bg-white border border-stone-200 px-2.5 py-1 text-[11px] font-semibold text-stone-700 hover:border-[#B84A22] cursor-pointer">
          <Plus size={12} /> Add Side
        </button>
      </div>
      {form.extraOptions.length === 0 ? (
        <p className="text-[11px] text-stone-400">No extra sides configured.</p>
      ) : (
        <div className="space-y-2">
          {form.extraOptions.map((ext, idx) => (
            <div key={idx} className="grid grid-cols-1 sm:grid-cols-[1fr_90px_28px] gap-2 items-center">
              <input placeholder="e.g. Garlic Naan" value={ext.name} onChange={(e) => updateExtra(idx, { name: e.target.value })} className={MINI_INPUT_CLASS} />
              <input type="number" step="0.01" placeholder="€ Price" value={ext.price} onChange={(e) => updateExtra(idx, { price: e.target.value })} className={MINI_INPUT_CLASS} />
              <button type="button" onClick={() => removeExtra(idx)} className="text-stone-400 hover:text-rose-600 p-1"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  </>
}
