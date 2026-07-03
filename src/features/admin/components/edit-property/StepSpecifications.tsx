import { Home, Bed, Bath, Calendar, Armchair } from "lucide-react";
import { preventMinus } from "@/utils/validation";

export default function StepSpecifications({ form, updateField }: any) {
  const currentYear = new Date().getFullYear();
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-black text-slate-900 flex items-center gap-2"><Home className="size-6 text-purple-600" /> Specifications</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div><label className="block text-sm font-bold mb-1"><Bed className="size-3 inline mr-1" />Bedrooms *</label><input type="number" min="0" max="50" step="1" onKeyDown={preventMinus} value={form.bedrooms} onChange={(e) => { const v = e.target.value; if (v === '' || Number(v) >= 0) updateField("bedrooms", v); }} className="w-full px-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-sm" /></div>
        <div><label className="block text-sm font-bold mb-1"><Bath className="size-3 inline mr-1" />Bathrooms *</label><input type="number" min="0" max="50" step="1" onKeyDown={preventMinus} value={form.bathrooms} onChange={(e) => { const v = e.target.value; if (v === '' || Number(v) >= 0) updateField("bathrooms", v); }} className="w-full px-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-sm" /></div>
        <div><label className="block text-sm font-bold mb-1">Floors</label><input type="number" min="0" max="200" step="1" onKeyDown={preventMinus} value={form.floors} onChange={(e) => { const v = e.target.value; if (v === '' || Number(v) >= 0) updateField("floors", v); }} className="w-full px-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-sm" /></div>
        <div><label className="block text-sm font-bold mb-1"><Calendar className="size-3 inline mr-1" />Year Built</label><input type="number" min="1800" max={currentYear} step="1" onKeyDown={preventMinus} value={form.yearBuilt} onChange={(e) => { const val = e.target.value; if (val === '' || val.length <= 4) updateField("yearBuilt", val); }} className="w-full px-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-sm" /></div>
        <div><label className="block text-sm font-bold mb-1"><Armchair className="size-3 inline mr-1" />Lounge</label><input type="number" min="0" max="100" step="1" onKeyDown={preventMinus} value={form.parkingSpaces} onChange={(e) => { const v = e.target.value; if (v === '' || Number(v) >= 0) updateField("parkingSpaces", v); }} className="w-full px-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-sm" /></div>
        <div>
          <label className="block text-sm font-bold mb-1">Furnished</label>
          <select value={form.furnishedStatus} onChange={(e) => updateField("furnishedStatus", e.target.value)} className="w-full px-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-sm">
            <option value="unfurnished">Unfurnished</option><option value="semi-furnished">Semi</option><option value="fully-furnished">Fully</option>
          </select>
        </div>
      </div>
    </div>
  );
}
