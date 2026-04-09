/**
 * Centralized human-readable label mappings.
 * Use these everywhere instead of displaying raw snake_case values.
 */

export const SPECIALTY_LABELS = {
  general_medicine:    'General Medicine',
  general_physician:   'General Physician',
  womens_health:       "Women's Health",
  gynecology:          'Gynecology',
  obstetrics:          'Obstetrics',
  cardiology:          'Cardiology',
  dermatology:         'Dermatology',
  pediatrics:          'Pediatrics',
  orthopedics:         'Orthopedics',
  psychiatry:          'Psychiatry',
  neurology:           'Neurology',
  ent:                 'ENT',
  pulmonology:         'Pulmonology',
  gastroenterology:    'Gastroenterology',
  ophthalmology:       'Ophthalmology',
  urology:             'Urology',
  nephrology:          'Nephrology',
  endocrinology:       'Endocrinology',
  oncology:            'Oncology',
  rheumatology:        'Rheumatology',
  physiotherapy:       'Physiotherapy',
  dentistry:           'Dentistry',
  radiology:           'Radiology',
  anesthesiology:      'Anesthesiology',
  surgery:             'Surgery',
  emergency_medicine:  'Emergency Medicine',
  home_care:           'Home Care',
}

export const CONSULTATION_TYPE_LABELS = {
  video:      'Video Consultation',
  in_person:  'In-Person',
  phone:      'Phone Consultation',
}

export const CONSULTATION_STATUS_LABELS = {
  requested:   'Requested',
  confirmed:   'Confirmed',
  scheduled:   'Scheduled',
  ongoing:     'In Progress',
  active:      'In Progress',
  completed:   'Completed',
  cancelled:   'Cancelled',
  no_show:     'No Show',
}

export const PRESCRIPTION_STATUS_LABELS = {
  pending_approval: 'Pending Approval',
  draft:            'Draft',
  modified:         'Modified',
  approved:         'Approved',
  dispensed:        'Dispensed',
  expired:          'Expired',
  cancelled:        'Cancelled',
  rejected:         'Rejected',
}

export const DOCTOR_STATUS_LABELS = {
  available: 'Available',
  busy:      'Busy',
  offline:   'Offline',
  on_leave:  'On Leave',
}

export const RISK_LEVEL_LABELS = {
  EMERGENCY: 'Emergency',
  URGENT:    'Urgent',
  ROUTINE:   'Routine',
  HOME_CARE: 'Home Care',
}

/**
 * Fallback formatter: converts any_snake_case → Any Snake Case
 */
function titleCase(str) {
  return (str || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
    .trim()
}

export function formatSpecialty(val) {
  if (!val) return ''
  return SPECIALTY_LABELS[val.toLowerCase()] || titleCase(val)
}

export function formatConsultationType(val) {
  if (!val) return ''
  return CONSULTATION_TYPE_LABELS[val.toLowerCase()] || titleCase(val)
}

export function formatConsultationStatus(val) {
  if (!val) return ''
  return CONSULTATION_STATUS_LABELS[val.toLowerCase()] || titleCase(val)
}

export function formatPrescriptionStatus(val) {
  if (!val) return ''
  return PRESCRIPTION_STATUS_LABELS[val.toLowerCase()] || titleCase(val)
}

export function formatDoctorStatus(val) {
  if (!val) return ''
  return DOCTOR_STATUS_LABELS[val.toLowerCase()] || titleCase(val)
}

export function formatRiskLevel(val) {
  if (!val) return ''
  return RISK_LEVEL_LABELS[val.toUpperCase()] || titleCase(val)
}
