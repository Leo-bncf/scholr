/**
 * Roles are an identity, not a health state.
 *
 * These used to be five arbitrary hues — rose, amber, emerald, blue, violet —
 * which is the multi-hue tell, and it also spent the reserved status palette
 * on something that is never good or bad. A directory already has a Role
 * column; you scan it by position, not by colour.
 *
 * So: one neutral chip, and the word does the work. `role-chip` is styled in
 * the token layer.
 */
export const ROLE_CONFIG = {
  school_admin:   { label: 'Admin' },
  ib_coordinator: { label: 'IB Coordinator' },
  teacher:        { label: 'Teacher' },
  student:        { label: 'Student' },
  parent:         { label: 'Parent' },
};
