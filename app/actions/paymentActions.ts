'use server';

import { revalidatePath } from 'next/cache';
import { paymentService } from '../services/paymentServices';

/**
 * أكشن تسجيل دفع جديد
 * يتوافق مع useActionState ويستقبل التوكن من الحقول المخفية أو البارامترات
 */
export async function createPaymentAction(prevState: any, formData: FormData) {
  // استخراج التوكن لضمان صلاحية العملية
  const token = formData.get('token') as string;

  try {
    const paymentData = {
      invoiceId: formData.get('invoiceId') as string,
      amount: Number(formData.get('amount')),
      method: formData.get('method') as string,
      reference: formData.get('reference') as string,
      notes: formData.get('notes') as string,
    };

    // تحقق بسيط في جانب السيرفر
    if (!paymentData.invoiceId || paymentData.amount <= 0) {
      return { 
        success: false, 
        message: "Données invalides. Le montant doit être supérieur à 0." 
      };
    }

    // إرسال البيانات للخدمة مع التوكن
    const result = await paymentService.create(paymentData, token);

    if (result.success === false) {
      return { success: false, message: result.message || "Échec de l'enregistrement." };
    }

    // تحديث الكاش لضمان ظهور البيانات الجديدة
    revalidatePath('/dashboard/payment');
    revalidatePath(`/dashboard/invoices/${paymentData.invoiceId}`);

    return { 
      success: true, 
      message: "Paiement enregistré avec succès !" 
    };
  } catch (error: any) {
    console.error("Payment Action Error:", error);
    return { 
      success: false, 
      message: "Erreur serveur lors du traitement du paiement." 
    };
  }
}

/**
 * أكشن تحديث بيانات الدفع (تعديل الملاحظات أو المرجع)
 */
export async function updatePaymentAction(id: string, prevState: any, formData: FormData) {
  const token = formData.get('token') as string;

  try {
    const updateData = {
      reference: formData.get('reference') as string,
      notes: formData.get('notes') as string,
    };

    const result = await paymentService.update(id, updateData, token);

    if (result.success === false) {
      return { success: false, message: result.message };
    }

    revalidatePath('/dashboard/payment');
    
    return { 
      success: true, 
      message: "Paiement mis à jour avec succès !" 
    };
  } catch (error: any) {
    return { 
      success: false, 
      message: "Erreur lors de la mise à jour." 
    };
  }
}

/**
 * أكشن تفعيل أو تعطيل بوابة دفع
 */
export async function toggleGatewayAction(id: string, currentStatus: boolean, token: string) {
  try {
    const result = await paymentService.toggleGateway(id, !currentStatus, token);

    if (result.success) {
      revalidatePath('/dashboard/payment/gateways');
      return { success: true, message: "Statut de la passerelle mis à jour." };
    }

    return { success: false, message: result.message };
  } catch (error) {
    return { success: false, message: "Erreur de connexion." };
  }
}