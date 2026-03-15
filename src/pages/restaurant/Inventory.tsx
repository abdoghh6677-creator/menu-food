import React, { useEffect, useState } from "react";
import { Plus, Edit, Trash2, AlertTriangle, Package, TrendingDown, DollarSign, Search, RefreshCw } from "lucide-react";
import { Card, Button, Input, Badge, Modal, Loading, Alert } from "../../components/ui";
import {
  getInventoryItems,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  bulkUpdateInventory,
  getLowStockAlerts,
  toggleInventoryTracking,
  getInventoryStats,
  subscribeToInventory
} from "../../services/restaurantService";
import type { InventoryItem } from "../../services/restaurantService";
import { formatCurrency } from "../../utils/helpers";

const Inventory: React.FC = () => {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBulkUpdateModal, setShowBulkUpdateModal] = useState(false);
  const [lowStockAlerts, setLowStockAlerts] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStockItems: 0,
    totalValue: 0,
    outOfStockItems: 0
  });

  // نموذج إضافة/تعديل
  const [formData, setFormData] = useState({
    menu_item_id: "",
    item_name: "",
    current_stock: 0,
    minimum_stock: 5,
    unit: "قطعة",
    cost_price: 0,
    supplier_name: "",
    auto_deduct: true,
    low_stock_alert: true
  });

  // نموذج التحديث الجماعي
  const [bulkUpdates, setBulkUpdates] = useState<Array<{
    menu_item_id: string;
    current_stock: number;
    minimum_stock?: number;
    cost_price?: number;
    supplier_name?: string;
  }>>([]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user.restaurant_id) return;

    const loadData = async () => {
      const [items, alerts, inventoryStats] = await Promise.all([
        getInventoryItems(user.restaurant_id),
        getLowStockAlerts(user.restaurant_id),
        getInventoryStats(user.restaurant_id)
      ]);

      setInventoryItems(items);
      setLowStockAlerts(alerts);
      setStats(inventoryStats);
      setLoading(false);
    };

    loadData();

    const subscription = subscribeToInventory(user.restaurant_id, (data) => {
      setInventoryItems(data);
    });

    return () => { subscription.unsubscribe(); };
  }, []);

  const filteredItems = inventoryItems.filter((item) =>
    item.item_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    if (showAddModal) {
      const success = await createInventoryItem({
        ...formData,
        restaurant_id: user.restaurant_id
      });

      if (success.success) {
        setShowAddModal(false);
        resetForm();
        // إعادة تحميل الإحصائيات
        const newStats = await getInventoryStats(user.restaurant_id);
        setStats(newStats);
      }
    } else if (showEditModal && selectedItem) {
      const success = await updateInventoryItem(selectedItem.id, formData);
      if (success) {
        setShowEditModal(false);
        resetForm();
      }
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;

    const success = await deleteInventoryItem(selectedItem.id);
    if (success) {
      setShowDeleteModal(false);
      setSelectedItem(null);
      // إعادة تحميل الإحصائيات
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const newStats = await getInventoryStats(user.restaurant_id);
      setStats(newStats);
    }
  };

  const handleBulkUpdate = async () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const success = await bulkUpdateInventory(user.restaurant_id, bulkUpdates);

    if (success) {
      setShowBulkUpdateModal(false);
      setBulkUpdates([]);
      // إعادة تحميل البيانات
      const [items, alerts, newStats] = await Promise.all([
        getInventoryItems(user.restaurant_id),
        getLowStockAlerts(user.restaurant_id),
        getInventoryStats(user.restaurant_id)
      ]);
      setInventoryItems(items);
      setLowStockAlerts(alerts);
      setStats(newStats);
    }
  };

  const resetForm = () => {
    setFormData({
      menu_item_id: "",
      item_name: "",
      current_stock: 0,
      minimum_stock: 5,
      unit: "قطعة",
      cost_price: 0,
      supplier_name: "",
      auto_deduct: true,
      low_stock_alert: true
    });
    setSelectedItem(null);
  };

  const openEditModal = (item: InventoryItem) => {
    setSelectedItem(item);
    setFormData({
      menu_item_id: item.menu_item_id,
      item_name: item.item_name,
      current_stock: item.current_stock,
      minimum_stock: item.minimum_stock,
      unit: item.unit,
      cost_price: item.cost_price || 0,
      supplier_name: item.supplier_name || "",
      auto_deduct: item.auto_deduct,
      low_stock_alert: item.low_stock_alert
    });
    setShowEditModal(true);
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.current_stock <= 0) return { status: "out", color: "bg-red-500", text: "نفد" };
    if (item.current_stock <= item.minimum_stock) return { status: "low", color: "bg-yellow-500", text: "منخفض" };
    return { status: "good", color: "bg-green-500", text: "متوفر" };
  };

  if (loading) return <Loading text="جاري تحميل المخزون..." />;

  return (
    <div className="space-y-6">
      {/* رأس الصفحة */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text mb-2">إدارة المخزون</h2>
          <p className="text-text-secondary">تتبع وإدارة مخزون المطعم الذكي</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => setShowBulkUpdateModal(true)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            تحديث جماعي
          </Button>
          <Button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            إضافة عنصر
          </Button>
        </div>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-sm text-text-secondary">إجمالي العناصر</p>
              <p className="text-2xl font-bold text-text">{stats.totalItems}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-yellow-500" />
            <div>
              <p className="text-sm text-text-secondary">مخزون منخفض</p>
              <p className="text-2xl font-bold text-text">{stats.lowStockItems}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <TrendingDown className="w-8 h-8 text-red-500" />
            <div>
              <p className="text-sm text-text-secondary">نفد المخزون</p>
              <p className="text-2xl font-bold text-text">{stats.outOfStockItems}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-sm text-text-secondary">إجمالي القيمة</p>
              <p className="text-2xl font-bold text-text">{formatCurrency(stats.totalValue)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* تنبيهات المخزون المنخفض */}
      {lowStockAlerts.length > 0 && (
        <Alert
          type="warning"
          title="تنبيهات المخزون المنخفض"
          message={lowStockAlerts.map((alert, index) =>
            `${alert.item_name}: ${alert.current_stock} ${alert.unit} (الحد الأدنى: ${alert.minimum_stock})`
          ).join('\n')}
          className="mb-4"
        />
      )}

      {/* شريط البحث */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="البحث في المخزون..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
            icon={<Search className="w-4 h-4" />}
          />
        </div>
      </div>

      {/* جدول المخزون */}
      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-right text-sm font-semibold text-text-secondary">العنصر</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-text-secondary">المخزون الحالي</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-text-secondary">الحد الأدنى</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-text-secondary">الوحدة</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-text-secondary">سعر الشراء</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-text-secondary">المورد</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-text-secondary">الحالة</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-text-secondary">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredItems.map((item) => {
                const stockStatus = getStockStatus(item);
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-text">{item.item_name}</td>
                    <td className="px-4 py-3 text-sm text-text font-semibold">{item.current_stock}</td>
                    <td className="px-4 py-3 text-sm text-text">{item.minimum_stock}</td>
                    <td className="px-4 py-3 text-sm text-text">{item.unit}</td>
                    <td className="px-4 py-3 text-sm text-text">
                      {item.cost_price ? formatCurrency(item.cost_price) : "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-text">{item.supplier_name || "-"}</td>
                    <td className="px-4 py-3">
                      <Badge className={`${stockStatus.color} text-white`}>
                        {stockStatus.text}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditModal(item)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          color="danger"
                          onClick={() => {
                            setSelectedItem(item);
                            setShowDeleteModal(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-8 text-text-secondary">
            لا توجد عناصر مخزون مطابقة للبحث
          </div>
        )}
      </Card>

      {/* Modal إضافة عنصر */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        title="إضافة عنصر مخزون"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="اسم العنصر"
            value={formData.item_name}
            onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="المخزون الحالي"
              type="number"
              value={formData.current_stock}
              onChange={(e) => setFormData({ ...formData, current_stock: parseFloat(e.target.value) || 0 })}
              min="0"
              step="0.01"
              required
            />

            <Input
              label="الحد الأدنى"
              type="number"
              value={formData.minimum_stock}
              onChange={(e) => setFormData({ ...formData, minimum_stock: parseFloat(e.target.value) || 0 })}
              min="0"
              step="0.01"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="الوحدة"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              required
            />

            <Input
              label="سعر الشراء"
              type="number"
              value={formData.cost_price}
              onChange={(e) => setFormData({ ...formData, cost_price: parseFloat(e.target.value) || 0 })}
              min="0"
              step="0.01"
            />
          </div>

          <Input
            label="اسم المورد"
            value={formData.supplier_name}
            onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
          />

          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.auto_deduct}
                onChange={(e) => setFormData({ ...formData, auto_deduct: e.target.checked })}
              />
              <span className="text-sm">خصم تلقائي</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.low_stock_alert}
                onChange={(e) => setFormData({ ...formData, low_stock_alert: e.target.checked })}
              />
              <span className="text-sm">تنبيه انخفاض المخزون</span>
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">
              إضافة العنصر
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowAddModal(false);
                resetForm();
              }}
            >
              إلغاء
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal تعديل عنصر */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          resetForm();
        }}
        title="تعديل عنصر مخزون"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="اسم العنصر"
            value={formData.item_name}
            onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="المخزون الحالي"
              type="number"
              value={formData.current_stock}
              onChange={(e) => setFormData({ ...formData, current_stock: parseFloat(e.target.value) || 0 })}
              min="0"
              step="0.01"
              required
            />

            <Input
              label="الحد الأدنى"
              type="number"
              value={formData.minimum_stock}
              onChange={(e) => setFormData({ ...formData, minimum_stock: parseFloat(e.target.value) || 0 })}
              min="0"
              step="0.01"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="الوحدة"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              required
            />

            <Input
              label="سعر الشراء"
              type="number"
              value={formData.cost_price}
              onChange={(e) => setFormData({ ...formData, cost_price: parseFloat(e.target.value) || 0 })}
              min="0"
              step="0.01"
            />
          </div>

          <Input
            label="اسم المورد"
            value={formData.supplier_name}
            onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
          />

          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.auto_deduct}
                onChange={(e) => setFormData({ ...formData, auto_deduct: e.target.checked })}
              />
              <span className="text-sm">خصم تلقائي</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.low_stock_alert}
                onChange={(e) => setFormData({ ...formData, low_stock_alert: e.target.checked })}
              />
              <span className="text-sm">تنبيه انخفاض المخزون</span>
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">
              حفظ التغييرات
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowEditModal(false);
                resetForm();
              }}
            >
              إلغاء
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal حذف عنصر */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedItem(null);
        }}
        title="حذف عنصر مخزون"
      >
        <div className="text-center">
          <p className="text-text mb-4">
            هل أنت متأكد من حذف عنصر "{selectedItem?.item_name}"؟
          </p>
          <p className="text-text-secondary text-sm mb-6">
            هذا الإجراء لا يمكن التراجع عنه.
          </p>

          <div className="flex gap-3">
            <Button
              color="danger"
              onClick={handleDelete}
              className="flex-1"
            >
              حذف
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedItem(null);
              }}
              className="flex-1"
            >
              إلغاء
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal التحديث الجماعي */}
      <Modal
        isOpen={showBulkUpdateModal}
        onClose={() => {
          setShowBulkUpdateModal(false);
          setBulkUpdates([]);
        }}
        title="تحديث جماعي للمخزون"
      >
        <div className="space-y-4">
          <p className="text-text-secondary text-sm">
            حدد العناصر التي تريد تحديث مخزونها:
          </p>

          <div className="max-h-60 overflow-y-auto space-y-2">
            {inventoryItems.slice(0, 10).map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-3 border rounded">
                <input
                  type="checkbox"
                  onChange={(e) => {
                    if (e.target.checked) {
                      setBulkUpdates([...bulkUpdates, {
                        menu_item_id: item.menu_item_id,
                        current_stock: item.current_stock
                      }]);
                    } else {
                      setBulkUpdates(bulkUpdates.filter(u => u.menu_item_id !== item.menu_item_id));
                    }
                  }}
                />
                <div className="flex-1">
                  <p className="font-medium">{item.item_name}</p>
                  <p className="text-sm text-text-secondary">
                    المخزون الحالي: {item.current_stock} {item.unit}
                  </p>
                </div>
                <Input
                  type="number"
                  placeholder="مخزون جديد"
                  className="w-24"
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    setBulkUpdates(bulkUpdates.map(u =>
                      u.menu_item_id === item.menu_item_id
                        ? { ...u, current_stock: value }
                        : u
                    ));
                  }}
                />
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleBulkUpdate}
              disabled={bulkUpdates.length === 0}
              className="flex-1"
            >
              تحديث المخزون
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowBulkUpdateModal(false);
                setBulkUpdates([]);
              }}
              className="flex-1"
            >
              إلغاء
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Inventory;