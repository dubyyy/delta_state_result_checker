// Mapping of LGA codes to full LGA names
export const LGA_MAPPING: Record<string, string> = {
  "AN": "Aba North",
  "AS": "Aba South",
  "AR": "Arochukwu",
  "BE": "Bende",
  "IK": "Ikwuano",
  "INN": "Isiala Ngwa North",
  "INS": "Isiala Ngwa South",
  "IS": "Isuikwuato",
  "UN": "Umuahia North",
  "UMS": "Umuahia South",
  "OB": "Obi Ngwa",
  "OS": "Osisioma",
  "UG": "Ugwunagbo",
  "UK": "Ukwa East",
  "UKW": "Ukwa West",
  "UMN": "Umu Nneochi",
};

export function getLGAName(code: string): string {
  // If the code is already a full name, return it
  if (code.includes(" ")) {
    return code;
  }
  
  // Otherwise, look up the mapping
  return LGA_MAPPING[code.toUpperCase()] || code;
}
