import { supabase } from "../config/supabase";

/**
 * رفع صورة إلى Supabase Storage
 */
export const uploadMenuImage = async (file: File): Promise<string | null> => {
  // التحقق من نوع الملف
  if (!file.type.startsWith("image/")) {
    throw new Error("يرجى اختيار ملف صورة صحيح");
  }

  // التحقق من حجم الملف (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("حجم الصورة يجب أن يكون أقل من 5MB");
  }

  // إنشاء اسم فريد للملف
  const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
  const filePath = `menu-items/${fileName}`;

  // رفع الصورة
  const { error } = await supabase.storage
    .from("menu-images")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) throw new Error("فشل رفع الصورة: " + error.message);

  // الحصول على الرابط العام
  const { data } = supabase.storage
    .from("menu-images")
    .getPublicUrl(filePath);

  return data.publicUrl;
};

/**
 * حذف صورة من Supabase Storage
 */
export const deleteMenuImage = async (imageUrl: string): Promise<void> => {
  try {
    // استخراج المسار من الرابط
    const url = new URL(imageUrl);
    const pathParts = url.pathname.split("/menu-images/");
    if (pathParts.length < 2) return;
    const filePath = pathParts[1];
    await supabase.storage.from("menu-images").remove([filePath]);
  } catch {
    // تجاهل أخطاء الحذف
  }
};
