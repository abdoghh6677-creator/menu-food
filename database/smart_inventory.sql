-- =====================================================
-- نظام المخزون الذكي مع الخصم التلقائي
-- Smart Inventory System with Automatic Deduction
-- =====================================================

-- إنشاء جدول المخزون
CREATE TABLE IF NOT EXISTS inventory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL, -- للنسخ الاحتياطي في حال حذف العنصر
    current_stock DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (current_stock >= 0),
    minimum_stock DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (minimum_stock >= 0),
    unit TEXT NOT NULL DEFAULT 'قطعة' CHECK (unit IN ('قطعة', 'كيلو', 'لتر', 'علبة', 'حزمة')),
    cost_price DECIMAL(10, 2) DEFAULT 0 CHECK (cost_price >= 0),
    supplier_name TEXT,
    last_restocked_at TIMESTAMP WITH TIME ZONE,
    auto_deduct BOOLEAN NOT NULL DEFAULT TRUE,
    low_stock_alert BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(restaurant_id, menu_item_id)
);

-- إضافة عمود stock_quantity إلى menu_items للربط السريع
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS stock_quantity DECIMAL(10, 2) DEFAULT NULL;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS track_inventory BOOLEAN DEFAULT FALSE;

-- إنشاء فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_inventory_restaurant_id ON inventory(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_menu_item_id ON inventory(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_low_stock ON inventory(restaurant_id, current_stock, minimum_stock) WHERE current_stock <= minimum_stock;

-- دالة لتحديث updated_at
CREATE OR REPLACE FUNCTION update_inventory_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- trigger للتحديث التلقائي
CREATE TRIGGER trigger_update_inventory_updated_at
    BEFORE UPDATE ON inventory
    FOR EACH ROW
    EXECUTE FUNCTION update_inventory_updated_at();

-- دالة للخصم التلقائي من المخزون عند قبول الطلب
CREATE OR REPLACE FUNCTION deduct_inventory_on_order_accept()
RETURNS TRIGGER AS $$
DECLARE
    item_record RECORD;
    inventory_item RECORD;
    required_quantity DECIMAL(10, 2);
BEGIN
    -- فقط عند تغيير الحالة إلى 'accepted'
    IF OLD.status != 'accepted' AND NEW.status = 'accepted' THEN
        -- تكرار على كل عنصر في الطلب
        FOR item_record IN
            SELECT
                (item->>'menu_item_id')::UUID as menu_item_id,
                (item->>'quantity')::DECIMAL as quantity,
                (item->>'size') as size
            FROM jsonb_array_elements(NEW.items) as item
        LOOP
            -- البحث عن المخزون لهذا العنصر
            SELECT * INTO inventory_item
            FROM inventory
            WHERE menu_item_id = item_record.menu_item_id
              AND restaurant_id = NEW.restaurant_id
              AND auto_deduct = TRUE;

            IF FOUND THEN
                -- حساب الكمية المطلوبة (مع مراعاة الحجم إذا كان موجوداً)
                required_quantity := item_record.quantity;

                -- خصم من المخزون
                UPDATE inventory
                SET current_stock = current_stock - required_quantity,
                    updated_at = NOW()
                WHERE id = inventory_item.id;

                -- تحقق من انخفاض المخزون
                IF (inventory_item.current_stock - required_quantity) <= inventory_item.minimum_stock THEN
                    -- يمكن إضافة إشعار هنا في المستقبل
                    RAISE NOTICE 'تحذير: انخفاض مخزون العنصر % إلى %', inventory_item.item_name, (inventory_item.current_stock - required_quantity);
                END IF;
            END IF;
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- دالة للخصم التلقائي عند إنشاء الطلب (للطلبات التلقائية)
CREATE OR REPLACE FUNCTION deduct_inventory_on_order_create()
RETURNS TRIGGER AS $$
DECLARE
    item_record RECORD;
    inventory_item RECORD;
    required_quantity DECIMAL(10, 2);
BEGIN
    -- تكرار على كل عنصر في الطلب
    FOR item_record IN
        SELECT
            (item->>'menu_item_id')::UUID as menu_item_id,
            (item->>'quantity')::DECIMAL as quantity,
            (item->>'size') as size
        FROM jsonb_array_elements(NEW.items) as item
    LOOP
        -- البحث عن المخزون لهذا العنصر
        SELECT * INTO inventory_item
        FROM inventory
        WHERE menu_item_id = item_record.menu_item_id
          AND restaurant_id = NEW.restaurant_id
          AND auto_deduct = TRUE;

        IF FOUND THEN
            -- حساب الكمية المطلوبة
            required_quantity := item_record.quantity;

            -- التحقق من توفر المخزون
            IF inventory_item.current_stock < required_quantity THEN
                RAISE EXCEPTION 'المخزون غير كافي للعنصر: %. المطلوب: %, المتوفر: %',
                    inventory_item.item_name, required_quantity, inventory_item.current_stock;
            END IF;

            -- خصم من المخزون
            UPDATE inventory
            SET current_stock = current_stock - required_quantity,
                updated_at = NOW()
            WHERE id = inventory_item.id;
        END IF;
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء triggers للخصم التلقائي
DROP TRIGGER IF EXISTS trigger_deduct_inventory_on_accept ON orders;
CREATE TRIGGER trigger_deduct_inventory_on_accept
    AFTER UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION deduct_inventory_on_order_accept();

-- خيار: خصم فوري عند الإنشاء (للطلبات عبر الإنترنت)
-- DROP TRIGGER IF EXISTS trigger_deduct_inventory_on_create ON orders;
-- CREATE TRIGGER trigger_deduct_inventory_on_create
--     BEFORE INSERT ON orders
--     FOR EACH ROW
--     EXECUTE FUNCTION deduct_inventory_on_order_create();

-- دالة لإضافة عنصر مخزون تلقائياً عند إنشاء عنصر قائمة
CREATE OR REPLACE FUNCTION create_inventory_on_menu_item_create()
RETURNS TRIGGER AS $$
BEGIN
    -- إذا كان track_inventory مفعل، أنشئ سجل مخزون
    IF NEW.track_inventory = TRUE THEN
        INSERT INTO inventory (
            restaurant_id,
            menu_item_id,
            item_name,
            current_stock,
            minimum_stock,
            unit
        ) VALUES (
            NEW.restaurant_id,
            NEW.id,
            NEW.name,
            COALESCE(NEW.stock_quantity, 0),
            5, -- حد أدنى افتراضي
            'قطعة'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- trigger لإنشاء المخزون تلقائياً
CREATE TRIGGER trigger_create_inventory_on_menu_item
    AFTER INSERT ON menu_items
    FOR EACH ROW
    WHEN (NEW.track_inventory = TRUE)
    EXECUTE FUNCTION create_inventory_on_menu_item_create();

-- تفعيل RLS
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

-- policies للمخزون
CREATE POLICY "Restaurant staff can manage inventory" ON inventory
    FOR ALL USING (
        restaurant_id IN (
            SELECT r.id FROM restaurants r
            WHERE r.id IN (
                SELECT sp.restaurant_id FROM staff_permissions sp
                WHERE sp.user_id = auth.uid()
            )
        )
    );

-- دالة للحصول على تقرير المخزون المنخفض
CREATE OR REPLACE FUNCTION get_low_stock_alerts(p_restaurant_id UUID)
RETURNS TABLE (
    menu_item_id UUID,
    item_name TEXT,
    current_stock DECIMAL(10, 2),
    minimum_stock DECIMAL(10, 2),
    unit TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        i.menu_item_id,
        i.item_name,
        i.current_stock,
        i.minimum_stock,
        i.unit
    FROM inventory i
    WHERE i.restaurant_id = p_restaurant_id
      AND i.current_stock <= i.minimum_stock
      AND i.low_stock_alert = TRUE
    ORDER BY i.current_stock ASC;
END;
$$;

-- دالة لتحديث مخزون متعدد العناصر
CREATE OR REPLACE FUNCTION bulk_update_inventory(
    p_restaurant_id UUID,
    p_updates JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    update_item JSONB;
BEGIN
    -- تكرار على كل تحديث
    FOR update_item IN SELECT * FROM jsonb_array_elements(p_updates)
    LOOP
        UPDATE inventory
        SET
            current_stock = (update_item->>'current_stock')::DECIMAL,
            minimum_stock = COALESCE((update_item->>'minimum_stock')::DECIMAL, minimum_stock),
            cost_price = COALESCE((update_item->>'cost_price')::DECIMAL, cost_price),
            supplier_name = COALESCE(update_item->>'supplier_name', supplier_name),
            last_restocked_at = NOW(),
            updated_at = NOW()
        WHERE restaurant_id = p_restaurant_id
          AND menu_item_id = (update_item->>'menu_item_id')::UUID;
    END LOOP;

    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$;

-- رسالة تأكيد
DO $$
BEGIN
    RAISE NOTICE '✓ تم إنشاء نظام المخزون الذكي بنجاح!';
    RAISE NOTICE '✓ سيتم خصم المخزون تلقائياً عند قبول الطلبات!';
    RAISE NOTICE '✓ يمكن تفعيل تتبع المخزون لكل عنصر في القائمة!';
END $$;