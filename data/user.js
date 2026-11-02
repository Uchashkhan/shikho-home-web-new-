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
  // Programs a paid student is enrolled in (live: "তোমার প্রোগ্রাম"). More than one shows the
  // profile's program switcher; a free student has none.
  programs: [
    { name: 'ক্লাস ৯ - SSC ’২৮ বিজ্ঞান' },
    { name: 'ক্লাস ১০ - SSC ’২৭ বিজ্ঞান' },
  ],
};
