import { Home, Bed, Bath, Calendar, Armchair } from "lucide-react";
import { preventMinus } from "@/utils/validation";

interface StepSpecificationsProps {
  formData: any;
  handleInputChange: (field: string, value: any) => void;
  theme: { primary: string };
}

export default function StepSpecifications({ formData, handleInputChange, theme }: StepSpecificationsProps) {
  const currentYear = new Date().getFullYear();
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div
          className={`size-12 rounded-xl bg-gradient-to-br ${theme.primary} flex items-center justify-center`}
        >
          <Home className="size-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-900">
            Property Specifications
          </h2>
          <p className="text-slate-600 font-medium">
            Provide detailed measurements and features
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            <Bed className="inline size-4 mr-1" />
            Number of Bedrooms *
          </label>
          <input
            type="number"
            placeholder="e.g., 4"
            value={formData.bedrooms}
            onChange={(e) => {
              const v = e.target.value;
              if (v === '' || Number(v) >= 0) handleInputChange("bedrooms", v);
            }}
            min="0"
            max="50"
            step="1"
            onKeyDown={preventMinus}
            className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            <Bath className="inline size-4 mr-1" />
            Number of Bathrooms *
          </label>
          <input
            type="number"
            placeholder="e.g., 3"
            value={formData.bathrooms}
            onChange={(e) => {
              const v = e.target.value;
              if (v === '' || Number(v) >= 0) handleInputChange("bathrooms", v);
            }}
            min="0"
            max="50"
            step="1"
            onKeyDown={preventMinus}
            className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            Number of Floors
          </label>
          <input
            type="number"
            placeholder="e.g., 2"
            value={formData.floors}
            onChange={(e) => {
              const v = e.target.value;
              if (v === '' || Number(v) >= 0) handleInputChange("floors", v);
            }}
            min="0"
            max="200"
            step="1"
            onKeyDown={preventMinus}
            className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            <Calendar className="inline size-4 mr-1" />
            Year Built
          </label>
          <input
            type="number"
            placeholder={`e.g., ${currentYear - 5}`}
            value={formData.yearBuilt}
            onChange={(e) => {
              const val = e.target.value;
              if (val === '' || val.length <= 4) handleInputChange("yearBuilt", val);
            }}
            min="1800"
            max={currentYear}
            step="1"
            onKeyDown={preventMinus}
            className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            <Armchair className="inline size-4 mr-1" />
            Lounge
          </label>
          <input
            type="number"
            placeholder="e.g., 1"
            value={formData.parkingSpaces}
            onChange={(e) => {
              const v = e.target.value;
              if (v === '' || Number(v) >= 0) handleInputChange("parkingSpaces", v);
            }}
            min="0"
            max="10"
            step="1"
            onKeyDown={preventMinus}
            className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            Furnished / Unfurnished *
          </label>
          <select
            value={formData.furnishedStatus}
            onChange={(e) =>
              handleInputChange("furnishedStatus", e.target.value)
            }
            className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="unfurnished">Unfurnished</option>
            <option value="semi-furnished">Semi-Furnished</option>
            <option value="fully-furnished">Fully Furnished</option>
          </select>
        </div>
      </div>
    </div>
  );
}
