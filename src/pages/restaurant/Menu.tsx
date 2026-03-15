import React, { useEffect, useState } from "react";
import { Plus, Edit, Trash2, Eye, EyeOff, Search, Package } from "lucide-react";
import ImageUpload from "../../components/ImageUpload";
import { Card, Button, Input, Badge, Modal, Loading, Alert, Textarea } from "../../components/ui";
import { subscribeToMenuItems, createMenuItem, updateMenuItem, deleteMenuItem, toggleMenuItemAvailability } from "../../services/restaurantService";
import type { MenuItem } from "../../config/supabase";
import { formatCurrency } from "../../utils/helpers";

const Menu: React.FC = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user.restaurant_id) return;
    const subscription = subscribeToMenuItems(user.restaurant_id, (data) => {
      setMenuItems(data);
      setLoading(false);
    });
    return () => { subscription.unsubscribe(); };
  }, []);

  const categories = ["all", ...new Set(menuItems.map((item) => item.category_ar || item.category).filter(Boolean))];

  const filteredItems = menuItems.filter((item) => {
    const nameAr = item.name_ar || item.name || "";
    const nameEn = item.name || "";
    const matchesSearch = nameAr.toLowerCase().includes(searchTerm.toLowerCase()) || nameEn.toLowerCase().includes(searchTerm.toLowerCase());
    const itemCat = item.category_ar || item.category;
    const matchesCategory = categoryFilter === "all" || itemCat === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleToggleAvailability = async (item: MenuItem) => {
    await toggleMenuItemAvailability(item.id, !item.is_available);
  };

  if (loading) return <Loading text="جاري تحميل المنيو..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text mb-2">إدارة المنيو</h2>
          <p className="text-text-secondary">إدارة أصناف المنيو والتوفر</p>
        </div>
        <Button icon={<Plus className="w-5 h-5" />} onClick={() => setShowAddModal(true)}>إضافة صنف</Button>
      </div>

      <div className="flex items-center gap-2 text-sm text-success">
        <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
        <span>تحديث مباشر • تغييرات التوفر تظهر للعملاء فوراً</span>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input placeholder="البحث في الأصناف..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} icon={<Search className="w-5 h-5" />} />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button key={category} onClick={() => setCategoryFilter(category || "all")}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${categoryFilter === category ? "bg-accent text-white" : "bg-white border border-border text-text-secondary hover:bg-bg-subtle"}`}>
              {category === "all" ? "كل الأصناف" : category}
            </button>
          ))}
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <Card className="text-center py-12">
          <Package className="w-16 h-16 text-text-secondary mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-semibold text-text mb-2">لا توجد أصناف</h3>
          <p className="text-text-secondary mb-4">{searchTerm || categoryFilter !== "all" ? "جرّب تعديل الفلاتر" : "ابدأ بإضافة أول صنف في المنيو"}</p>
          <Button icon={<Plus className="w-5 h-5" />} onClick={() => setShowAddModal(true)}>إضافة أول صنف</Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredItems.map((item) => (
            <Card key={item.id} className={`hover:shadow-lg transition-shadow ${!item.is_available ? "opacity-60" : ""}`}>
              <div className="flex flex-col lg:flex-row gap-4">
                {item.image_url && (
                  <img src={item.image_url} alt={item.name_ar || item.name} className="w-full lg:w-32 h-32 object-cover rounded-lg" />
                )}
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-text">{item.name_ar || item.name}</h3>
                        {item.name && item.name_ar && <span className="text-sm text-text-secondary">({item.name})</span>}
                        <Badge variant={item.is_available ? "success" : "neutral"}>
                          {item.is_available ? "متاح" : "غير متاح"}
                        </Badge>
                      </div>
                      {(item.category_ar || item.category) && (
                        <Badge variant="neutral" className="text-xs">{item.category_ar || item.category}</Badge>
                      )}
                    </div>
                  </div>
                  {(item.description_ar || item.description) && (
                    <p className="text-text-secondary text-sm">{item.description_ar || item.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div>
                      <span className="text-text-secondary">السعر الأساسي: </span>
                      <span className="text-accent font-semibold text-lg">{formatCurrency(item.base_price)}</span>
                    </div>
                    {item.sizes && item.sizes.length > 0 && (
                      <div>
                        <span className="text-text-secondary">الأحجام: </span>
                        <span className="text-text">{item.sizes.map((s) => s.name_ar || s.name).join("، ")}</span>
                      </div>
                    )}
                    {item.addons && item.addons.length > 0 && (
                      <div>
                        <span className="text-text-secondary">إضافات: </span>
                        <span className="text-text">{item.addons.length} متاحة</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex lg:flex-col gap-2 lg:min-w-[160px]">
                  <Button size="sm" variant={item.is_available ? "outline" : "secondary"}
                    icon={item.is_available ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    onClick={() => handleToggleAvailability(item)} fullWidth>
                    {item.is_available ? "تعيين غير متاح" : "تعيين متاح"}
                  </Button>
                  <Button size="sm" variant="outline" icon={<Edit className="w-4 h-4" />}
                    onClick={() => { setSelectedItem(item); setShowEditModal(true); }} fullWidth>تعديل</Button>
                  <Button size="sm" variant="outline" icon={<Trash2 className="w-4 h-4" />}
                    onClick={() => { setSelectedItem(item); setShowDeleteModal(true); }} fullWidth>حذف</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <MenuItemModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} mode="add" />
      <MenuItemModal isOpen={showEditModal} item={selectedItem} onClose={() => { setShowEditModal(false); setSelectedItem(null); }} mode="edit" />
      <DeleteModal isOpen={showDeleteModal} item={selectedItem} onClose={() => { setShowDeleteModal(false); setSelectedItem(null); }} />
    </div>
  );
};

interface MenuItemModalProps {
  isOpen: boolean;
  item?: MenuItem | null;
  onClose: () => void;
  mode: "add" | "edit";
}

const MenuItemModal: React.FC<MenuItemModalProps> = ({ isOpen, item, onClose, mode }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "", name_ar: "",
    description: "", description_ar: "",
    category: "", category_ar: "",
    base_price: "", image_url: "", is_available: true,
    sizes: [] as { name: string; name_ar?: string; price: number }[],
    addons: [] as { name: string; name_ar?: string; price: number }[],
  });
  const [newSize, setNewSize] = useState({ name: "", name_ar: "", price: "" });
  const [newAddon, setNewAddon] = useState({ name: "", name_ar: "", price: "" });

  useEffect(() => {
    if (mode === "edit" && item) {
      setFormData({
        name: item.name || "", name_ar: item.name_ar || "",
        description: item.description || "", description_ar: item.description_ar || "",
        category: item.category || "", category_ar: item.category_ar || "",
        base_price: item.base_price.toString(), image_url: item.image_url || "",
        is_available: item.is_available,
        sizes: item.sizes || [], addons: item.addons || [],
      });
    } else {
      setFormData({ name: "", name_ar: "", description: "", description_ar: "", category: "", category_ar: "", base_price: "", image_url: "", is_available: true, sizes: [], addons: [] });
    }
  }, [mode, item, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!formData.name_ar || !formData.base_price) {
      setError("اسم الصنف (عربي) والسعر مطلوبان");
      return;
    }
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user.restaurant_id) { setError("لم يتم العثور على معرّف المطعم"); return; }
    setLoading(true);
    const menuItemData = {
      restaurant_id: user.restaurant_id,
      name: formData.name || formData.name_ar,
      name_ar: formData.name_ar || undefined,
      description: formData.description || undefined,
      description_ar: formData.description_ar || undefined,
      category: formData.category || undefined,
      category_ar: formData.category_ar || undefined,
      base_price: parseFloat(formData.base_price),
      image_url: formData.image_url || undefined,
      is_available: formData.is_available,
      sizes: formData.sizes.length > 0 ? formData.sizes : undefined,
      addons: formData.addons.length > 0 ? formData.addons : undefined,
    };
    let success = false;
    let errorMessage = "";

    if (mode === "add") {
      const result = await createMenuItem(menuItemData);
      success = result.success;
      if (result.error) errorMessage = result.error.message;
    } else if (item) {
      const result = await updateMenuItem(item.id, menuItemData);
      success = result.success;
      if (result.error) errorMessage = result.error.message;
    }

    setLoading(false);
    if (success) onClose();
    else setError(errorMessage || (mode === "add" ? "فشل إضافة الصنف" : "فشل تعديل الصنف"));
  };

  const addSize = () => {
    if (newSize.name_ar && newSize.price) {
      setFormData({ ...formData, sizes: [...formData.sizes, { name: newSize.name || newSize.name_ar, name_ar: newSize.name_ar, price: parseFloat(newSize.price) }] });
      setNewSize({ name: "", name_ar: "", price: "" });
    }
  };

  const addAddon = () => {
    if (newAddon.name_ar && newAddon.price) {
      setFormData({ ...formData, addons: [...formData.addons, { name: newAddon.name || newAddon.name_ar, name_ar: newAddon.name_ar, price: parseFloat(newAddon.price) }] });
      setNewAddon({ name: "", name_ar: "", price: "" });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={mode === "add" ? "إضافة صنف" : "تعديل الصنف"} size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <Alert type="error" message={error} />}

        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="اسم الصنف (عربي) *" value={formData.name_ar} onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })} placeholder="مثال: بيتزا مارغريتا" required />
          <Input label="Item Name (English)" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Margherita Pizza" />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Textarea label="الوصف (عربي)" value={formData.description_ar} onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })} placeholder="وصف الصنف..." rows={2} />
          <Textarea label="Description (English)" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Describe your item..." rows={2} />
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <Input label="الفئة (عربي)" value={formData.category_ar} onChange={(e) => setFormData({ ...formData, category_ar: e.target.value })} placeholder="مثال: مشويات" />
          <Input label="Category (English)" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} placeholder="e.g., Grills" />
          <Input label="السعر الأساسي (ج.م)" type="number" step="0.01" value={formData.base_price} onChange={(e) => setFormData({ ...formData, base_price: e.target.value })} placeholder="0.00" required />
        </div>

        <ImageUpload
          currentUrl={formData.image_url}
          onUpload={(url) => setFormData({ ...formData, image_url: url })}
          onRemove={() => setFormData({ ...formData, image_url: "" })}
          label="صورة الصنف (اختياري)"
        />

        {/* Sizes */}
        <div>
          <label className="label mb-3">الأحجام (اختياري)</label>
          <div className="space-y-2 mb-3">
            {formData.sizes.map((size, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-bg-subtle rounded-lg">
                <span className="text-text">{size.name_ar || size.name} / {size.name} — {formatCurrency(size.price)}</span>
                <button type="button" onClick={() => setFormData({ ...formData, sizes: formData.sizes.filter((_, i) => i !== index) })} className="text-error hover:bg-error/10 p-1 rounded"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Input placeholder="اسم الحجم (عربي)" value={newSize.name_ar} onChange={(e) => setNewSize({ ...newSize, name_ar: e.target.value })} />
            <Input placeholder="Size Name (EN)" value={newSize.name} onChange={(e) => setNewSize({ ...newSize, name: e.target.value })} />
            <Input placeholder="السعر" type="number" step="0.01" value={newSize.price} onChange={(e) => setNewSize({ ...newSize, price: e.target.value })} />
          </div>
          <Button type="button" onClick={addSize} variant="outline" className="mt-2">+ إضافة حجم</Button>
        </div>

        {/* Addons */}
        <div>
          <label className="label mb-3">الإضافات (اختياري)</label>
          <div className="space-y-2 mb-3">
            {formData.addons.map((addon, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-bg-subtle rounded-lg">
                <span className="text-text">{addon.name_ar || addon.name} / {addon.name} — +{formatCurrency(addon.price)}</span>
                <button type="button" onClick={() => setFormData({ ...formData, addons: formData.addons.filter((_, i) => i !== index) })} className="text-error hover:bg-error/10 p-1 rounded"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Input placeholder="اسم الإضافة (عربي)" value={newAddon.name_ar} onChange={(e) => setNewAddon({ ...newAddon, name_ar: e.target.value })} />
            <Input placeholder="Addon Name (EN)" value={newAddon.name} onChange={(e) => setNewAddon({ ...newAddon, name: e.target.value })} />
            <Input placeholder="السعر" type="number" step="0.01" value={newAddon.price} onChange={(e) => setNewAddon({ ...newAddon, price: e.target.value })} />
          </div>
          <Button type="button" onClick={addAddon} variant="outline" className="mt-2">+ إضافة</Button>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={formData.is_available} onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })} className="rounded border-border" />
          <span className="text-text">متاح للطلب</span>
        </label>

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={onClose} fullWidth>إلغاء</Button>
          <Button type="submit" loading={loading} fullWidth>{mode === "add" ? "إضافة الصنف" : "حفظ التغييرات"}</Button>
        </div>
      </form>
    </Modal>
  );
};

const DeleteModal: React.FC<{ isOpen: boolean; item: MenuItem | null; onClose: () => void }> = ({ isOpen, item, onClose }) => {
  const [loading, setLoading] = useState(false);
  const handleDelete = async () => {
    if (!item) return;
    setLoading(true);
    const success = await deleteMenuItem(item.id);
    setLoading(false);
    if (success) onClose();
  };
  if (!item) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="حذف الصنف" size="md">
      <div className="space-y-4">
        <Alert type="warning" message={`هل أنت متأكد من حذف "${item.name_ar || item.name}"؟ لا يمكن التراجع عن هذا الإجراء.`} />
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} fullWidth>إلغاء</Button>
          <Button variant="danger" onClick={handleDelete} loading={loading} fullWidth>حذف الصنف</Button>
        </div>
      </div>
    </Modal>
  );
};

export default Menu;
