// Prototype-only stand-in for the signed-in student. The real app supplies this from its
// existing auth/profile data; nothing here is used outside this local prototype.
// Set to null, or open the page with ?guest, to preview the signed-out header and profile.
// Any field may be empty: the header leaves it out and the profile marks it as not provided.
window.SHIKHO_USER = {
  name: 'আরিয়ান',
  className: 'ক্লাস ৯',
  group: 'বিজ্ঞান',
  exam: 'এসএসসি ২০২৮',
  institution: null, // no sample school; the profile shows it as not provided
  enrolled: false, // true = paid student: the homepage shows routine, program and shortcuts
  avatarUrl: null,
};

// A profile made on the sign-up screen (signup.html) replaces the sample student in this browser
try {
  var saved = JSON.parse(localStorage.getItem('shikho-profile') || 'null');
  if (saved && saved.name) {
    window.SHIKHO_USER = Object.assign({}, window.SHIKHO_USER, saved, { exam: saved.exam || null, avatarUrl: null });
  }
} catch (e) { /* storage blocked: keep the sample student */ }
