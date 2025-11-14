import { z } from 'zod';

// 🧠 V4 SMART VALIDATION LOGIC
// (This logic blocks "egvegeg", "xxxxx", etc.)
const isMeaningful = (text) => {
  if (!text) return false;
  const str = text.trim();
  const lower = str.toLowerCase();

  // 1. Basic Length Check
  if (str.length < 3) return false; 

  // 2. Entropy/Diversity Check
  const cleanStr = lower.replace(/[^a-z0-9]/g, '');
  const uniqueChars = new Set(cleanStr).size;
  const totalLength = cleanStr.length;
  const diversityRatio = totalLength > 0 ? uniqueChars / totalLength : 0;

  if (totalLength > 6 && diversityRatio < 0.40) return false;

  // 3. Vowel/Consonant Balance Check
  const vowels = (cleanStr.match(/[aeiouy]/g) || []).length;
  const vowelRatio = totalLength > 0 ? vowels / totalLength : 0;
  
  if (totalLength > 5 && vowelRatio < 0.10 && !/^[0-9]+$/.test(cleanStr)) return false;

  // 4. Split into words
  const words = str.split(/\s+/); 
  
  // 5. Repetitive Words
  const uniqueWords = new Set(words.map(w => w.toLowerCase()));
  if (words.length > 3 && uniqueWords.size === 1) return false;

  let invalidWords = 0;
  let validWords = 0;

  for (const word of words) {
    const w = word.toLowerCase();
    // Pass known valid short words
    if (['hp', 'lg', 'tv', 'pc', 'id', 'no', 'ok', 'mm', 'cm', 'si', 'pi', 'glock'].includes(w)) {
      validWords++;
      continue;
    }
    // Block Single Letter Spam (except a, i, numbers)
    if (w.length === 1) {
      if (!/[ai0-9]/.test(w)) invalidWords++;
      continue;
    }
    if (/^(.{2,})\1{2,}$/.test(w)) return false; 
    if (/[bcdfghjklmnpqrstvwxyz]{5,}/.test(w)) return false;
    const isNumber = /^\d+$/.test(w);
    if (w.length > 3 && !isNumber && !/[aeiouy]/.test(w)) invalidWords++; 
    if (/^[^a-z0-9]+$/.test(w)) return false;
    validWords++;
  }

  if (invalidWords > 0) return false;
  if (validWords === 0) return false;

  return true;
};

// --- 📋 1. LOST REPORT SCHEMA ---
export const lostReportSchema = z.object({
  dateOfLoss: z.string().refine((date) => new Date(date) <= new Date(), "Date cannot be in future"),
  placeOfLoss: z.string().min(5).refine(isMeaningful, "Invalid location name"),
  policeStation: z.string().min(5).refine(isMeaningful, "Invalid station name"),
  dutyAtTimeOfLoss: z.string().min(5).refine(isMeaningful, "Invalid duty description"),
  firNumber: z.string().regex(/^\d+\/\d{4}$/, "Format: Number/Year (e.g. 105/2025)"),
  firDate: z.string(),
  reason: z.string().min(15).refine(isMeaningful, "Please provide a clear description."),
  remedialActionTaken: z.string().min(10).refine(isMeaningful, "Please describe actual actions."),
  priority: z.string(),
  condition: z.string(),
});

// --- 📋 2. RETURN EQUIPMENT SCHEMA ---
export const returnEquipmentSchema = z.object({
  reason: z.string().min(10).refine(isMeaningful, { message: "Please enter a valid reason." }),
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent']),
  condition: z.enum(['Excellent', 'Good', 'Fair', 'Poor']),
});

// --- 📋 3. MAINTENANCE REPORT SCHEMA ---
export const maintenanceReportSchema = z.object({
  reason: z.string().min(15).refine(isMeaningful, { message: "Describe the defect clearly." }),
  priority: z.enum(['Medium', 'High', 'Urgent']),
  condition: z.enum(['Fair', 'Poor', 'Out of Service']),
});

// --- 📋 4. EQUIPMENT POOL SCHEMA ---
export const equipmentPoolSchema = z.object({
  poolName: z.string().min(5).refine(isMeaningful, "Invalid Name."),
  category: z.string().min(1, "Category is required"),
  subCategory: z.string().optional(),
  model: z.string().min(3).refine(isMeaningful, "Invalid Model Name."),
  manufacturer: z.string().optional().refine((val) => !val || isMeaningful(val), "Invalid Manufacturer"),
  totalQuantity: z.coerce.number().min(1).max(10000),
  prefix: z.string().min(2).max(5).regex(/^[A-Z0-9]+$/, "Alphanumeric only"),
  location: z.string().min(5).refine(isMeaningful, "Invalid Location."),
  authorizedDesignations: z.array(z.string()).min(1, "Select at least one designation"),
  purchaseDate: z.string().optional().refine((val) => !val || new Date(val) <= new Date(), "Cannot be future date"),
  totalCost: z.coerce.number().optional(),
  supplier: z.string().optional().refine((val) => !val || isMeaningful(val), "Invalid Supplier"),
  notes: z.string().optional().refine((val) => !val || isMeaningful(val), "Notes must be meaningful."),
});

// --- 📋 5. ADMIN APPROVAL SCHEMA ---
export const adminApprovalSchema = z.object({
  notes: z.string().optional().refine((val) => !val || isMeaningful(val), "Notes must be meaningful."),
  condition: z.enum(['Excellent', 'Good', 'Fair', 'Poor', 'Out of Service']).optional(),
});

// --- 📋 6. ADMIN REJECTION SCHEMA ---
export const adminRejectionSchema = z.object({
  reason: z.string().min(10).refine(isMeaningful, "Provide a valid reason."),
});

// --- 📋 7. REQUEST EQUIPMENT SCHEMA (The missing one) ---
export const requestEquipmentSchema = z.object({
  reason: z.string()
    .min(10, "Reason too short (min 10 chars)")
    .refine(isMeaningful, "Please enter a valid purpose (e.g., 'Patrol Duty')."),
  priority: z.enum(['Low', 'Medium', 'High']),
  expectedDuration: z.string()
    .min(3, "Duration required")
    .refine(isMeaningful, "Invalid duration (e.g., '7 days')."),
});

// --- 📋 8. REPAIR ACTION SCHEMA ---
export const repairActionSchema = z.object({
  description: z.string().min(10).refine(isMeaningful, "Please describe the repair clearly."),
  condition: z.enum(['Excellent', 'Good', 'Fair']),
  cost: z.coerce.number().optional(),
});

// --- 📋 9. WRITE-OFF SCHEMA ---
export const writeOffSchema = z.object({
  notes: z.string().min(15).refine(isMeaningful, "Provide a formal reason for write-off."),
});

// --- 📋 10. RECOVERY SCHEMA ---
export const recoverySchema = z.object({
  notes: z.string().min(10).refine(isMeaningful, "Describe how/where it was found."),
  condition: z.enum(['Excellent', 'Good', 'Fair', 'Poor']),
});