import { useState } from "react";
import {
  X,
  Save,
  Plus,
  GripVertical,
  Edit,
  Trash2,
  ExternalLink,
  FileText,
  ChevronRight,
  ChevronDown,
  Layers,
  Menu as MenuIcon,
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTheme } from "../../../app/hooks/useTheme";

interface MenuEditorProps {
  onClose: () => void;
  editData?: any;
  onSave?: (menuData: any) => Promise<void>;
}

const allIcons = [
  "Home", "Building2", "Building", "MapPin", "Map",
  "Gavel", "Package", "Grid3x3", "LayoutGrid",
  "FileText", "File", "ClipboardList", "BookOpen",
  "Mail", "Phone", "MessageSquare", "Bell",
  "Users", "User", "UserCheck", "UserPlus",
  "Settings", "Shield", "Lock", "Key",
  "Star", "Heart", "Award", "Trophy",
  "Zap", "Flame", "Sparkles", "Sun",
  "DollarSign", "PoundSterling", "Calculator", "TrendingUp",
  "Search", "Filter", "Menu", "MoreHorizontal",
  "ChevronRight", "ChevronDown", "ArrowRight", "ExternalLink",
  "Plus", "Edit", "Trash2", "Copy",
  "Image", "Camera", "Video", "Play",
  "Calendar", "Clock", "Timer", "AlarmClock",
  "Tag", "Bookmark", "Flag", "Layers",
  "Globe", "Link", "Share2", "Download",
  "ThumbsUp", "ThumbsDown", "HelpCircle", "Info",
  "Briefcase", "Gift", "ShoppingCart", "Store",
  "Car", "Truck", "Plane", "Train",
  "Grid", "List", "Table", "BarChart",
  "CheckCircle", "XCircle", "AlertCircle", "Circle",
  "Scale", "Monitor", "Laptop", "Smartphone",
];

const getDynIcon = (name: string) => (LucideIcons as any)[name] || FileText;

interface SortableItemProps {
  id: string;
  children: (listeners: any, attributes: any) => React.ReactNode;
}

function SortableItem({ id, children }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style}>
      {children(listeners, attributes)}
    </div>
  );
}

