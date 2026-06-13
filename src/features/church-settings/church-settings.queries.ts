// GROQ query definitions for the Church Settings singleton.
// Activate after configuring src/lib/sanity/client.ts.

export const churchSettingsQuery = `
  *[_type == "churchSettings"][0] {
    churchName,
    address,
    email,
    phone,
    facebook,
    youtube,
    serviceSchedule
  }
` as const;
