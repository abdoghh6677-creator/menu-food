-- =====================================================
-- بيانات تجريبية للمخزون
-- Sample Inventory Data
-- =====================================================

-- إضافة بيانات تجريبية للمخزون
-- تأكد من وجود مطعم واحد على الأقل قبل تشغيل هذا الملف

DO $$
DECLARE
    restaurant_id UUID;
    menu_item_record RECORD;
BEGIN
    -- الحصول على أول مطعم متاح
    SELECT id INTO restaurant_id FROM restaurants LIMIT 1;

    IF restaurant_id IS NULL THEN
        RAISE NOTICE 'لا توجد مطاعم في قاعدة البيانات. أضف مطعماً أولاً.';
        RETURN;
    END IF;

    RAISE NOTICE 'إضافة بيانات المخزون للمطعم: %', restaurant_id;

    -- تفعيل تتبع المخزون لعناصر المنيو الموجودة
    UPDATE menu_items
    SET track_inventory = TRUE,
        stock_quantity = 50
    WHERE restaurant_id = restaurant_id
    AND name IS NOT NULL
    LIMIT 5;

    -- إضافة سجلات المخزون
    FOR menu_item_record IN
        SELECT id, name FROM menu_items
        WHERE restaurant_id = restaurant_id
        AND track_inventory = TRUE
    LOOP
        INSERT INTO inventory (
            restaurant_id,
            menu_item_id,
            item_name,
            current_stock,
            minimum_stock,
            unit,
            cost_price,
            supplier_name,
            auto_deduct,
            low_stock_alert
        ) VALUES (
            restaurant_id,
            menu_item_record.id,
            menu_item_record.name,
            50, -- مخزون أولي
            10, -- حد أدنى
            'قطعة',
            5.00, -- سعر شراء
            'مورد تجريبي',
            TRUE, -- خصم تلقائي
            TRUE  -- تنبيه انخفاض
        ) ON CONFLICT (restaurant_id, menu_item_id) DO NOTHING;
    END LOOP;

    -- إضافة عناصر إضافية للاختبار
    INSERT INTO inventory (
        restaurant_id,
        menu_item_id,
        item_name,
        current_stock,
        minimum_stock,
        unit,
        cost_price,
        supplier_name,
        auto_deduct,
        low_stock_alert
    ) VALUES
    (
        restaurant_id,
        NULL, -- عنصر غير مرتبط بمنيو
        'زيت الطبخ',
        20,
        5,
        'لتر',
        15.00,
        'شركة الزيوت المحدودة',
        TRUE,
        TRUE
    ),
    (
        restaurant_id,
        NULL,
        'أرز بسمتي',
        100,
        20,
        'كيلو',
        8.00,
        'مورد الأرز الذهبي',
        TRUE,
        TRUE
    ),
    (
        restaurant_id,
        NULL,
        'لحم الدجاج',
        30,
        8,
        'كيلو',
        25.00,
        'مزارع الدجاج الطازج',
        TRUE,
        TRUE
    ),
    (
        restaurant_id,
        NULL,
        'خضار متنوع',
        15,
        5,
        'صندوق',
        12.00,
        'سوق الخضار المركزي',
        TRUE,
        TRUE
    ),
    (
        restaurant_id,
        NULL,
        'توابل مختلطة',
        25,
        3,
        'علبة',
        6.00,
        'شركة التوابل الشرقية',
        TRUE,
        TRUE
    )
    ON CONFLICT (restaurant_id, menu_item_id) DO NOTHING;

    RAISE NOTICE 'تم إضافة البيانات التجريبية للمخزون بنجاح!';
    RAISE NOTICE 'يمكنك الآن تجربة نظام المخزون في لوحة التحكم.';

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'حدث خطأ: %', SQLERRM;
END $$;