export default function MenuEditor({
  onClose,
  editData,
  onSave,
}: MenuEditorProps) {
  const theme = useTheme();
  const [menuSettings, setMenuSettings] = useState({
    name: editData?.name || "",
    location: editData?.location || "Header",
    status: editData?.status || "active",
  });

  const [menuItems, setMenuItems] = useState<any[]>(() => {
    if (Array.isArray(editData?.items)) {
      return editData.items.map((item: any, index: number) => ({
        ...item,
        id: item.id || item._id || Date.now() + index,
      }));
    }
    return [];
  });

  const [editingItem, setEditingItem] = useState<any>(null);
  const [showItemForm, setShowItemForm] = useState(false);
  const [iconSearch, setIconSearch] = useState("");

  const [itemForm, setItemForm] = useState({
    label: "",
    url: "",
    type: "link",
    icon: "",
    target: "_self",
    parent: null as any,
    badge: false,
    badgeLabel: "LIVE",
    badgeColor: "red",
    subtitle: "",
  });

  const getParentItems = () => {
    return menuItems
      .filter((item) => {
        const parent = item.parent?._id || item.parent;
        return !parent || parent === null || parent === "";
      })
      .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
  };

  const getChildItems = (parentId: any) => {
    return menuItems
      .filter((item) => {
        const parent = item.parent?._id?.toString() || item.parent?.toString();
        const pid = parentId?._id?.toString() || parentId?.toString();
        return parent && pid && parent === pid;
      })
      .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
  };

  const countChildren = (parentId: any) => getChildItems(parentId).length;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setMenuItems((items) => {
      const parentItems = items
        .filter((item: any) => {
          const parent = item.parent?._id || item.parent;
          return !parent || parent === null || parent === "";
        })
        .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

      const oldIndex = parentItems.findIndex(
        (item: any) => (item.id || item._id)?.toString() === active.id
      );
      const newIndex = parentItems.findIndex(
        (item: any) => (item.id || item._id)?.toString() === over.id
      );

      if (oldIndex === -1 || newIndex === -1) return items;

      const reordered = arrayMove(parentItems, oldIndex, newIndex);

      const updatedParents = reordered.map((item: any, idx: number) => ({
        ...item,
        order: idx,
      }));

      const children = items.filter((item: any) => {
        const parent = item.parent?._id || item.parent;
        return parent && parent !== null && parent !== "";
      });

      return [...updatedParents, ...children];
    });
  };

  const handleChildDragEnd = (event: DragEndEvent, parentId: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setMenuItems((items) => {
      const pid = parentId?._id?.toString() || parentId?.toString();

      const childItems = items
        .filter((item: any) => {
          const parent = item.parent?._id?.toString() || item.parent?.toString();
          return parent === pid;
        })
        .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

      const oldIndex = childItems.findIndex(
        (item: any) => (item.id || item._id)?.toString() === active.id
      );
      const newIndex = childItems.findIndex(
        (item: any) => (item.id || item._id)?.toString() === over.id
      );

      if (oldIndex === -1 || newIndex === -1) return items;

      const reordered = arrayMove(childItems, oldIndex, newIndex);
      const updatedChildren = reordered.map((item: any, idx: number) => ({
        ...item,
        order: idx,
      }));

      const otherItems = items.filter((item: any) => {
        const parent = item.parent?._id?.toString() || item.parent?.toString();
        return parent !== pid;
      });

      return [...otherItems, ...updatedChildren];
    });
  };

  const handleAddItem = () => {
    if (!itemForm.label) return;

    if (itemForm.url && !itemForm.url.startsWith("/") && !itemForm.url.startsWith("http")) {
      alert("URL must start with / (e.g., /auctions) or https://");
      return;
    }

    if (editingItem) {
      setMenuItems(
        menuItems.map((item) => {
          const iid = (item.id || item._id)?.toString();
          const eid = (editingItem?.id || editingItem?._id)?.toString();
          return iid === eid
            ? { ...itemForm, id: item.id, _id: item._id }
            : item;
        }),
      );
      setEditingItem(null);
    } else {
      const maxOrder =
        menuItems.length > 0
          ? Math.max(...menuItems.map((i: any) => i.order || 0)) + 1
          : 0;
      setMenuItems([...menuItems, { ...itemForm, id: Date.now(), order: maxOrder }]);
    }

    setItemForm({
      label: "",
      url: "",
      type: "link",
      icon: "",
      target: "_self",
      parent: null,
      badge: false,
      badgeLabel: "LIVE",
      badgeColor: "red",
      subtitle: "",
    });
    setIconSearch("");
    setShowItemForm(false);
  };

  const handleEditItem = (item: any) => {
    const normalizedItem = { ...item, id: item.id || item._id };
    setEditingItem(normalizedItem);
    setItemForm({
      ...normalizedItem,
      subtitle: normalizedItem.subtitle || "",
      badgeLabel: normalizedItem.badgeLabel || "LIVE",
      badgeColor: normalizedItem.badgeColor || "red",
    });
    setIconSearch("");
    setShowItemForm(true);
  };

  const handleDeleteItem = (id: any) => {
    const idStr = id?.toString();
    setMenuItems(
      menuItems.filter((item) => {
        const itemId = (item.id || item._id)?.toString();
        const parentId = (item.parent?._id || item.parent)?.toString();
        return itemId !== idStr && parentId !== idStr;
      }),
    );
  };

  const handleSave = async () => {
    const menuData = {
      ...menuSettings,
      items: menuItems,
      itemCount: menuItems.length,
    };
    if (onSave) {
      try {
        await onSave(menuData);
        onClose();
      } catch (err) {
        // Error handled by parent
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-6xl h-[95vh] sm:h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className={`bg-gradient-to-r ${theme.primary} p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-white`}>
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="size-10 sm:size-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0">
              <MenuIcon className="size-5 sm:size-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-2xl font-black">{editData ? "Edit" : "Create"} Menu</h2>
              <p className="text-xs sm:text-sm text-white/80 font-medium hidden sm:block">Build your navigation menu with drag & drop</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handleSave}
              className="px-3 sm:px-4 py-2 sm:py-2.5 bg-white text-blue-600 rounded-lg sm:rounded-xl text-sm font-bold hover:bg-white/90 transition-all flex items-center gap-1.5 shadow-lg"
            >
              <Save className="size-3.5 sm:size-4" />
              Save
            </button>
            <button
              onClick={onClose}
              title="Close"
              className="p-2 sm:p-2.5 bg-white/20 backdrop-blur-md hover:bg-white/30 rounded-lg sm:rounded-xl transition-all"
            >
              <X className="size-5 sm:size-6 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
          {/* Left Panel */}
          <div className="w-full lg:w-96 bg-slate-50 lg:border-r-2 border-b-2 lg:border-b-0 border-slate-200 overflow-y-auto flex-shrink-0 lg:max-h-full max-h-[50vh]">
            <div className="p-6">
              {/* Menu Settings */}
              <h3 className="text-lg font-black text-slate-900 mb-4">Menu Settings</h3>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Menu Name *</label>
                  <input
                    type="text"
                    value={menuSettings.name}
                    onChange={(e) => setMenuSettings({ ...menuSettings, name: e.target.value })}
                    placeholder="e.g., Main Navigation"
                    className="w-full px-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Location *</label>
                  <select
                    value={menuSettings.location}
                    onChange={(e) => setMenuSettings({ ...menuSettings, location: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Header">🌐 Header — Main website navigation</option>
                    <option value="Footer">📋 Footer — Footer link columns</option>
                    <option value="Footer Quick Links">⚡ Footer Quick Links — Horizontal action buttons</option>
                    <option value="Mobile Header">📱 Mobile Header — Mobile slide-out menu</option>
                    <option value="Admin Sidebar">🔧 Admin Sidebar — Admin panel navigation</option>
                    <option value="Admin TopBar">🔝 Admin TopBar — Admin quick actions bar</option>
                    <option value="Customer Sidebar">👤 Customer Sidebar — Customer dashboard (coming soon)</option>
                    <option value="Customer TopBar">👤 Customer TopBar — Customer quick actions (coming soon)</option>
                    <option value="Landing Page">🚀 Landing Page — Custom landing page nav</option>
                    <option value="Custom">⚙️ Custom — Developer managed slot</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Status *</label>
                  <select
                    value={menuSettings.status}
                    onChange={(e) => setMenuSettings({ ...menuSettings, status: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="h-px bg-slate-200 my-6" />

              {/* Add Menu Item */}
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-black text-slate-900">Menu Items</h3>
                <button
                  onClick={() => {
                    setEditingItem(null);
                    setItemForm({
                      label: "",
                      url: "",
                      type: "link",
                      icon: "",
                      target: "_self",
                      parent: null,
                      badge: false,
                      badgeLabel: "LIVE",
                      badgeColor: "red",
                      subtitle: "",
                    });
                    setIconSearch("");
                    setShowItemForm(true);
                  }}
                  className={`px-3 py-2 bg-gradient-to-r ${theme.secondary} text-white rounded-lg text-sm font-bold hover:scale-105 transition-all flex items-center gap-1 shadow-md`}
                >
                  <Plus className="size-4" />
                  Add Item
                </button>
              </div>

              {/* Item Form */}
              {showItemForm && (
                <div className="bg-white rounded-xl p-4 border-2 border-blue-200 mb-4 space-y-3">
                  <h4 className="font-bold text-slate-900 text-sm">
                    {editingItem ? "Edit" : "Add"} Menu Item
                  </h4>

                  {/* Label */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Label *</label>
                    <input
                      type="text"
                      value={itemForm.label}
                      onChange={(e) => setItemForm({ ...itemForm, label: e.target.value })}
                      placeholder="e.g., Home"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* URL */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">URL</label>
                    <input
                      type="text"
                      value={itemForm.url}
                      onChange={(e) => setItemForm({ ...itemForm, url: e.target.value })}
                      placeholder="e.g., /home or https://..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-slate-400 mt-1">
                      Internal: /page-name  •  External: https://...
                    </p>
                  </div>

                  {/* Subtitle */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Subtitle (Optional)
                    </label>
                    <input
                      type="text"
                      value={itemForm.subtitle || ""}
                      onChange={(e) => setItemForm({ ...itemForm, subtitle: e.target.value })}
                      placeholder="e.g., Browse auction lots"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-slate-400 mt-1">
                      Small description shown below the link label
                    </p>
                  </div>

                  {/* Parent */}
                  <div>
                    <label className="md:block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <Layers className="size-3" />
                      Parent Menu (Submenu)
                    </label>
                    <select
                      value={itemForm.parent || ""}
                      onChange={(e) =>
                        setItemForm({ ...itemForm, parent: e.target.value || null })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">None (Top Level)</option>
                      {getParentItems()
                        .filter((item) => {
                          const iid = (item.id || item._id)?.toString();
                          const eid = (editingItem?.id || editingItem?._id)?.toString();
                          return !editingItem || iid !== eid;
                        })
                        .map((item) => (
                          <option key={item.id || item._id} value={(item.id || item._id)?.toString()}>
                            {item.label}
                          </option>
                        ))}
                    </select>
                    <p className="text-xs text-slate-500 mt-1">
                      {itemForm.parent ? "This will be a submenu item" : "This will be a top-level item"}
                    </p>
                  </div>

                  {/* Icon Picker */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Icon</label>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
                      <input
                        type="text"
                        value={iconSearch}
                        onChange={(e) => setIconSearch(e.target.value)}
                        placeholder="Search icons..."
                        className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs mb-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      {itemForm.icon ? (
                        <div className="flex items-center gap-2 mb-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                          {(() => {
                            const icons: any = LucideIcons;
                            const SelectedIcon = icons[itemForm.icon];
                            return SelectedIcon ? (
                              <>
                                <SelectedIcon className="size-4 text-blue-600" />
                                <span className="text-xs font-bold text-blue-700">{itemForm.icon}</span>
                              </>
                            ) : null;
                          })()}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 mb-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
                          <X className="size-4 text-slate-400" />
                          <span className="text-xs font-bold text-slate-400">No icon selected</span>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => setItemForm({ ...itemForm, icon: "" })}
                        className={`w-full px-3 py-2 rounded-lg text-xs font-bold mb-2 flex items-center gap-2 transition-all ${
                          itemForm.icon === ""
                            ? "bg-blue-500 text-white"
                            : "bg-white border border-slate-200 text-slate-500 hover:border-blue-400"
                        }`}
                      >
                        <X className="size-3" />
                        No Icon
                      </button>
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-1 max-h-36 overflow-y-auto">
                        {allIcons
                          .filter((name) => !iconSearch || name.toLowerCase().includes(iconSearch.toLowerCase()))
                          .map((iconName) => {
                            const IconComp = getDynIcon(iconName);
                            return (
                              <button
                                key={iconName}
                                type="button"
                                title={iconName}
                                onClick={() => setItemForm({ ...itemForm, icon: iconName })}
                                className={`p-2 rounded-lg flex items-center justify-center transition-all hover:scale-110 ${
                                  itemForm.icon === iconName
                                    ? "bg-blue-500 text-white shadow-lg"
                                    : "bg-white hover:bg-blue-50 text-slate-600 border border-slate-200"
                                }`}
                              >
                                <IconComp className="size-3.5" />
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  </div>

                  {/* Type */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Type</label>
                    <select
                      value={itemForm.type}
                      onChange={(e) => setItemForm({ ...itemForm, type: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="link">Simple Link</option>
                      <option value="dropdown">Dropdown Menu</option>
                    </select>
                  </div>

                  {/* Badge */}
                  {itemForm.type === "link" && (
                    <div className="space-y-3">
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={itemForm.badge}
                          onChange={(e) => setItemForm({ ...itemForm, badge: e.target.checked })}
                          className="size-4 rounded accent-blue-600"
                        />
                        Show Badge
                      </label>

                      {itemForm.badge && (
                        <div className="ml-1 space-y-3 bg-slate-50 rounded-lg p-3 border border-slate-200">
                          {/* Badge Label Presets */}
                          <div>
                            <p className="text-xs font-bold text-slate-600 mb-1.5">Label Preset</p>
                            <div className="flex flex-wrap gap-1.5">
                              {["LIVE", "FREE", "NEW", "HOT", "SALE", "TOP"].map((preset) => (
                                <button
                                  key={preset}
                                  type="button"
                                  onClick={() => setItemForm({ ...itemForm, badgeLabel: preset })}
                                  className={`px-2 py-1 rounded text-[10px] font-black transition-all ${
                                    itemForm.badgeLabel === preset
                                      ? "bg-blue-500 text-white shadow"
                                      : "bg-white border border-slate-200 text-slate-600 hover:border-blue-400"
                                  }`}
                                >
                                  {preset}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Custom Label */}
                          <div>
                            <p className="text-xs font-bold text-slate-600 mb-1">Custom Text</p>
                            <input
                              type="text"
                              value={itemForm.badgeLabel}
                              onChange={(e) =>
                                setItemForm({
                                  ...itemForm,
                                  badgeLabel: e.target.value.toUpperCase().slice(0, 8),
                                })
                              }
                              maxLength={8}
                              placeholder="e.g., NEW"
                              className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 uppercase"
                            />
                          </div>

                          {/* Badge Color */}
                          <div>
                            <p className="text-xs font-bold text-slate-600 mb-1.5">Color</p>
                            <div className="flex gap-1.5">
                              {[
                                { key: "red", cls: "bg-red-500" },
                                { key: "green", cls: "bg-green-500" },
                                { key: "blue", cls: "bg-blue-500" },
                                { key: "orange", cls: "bg-orange-500" },
                                { key: "purple", cls: "bg-purple-500" },
                                { key: "amber", cls: "bg-amber-500" },
                                { key: "cyan", cls: "bg-cyan-500" },
                                { key: "rose", cls: "bg-rose-500" },
                              ].map(({ key, cls }) => (
                                <button
                                  key={key}
                                  type="button"
                                  onClick={() => setItemForm({ ...itemForm, badgeColor: key })}
                                  className={`size-6 rounded-full ${cls} transition-all ${
                                    itemForm.badgeColor === key
                                      ? "ring-2 ring-offset-1 ring-slate-400 scale-110"
                                      : "opacity-70 hover:opacity-100"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>

                          {/* Live Preview */}
                          <div>
                            <p className="text-xs font-bold text-slate-600 mb-1">Preview</p>
                            <div className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg">
                              <span className="text-sm font-bold text-slate-700">
                                {itemForm.label || "Menu Item"}
                              </span>
                              <span
                                className={`px-2 py-0.5 text-white text-[10px] rounded-full animate-pulse font-black ${
                                  { red: "bg-red-500", green: "bg-green-500", blue: "bg-blue-500", orange: "bg-orange-500", purple: "bg-purple-500", amber: "bg-amber-500", cyan: "bg-cyan-500", rose: "bg-rose-500" }[itemForm.badgeColor] || "bg-red-500"
                                }`}
                              >
                                {itemForm.badgeLabel || "LIVE"}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Open In */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Open In</label>
                    <select
                      value={itemForm.target}
                      onChange={(e) => setItemForm({ ...itemForm, target: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="_self">Same Window</option>
                      <option value="_blank">New Window</option>
                    </select>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => { setShowItemForm(false); setEditingItem(null); }}
                      className="flex-1 px-3 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-200 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddItem}
                      className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg text-sm font-bold hover:bg-blue-600 transition-all"
                    >
                      {editingItem ? "Update" : "Add"}
                    </button>
                  </div>
                </div>
              )}

              {/* Quick Links */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-200">
                <h4 className="font-bold text-blue-900 mb-2 text-sm">💡 Common Pages</h4>
                <div className="space-y-1">
                  {[
                    { label: "Home", url: "/" },
                    { label: "Properties", url: "/properties" },
                    { label: "Auctions", url: "/auctions" },
                    { label: "About", url: "/about" },
                    { label: "Contact", url: "/contact" },
                  ].map((page) => (
                    <button
                      key={page.url}
                      onClick={() => {
                        setItemForm({ ...itemForm, label: page.label, url: page.url });
                        setShowItemForm(true);
                      }}
                      className="w-full text-left px-2 py-1.5 bg-white hover:bg-blue-100 rounded-lg text-xs font-medium text-slate-700 hover:text-blue-700 transition-all"
                    >
                      {page.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Menu Preview */}
          <div className="flex-1 bg-gradient-to-br from-slate-100 to-slate-200 overflow-y-auto">
            <div className="p-4 sm:p-8">
              <div className="max-w-4xl mx-auto">
                {/* Menu Info Card */}
                <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-black text-slate-900">
                        {menuSettings.name || "Untitled Menu"}
                      </h3>
                      <p className="text-sm text-slate-600 font-medium">
                        Location: {menuSettings.location} • Items: {menuItems.length}
                      </p>
                    </div>
                    <span
                      className={`px-4 py-2 rounded-lg text-sm font-bold ${
                        menuSettings.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {menuSettings.status}
                    </span>
                  </div>
                </div>

                {/* Menu Items List */}
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                  <div className="bg-slate-50 border-b-2 border-slate-200 p-4">
                    <h4 className="font-black text-slate-900">Menu Structure</h4>
                    <p className="text-xs text-slate-500 font-medium">Drag items to reorder</p>
                  </div>

                  <div className="p-4">
                    {menuItems.length === 0 ? (
                      <div className="text-center py-12">
                        <div className={`size-16 rounded-2xl bg-gradient-to-br ${theme.primary} flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                          <MenuIcon className="size-8 text-white" />
                        </div>
                        <h3 className="text-lg font-black text-slate-900 mb-2">No Menu Items Yet</h3>
                        <p className="text-slate-600 font-medium text-sm">Click "Add Item" to start building your menu</p>
                      </div>
                    ) : (
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                      >
                        <SortableContext
                          items={getParentItems().map((item: any) =>
                            (item.id || item._id)?.toString()
                          )}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="space-y-2">
                            {getParentItems().map((item: any) => {
                              const itemId = (item.id || item._id)?.toString();
                              const IconComponent = getDynIcon(item.icon || "FileText");
                              const childrenCount = countChildren(item.id || item._id);
                              const children = getChildItems(item.id || item._id);

                              return (
                                <SortableItem key={itemId} id={itemId}>
                                  {(listeners, attributes) => (
                                    <div>
                                      {/* Parent Item */}
                                      <div className="group bg-gradient-to-r from-slate-50 to-white border-2 border-slate-200 rounded-xl p-4 hover:border-blue-500 transition-all">
                                        <div className="flex items-center gap-3">
                                          <div
                                            {...listeners}
                                            {...attributes}
                                            className="cursor-grab active:cursor-grabbing p-1 hover:bg-slate-200 rounded-lg transition-all"
                                            title="Drag to reorder"
                                          >
                                            <GripVertical className="size-5 text-slate-400" />
                                          </div>
                                          <div className={`size-10 rounded-lg bg-gradient-to-br ${theme.secondary} flex items-center justify-center shadow-md`}>
                                            <IconComponent className="size-5 text-white" />
                                          </div>
                                          <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                              <h4 className="font-bold text-slate-900">{item.label}</h4>
                                              {childrenCount > 0 && (
                                                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-bold flex items-center gap-1">
                                                  <Layers className="size-3" />
                                                  {childrenCount} submenu{childrenCount > 1 ? "s" : ""}
                                                </span>
                                              )}
                                            </div>
                                            <p className="text-xs text-slate-500 font-medium">{item.url}</p>
                                            {item.subtitle && (
                                              <p className="text-xs text-slate-400 font-normal mt-0.5">{item.subtitle}</p>
                                            )}
                                          </div>
                                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                              title="Edit Item"
                                              onClick={() => handleEditItem(item)}
                                              className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-all"
                                            >
                                              <Edit className="size-4" />
                                            </button>
                                            <button
                                              title="Delete Item"
                                              onClick={() => handleDeleteItem(item.id || item._id)}
                                              className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all"
                                            >
                                              <Trash2 className="size-4" />
                                            </button>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Children with their own DndContext */}
                                      {children.length > 0 && (
                                        <div className="ml-8 mt-2 space-y-2">
                                          <DndContext
                                            sensors={sensors}
                                            collisionDetection={closestCenter}
                                            onDragEnd={(e) => handleChildDragEnd(e, item.id || item._id)}
                                          >
                                            <SortableContext
                                              items={children.map((child: any) =>
                                                (child.id || child._id)?.toString()
                                              )}
                                              strategy={verticalListSortingStrategy}
                                            >
                                              {children.map((child: any) => {
                                                const childId = (child.id || child._id)?.toString();
                                                const ChildIconComponent = getDynIcon(child.icon || "FileText");
                                                return (
                                                  <SortableItem key={childId} id={childId}>
                                                    {(childListeners, childAttributes) => (
                                                      <div className="group bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-xl p-3 hover:border-purple-400 transition-all relative">
                                                        <div className="absolute -left-4 top-1/2 w-4 h-px bg-purple-300" />
                                                        <div className="flex items-center gap-2">
                                                          <div
                                                            {...childListeners}
                                                            {...childAttributes}
                                                            className="cursor-grab active:cursor-grabbing p-1 hover:bg-purple-200 rounded-lg transition-all"
                                                            title="Drag to reorder"
                                                          >
                                                            <GripVertical className="size-4 text-purple-400" />
                                                          </div>
                                                          <ChevronRight className="size-4 text-purple-500" />
                                                          <div className={`size-8 rounded-lg bg-gradient-to-br ${theme.secondary} flex items-center justify-center shadow-md`}>
                                                            <ChildIconComponent className="size-4 text-white" />
                                                          </div>
                                                          <div className="flex-1">
                                                            <div className="flex items-center gap-2">
                                                              <h4 className="font-bold text-slate-800 text-sm">{child.label}</h4>
                                                              <span className="px-1.5 py-0.5 bg-purple-200 text-purple-700 rounded text-xs font-bold">
                                                                Submenu
                                                              </span>
                                                            </div>
                                                            <p className="text-xs text-slate-500 font-medium">{child.url}</p>
                                                            {child.subtitle && (
                                                              <p className="text-xs text-slate-400 font-normal mt-0.5">{child.subtitle}</p>
                                                            )}
                                                          </div>
                                                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                              title="Edit Item"
                                                              onClick={() => handleEditItem(child)}
                                                              className="p-1.5 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-all"
                                                            >
                                                              <Edit className="size-3" />
                                                            </button>
                                                            <button
                                                              title="Delete Item"
                                                              onClick={() => handleDeleteItem(child.id || child._id)}
                                                              className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all"
                                                            >
                                                              <Trash2 className="size-3" />
                                                            </button>
                                                          </div>
                                                        </div>
                                                      </div>
                                                    )}
                                                  </SortableItem>
                                                );
                                              })}
                                            </SortableContext>
                                          </DndContext>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </SortableItem>
                              );
                            })}
                          </div>
                        </SortableContext>
                      </DndContext>
                    )}
                  </div>
                </div>

                {/* Preview Section */}
                {menuItems.length > 0 && (
                  <div className="mt-6 bg-white rounded-2xl shadow-lg overflow-hidden">
                    <div className="bg-slate-50 border-b-2 border-slate-200 p-4">
                      <h4 className="font-black text-slate-900">Live Preview</h4>
                      <p className="text-xs text-slate-500 font-medium">How your menu will look with submenus</p>
                    </div>
                    <div className="p-6">
                      {menuSettings.location.includes("Header") ? (
                        <div className={`bg-gradient-to-r ${theme.primary} rounded-xl p-4`}>
                          <div className="flex items-center gap-6">
                            <div className="text-white font-black text-xl">LOGO</div>
                            <nav className="flex items-center gap-4">
                              {getParentItems().map((item) => {
                                const IconComponent = getDynIcon(item.icon);
                                const children = getChildItems(item.id || item._id);
                                return (
                                  <div key={item.id || item._id} className="relative group/menu">
                                    <button className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg font-bold text-sm transition-all">
                                      <IconComponent className="size-4" />
                                      {item.label}
                                      {children.length > 0 && <ChevronDown className="size-3" />}
                                    </button>
                                    {children.length > 0 && (
                                      <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-2xl p-2 min-w-[200px] opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-50">
                                        {children.map((child) => {
                                          const ChildIconComponent = getDynIcon(child.icon);
                                          return (
                                            <button key={child.id || child._id} className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-purple-50 rounded-lg text-sm font-medium transition-all">
                                              <ChevronRight className="size-3 text-purple-500" />
                                              <ChildIconComponent className="size-4" />
                                              {child.label}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </nav>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-slate-50 rounded-xl p-4">
                          <div className="space-y-2">
                            {getParentItems().map((item) => {
                              const IconComponent = getDynIcon(item.icon);
                              const children = getChildItems(item.id || item._id);
                              return (
                                <div key={item.id || item._id}>
                                  <button className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-slate-100 text-slate-700 rounded-lg font-bold text-sm transition-all">
                                    <div className="flex items-center gap-3">
                                      <IconComponent className="size-4" />
                                      {item.label}
                                    </div>
                                    {children.length > 0 ? (
                                      <div className="flex items-center gap-1">
                                        <span className="text-xs text-purple-600 font-bold">{children.length}</span>
                                        <ChevronDown className="size-4 text-slate-400" />
                                      </div>
                                    ) : (
                                      <ChevronRight className="size-4 text-slate-400" />
                                    )}
                                  </button>
                                  {children.length > 0 && (
                                    <div className="ml-6 mt-1 space-y-1">
                                      {children.map((child) => {
                                        const ChildIconComponent = getDynIcon(child.icon);
                                        return (
                                          <button key={child.id || child._id} className="w-full flex items-center gap-2 px-3 py-2 bg-purple-50 hover:bg-purple-100 text-slate-700 rounded-lg text-sm font-medium transition-all">
                                            <ChevronRight className="size-3 text-purple-500" />
                                            <ChildIconComponent className="size-3" />
                                            {child.label}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
